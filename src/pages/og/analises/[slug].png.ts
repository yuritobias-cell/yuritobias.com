import type { APIRoute } from 'astro';
import { analisesPublicadas } from '../../../utils/analises';
import { imagemAnalise } from '../../../utils/og';

// Uma imagem Open Graph por análise publicada, gerada no build a partir do título.
export function getStaticPaths() {
  return analisesPublicadas.map((analise) => ({
    params: { slug: analise.slug },
    props: { titulo: analise.titulo },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(await imagemAnalise(props.titulo), { headers: { 'Content-Type': 'image/png' } });
