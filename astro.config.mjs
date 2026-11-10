import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import rehypeQuestoes from './src/utils/rehype-questoes.mjs';

// Gera dist/sw.js a partir do template src/sw.js: o precache é derivado das
// páginas reais de src/pages/ferramentas/ (impossível esquecer uma ferramenta
// nova ou precachear uma removida), mais o CSS e o JS que elas carregam, e a
// versão é um hash da lista de páginas e do próprio template (invalida os
// caches quando a lista ou as estratégias mudam, e só aí).
function serviceWorker() {
  return {
    name: 'service-worker',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const ferramentas = fs
          .readdirSync('./src/pages/ferramentas')
          .filter((f) => f.endsWith('.astro') && f !== 'index.astro')
          .map((f) => `/ferramentas/${path.basename(f, '.astro')}/`)
          .sort();
        // A busca também vai para o precache: o índice é um arquivo estático e
        // pequeno, e sem ele /busca abre offline sem conseguir buscar nada.
        const precache = ['/', '/ferramentas/', '/busca/', '/busca-index.json', ...ferramentas];
        const dist = fileURLToPath(dir);

        // O HTML sozinho não abre ferramenta nenhuma: sem o CSS e o JS dela, a
        // página chega offline sem estilo e sem funcionar. Então o precache
        // leva também o que cada página precacheada carrega de /_astro/ —
        // lido do HTML pronto e seguido pelos `import` de cada módulo (o
        // three.js, por exemplo, só aparece dentro do script do simulador).
        const assets = new Set();
        const seguir = (url) => {
          if (assets.has(url)) return;
          const arquivo = path.join(dist, url);
          if (!fs.existsSync(arquivo)) return;
          assets.add(url);
          if (!url.endsWith('.js')) return;
          for (const m of fs.readFileSync(arquivo, 'utf-8').matchAll(/["'`]\.\/([\w.-]+\.(?:js|css))["'`]/g)) {
            seguir(`/_astro/${m[1]}`);
          }
        };
        for (const pagina of precache.filter((u) => u.endsWith('/'))) {
          const html = fs.readFileSync(path.join(dist, pagina, 'index.html'), 'utf-8');
          for (const m of html.matchAll(/\/_astro\/[\w.-]+/g)) seguir(m[0]);
        }
        const listaAssets = [...assets].sort();
        // As fontes do site, que toda página usa (ver src/styles/global.css).
        const fontes = fs.readdirSync('./public/fonts').filter((f) => f.endsWith('.woff2')).map((f) => `/fonts/${f}`).sort();

        // A versão NÃO inclui os assets de propósito: eles têm hash no nome e
        // mudam a cada deploy que mexa num estilo. Se entrassem aqui, todo
        // deploy apagaria os caches — inclusive as páginas que o visitante já
        // abriu e espera ter offline. O sw.js muda de qualquer forma (a lista
        // vai dentro dele), e a instalação busca só o que ainda não tem.
        const template = fs.readFileSync('./src/sw.js', 'utf-8');
        const versao = crypto.createHash('sha256').update(JSON.stringify(precache)).update(template).digest('hex').slice(0, 8);
        const sw = template
          .replaceAll('__VERSAO__', versao)
          .replaceAll('__PRECACHE__', JSON.stringify(precache, null, 2))
          .replaceAll('__ASSETS__', JSON.stringify(listaAssets, null, 2))
          .replaceAll('__FONTES__', JSON.stringify(fontes, null, 2));
        fs.writeFileSync(path.join(dist, 'sw.js'), sw);
        const kb = Math.round([...listaAssets, ...fontes].reduce((t, u) => t + fs.statSync(path.join(dist, u)).size, 0) / 1024);
        console.log(`[service-worker] sw.js gerado: ${precache.length} páginas, ${listaAssets.length} assets e ${fontes.length} fontes no precache (${kb} KB), versão ${versao}`);
      },
    },
  };
}

// Põe a barra final nos links internos do HTML gerado (/sobre → /sobre/).
// O GitHub Pages serve cada página em <pasta>/index.html e responde ao endereço
// sem a barra com um redirecionamento 301 — um vaivém a mais em todo clique, e
// offline o endereço sem barra nem está no cache do service worker. Em vez de
// depender de cada `href` do código lembrar da barra, o build confere contra as
// páginas que de fato existem em dist/: só ganha barra o link que aponta para
// uma delas. O que veio pronto de public/ (painéis das análises) não é tocado.
function barrasFinais() {
  return {
    name: 'barras-finais',
    hooks: {
      'astro:build:done': async ({ dir }) => {
        const dist = fileURLToPath(dir);
        const ehPagina = (caminho) => fs.existsSync(path.join(dist, decodeURIComponent(caminho), 'index.html'));
        let links = 0;
        const visitar = (pasta) => {
          for (const item of fs.readdirSync(pasta, { withFileTypes: true })) {
            const arquivo = path.join(pasta, item.name);
            if (item.isDirectory()) { visitar(arquivo); continue; }
            if (!item.name.endsWith('.html')) continue;
            if (fs.existsSync(path.join('./public', path.relative(dist, arquivo)))) continue;
            const html = fs.readFileSync(arquivo, 'utf-8');
            const novo = html.replace(
              /\b(href|action)="(\/[^"#?]*[^"#?/])([#?][^"]*)?"/g,
              (tudo, attr, caminho, resto = '') => {
                if (!ehPagina(caminho)) return tudo;
                links += 1;
                return `${attr}="${caminho}/${resto}"`;
              }
            );
            if (novo !== html) fs.writeFileSync(arquivo, novo);
          }
        };
        visitar(dist);
        console.log(`[barras-finais] ${links} links internos ganharam a barra final`);
      },
    },
  };
}

// Séries arquivadas cujo slug não foi reaproveitado por uma série ativa:
// a URL antiga (/materiais/<slug>) redireciona para a página no arquivo.
const series = JSON.parse(fs.readFileSync('./src/data/series.json', 'utf-8'));
const slugsAtivos = new Set(series.filter((s) => !s.arquivada).map((s) => s.slug));
const redirectsArquivo = Object.fromEntries(
  series
    .filter((s) => s.arquivada && !slugsAtivos.has(s.slug))
    .sort((a, b) => a.ano - b.ano) // se houver mais de um ano, vale o mais recente
    .map((s) => [`/materiais/${s.slug}`, `/materiais/arquivo/${s.ano}/${s.slug}/`])
);

export default defineConfig({
  site: 'https://yuritobias.com',
  redirects: {
    // URL antiga da ferramenta, publicada antes do rename
    '/ferramentas/cifrador-emojis': '/ferramentas/cifrador-silabico/',
    ...redirectsArquivo,
  },
  markdown: {
    // O processador padrão do Astro, mais um plugin: rehypeQuestoes dá id e link
    // a cada questão — e só age nos arquivos de src/content/listas/. O MDX herda.
    // (`@astrojs/markdown-remark` fixado na mesma versão que o Astro usa, para
    // não haver duas cópias do pipeline.)
    processor: unified({ rehypePlugins: [rehypeQuestoes] }),
  },
  integrations: [
    mdx(),
    // /exemplos fica fora da navegação e dos buscadores: acesso só pelo endereço direto;
    // /video/ são os endereços dos QR Codes, que só redirecionam para o YouTube
    sitemap({ filter: (page) => !page.includes('/exemplos') && !page.includes('/video/') }),
    serviceWorker(),
    barrasFinais(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
