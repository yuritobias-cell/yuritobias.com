/* Séries de materiais didáticos, dirigidas pelo manifesto src/data/series.json.
   Cada série carrega seus dados de src/data/materiais/<ano>-<slug>.json
   (+ <ano>-<slug>-provas.json e <ano>-<slug>-formativas.json, opcionais)
   e serve PDFs de public/materiais/<pastaPdf>/.
   Na virada do ano letivo, basta editar o manifesto — ver README, "Virada do ano letivo". */
import fs from 'node:fs';
import path from 'node:path';
import manifesto from '../data/series.json';

export interface Material {
  n: string;
  /** Data de publicação em ISO (AAAA-MM-DD) — ordena "Publicados recentemente". */
  data: string;
  titulo: string;
  descricao: string;
  arquivo?: string;
  video?: { url: string; topicos: string[] };
  apostila?: { ordem: string; data: string };
  /** Slugs de src/data/assuntos.json — dirigem o índice por assunto. */
  assuntos?: string[];
}

export interface Prova {
  n: string;
  /** Data de publicação em ISO (AAAA-MM-DD) — ordena "Publicados recentemente". */
  data: string;
  titulo: string;
  descricao: string;
  arquivo: string;
  assuntos?: string[];
}

export interface Serie {
  slug: string;
  titulo: string;
  tituloLongo: string;
  ano: number;
  arquivada: boolean;
  descricao: string;
  descricaoMeta: string;
  /** Pasta dos PDFs relativa a public/materiais/ (padrão: "<ano>/<slug>"). */
  pastaPdf: string;
  materiais: Material[];
  provas: Prova[];
  formativas: Prova[];
}

type EntradaManifesto = Omit<Serie, 'materiais' | 'provas' | 'formativas' | 'pastaPdf'> & { pastaPdf?: string };

// Todos os JSONs de dados, indexados pelo nome do arquivo (sem caminho nem extensão).
const dadosGlob = import.meta.glob<{ default: unknown }>('../data/materiais/*.json', { eager: true });
const dados = Object.fromEntries(
  Object.entries(dadosGlob).map(([caminho, mod]) => [path.basename(caminho, '.json'), mod.default])
);

/* Sem data, o material some de "Publicados recentemente" sem avisar ninguém —
   é o tipo de erro calado que o build pega cedo, como o PDF ausente. */
function validarDatas(serie: Serie) {
  const ruins = [...serie.materiais, ...serie.provas, ...serie.formativas]
    .filter((m) => !/^\d{4}-\d{2}-\d{2}$/.test(m.data ?? ''));
  if (ruins.length > 0) {
    throw new Error(
      `[materiais/${serie.slug}] campo "data" ausente ou fora do formato ISO (AAAA-MM-DD) em: `
      + ruins.map((m) => `n="${m.n}"`).join(', ')
    );
  }
}

function validarPdfs(serie: Serie) {
  const dir = path.join(process.cwd(), 'public', 'materiais', serie.pastaPdf);
  if (!fs.existsSync(dir)) {
    throw new Error(`[materiais/${serie.slug}] pasta de PDFs ausente: public/materiais/${serie.pastaPdf}/`);
  }
  const emDisco = new Set(fs.readdirSync(dir));
  const faltando = [...serie.materiais, ...serie.provas, ...serie.formativas]
    .map((m) => m.arquivo)
    .filter((a) => a && !emDisco.has(a));
  if (faltando.length > 0) {
    throw new Error(
      `[materiais/${serie.slug}] PDF referenciado no JSON mas ausente em public/materiais/${serie.pastaPdf}/: ${faltando.join(', ')}`
    );
  }
}

function montar(entrada: EntradaManifesto): Serie {
  const base = `${entrada.ano}-${entrada.slug}`;
  const materiais = dados[base] as Material[] | undefined;
  if (!materiais) {
    throw new Error(`[materiais/${entrada.slug}] arquivo de dados ausente: src/data/materiais/${base}.json`);
  }
  const serie: Serie = {
    ...entrada,
    pastaPdf: entrada.pastaPdf ?? `${entrada.ano}/${entrada.slug}`,
    materiais,
    provas: (dados[`${base}-provas`] as Prova[] | undefined) ?? [],
    formativas: (dados[`${base}-formativas`] as Prova[] | undefined) ?? [],
  };
  validarDatas(serie);
  validarPdfs(serie);
  return serie;
}

/** Todas as séries do manifesto, com dados carregados e PDFs validados (o build falha cedo). */
export const series: Serie[] = (manifesto as EntradaManifesto[]).map(montar);

/** Endereço público de uma série — as arquivadas vivem sob /materiais/arquivo/. */
export const urlSerie = (s: Serie) =>
  s.arquivada ? `/materiais/arquivo/${s.ano}/${s.slug}` : `/materiais/${s.slug}`;

export const seriesAtivas = series.filter((s) => !s.arquivada);
export const seriesArquivadas = series.filter((s) => s.arquivada);

/** Um material com a série de onde veio — o que "Publicados recentemente" mostra. */
export interface Recente {
  material: Material | Prova;
  serie: Serie;
  /** "Lista", "Prova somativa" ou "Avaliação formativa". */
  categoria: string;
}

/** Os materiais mais recentes das séries ativas, do mais novo para o mais antigo.
    A URL de destino sai no chamador, que sabe se há versão em HTML (ver listas.ts). */
export function materiaisRecentes(limite = 4): Recente[] {
  const todos: Recente[] = seriesAtivas.flatMap((serie) => [
    ...serie.materiais.map((material) => ({ material, serie, categoria: 'Lista' })),
    ...serie.provas.map((material) => ({ material, serie, categoria: 'Prova somativa' })),
    ...serie.formativas.map((material) => ({ material, serie, categoria: 'Avaliação formativa' })),
  ]);
  // Empate na data (uma leva publicada de uma vez) desempata pela ordem das
  // séries no manifesto, para a lista não trocar de ordem a cada build.
  return todos.sort((a, b) => b.material.data.localeCompare(a.material.data)).slice(0, limite);
}

/** A data do material mais recente de uma série — o "atualizado em" da capa. */
export const ultimaAtualizacao = (s: Serie): string | undefined =>
  [...s.materiais, ...s.provas, ...s.formativas]
    .map((m) => m.data)
    .sort()
    .at(-1);
