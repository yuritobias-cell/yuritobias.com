import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { imagemPost } from '../../utils/og';

// Uma imagem Open Graph por post publicado, gerada no build a partir do título.
export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter((post) => !post.data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { titulo: post.data.title },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(await imagemPost(props.titulo), { headers: { 'Content-Type': 'image/png' } });
