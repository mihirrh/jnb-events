// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Keep in sync with the live domain. Used for canonical URLs, sitemap and JSON-LD.
// Change it here (and in src/content/settings/site.yaml -> siteUrl) when the domain is final.
const SITE = 'https://jnbevents.co.uk';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Thank-you / utility pages should not be listed.
      filter: (page) => !page.includes('/404'),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    // Sharp is used at build time only; output is plain static files.
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: false } },
  },
  devToolbar: { enabled: false },
});
