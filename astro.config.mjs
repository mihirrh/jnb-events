// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Keep in sync with the live domain. Used for canonical URLs, sitemap and JSON-LD.
// Change it here when the domain is final - it is the only place the domain is defined.
const SITE = 'https://jnbevents.co.uk';

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      // Thank-you / utility pages and the unlisted quote tool should not be listed.
      filter: (page) => !page.includes('/404') && !page.includes('/quote/'),
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
