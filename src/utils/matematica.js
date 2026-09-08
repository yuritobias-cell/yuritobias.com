/* ==========================================================================
   Núcleo matemático compartilhado pelas ferramentas geradoras.

   Vanilla JS de navegador (por isso .js, e não .ts: os utilitários .ts desta
   pasta rodam no build e são checados pelo `astro check`; este aqui é
   importado pelos <script> das páginas de /ferramentas).

   Nada aqui toca no DOM — só aritmética exata e a tipografia da matemática
   em HTML/CSS, já que o site não carrega KaTeX nem MathJax.
   ========================================================================== */

export const MENOS = '−';                                  // U+2212 — o menos de verdade, não o hífen
export const REL  = { eq:'=', lt:'&lt;', gt:'&gt;', le:'≤', ge:'≥' };
export const VIRA  = { lt:'gt', gt:'lt', le:'ge', ge:'le' };   // ao multiplicar/dividir por negativo
export const SINAIS = ['lt', 'gt', 'le', 'ge'];

export const inteiro = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const naoZero = (a, b) => { let n = 0; while (n === 0) n = inteiro(a, b); return n; };
export const escolhe = (arr) => arr[inteiro(0, arr.length - 1)];
export const moeda = (p = 0.5) => Math.random() < p;
export const maisMenos = (p = 0.5) => (moeda(p) ? -1 : 1);

