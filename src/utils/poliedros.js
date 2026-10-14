/* Núcleo geométrico do Simulador de Poliedros — sem three.js, sem DOM.

   Um sólido é { V: [[x,y,z]], F: [[i,j,k,…]], papel: ['base', …] }: vértices e
   faces com a orientação de fora (anti-horária vista de fora), mais o papel de
   cada face, que dá a cor e a legenda. Tudo o que a página mostra sai daqui:
   - os sólidos (casco convexo para os regulares e arquimedianos; extrusão e
     pirâmide sobre qualquer polígono para prismas, pirâmides e côncavos);
   - a planificação: uma árvore geradora das faces, desdobrada em torno das
     arestas-dobradiça, escolhida entre várias candidatas por não ter faces
     sobrepostas no plano;
   - o teste do segmento: que trechos de um segmento ficam dentro do sólido.

   Roda no navegador e no Node (o teste de sanidade importa este arquivo). */

/* ---------- vetores ---------- */
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norma = (a) => Math.hypot(a[0], a[1], a[2]);
export const unit = (a) => mul(a, 1 / (norma(a) || 1));
export const dist = (a, b) => norma(sub(a, b));
const lerp = (a, b, s) => add(a, mul(sub(b, a), s));

export function centroide(pts) {
  const c = [0, 0, 0];
  for (const p of pts) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; }
  return mul(c, 1 / pts.length);
}

/** Normal de Newell — vale para polígono não convexo e é robusta a vértice colinear. */
export function normalFace(V, f) {
  const n = [0, 0, 0];
  for (let i = 0; i < f.length; i++) {
    const a = V[f[i]], b = V[f[(i + 1) % f.length]];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return unit(n);
}

/* ---------- transformações afins {R (3×3, por linhas), t} ---------- */
export const IDENT = { R: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };

export function aplica(M, p) {
  const R = M.R;
  return [
    R[0] * p[0] + R[1] * p[1] + R[2] * p[2] + M.t[0],
    R[3] * p[0] + R[4] * p[1] + R[5] * p[2] + M.t[1],
    R[6] * p[0] + R[7] * p[1] + R[8] * p[2] + M.t[2],
  ];
}
const giraVetor = (M, v) => {
  const R = M.R;
  return [R[0] * v[0] + R[1] * v[1] + R[2] * v[2], R[3] * v[0] + R[4] * v[1] + R[5] * v[2], R[6] * v[0] + R[7] * v[1] + R[8] * v[2]];
};

/** A ∘ B: aplica B, depois A. */
export function compoe(A, B) {
  const a = A.R, b = B.R, R = new Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      R[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return { R, t: add(giraVetor(A, B.t), A.t) };
}

/** Rotação de θ em torno da reta que passa por `p` na direção unitária `u` (Rodrigues). */
export function rotacaoEixo(p, u, th) {
  const c = Math.cos(th), s = Math.sin(th), k = 1 - c;
  const [x, y, z] = u;
  const R = [
    c + x * x * k, x * y * k - z * s, x * z * k + y * s,
    y * x * k + z * s, c + y * y * k, y * z * k - x * s,
    z * x * k - y * s, z * y * k + x * s, c + z * z * k,
  ];
  const M = { R, t: [0, 0, 0] };
  return { R, t: sub(p, giraVetor(M, p)) };
}

/** Rotação que leva o vetor unitário `a` em `b`. */
function rotacaoEntre(a, b) {
  const c = dot(a, b);
  if (c > 1 - 1e-12) return IDENT;
  let eixo = cross(a, b);
  if (norma(eixo) < 1e-9) eixo = Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]);
  return rotacaoEixo([0, 0, 0], unit(eixo), Math.acos(Math.max(-1, Math.min(1, c))));
}

/* ---------- construção dos sólidos ---------- */

/** Casco convexo por força bruta: cada plano por três pontos que deixa todos do mesmo
    lado é uma face. Com até 60 vértices são ~34 mil trios — instantâneo. */
