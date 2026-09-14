/* O índice da busca, servido como arquivo estático. Gerado no build a partir
   dos manifestos do site (ver src/utils/busca.ts) e buscado sob demanda pela
   página /busca — nenhuma outra página carrega esse peso. */
import type { APIRoute } from 'astro';
import { montarIndice } from '../utils/busca';

export const GET: APIRoute = async () => {
  const itens = await montarIndice();
  return new Response(JSON.stringify(itens), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
