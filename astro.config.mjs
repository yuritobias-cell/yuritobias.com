import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

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
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
