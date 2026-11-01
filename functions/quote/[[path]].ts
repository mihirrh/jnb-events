/**
 * Password gate for the owner-only quote builder (everything under /quote/).
 *
 * Cloudflare Pages runs this Function before any static file, so the built page is only ever served to
 * someone holding a valid session cookie. The password is NOT in the repository: it is the encrypted
 * secret `QUOTE_PASSWORD` set in the Cloudflare dashboard (or `wrangler pages secret put QUOTE_PASSWORD`),
 * and for local testing in `.dev.vars`, which is git-ignored.
 *
 *  - Fails closed: with no secret configured, nobody gets in.
 *  - Password and signature checks are constant-time.
 *  - Session = "<expiry>.<HMAC-SHA256 signature>" in an HttpOnly, Secure, SameSite=Strict cookie.
 *    The password itself is the signing key, so changing the password signs everyone out.
 *  - Wrong guesses are slowed down; add a Cloudflare rate-limiting rule on /quote/* for real brute-force protection.
 */
import { BRAND_WORDMARK } from '../../src/lib/brand-paths';


interface Env {
  QUOTE_PASSWORD?: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const COOKIE = '__Host-jnb_quote';
const SESSION_SECONDS = 60 * 60 * 12; // 12 hours
const MAX_PASSWORD_LENGTH = 200;
const FAIL_DELAY_MS = 900;

const enc = new TextEncoder();

const b64url = (bytes: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(pad), (c) => c.charCodeAt(0));
};

const hmacKey = (secret: string, usage: 'sign' | 'verify') => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [usage]);

async function sign(secret: string, data: string): Promise<string> {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(secret, 'sign'), enc.encode(data)));
}

/** Constant-time password comparison: compare fixed-length digests, never the raw strings. */
async function passwordMatches(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(input)), crypto.subtle.digest('SHA-256', enc.encode(expected))]);
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ (y[i] ?? 0);
  return diff === 0;
}

async function validSession(cookieHeader: string | null, secret: string): Promise<boolean> {
  const raw = cookieHeader?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return false;
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || !/^\d{1,12}$/.test(exp) || Number(exp) < Math.floor(Date.now() / 1000)) return false;
  try {
    return await crypto.subtle.verify('HMAC', await hmacKey(secret, 'verify'), fromB64url(sig), enc.encode(`jnb-quote:${exp}`));
  } catch {
    return false;
  }
}

const baseHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  // same-origin (not no-referrer): the sign-in form's POST must carry a real Origin for the cross-site check below.
  // Nothing is ever sent to other sites.
  'Referrer-Policy': 'same-origin',
};

function page(title: string, body: string, status: number): Response {
  const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#faf7f2"><title>${title}</title>
<style>
*{box-sizing:border-box}html{background:#faf7f2}
body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;font:17px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f1b16}
main{width:100%;max-width:420px}
.mark{display:block;width:190px;height:auto;color:#9d6c0c}
h1{font:400 30px/1.1 "Bodoni 72",Didot,Georgia,serif;margin:40px 0 8px}
p{margin:0 0 24px;color:#5f574c}
label{display:block;font-size:11px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#5f574c}
input{width:100%;min-height:50px;margin-top:4px;padding:10px 0;font:inherit;color:#1f1b16;background:transparent;border:0;border-bottom:1px solid #a89c86;border-radius:0}
input:focus-visible{outline:0;border-bottom:2px solid #7f6428}
button{margin-top:28px;width:100%;min-height:52px;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#faf7f2;background:#1f1b16;border:0;cursor:pointer}
button:hover{background:#7f6428}button:focus-visible{outline:2px solid #7f6428;outline-offset:3px}
.err{margin:0 0 20px;color:#9a2f1f;font-size:15px}
</style></head><body><main>${body}</main></body></html>`;
  return new Response(html, { status, headers: { ...baseHeaders, 'Content-Type': 'text/html; charset=utf-8' } });
}

const WORDMARK = `<svg class="mark" role="img" aria-label="JNB Events" viewBox="${BRAND_WORDMARK.box.x} ${BRAND_WORDMARK.box.y} ${BRAND_WORDMARK.box.w} ${BRAND_WORDMARK.box.h}" fill="currentColor"><path d="${BRAND_WORDMARK.d}"/></svg>`;

const loginPage = (error?: string) =>
  page(
    'Sign in | JNB Events',
    `${WORDMARK}
<h1>Quote builder</h1><p>This area is private. Please enter the password.</p>
<form method="post" autocomplete="off">
${error ? `<p class="err" role="alert">${error}</p>` : ''}
<label for="pw">Password</label>
<input id="pw" name="password" type="password" autocomplete="current-password" maxlength="${MAX_PASSWORD_LENGTH}" required autofocus>
<button type="submit">Sign in</button></form>`,
    error ? 401 : 200,
  );

export const onRequest = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const secret = env.QUOTE_PASSWORD;
  if (!secret) return page('Unavailable | JNB Events', '<h1>Not available</h1><p>The quote builder has not been set up yet.</p>', 503);

  // Signed in: serve the real page, never cached by shared caches.
  if ((request.method === 'GET' || request.method === 'HEAD') && (await validSession(request.headers.get('Cookie'), secret))) {
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(baseHeaders)) out.headers.set(k, v);
    return out;
  }

  if (request.method === 'POST') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== new URL(request.url).origin) return page('Forbidden | JNB Events', '<h1>Forbidden</h1>', 403);
    let attempt = '';
    try {
      const value = (await request.formData()).get('password');
      attempt = typeof value === 'string' ? value.slice(0, MAX_PASSWORD_LENGTH) : '';
    } catch {
      /* malformed body: treated as a wrong password */
    }
    if (attempt && (await passwordMatches(attempt, secret))) {
      const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
      const token = `${exp}.${await sign(secret, `jnb-quote:${exp}`)}`;
      return new Response(null, {
        status: 303,
        headers: {
          ...baseHeaders,
          Location: new URL(request.url).pathname,
          'Set-Cookie': `${COOKIE}=${token}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS));
    return loginPage('That password is not right. Please try again.');
  }

  return loginPage();
};