export function casco(P) {
  const n = P.length, faces = [], vistas = new Set();
  const eps = 1e-7 * Math.max(...P.map(norma));
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        let nn = cross(sub(P[j], P[i]), sub(P[k], P[i]));
        if (norma(nn) < 1e-9) continue;
        nn = unit(nn);
        let pos = 0, neg = 0;
        const no = [];
        for (let m = 0; m < n; m++) {
          const d = dot(nn, sub(P[m], P[i]));
          if (d > eps) pos++; else if (d < -eps) neg++; else no.push(m);
        }
        if (pos && neg) continue;
        if (pos) nn = mul(nn, -1);
        const chave = no.join(',');
        if (vistas.has(chave)) continue;
        vistas.add(chave);
        // ordena anti-horário em torno do centro, visto de fora
        const c = centroide(no.map((m) => P[m]));
        const e1 = unit(sub(P[no[0]], c)), e2 = cross(nn, e1);
        no.sort((a, b) => {
          const da = sub(P[a], c), db = sub(P[b], c);
          return Math.atan2(dot(da, e2), dot(da, e1)) - Math.atan2(dot(db, e2), dot(db, e1));
        });
        faces.push(no);
      }
  return { V: P.map((p) => p.slice()), F: faces };
}

/** Todas as permutações cíclicas (x,y,z) → (y,z,x) → (z,x,y), com todos os sinais. */
function ciclicas(base) {
  const out = [];
  for (const [a, b, c] of [[0, 1, 2], [1, 2, 0], [2, 0, 1]])
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1])
      out.push([base[a] * sx, base[b] * sy, base[c] * sz]);
  return out;
}
/** Todas as permutações (as seis), com todos os sinais. */
function todasPerm(base) {
  const out = [];
  for (const [a, b, c] of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]])
    for (const sx of [1, -1]) for (const sy of [1, -1]) for (const sz of [1, -1])
      out.push([base[a] * sx, base[b] * sy, base[c] * sz]);
  return out;
}
function unicos(P) {
  const m = new Map();
  for (const p of P) m.set(p.map((x) => x.toFixed(6)).join(' '), p);
  return [...m.values()];
}

const PHI = (1 + Math.sqrt(5)) / 2;

/** Vértices dos sólidos convexos que saem do casco. */
export const NUVENS = {
  tetraedro: () => [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  cubo: () => unicos(ciclicas([1, 1, 1])),
  octaedro: () => unicos(ciclicas([1, 0, 0])),
  dodecaedro: () => unicos([...ciclicas([1, 1, 1]), ...ciclicas([0, 1 / PHI, PHI])]),
  icosaedro: () => unicos(ciclicas([0, 1, PHI])),
  tetraedroTruncado: () => unicos(todasPerm([3, 1, 1])).filter((p) => p.filter((x) => x < 0).length % 2 === 0),
  cuboctaedro: () => unicos(todasPerm([1, 1, 0])),
  octaedroTruncado: () => unicos(todasPerm([0, 1, 2])),
  rombicuboctaedro: () => unicos(todasPerm([1, 1, 1 + Math.SQRT2])),
  icosidodecaedro: () => unicos([...ciclicas([0, 0, PHI]), ...ciclicas([0.5, PHI / 2, (PHI * PHI) / 2])]),
  icosaedroTruncado: () => unicos([
    ...ciclicas([0, 1, 3 * PHI]), ...ciclicas([1, 2 + PHI, 2 * PHI]), ...ciclicas([PHI, 2, PHI ** 3]),
  ]),
  cuboTruncado: () => unicos(todasPerm([Math.SQRT2 - 1, 1, 1])),
};

/** Polígono regular no plano (x,z), anti-horário, com uma aresta de frente para +z. */
export function poligonoRegular(n, r) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const a = Math.PI / 2 + Math.PI / n + (2 * Math.PI * k) / n;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

/* Polígono (x,z) anti-horário no plano da matemática ⇒ normal (0,-1,0) no espaço:
   é a orientação certa para a base de baixo. Cada face lateral percorre a aresta
   da base no sentido contrário — é o que mantém a superfície toda orientada. */

/** Prisma sobre qualquer polígono simples: base embaixo (y=0), tampa transladada por `desloc`. */
export function prisma(base, desloc) {
  const n = base.length;
  const V = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => add([x, 0, z], desloc))];
  const F = [base.map((_, i) => i), base.map((_, i) => n + (n - 1 - i))];
  const papel = ['base', 'base'];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    F.push([j, i, n + i, n + j]);
    papel.push('lateral');
  }
  return { V, F, papel };
}

