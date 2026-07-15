/* Imagens Open Graph (1200x630) geradas no build, seguindo o design do site.
   Substitui o antigo scripts/og-image.py (Pillow): mesmo layout, mesmas cores.
   Consumido pelos endpoints src/pages/og.png.ts e src/pages/og/[slug].png.ts. */
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const W = 1200;
const H = 630;
const BG = '#F8F6F1';
const INK = '#1C1917';
const MUTED = '#78716C';
const ACCENT = '#1B4F4F';
const RULE = '#E2DDD6';

// Caminhos relativos à raiz do projeto (o build do Astro roda sempre de lá).
const FONTES = path.join(process.cwd(), 'src/assets/og');

const fonts = [
  { name: 'Playfair Display', weight: 700 as const, style: 'normal' as const, data: fs.readFileSync(path.join(FONTES, 'playfair-700.ttf')) },
  { name: 'IBM Plex Sans', weight: 400 as const, style: 'normal' as const, data: fs.readFileSync(path.join(FONTES, 'plex-400.ttf')) },
  { name: 'IBM Plex Sans', weight: 500 as const, style: 'normal' as const, data: fs.readFileSync(path.join(FONTES, 'plex-500.ttf')) },
];

type No = { type: string; props: Record<string, unknown> };

function el(estilo: Record<string, unknown>, children?: No[] | string): No {
  return { type: 'div', props: { style: { position: 'absolute', display: 'flex', ...estilo }, children } };
}

function texto(estilo: Record<string, unknown>, conteudo: string): No {
  return el(estilo, conteudo);
}

/** Moldura fina, como as hairlines do site. */
function moldura(): No {
  return el({ left: 28, top: 28, width: W - 56, height: H - 56, border: `2px solid ${RULE}` });
}

function base(children: No[]): No {
  return {
    type: 'div',
    props: {
      style: { display: 'flex', position: 'relative', width: W, height: H, background: BG },
      children,
    },
  };
}

async function renderizar(arvore: No): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(arvore as never, { width: W, height: H, fonts });
  return new Uint8Array(new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng());
}

/** Imagem padrão do site (og.png): monograma YT + nome e papéis. */
export function imagemSite(): Promise<Uint8Array<ArrayBuffer>> {
  return renderizar(base([
    moldura(),
    // Monograma YT à esquerda, na cor de destaque, centralizado na vertical
    el({ left: 105, top: 0, height: H, alignItems: 'center' }, [
      texto({ position: 'relative', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 290, color: ACCENT }, 'YT'),
    ]),
    // Separador vertical
    el({ left: 600, top: 165, width: 2, height: H - 330, background: RULE }),
    // Bloco de texto à direita
    texto({ left: 665, top: 186, fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 76, color: INK }, 'Yuri Tobias'),
    el({ left: 669, top: 320, width: 48, height: 4, background: ACCENT }),
    texto({ left: 665, top: 356, fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: 30, color: MUTED }, 'Professor de Matemática'),
    texto({ left: 665, top: 400, fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: 30, color: MUTED }, 'Analista de Dados Educacionais'),
    texto({ left: 665, top: 475, fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: 24, color: ACCENT, letterSpacing: 3 }, 'YURITOBIAS.COM'),
  ]));
}

/** Corpo do título: reduz se o texto não couber em 3 linhas (como no script antigo). */
function corpoDoTitulo(titulo: string): number {
  const larguraMax = W - 2 * 105;
  for (const corpo of [76, 66]) {
    // Largura média de um caractere do Playfair 700 ≈ 0,52 × corpo (medida empírica)
    const porLinha = Math.floor(larguraMax / (0.52 * corpo));
    const linhas = quebraLinhas(titulo, porLinha).length;
    if (linhas <= 3) return corpo;
  }
  return 56;
}

function quebraLinhas(txt: string, maxChars: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of txt.split(/\s+/)) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (teste.length <= maxChars) atual = teste;
    else {
      if (atual) linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Imagem de um post do blog: kicker + título + assinatura. */
export function imagemPost(titulo: string): Promise<Uint8Array<ArrayBuffer>> {
  const mx = 105;
  const corpo = corpoDoTitulo(titulo);
  return renderizar(base([
    moldura(),
    texto({ left: mx, top: 92, fontFamily: 'IBM Plex Sans', fontWeight: 500, fontSize: 24, color: ACCENT, letterSpacing: 3 }, 'BLOG · YURITOBIAS.COM'),
    el({ left: mx + 4, top: 168, width: 48, height: 4, background: ACCENT }),
    texto({ left: mx, top: 200, width: W - 2 * mx, fontFamily: 'Playfair Display', fontWeight: 700, fontSize: corpo, lineHeight: 1.24, color: INK }, titulo),
    texto({ left: mx, top: H - 118, fontFamily: 'IBM Plex Sans', fontWeight: 400, fontSize: 26, color: MUTED }, 'Yuri Tobias — Professor de Matemática e Analista de Dados Educacionais'),
  ]));
}
