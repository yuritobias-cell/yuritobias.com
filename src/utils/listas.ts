/* Listas de exercícios em HTML — a versão navegável dos PDFs.

   O PDF continua sendo a folha que vai para a impressora; a lista em HTML é a
   mesma coisa em página de verdade: abre no celular sem baixar nada, é indexada
   pelo buscador e dá para ligar direto numa questão. As duas convivem — o
   arquivo MDX aponta para a entrada que já existe no JSON da série, e a capa da
   série passa a oferecer os dois botões.
   Ver README, "Listas em HTML". */
import { getCollection, type CollectionEntry } from 'astro:content';
import { series, urlSerie, type Material, type Serie } from './materiais';

export type Lista = CollectionEntry<'listas'>;

/** Endereço de uma lista em HTML: /materiais/<serie>/<slug>. */
export const urlLista = (lista: Lista) => `/materiais/${lista.data.serie}/${lista.id}`;

/** Chave da ligação com o JSON da série. */
const chave = (serie: string, material: string) => `${serie}/${material}`;

/** As listas publicadas, com a série e o material conferidos contra os manifestos. */
export async function listasPublicadas(): Promise<Lista[]> {
  const todas = (await getCollection('listas')).filter((l) => !l.data.draft);

  for (const l of todas) {
    const serie = series.find((s) => s.slug === l.data.serie);
    if (!serie) {
      throw new Error(
        `[listas/${l.id}] série "${l.data.serie}" não existe em src/data/series.json`
      );
    }
    const alvo = [...serie.materiais, ...serie.provas, ...serie.formativas]
      .find((m) => m.n === l.data.material);
    if (!alvo) {
      throw new Error(
        `[listas/${l.id}] a série ${serie.slug} não tem material n="${l.data.material}" — `
        + 'o campo `material` do frontmatter tem de casar com o `n` do JSON da série'
      );
    }
  }

  const repetidos = todas
    .map((l) => chave(l.data.serie, l.data.material))
    .filter((k, i, a) => a.indexOf(k) !== i);
  if (repetidos.length > 0) {
    throw new Error(`[listas] mais de uma lista para o mesmo material: ${[...new Set(repetidos)].join(', ')}`);
  }

  return todas;
}

/** Mapa material → lista, para a capa da série oferecer o "Ler online". */
export async function mapaDeListas(): Promise<Map<string, Lista>> {
  const todas = await listasPublicadas();
  return new Map(todas.map((l) => [chave(l.data.serie, l.data.material), l]));
}

/** A lista em HTML de um material, se existir. */
export const listaDe = (mapa: Map<string, Lista>, serie: Serie, m: Material | { n: string }) =>
  mapa.get(chave(serie.slug, m.n));

/** A série a que uma lista pertence (já validada por listasPublicadas). */
export const serieDaLista = (lista: Lista): Serie =>
  series.find((s) => s.slug === lista.data.serie)!;

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