/** Pirâmide sobre qualquer polígono simples, com o vértice em `apice`. */
export function piramide(base, apice) {
  const n = base.length;
  const V = [...base.map(([x, z]) => [x, 0, z]), apice];
  const F = [base.map((_, i) => i)];
  const papel = ['base'];
  for (let i = 0; i < n; i++) { F.push([(i + 1) % n, i, n]); papel.push('lateral'); }
  return { V, F, papel };
}

/** Tronco de pirâmide: base e tampa semelhantes, tampa em y=h. */
export function tronco(base, escala, h) {
  const n = base.length;
  const V = [...base.map(([x, z]) => [x, 0, z]), ...base.map(([x, z]) => [x * escala, h, z * escala])];
  const F = [base.map((_, i) => i), base.map((_, i) => n + (n - 1 - i))];
  const papel = ['base', 'base'];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    F.push([j, i, n + i, n + j]);
    papel.push('lateral');
  }
  return { V, F, papel };
}

/** Troca cada face indicada por uma pirâmide de vértice `ponta(face)` — para fora
    (estrelar) ou para dentro (escavar). A orientação do leque é a da própria face. */
export function poePontas(solido, quais, ponta, papelNovo) {
  const V = solido.V.map((p) => p.slice()), F = [], papel = [];
  solido.F.forEach((f, k) => {
    if (!quais(k, f)) { F.push(f); papel.push(solido.papel?.[k]); return; }
    const t = V.push(ponta(f.map((i) => V[i]), k)) - 1;
    for (let i = 0; i < f.length; i++) { F.push([f[i], f[(i + 1) % f.length], t]); papel.push(papelNovo); }
  });
  return { V, F, papel };
}

/** Papel padrão dos sólidos do casco: o tipo de polígono da face. */
export function papelPorLados(s) {
  s.papel = s.F.map((f) => 'n' + f.length);
  return s;
}

/* ---------- medidas ---------- */
export function arestas(s) {
  const m = new Map();
  s.F.forEach((f, k) => {
    for (let i = 0; i < f.length; i++) {
      const a = f[i], b = f[(i + 1) % f.length];
      const ch = a < b ? `${a}-${b}` : `${b}-${a}`;
      if (!m.has(ch)) m.set(ch, { a: Math.min(a, b), b: Math.max(a, b), faces: [] });
      m.get(ch).faces.push(k);
    }
  });
  return [...m.values()];
}

export function volumeOrientado(s) {
  let v = 0;
  for (const f of s.F)
    for (let i = 1; i + 1 < f.length; i++) v += dot(s.V[f[0]], cross(s.V[f[i]], s.V[f[i + 1]]));
  return v / 6;
}

