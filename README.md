# yuritobias.com

Site pessoal de Yuri Tobias — professor de matemática (Escola SESI Poços de Caldas) e analista de dados educacionais (Secretaria Municipal de Educação de Poços de Caldas).

Reúne materiais didáticos por série, ferramentas interativas para sala de aula, cursos em vídeo e blog.

## Stack

- [Astro 6](https://astro.build) — site estático
- [Tailwind CSS 4](https://tailwindcss.com) — tema central em `src/styles/global.css` (bloco `@theme`)
- [Chart.js](https://www.chartjs.org) — gráficos (empacotado, sem CDN)
- Deploy automático no GitHub Pages via Actions (push na `main`)
- Analytics: GoatCounter (pageviews + eventos de download de PDF)

## Comandos

| Comando           | Ação                                       |
| :---------------- | :----------------------------------------- |
| `npm install`     | Instala as dependências                     |
| `npm run dev`     | Servidor local em `localhost:4321`          |
| `npm run build`   | Gera o site estático em `./dist/`           |
| `npm run preview` | Pré-visualiza o build localmente            |

## Estrutura

```text
src/
├── data/            # JSONs dos materiais por série + provas + curso FET
├── content/blog/    # Posts do blog (Markdown com frontmatter)
├── layouts/         # Layout base (nav, meta tags, OG, analytics)
├── pages/
│   ├── materiais/[serie].astro   # página única para 9ano / 1em / 2em
│   ├── ferramentas/              # ferramentas interativas (JS próprio por página)
│   ├── cursos/                   # cursos em vídeo (dados em src/data)
│   └── blog/                     # índice + [slug] (drafts não são publicados)
└── styles/global.css             # @theme com cores e fontes do site
public/materiais/<serie>/         # PDFs servidos para download
scripts/og-image.py               # gerador da imagem Open Graph (public/og.png)
```

## Como adicionar um material

1. Coloque o PDF em `public/materiais/<serie>/`.
2. Adicione a entrada no JSON da série em `src/data/<serie>.json`:

```json
{ "n": "14", "titulo": "Título", "descricao": "Descrição curta.", "arquivo": "14-nome.pdf" }
```

- Tarefa de apostila (sem PDF): use `"apostila": { "ordem": "Atividades X, pág. Y", "data": "2026-06-15" }` — **data em formato ISO** (`AAAA-MM-DD`); tarefas futuras ganham destaque automático.
- Lista de revisão com vídeo: use `"video": { "url": "https://youtu.be/...", "topicos": [] }` — com `url` vazia o botão de vídeo não aparece.

As contagens nas páginas de índice são calculadas automaticamente a partir dos JSONs.

## Como publicar um post

Crie `src/content/blog/meu-post.md` com o frontmatter:

```yaml
---
title: "Título"
description: "Descrição (usada no preview e no RSS)"
date: 2026-06-11
tags: ["tag"]
draft: false   # true = não publica
---
```
