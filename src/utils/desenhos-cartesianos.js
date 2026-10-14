/* Catálogo dos desenhos secretos do plano cartesiano.

   Cada desenho é uma lista de traços; cada traço é uma lista de pontos [x, y] com
   coordenadas INTEIRAS, todos no 1º quadrante. O aluno liga os pontos de um traço
   em ordem e começa o traço seguinte sem ligar ao anterior. Traço fechado repete o
   primeiro ponto no fim; traço de um ponto só é um "ponto solto" (só marcar).

   As variações — os quatro quadrantes e as coordenadas com meios — não são
   desenhadas à mão: saem de transforma(), a partir destes mesmos pontos. */

export const DESENHOS = [
  {
    id: 'pipa', nome: 'Pipa',
    tracos: [
      [[10, 18], [15, 12], [10, 4], [5, 12], [10, 18]],
      [[10, 18], [10, 4]],
      [[5, 12], [15, 12]],
      [[10, 4], [8, 2], [11, 1], [9, 0]],
    ],
  },
  {
    id: 'casa', nome: 'Casa',
    tracos: [
      [[2, 1], [2, 9], [14, 9], [14, 1], [2, 1]],
      [[1, 9], [8, 16], [15, 9]],
      [[11, 13], [11, 15], [13, 15], [13, 11]],
      [[6, 1], [6, 6], [9, 6], [9, 1]],
      [[10, 4], [10, 7], [13, 7], [13, 4], [10, 4]],
    ],
  },
  {
    id: 'coracao', nome: 'Coração',
    tracos: [
      [[10, 2], [3, 9], [2, 12], [3, 14], [5, 15], [7, 15], [9, 14], [10, 12], [11, 14], [13, 15], [15, 15], [17, 14], [18, 12], [17, 9], [10, 2]],
    ],
  },
  {
    id: 'estrela', nome: 'Estrela',
    tracos: [
      [[10, 19], [12, 13], [19, 13], [13, 9], [16, 2], [10, 6], [4, 2], [7, 9], [1, 13], [8, 13], [10, 19]],
    ],
  },
  {
    id: 'arvore', nome: 'Pinheiro',
    tracos: [
      [[8, 1], [8, 5], [12, 5], [12, 1], [8, 1]],
      [[3, 5], [8, 10], [5, 10], [8, 14], [6, 14], [10, 19], [14, 14], [12, 14], [15, 10], [12, 10], [17, 5], [3, 5]],
    ],
  },
  {
    id: 'sorvete', nome: 'Sorvete',
    tracos: [
      [[6, 10], [10, 1], [14, 10], [6, 10]],
      [[6, 10], [5, 12], [6, 15], [8, 17], [10, 18], [12, 17], [14, 15], [15, 12], [14, 10]],
      [[10, 18], [9, 19], [10, 20], [11, 19], [10, 18]],
    ],
  },
  {
    id: 'peixe', nome: 'Peixe',
    tracos: [
      [[2, 8], [5, 11], [9, 12], [13, 11], [16, 8], [13, 5], [9, 4], [5, 5], [2, 8]],
      [[16, 8], [19, 11], [19, 5], [16, 8]],
      [[7, 10], [8, 8], [7, 6]],
      [[9, 12], [11, 14], [13, 11]],
      [[5, 9]],
    ],
  },
  {
    id: 'barco', nome: 'Barco a vela',
    tracos: [
      [[2, 4], [18, 4], [15, 1], [5, 1], [2, 4]],
      [[10, 4], [10, 18]],
      [[10, 15], [4, 6], [10, 6]],
      [[11, 14], [16, 6], [11, 6], [11, 14]],
      [[10, 18], [13, 17], [10, 16]],
    ],
  },
  {
    id: 'foguete', nome: 'Foguete',
    tracos: [
      [[7, 5], [7, 15], [10, 20], [13, 15], [13, 5], [7, 5]],
      [[7, 6], [4, 3], [4, 8], [7, 11]],
      [[13, 6], [16, 3], [16, 8], [13, 11]],
      [[9, 11], [9, 13], [11, 13], [11, 11], [9, 11]],
      [[8, 5], [9, 1], [10, 3], [11, 1], [12, 5]],
    ],
  },
  {
    id: 'tartaruga', nome: 'Tartaruga',
    tracos: [
      [[3, 5], [5, 9], [8, 11], [12, 11], [15, 9], [17, 5], [3, 5]],
      [[16, 7], [18, 8], [20, 8], [21, 7], [21, 6], [20, 5], [17, 5]],
      [[13, 5], [13, 3], [15, 3], [15, 5]],
      [[5, 5], [5, 3], [7, 3], [7, 5]],
      [[3, 5], [1, 4], [3, 6]],
      [[7, 5], [8, 8], [12, 8], [13, 5]],
      [[8, 8], [8, 10]],
      [[12, 8], [12, 10]],
      [[19, 7]],
    ],
  },
  {
    id: 'carro', nome: 'Carro',
    tracos: [
      [[1, 3], [1, 7], [5, 7], [7, 11], [14, 11], [17, 7], [19, 7], [19, 3], [1, 3]],
      [[6, 7], [8, 10], [10, 10], [10, 7], [6, 7]],
      [[11, 7], [11, 10], [13, 10], [15, 7], [11, 7]],
      [[4, 0], [6, 0], [7, 1], [7, 3], [6, 4], [4, 4], [3, 3], [3, 1], [4, 0]],
      [[14, 0], [16, 0], [17, 1], [17, 3], [16, 4], [14, 4], [13, 3], [13, 1], [14, 0]],
    ],
  },
  {
    id: 'borboleta', nome: 'Borboleta',
    tracos: [
      [[10, 3], [9, 4], [9, 14], [10, 15], [11, 14], [11, 4], [10, 3]],
      [[9, 11], [6, 16], [2, 17], [1, 14], [3, 11], [9, 10]],
      [[9, 9], [4, 9], [2, 6], [4, 3], [7, 4], [9, 7]],
      [[11, 11], [14, 16], [18, 17], [19, 14], [17, 11], [11, 10]],
      [[11, 9], [16, 9], [18, 6], [16, 3], [13, 4], [11, 7]],
      [[10, 15], [8, 18], [7, 18]],
      [[10, 15], [12, 18], [13, 18]],
    ],
  },
  {
    id: 'gato', nome: 'Gato',
    tracos: [
      [[4, 3], [2, 7], [2, 12], [3, 18], [8, 14], [12, 14], [17, 18], [18, 12], [18, 7], [16, 3], [10, 1], [4, 3]],
      [[6, 10], [7, 11], [8, 10], [7, 9], [6, 10]],
      [[12, 10], [13, 11], [14, 10], [13, 9], [12, 10]],
      [[9, 7], [11, 7], [10, 6], [9, 7]],
      [[10, 6], [10, 5]],
      [[8, 4], [10, 5], [12, 4]],
      [[0, 8], [6, 7]],
      [[0, 5], [6, 6]],
      [[14, 7], [20, 8]],
      [[14, 6], [20, 5]],
    ],
  },
  {
    id: 'robo', nome: 'Robô',
    tracos: [
      [[6, 13], [6, 18], [14, 18], [14, 13], [6, 13]],
      [[10, 18], [10, 20]],
      [[7, 15], [7, 17], [9, 17], [9, 15], [7, 15]],
      [[11, 15], [11, 17], [13, 17], [13, 15], [11, 15]],
      [[8, 14], [12, 14]],
      [[9, 13], [9, 12]],
      [[11, 13], [11, 12]],
      [[5, 5], [5, 12], [15, 12], [15, 5], [5, 5]],
      [[8, 7], [8, 10], [12, 10], [12, 7], [8, 7]],
      [[5, 11], [2, 11], [2, 6], [3, 6], [3, 10], [5, 10]],
      [[15, 11], [18, 11], [18, 6], [17, 6], [17, 10], [15, 10]],
      [[7, 5], [7, 1], [9, 1], [9, 5]],
      [[11, 5], [11, 1], [13, 1], [13, 5]],
    ],
  },
  {
    id: 'dinossauro', nome: 'Dinossauro',
    tracos: [
      [[1, 5], [5, 8], [8, 10], [11, 11], [14, 10], [15, 12], [15, 16], [16, 18], [18, 18], [20, 17], [20, 16], [17, 16],
        [17, 9], [16, 6], [16, 2], [14, 2], [14, 5], [10, 5], [10, 2], [8, 2], [8, 5], [6, 6], [1, 5]],
      [[18, 17]],
    ],
  },
  {
    id: 'castelo', nome: 'Castelo',
    tracos: [
      [[1, 1], [1, 15], [2, 15], [2, 14], [3, 14], [3, 15], [4, 15], [4, 14], [5, 14], [5, 15], [6, 15],
        [6, 10], [7, 10], [7, 11], [8, 11], [8, 10], [9, 10], [9, 11], [10, 11], [10, 10], [11, 10], [11, 11], [12, 11], [12, 10], [13, 10],
        [13, 15], [14, 15], [14, 14], [15, 14], [15, 15], [16, 15], [16, 14], [17, 14], [17, 15], [18, 15], [18, 1], [1, 1]],
      [[8, 1], [8, 5], [9, 6], [10, 6], [11, 5], [11, 1]],
      [[3, 9], [3, 12], [4, 12], [4, 9], [3, 9]],
      [[15, 9], [15, 12], [16, 12], [16, 9], [15, 9]],
      [[9, 11], [9, 18], [12, 17], [9, 16]],
    ],
  },
];

