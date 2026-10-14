/* A folha A4 de um desenho secreto no plano cartesiano: cabeçalho, o plano na
   maior escala que couber e a lista de coordenadas em colunas (folha do aluno), ou
   o plano com o desenho pronto (gabarito). Devolve a lista de itens em milímetros
   que pdf.js transforma em PDF ou em SVG — a pré-visualização, a impressão e os
   downloads saem do mesmo desenho. */
import { transforma, par, totalPontos, nivelDe } from './desenhos-cartesianos.js';
import { larguraTexto } from './pdf.js';

export const MARGEM = 10;           // mm, em cada borda da A4
const RODAPE = 9;                   // mm reservados embaixo
const MAX_CASA = 10;                // mm: a casa da malha não passa disso
const COLUNAS = 6;                  // colunas da lista de coordenadas
const LINHA = 4.3;                  // mm por linha da lista

const cinza = '#555555', tinta = '#1a1a1a', destaque = '#A8442B';

/** Polígono regular (bolinha) para marcar um ponto. */
const bolinha = ([cx, cy], r, n = 14) =>
  Array.from({ length: n }, (_, i) => [cx + r * Math.cos((2 * Math.PI * i) / n), cy + r * Math.sin((2 * Math.PI * i) / n)]);

/* A lista vai em colunas, de cima para baixo. O título de um traço nunca fica
   sozinho no pé de uma coluna: se cair na última linha, a coluna pula para a próxima. */
function distribui(entradas) {
  for (let linhas = Math.ceil(entradas.length / COLUNAS); ; linhas++) {
    const cols = [[]];
    for (const e of entradas) {
      let c = cols[cols.length - 1];
      if (c.length === linhas || (e.cab && c.length === linhas - 1)) { c = []; cols.push(c); }
      c.push(e);
    }
    if (cols.length <= COLUNAS) return { cols, linhas };
  }
}

/**
 * @param d    entrada do catálogo de desenhos
 * @param op   { tipo: 'aluno' | 'gabarito', quadrantes: 1 | 4, meios, aluno, revelar, caixas }
 * @returns    { itens, casa (mm por unidade) }
 */
