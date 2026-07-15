import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// Gera dist/sw.js a partir do template src/sw.js: o precache é derivado das
// páginas reais de src/pages/ferramentas/ (impossível esquecer uma ferramenta
// nova ou precachear uma removida) e a versão é um hash da própria lista
// (invalida os caches quando a lista muda, e só quando muda).
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
        const precache = ['/', '/ferramentas/', ...ferramentas];
        const versao = crypto.createHash('sha256').update(JSON.stringify(precache)).digest('hex').slice(0, 8);
        const sw = fs
          .readFileSync('./src/sw.js', 'utf-8')
          .replaceAll('__VERSAO__', versao)
          .replaceAll('__PRECACHE__', JSON.stringify(precache, null, 2));
        fs.writeFileSync(path.join(fileURLToPath(dir), 'sw.js'), sw);
        console.log(`[service-worker] sw.js gerado: ${precache.length} páginas no precache, versão ${versao}`);
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
    .map((s) => [`/materiais/${s.slug}`, `/materiais/arquivo/${s.ano}/${s.slug}`])
);

export default defineConfig({
  site: 'https://yuritobias.com',
  redirects: {
    // URL antiga da ferramenta, publicada antes do rename
    '/ferramentas/cifrador-emojis': '/ferramentas/cifrador-silabico',
    ...redirectsArquivo,
  },
  integrations: [mdx(), sitemap(), serviceWorker()],
  vite: {
    plugins: [tailwindcss()],
  },
});
