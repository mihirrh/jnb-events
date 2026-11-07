import type { APIRoute, GetStaticPaths } from 'astro';
import { getInstagramPosts } from '../../lib/instagram';

/** Serves each Instagram photo as a static file from this site: /instagram/<id>.webp */
export const getStaticPaths = (async () => {
  const posts = await getInstagramPosts();
  return posts.map((p) => ({ params: { id: p.id }, props: { image: p.image } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(new Uint8Array(props.image as Buffer), { headers: { 'Content-Type': 'image/webp' } });
