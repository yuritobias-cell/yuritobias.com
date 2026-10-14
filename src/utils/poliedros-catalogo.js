/* Catálogo do Simulador de Poliedros: o que cada sólido é, como se constrói e como
   se apresenta. A geometria está em poliedros.js; aqui só há nomes, textos e
   parâmetros. Os prismas e as pirâmides são uma entrada só cada, com o número de
   lados, a altura e a inclinação como parâmetros. */
import {
  NUVENS, casco, papelPorLados, poligonoRegular, prisma, piramide, tronco, poePontas,
  apoiaNaFace, planifica, ehConvexo, centroide, mul, norma, sub, aplica,
} from './poliedros.js';

export const GRUPOS = [
  { id: 'platonicos', nome: 'Platônicos' },
  { id: 'prismas', nome: 'Prismas' },
  { id: 'piramides', nome: 'Pirâmides' },
  { id: 'arquimedianos', nome: 'Arquimedianos' },
  { id: 'outros', nome: 'Outros' },
  { id: 'concavos', nome: 'Côncavos' },
];

/* nomes dos polígonos: [singular, plural] */
const POLIGONO = {
  3: ['triângulo', 'triângulos'], 4: ['quadrilátero', 'quadriláteros'], 5: ['pentágono', 'pentágonos'],
  6: ['hexágono', 'hexágonos'], 7: ['heptágono', 'heptágonos'], 8: ['octógono', 'octógonos'],
  9: ['eneágono', 'eneágonos'], 10: ['decágono', 'decágonos'], 12: ['dodecágono', 'dodecágonos'],
};
const REGULAR = { 3: ['triângulo equilátero', 'triângulos equiláteros'], 4: ['quadrado', 'quadrados'] };
const ADJ_BASE = {
  3: 'triangular', 4: 'quadrangular', 5: 'pentagonal', 6: 'hexagonal', 7: 'heptagonal',
  8: 'octogonal', 9: 'eneagonal', 10: 'decagonal',
};
export const nomePoligono = (n, qtd = 1, regular = false) => {
  const t = (regular && REGULAR[n]) || POLIGONO[n] || [`polígono de ${n} lados`, `polígonos de ${n} lados`];
  return qtd === 1 ? t[0] : t[1];
};
const regularPlural = (n, qtd) =>
  REGULAR[n] ? nomePoligono(n, qtd, true) : `${nomePoligono(n, qtd)} ${qtd === 1 ? 'regular' : 'regulares'}`;

/** Escala os vértices para o raio da esfera circunscrita valer `r`. */
function escalaPara(s, r) {
  const c = centroide(s.V);
  const m = Math.max(...s.V.map((p) => norma(sub(p, c))));
  return { ...s, V: s.V.map((p) => mul(sub(p, c), r / m)) };
}
const doCasco = (nuvem, r = 1.55) => papelPorLados(escalaPara(casco(NUVENS[nuvem]()), r));

/** Legenda das faces dos sólidos do casco: "8 triângulos", "6 quadrados"… */
const legendaPorLados = (s) => {
  const qtd = {};
  s.F.forEach((f) => { qtd[f.length] = (qtd[f.length] || 0) + 1; });
  return Object.keys(qtd).map(Number).sort((a, b) => a - b)
    .map((n) => ({ papel: 'n' + n, texto: `${qtd[n]} ${regularPlural(n, qtd[n])}` }));
};

/* ------------------------------------------------------------------ */

const PLATONICOS = [
  {
    id: 'tetraedro', nome: 'Tetraedro regular', curto: 'Tetraedro', nuvem: 'tetraedro',
    resumo: 'Quatro triângulos equiláteros, três em cada vértice. É a pirâmide triangular em que todas as faces são iguais — qualquer uma delas pode ser a base.',
  },
  {
    id: 'cubo', nome: 'Hexaedro regular (cubo)', curto: 'Cubo', nuvem: 'cubo', estilo: ['tira'],
    // montado como prisma, para a planificação sair na cruz clássica
    construir: () => papelPorLados(prisma(poligonoRegular(4, 1.55 / Math.sqrt(1.5)), [0, 2 * 1.55 / Math.sqrt(3), 0])),
    resumo: 'Seis quadrados, três em cada vértice. É ao mesmo tempo prisma quadrangular reto e paralelepípedo — e a planificação em cruz é só uma das 11 possíveis.',
  },
  {
    id: 'octaedro', nome: 'Octaedro regular', curto: 'Octaedro', nuvem: 'octaedro',
    resumo: 'Oito triângulos equiláteros, quatro em cada vértice. Parecem duas pirâmides quadrangulares coladas pela base.',
  },
  {
    id: 'dodecaedro', nome: 'Dodecaedro regular', curto: 'Dodecaedro', nuvem: 'dodecaedro',
    resumo: 'Doze pentágonos regulares, três em cada vértice. É o único poliedro de Platão com faces pentagonais.',
  },
  {
    id: 'icosaedro', nome: 'Icosaedro regular', curto: 'Icosaedro', nuvem: 'icosaedro',
    resumo: 'Vinte triângulos equiláteros, cinco em cada vértice. Com mais de cinco triângulos por vértice a soma dos ângulos chegaria a 360° — e não fecharia um bico.',
  },
].map((d) => ({ grupo: 'platonicos', regular: true, construir: () => doCasco(d.nuvem), legenda: legendaPorLados, ...d }));

