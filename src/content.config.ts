import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    // Slugs de src/data/assuntos.json — dirigem o índice por assunto.
    assuntos: z.array(z.string()).optional(),
    // Postagens em série: mesmo nome em `series` agrupa; `part` ordena as partes.
    series: z.string().optional(),
    part: z.number().int().positive().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

/* Listas de exercícios em HTML — a versão navegável do PDF. Cada arquivo
   aponta para a entrada que já existe no JSON da série (`serie` + `material`),
   e é essa ligação que faz o botão "Ler online" aparecer na capa da série.
   Ver README, "Listas em HTML". */
const listas = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/listas' }),
  schema: z.object({
    titulo: z.string(),
    description: z.string().optional(),
    /** Resumo curto — meta tags, índice e busca. */
    descricao: z.string(),
    /** Slug da série em src/data/series.json. */
    serie: z.string(),
    /** Campo `n` da entrada correspondente no JSON da série. */
    material: z.string(),
    /** A linha de instruções da folha, quando houver. */
    instrucoes: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, listas };