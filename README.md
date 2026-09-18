# yuritobias.com

Site pessoal de Yuri Tobias — professor de matemática (Escola SESI Poços de Caldas) e analista de dados educacionais (Secretaria Municipal de Educação de Poços de Caldas).

Reúne materiais didáticos por série, ferramentas interativas para sala de aula, análises de dados educacionais, cursos em vídeo e blog — com busca em todo o conteúdo.

## Stack

- [Astro 6](https://astro.build) — site estático (+ MDX nos posts com componentes)
- [Tailwind CSS 4](https://tailwindcss.com) — tema central em `src/styles/global.css` (bloco `@theme`)
- [Chart.js](https://www.chartjs.org) e [Observable Plot](https://observablehq.com/plot/) — gráficos (empacotados, sem CDN)
- Fontes auto-hospedadas em `public/fonts/` (variáveis, subset latino; `@font-face` em `src/styles/global.css`) — sem requisições ao Google Fonts
- Busca própria: índice estático gerado no build (`/busca-index.json`) e filtrado no
  navegador — sem motor de busca de terceiros e sem mandar a consulta para lugar nenhum
- Service worker (offline) gerado no build: template em `src/sw.js`, precache derivado
  das páginas de `src/pages/ferramentas/` pela integração em `astro.config.mjs`
  (mais a busca e o índice dela)
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
│   ├── ferramentas.json          # manifesto das ferramentas — dirige /ferramentas e a busca
│   ├── assuntos.json             # manifesto dos assuntos — dirige /assuntos
│   └── ...                       # curso FET + dados de posts (enem/)
├── content/blog/    # Posts do blog (.md ou .mdx com frontmatter)
├── components/      # Componentes compartilhados (GraficoDistribuicao, ListaPosts, Tags)
├── utils/           # Utilitários do build em .ts (slug de tags, tempo de leitura, imagens OG)
│   ├── busca.ts                  # monta o índice da busca a partir dos manifestos
│   ├── assuntos.ts               # cruza materiais, ferramentas e análises por assunto
│   ├── matematica.js             # núcleo das ferramentas geradoras: sorteio com semente, racionais exatos e tipografia
│   ├── intervalos.js             # conjunto solução em ℝ + reta numérica (inequações)
│   ├── estado.js                 # a lista gerada na URL: configuração + semente, permalink e QR
│   ├── qr.js                     # o QR do permalink, desenhado em SVG para a folha
│   └── folha.js                  # folha A4, gabarito, versões A–H e chips dos controles
├── layouts/         # Layout base (nav, meta tags, OG, analytics, rodapé)
├── pages/
│   ├── materiais/[serie].astro   # página única para 9ano / 1em / 2em
│   ├── ferramentas/              # ferramentas interativas (uma página autocontida cada)
│   ├── analises/                 # índice + capa [slug] de cada análise
│   ├── cursos/                   # cursos em vídeo (dados em src/data)
│   ├── blog/                     # índice + [slug] + tag/[tag] (drafts não são publicados)
│   ├── assuntos/                 # índice por assunto: índice + [slug] de cada assunto
│   ├── busca.astro               # busca do site + busca-index.json.ts (o índice)
│   ├── para-professores.astro    # convite de uso, licença em português claro e como citar
│   └── og.png.ts, og/[slug].png.ts, og/analises/[slug].png.ts   # imagens Open Graph geradas no build (satori + resvg)
└── styles/
    ├── global.css                # @theme com cores e fontes do site
    └── ferramenta-folha.css      # chrome comum das ferramentas que imprimem folha (.ff-root)
public/materiais/<serie>/         # PDFs servidos para download
public/analises/paineis/          # painéis HTML autocontidos das análises
```

## Ferramentas

Cada ferramenta é uma página autocontida em `src/pages/ferramentas/`, com o próprio HTML,
CSS e JS — e uma entrada em `src/data/ferramentas.json` (`tipo` define a seção: `suporte`
ou `simulacoes`; `assunto` é a etiqueta do cartão). Essa entrada alimenta o índice e a
busca ao mesmo tempo, e o build **falha** se a página existir sem entrada no manifesto,
ou o contrário. O service worker precacheia as ferramentas sozinho, a partir dos arquivos
da pasta; nada a registrar à mão.

```json
{ "slug": "gerador-funcoes", "titulo": "Gerador de Funções", "assunto": "Álgebra",
  "tipo": "suporte", "descricao": "Descrição curta — vai para o cartão e para a busca.",
  "assuntos": ["funcoes", "algebra"] }
```

`assunto` (singular) é a etiqueta do cartão; `assuntos` (plural) é a que entra no
índice por assunto — ver a seção abaixo.

As **geradoras de lista** (`gerador-equacoes`, `gerador-sistemas`, `gerador-progressoes`,
`gerador-fatoracao`) são a exceção à regra do
"JS próprio por página": elas compartilham quatro arquivos, porque um bug no renderizador de
fração não deve precisar de correção em dois lugares.

| Arquivo | O que traz |
| :--- | :--- |
| `src/utils/matematica.js` | Sorteios, racionais exatos (`rac`, `rSoma`, …), radicais simplificados e a tipografia da matemática em HTML — fração empilhada e radical com barra, **sem KaTeX nem MathJax** |
| `src/utils/intervalos.js` | Conjunto solução como lista de intervalos, notação por compreensão e a reta numérica em SVG |
| `src/utils/folha.js` | Cabeçalho, folha do aluno, gabarito, versões A–H, distribuição das questões entre os tipos e o comportamento dos chips |
| `src/utils/estado.js` | A lista gerada na URL: configuração, semente, permalink e o QR da folha (ver "A lista tem endereço") |
| `src/styles/ferramenta-folha.css` | Todo o visual comum, escopado em `.ff-root` — barra de controles, folha A4 e as regras de `@media print` |

São `.js`, e não `.ts`, de propósito: rodam no navegador, importados pelos `<script>` das
páginas. Os `.ts` da mesma pasta rodam no build e são checados pelo `astro check`.

O princípio das duas geradoras é o mesmo: **sorteie a resposta e monte a questão em volta
dela**. É o que garante que o filtro de natureza da solução valha sempre — e não "quase
sempre", como aconteceria sorteando coeficientes e torcendo. As exceções estão documentadas
na seção "teoria" de cada página.

### A lista tem endereço

Uma lista gerada é a configuração dos controles **mais a semente do sorteio**, e as duas
cabem na querystring — então a mesma URL devolve sempre a mesma lista, questão por questão.
Serve para reimprimir a prova do ano passado, mandar a lista para um colega e imprimir o
QR que leva o aluno àquela folha.

O mecanismo está todo em `src/utils/estado.js` e é **genérico**: os campos saem do próprio
`PADRAO` da página e do objeto de chips, deduzindo o tipo de cada um (chip múltiplo, chip
único, número, texto, caixa). Ferramenta nova não precisa listar campo nenhum aqui — basta
seguir o mesmo formato das quatro geradoras:

| Onde | O que entra |
| :--- | :--- |
| `import` | `semear, novaSemente` de `matematica.js`; `aplicaUrl, guardaUrl, extrasDaFolha, copiaLink` de `estado.js` |
| marcação | a caixa `id="qr"` e o botão `id="link"` |
| `PADRAO` | `qr: false` |
| `gerar()` | `semear(semente)` como primeira linha |
| `pintar()` | `Object.assign(cfg, extrasDaFolha(PADRAO, ctl, semente))` e `guardaUrl(PADRAO, ctl, semente)` |
| fim do script | `semente = aplicaUrl(PADRAO, ctl) \|\| novaSemente();` antes do `gerar()` inicial |

Detalhes que importam:

- **Só o que difere do padrão entra na URL.** O link fica curto e legível, e mudar um
  padrão no código não quebra links antigos que não mencionavam aquele campo.
- **Mudar um controle mantém a semente**; só "Gerar outra lista" sorteia outra. Assim,
  subir a quantidade de 12 para 20 acrescenta 8 questões em vez de trocar a lista inteira.
- **A semente é do sorteio, não do conteúdo**: mexer em `matematica.js` ou nas famílias de
  questão de uma ferramenta muda o que uma semente antiga produz. Links são estáveis entre
  visitas, não entre versões do gerador.
- **O QR aponta para a própria lista**, já com `temGab=0` e `v=<versão da folha>` — o aluno
  cai na folha dele, sem gabarito, e `estado.js` mostra o aviso com a saída para ver todas
  as versões. É conveniência, não tranca: quem editar a URL vê o gabarito.
- O que entra na folha é escapado por `esc()`; o que vem da URL é tratado como entrada de
  fora (valor de chip inexistente é descartado, texto é cortado no `maxlength` do campo).

## Busca

`/busca` filtra um índice estático, `/busca-index.json`, montado no build por
`src/utils/busca.ts` a partir dos mesmos manifestos que alimentam as páginas — séries,
análises, ferramentas e a coleção do blog. **Nada é catalogado à mão**: material novo no
JSON entra na busca sozinho.

São ~120 entradas de título e descrição, e por isso não há motor de busca nem índice
invertido: o navegador baixa o JSON (~28 KB) e filtra. A consulta não sai da máquina de
quem busca. O casamento ignora acentos sem perder as posições dos caracteres (cada letra
vira sua base, uma a uma), o que permite destacar o trecho encontrado no texto original.

Para acrescentar uma fonte à busca, edite `montarIndice()`: cada item é
`{ t: título, d: descrição, u: URL, s: grupo, c: contexto, x: texto só para casar, p: PDF }`.

## Índice por assunto

O site é organizado por **formato** — material, ferramenta, análise, post. `/assuntos`
é a vista transversal: cada assunto reúne tudo que existe sobre ele, venha de onde vier.
Quem chega procurando "lei dos cossenos" quer o conjunto, não a pasta.

A divisão de trabalho entre os dois arquivos é a que importa:

- **O que um assunto é** fica em `src/data/assuntos.json` — `slug`, `nome` e `descricao`,
  na ordem em que aparecem no índice.
- **A que assunto uma coisa pertence** fica junto da própria coisa, no campo `assuntos`:
  nos JSONs das séries, em `ferramentas.json`, em `analises.json`, em `curso-fet.json` e
  no frontmatter dos posts.

Assim, material novo entra no índice na mesma linha em que é cadastrado — não há uma
segunda lista para lembrar de atualizar. `src/utils/assuntos.ts` cruza tudo e o build
**falha** em dois casos:

| Situação | Por quê |
| :--- | :--- |
| `assuntos` cita um slug que não está no manifesto | seria um erro de digitação que faz o conteúdo sumir do índice, calado |
| um assunto do manifesto não tem nenhum conteúdo | seria uma página vazia publicada e prometida no índice |

O campo é **opcional**: item sem `assuntos` simplesmente não aparece no índice. É o caso
das apresentações e das listas de revisão genéricas, que não são de um assunto só.

Os assuntos também alimentam a busca por dois caminhos: cada assunto vira um resultado
(com peso maior, para a página que reúne o tema vir antes de um item solto sobre ele) e o
nome do assunto entra no texto buscável de cada item — é o que faz procurar "álgebra"
achar "Produtos Notáveis", que não traz a palavra em lugar nenhum.

## Como adicionar um material

1. Coloque o PDF na pasta da série em `public/materiais/` (a pasta de cada série
   está no campo `pastaPdf` de `src/data/series.json`).
2. Adicione a entrada no JSON da série em `src/data/materiais/<ano>-<slug>.json`:

```json
{ "n": "14", "titulo": "Título", "descricao": "Descrição curta.", "arquivo": "14-nome.pdf",
  "assuntos": ["geometria"] }
```

- Tarefa de apostila (sem PDF): use `"apostila": { "ordem": "Atividades X, pág. Y", "data": "2026-06-15" }` — **data em formato ISO** (`AAAA-MM-DD`); tarefas futuras ganham destaque automático.
- Lista de revisão com vídeo: use `"video": { "url": "https://youtu.be/...", "topicos": [] }` — com `url` vazia o botão de vídeo não aparece.
- `"assuntos"` põe o material em `/assuntos/<slug>` (um ou mais, de `src/data/assuntos.json`); sem o campo, ele fica fora do índice por assunto. Vale igual nos JSONs de provas e formativas.

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
  "assuntos": ["dados"],
  "secoes": ["Visão geral — principais indicadores"],
  "rascunho": false
}
```

- `data` em formato ISO (`AAAA-MM-DD`); `tags`, `assuntos` e `secoes` são opcionais.
- `"rascunho": true` mantém a análise fora do índice e sem capa publicada.
- O build valida a data e a existência do painel, e falha cedo se algo faltar.
- A imagem Open Graph da capa é gerada sozinha no build, a partir do título.

Os painéis trazem `noindex` para que a busca leve à capa (que tem a navegação do site)
e não ao painel sem contexto. Se uma análise já tiver sido divulgada em outra URL,
deixe no caminho antigo um arquivo curto com `meta refresh` para o novo — foi o que
`public/analises/dashboard-ideb-2025-8268fddf8eb566e6.html` faz.

### Quando o painel não cabe num arquivo só

O padrão é um arquivo único, e é o que IDEB e SIMAVE fazem. O Censo Escolar 2025 é a
exceção: a base nacional tem 5.571 municípios e 180.540 escolas, e embutir tudo daria
mais de 13 MB. Ele carrega em dois níveis — 2,6 MB no próprio HTML (todos os municípios,
série 2019–2025, sete das oito páginas) e `public/analises/paineis/censo-escolar-2025-escolas/`
com um `.json.gz` por UF, buscado só quando a página de Escolas abre.

Se precisar repetir isso noutra análise, nomeie a pasta com o slug da análise
(`<slug>-escolas/`, não `escolas/`), porque `paineis/` é compartilhada. O painel continua
sem CDN e sem back-end: os arquivos por UF são estáticos e da mesma origem.

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
A nota aparece no rodapé de todas as páginas (em `src/layouts/Layout.astro`), e
`/para-professores` explica em português claro o que a licença permite, com o modelo
de citação — é a página para onde mandar o colega que perguntar se pode usar.

## Como publicar um post

Passo a passo completo em [docs/publicar-post.md](docs/publicar-post.md). Resumo:

1. Crie `src/content/blog/meu-post.md` (ou `.mdx`, se usar componentes) com o frontmatter:

```yaml
---
title: "Título"
description: "Descrição (usada no índice, no preview e no RSS)"
date: 2026-06-11
tags: ["tag"]                 # etiquetas + páginas /blog/tag/<slug> automáticas
assuntos: ["dados"]           # opcional — entra no índice por assunto
series: "Nome da série"       # opcional — agrupa e navega entre as partes
part: 1                       # opcional — ordem dentro da série
draft: false                  # true = não publica
---
```

2. Confira com `npm run dev` e faça push na `main` — o deploy é automático.
   A imagem Open Graph do post é gerada sozinha no build, a partir do título.
