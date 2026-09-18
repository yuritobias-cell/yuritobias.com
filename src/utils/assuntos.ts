/* Índice por assunto — a vista transversal do site.

   O resto do site é organizado por formato: material, ferramenta, análise,
   post. Quem chega procurando "lei dos cossenos" quer o contrário — o conjunto
   do que existe sobre aquilo, venha de onde vier. É o que esta camada monta.

   O que um assunto É fica em src/data/assuntos.json; a que assunto cada coisa
   PERTENCE fica junto do próprio conteúdo, no campo `assuntos`. Assim, material
   novo entra no índice na mesma linha em que é cadastrado.
   Ver README, "Índice por assunto". */
import { getCollection } from 'astro:content';
import manifesto from '../data/assuntos.json';
import { series, urlSerie, type Serie } from './materiais';
import { analisesPublicadas } from './analises';
import { ferramentas } from './ferramentas';
import cursoFet from '../data/curso-fet.json';

export interface Assunto {
  slug: string;
  nome: string;
  descricao: string;
}

export interface ItemAssunto {
  titulo: string;
  descricao: string;
  url: string;
  /** Onde aquilo vive — a série e o grupo, a área da ferramenta, o ano. */
  contexto?: string;
  /** PDF para baixar direto, quando houver. */
  pdf?: string;
}

export interface GrupoAssunto {
  titulo: string;
  itens: ItemAssunto[];
}

export interface AssuntoCompleto extends Assunto {
  grupos: GrupoAssunto[];
  total: number;
  /** Séries com material do assunto — o atalho para a capa da série. */
  series: { titulo: string; url: string }[];
}

export const assuntos: Assunto[] = manifesto;

const slugsValidos = new Set(assuntos.map((a) => a.slug));

/* Toda referência a assunto é conferida contra o manifesto, dizendo onde está o
   erro de digitação — senão o conteúdo simplesmente sumiria do índice, calado. */
function conferir(lista: string[] | undefined, onde: string): string[] {
  for (const s of lista ?? []) {
    if (!slugsValidos.has(s)) {
      throw new Error(
        `[assuntos] ${onde}: assunto "${s}" não existe em src/data/assuntos.json `
        + `(disponíveis: ${[...slugsValidos].join(', ')})`
      );
    }
  }
  return lista ?? [];
}

/** Assuntos que uma série cobre, na ordem do manifesto. */
export function assuntosDaSerie(serie: Serie): Assunto[] {
  const marcados = new Set(
    [...serie.materiais, ...serie.provas, ...serie.formativas].flatMap((m) => m.assuntos ?? [])
  );
  return assuntos.filter((a) => marcados.has(a.slug));
}

export async function montarAssuntos(): Promise<AssuntoCompleto[]> {
  // Um balde por assunto, preenchido na ordem em que o site apresenta as coisas.
  const materiais = new Map<string, ItemAssunto[]>();
  const ferrs = new Map<string, ItemAssunto[]>();
  const anals = new Map<string, ItemAssunto[]>();
  const posts = new Map<string, ItemAssunto[]>();
  const cursos = new Map<string, ItemAssunto[]>();
  const seriesDe = new Map<string, Map<string, { titulo: string; url: string }>>();

  const juntar = (balde: Map<string, ItemAssunto[]>, slugs: string[], item: ItemAssunto) => {
    for (const s of slugs) {
      if (!balde.has(s)) balde.set(s, []);
      balde.get(s)!.push(item);
    }
  };

  // --- materiais, provas e formativas ---------------------------------------
  for (const serie of series) {
    const base = urlSerie(serie);
    const sufixo = serie.arquivada ? ` · ${serie.ano}` : '';
    const grupos = [
      ['Para Casa', serie.materiais],
      ['Somativa', serie.provas],
      ['Formativa', serie.formativas],
    ] as const;

    for (const [grupo, lista] of grupos) {
      for (const m of lista) {
        const slugs = conferir(m.assuntos, `${serie.slug} · ${m.titulo}`);
        if (!slugs.length) continue;
        juntar(materiais, slugs, {
          titulo: m.titulo,
          descricao: m.descricao,
          url: base,
          contexto: `${serie.titulo} · ${grupo}${sufixo}`,
          pdf: m.arquivo ? `/materiais/${serie.pastaPdf}/${m.arquivo}` : undefined,
        });
        for (const s of slugs) {
          if (!seriesDe.has(s)) seriesDe.set(s, new Map());
          seriesDe.get(s)!.set(serie.slug, { titulo: serie.titulo, url: base });
        }
      }
    }
  }

  // --- ferramentas ----------------------------------------------------------
  for (const f of ferramentas) {
    juntar(ferrs, conferir(f.assuntos, `ferramenta ${f.slug}`), {
      titulo: f.titulo,
      descricao: f.descricao,
      url: `/ferramentas/${f.slug}`,
      contexto: f.assunto,
    });
  }

  // --- análises -------------------------------------------------------------
  for (const a of analisesPublicadas) {
    juntar(anals, conferir(a.assuntos, `análise ${a.slug}`), {
      titulo: a.titulo,
      descricao: a.descricao,
      url: `/analises/${a.slug}`,
      contexto: a.data.slice(0, 4),
    });
  }

  // --- cursos ---------------------------------------------------------------
  juntar(cursos, conferir(cursoFet.assuntos, 'curso FET'), {
    titulo: cursoFet.titulo,
    descricao: cursoFet.descricao,
    url: '/cursos/fet',
    contexto: `${cursoFet.aulas.length} vídeos`,
  });

  // --- blog -----------------------------------------------------------------
  const publicados = (await getCollection('blog')).filter((p) => !p.data.draft);
  publicados.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  for (const p of publicados) {
    juntar(posts, conferir(p.data.assuntos, `post ${p.id}`), {
      titulo: p.data.title,
      descricao: p.data.description,
      url: `/blog/${p.id}`,
      contexto: String(p.data.date.getUTCFullYear()),
    });
  }

  const completos = assuntos.map((a) => {
    const grupos: GrupoAssunto[] = [
      { titulo: 'Materiais', itens: materiais.get(a.slug) ?? [] },
      { titulo: 'Ferramentas', itens: ferrs.get(a.slug) ?? [] },
      { titulo: 'Análises', itens: anals.get(a.slug) ?? [] },
      { titulo: 'Blog', itens: posts.get(a.slug) ?? [] },
      { titulo: 'Cursos', itens: cursos.get(a.slug) ?? [] },
    ].filter((g) => g.itens.length > 0);

    return {
      ...a,
      grupos,
      total: grupos.reduce((t, g) => t + g.itens.length, 0),
      series: [...(seriesDe.get(a.slug)?.values() ?? [])],
    };
  });

  /* Assunto sem nada é página vazia publicada e prometida no índice: ou entra
     conteúdo, ou sai do manifesto. */
  const vazios = completos.filter((a) => a.total === 0);
  if (vazios.length > 0) {
    throw new Error(
      `[assuntos] sem nenhum conteúdo: ${vazios.map((a) => a.slug).join(', ')} — `
      + 'marque algum conteúdo com esse assunto ou tire-o de src/data/assuntos.json'
    );
  }

  return completos;
}