/* ---------- triangulação (orelhas), em 2D e em faces 3D ---------- */
function area2(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i], r = p[(i + 1) % p.length];
    a += q[0] * r[1] - r[0] * q[1];
  }
  return a / 2;
}
const cruz2 = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Triângulos (índices locais) de um polígono simples 2D, qualquer orientação. */
export function triangula2(p) {
  const n = p.length;
  if (n === 3) return [[0, 1, 2]];
  let idx = p.map((_, i) => i);
  if (area2(p) < 0) idx.reverse();
  const tris = [];
  let guarda = 0;
  while (idx.length > 3 && guarda++ < 10000) {
    let cortou = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = p[i0], b = p[i1], c = p[i2];
      if (cruz2(a, b, c) <= 1e-12) continue; // vértice reflexo
      let dentro = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const q = p[j];
        if (cruz2(a, b, q) >= -1e-12 && cruz2(b, c, q) >= -1e-12 && cruz2(c, a, q) >= -1e-12) { dentro = true; break; }
      }
      if (dentro) continue;
      tris.push([i0, i1, i2]);
      idx.splice(k, 1);
      cortou = true;
      break;
    }
    if (!cortou) break;
  }
  if (idx.length === 3) tris.push(idx);
  return tris;
}

/** Base ortonormal do plano de uma face: projeta os vértices para triangular em 2D. */
function baseDoPlano(n) {
  const e1 = unit(Math.abs(n[0]) < 0.9 ? cross(n, [1, 0, 0]) : cross(n, [0, 1, 0]));
  return [e1, cross(n, e1)];
}

/** Triângulos (índices globais de vértice) de cada face. */
export function triangulaFaces(s) {
  return s.F.map((f) => {
    const n = normalFace(s.V, f);
    const [e1, e2] = baseDoPlano(n);
    const p2 = f.map((i) => [dot(s.V[i], e1), dot(s.V[i], e2)]);
    return triangula2(p2).map((t) => t.map((k) => f[k]));
  });
}

/* ---------- planificação ---------- */

/** Arestas compartilhadas: vizinho[f] = [{ g, a, b }] — `a→b` é o sentido em f. */
function vizinhanca(s) {
  const viz = s.F.map(() => []);
  for (const e of arestas(s)) {
    if (e.faces.length !== 2) continue;
    const [f, g] = e.faces;
    viz[f].push({ g, a: e.a, b: e.b });
    viz[g].push({ g: f, a: e.a, b: e.b });
  }
  return viz;
}

/** Ângulo que leva a face `f` para o plano do pai `p`, girando em torno da dobradiça a–b. */
function anguloDeAbertura(s, f, p, a, b) {
  const A = s.V[a], u = unit(sub(s.V[b], A));
  /* Direção, no plano da face, que sai da dobradiça para dentro dela: a face é
     anti-horária vista de fora, então o interior fica à esquerda da aresta no
     sentido em que a face a percorre. (O centroide não serve: numa face em L ele
     pode cair do outro lado da reta da aresta.) */
  const paraDentro = (k) => {
    const g = s.F[k], i = g.indexOf(a);
    const sentido = g[(i + 1) % g.length] === b ? u : mul(u, -1);
    return unit(cross(normalFace(s.V, g), sentido));
  };
  const wf = paraDentro(f), alvo = mul(paraDentro(p), -1);
  return Math.atan2(dot(u, cross(wf, alvo)), dot(wf, alvo));
}

/** Faces em que o sólido pode se apoiar: todo vértice fica do lado de dentro do plano dela. */
export function facesDeApoio(s) {
  return s.F.map((_, k) => k).filter((k) => {
    const n = normalFace(s.V, s.F[k]), P = s.V[s.F[k][0]];
    return s.V.every((q) => dot(n, sub(q, P)) < 1e-7);
  });
}

/** Monta a rede a partir de `pai` (pai[f] = face mãe, -1 na raiz). */
function redeDeArvore(s, viz, pai, raiz) {
  const dobra = s.F.map(() => null);
  for (let f = 0; f < s.F.length; f++) {
    if (f === raiz) continue;
    const v = viz[f].find((x) => x.g === pai[f]);
    dobra[f] = { pai: pai[f], a: v.a, b: v.b, ang: anguloDeAbertura(s, f, pai[f], v.a, v.b) };
  }
  // ordem topológica: pai antes do filho
  const ordem = [raiz], filhos = s.F.map(() => []);
  for (let f = 0; f < s.F.length; f++) if (f !== raiz) filhos[pai[f]].push(f);
  for (let i = 0; i < ordem.length; i++) ordem.push(...filhos[ordem[i]]);
  return { raiz, dobra, ordem };
}

