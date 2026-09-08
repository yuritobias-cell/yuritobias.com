/* ==========================================================================
   Conjunto solução em ℝ: lista ordenada de intervalos disjuntos.
   [] é o vazio e um intervalo com as duas pontas nulas é ℝ; ponto isolado
   {r} é o intervalo [r, r]. Serve às inequações (estudo de sinal) e à reta
   numérica desenhada em SVG.
   ========================================================================== */
import { REL, VIRA, numR, numVal, numIgual, rac, rVal, htmlVar, htmlNum, txtNum } from './matematica.js';

export const intv = (ini, iniFec, fim, fimFec) => ({ ini, iniFec, fim, fimFec });

/* Estudo do sinal de uma expressão de 2º grau (ou de um produto de dois
   fatores lineares, que tem exatamente o mesmo sinal do quociente).
   L = sinal do coeficiente líder; raizes = [] , [r] (dupla) ou [r1 < r2]. */
export function solucaoSinal(L, raizes, rel) {
  const querPositivo = rel === 'gt' || rel === 'ge';
  const fechado = rel === 'ge' || rel === 'le';

  if (raizes.length === 0) {                       // Δ < 0: sinal constante, igual ao de L
    const positiva = L > 0;
    return positiva === querPositivo ? [intv(null, false, null, false)] : [];
  }
  if (raizes.length === 1) {                       // Δ = 0: sinal de L, zerando na raiz dupla
    const r = raizes[0];
    const positiva = L > 0;
    if (positiva === querPositivo) {
      return fechado ? [intv(null, false, null, false)]
                     : [intv(null, false, r, false), intv(r, false, null, false)];
    }
    return fechado ? [intv(r, true, r, true)] : [];
  }
  const [r1, r2] = raizes;                         // Δ > 0: −L entre as raízes, L fora
  const dentro = (L > 0) !== querPositivo;         // a região pedida é o miolo?
  if (dentro) return [intv(r1, fechado, r2, fechado)];
  return [intv(null, false, r1, fechado), intv(r2, fechado, null, false)];
}

/* Tira um ponto do conjunto (condição de existência do quociente). */
export function excluiPonto(sol, p) {
  const out = [];
  for (const i of sol) {
    const vp = numVal(p);
    const depoisDoIni = i.ini === null || numVal(i.ini) < vp - 1e-9;
    const antesDoFim  = i.fim === null || numVal(i.fim) > vp + 1e-9;
    if (depoisDoIni && antesDoFim) {               // ponto no miolo: parte o intervalo em dois
      out.push(intv(i.ini, i.iniFec, p, false));
      out.push(intv(p, false, i.fim, i.fimFec));
    } else if (i.ini !== null && numIgual(i.ini, p)) {
      out.push(intv(i.ini, false, i.fim, i.fimFec));
    } else if (i.fim !== null && numIgual(i.fim, p)) {
      out.push(intv(i.ini, i.iniFec, i.fim, false));
    } else {
      out.push(i);
    }
  }
  /* [r, r] com r excluído deixa de existir */
  return out.filter((i) => !(i.ini !== null && i.fim !== null && numIgual(i.ini, i.fim) && !(i.iniFec && i.fimFec)));
}

/* Solução de uma inequação do 1º grau: m·x ⋛ n. */
export function solucaoLinear(m, n, rel) {
  const r = numR(rac(n.n * m.d, n.d * m.n));       // n / m
  const rl = rVal(m) < 0 ? VIRA[rel] : rel;
  if (rl === 'gt') return { sol: [intv(r, false, null, false)], rel: rl, raiz: r };
  if (rl === 'ge') return { sol: [intv(r, true,  null, false)], rel: rl, raiz: r };
  if (rl === 'lt') return { sol: [intv(null, false, r, false)], rel: rl, raiz: r };
  return { sol: [intv(null, false, r, true)], rel: rl, raiz: r };
}

