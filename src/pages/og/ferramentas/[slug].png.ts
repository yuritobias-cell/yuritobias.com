import type { APIRoute } from 'astro';
import { ferramentas } from '../../../utils/ferramentas';
import { imagemFerramenta } from '../../../utils/og';

/* Uma imagem Open Graph por ferramenta, gerada no build a partir do manifesto —
   a mesma lista que já dirige o índice e a busca. Ferramenta nova ganha a imagem
   sem nenhum cadastro; o Layout deduz o endereço dela pelo próprio caminho da
   página (ver src/layouts/Layout.astro). */
export function getStaticPaths() {
  return ferramentas.map((f) => ({
    params: { slug: f.slug },
    props: { titulo: f.titulo, assunto: f.assunto },
  }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(await imagemFerramenta(props.titulo, props.assunto), {
    headers: { 'Content-Type': 'image/png' },
  });