const ARQUIMEDIANOS = [
  {
    id: 'tetraedro-truncado', nome: 'Tetraedro truncado', curto: 'Tetraedro truncado', nuvem: 'tetraedroTruncado',
    resumo: 'Corte os quatro bicos de um tetraedro regular: cada vértice vira um triângulo e cada face vira um hexágono.',
  },
  {
    id: 'cuboctaedro', nome: 'Cuboctaedro', curto: 'Cuboctaedro', nuvem: 'cuboctaedro',
    resumo: 'Triângulos e quadrados alternados, dois de cada em todo vértice. Fica no meio do caminho entre o cubo e o octaedro.',
  },
  {
    id: 'cubo-truncado', nome: 'Cubo truncado', curto: 'Cubo truncado', nuvem: 'cuboTruncado',
    resumo: 'Os oito bicos do cubo cortados até cada quadrado virar um octógono regular; no lugar de cada vértice, um triângulo.',
  },
  {
    id: 'octaedro-truncado', nome: 'Octaedro truncado', curto: 'Octaedro truncado', nuvem: 'octaedroTruncado',
    resumo: 'Os seis bicos do octaedro cortados viram quadrados e os triângulos viram hexágonos. Cópias dele preenchem o espaço sem deixar vão.',
  },
  {
    id: 'rombicuboctaedro', nome: 'Rombicuboctaedro', curto: 'Rombicuboctaedro', nuvem: 'rombicuboctaedro',
    resumo: 'Dezoito quadrados e oito triângulos: um triângulo e três quadrados em cada vértice.',
  },
  {
    id: 'icosidodecaedro', nome: 'Icosidodecaedro', curto: 'Icosidodecaedro', nuvem: 'icosidodecaedro',
    resumo: 'As faces do icosaedro e do dodecaedro juntas: vinte triângulos e doze pentágonos, alternados em cada vértice.',
  },
  {
    id: 'icosaedro-truncado', nome: 'Icosaedro truncado', curto: 'Icosaedro truncado', nuvem: 'icosaedroTruncado',
    resumo: 'A bola de futebol clássica: os doze bicos do icosaedro cortados viram pentágonos, e os triângulos viram hexágonos.',
  },
].map((d) => ({ ...d, grupo: 'arquimedianos', construir: () => doCasco(d.nuvem, 1.7), legenda: legendaPorLados }));

/* ---------------- prismas e pirâmides ---------------- */

export const LADOS = [3, 4, 5, 6, 7, 8, 10];
const raioBase = (n) => (n === 3 ? 1.25 : n === 4 ? 1.15 : 1.1);

const PRISMA = {
  id: 'prisma', grupo: 'prismas', parametrico: 'prisma', estilo: ['tira', 'estrela'],
  nome: ({ n, inclinacao }) => `Prisma ${ADJ_BASE[n]} ${inclinacao ? 'oblíquo' : 'reto'}`,
  curto: ({ n }) => `Prisma ${ADJ_BASE[n]}`,
  resumo: ({ n, inclinacao }) => inclinacao
    ? `Duas bases iguais e paralelas — ${nomePoligono(n, 2)} — ligadas por ${n} paralelogramos. As arestas laterais são inclinadas em relação às bases — por isso medem mais que a altura.`
    : `Duas bases iguais e paralelas — ${nomePoligono(n, 2)} — ligadas por ${n} retângulos. As arestas laterais são perpendiculares às bases e medem exatamente a altura. Base regular e prisma reto: é um prisma regular.`,
  construir({ n, h, inclinacao }) {
    const d = h * Math.tan((inclinacao * Math.PI) / 180);
    const base = poligonoRegular(n, raioBase(n));
    const s = prisma(base, [d, h, 0]);
    // aresta lateral e altura destacadas: as do vértice da frente, à direita
    const k = 0;
    const B = s.V[k], T = s.V[n + k];
    s.extras = { aresta: [B, T], altura: [T, [T[0], 0, T[2]]] };
    return s;
  },
  legenda: (_, { n, inclinacao }) => [
    { papel: 'base', texto: `2 bases: ${regularPlural(n, 2)}` },
    { papel: 'lateral', texto: `${n} faces laterais: ${inclinacao ? 'paralelogramos' : 'retângulos'}` },
  ],
};

