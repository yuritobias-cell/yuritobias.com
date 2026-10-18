/* ================================================================
   Princípio de Cavalieri: os pares de sólidos do simulador.

   Cada sólido é descrito pelas suas seções horizontais: secao(z, d)
   devolve o contorno externo e o interno (o furo) na altura z, como
   pontos [x, y] do plano horizontal — o mesmo número de pontos em
   todas as alturas, para a malha ligar uma seção à seguinte. Sem furo,
   o "interno" é o centro repetido. area(z, d) é a conta exata (a do
   polígono de 96 lados que aproxima o círculo é um pouco menor).

   d é a deformação do cenário (inclinação, torção, empurrão…); a área
   das seções nunca depende dela — é isso que o simulador mostra.

   Sem three.js e sem DOM: dá para testar no Node.
   ================================================================ */

export const H = 2;          // altura de todos os sólidos
export const R = 1;          // raio dos cilindros, cones e da esfera
export const AB = Math.PI;   // área da base comum (π·R²)
const K = 96;                // lados do polígono que faz o papel do círculo

/* ---------- contornos ---------- */
export function circulo(r, cx = 0, cy = 0, k = K) {
  const p = [];
  for (let i = 0; i < k; i++) {
    const a = (2 * Math.PI * i) / k;
    p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return p;
}
/* polígono regular de n lados com área a, girado de rot */
export function regular(n, a, rot = 0, cx = 0, cy = 0) {
  const r = Math.sqrt((2 * a) / (n * Math.sin((2 * Math.PI) / n)));
  const p = [];
  for (let i = 0; i < n; i++) {
    const t = rot + Math.PI / 2 + (2 * Math.PI * i) / n;
    p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return p;
}
const centro = (k, cx, cy) => Array.from({ length: k }, () => [cx, cy]);
const macico = (ext, cx, cy) => ({ ext, int: centro(ext.length, cx, cy), cx, cy });

/* área de um polígono (fórmula do laço) */
export function areaPoligono(p) {
  let s = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += p[j][0] * p[i][1] - p[i][0] * p[j][1];
  return Math.abs(s) / 2;
}

/* ---------- os sólidos ---------- */
const SOLIDOS = {
  cilindro: {
    nome: 'Cilindro reto', liso: true,
    secao: () => macico(circulo(R), 0, 0),
    area: () => AB,
    volume: 'π·R²·h = 2π',
    V: AB * H,
  },
  moedas: {
    nome: 'Pilha empurrada', liso: true,
    /* o centro da moeda passeia numa curva suave; o pé da pilha fica parado */
    secao: (z, d) => {
      const u = z / H;
      const cx = d * (Math.sin(1.5 * Math.PI * u) * 0.9 + u * 0.4);
      const cy = d * 0.45 * Math.sin(Math.PI * u);
      return macico(circulo(R, cx, cy), cx, cy);
    },
    area: () => AB,
    volume: 'igual ao do cilindro: 2π',
    V: AB * H,
  },
  prismaReto: {
    nome: 'Prisma reto', liso: false,
    secao: () => macico(regular(5, AB), 0, 0),
    area: () => AB,
    volume: 'A_b·h = 2π',
    V: AB * H,
  },
  prismaObliquo: {
    nome: 'Prisma oblíquo', liso: false,
    secao: (z, d) => {
      const cx = Math.tan((d * Math.PI) / 180) * z;
      return macico(regular(5, AB, 0, cx, 0), cx, 0);
    },
    area: () => AB,
    volume: 'A_b·h = 2π',
    V: AB * H,
  },
  prismaTorcido: {
    nome: 'Prisma de base quadrada', liso: false, torcido: true,
    secao: (z, d) => macico(regular(4, AB, ((d * Math.PI) / 180) * (z / H)), 0, 0),
    area: () => AB,
    volume: 'igual ao do cilindro: 2π',
    V: AB * H,
  },
  cone: {
    nome: 'Cone reto', liso: true,
    secao: (z) => macico(circulo(R * (1 - z / H)), 0, 0),
    area: (z) => AB * (1 - z / H) ** 2,
    volume: '⅓·π·R²·h = 2π/3',
    V: (AB * H) / 3,
  },
  piramide: {
    nome: 'Pirâmide de base quadrada', liso: false,
    /* o vértice vai para (d, 0); cada seção é a base encolhida em direção a ele */
    secao: (z, d) => {
      const u = z / H, cx = d * u;
      return macico(regular(4, AB * (1 - u) ** 2, Math.PI / 4, cx, 0), cx, 0);
    },
    area: (z) => AB * (1 - z / H) ** 2,
    volume: '⅓·A_b·h = 2π/3',
    V: (AB * H) / 3,
  },
  esfera: {
    nome: 'Esfera', liso: true,
    secao: (z) => macico(circulo(Math.sqrt(Math.max(0, R * R - (z - R) ** 2))), 0, 0),
    area: (z) => Math.PI * Math.max(0, R * R - (z - R) ** 2),
    volume: '4πR³/3 = 4π/3',
    V: (4 * Math.PI) / 3,
  },
  anticlepsidra: {
    nome: 'Anticlepsidra', liso: true, oco: true,
    /* cilindro de raio R e altura 2R, sem os dois cones de vértice no centro */
    secao: (z) => ({ ext: circulo(R), int: circulo(Math.abs(z - R)), cx: 0, cy: 0 }),
    area: (z) => Math.PI * (R * R - (z - R) ** 2),
    volume: 'π·R²·2R − 2·⅓·π·R²·R = 4π/3',
    V: (4 * Math.PI) / 3,
  },
};

/* ---------- os cenários (pares) ---------- */
export const CENARIOS = [
  {
    id: 'moedas', curto: 'Pilha de moedas', A: 'cilindro', B: 'moedas',
    deforma: { rotulo: 'Empurrar a pilha', min: 0, max: 1, passo: 0.01, padrao: 0.7, fmt: (d) => `${Math.round(d * 100)}%` },
    fatias: 18,
    resumo: 'Empurre a pilha de moedas para o lado: ela entorta, mas cada moeda continua sendo a mesma moeda. A altura é a mesma, toda seção é um círculo de mesma área — e o volume não muda.',
    porque: 'Os dois sólidos são feitos das mesmas moedas, só que arrumadas de outro jeito. Volume do cilindro: <b>V = π·R²·h = π·1²·2 = 2π</b>. A pilha empurrada tem o mesmo.',
    iguais: true,
  },
  {
    id: 'prismas', curto: 'Prisma reto × oblíquo', A: 'prismaReto', B: 'prismaObliquo',
    deforma: { rotulo: 'Inclinação', min: 0, max: 50, passo: 1, padrao: 30, fmt: (d) => `${d}°` },
    fatias: 12,
    resumo: 'O mesmo pentágono como base, a mesma altura. Inclinar o prisma é como deslizar um maço de cartas: cada seção é uma cópia da base, apenas deslocada.',
    porque: 'É daqui que vem <b>V = A<sub>b</sub>·h</b> para <b>qualquer</b> prisma, reto ou oblíquo — a aresta lateral inclinada não entra na conta, só a altura.',
    iguais: true,
  },
  {
    id: 'torcido', curto: 'Cilindro × prisma torcido', A: 'cilindro', B: 'prismaTorcido',
    deforma: { rotulo: 'Torção', min: 0, max: 180, passo: 1, padrao: 90, fmt: (d) => `${d}°` },
    fatias: 12,
    resumo: 'Formas diferentes, áreas iguais: o círculo de raio 1 e o quadrado de lado √π têm a mesma área. Torça o prisma — cada seção gira, mas a área não muda.',
    porque: 'As seções nem precisam ter a mesma forma: basta terem a mesma <b>área</b> em cada altura. O prisma torcido tem o volume do cilindro: <b>A<sub>b</sub>·h = π·2 = 2π</b>.',
    iguais: true,
  },
  {
    id: 'cone', curto: 'Cone × pirâmide', A: 'cone', B: 'piramide',
    deforma: { rotulo: 'Deslocar o vértice', min: 0, max: 1.2, passo: 0.01, padrao: 0.6, fmt: (d) => d.toFixed(2).replace('.', ',') },
    fatias: 12,
    resumo: 'Bases de mesma área, mesma altura. Subindo o plano, as duas seções encolhem na mesma proporção — à altura z, cada lado vale (1 − z/h) do da base, e a área (1 − z/h)².',
    porque: 'Por isso cone e pirâmide têm a mesma fórmula, <b>V = ⅓·A<sub>b</sub>·h</b>, e ela não muda quando o vértice sai do centro: pirâmide oblíqua também é ⅓·A<sub>b</sub>·h.',
    iguais: true,
  },
  {
    id: 'esfera', curto: 'Esfera × anticlepsidra', A: 'esfera', B: 'anticlepsidra',
    deforma: null,
    fatias: 14,
    resumo: 'Tire de um cilindro equilátero dois cones com o vértice no centro: sobra a anticlepsidra. A seção vira um anel, e a área do anel é exatamente a do círculo da esfera na mesma altura.',
    porque: 'À distância t do centro, o círculo da esfera tem raio √(R² − t²): área <b>π(R² − t²)</b>. O anel tem raio de fora R e de dentro t: área <b>πR² − πt²</b> — a mesma. ' +
      'Logo <b>V<sub>esfera</sub> = π·R²·2R − 2·⅓·π·R²·R = 4πR³/3</b>.',
    iguais: true,
  },
  {
    id: 'contra', curto: 'Quando não vale', A: 'cilindro', B: 'cone',
    deforma: null,
    fatias: 10,
    resumo: 'Mesma base e mesma altura não bastam. Subindo o plano, a seção do cone encolhe e a do cilindro não: as áreas só coincidem no chão.',
    porque: 'O princípio exige seções de mesma área em <b>todas</b> as alturas. Aqui isso falha, e os volumes são diferentes: o cone tem <b>um terço</b> do volume do cilindro (2π/3 contra 2π).',
    iguais: false,
  },
];

export const porId = (id) => CENARIOS.find((c) => c.id === id);
export const solido = (chave) => SOLIDOS[chave];

/* soma das fatias: cada uma é um cilindro de base = seção do meio e altura h/n */
export function somaFatias(chave, n) {
  const s = SOLIDOS[chave], dz = H / n;
  let v = 0;
  for (let i = 0; i < n; i++) v += s.area((i + 0.5) * dz) * dz;
  return v;
}