/** Transformação de cada face com a rede aberta na fração `t` (0 = fechado, 1 = plano). */
export function transformacoes(s, rede, t) {
  const M = s.F.map(() => IDENT);
  for (const f of rede.ordem) {
    const d = rede.dobra[f];
    if (!d) continue;
    const A = s.V[d.a], u = unit(sub(s.V[d.b], A));
    M[f] = compoe(M[d.pai], rotacaoEixo(A, u, t * d.ang));
  }
  return M;
}

/** Coordenadas 2D das faces na rede aberta, no plano da raiz (vista de fora da raiz). */
export function rede2D(s, rede) {
  const M = transformacoes(s, rede, 1);
  const nr = normalFace(s.V, s.F[rede.raiz]);
  const [e1, e2] = baseDoPlano(nr);
  // e1 × e2 = normal da raiz: nessa base as faces saem anti-horárias, vistas de fora —
  // o lado que fica para fora quando a folha impressa é montada
  return s.F.map((f, k) => f.map((i) => {
    const p = aplica(M[k], s.V[i]);
    return [dot(p, e1), dot(p, e2)];
  }));
}

/* Sobreposição: triângulo contra triângulo pelo teorema do eixo separador, com
   folga — encostar em aresta ou vértice (o normal numa rede) não conta. */
function separa(t1, t2, folga) {
  for (const T of [t1, t2])
    for (let i = 0; i < 3; i++) {
      const a = T[i], b = T[(i + 1) % 3];
      const ax = [-(b[1] - a[1]), b[0] - a[0]];
      const l = Math.hypot(ax[0], ax[1]) || 1;
      let mn1 = Infinity, mx1 = -Infinity, mn2 = Infinity, mx2 = -Infinity;
      for (const p of t1) { const d = (p[0] * ax[0] + p[1] * ax[1]) / l; mn1 = Math.min(mn1, d); mx1 = Math.max(mx1, d); }
      for (const p of t2) { const d = (p[0] * ax[0] + p[1] * ax[1]) / l; mn2 = Math.min(mn2, d); mx2 = Math.max(mx2, d); }
      if (mx1 <= mn2 + folga || mx2 <= mn1 + folga) return true;
    }
  return false;
}

export function redeSobrepoe(polys, escala = 1) {
  const folga = 1e-4 * escala;
  const tris = polys.map((p) => triangula2(p).map((t) => t.map((k) => p[k])));
  const caixas = polys.map((p) => {
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  });
  for (let i = 0; i < polys.length; i++)
    for (let j = i + 1; j < polys.length; j++) {
      const A = caixas[i], B = caixas[j];
      if (A[2] <= B[0] + folga || B[2] <= A[0] + folga || A[3] <= B[1] + folga || B[3] <= A[1] + folga) continue;
      for (const t1 of tris[i]) for (const t2 of tris[j]) if (!separa(t1, t2, folga)) return true;
    }
  return false;
}

/** Área do menor retângulo que contém a rede (girando de 3° em 3°) — critério de compacidade. */
function areaCaixa(polys) {
  const pts = polys.flat();
  let melhor = Infinity;
  for (let g = 0; g < 180; g += 3) {
    const c = Math.cos((g * Math.PI) / 180), sn = Math.sin((g * Math.PI) / 180);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const [x, y] of pts) {
      const u = x * c - y * sn, v = x * sn + y * c;
      x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v);
    }
    melhor = Math.min(melhor, (x1 - x0) * (y1 - y0));
  }
  return melhor;
}

