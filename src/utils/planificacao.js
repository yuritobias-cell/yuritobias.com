/* A planificação pronta para o papel, a partir de um sólido montado pelo catálogo
   (monta() em poliedros-catalogo.js): faces no plano, deitada na menor caixa,
   com as dobras (tracejado), os cortes (linha contínua) e as abas de colagem.

   Usada pelo Simulador de Poliedros (a rede embaixo do 3D) e por Planificações
   para Imprimir (a folha A4 e o PDF). Sem DOM: só coordenadas. */
import { rede2D, redeSobrepoe, arestas, dist } from './poliedros.js';

const chave = (i, j) => `${Math.min(i, j)}-${Math.max(i, j)}`;

/** Ângulo que deixa a rede na menor caixa — e deitada (mais larga que alta). */
function anguloDeitado(pts) {
  let melhor = { area: Infinity, ang: 0, larg: 1, alt: 1 };
  for (let g = 0; g < 180; g += 1) {
    const a = (g * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      const u = x * c - y * sn, v = x * sn + y * c;
      x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
    }
    const area = (x1 - x0) * (y1 - y0);
    if (area < melhor.area - 1e-9) melhor = { area, ang: a, larg: x1 - x0, alt: y1 - y0 };
  }
  return melhor.alt > melhor.larg ? melhor.ang + Math.PI / 2 : melhor.ang;
}

/**
 * Rede organizada:
 * - `polys[k]`: os vértices da face k no plano (anti-horária, vista de fora);
 * - `vincos`, `cortes`: segmentos [[x,y],[x,y]] — cada dobra uma vez só;
 * - `pares`: as arestas que se colam, cada uma com os dois segmentos `{ k, seg }`
 *   e, quando há aba, `aba` (polígono) e `lado` (0 ou 1: qual dos dois a carrega);
 * - `abas`: os polígonos das abas, na ordem de `pares`;
 * - `maiorAresta`: a maior aresta do sólido, nas mesmas unidades.
 */
export function organizaRede(M) {
  const s = M.solido;
  let polys = rede2D(s, M.rede);
  const ang = anguloDeitado(polys.flat());
  const c = Math.cos(ang), sn = Math.sin(ang);
  polys = polys.map((p) => p.map(([x, y]) => [x * c - y * sn, x * sn + y * c]));

  // quais arestas da rede são dobra (ligam uma face à mãe) e quais são corte
  const dobraDe = s.F.map(() => new Set());
  M.rede.dobra.forEach((d, f) => { if (d) { dobraDe[f].add(chave(d.a, d.b)); dobraDe[d.pai].add(chave(d.a, d.b)); } });
  const vincos = [], cortes = [], porAresta = new Map();
  s.F.forEach((f, k) => f.forEach((i, j) => {
    const ch = chave(i, f[(j + 1) % f.length]);
    const seg = [polys[k][j], polys[k][(j + 1) % f.length]];
    if (dobraDe[k].has(ch)) {
      // a dobra aparece nas duas faces, no mesmo lugar: entra só pela filha
      const d = M.rede.dobra[k];
      if (d && chave(d.a, d.b) === ch) vincos.push(seg);
    } else {
      cortes.push(seg);
      if (!porAresta.has(ch)) porAresta.set(ch, []);
      porAresta.get(ch).push({ k, seg });
    }
  }));

  /* Abas: uma por par de arestas que se colam, do lado em que não bate em nada.
     Se nenhum dos dois lados couber, a aba encolhe antes de invadir uma face. */
  const lado = Math.max(...cortes.map(([a, b]) => dist([...a, 0], [...b, 0])));
  const ocupados = [...polys];
  const escala = Math.max(...polys.flat().map(([x, y]) => Math.hypot(x, y)));
  const fazAba = ([a, b], f) => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const d = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const fora = [d[1], -d[0]]; // face anti-horária: o lado de fora fica à direita
    const w = f * Math.min(0.22 * lado, 0.38 * L), recuo = Math.min(w * 0.9, 0.3 * L);
    return [a, b,
      [b[0] + fora[0] * w - d[0] * recuo, b[1] + fora[1] * w - d[1] * recuo],
      [a[0] + fora[0] * w + d[0] * recuo, a[1] + fora[1] * w + d[1] * recuo]];
  };
  const bate = (aba) => ocupados.some((o) => redeSobrepoe([aba, o], escala));
  const pares = [];
  for (const segs of porAresta.values()) {
    if (segs.length !== 2) continue;
    let escolha = null;
    for (const f of [1, 0.6, 0.35]) {
      for (let i = 0; i < 2 && !escolha; i++) {
        const aba = fazAba(segs[i].seg, f);
        if (!bate(aba)) escolha = { aba, lado: i };
      }
      if (escolha) break;
    }
    escolha ??= { aba: fazAba(segs[0].seg, 0.35), lado: 0 };
    ocupados.push(escolha.aba);
    pares.push({ segs, ...escolha });
  }

  const maiorAresta = Math.max(...arestas(s).map((e) => dist(s.V[e.a], s.V[e.b])));
  return { polys, vincos, cortes, pares, abas: pares.map((p) => p.aba), maiorAresta };
}

/** Gira todos os pontos da rede organizada em 90° (para a folha em pé). */
export function giraRede90(R) {
  const g = (p) => [-p[1], p[0]];
  const seg = (s) => s.map(g);
  return {
    ...R,
    polys: R.polys.map((p) => p.map(g)),
    vincos: R.vincos.map(seg),
    cortes: R.cortes.map(seg),
    pares: R.pares.map((p) => ({ ...p, aba: p.aba.map(g), segs: p.segs.map((x) => ({ ...x, seg: seg(x.seg) })) })),
    abas: R.abas.map((a) => a.map(g)),
  };
}

/** Caixa dos pontos: [xmin, ymin, xmax, ymax]. */
export function caixa(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return [x0, y0, x1, y1];
}
