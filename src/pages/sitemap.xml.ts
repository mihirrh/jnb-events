import type { APIRoute } from 'astro';
import { getServices, getProjects, getAreas, categoriesInUse, slugify } from '../lib/content';

/**
 * Lists every indexable page. `/quote/` (private, noindex) and `/404/` are deliberately excluded.
 * No `<lastmod>`: file modification times are reset on every CI checkout, so they would all show the
 * build date, and search engines ignore a lastmod that does not track real content changes.
 */
export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() || 'https://jnbevents.co.uk/').replace(/\/+$/, '') + '/';

  const services = await getServices();
  const projects = await getProjects();
  const areas = await getAreas();
  const categories = categoriesInUse(projects);

  const urls: string[] = [
    baseUrl,
    `${baseUrl}about/`,
    `${baseUrl}contact/`,
    `${baseUrl}services/`,
    ...services.map((s) => `${baseUrl}services/${s.id}/`),
    `${baseUrl}areas/`,
    ...areas.map((a) => `${baseUrl}areas/${a.id}/`),
    `${baseUrl}gallery/`,
    ...categories.map((cat) => `${baseUrl}gallery/category/${slugify(cat)}/`),
    ...projects.map((p) => `${baseUrl}gallery/${p.id}/`),
    `${baseUrl}privacy/`,
    `${baseUrl}terms/`,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
