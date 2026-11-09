import type { APIRoute } from 'astro';
import { statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getServices, getProjects, categoriesInUse, slugify } from '../lib/content';

interface SitemapEntry {
  url: string;
  lastmod?: string;
}

function getFileLastMod(relPath: string): string | undefined {
  const fullPath = join(process.cwd(), relPath);
  if (existsSync(fullPath)) {
    const stats = statSync(fullPath);
    return stats.mtime.toISOString().split('T')[0];
  }
  return undefined;
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site?.toString() || 'https://jnbevents.co.uk/').replace(/\/+$/, '') + '/';

  const services = await getServices();
  const projects = await getProjects();
  const categories = categoriesInUse(projects);

  const entries: SitemapEntry[] = [];

  // 1. Core pages
  entries.push({
    url: baseUrl,
    lastmod: getFileLastMod('src/content/pages/home.yaml') || getFileLastMod('src/pages/index.astro'),
  });

  entries.push({
    url: `${baseUrl}about/`,
    lastmod: getFileLastMod('src/content/pages/about.md') || getFileLastMod('src/pages/about.astro'),
  });

  entries.push({
    url: `${baseUrl}contact/`,
    lastmod: getFileLastMod('src/content/pages/contact.md') || getFileLastMod('src/pages/contact.astro'),
  });

  entries.push({
    url: `${baseUrl}services/`,
    lastmod: getFileLastMod('src/content/pages/services.md') || getFileLastMod('src/pages/services/index.astro'),
  });

  // 2. Individual Service Pages
  for (const s of services) {
    entries.push({
      url: `${baseUrl}services/${s.id}/`,
      lastmod: getFileLastMod(`src/content/services/${s.id}.md`),
    });
  }

  // 3. Gallery Index
  entries.push({
    url: `${baseUrl}gallery/`,
    lastmod: getFileLastMod('src/content/pages/gallery.md') || getFileLastMod('src/pages/gallery/index.astro'),
  });

  // 4. Gallery Category Archives
  for (const cat of categories) {
    const catSlug = slugify(cat);
    const catProjects = projects.filter((p) => p.data.category === cat);
    let latestMod: string | undefined;

    for (const p of catProjects) {
      const pMod = getFileLastMod(`src/content/projects/${p.id}.md`);
      if (pMod && (!latestMod || pMod > latestMod)) {
        latestMod = pMod;
      }
    }

    entries.push({
      url: `${baseUrl}gallery/category/${catSlug}/`,
      lastmod: latestMod || getFileLastMod('src/pages/gallery/category/[category].astro'),
    });
  }

  // 5. Individual Gallery Projects
  for (const p of projects) {
    entries.push({
      url: `${baseUrl}gallery/${p.id}/`,
      lastmod: getFileLastMod(`src/content/projects/${p.id}.md`),
    });
  }

  // 6. Legal Pages
  entries.push({
    url: `${baseUrl}privacy/`,
    lastmod: getFileLastMod('src/content/pages/privacy.md') || getFileLastMod('src/pages/privacy.astro'),
  });

  entries.push({
    url: `${baseUrl}terms/`,
    lastmod: getFileLastMod('src/content/pages/terms.md') || getFileLastMod('src/pages/terms.astro'),
  });

  // Generate XML using official W3C sitemap schema
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.url}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
