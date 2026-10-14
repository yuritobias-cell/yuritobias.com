/* A folha A4 de uma planificação: cabeçalho, a rede na maior escala que couber
   (ou na escala pedida), abas de colagem numeradas e rodapé. Devolve a lista de
   itens em milímetros que pdf.js transforma em PDF ou em SVG — a pré-visualização,
   a impressão e os dois downloads saem do mesmo desenho. */
import { organizaRede, giraRede90, caixa } from './planificacao.js';
import { corDe } from './poliedros-catalogo.js';
import { arestas } from './poliedros.js';
import { larguraTexto } from './pdf.js';

export const MARGEM = 10;           // mm, em cada borda da A4
const TOPO_REDE = 6;                // mm entre o cabeçalho e a rede
const RODAPE = 9;                   // mm reservados embaixo

const cinza = '#555555', tinta = '#1a1a1a';
const cm = (v) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** Cor clara da face: a cor do papel misturada com branco. */
function clara(hex, f = 0.42) {
  const h = hex.replace('#', '');
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return '#' + c.map((v) => Math.round(255 - (255 - v) * f).toString(16).padStart(2, '0')).join('');
}

/**
 * @param M      sólido montado (monta() do catálogo)
 * @param op     { cor: 'cor' | 'branco', abas, numeros, aluno, aresta: null | cm }
 * @returns      { itens, escala (mm por unidade), arestaCm, reduzida }
 */
export function folhaDaPlanificacao(M, op) {
  const itens = [];
  const L = 210 - 2 * MARGEM;
  const s = M.solido;
  const nA = arestas(s).length;

  /* ---------- cabeçalho ---------- */
  let y = MARGEM + 6;
  itens.push({ t: 'text', x: MARGEM, y, size: 6, txt: M.nome, bold: true, cor: tinta });
  const linhaInfo = (txt) => { y += 5.2; itens.push({ t: 'text', x: MARGEM, y, size: 3.1, txt, cor: cinza }); };
  // a medida da aresta entra depois que a escala for decidida (posição guardada)
  const infoIdx = itens.length;
  linhaInfo('');
  linhaInfo('Recorte na linha contínua e dobre na tracejada' +
    (op.abas ? (op.numeros ? '; cada aba é colada por dentro, sob a aresta de mesmo número.' : '; cole as abas por dentro.') : '.'));
  if (op.aluno) {
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

  /* ---------- a rede: orientação e escala ---------- */
  const area = { x: MARGEM, y: y + TOPO_REDE, w: L, h: 297 - MARGEM - RODAPE - (y + TOPO_REDE) };
  const R0 = organizaRede(M);
  const opcoes = [R0, giraRede90(R0)].map((R) => {
    const b = caixa([...R.polys.flat(), ...(op.abas ? R.abas.flat() : [])]);
    const larg = b[2] - b[0], alt = b[3] - b[1];
    return { R, b, larg, alt, cabe: Math.min(area.w / larg, area.h / alt) };
  });
  let escolha = opcoes[0].cabe >= opcoes[1].cabe ? opcoes[0] : opcoes[1];
  let k = escolha.cabe;
  let reduzida = false;
  if (op.aresta) {
    const pedida = (op.aresta * 10) / R0.maiorAresta;
    // na escala pedida, qualquer orientação que caiba serve: fica a que sobra mais folga
    if (pedida <= escolha.cabe + 1e-9) k = pedida;
    else { reduzida = true; }
  }
  const { R, b } = escolha;
  const larg = (b[2] - b[0]) * k, alt = (b[3] - b[1]) * k;
  const ox = area.x + (area.w - larg) / 2, oy = area.y + (area.h - alt) / 2;
  // o y da rede cresce para cima e o da folha para baixo: inverter mantém a vista de fora
  const P = ([px, py]) => [ox + (px - b[0]) * k, oy + (b[3] - py) * k];

  const arestaCm = (R0.maiorAresta * k) / 10;
  itens[infoIdx].txt = `${s.V.length} vértices · ${nA} arestas · ${s.F.length} faces · ` +
    `maior aresta: ${cm(arestaCm)} cm${reduzida ? ` (reduzida — ${cm(op.aresta)} cm não cabe na folha)` : ''}`;

  /* ---------- desenho ---------- */
  const fino = 0.25, grosso = 0.35;
  if (op.abas) for (const a of R.abas) itens.push({ t: 'poly', pts: a.map(P), fill: op.cor === 'cor' ? '#EEEEEE' : null, stroke: '#444444', w: fino });
  R.polys.forEach((p, f) => itens.push({
    t: 'poly', pts: p.map(P), fill: op.cor === 'cor' ? clara(corDe(s.papel[f])) : null, stroke: null, w: 0,
  }));
  for (const sg of R.vincos) itens.push({ t: 'line', a: P(sg[0]), b: P(sg[1]), stroke: '#333333', w: fino, dash: [1.8, 1.2] });
  for (const sg of R.cortes) itens.push({ t: 'line', a: P(sg[0]), b: P(sg[1]), stroke: '#000000', w: grosso });

  /* números de colagem: o mesmo número na aba e na aresta onde ela entra */
  if (op.numeros) {
    R.pares.forEach((par, i) => {
      const n = String(i + 1);
      const rotulo = ([x, yy], tam) => itens.push({ t: 'text', x, y: yy + tam * 0.36, size: tam, txt: n, ancora: 'middle', cor: '#333333' });
      const dentroDaFace = ([a, bb]) => {
        // ponto junto da aresta, para dentro da face (à esquerda de a→b na rede anti-horária)
        const A = P(a), B = P(bb);
        const comp = Math.hypot(B[0] - A[0], B[1] - A[1]);
        const tam = Math.min(3, comp * 0.28);
        // na folha o y está invertido: a esquerda da rede vira a direita de A→B
        const nx = -(B[1] - A[1]) / comp, ny = (B[0] - A[0]) / comp;
        const d = tam * 0.95;
        return { p: [(A[0] + B[0]) / 2 - nx * d, (A[1] + B[1]) / 2 - ny * d], tam };
      };
      for (let j = 0; j < 2; j++) {
        const { seg } = par.segs[j];
        if (op.abas && j === par.lado) {
          // na própria aba, no meio dela
          const q = par.aba.map(P);
          const c = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
          const comp = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]);
          const tam = Math.min(3, comp * 0.28, Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]) * 0.7);
          if (tam >= 1.4) rotulo(c, tam);
        } else {
          const { p, tam } = dentroDaFace(seg);
          if (tam >= 1.4) rotulo(p, tam);
        }
      }
    });
  }

  /* ---------- rodapé ---------- */
  const yr = 297 - MARGEM;
  itens.push({ t: 'text', x: MARGEM, y: yr, size: 2.5, txt: 'Planificações para Imprimir · yuritobias.com', cor: '#888888' });
  itens.push({ t: 'text', x: 210 - MARGEM, y: yr, size: 2.5, txt: 'Imprima em A4 com escala 100% para as medidas valerem', cor: '#888888', ancora: 'end' });

  return { itens, escala: k, arestaCm, reduzida };
}
