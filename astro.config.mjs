import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://yuritobias.com',
  // URL antiga da ferramenta, publicada antes do rename
  redirects: {
    '/ferramentas/cifrador-emojis': '/ferramentas/cifrador-silabico',
  },
  integrations: [mdx(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});