/**
 * Latest Instagram posts, fetched at BUILD time (the site is fully static).
 *
 *  - Needs INSTAGRAM_ACCESS_TOKEN (a long-lived "Instagram API with Instagram Login" token) in the build environment.
 *    It is a secret: set it in the Cloudflare Pages dashboard, or in a git-ignored `.env` for local builds.
 *  - Never throws: with no token, or if Instagram is unreachable, it returns [] and the section simply does not render.
 *  - Photos are downloaded and re-encoded at build time and served from this site (/instagram/<id>.webp), because
 *    Instagram's own image links expire after a few days. The token is only ever used here, never sent to visitors.
 *  - Instagram only changes what the site shows when the site is rebuilt (see .github/workflows/daily-rebuild.yml).
 */
import sharp from 'sharp';

export interface InstagramPost {
  id: string;
  permalink: string;
  alt: string;
  isVideo: boolean;
  image: Buffer;
}

interface ApiMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
}

const API = 'https://graph.instagram.com';
const LIMIT = 12;
const TIMEOUT_MS = 15_000;
/** Only ever download images from Instagram's own CDN hosts. */
const CDN_HOST = /(^|\.)(cdninstagram\.com|fbcdn\.net)$/;
export const IMAGE_WIDTH = 720;
export const IMAGE_HEIGHT = 900; // 4:5 portrait, Instagram's native feed shape

const token = (): string | undefined => process.env.INSTAGRAM_ACCESS_TOKEN || import.meta.env.INSTAGRAM_ACCESS_TOKEN || undefined;

const call = (path: string, accessToken: string) =>
  fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(TIMEOUT_MS) });

const altText = (caption?: string): string => {
  const clean = (caption ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Photo from JNB Events on Instagram';
  return clean.length > 110 ? `${clean.slice(0, 107)}...` : clean;
};

async function load(): Promise<InstagramPost[]> {
  const accessToken = token();
  if (!accessToken) return [];

  try {
    // Extends the token's 60-day life each build. Failure here is not fatal.
    await call('/refresh_access_token?grant_type=ig_refresh_token', accessToken).catch(() => undefined);

    const res = await call(`/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${LIMIT}`, accessToken);
    if (!res.ok) {
      console.warn(`[instagram] Feed request failed (HTTP ${res.status}). The token may have expired. Section hidden.`);
      return [];
    }
    const { data } = (await res.json()) as { data?: ApiMedia[] };

    const posts = await Promise.all(
      (data ?? []).map(async (m): Promise<InstagramPost | null> => {
        try {
          const src = m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url;
          if (!src || !/^https:\/\/instagram\.com\//.test(m.permalink.replace('www.', ''))) return null;
          const url = new URL(src);
          if (url.protocol !== 'https:' || !CDN_HOST.test(url.hostname)) return null;
          const img = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
          if (!img.ok) return null;
          const image = await sharp(Buffer.from(await img.arrayBuffer()))
            .resize(IMAGE_WIDTH, IMAGE_HEIGHT, { fit: 'cover' })
            .webp({ quality: 78 })
            .toBuffer();
          return { id: m.id, permalink: m.permalink, alt: altText(m.caption), isVideo: m.media_type === 'VIDEO', image };
        } catch {
          return null;
        }
      }),
    );
    return posts.filter((p): p is InstagramPost => p !== null);
  } catch {
    console.warn('[instagram] Could not reach Instagram. Section hidden.');
    return [];
  }
}

let cached: Promise<InstagramPost[]> | undefined;
/** One fetch per build, shared by the pages and the image endpoint. */
export const getInstagramPosts = (): Promise<InstagramPost[]> => (cached ??= load());