const PIRAMIDE = {
  id: 'piramide', grupo: 'piramides', parametrico: 'piramide', estilo: ['estrela'],
  nome: ({ n, inclinacao }) => `Pirâmide ${ADJ_BASE[n]} ${inclinacao ? 'oblíqua' : 'reta'}`,
  curto: ({ n }) => `Pirâmide ${ADJ_BASE[n]}`,
  resumo: ({ n, inclinacao }) => inclinacao
    ? `Uma base (um ${nomePoligono(n)}) e ${n} triângulos que se encontram no vértice. O pé da altura não é o centro da base, e as arestas laterais deixam de ser iguais — às vezes o pé cai até fora da base.`
    : `Uma base (um ${nomePoligono(n)}) e ${n} triângulos isósceles iguais que se encontram no vértice. O pé da altura é o centro da base e todas as arestas laterais têm a mesma medida. Base regular e pirâmide reta: é uma pirâmide regular.`,
  construir({ n, h, inclinacao }) {
    const d = h * Math.tan((inclinacao * Math.PI) / 180);
    const s = piramide(poligonoRegular(n, raioBase(n) * 1.1), [d, h, 0]);
    const A = s.V[n];
    s.extras = { altura: [A, [A[0], 0, A[2]]], centro: [0, 0, 0] };
    return s;
  },
  legenda: (_, { n, inclinacao }) => [
    { papel: 'base', texto: `1 base: ${regularPlural(n, 1)}` },
    { papel: 'lateral', texto: `${n} faces laterais: ${inclinacao ? 'triângulos' : 'triângulos isósceles iguais'}` },
  ],
};

/* ---------------- outros ---------------- */

const OUTROS = [
  {
    id: 'paralelepipedo', nome: 'Paralelepípedo reto-retângulo', curto: 'Paralelepípedo', estilo: ['tira'],
    resumo: 'O formato da caixa de sapato: seis retângulos, opostos dois a dois. É um prisma reto de base retangular — e qualquer par de faces opostas pode ser tomado como base.',
    construir: () => prisma([[-1.3, -0.75], [1.3, -0.75], [1.3, 0.75], [-1.3, 0.75]], [0, 1.4, 0]),
    legenda: () => [
      { papel: 'base', texto: '2 bases: retângulos' },
      { papel: 'lateral', texto: '4 faces laterais: retângulos' },
    ],
  },
  {
    id: 'tronco-piramide', nome: 'Tronco de pirâmide quadrangular', curto: 'Tronco de pirâmide', estilo: ['estrela', 'tira'],
    resumo: 'O que sobra de uma pirâmide cortada por um plano paralelo à base: duas bases quadradas de tamanhos diferentes e quatro trapézios.',
    construir: () => tronco(poligonoRegular(4, 1.45), 0.5, 1.5),
    legenda: () => [
      { papel: 'base', texto: '2 bases: quadrados de tamanhos diferentes' },
      { papel: 'lateral', texto: '4 faces laterais: trapézios isósceles' },
    ],
  },
  {
    id: 'bipiramide', nome: 'Bipirâmide pentagonal', curto: 'Bipirâmide',
    resumo: 'Duas pirâmides pentagonais coladas pela base. A base comum some: sobram só os dez triângulos — e o pentágono vira um “cinto” de arestas.',
    construir: () => {
      const p = poligonoRegular(5, 1.2).map(([x, z]) => [x, 0, z]);
      return papelPorLados(casco([...p, [0, 1.35, 0], [0, -1.35, 0]]));
    },
    legenda: () => [{ papel: 'n3', texto: '10 triângulos isósceles' }],
  },
].map((d) => ({ ...d, grupo: 'outros' }));

/* ---------------- côncavos ---------------- */

const baseL = [[-1.2, -1.1], [1.2, -1.1], [1.2, -0.1], [0, -0.1], [0, 1.1], [-1.2, 1.1]];
const baseEstrela = (() => {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + (Math.PI * k) / 5, r = k % 2 ? 0.62 : 1.45;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
})();
const baseSeta = [[0, -1.45], [1.35, 1.05], [0, 0.35], [-1.35, 1.05]];

