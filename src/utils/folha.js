/* ==========================================================================
   Folha imprimível das ferramentas geradoras: cabeçalho, folha do aluno,
   gabarito do professor, versões A–H e a distribuição das questões entre os
   tipos marcados.

   Vanilla JS de navegador (ver o cabeçalho de matematica.js). O que é
   específico de cada ferramenta — como a questão é gerada e o que entra no
   gabarito além dos passos — chega por callback.
   ========================================================================== */
import { embaralha } from './matematica.js';

export const ROTULOS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const $ = (id) => document.getElementById(id);

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Prende o valor de um <input type=number> à faixa, corrigindo o campo. */
export function limita(el, min, max) {
  const n = parseInt(el.value, 10);
  const v = Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  if (String(v) !== el.value) el.value = v;
  return v;
}

/* --------------------------------------------------------------------------
   Grupo de chips (aria-pressed). Devolve ler() e repor(), para o botão de
   restaurar padrões. Em grupo múltiplo, nunca deixa chegar a zero marcados.
   -------------------------------------------------------------------------- */
export function chips(id, multi, aoMudar) {
  const cx = $(id);
  const marcados = () => [...cx.querySelectorAll('[aria-pressed="true"]')];
  const ler = () => (multi ? marcados().map((b) => b.dataset.v) : marcados()[0].dataset.v);

  cx.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    if (multi) {
      const ligado = b.getAttribute('aria-pressed') === 'true';
      if (ligado && marcados().length === 1) return;
      b.setAttribute('aria-pressed', ligado ? 'false' : 'true');
    } else {
      cx.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    }
    aoMudar(ler());
  });

  return {
    ler,
    repor(valor) {
      const alvo = multi ? valor : [valor];
      cx.querySelectorAll('.chip').forEach((b) =>
        b.setAttribute('aria-pressed', String(alvo.includes(b.dataset.v))));
    },
  };
}

/* --------------------------------------------------------------------------
   Distribuição das questões entre os tipos viáveis: cota igual para cada um,
   o resto vai para tipos sorteados. `gerarDe(tipo)` devolve uma questão ou
   null; questões repetidas na mesma folha são recusadas enquanto houver
   tentativa sobrando.
   -------------------------------------------------------------------------- */
export function montaLista(viaveis, qtd, agrupar, gerarDe) {
  const cotas = new Array(viaveis.length).fill(Math.floor(qtd / viaveis.length));
  let resto = qtd - cotas.reduce((a, b) => a + b, 0);
  for (const i of embaralha(viaveis.map((_, i) => i))) { if (resto <= 0) break; cotas[i]++; resto--; }

  const vistos = new Set();
  const qs = [];
  viaveis.forEach((f, i) => {
    for (let n = 0; n < cotas[i]; n++) {
      let q = null;
      for (let t = 0; t < 40; t++) {
        const cand = gerarDe(f);
        if (!cand) continue;
        if (vistos.has(cand.html) && t < 34) continue;
        q = cand; break;
      }
      if (q) { vistos.add(q.html); qs.push(q); }
    }
  });
  return agrupar ? qs : embaralha(qs);
}

/* --------------------------------------------------------------------------
   As folhas. `cfg` traz escola, titulo, instrucao, ident, layout e gabTipo.
   -------------------------------------------------------------------------- */
function cabecalho(cfg, rotulo, selo) {
  const ident = `<div class="ident">
      <span>Nome: <span class="identline"></span></span>
      <span>Turma: <span class="identline" style="min-width:4rem"></span></span>
      <span>Data: <span class="identline" style="min-width:5rem"></span></span>
    </div>`;
  return `<header class="folha-cab">
      ${selo ? '<span class="selo">Gabarito — folha do professor</span>' : ''}
      ${cfg.escola ? `<p class="escola">${esc(cfg.escola)}</p>` : ''}
      <h2 class="folha-titulo">${esc(cfg.titulo || 'Lista de exercícios')}${rotulo ? `<span class="versao">Versão ${rotulo}</span>` : ''}</h2>
      ${!selo && cfg.instrucao ? `<p class="instrucao">${esc(cfg.instrucao)}</p>` : ''}
      ${!selo && cfg.ident ? ident : ''}
    </header>`;
}

export function folhaAluno(qs, cfg, rotulo) {
  const itens = qs.map((q, i) => {
    const item = `<div class="q"><span class="n">${i + 1})</span><span class="enun">${q.html}</span></div>`;
    return cfg.layout === 'espaco' ? `<div class="qbox">${item}<div class="pauta"></div></div>` : item;
  }).join('');
  return `<article class="folha">${cabecalho(cfg, rotulo, false)}
      <div class="questoes" data-modo="${cfg.layout}">${itens}</div>
    </article>`;
}

/* `extraDe(q)` acrescenta HTML depois da resposta — a reta numérica das
   inequações, o esboço das retas de um sistema. Devolva '' para não usar. */
export function folhaGabarito(qs, cfg, rotulo, extraDe = () => '') {
  const itens = qs.map((q, i) => {
    if (cfg.gabTipo === 'compacto') {
      return `<div class="r"><span class="n">${i + 1})</span><span class="resp">${q.resposta}${extraDe(q)}</span></div>`;
    }
    const passos = q.passos.map((p) =>
      `<p class="${p.tipo === 'nota' ? 'nota' : 'mat'}${p.final ? ' final' : ''}">${p.html}</p>`).join('');
    return `<div class="rcom">
        <div class="q"><span class="n">${i + 1})</span><span class="enun">${q.html}</span></div>
        <div class="passos">${passos}${extraDe(q)}</div>
      </div>`;
  }).join('');
  return `<article class="folha gab">${cabecalho(cfg, rotulo, true)}
      <div class="respostas" data-modo="${cfg.gabTipo}">${itens}</div>
    </article>`;
}

/* Folhas dos alunos primeiro, todos os gabaritos depois — quem imprime várias
   versões quer as folhas dos alunos em sequência, sem intercalar. */
export function montaFolhas(listas, cfg, extraDe) {
  const varias = listas.length > 1;
  const alunos = listas.map((qs, i) => folhaAluno(qs, cfg, varias ? ROTULOS[i] : ''));
  const gabs = cfg.temGab ? listas.map((qs, i) => folhaGabarito(qs, cfg, varias ? ROTULOS[i] : '', extraDe)) : [];
  return alunos.concat(gabs).join('');
}

export function resumo(n, versoes, temGab, nomes) {
  return `${n} ${n === 1 ? 'questão' : 'questões'} · `
    + `${versoes} ${versoes === 1 ? 'versão' : 'versões'}`
    + `${temGab ? ' + gabarito' : ''} · ${nomes.join(', ')}.`;
}
