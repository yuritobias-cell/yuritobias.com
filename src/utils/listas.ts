/* Listas de exercícios em HTML — a versão navegável dos PDFs.

   O PDF continua sendo a folha que vai para a impressora; a lista em HTML é a
   mesma coisa em página de verdade: abre no celular sem baixar nada, é indexada
   pelo buscador e dá para ligar direto numa questão. As duas convivem — o
   arquivo MDX aponta para a entrada que já existe no JSON da série, e a capa da
   série passa a oferecer os dois botões.

   A série de uma lista é o par `serie` + `ano`: o slug se repete de um ano letivo
   para o outro ("9ano" de 2026 e de 2027). A lista mora sob o endereço da série —
   /materiais/<slug>/<id> enquanto ela está ativa, /materiais/arquivo/<ano>/<slug>/<id>
   depois de arquivada.
   Ver README, "Listas em HTML" e "Virada do ano letivo". */
import { getCollection, type CollectionEntry } from 'astro:content';
import { series, urlSerie, type Material, type Serie } from './materiais';

export type Lista = CollectionEntry<'listas'>;

/** Chave da ligação com o JSON da série. */
const chave = (slug: string, ano: number, material: string) => `${ano}/${slug}/${material}`;

const buscarSerie = (lista: Lista) =>
  series.find((s) => s.slug === lista.data.serie && s.ano === lista.data.ano);

/** As listas publicadas, com a série e o material conferidos contra os manifestos. */
export async function listasPublicadas(): Promise<Lista[]> {
  const todas = (await getCollection('listas')).filter((l) => !l.data.draft);

  for (const l of todas) {
    const serie = buscarSerie(l);
    if (!serie) {
      throw new Error(
        `[listas/${l.id}] série "${l.data.serie}" de ${l.data.ano} não existe em src/data/series.json`
      );
    }
    const alvo = [...serie.materiais, ...serie.provas, ...serie.formativas]
      .find((m) => m.n === l.data.material);
    if (!alvo) {
      throw new Error(
        `[listas/${l.id}] a série ${serie.slug} de ${serie.ano} não tem material n="${l.data.material}" — `
        + 'o campo `material` do frontmatter tem de casar com o `n` do JSON da série'
      );
    }
  }

  const repetidos = todas
    .map((l) => chave(l.data.serie, l.data.ano, l.data.material))
    .filter((k, i, a) => a.indexOf(k) !== i);
  if (repetidos.length > 0) {
    throw new Error(`[listas] mais de uma lista para o mesmo material: ${[...new Set(repetidos)].join(', ')}`);
  }

  /* O endereço é a série + o nome do arquivo, sem o ano: duas listas de anos
     diferentes com o mesmo nome dividiriam a URL enquanto as duas séries
     estivessem ativas. Na virada isso não acontece — a do ano velho vai para
     o arquivo, que leva o ano no caminho. */
  const enderecos = todas
    .map((l) => urlLista(l))
    .filter((u, i, a) => a.indexOf(u) !== i);
  if (enderecos.length > 0) {
    throw new Error(`[listas] mais de uma lista no mesmo endereço: ${[...new Set(enderecos)].join(', ')}`);
  }

  return todas;
}

/** Mapa material → lista, para a capa da série oferecer o "Ler online". */
export async function mapaDeListas(): Promise<Map<string, Lista>> {
  const todas = await listasPublicadas();
  return new Map(todas.map((l) => [chave(l.data.serie, l.data.ano, l.data.material), l]));
}

/** A lista em HTML de um material, se existir. */
export const listaDe = (mapa: Map<string, Lista>, serie: Serie, m: Material | { n: string }) =>
  mapa.get(chave(serie.slug, serie.ano, m.n));

/** A série a que uma lista pertence (já validada por listasPublicadas). */
export const serieDaLista = (lista: Lista): Serie => buscarSerie(lista)!;

/** Endereço de uma lista em HTML: o da série + o nome do arquivo. */
export const urlLista = (lista: Lista) => `${urlSerie(serieDaLista(lista))}/${lista.id}`;

/** O material correspondente no JSON da série — traz o PDF e a descrição. */
export function materialDaLista(lista: Lista) {
  const serie = serieDaLista(lista);
  const m = [...serie.materiais, ...serie.provas, ...serie.formativas]
    .find((x) => x.n === lista.data.material)!;
  return {
    material: m,
    serie,
    urlSerie: urlSerie(serie),
    pdf: m.arquivo ? `/materiais/${serie.pastaPdf}/${m.arquivo}` : undefined,
  };
}

/** Listas de séries arquivadas cujo endereço antigo (/materiais/<slug>/<id>)
    ficou livre — ele vira um desvio para o arquivo, para não quebrar o link
    (e o #q3) que foi mandado para a turma. Se mais de um ano deixou lista no
    mesmo endereço, vale a do ano mais recente. */
export async function listasDesviadas(): Promise<{ slug: string; id: string; destino: string }[]> {
  const todas = await listasPublicadas();
  const ocupados = new Set(
    todas.filter((l) => !serieDaLista(l).arquivada).map((l) => `${l.data.serie}/${l.id}`)
  );
  const desvios = new Map<string, { slug: string; id: string; destino: string; ano: number }>();
  for (const l of todas) {
    const serie = serieDaLista(l);
    const antigo = `${serie.slug}/${l.id}`;
    if (!serie.arquivada || ocupados.has(antigo)) continue;
    const atual = desvios.get(antigo);
    if (!atual || atual.ano < serie.ano) {
      desvios.set(antigo, { slug: serie.slug, id: l.id, destino: urlLista(l), ano: serie.ano });
    }
  }
  return [...desvios.values()];
}