const CONCAVOS = [
  {
    id: 'prisma-l', nome: 'Prisma de base em L', curto: 'Prisma em L', estilo: ['tira', 'estrela'],
    resumo: 'Um prisma cuja base é um hexágono não convexo, em forma de L. Os pontos das duas “pernas” do L enxergam um ao outro por fora do sólido.',
    construir: () => prisma(baseL, [0, 1.3, 0]),
    legenda: () => [
      { papel: 'base', texto: '2 bases: hexágonos não convexos (em L)' },
      { papel: 'lateral', texto: '6 faces laterais: retângulos' },
    ],
  },
  {
    id: 'prisma-estrela', nome: 'Prisma de base estrelada', curto: 'Prisma estrelado', estilo: ['tira', 'estrela'],
    resumo: 'Base em estrela de cinco pontas — um decágono não convexo. Ligue a ponta de duas pontas vizinhas e o segmento passa pelo ar.',
    construir: () => prisma(baseEstrela, [0, 0.9, 0]),
    legenda: () => [
      { papel: 'base', texto: '2 bases: decágonos não convexos (estrelas)' },
      { papel: 'lateral', texto: '10 faces laterais: retângulos' },
    ],
  },
  {
    id: 'piramide-seta', nome: 'Pirâmide de base côncava', curto: 'Pirâmide de base côncava', estilo: ['estrela'],
    resumo: 'Base em forma de ponta de seta: um quadrilátero não convexo. Toda pirâmide de base côncava é um poliedro côncavo.',
    construir: () => piramide(baseSeta, [0, 1.8, 0.1]),
    legenda: () => [
      { papel: 'base', texto: '1 base: quadrilátero não convexo' },
      { papel: 'lateral', texto: '4 faces laterais: triângulos' },
    ],
  },
  {
    id: 'cubo-escavado', nome: 'Cubo escavado', curto: 'Cubo escavado',
    resumo: 'Um cubo com uma pirâmide afundada no lugar da face de cima — como uma caixa com um funil. Os segmentos entre bordas opostas da boca passam por fora.',
    construir: () => {
      const s = prisma(poligonoRegular(4, Math.SQRT2), [0, 2, 0]);
      const out = poePontas(s, (k) => k === 1, () => [0, 0.75, 0], 'cavidade');
      out.papel = out.papel.map((p) => p === 'cavidade' ? p : 'n4');
      return out;
    },
    legenda: () => [
      { papel: 'n4', texto: '5 quadrados' },
      { papel: 'cavidade', texto: '4 triângulos (a cavidade)' },
    ],
  },
  {
    id: 'octaedro-estrelado', nome: 'Octaedro estrelado', curto: 'Octaedro estrelado',
    resumo: 'Um octaedro com uma pirâmide triangular sobre cada face — a “estrela de Kepler”. Visto de longe, são dois tetraedros que se atravessam.',
    construir: () => {
      const o = escalaPara(casco(NUVENS.octaedro()), 1);
      const s = poePontas(o, () => true, (pts) => {
        const c = centroide(pts);
        return mul(c, 3); // centro da face (±⅓,±⅓,±⅓) → bico (±1,±1,±1)
      }, 'n3');
      return escalaPara(s, 1.6);
    },
    legenda: () => [{ papel: 'n3', texto: '24 triângulos equiláteros' }],
  },
].map((d) => ({ ...d, grupo: 'concavos' }));

export const CATALOGO = [...PLATONICOS, PRISMA, PIRAMIDE, ...ARQUIMEDIANOS, ...OUTROS, ...CONCAVOS];
export const porId = (id) => CATALOGO.find((e) => e.id === id);
export const doGrupo = (g) => CATALOGO.filter((e) => e.grupo === g);

/** Valor de um campo que pode depender dos parâmetros. */
export const valor = (campo, params) => (typeof campo === 'function' ? campo(params) : campo);

/**
 * Monta tudo o que a página precisa de um sólido: a geometria apoiada na face-raiz
 * da planificação, a rede, a legenda das faces e os pontos auxiliares (altura,
 * aresta lateral) já na mesma posição do sólido.
 */
export function monta(entrada, params = {}) {
  const bruto = entrada.construir(params);
  if (!bruto.papel) papelPorLados(bruto);
  const rede = planifica(bruto, { estilo: entrada.estilo });
  if (!rede) throw new Error(`[poliedros] sem planificação para ${entrada.id}`);
  const s = apoiaNaFace(bruto, rede.raiz);
  const extras = {};
  for (const [k, v] of Object.entries(bruto.extras || {}))
    extras[k] = Array.isArray(v[0]) ? v.map((p) => aplica(s.T, p)) : aplica(s.T, v);
  return {
    entrada,
    params,
    solido: s,
    rede,
    extras,
    convexo: ehConvexo(s),
    nome: valor(entrada.nome, params),
    resumo: valor(entrada.resumo, params),
    legenda: entrada.legenda(s, params),
  };
}

