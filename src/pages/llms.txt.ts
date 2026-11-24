import type { APIRoute } from 'astro';
import { SITE } from '../../site.config.mjs';
import { getSettings, getServices } from '../lib/content';

/**
 * Machine-readable summary for AI search and citation tools.
 *
 * Generated at build time from the same content and domain as the rest of the site, so it cannot
 * go stale when the site URL, services or contact details change. Only facts already published on
 * the website are included. The old static `public/llms.txt` has been replaced by this endpoint.
 */
export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(SITE);
  const url = (path = '') => new URL(path, base).toString();
  const settings = await getSettings();
  const services = await getServices();

  const lines: string[] = [
    `# ${settings.siteName}`,
    '',
    `> ${settings.description}`,
    '',
    '## Overview',
    `${settings.siteName} is a ${settings.location.locality}-based wedding and event styling company. ${settings.tagline}. ${settings.serviceAreaNote}`,
    '',
    `- **Website:** ${url()}`,
    `- **Location:** ${settings.location.locality}, ${settings.location.region}, ${settings.location.country === 'GB' ? 'United Kingdom' : settings.location.country}`,
    `- **Service areas:** ${settings.serviceAreas.join(', ')}`,
    `- **Telephone / WhatsApp:** ${settings.contact.whatsappNumber}`,
  ];

  if (settings.contact.email) lines.push(`- **Email:** ${settings.contact.email}`);
  for (const social of settings.social) lines.push(`- **${social.label}:** ${social.url}`);

  lines.push('', '## Services', '');
  for (const service of services) {
    lines.push(`### ${service.data.title}`, `- ${service.data.summary}`, `- URL: ${url(`services/${service.id}/`)}`, '');
  }

  if (settings.social.length) {
    lines.push('## Social profiles', '');
    for (const social of settings.social) lines.push(`- ${social.label}: ${social.url}`);
    lines.push('');
  }

  lines.push(
    '## Key website pages',
    `- Homepage: ${url()}`,
    `- About: ${url('about/')}`,
    `- Services: ${url('services/')}`,
    `- Gallery: ${url('gallery/')}`,
    `- Areas we cover: ${url('areas/')}`,
    `- Contact: ${url('contact/')}`,
    `- Terms: ${url('terms/')}`,
    `- Privacy: ${url('privacy/')}`,
    `- Sitemap: ${url('sitemap.xml')}`,
    '',
  );

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
