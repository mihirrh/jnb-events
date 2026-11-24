// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './site.config.mjs';

// SITE lives in site.config.mjs so Astro, the IndexNow script, llms.txt, robots.txt, the sitemap
// and the contact-form Function all read exactly the same domain. See README, "Site domain".

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    // Sharp is used at build time only; output is plain static files.
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: false } },
  },
  devToolbar: { enabled: false },
});