export function folhaDoDesenho(d, op) {
  const itens = [];
  const L = 210 - 2 * MARGEM;
  const { tracos, passo, janela } = transforma(d, op);
  const gab = op.tipo === 'gabarito';

  /* ---------- cabeçalho ---------- */
  let y = MARGEM + 6;
  const titulo = gab ? `Gabarito — ${d.nome}` : op.revelar ? d.nome : 'Desenho secreto';
  itens.push({ t: 'text', x: MARGEM, y, size: 6, txt: titulo, bold: true, cor: tinta });
  const n = totalPontos(d);
  const resumo = `${tracos.length} ${tracos.length === 1 ? 'traço' : 'traços'} · ${n} pontos · nível ${nivelDe(d).nome.toLowerCase()}` +
    (op.quadrantes === 4 ? ' · quatro quadrantes' : ' · 1º quadrante') + (op.meios ? ' · coordenadas com meios' : '');
  const linhaInfo = (txt) => { y += 5; itens.push({ t: 'text', x: MARGEM, y, size: 3.1, txt, cor: cinza }); };
  linhaInfo(resumo);
  if (gab) {
    linhaInfo('O desenho que aparece quando todos os pontos da folha do aluno são marcados e ligados na ordem.');
  } else {
    linhaInfo('Marque cada ponto no plano e ligue os pontos com régua, na ordem da lista.');
    linhaInfo('Cada traço começa de novo: não ligue o último ponto de um traço ao primeiro do seguinte. Ponto solto: só marque.');
  }
  if (op.aluno && !gab) {
    y += 8;
    const campos = [['Nome', 112], ['Turma', 30], ['Data', 30]];
    let x = MARGEM;
    for (const [rot, larg] of campos) {
      itens.push({ t: 'text', x, y, size: 2.9, txt: rot, bold: true, cor: cinza });
      const x0 = x + larguraTexto(rot, true) * 2.9 + 1.5;
      itens.push({ t: 'line', a: [x0, y + 0.6], b: [x + larg, y + 0.6], stroke: '#888888', w: 0.25 });
      x += larg + 4;
    }
  }
  y += 3;
  itens.push({ t: 'line', a: [MARGEM, y], b: [210 - MARGEM, y], stroke: '#cccccc', w: 0.25 });
  const topo = y + 5;

  /* ---------- lista de coordenadas (só na folha do aluno), embaixo ---------- */
  let baseGrade = 297 - MARGEM - RODAPE;
  if (!gab) {
    const entradas = [];
    tracos.forEach((t, i) => {
      entradas.push({ cab: true, txt: t.length === 1 ? 'Ponto solto' : `Traço ${i + 1}` });
      for (const p of t) entradas.push({ txt: par(p, op.meios) });
    });
    const { cols, linhas } = distribui(entradas);
    const alturaLista = 7 + linhas * LINHA;
    const y0 = baseGrade - alturaLista;
    itens.push({ t: 'line', a: [MARGEM, y0 - 1], b: [210 - MARGEM, y0 - 1], stroke: '#cccccc', w: 0.25 });
    itens.push({ t: 'text', x: MARGEM, y: y0 + 4, size: 3.4, txt: 'Coordenadas', bold: true, cor: tinta });
    const larguraCol = L / COLUNAS;
    cols.forEach((c, ci) => c.forEach((e, li) => {
      const x = MARGEM + ci * larguraCol;
      const yl = y0 + 7 + (li + 1) * LINHA - 1.2;
      if (e.cab) {
        itens.push({ t: 'text', x, y: yl, size: 2.8, txt: e.txt.toUpperCase(), bold: true, cor: destaque });
        return;
      }
      let xt = x;
      if (op.caixas) {
        const s = 2.4, yb = yl - 2.1;
        itens.push({ t: 'poly', pts: [[x, yb], [x + s, yb], [x + s, yb + s], [x, yb + s]], fill: null, stroke: '#777777', w: 0.2 });
        xt = x + s + 1.6;
      }
      itens.push({ t: 'text', x: xt, y: yl, size: 3.3, txt: e.txt, cor: tinta });
    }));
    baseGrade = y0 - 5;
  }

  /* ---------- o plano: escala ---------- */
  const [jx0, jy0, jx1, jy1] = janela;
  const nx = jx1 - jx0, ny = jy1 - jy0;
  const q1 = op.quadrantes === 1;
  // folga para os números dos eixos (no 1º quadrante ficam fora da malha) e para as setas
  const folga = { esq: q1 ? 7 : 2, dir: 6, cima: 6, baixo: q1 ? 6 : 2 };
  const area = { x: MARGEM + folga.esq, y: topo + folga.cima, w: L - folga.esq - folga.dir, h: baseGrade - topo - folga.cima - folga.baixo };
  const k = Math.min(area.w / nx, area.h / ny, MAX_CASA / passo);   // mm por unidade
  const ox = area.x + (area.w - nx * k) / 2, oy = area.y + (area.h - ny * k) / 2;
  const X = (v) => ox + (v - jx0) * k, Y = (v) => oy + (jy1 - v) * k;
  const P = ([px, py]) => [X(px), Y(py)];

  /* ---------- malha ---------- */
  const passos = (a, b) => { const r = []; for (let v = a; v <= b + 1e-9; v += passo) r.push(Math.round(v * 2) / 2); return r; };
  const inteiro = (v) => Number.isInteger(v);
  for (const v of passos(jx0, jx1)) {
    itens.push({ t: 'line', a: [X(v), Y(jy0)], b: [X(v), Y(jy1)], stroke: inteiro(v) && op.meios ? '#a9a9a9' : '#c8c8c8', w: inteiro(v) && op.meios ? 0.22 : 0.15 });
  }
  for (const v of passos(jy0, jy1)) {
    itens.push({ t: 'line', a: [X(jx0), Y(v)], b: [X(jx1), Y(v)], stroke: inteiro(v) && op.meios ? '#a9a9a9' : '#c8c8c8', w: inteiro(v) && op.meios ? 0.22 : 0.15 });
  }

  /* ---------- eixos, setas e números ---------- */
  const seta = 4, ab = 1.3;
  const ex = [X(jx1) + seta, Y(0)], ey = [X(0), Y(jy1) - seta];
  itens.push({ t: 'line', a: [X(jx0), Y(0)], b: ex, stroke: tinta, w: 0.45 });
  itens.push({ t: 'line', a: [X(0), Y(jy0)], b: ey, stroke: tinta, w: 0.45 });
  itens.push({ t: 'poly', pts: [ex, [ex[0] - 2.6, ex[1] - ab], [ex[0] - 2.6, ex[1] + ab]], fill: tinta, stroke: null, w: 0 });
  itens.push({ t: 'poly', pts: [ey, [ey[0] - ab, ey[1] + 2.6], [ey[0] + ab, ey[1] + 2.6]], fill: tinta, stroke: null, w: 0 });
  itens.push({ t: 'text', x: ex[0] - 1, y: ex[1] - 2.2, size: 3.6, txt: 'x', bold: true, cor: tinta, ancora: 'end' });
  itens.push({ t: 'text', x: ey[0] + 2.2, y: ey[1] + 2.4, size: 3.6, txt: 'y', bold: true, cor: tinta });

  const tam = Math.max(2.2, Math.min(2.9, k * 0.42));
  const cada = k < 5 ? 2 : 1;        // casas pequenas: um número sim, outro não
  // fundo branco atrás do número, para ele não brigar com a malha nos quatro quadrantes
  const rotulo = (x, yb, txt, ancora) => {
    const w = larguraTexto(txt) * tam + 0.8;
    const x0 = ancora === 'middle' ? x - w / 2 : ancora === 'end' ? x - w + 0.4 : x - 0.4;
    if (!q1) itens.push({ t: 'poly', pts: [[x0, yb - tam * 0.8], [x0 + w, yb - tam * 0.8], [x0 + w, yb + tam * 0.25], [x0, yb + tam * 0.25]], fill: '#ffffff', stroke: null, w: 0 });
    itens.push({ t: 'text', x, y: yb, size: tam, txt, cor: '#333333', ancora });
  };
  const txt = (v) => (v < 0 ? '-' : '') + Math.abs(v);
  for (let v = jx0; v <= jx1; v++) {
    if (v === 0 || v % cada) continue;
    itens.push({ t: 'line', a: [X(v), Y(0) - 0.8], b: [X(v), Y(0) + 0.8], stroke: tinta, w: 0.3 });
    rotulo(X(v), Y(0) + tam + 1.3, txt(v), 'middle');
  }
  for (let v = jy0; v <= jy1; v++) {
    if (v === 0 || v % cada) continue;
    itens.push({ t: 'line', a: [X(0) - 0.8, Y(v)], b: [X(0) + 0.8, Y(v)], stroke: tinta, w: 0.3 });
    rotulo(X(0) - 1.5, Y(v) + tam * 0.36, txt(v), 'end');
  }
  rotulo(X(0) - 1.5, Y(0) + tam + 1.3, '0', 'end');

  /* ---------- o desenho (gabarito) ---------- */
  if (gab) {
    for (const t of tracos) {
      for (let i = 1; i < t.length; i++) itens.push({ t: 'line', a: P(t[i - 1]), b: P(t[i]), stroke: destaque, w: 0.6 });
    }
    for (const t of tracos) {
      for (const p of t) itens.push({ t: 'poly', pts: bolinha(P(p), t.length === 1 ? 0.95 : 0.6), fill: t.length === 1 ? destaque : tinta, stroke: null, w: 0 });
    }
  }

  /* ---------- rodapé ---------- */
  const yr = 297 - MARGEM;
  itens.push({ t: 'text', x: MARGEM, y: yr, size: 2.5, txt: 'Desenhos no Plano Cartesiano · yuritobias.com', cor: '#888888' });
  itens.push({ t: 'text', x: 210 - MARGEM, y: yr, size: 2.5, txt: gab ? 'Gabarito do professor' : 'Folha do aluno', cor: '#888888', ancora: 'end' });

  return { itens, casa: k };
}

/** Miniatura do desenho em SVG (para o painel de escolha): só os traços, sem malha. */
export function miniatura(d) {
  const pts = d.tracos.flat();
  const x0 = Math.min(...pts.map((p) => p[0])) - 1, x1 = Math.max(...pts.map((p) => p[0])) + 1;
  const y0 = Math.min(...pts.map((p) => p[1])) - 1, y1 = Math.max(...pts.map((p) => p[1])) + 1;
  const lado = Math.max(x1 - x0, y1 - y0);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const vb = `${cx - lado / 2} ${-(cy + lado / 2)} ${lado} ${lado}`;
  const corpo = d.tracos.map((t) => t.length === 1
    ? `<circle cx="${t[0][0]}" cy="${-t[0][1]}" r="0.45" fill="currentColor"/>`
    : `<polyline points="${t.map(([x, y]) => `${x},${-y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="0.55" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
  return `<svg viewBox="${vb}" aria-hidden="true">${corpo}</svg>`;
}
