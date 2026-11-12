/**
 * Contact form handler: POST /api/enquiry
 *
 * Receives the enquiry form from /contact/ and emails it to the owner through the Cloudflare Email
 * Sending REST API. Sending to a verified Email Routing destination address (the Gmail inbox) is free.
 *
 * Secrets (Cloudflare Pages -> Settings -> Variables and Secrets, or `wrangler pages secret put`;
 * for local testing put them in `.dev.vars`, which is git-ignored):
 *  - CF_ACCOUNT_ID:     the Cloudflare account ID
 *  - EMAIL_API_TOKEN:   API token with the "Email Sending: Edit" permission
 *
 * Fails closed: without both values it returns 503 and the form tells the visitor to use WhatsApp.
 */

interface Env {
  CF_ACCOUNT_ID?: string;
  EMAIL_API_TOKEN?: string;
}

const FROM = { address: 'contact@jnbevents.co.uk', name: 'JNB Events Website' };
const TO = 'event.jnb@gmail.com';

const LIMITS = { name: 120, phone: 40, email: 254, date: 20, service: 120, venue: 200, message: 5000 } as const;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Read a form field as trimmed text, capped to its limit. */
const field = (d: FormData, key: keyof typeof LIMITS): string => {
  const v = d.get(key);
  return typeof v === 'string' ? v.trim().slice(0, LIMITS[key]) : '';
};

/** Single line only: strips control characters so a value can never break out of a header or subject. */
const oneLine = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();

const EMAIL_RE = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]+$/;

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  // Same-site posts only (the form is on this origin).
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ ok: false }, 403);

  if (!env.CF_ACCOUNT_ID || !env.EMAIL_API_TOKEN) {
    console.error('enquiry: CF_ACCOUNT_ID or EMAIL_API_TOKEN is not configured');
    return json({ ok: false }, 503);
  }

  let d: FormData;
  try {
    d = await request.formData();
  } catch {
    return json({ ok: false }, 400);
  }

  // Honeypot filled in: pretend success, send nothing.
  if (typeof d.get('website') === 'string' && (d.get('website') as string).trim()) return json({ ok: true });

  const name = oneLine(field(d, 'name'));
  const phone = oneLine(field(d, 'phone'));
  const email = oneLine(field(d, 'email'));
  const date = oneLine(field(d, 'date'));
  const service = oneLine(field(d, 'service'));
  const venue = oneLine(field(d, 'venue'));
  const message = field(d, 'message');

  // Email is required so the owner can always reply.
  if (!name || !message || !EMAIL_RE.test(email)) return json({ ok: false }, 400);

  const rows: [string, string][] = [
    ['Name', name],
    ['Phone / WhatsApp', phone],
    ['Email', email],
    ['Event date', date],
    ['Interested in', service],
    ['Venue / area', venue],
  ];
  const filled = rows.filter(([, v]) => v);

  const text = [...filled.map(([k, v]) => `${k}: ${v}`), '', message].join('\n');
  const html =
    `<table cellpadding="6" style="font-family:sans-serif;font-size:15px">` +
    filled.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('') +
    `</table><p style="font-family:sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/email/sending/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.EMAIL_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: TO,
        reply_to: email,
        subject: `Website enquiry from ${name}`,
        text,
        html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Log status and Cloudflare's error codes only; never the visitor's details or the token.
      const detail = (await res.json().catch(() => null)) as { errors?: { code?: number; message?: string }[] } | null;
      console.error('enquiry: email send failed', res.status, JSON.stringify(detail?.errors ?? []));
      return json({ ok: false }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('enquiry: email send threw', err instanceof Error ? err.name : 'unknown');
    return json({ ok: false }, 502);
  }
};

/** Anything other than POST is not a valid way to use this endpoint. */
export const onRequest = async (): Promise<Response> => json({ ok: false }, 405);
