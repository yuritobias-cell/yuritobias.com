/* Análises de dados educacionais, dirigidas pelo manifesto src/data/analises.json.
   Cada análise é um painel HTML autocontido em public/analises/paineis/<arquivo>,
   apresentado no site por uma capa em /analises/<slug> (contexto, fonte e link).
   Ver README, "Como publicar uma análise". */
import fs from 'node:fs';
import path from 'node:path';
import manifesto from '../data/analises.json';

export interface Analise {
  slug: string;
  titulo: string;
  /** Resumo curto — usado no índice, nas meta tags e no RSS social. */
  descricao: string;
  /** Data de publicação em ISO (AAAA-MM-DD). */
  data: string;
  /** Nome do arquivo do painel dentro de public/analises/paineis/. */
  arquivo: string;
  /** Origem dos dados, mostrada na capa. */
  fonte: string;
  tags: string[];
  /** Seções do painel, listadas na capa. */
  secoes: string[];
  /** true = fica fora do índice e sem capa publicada. */
  rascunho: boolean;
}

type EntradaManifesto = Omit<Analise, 'tags' | 'secoes' | 'rascunho'> &
  Partial<Pick<Analise, 'tags' | 'secoes' | 'rascunho'>>;

/** Pasta dos painéis, relativa a public/ (e também o prefixo da URL). */
export const PASTA_PAINEIS = 'analises/paineis';

function montar(entrada: EntradaManifesto): Analise {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.data)) {
    throw new Error(`[analises/${entrada.slug}] data deve estar no formato ISO (AAAA-MM-DD): "${entrada.data}"`);
  }
  const painel = path.join(process.cwd(), 'public', PASTA_PAINEIS, entrada.arquivo);
  if (!fs.existsSync(painel)) {
    throw new Error(`[analises/${entrada.slug}] painel ausente: public/${PASTA_PAINEIS}/${entrada.arquivo}`);
  }
  return {
    ...entrada,
    tags: entrada.tags ?? [],
    secoes: entrada.secoes ?? [],
    rascunho: entrada.rascunho ?? false,
  };
}

/** Todas as análises do manifesto, da mais recente para a mais antiga (o build falha cedo se algo faltar). */
export const analises: Analise[] = (manifesto as EntradaManifesto[])
  .map(montar)
  .sort((a, b) => b.data.localeCompare(a.data));

const slugs = analises.map((a) => a.slug);
const repetidos = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (repetidos.length > 0) {
  throw new Error(`[analises] slugs repetidos no manifesto: ${[...new Set(repetidos)].join(', ')}`);
}

export const analisesPublicadas = analises.filter((a) => !a.rascunho);

/** URL do painel autocontido de uma análise. */
export const urlPainel = (analise: Analise) => `/${PASTA_PAINEIS}/${analise.arquivo}`;

/** Data de publicação por extenso (a data do manifesto é sempre UTC). */
export const dataPorExtenso = (analise: Analise) =>
  new Date(`${analise.data}T00:00:00Z`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