/** Gerador pseudoaleatório com semente — a mesma rede a cada visita. */
export function rng(semente) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Árvore em largura a partir da raiz, com a ordem dos vizinhos embaralhada por `r`. */
function arvoreLargura(viz, raiz, r) {
  const pai = viz.map(() => undefined);
  pai[raiz] = -1;
  const fila = [raiz];
  while (fila.length) {
    const f = fila.shift();
    const vs = viz[f].map((v) => v.g);
    if (r) vs.sort(() => r() - 0.5);
    for (const g of vs) if (pai[g] === undefined) { pai[g] = f; fila.push(g); }
  }
  return pai;
}
/** Árvore em profundidade — redes compridas, em tira. */
function arvoreProfundidade(viz, raiz, r) {
  const pai = viz.map(() => undefined);
  pai[raiz] = -1;
  const pilha = [raiz];
  while (pilha.length) {
    const f = pilha[pilha.length - 1];
    const vs = viz[f].map((v) => v.g).filter((g) => pai[g] === undefined);
    if (!vs.length) { pilha.pop(); continue; }
    const g = r ? vs[Math.floor(r() * vs.length)] : vs[0];
    pai[g] = f;
    pilha.push(g);
  }
  return pai;
}

/** Prisma (e tronco) em tira: a base-raiz segura a face lateral do meio; as demais
    laterais seguem em fila pelas arestas laterais e a tampa pende da do meio. */
function arvoreTira(s, viz) {
  // convenção de prisma() e tronco(): faces 0 e 1 são as bases, as demais são laterais em ordem
  const lat = s.F.map((_, k) => k).slice(2);
  const n = lat.length, meio = lat[Math.floor((n - 1) / 2)];
  const pai = s.F.map(() => undefined);
  pai[0] = -1;
  pai[meio] = 0;
  pai[1] = meio;
  const pos = lat.indexOf(meio);
  for (let k = pos + 1; k < n; k++) pai[lat[k]] = lat[k - 1];
  for (let k = pos - 1; k >= 0; k--) pai[lat[k]] = lat[k + 1];
  // confere que cada par pai–filho é mesmo vizinho (vale para prisma e tronco)
  return pai.every((p, f) => p === -1 || viz[f].some((v) => v.g === p)) ? pai : null;
}
/** Pirâmide e prisma em estrela: tudo pendurado na base (face 0); a tampa, numa lateral. */
function arvoreEstrela(s, viz) {
  const pai = s.F.map(() => undefined);
  pai[0] = -1;
  // toda face vizinha da base pende dela; a que sobrar (a tampa do prisma) pende de uma dessas
  s.F.forEach((_, f) => { if (f && viz[f].some((v) => v.g === 0)) pai[f] = 0; });
  s.F.forEach((_, f) => { if (pai[f] === undefined) pai[f] = viz[f].map((v) => v.g).find((g) => pai[g] === 0); });
  return pai.every((p, f) => p === -1 || viz[f].some((v) => v.g === p)) ? pai : null;
}

/**
 * Escolhe a planificação. `estilo` diz que árvores tentar primeiro ('tira',
 * 'estrela' ou nada); depois vêm as genéricas — em largura e em profundidade a
 * partir de cada raiz candidata, com sementes fixas. Entre as sem sobreposição,
 * fica a de caixa mais compacta (ou a primeira das preferidas, se servir).
 */
