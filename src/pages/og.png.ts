import type { APIRoute } from 'astro';
import { imagemSite } from '../utils/og';

// Imagem Open Graph padrão do site, gerada no build (substitui o antigo public/og.png).
export const GET: APIRoute = async () =>
  new Response(await imagemSite(), { headers: { 'Content-Type': 'image/png' } });