export const NIVEIS = [
  { id: 'facil', nome: 'Fácil', ate: 22 },
  { id: 'medio', nome: 'Médio', ate: 45 },
  { id: 'dificil', nome: 'Desafio', ate: Infinity },
];

export const totalPontos = (d) => d.tracos.reduce((s, t) => s + t.length, 0);
export const nivelDe = (d) => NIVEIS.find((n) => totalPontos(d) <= n.ate);
export const desenho = (id) => DESENHOS.find((d) => d.id === id);

const caixa = (tracos) => {
  const pts = tracos.flat();
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
};

/**
 * O desenho pronto para a folha.
 * @param d   entrada do catálogo
 * @param op  { quadrantes: 1 | 4, meios: boolean }
 * @returns   { tracos (em unidades do plano), passo (1 ou 0,5), janela: [x0, y0, x1, y1] em unidades inteiras }
 *
 * Nos quatro quadrantes o desenho é transladado para o centro ficar perto da origem
 * (translação inteira, para os pontos continuarem nos cruzamentos da malha). Com
 * meios, cada coordenada é dividida por 2 e a malha ganha linhas a cada 0,5.
 */
export function transforma(d, op) {
  let tracos = d.tracos.map((t) => t.map((p) => [...p]));
  if (op.quadrantes === 4) {
    const [x0, y0, x1, y1] = caixa(tracos);
    const dx = -Math.round((x0 + x1) / 2), dy = -Math.round((y0 + y1) / 2);
    tracos = tracos.map((t) => t.map(([x, y]) => [x + dx, y + dy]));
  }
  const passo = op.meios ? 0.5 : 1;
  tracos = tracos.map((t) => t.map(([x, y]) => [x * passo, y * passo]));
  const [x0, y0, x1, y1] = caixa(tracos);
  // a janela sempre contém a origem e sobra uma casa inteira de folga em volta
  const janela = op.quadrantes === 4
    ? [Math.min(-1, Math.floor(x0) - 1), Math.min(-1, Math.floor(y0) - 1), Math.max(1, Math.ceil(x1) + 1), Math.max(1, Math.ceil(y1) + 1)]
    : [0, 0, Math.ceil(x1) + 1, Math.ceil(y1) + 1];
  return { tracos, passo, janela };
}

/** Coordenada por extenso no padrão brasileiro: vírgula decimal e, se houver decimais, ponto e vírgula entre x e y. */
export function par([x, y], meios) {
  const f = (v) => (v < 0 ? '-' : '') + Math.abs(v).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return meios ? `(${f(x)}; ${f(y)})` : `(${f(x)}, ${f(y)})`;
}