/* --- notação por compreensão --------------------------------------------- */
export function condHtml(i, v) {
  const x = htmlVar(v);
  if (i.ini === null && i.fim === null) return '';
  if (i.ini === null) return `${x} ${i.fimFec ? REL.le : REL.lt} ${htmlNum(i.fim)}`;
  if (i.fim === null) return `${x} ${i.iniFec ? REL.ge : REL.gt} ${htmlNum(i.ini)}`;
  return `${htmlNum(i.ini)} ${i.iniFec ? REL.le : REL.lt} ${x} ${i.fimFec ? REL.le : REL.lt} ${htmlNum(i.fim)}`;
}

export function conjuntoHtml(sol, v) {
  if (!sol.length) return 'S = ∅';
  const x = htmlVar(v);
  if (sol.length === 1) {
    const i = sol[0];
    if (i.ini === null && i.fim === null) return 'S = ℝ';
    if (i.ini !== null && i.fim !== null && numIgual(i.ini, i.fim)) return `S = {${htmlNum(i.ini)}}`;
    return `S = {${x} ∈ ℝ | ${condHtml(i, v)}}`;
  }
  if (sol.length === 2) {
    const [a, b] = sol;
    const furo = a.ini === null && b.fim === null && a.fim !== null && b.ini !== null
      && numIgual(a.fim, b.ini) && !a.fimFec && !b.iniFec;
    if (furo) return `S = {${x} ∈ ℝ | ${x} ≠ ${htmlNum(a.fim)}}`;
  }
  return `S = {${x} ∈ ℝ | ${sol.map((i) => condHtml(i, v)).join(' ou ')}}`;
}

/* --- reta numérica -------------------------------------------------------- */
export function retaSvg(sol, marcas) {
  const W = 264, H = 48, Y = 20, x0 = 18, x1 = W - 18;
  const n = marcas.length;
  const px = marcas.map((_, i) => (n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * (i + 1)) / (n + 1)));
  const posDe = (num) => {
    for (let i = 0; i < marcas.length; i++) if (numIgual(marcas[i], num)) return px[i];
    return (x0 + x1) / 2;
  };

  let s = `<svg class="reta" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-hidden="true">`;
  /* faixas da solução, por baixo */
  for (const i of sol) {
    const a = i.ini === null ? 6 : posDe(i.ini);
    const b = i.fim === null ? W - 6 : posDe(i.fim);
    if (b - a < 0.5) continue;
    s += `<line x1="${a}" y1="${Y}" x2="${b}" y2="${Y}" stroke="#1B4F4F" stroke-opacity=".28" stroke-width="7" stroke-linecap="butt"/>`;
  }
  /* eixo com setas nas duas pontas */
  s += `<line x1="6" y1="${Y}" x2="${W - 6}" y2="${Y}" stroke="#57534E" stroke-width="1.2"/>`;
  s += `<path d="M6 ${Y} l7 -3.5 v7 z" fill="#57534E"/><path d="M${W - 6} ${Y} l-7 -3.5 v7 z" fill="#57534E"/>`;
  /* pontos marcados */
  marcas.forEach((m, i) => {
    let fechado = false, aberto = false;
    for (const iv of sol) {
      if (iv.ini !== null && numIgual(iv.ini, m)) { iv.iniFec ? (fechado = true) : (aberto = true); }
      if (iv.fim !== null && numIgual(iv.fim, m)) { iv.fimFec ? (fechado = true) : (aberto = true); }
    }
    const dentro = sol.some((iv) => {
      const va = iv.ini === null ? -Infinity : numVal(iv.ini);
      const vb = iv.fim === null ?  Infinity : numVal(iv.fim);
      return numVal(m) > va + 1e-9 && numVal(m) < vb - 1e-9;
    });
    const cheio = fechado || (dentro && !aberto);
    s += `<circle cx="${px[i]}" cy="${Y}" r="4.6" fill="${cheio ? '#1B4F4F' : '#fff'}" stroke="#1B4F4F" stroke-width="1.6"/>`;
    s += `<text x="${px[i]}" y="${Y + 21}" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#1a1a1a">${txtNum(m)}</text>`;
  });
  return s + '</svg>';
}
