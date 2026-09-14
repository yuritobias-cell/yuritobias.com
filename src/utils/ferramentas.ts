/* Catálogo das ferramentas interativas, dirigido por src/data/ferramentas.json.
   Cada ferramenta é uma página autocontida em src/pages/ferramentas/<slug>.astro;
   o manifesto só diz como ela se apresenta no índice e na busca.
   Ver README, "Ferramentas". */
import fs from 'node:fs';
import path from 'node:path';
import manifesto from '../data/ferramentas.json';

export interface Categoria {
  /** Âncora da seção e valor do filtro em /ferramentas?tipo=suporte. */
  id: string;
  titulo: string;
  descricao: string;
}

export interface Ferramenta {
  slug: string;
  titulo: string;
  /** Área do conhecimento, mostrada no cartão e usada na busca. */
  assunto: string;
  /** `id` de uma das categorias. */
  tipo: string;
  descricao: string;
}

export const categorias: Categoria[] = manifesto.categorias;
export const ferramentas: Ferramenta[] = manifesto.ferramentas;

/* O manifesto e as páginas têm de contar a mesma história: ferramenta listada
   sem página some num 404, e página fora do manifesto não aparece em lugar
   nenhum — nem no índice, nem na busca. O build falha cedo nos dois casos. */
const dirPaginas = path.join(process.cwd(), 'src', 'pages', 'ferramentas');
const emDisco = new Set(
  fs.readdirSync(dirPaginas)
    .filter((f) => f.endsWith('.astro') && f !== 'index.astro')
    .map((f) => path.basename(f, '.astro'))
);

const idsCategorias = new Set(categorias.map((c) => c.id));
const semPagina = ferramentas.filter((f) => !emDisco.has(f.slug));
const semEntrada = [...emDisco].filter((slug) => !ferramentas.some((f) => f.slug === slug));
const semCategoria = ferramentas.filter((f) => !idsCategorias.has(f.tipo));

if (semPagina.length > 0) {
  throw new Error(
    `[ferramentas] no manifesto mas sem página em src/pages/ferramentas/: ${semPagina.map((f) => f.slug).join(', ')}`
  );
}
if (semEntrada.length > 0) {
  throw new Error(
    `[ferramentas] página existe mas falta a entrada em src/data/ferramentas.json: ${semEntrada.join(', ')}`
  );
}
if (semCategoria.length > 0) {
  throw new Error(
    `[ferramentas] tipo não corresponde a nenhuma categoria: ${semCategoria.map((f) => `${f.slug} (${f.tipo})`).join(', ')}`
  );
}

/** As ferramentas de uma categoria, na ordem do manifesto. */
export const porTipo = (id: string): Ferramenta[] => ferramentas.filter((f) => f.tipo === id);
