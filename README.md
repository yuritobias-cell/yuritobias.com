# yuritobias.com

Site pessoal de Yuri Tobias — professor de matemática (Escola SESI Poços de Caldas) e analista de dados educacionais (Secretaria Municipal de Educação de Poços de Caldas).

Reúne materiais didáticos por série, ferramentas interativas para sala de aula, análises de dados educacionais, cursos em vídeo e blog.

## Stack

- [Astro 6](https://astro.build) — site estático (+ MDX nos posts com componentes)
- [Tailwind CSS 4](https://tailwindcss.com) — tema central em `src/styles/global.css` (bloco `@theme`)
- [Chart.js](https://www.chartjs.org) e [Observable Plot](https://observablehq.com/plot/) — gráficos (empacotados, sem CDN)
- Fontes auto-hospedadas em `public/fonts/` (variáveis, subset latino; `@font-face` em `src/styles/global.css`) — sem requisições ao Google Fonts
- Service worker (offline) gerado no build: template em `src/sw.js`, precache derivado
  das páginas de `src/pages/ferramentas/` pela integração em `astro.config.mjs`
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
├── assets/og/       # fontes TTF usadas só na geração das imagens Open Graph
├── data/
│   ├── series.json               # manifesto das séries (ativas e arquivadas) — dirige /materiais
│   ├── materiais/<ano>-<slug>.json   # materiais de cada série (+ <ano>-<slug>-provas.json)
│   ├── analises.json             # manifesto das análises — dirige /analises
│   └── ...                       # curso FET + dados de posts (enem/)
├── content/blog/    # Posts do blog (.md ou .mdx com frontmatter)
├── components/      # Componentes compartilhados (GraficoDistribuicao, ListaPosts, Tags)
├── utils/           # Utilitários (slug de tags, tempo de leitura, template das imagens OG)
├── layouts/         # Layout base (nav, meta tags, OG, analytics, rodapé)
├── pages/
│   ├── materiais/[serie].astro   # página única para 9ano / 1em / 2em
│   ├── ferramentas/              # ferramentas interativas (JS próprio por página)
│   ├── analises/                 # índice + capa [slug] de cada análise
│   ├── cursos/                   # cursos em vídeo (dados em src/data)
│   ├── blog/                     # índice + [slug] + tag/[tag] (drafts não são publicados)
│   └── og.png.ts, og/[slug].png.ts, og/analises/[slug].png.ts   # imagens Open Graph geradas no build (satori + resvg)
└── styles/global.css             # @theme com cores e fontes do site
public/materiais/<serie>/         # PDFs servidos para download
public/analises/paineis/          # painéis HTML autocontidos das análises
```

## Como adicionar um material

1. Coloque o PDF na pasta da série em `public/materiais/` (a pasta de cada série
   está no campo `pastaPdf` de `src/data/series.json`).
2. Adicione a entrada no JSON da série em `src/data/materiais/<ano>-<slug>.json`:

```json
{ "n": "14", "titulo": "Título", "descricao": "Descrição curta.", "arquivo": "14-nome.pdf" }
```

- Tarefa de apostila (sem PDF): use `"apostila": { "ordem": "Atividades X, pág. Y", "data": "2026-06-15" }` — **data em formato ISO** (`AAAA-MM-DD`); tarefas futuras ganham destaque automático.
- Lista de revisão com vídeo: use `"video": { "url": "https://youtu.be/...", "topicos": [] }` — com `url` vazia o botão de vídeo não aparece.

As contagens nas páginas de índice são calculadas automaticamente a partir dos JSONs.

## Virada do ano letivo

Tudo é dirigido por `src/data/series.json` — nenhuma página precisa ser editada.

1. **Arquivar o ano encerrado**: mude `"arquivada": true` nas séries do ano. Elas saem
   dos cartões principais e vão para a seção "Arquivo" de `/materiais`, em
   `/materiais/arquivo/<ano>/<slug>`, com aviso de conteúdo encerrado. A URL antiga
   (`/materiais/<slug>`) redireciona sozinha para o arquivo — a menos que uma série
   nova reutilize o slug, caso em que ele passa a apontar para a série nova.
2. **Criar as séries novas**: adicione uma entrada por série no manifesto (com o `ano`
   novo e sem `pastaPdf` — a pasta padrão é `public/materiais/<ano>/<slug>/`) e crie:
   - `src/data/materiais/<ano>-<slug>.json` com os materiais (pode começar `[]`);
   - a pasta `public/materiais/<ano>/<slug>/` para os PDFs;
   - `src/data/materiais/<ano>-<slug>-provas.json` e `<ano>-<slug>-formativas.json` são
     opcionais (sem eles, a série começa sem somativas/formativas anteriores).
3. Confira com `npm run dev` e faça push. O build valida pastas e PDFs e falha cedo se algo faltar.

As séries de 2026 usam `pastaPdf` sem o ano (`"9ano"` etc.) porque os PDFs foram
publicados antes desta estrutura — as URLs dos arquivos não mudaram.

## Como publicar uma análise

Uma análise é um **painel HTML autocontido** (dados, estilos e scripts no próprio arquivo,
sem CDN) apresentado no site por uma capa em `/analises/<slug>` — com contexto, fonte dos
dados e o botão que abre o painel em tela cheia.

1. Coloque o arquivo em `public/analises/paineis/<slug>.html`.
2. Adicione a entrada em `src/data/analises.json` (as análises aparecem da mais recente
   para a mais antiga):

```json
{
  "slug": "ideb-2025",
  "titulo": "IDEB 2025 — Poços de Caldas",
  "descricao": "Resumo curto — vai para o índice e para as meta tags.",
  "data": "2026-08-07",
  "arquivo": "ideb-2025.html",
  "fonte": "INEP — planilhas de divulgação do IDEB 2025",
  "tags": ["IDEB"],
  "secoes": ["Visão geral — principais indicadores"],
  "rascunho": false
}
```

- `data` em formato ISO (`AAAA-MM-DD`); `tags` e `secoes` são opcionais.
- `"rascunho": true` mantém a análise fora do índice e sem capa publicada.
- O build valida a data e a existência do painel, e falha cedo se algo faltar.
- A imagem Open Graph da capa é gerada sozinha no build, a partir do título.

Os painéis trazem `noindex` para que a busca leve à capa (que tem a navegação do site)
e não ao painel sem contexto. Se uma análise já tiver sido divulgada em outra URL,
deixe no caminho antigo um arquivo curto com `meta refresh` para o novo — foi o que
`public/analises/dashboard-ideb-2025-8268fddf8eb566e6.html` faz.

### Tema dos painéis

O painel é um arquivo solto em `public/`, fora do Tailwind, mas segue a mesma paleta e
o mesmo layout do site. Copie o bloco `:root` de um painel existente
(`public/analises/paineis/simave-2025.html`) — ele repete em tokens o que
`src/styles/global.css` define para o resto das páginas:

| Token | Valor | Papel (equivalente no site) |
| :--- | :--- | :--- |
| `--plane` | `#F8F6F1` | fundo da página (`--bg`) |
| `--surface` | `#FFFFFF` | fundo dos cartões (os cartões do site são brancos) |
| `--ink` / `--ink-2` / `--muted` | `#1C1917` / `#57534E` / `#78716C` | texto (`--ink`, `--muted`) |
| `--border` | `#E2DDD6` | réguas de 1px (`--rule`) |
| `--accent` / `--on-accent` | `#1B4F4F` / `#F8F6F1` | destaque e o texto sobre ele (`--accent`, `--bg`) |
| `--rail` / `--rail-ink` | `#1B4F4F` / `#F8F6F1` | barra lateral — o accent do site como superfície escura |
| `--font-body` / `--font-display` | IBM Plex Sans / Playfair Display | as fontes de `public/fonts/`, servidas pelo próprio site |

Regras de layout que vêm do site: cartões **chapados** (borda de 1px em `--border`,
`border-radius: 4px`, sem sombra), pílulas em `99px`, Playfair só nos títulos grandes
(marca da barra lateral, título da seção, nome da escola na ficha) — números e tabelas
ficam em IBM Plex Sans, com `font-variant-numeric: tabular-nums`.

Cores de dados (as mesmas nos dois painéis, para que uma rede tenha sempre a mesma cor):

| Série | Claro | Escuro |
| :--- | :--- | :--- |
| Poços / rede municipal | `#1B4F4F` teal | `#6FB0A6` |
| Rede estadual | `#B4531F` terracota | `#DB7A45` |
| Minas Gerais / referência | `#8A8179` cinza quente | `#9A9188` |
| Regional / rede pública | `#6E5B9B` roxo | `#A395D8` |
| Sul de Minas / fluxo | `#6E8B3D` oliva | `#9CBF63` |

Os padrões de desempenho vão de quente (inadequado) a teal (adequado) —
`--baixo` `#A6402F`, `--inter` `#D9A441`, `--recom` `#4E7C7C`, `--avanc` `#1B4F4F` —
e cada faixa tem um `--on-<faixa>` com a cor do rótulo, porque texto branco não se lê
sobre o âmbar. **Não descreva cor por escrito** ("azul = rede municipal") nas legendas:
use um `.lg` com as amostras, que acompanha qualquer mudança de paleta.

O tema claro é o padrão, como no resto do site; o seletor Auto/Claro/Escuro continua
disponível no canto da barra superior e o IDEB guarda a escolha em `localStorage`.

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

2. Confira com `npm run dev` e faça push na `main` — o deploy é automático.
   A imagem Open Graph do post é gerada sozinha no build, a partir do título.