export function embaralha(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = inteiro(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* Sorteio ponderado: pares [valor, peso]. */
export function pesado(pares) {
  const total = pares.reduce((s, p) => s + p[1], 0);
  let x = Math.random() * total;
  for (const [v, p] of pares) { x -= p; if (x <= 0) return v; }
  return pares[pares.length - 1][0];
}
/* ==========================================================================
   1) ARITMÉTICA EXATA
   Racionais {n, d} sempre reduzidos, com o sinal no numerador. Nada de ponto
   flutuante nas contas: o gerador precisa saber que 1/3 é 1/3.
   ========================================================================== */
export const mdc = (a, b) => (b ? mdc(b, a % b) : Math.abs(a));

export function rac(n, d = 1) {
  if (d === 0) throw new Error('denominador zero');
  if (d < 0) { n = -n; d = -d; }
  const g = mdc(Math.abs(n), d) || 1;
  return { n: n / g, d: d / g };
}
export const rSoma = (a, b) => rac(a.n * b.d + b.n * a.d, a.d * b.d);
export const rSub  = (a, b) => rac(a.n * b.d - b.n * a.d, a.d * b.d);
export const rMul  = (a, b) => rac(a.n * b.n, a.d * b.d);
export const rDiv  = (a, b) => rac(a.n * b.d, a.d * b.n);
export const rNeg  = (a) => ({ n: -a.n, d: a.d });
export const rVal  = (a) => a.n / a.d;
export const rZero = (a) => a.n === 0;
export const rInt  = (a) => a.d === 1;
export const rIgual = (a, b) => a.n === b.n && a.d === b.d;

export const quadradoPerfeito = (n) => n >= 0 && Number.isInteger(Math.sqrt(n));

/* √n = f·√d, com d livre de quadrados. */
export function simplificaRadical(n) {
  let f = 1, d = n;
  for (let i = 2; i * i <= d; i++) { while (d % (i * i) === 0) { d /= i * i; f *= i; } }
  return { f, d };
}
/* ==========================================================================
   2) NÚMEROS DA RESPOSTA
   Duas formas: racional {t:'r'} e radical {t:'q'} = (p + q√r)/s.
   ========================================================================== */
export const numR = (v) => ({ t: 'r', v });
export const numQ = (p, q, r, s) => ({ t: 'q', p, q, r, s });

export const numVal = (x) => (x.t === 'r' ? rVal(x.v) : (x.p + x.q * Math.sqrt(x.r)) / x.s);
export const numOrd = (a, b) => numVal(a) - numVal(b);
export const numIgual = (a, b) => Math.abs(numVal(a) - numVal(b)) < 1e-9;

/* Raiz de ax² + bx + c pela fórmula, já simplificada. */
export function raizQuadratica(a, b, delta, sgn) {
  if (delta === 0) return numR(rac(-b, 2 * a));
  const { f, d } = simplificaRadical(delta);
  if (d === 1) return numR(rac(-b + sgn * f, 2 * a));      // Δ é quadrado perfeito: raiz racional
  let p = -b, q = sgn * f, s = 2 * a;
  if (s < 0) { p = -p; q = -q; s = -s; }
  const g = mdc(mdc(Math.abs(p), Math.abs(q)), s) || 1;
  return numQ(p / g, q / g, d, s / g);
}
/* ==========================================================================
   3) TIPOGRAFIA DA MATEMÁTICA
   Frações empilhadas e radical com barra são feitos em HTML/CSS — o site não
   carrega KaTeX nem MathJax.
   ========================================================================== */
export const htmlVar = (v) => `<i>${v}</i>`;
export const htmlFrac = (n, d) => `<span class="fr"><span class="fr-n">${n}</span><span class="fr-d">${d}</span></span>`;
export const htmlRadical = (n) => `<span class="rad">√<span class="rad-b">${n}</span></span>`;

/* Racional sem sinal explícito de + na frente. */
export function htmlRac(r) {
  const s = r.n < 0 ? MENOS : '';
  const a = Math.abs(r.n);
  return r.d === 1 ? s + a : s + htmlFrac(a, r.d);
}
export function txtRac(r) {
  const s = r.n < 0 ? MENOS : '';
  return r.d === 1 ? s + Math.abs(r.n) : s + Math.abs(r.n) + '/' + r.d;
}

/* Um número da resposta (racional ou radical), em HTML e em texto puro
   (o texto vai nos rótulos da reta numérica, que é SVG e não empilha frações). */
export function htmlNum(x) {
  if (x.t === 'r') return htmlRac(x.v);
  const rad = (Math.abs(x.q) === 1 ? '' : Math.abs(x.q)) + htmlRadical(x.r);
  let cima;
  if (x.p === 0) cima = (x.q < 0 ? MENOS : '') + rad;
  else cima = `${x.p < 0 ? MENOS + Math.abs(x.p) : x.p} ${x.q < 0 ? MENOS : '+'} ${rad}`;
  return x.s === 1 ? cima : htmlFrac(cima, x.s);
}
export function txtNum(x) {
  if (x.t === 'r') return txtRac(x.v);
  const rad = (Math.abs(x.q) === 1 ? '' : Math.abs(x.q)) + '√' + x.r;
  let cima;
  if (x.p === 0) cima = (x.q < 0 ? MENOS : '') + rad;
  else cima = `${x.p < 0 ? MENOS + Math.abs(x.p) : x.p} ${x.q < 0 ? MENOS : '+'} ${rad}`;
  return x.s === 1 ? cima : (x.p === 0 ? cima + '/' + x.s : `(${cima})/${x.s}`);
}

/* Um monômio |c|·xᵍ, sem sinal (o sinal é do lado que o contém). */
export function htmlMono(abs, g, v) {
  if (g === 0) return htmlRac(abs);
  const pot = g === 1 ? htmlVar(v) : `${htmlVar(v)}<sup>${g}</sup>`;
  const coefTxt = abs.n === 1 ? '' : String(abs.n);
  if (abs.d === 1) return coefTxt + pot;
  return htmlFrac(coefTxt + pot, abs.d);        // (3x)/4 sai como fração empilhada
}

/* Um lado da igualdade: lista de termos {c: racional, g: grau}. */
export function htmlLado(termos, v) {
  const vis = termos.filter((t) => !rZero(t.c));
  if (!vis.length) return '0';
  return vis.map((t, i) => {
    const neg = t.c.n < 0;
    const corpo = htmlMono({ n: Math.abs(t.c.n), d: t.c.d }, t.g, v);
    if (i === 0) return (neg ? MENOS : '') + corpo;
    return (neg ? ` ${MENOS} ` : ' + ') + corpo;
  }).join('');
}

/* Fator do tipo (2x − 3), sempre entre parênteses. */
export const htmlFator = (a, b, v) => `(${htmlLado([{ c: rac(a), g: 1 }, { c: rac(b), g: 0 }], v)})`;

/* Coeficiente que multiplica um parêntese: 1 some, −1 vira só o sinal. */
export const htmlCoefFator = (k) => (k === 1 ? '' : k === -1 ? MENOS : (k < 0 ? MENOS + Math.abs(k) : String(k)));

export const linha = (esq, rel, dir) => `${esq} ${REL[rel]} ${dir}`;

/* --- ajudantes de gabarito ------------------------------------------------ */
export const nInt = (n) => (n < 0 ? MENOS + Math.abs(n) : String(n));
export const par  = (n) => (n < 0 ? `(${MENOS}${Math.abs(n)})` : String(n));
export const mat  = (html, final) => ({ tipo: 'mat', html, final: !!final });
export const nota = (html) => ({ tipo: 'nota', html });

/* --------------------------------------------------------------------------
   Soma de termos com símbolos livres — serve a expressões de várias
   incógnitas (2x + 3y − z), que htmlLado, preso a uma variável e ao grau,
   não cobre. Cada termo é {c: racional, s: html do símbolo} e s vazio é o
   termo independente.
   -------------------------------------------------------------------------- */
function htmlCoefSimbolo(abs, s) {
  const c = abs.n === 1 ? '' : String(abs.n);
  return abs.d === 1 ? c + s : htmlFrac(c + s, abs.d);
}

export function htmlSoma(termos) {
  const vis = termos.filter((t) => !rZero(t.c));
  if (!vis.length) return '0';
  return vis.map((t, i) => {
    const neg = t.c.n < 0;
    const abs = { n: Math.abs(t.c.n), d: t.c.d };
    const corpo = t.s ? htmlCoefSimbolo(abs, t.s) : htmlRac(abs);
    if (i === 0) return (neg ? MENOS : '') + corpo;
    return (neg ? ` ${MENOS} ` : ' + ') + corpo;
  }).join('');
}