export function planifica(s, { estilo, raizes, tentativas = 160 } = {}) {
  const viz = vizinhanca(s);
  const escala = Math.max(...s.V.map((p) => norma(sub(p, centroide(s.V)))));
  const testa = (pai, raiz) => {
    if (!pai || pai.some((p) => p === undefined)) return null;
    const rede = redeDeArvore(s, viz, pai, raiz);
    const polys = rede2D(s, rede);
    return redeSobrepoe(polys, escala) ? null : { rede, polys };
  };

  for (const e of [].concat(estilo || [])) {
    const pai = e === 'tira' ? arvoreTira(s, viz) : arvoreEstrela(s, viz);
    const ok = testa(pai, 0);
    if (ok) return ok.rede;
  }

  // a raiz fica apoiada no chão enquanto o resto abre: tem de ser face de apoio
  const apoio = facesDeApoio(s);
  const todas = (apoio.length ? apoio : s.F.map((_, k) => k)).sort((a, b) => s.F[b].length - s.F[a].length);
  /* Prisma e pirâmide cujas árvores clássicas não serviram (base côncava) ainda
     devem abrir a partir da base de baixo, para o sólido não tombar de lado. */
  const rodadas = raizes ? [raizes] : estilo ? [[0], todas] : [todas];
  for (const candidatas of rodadas) {
    const r = rng(20261014);
    let melhor = null, achadas = 0;
    for (let i = 0; i < tentativas && achadas < 14; i++) {
      const raiz = candidatas[i % candidatas.length];
      const tipo = i % 3;
      const pai = tipo === 2 ? arvoreProfundidade(viz, raiz, r) : arvoreLargura(viz, raiz, i < candidatas.length ? null : r);
      const ok = testa(pai, raiz);
      if (!ok) continue;
      achadas++;
      const area = areaCaixa(ok.polys);
      if (!melhor || area < melhor.area - 1e-9) melhor = { area, rede: ok.rede };
    }
    if (melhor) return melhor.rede;
  }
  return null;
}

/** Gira o sólido para a face `k` ficar embaixo (normal para -y), centrado em x e z, apoiado
    em y=0. Devolve também a transformação, para levar junto os pontos auxiliares. */
export function apoiaNaFace(s, k) {
  const R = rotacaoEntre(normalFace(s.V, s.F[k]), [0, -1, 0]);
  const G = s.V.map((p) => aplica(R, p));
  const c = centroide(G), y0 = Math.min(...G.map((p) => p[1]));
  const T = compoe({ R: IDENT.R, t: [-c[0], -y0, -c[2]] }, R);
  return { ...s, V: s.V.map((p) => aplica(T, p)), T };
}

/* ---------- convexidade: o teste do segmento ---------- */

/** Interseção do raio O + s·D com o triângulo (Möller–Trumbore); devolve s ou null. */
function raioTri(O, D, a, b, c) {
  const e1 = sub(b, a), e2 = sub(c, a), p = cross(D, e2), det = dot(e1, p);
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det, tv = sub(O, a), u = dot(tv, p) * inv;
  if (u < -1e-10 || u > 1 + 1e-10) return null;
  const q = cross(tv, e1), v = dot(D, q) * inv;
  if (v < -1e-10 || u + v > 1 + 1e-10) return null;
  return dot(e2, q) * inv;
}

/** O ponto está sobre a superfície (a menos de `eps`)? */
function naSuperficie(s, tris, p, eps) {
  for (const t of tris) {
    const [a, b, c] = t.map((i) => s.V[i]);
    const n = unit(cross(sub(b, a), sub(c, a)));
    const d = dot(n, sub(p, a));
    if (Math.abs(d) > eps) continue;
    const q = sub(p, mul(n, d));
    const c1 = dot(cross(sub(b, a), sub(q, a)), n), c2 = dot(cross(sub(c, b), sub(q, b)), n), c3 = dot(cross(sub(a, c), sub(q, c)), n);
    if (c1 >= -eps && c2 >= -eps && c3 >= -eps) return true;
  }
  return false;
}

const DIRECOES = [unit([0.5377, 0.7311, 0.4181]), unit([-0.6123, 0.2471, 0.7519]), unit([0.3091, -0.8237, 0.4753])];

