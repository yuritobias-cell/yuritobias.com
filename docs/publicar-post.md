# Como publicar um post no blog

Passo a passo completo, do arquivo ao ar. Para a versão resumida, veja o
[README](../README.md#como-publicar-um-post).

## 1. Criar o arquivo

Crie um arquivo em `src/content/blog/`. O nome do arquivo vira o slug da URL:

- `meu-post.md` → `yuritobias.com/blog/meu-post`
- Use `.md` para post só de texto; use `.mdx` se o post tiver gráfico interativo
  ou outro componente (ver passo 4).

## 2. Preencher o frontmatter

```yaml
---
title: "Título do post"
description: "Uma ou duas frases. Aparece no índice do blog, no RSS e no preview das redes sociais."
date: 2026-07-15
tags: ["análise de dados", "educação"]
series: "Microdados do ENEM"   # opcional — só para posts em série
part: 2                        # opcional — número da parte na série
draft: false                   # true = não publica
---
```

Campo a campo:

- **`date`** — `AAAA-MM-DD` basta; a exibição usa UTC, então o dia mostrado é
  exatamente o que você escreveu. Se quiser hora (afeta a ordem no índice e no
  RSS), use `2026-07-15T12:00:00-03:00`.
- **`tags`** — viram etiquetas clicáveis e cada tag ganha automaticamente uma
  página `/blog/tag/<slug>` (acentos são removidos na URL: "análise de dados" →
  `analise-de-dados`). **Use a grafia exata de tags já existentes** para agrupar
  os posts — "educação" e "Educação" seriam tags diferentes. Para listar as tags
  em uso: `grep -h "^tags:" src/content/blog/*.md*`
- **`series` + `part`** — posts com o mesmo nome em `series` ganham uma caixa no
  topo listando as partes (ordenadas por `part`) com navegação automática entre
  elas. O nome também precisa ser idêntico entre as partes.
- **`draft: true`** — o post não aparece em lugar nenhum (índice, RSS, tags,
  sitemap). Bom para escrever aos poucos e commitar sem publicar.

O tempo de leitura ("X min de leitura") é calculado sozinho — nada a preencher.

## 3. Escrever o conteúdo

Markdown normal: `## Subtítulos`, listas, links, `código`, citações. O estilo
visual (tipografia, espaçamento) é aplicado automaticamente pela página do post.

## 4. (Opcional) Post com gráfico interativo — MDX

Para incluir um gráfico de distribuições como o do post do ENEM:

1. Use a extensão `.mdx` no arquivo do post.
2. Coloque os dados em um JSON em `src/data/enem/` (ou outra pasta em
   `src/data/`), uma linha por área × grupo:

   ```json
   [
     { "area": "Matemática", "grupo": "Privada", "n": 252481, "media": 620.3,
       "p10": 436.6, "p25": 525.9, "p50": 627.4, "p75": 715.4, "p90": 786.8 }
   ]
   ```

3. No post, importe e use o componente:

   ```mdx
   import GraficoDistribuicao from '../../components/GraficoDistribuicao.astro';
   import dados from '../../data/enem/meu-recorte.json';

   <GraficoDistribuicao
     dados={dados}
     paleta={{ Estadual: "#8AA6A3", Municipal: "#5C8480", Federal: "#B4763A", Privada: "#1B4F4F" }}
     ordemY={["Privada", "Federal", "Municipal", "Estadual"]}
     paineis={["Linguagens", "Matemática"]}
     linhaReferencia="Privada"
     rotuloGrupo="Rede"
   >
     <Fragment slot="subtitulo">Texto explicativo acima do gráfico.</Fragment>
     <Fragment slot="nota">Nota de rodapé, com <b>fonte</b> dos dados.</Fragment>
   </GraficoDistribuicao>
   ```

   Props: `dados` (o JSON), `paleta` (cor por grupo, define a legenda), `ordemY`
   (ordem dos grupos de cima para baixo), `paineis` (áreas, na ordem de
   exibição), `linhaReferencia` (grupo cuja mediana vira linha tracejada,
   opcional) e `rotuloGrupo` (cabeçalho da 1ª coluna da tabela, padrão "Grupo").

O componente cuida do resto: tooltip, responsividade no celular e a tabela de
dados acessível ("Ver os dados em tabela"). O Observable Plot é empacotado no
build — não há dependência de CDN.

## 5. Imagem de compartilhamento (OG) — automática

Cada post ganha uma imagem própria para redes sociais (1200×630, com o título),
gerada **automaticamente durante o build** a partir do frontmatter — nada a fazer.

Como funciona, caso precise mexer: o endpoint `src/pages/og/[slug].png.ts` gera
`/og/<slug>.png` para todo post publicado (e `src/pages/og.png.ts` gera o
`/og.png` padrão do site), usando o template em `src/utils/og.ts` e as fontes
TTF de `src/assets/og/`. Para conferir uma imagem localmente:
`npm run build` e abra `dist/og/<slug>.png`.

## 6. Conferir localmente

```bash
npm run dev          # abre em localhost:4321
```

Confira `localhost:4321/blog/<slug>`: título, data, tempo de leitura, tags,
caixa de série (se houver), gráfico (se houver) e a navegação
anterior/próxima no rodapé. Vale olhar também o índice `/blog` e a página da
tag nova, se criou uma.

Opcional, para pegar erros antes do CI: `npm run check && npm run build`.

## 7. Publicar

```bash
git add src/content/blog/ src/data/
git commit -m "Nova postagem: <título>"
git push
```

O push na `main` dispara o GitHub Actions, que roda `check` + `build` e publica
no GitHub Pages. RSS, sitemap e páginas de tag são regenerados sozinhos.

## Checklist rápido

- [ ] Arquivo em `src/content/blog/` com frontmatter completo
- [ ] Tags com grafia idêntica às existentes (se for reutilizar)
- [ ] `series`/`part` preenchidos, se for parte de série
- [ ] Conferido no `npm run dev`
- [ ] Commit + push na `main`
