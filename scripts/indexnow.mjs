/**
 * IndexNow submission script for JNB Events (https://jnbevents.co.uk).
 * Submits all sitemap URLs to IndexNow (Bing, DuckDuckGo, Yandex, Seznam, etc.)
 *
 * Usage:
 *   node scripts/indexnow.mjs [--dry-run]
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const SITEMAP_PATH = join(DIST, 'sitemap.xml');
const HOST = 'jnbevents.co.uk';
const KEY = '3b9f4e2d8c1a7e506f349a8b1c2d3e4f';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';

const dryRun = process.argv.includes('--dry-run');

if (!existsSync(SITEMAP_PATH)) {
  console.error('dist/sitemap.xml not found. Please run "npm run build" first.');
  process.exit(1);
}

const xml = readFileSync(SITEMAP_PATH, 'utf8');
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (!urls.length) {
  console.error('No URLs found in sitemap.xml.');
  process.exit(1);
}

console.log(`Discovered ${urls.length} indexable URLs from sitemap.xml`);

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: KEY_LOCATION,
  urlList: urls,
};

if (dryRun) {
  console.log('[DRY RUN] IndexNow payload:', JSON.stringify(payload, null, 2));
  console.log(`[DRY RUN] Would submit ${urls.length} URLs to ${ENDPOINT}`);
  process.exit(0);
}

console.log(`Submitting ${urls.length} URLs to IndexNow API (${ENDPOINT})...`);

try {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'User-Agent': 'JNB-Events-IndexNow/1.0',
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`✓ IndexNow submission successful (HTTP ${res.status}). URLs submitted for expedited indexing.`);
  } else {
    const text = await res.text();
    console.warn(`IndexNow returned HTTP ${res.status}: ${text}`);
    if (res.status === 403) {
      console.warn('Note: HTTP 403 usually indicates that key validation file is not yet deployed on live domain.');
    }
  }
} catch (err) {
  console.error('Failed to submit to IndexNow:', err.message);
}
