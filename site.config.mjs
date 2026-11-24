/**
 * Single source of truth for the live domain.
 *
 * Used by Astro (canonical URLs, sitemap, robots.txt, llms.txt), the IndexNow script and the
 * contact-form Function. Change it here when the final domain is confirmed; no other runtime
 * file should hardcode the hostname.
 */
export const SITE = 'https://jnbevents.co.uk';
