/* Índice da busca do site, montado no build a partir das mesmas fontes que
   alimentam as páginas — manifestos das séries, das análises e das ferramentas,
   mais a coleção do blog. Nada é catalogado à mão: material novo no JSON entra
   na busca sozinho.

   O índice é servido como um JSON estático em /busca-index.json e filtrado no
   navegador (ver src/pages/busca.astro). São ~150 entradas de título e
   descrição: não vale carregar um motor de busca para isso, nem mandar o que
   o visitante digita para lugar nenhum. */
import { getCollection } from 'astro:content';
import { series, urlSerie } from './materiais';
import { analisesPublicadas } from './analises';
import { ferramentas } from './ferramentas';
import { assuntos } from './assuntos';
import { mapaDeListas, listaDe, urlLista } from './listas';
import cursoFet from '../data/curso-fet.json';

export interface ItemBusca {
  /** Título. */
  t: string;
  /** Descrição curta. */
  d: string;
  /** URL de destino. */
  u: string;
  /** Rótulo do grupo nos resultados. */
  s: string;
  /** Contexto — a série, o assunto, a data. */
  c?: string;
  /** Texto que só serve para casar a busca (tags, tópicos, sinônimos). */
  x?: string;
  /** PDF para baixar direto, quando houver. */
  p?: string;
  /** Peso extra na pontuação — a página que reúne um assunto vem antes de um
      item solto sobre ele. */
  b?: number;
}

/** Nome de cada assunto, para acrescentar ao que a busca compara. */
const nomeAssunto = new Map(assuntos.map((a) => [a.slug, a.nome]));

/** Os assuntos de um item viram texto buscável: procurar "álgebra" acha
    "Produtos Notáveis", que não traz a palavra em lugar nenhum. */
const textoDeAssuntos = (slugs?: string[]) =>
  (slugs ?? []).map((s) => nomeAssunto.get(s) ?? s).join(' ');

export async function montarIndice(): Promise<ItemBusca[]> {
  const itens: ItemBusca[] = [];

  // --- páginas fixas --------------------------------------------------------
  itens.push(
    { t: 'Sobre', d: 'Professor de matemática e analista de dados educacionais em Poços de Caldas.', u: '/', s: 'Página', x: 'yuri tobias contato currículo lattes linkedin' },
    { t: 'Materiais', d: 'Listas, revisões e avaliações por série, em PDF.', u: '/materiais', s: 'Página' },
    { t: 'Ferramentas', d: 'Geradores de material para imprimir e simuladores para usar em sala.', u: '/ferramentas', s: 'Página' },
    { t: 'Análises', d: 'Painéis interativos com dados educacionais.', u: '/analises', s: 'Página' },
    { t: 'Assuntos', d: 'Todo o site organizado por assunto, em vez de por formato.', u: '/assuntos', s: 'Página' },
    { t: 'Cursos', d: 'Cursos em vídeo.', u: '/cursos', s: 'Página' },
    { t: 'Blog', d: 'Textos sobre ensino de matemática e dados educacionais.', u: '/blog', s: 'Página' },
    { t: 'Para professores', d: 'Como usar as ferramentas e os materiais deste site na sua escola, e o que a licença permite.', u: '/para-professores', s: 'Página', x: 'licença creative commons cc by-nc-sa citar adaptar imprimir offline' }
  );

  // --- assuntos -------------------------------------------------------------
  for (const a of assuntos) {
    itens.push({ t: a.nome, d: a.descricao, u: `/assuntos/${a.slug}`, s: 'Assunto', b: 1.4 });
  }

  // --- ferramentas ----------------------------------------------------------
  for (const f of ferramentas) {
    itens.push({
      t: f.titulo, d: f.descricao, u: `/ferramentas/${f.slug}`, s: 'Ferramenta', c: f.assunto,
      x: textoDeAssuntos(f.assuntos) || undefined,
    });
  }

  // --- materiais, provas e formativas de cada série -------------------------
  // Quem tem versão em HTML é levado a ela: é a página da lista em si, e não a
  // capa da série com o PDF para baixar.
  const listas = await mapaDeListas();

  for (const serie of series) {
    const base = urlSerie(serie);
    const arquivo = serie.arquivada ? ` · ${serie.ano}` : '';
    const pdf = (nome?: string) => (nome ? `/materiais/${serie.pastaPdf}/${nome}` : undefined);

    itens.push({
      t: serie.tituloLongo,
      d: serie.descricao,
      u: base,
      s: 'Série',
      c: `${serie.ano}`,
      x: 'materiais listas provas',
    });

    const grupos: [string, typeof serie.materiais | typeof serie.provas][] = [
      ['Para Casa', serie.materiais],
      ['Somativas anteriores', serie.provas],
      ['Formativas anteriores', serie.formativas],
    ];

    for (const [grupo, lista] of grupos) {
      for (const m of lista) {
        const apostila = 'apostila' in m && m.apostila ? ` ${m.apostila.ordem}` : '';
        const topicos = 'video' in m && m.video ? ` ${m.video.topicos.join(' ')}` : '';
        const html = listaDe(listas, serie, m);
        itens.push({
          t: m.titulo,
          d: m.descricao,
          u: html ? urlLista(html) : base,
          s: 'Material',
          c: `${serie.titulo} · ${grupo}${arquivo}`,
          x: [apostila, topicos, textoDeAssuntos(m.assuntos)].join(' ').trim() || undefined,
          p: pdf(m.arquivo),
        });
      }
    }
  }

  // --- análises -------------------------------------------------------------
  for (const a of analisesPublicadas) {
    itens.push({
      t: a.titulo,
      d: a.descricao,
      u: `/analises/${a.slug}`,
      s: 'Análise',
      c: a.data.slice(0, 4),
      x: [...a.tags, ...a.secoes, a.fonte, textoDeAssuntos(a.assuntos)].join(' '),
    });
  }

  // --- cursos ---------------------------------------------------------------
  itens.push({
    t: cursoFet.titulo,
    d: cursoFet.descricao,
    u: '/cursos/fet',
    s: 'Curso',
    c: `${cursoFet.aulas.length} vídeos`,
    x: cursoFet.aulas.map((a) => a.titulo).join(' '),
  });

  // --- blog -----------------------------------------------------------------
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  for (const p of posts) {
    itens.push({
      t: p.data.title,
      d: p.data.description,
      u: `/blog/${p.id}`,
      s: 'Blog',
      c: String(p.data.date.getUTCFullYear()),
      x: [...(p.data.tags ?? []), p.data.series ?? '', textoDeAssuntos(p.data.assuntos)]
        .join(' ').trim() || undefined,
    });
  }

  return itens;
}
