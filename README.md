# yuritobias.com

Site pessoal de Yuri Tobias — professor de matemática (Escola SESI Poços de Caldas) e analista de dados educacionais (Secretaria Municipal de Educação de Poços de Caldas).

Reúne materiais didáticos por série, ferramentas interativas para sala de aula, cursos em vídeo e blog.

## Stack

- [Astro 6](https://astro.build) — site estático (+ MDX nos posts com componentes)
- [Tailwind CSS 4](https://tailwindcss.com) — tema central em `src/styles/global.css` (bloco `@theme`)
- [Chart.js](https://www.chartjs.org) e [Observable Plot](https://observablehq.com/plot/) — gráficos (empacotados, sem CDN)
- Fontes auto-hospedadas em `public/fonts/` (variáveis, subset latino; `@font-face` em `src/styles/global.css`) — sem requisições ao Google Fonts
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
├── data/            # JSONs dos materiais por série + provas + curso FET + dados de posts (enem/)
├── content/blog/    # Posts do blog (.md ou .mdx com frontmatter)
├── components/      # Componentes compartilhados (GraficoDistribuicao, ListaPosts, Tags)
├── utils/           # Utilitários (slug de tags, tempo de leitura)
├── layouts/         # Layout base (nav, meta tags, OG, analytics)
├── pages/
│   ├── materiais/[serie].astro   # página única para 9ano / 1em / 2em
│   ├── ferramentas/              # ferramentas interativas (JS próprio por página)
│   ├── cursos/                   # cursos em vídeo (dados em src/data)
│   └── blog/                     # índice + [slug] + tag/[tag] (drafts não são publicados)
└── styles/global.css             # @theme com cores e fontes do site
public/materiais/<serie>/         # PDFs servidos para download
public/og/                        # imagens Open Graph por post (geradas por script)
scripts/og-image.py               # gerador das imagens Open Graph (og.png + public/og/)
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

## Licença do conteúdo

Salvo indicação em contrário, os materiais didáticos (PDFs) e os textos do blog estão sob a licença
[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br) —
podem ser usados e adaptados em sala de aula, com atribuição e sem fins comerciais.
A nota aparece no rodapé de todas as páginas (em `src/layouts/Layout.astro`).

## Como publicar um post

Passo a passo completo em [docs/publicar-post.md](docs/publicar-post.md). Resumo:

1. Crie `src/content/blog/meu-post.md` (ou `.mdx`, se usar componentes) com o frontmatter:

```yaml
---
title: "Título"
description: "Descrição (usada no índice, no preview e no RSS)"
date: 2026-06-11
tags: ["tag"]                 # etiquetas + páginas /blog/tag/<slug> automáticas
series: "Nome da série"       # opcional — agrupa e navega entre as partes
part: 1                       # opcional — ordem dentro da série
draft: false                  # true = não publica
---
```

2. Gere a imagem OG do post e commite: `/tmp/ogvenv/bin/python scripts/og-image.py`
   (preparação do venv/fontes no manual).
3. Confira com `npm run dev` e faça push na `main` — o deploy é automático.
