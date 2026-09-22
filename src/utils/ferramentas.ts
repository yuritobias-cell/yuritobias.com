/* Catálogo das ferramentas interativas, dirigido por src/data/ferramentas.json.
   Cada ferramenta é uma página autocontida em src/pages/ferramentas/<slug>.astro;
   o manifesto só diz como ela se apresenta no índice e na busca.
   Ver README, "Ferramentas". */
import fs from 'node:fs';
import path from 'node:path';
import manifesto from '../data/ferramentas.json';
import { AUTOR, DE_GRACA, LICENCA, NIVEL, SITE, SITE_REF, sobreAssuntos } from './schema';

export interface Categoria {
  /** Âncora da seção e valor do filtro em /ferramentas?tipo=suporte. */
  id: string;
  titulo: string;
  descricao: string;
  /** O que a ferramenta é, para os dados estruturados (`learningResourceType`). */
  tipoRecurso: string;
  /** Como se usa, para os dados estruturados (`educationalUse`). */
  usoEducacional: string;
}

export interface Ferramenta {
  slug: string;
  titulo: string;
  /** Área do conhecimento, mostrada no cartão e usada na busca. */
  assunto: string;
  /** `id` de uma das categorias. */
  tipo: string;
  descricao: string;
  /** Slugs de src/data/assuntos.json — dirigem o índice por assunto. */
  assuntos?: string[];
  /** Aparece na vitrine da home. Ver `destaques`. */
  destaque?: boolean;
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

/* A home mostra três ferramentas; quais são é decisão de catálogo, não de
   página — marque `"destaque": true` no manifesto para trocar a vitrine. */
export const destaques: Ferramenta[] = ferramentas.filter((f) => f.destaque);

if (destaques.length === 0) {
  throw new Error(
    '[ferramentas] nenhuma ferramenta com "destaque": true — a vitrine da home ficaria vazia'
  );
}

/* Dados estruturados de uma ferramenta.

   O tipo é duplo de propósito: `WebApplication` diz que aquilo roda no navegador
   e é de graça; `LearningResource` diz para que serve e a quem. O que cada
   categoria é (gerador ou simulação) sai do manifesto, de modo que categoria
   nova obrigue a decidir isso uma vez, em vez de espalhar o vocabulário aqui.

   Não há resultado rico do Google para nenhum dos dois tipos: isto é sobre a
   página ser lida corretamente por máquina, não sobre estrela na busca. */
export function esquemaDaFerramenta(slug: string) {
  const f = ferramentas.find((x) => x.slug === slug);
  if (!f) return undefined;
  const categoria = categorias.find((c) => c.id === f.tipo)!;
  const url = `${SITE}/ferramentas/${f.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'LearningResource'],
    '@id': `${url}#ferramenta`,
    name: f.titulo,
    description: f.descricao,
    url,
    inLanguage: 'pt-BR',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Qualquer um com navegador web',
    browserRequirements: 'Requer JavaScript',
    learningResourceType: categoria.tipoRecurso,
    educationalUse: categoria.usoEducacional,
    educationalLevel: NIVEL,
    about: sobreAssuntos(f.assuntos),
    license: LICENCA,
    author: AUTOR,
    publisher: AUTOR,
    isPartOf: SITE_REF,
    ...DE_GRACA,
  };
}
