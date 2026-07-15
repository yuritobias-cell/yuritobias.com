/* Séries de materiais didáticos, dirigidas pelo manifesto src/data/series.json.
   Cada série carrega seus dados de src/data/materiais/<ano>-<slug>.json
   (+ <ano>-<slug>-provas.json, opcional) e serve PDFs de public/materiais/<pastaPdf>/.
   Na virada do ano letivo, basta editar o manifesto — ver README, "Virada do ano letivo". */
import fs from 'node:fs';
import path from 'node:path';
import manifesto from '../data/series.json';

export interface Material {
  n: string;
  titulo: string;
  descricao: string;
  arquivo?: string;
  video?: { url: string; topicos: string[] };
  apostila?: { ordem: string; data: string };
}

export interface Prova {
  n: string;
  titulo: string;
  descricao: string;
  arquivo: string;
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
}

type EntradaManifesto = Omit<Serie, 'materiais' | 'provas' | 'pastaPdf'> & { pastaPdf?: string };

// Todos os JSONs de dados, indexados pelo nome do arquivo (sem caminho nem extensão).
const dadosGlob = import.meta.glob<{ default: unknown }>('../data/materiais/*.json', { eager: true });
const dados = Object.fromEntries(
  Object.entries(dadosGlob).map(([caminho, mod]) => [path.basename(caminho, '.json'), mod.default])
);

function validarPdfs(serie: Serie) {
  const dir = path.join(process.cwd(), 'public', 'materiais', serie.pastaPdf);
  if (!fs.existsSync(dir)) {
    throw new Error(`[materiais/${serie.slug}] pasta de PDFs ausente: public/materiais/${serie.pastaPdf}/`);
  }
  const emDisco = new Set(fs.readdirSync(dir));
  const faltando = [...serie.materiais, ...serie.provas]
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
  };
  validarPdfs(serie);
  return serie;
}

/** Todas as séries do manifesto, com dados carregados e PDFs validados (o build falha cedo). */
export const series: Serie[] = (manifesto as EntradaManifesto[]).map(montar);

export const seriesAtivas = series.filter((s) => !s.arquivada);
export const seriesArquivadas = series.filter((s) => s.arquivada);