/** Dentro (ou na superfície) do sólido? Paridade de cruzamentos em três direções, por maioria. */
export function dentro(s, tris, p) {
  const eps = 1e-6 * Math.max(1, norma(p));
  if (naSuperficie(s, tris, p, eps)) return true;
  let votos = 0;
  for (const D of DIRECOES) {
    let n = 0;
    for (const t of tris) {
      const x = raioTri(p, D, ...t.map((i) => s.V[i]));
      if (x !== null && x > 1e-9) n++;
    }
    if (n % 2) votos++;
  }
  return votos >= 2;
}

/**
 * Divide o segmento PQ em trechos dentro/fora do sólido.
 * Os cortes são as interseções com a superfície; cada trecho é decidido pelo seu ponto médio.
 * Devolve [{ s0, s1, dentro }] com s em [0,1], já com trechos vizinhos iguais fundidos.
 */
export function classificaSegmento(s, P, Q, tris = triangulaFaces(s).flat()) {
  const D = sub(Q, P);
  const cortes = [0, 1];
  for (const t of tris) {
    const x = raioTri(P, D, ...t.map((i) => s.V[i]));
    if (x !== null && x > 1e-7 && x < 1 - 1e-7) cortes.push(x);
  }
  cortes.sort((a, b) => a - b);
  const trechos = [];
  for (let i = 0; i + 1 < cortes.length; i++) {
    const s0 = cortes[i], s1 = cortes[i + 1];
    if (s1 - s0 < 1e-6) continue;
    const d = dentro(s, tris, lerp(P, Q, (s0 + s1) / 2));
    const ult = trechos[trechos.length - 1];
    if (ult && ult.dentro === d) ult.s1 = s1;
    else trechos.push({ s0, s1, dentro: d });
  }
  return trechos;
}

/** Fração do segmento que fica fora do sólido. */
export const foraDe = (trechos) => trechos.filter((t) => !t.dentro).reduce((a, t) => a + t.s1 - t.s0, 0);

/** Ponto sorteado na superfície, uniforme pela área. */
export function pontoNaSuperficie(s, r, tris = triangulaFaces(s).flat()) {
  const areas = tris.map((t) => norma(cross(sub(s.V[t[1]], s.V[t[0]]), sub(s.V[t[2]], s.V[t[0]]))) / 2);
  const total = areas.reduce((a, b) => a + b, 0);
  let x = r() * total, k = 0;
  while (k < areas.length - 1 && x > areas[k]) x -= areas[k++];
  let u = r(), v = r();
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const [a, b, c] = tris[k].map((i) => s.V[i]);
  return add(a, add(mul(sub(b, a), u), mul(sub(c, a), v)));
}

/** Entre todos os pares de vértices, um segmento que sai do sólido — a prova de que é
    côncavo. Prefere o que tem trecho dentro e trecho fora (mostra a "entrada" e a "saída"),
    e, entre esses, o de maior trecho por fora. */
export function segmentoQueMaisSai(s, tris = triangulaFaces(s).flat()) {
  let melhor = null;
  for (let i = 0; i < s.V.length; i++)
    for (let j = i + 1; j < s.V.length; j++) {
      const tr = classificaSegmento(s, s.V[i], s.V[j], tris);
      const L = dist(s.V[i], s.V[j]), fora = foraDe(tr) * L, dentro = L - fora;
      if (fora < 1e-6) continue;
      const nota = fora * Math.min(dentro, fora * 1.5) + 1e-3 * fora;
      if (!melhor || nota > melhor.nota) melhor = { P: s.V[i], Q: s.V[j], fora, nota };
    }
  return melhor;
}

/** Convexo de fato? Nenhuma aresta com diedro reflexo. */
export function ehConvexo(s) {
  const c = centroide(s.V);
  for (const e of arestas(s)) {
    const [f, g] = e.faces;
    const ng = normalFace(s.V, s.F[g]);
    // algum vértice de f fica do lado de fora do plano de g?
    for (const i of s.F[f]) if (dot(ng, sub(s.V[i], s.V[s.F[g][0]])) > 1e-7 * (1 + norma(sub(s.V[i], c)))) return false;
  }
  return true;
}
