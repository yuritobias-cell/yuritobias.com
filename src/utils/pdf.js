/* PDF vetorial mínimo, escrito à mão — sem biblioteca e sem nada sair do navegador.

   Recebe páginas A4 descritas como listas de itens em MILÍMETROS, com a origem no
   canto superior esquerdo da folha (o mesmo referencial do SVG da pré-visualização):

     { t: 'poly', pts: [[x,y],…], fill: '#rrggbb' | null, stroke: '#rrggbb' | null, w, dash: [a,b] | null }
     { t: 'line', a: [x,y], b: [x,y], stroke, w, dash }
     { t: 'text', x, y, size, txt, bold, cor, ancora: 'start' | 'middle' | 'end' }   (y é a linha de base)

   O mesmo desenho vira SVG em svgDaPagina(): o que se vê na tela é o que sai no PDF.
   As fontes são a Helvetica das 14 padrão do PDF (nenhum arquivo embutido), com a
   codificação WinAnsi — que cobre os acentos do português. */

const A4 = { larg: 210, alt: 297 };
const PT = 72 / 25.4;

const num = (v) => (Math.round(v * 100) / 100).toString();
const rgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => num(parseInt(h.slice(i, i + 2), 16) / 255)).join(' ');
};

/* WinAnsi: o latin-1 vale direto de 160 a 255; alguns sinais tipográficos têm
   posição própria entre 128 e 159. O resto vira "?". */
const WIN = { '—': 0x97, '–': 0x96, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '…': 0x85, '€': 0x80 };
function textoPdf(s) {
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    let b = c < 128 ? c : WIN[ch] ?? (c >= 160 && c <= 255 ? c : 63);
    if (b === 40 || b === 41 || b === 92) out += '\\' + String.fromCharCode(b);
    else if (b < 32 || b > 126) out += '\\' + b.toString(8).padStart(3, '0');
    else out += String.fromCharCode(b);
  }
  return out;
}

/** Largura aproximada de um texto em Helvetica, em unidades do tamanho da fonte. */
export function larguraTexto(s, negrito = false) {
  let w = 0;
  for (const ch of s) {
    if (/[0-9]/.test(ch)) w += 0.556;
    else if (/[ il.,:;'|!]/.test(ch)) w += 0.26;
    else if (/[mwMW]/.test(ch)) w += 0.85;
    else if (/[A-Z]/.test(ch)) w += 0.68;
    else w += 0.52;
  }
  return w * (negrito ? 1.06 : 1);
}

function conteudoDaPagina(itens) {
  const X = (x) => num(x * PT), Y = (y) => num((A4.alt - y) * PT);
  const out = ['1 J 1 j'];
  for (const it of itens) {
    if (it.t === 'text') {
      const larg = larguraTexto(it.txt, it.bold) * it.size;
      const x = it.ancora === 'middle' ? it.x - larg / 2 : it.ancora === 'end' ? it.x - larg : it.x;
      out.push(`BT /${it.bold ? 'F2' : 'F1'} ${num(it.size * PT)} Tf ${rgb(it.cor || '#000000')} rg ${X(x)} ${Y(it.y)} Td (${textoPdf(it.txt)}) Tj ET`);
      continue;
    }
    const pts = it.t === 'line' ? [it.a, it.b] : it.pts;
    const caminho = pts.map((p, i) => `${X(p[0])} ${Y(p[1])} ${i ? 'l' : 'm'}`).join(' ') + (it.t === 'poly' ? ' h' : '');
    const pinta = it.t === 'poly' && it.fill;
    const traca = it.stroke && it.w > 0;
    if (!pinta && !traca) continue;
    const est = [];
    if (pinta) est.push(`${rgb(it.fill)} rg`);
    if (traca) est.push(`${rgb(it.stroke)} RG ${num(it.w * PT)} w ${it.dash ? `[${it.dash.map((d) => num(d * PT)).join(' ')}] 0 d` : '[] 0 d'}`);
    out.push(`${est.join(' ')} ${caminho} ${pinta && traca ? 'B' : pinta ? 'f' : 'S'}`);
  }
  return out.join('\n');
}

/** Monta o arquivo PDF (uma página A4 em pé por lista de itens) e devolve um Blob. */
export function pdfDePaginas(paginas, titulo = '') {
  const objs = [];            // conteúdo de cada objeto, na ordem do número
  const add = (s) => objs.push(s) && objs.length;
  const catalogo = add(''), raizPaginas = add('');
  const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const info = add(`<< /Title (${textoPdf(titulo)}) /Producer (yuritobias.com) >>`);
  const kids = [];
  for (const itens of paginas) {
    const c = conteudoDaPagina(itens);
    const conteudo = add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent ${raizPaginas} 0 R /MediaBox [0 0 ${num(A4.larg * PT)} ${num(A4.alt * PT)}] ` +
      `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${conteudo} 0 R >>`));
  }
  objs[catalogo - 1] = `<< /Type /Catalog /Pages ${raizPaginas} 0 R >>`;
  objs[raizPaginas - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  // tudo é ASCII (os acentos saem em octal), então tamanho em caracteres = em bytes
  let pdf = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) pdf += `${String(o).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catalogo} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** A mesma página em SVG, com largura e altura em mm (imprime em tamanho real). */
export function svgDaPagina(itens, rotulo = '') {
  const partes = itens.map((it) => {
    if (it.t === 'text') {
      return `<text x="${num(it.x)}" y="${num(it.y)}" font-family="Helvetica, Arial, sans-serif" font-size="${num(it.size)}"` +
        `${it.bold ? ' font-weight="bold"' : ''} fill="${it.cor || '#000'}"${it.ancora && it.ancora !== 'start' ? ` text-anchor="${it.ancora}"` : ''}>${esc(it.txt)}</text>`;
    }
    const traco = it.stroke && it.w > 0
      ? ` stroke="${it.stroke}" stroke-width="${num(it.w)}" stroke-linejoin="round" stroke-linecap="round"${it.dash ? ` stroke-dasharray="${it.dash.join(' ')}"` : ''}`
      : '';
    if (it.t === 'line') return `<line x1="${num(it.a[0])}" y1="${num(it.a[1])}" x2="${num(it.b[0])}" y2="${num(it.b[1])}"${traco}/>`;
    return `<polygon points="${it.pts.map((p) => `${num(p[0])},${num(p[1])}`).join(' ')}" fill="${it.fill || 'none'}"${traco}/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${A4.larg}mm" height="${A4.alt}mm" viewBox="0 0 ${A4.larg} ${A4.alt}"` +
    ` role="img" aria-label="${esc(rotulo)}"><rect width="${A4.larg}" height="${A4.alt}" fill="#fff"/>${partes.join('')}</svg>`;
}

export { A4 };
