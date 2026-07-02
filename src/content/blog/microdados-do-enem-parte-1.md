---
title: "Microdados do ENEM - Parte 1"
description: "O que são os microdados do ENEM e por que resolvi explorá-los — introdução de uma série sobre análise de dados educacionais."
date: 2026-07-01T12:00:00-03:00
tags: ["análise de dados", "educação"]
draft: false
---

Comecei a receber, nas últimas semanas, uma série de propagandas nas redes sociais que anunciavam: "Já estão disponíveis os microdados do ENEM!". Essa chamada, patrocinada muito provavelmente, existe para suprir a necessidade das redes de ensino e dos futuros candidatos com indicadores que diferenciem o seu produto, no caso das empresas, ou os seus resultados, no caso dos alunos.

Como no meu trabalho cotidiano já costumo lidar com os microdados governamentais de outras frentes, como os do Censo Escolar, do SAEB e até mesmo do DATASUS, me interessei pelo assunto. Aliás, uma dúvida: você sabe o que são esses tais microdados?

Eles formam o conjunto mais detalhado de informação sobre determinado assunto — no caso do ENEM, os dados de cada candidato que realizou a prova. Imagine uma tabela gigantesca: para ser mais enfático, mais de 4,8 milhões — precisamente, 4.810.772 — linhas, em que cada uma corresponde aos dados de um único candidato.

Temos as informações das alternativas escolhidas, as notas calculadas pela TRI, referências geográficas e dados da unidade educacional. A novidade da edição divulgada em 2026 são as adaptações das informações para se adequar à LGPD, reduzindo drasticamente a possibilidade de identificar o candidato por meio dos dados disponíveis.

Minha curiosidade sobre o assunto aumentou quando percebi que os documentos fornecidos pelo INEP eram realmente pesados: um arquivo .csv com mais de 2 GB me chamou bastante a atenção. Intrigado, busquei informações sobre como manipular dados dessa magnitude com o meu computador. E, nessa busca, iniciei alguns processos analíticos, tratando a informação, adicionando filtros, criando visualizações e aprendendo um pouco mais sobre o assunto.

Aproveitando meu período de férias escolares, a pesquisa, os resultados obtidos, minhas reflexões e dificuldades vão se tornar uma série de postagens aqui no blog, sendo esta apenas a introdução do assunto.

Costumo dizer para alguns colegas que trabalham comigo na área de análise que, ao criar um relatório, um painel ou um simples texto informativo, devemos estar preparados para que eles não sejam usados, ainda que priorizemos a qualidade dos dados, a qualidade da apresentação e a segurança da informação. Ou seja, o objetivo principal deste projeto é satisfazer a minha curiosidade e, tal qual um arquivo, manter a salvo a forma como trabalho e penso hoje, para que, quem sabe, um eu do futuro possa voltar e sentir uma boa (ou má) nostalgia deste tempo.

Antes de terminar, vou deixar aqui uma pequena amostra do tipo de informação de uma das frentes que iremos discutir nas próximas postagens.

## Desempenho no ENEM 2025 por dependência administrativa

<style>
  #grafico-enem-dep .ge-sub{color:var(--muted); font-size:.92rem; margin:0 0 1.4rem; max-width:60ch}
  #grafico-enem-dep .ge-legenda{display:flex; flex-wrap:wrap; gap:.9rem 1.3rem; margin:0 0 1.6rem}
  #grafico-enem-dep .ge-legenda span{display:inline-flex; align-items:center; gap:.45rem; font-size:.85rem}
  #grafico-enem-dep .ge-swatch{width:14px; height:14px; border-radius:3px; display:inline-block}
  #grafico-enem-dep .ge-area-titulo{
    font-family:var(--font-display); font-weight:700;
    font-size:1.05rem; color:var(--accent); margin:1.5rem 0 .1rem;
  }
  #grafico-enem-dep .ge-painel svg{max-width:100%; height:auto; display:block}
  #grafico-enem-dep .ge-nota{
    margin-top:2rem; padding-top:1rem; border-top:1px solid var(--rule);
    font-size:.82rem; color:var(--muted); max-width:64ch;
  }
  #grafico-enem-dep .ge-nota b{color:var(--ink); font-weight:600}
  /* Tooltip flutuante: position:fixed, nunca é recortado pelo painel. */
  #ge-tooltip{
    position:fixed; top:0; left:0; z-index:50; pointer-events:none;
    background:#fff; border:1px solid var(--rule); border-radius:6px;
    box-shadow:0 4px 14px rgba(27,79,79,.14); padding:.55rem .7rem;
    font-size:.82rem; color:var(--ink); min-width:150px;
    opacity:0; transition:opacity .08s ease;
  }
  #ge-tooltip.on{opacity:1}
  #ge-tooltip .cab{font-weight:700; margin-bottom:.25rem; display:flex; align-items:center; gap:.4rem}
  #ge-tooltip .cab i{width:11px; height:11px; border-radius:2px; display:inline-block}
  #ge-tooltip .lin{display:flex; justify-content:space-between; gap:1.2rem; font-variant-numeric:tabular-nums}
  #ge-tooltip .lin span:first-child{color:var(--muted)}
</style>

<div id="grafico-enem-dep">
  <p class="ge-sub">Concluintes com escola declarada — cerca de 40% dos presentes.
     Linha fina: 10º–90º percentil. Barra grossa: intervalo interquartílico (25–75).
     Ponto: mediana. Passe o cursor sobre uma linha para ver os valores.</p>
  <div class="ge-legenda" id="ge-legenda"></div>
  <div id="ge-grafico"></div>
  <p class="ge-nota">
    A linha tracejada em cada painel marca a <b>mediana da rede privada</b>: onde ela
    cruza as demais redes mostra até que ponto de cada distribuição pública o "meio" da
    privada alcança. As distribuições se sobrepõem — o gap entre redes é real, mas não
    determinístico. <b>Fonte:</b> microdados do ENEM 2025 (INEP), processados localmente;
    só agregados suprimidos são publicados.
  </p>
  <div id="ge-tooltip"></div>
</div>

<script type="module">
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

const DADOS = [
  {area:"Ciências da Natureza", dependência:"Federal",  n:68618,   media:535.7, p10:440.1, p25:489.2, p50:538.5, p75:584.3, p90:623.4},
  {area:"Ciências da Natureza", dependência:"Estadual",  n:964885,  media:472.6, p10:384.5, p25:422.6, p50:472.7, p75:520.2, p90:558.9},
  {area:"Ciências da Natureza", dependência:"Municipal", n:6619,    media:500.2, p10:406.7, p25:454.4, p50:503.5, p75:547.7, p90:584.0},
  {area:"Ciências da Natureza", dependência:"Privada",   n:252481,  media:551.9, p10:443.0, p25:496.7, p50:554.1, p75:608.6, p90:654.5},
  {area:"Ciências Humanas",     dependência:"Federal",  n:70097,   media:547.9, p10:433.8, p25:497.0, p50:558.4, p75:605.4, p90:641.8},
  {area:"Ciências Humanas",     dependência:"Estadual",  n:1018248, media:483.7, p10:387.9, p25:427.7, p50:482.6, p75:539.4, p90:582.1},
  {area:"Ciências Humanas",     dependência:"Municipal", n:6952,    media:517.1, p10:411.3, p25:462.8, p50:525.2, p75:574.4, p90:610.8},
  {area:"Ciências Humanas",     dependência:"Privada",   n:257265,  media:566.2, p10:450.6, p25:518.2, p50:576.6, p75:622.9, p90:661.6},
  {area:"Linguagens",           dependência:"Federal",  n:70097,   media:564.0, p10:487.3, p25:529.3, p50:569.5, p75:605.6, p90:636.0},
  {area:"Linguagens",           dependência:"Estadual",  n:1018248, media:508.2, p10:411.1, p25:466.4, p50:516.2, p75:557.0, p90:589.6},
  {area:"Linguagens",           dependência:"Municipal", n:6952,    media:541.7, p10:461.3, p25:508.4, p50:550.0, p75:584.1, p90:612.6},
  {area:"Linguagens",           dependência:"Privada",   n:257265,  media:577.6, p10:500.6, p25:542.9, p50:583.5, p75:618.8, p90:648.6},
  {area:"Matemática",           dependência:"Federal",  n:68618,   media:586.9, p10:412.4, p25:489.4, p50:588.5, p75:680.4, p90:752.8},
  {area:"Matemática",           dependência:"Estadual",  n:964885,  media:480.6, p10:359.0, p25:397.4, p50:462.3, p75:548.6, p90:630.1},
  {area:"Matemática",           dependência:"Municipal", n:6619,    media:532.3, p10:384.6, p25:445.3, p50:528.1, p75:611.2, p90:681.9},
  {area:"Matemática",           dependência:"Privada",   n:252481,  media:620.3, p10:436.6, p25:525.9, p50:627.4, p75:715.4, p90:786.8},
  {area:"Redação",              dependência:"Federal",  n:70097,   media:675.8, p10:480.0, p25:600.0, p50:680.0, p75:800.0, p90:880.0},
  {area:"Redação",              dependência:"Estadual",  n:1018248, media:526.5, p10:260.0, p25:440.0, p50:560.0, p75:660.0, p90:780.0},
  {area:"Redação",              dependência:"Municipal", n:6952,    media:594.6, p10:400.0, p25:500.0, p50:600.0, p75:700.0, p90:820.0},
  {area:"Redação",              dependência:"Privada",   n:257265,  media:729.7, p10:540.0, p25:640.0, p50:760.0, p75:860.0, p90:920.0},
];

// --- Configuração visual -----------------------------------------------------
const PALETA  = {Estadual:"#8AA6A3", Municipal:"#5C8480", Federal:"#B4763A", Privada:"#1B4F4F"};
const ORDEM_Y = ["Privada","Federal","Municipal","Estadual"];
const AREAS   = ["Linguagens","Ciências Humanas","Ciências da Natureza","Matemática","Redação"];
const FONTE   = "'IBM Plex Sans', system-ui, sans-serif";

// Legenda
const legenda = document.getElementById("ge-legenda");
for (const [dep, cor] of Object.entries(PALETA)) {
  const s = document.createElement("span");
  s.innerHTML = `<i class="ge-swatch" style="background:${cor}"></i>${dep}`;
  legenda.appendChild(s);
}

// --- Tooltip HTML customizado ------------------------------------------------
const tt = document.getElementById("ge-tooltip");
const fmt = new Intl.NumberFormat("pt-BR");

function mostrarTooltip(d){
  tt.innerHTML =
    `<div class="cab"><i style="background:${PALETA[d.dependência]}"></i>${d.dependência}</div>`
    + `<div class="lin"><span>n</span><span>${fmt.format(d.n)}</span></div>`
    + `<div class="lin"><span>p10 · p25</span><span>${d.p10} · ${d.p25}</span></div>`
    + `<div class="lin"><span>mediana</span><span>${d.p50}</span></div>`
    + `<div class="lin"><span>p75 · p90</span><span>${d.p75} · ${d.p90}</span></div>`;
  tt.classList.add("on");
}
function esconderTooltip(){ tt.classList.remove("on"); }

// Posiciona a caixa perto do cursor, virando quando encosta na borda da janela.
function posicionarTooltip(ev){
  const cx = ev.clientX, cy = ev.clientY;
  const larg = tt.offsetWidth, alt = tt.offsetHeight;
  let x = cx + 14, y = cy + 14;
  if (x + larg > window.innerWidth)  x = cx - larg - 14;   // vira para a esquerda
  if (y + alt  > window.innerHeight) y = cy - alt  - 14;   // vira para cima
  tt.style.left = Math.max(6, x) + "px";
  tt.style.top  = Math.max(6, y) + "px";
}

// --- Painéis -----------------------------------------------------------------
function painel(area){
  const linhas = DADOS.filter(d => d.area === area);
  const lo = Math.min(...linhas.map(d => d.p10)) - 15;
  const hi = Math.max(...linhas.map(d => d.p90)) + 15;
  const medPriv = linhas.find(d => d.dependência === "Privada")?.p50;

  const chart = Plot.plot({
    width: 720, height: 150, marginLeft: 88, marginTop: 6, marginBottom: 26,
    style: {background:"transparent", fontFamily:FONTE, fontSize:"12px", color:"#2B2B28"},
    x: {domain:[lo,hi], grid:true, label:null, ticks:6},
    y: {domain:ORDEM_Y, label:null, tickSize:0},
    color: {domain:Object.keys(PALETA), range:Object.values(PALETA)},
    marks: [
      medPriv != null
        ? Plot.ruleX([medPriv], {stroke:"#1B4F4F", strokeDasharray:"3,3", strokeOpacity:0.35})
        : null,
      Plot.ruleY(linhas, {y:"dependência", x1:"p10", x2:"p90", stroke:"dependência", strokeWidth:1.4}),
      Plot.ruleY(linhas, {y:"dependência", x1:"p25", x2:"p75", stroke:"dependência", strokeWidth:7, strokeOpacity:0.85}),
      Plot.dot(linhas,   {y:"dependência", x:"p50", fill:"#F8F6F1", stroke:"dependência", strokeWidth:2, r:5}),
      // Marca de interação: seleciona a linha mais próxima em y (hover em qualquer x da faixa).
      // Realça a mediana e alimenta chart.value, que dispara o evento "input".
      Plot.dot(linhas, Plot.pointerY({x:"p50", y:"dependência", r:8, fill:"none",
                                      stroke:"#2B2B28", strokeWidth:1.5})),
    ].filter(Boolean),
  });

  // chart.value = datum apontado (ou null). "input" dispara quando muda.
  chart.addEventListener("input", () => {
    if (chart.value) mostrarTooltip(chart.value);
    else esconderTooltip();
  });
  chart.addEventListener("pointermove", (ev) => { if (chart.value) posicionarTooltip(ev); });
  chart.addEventListener("pointerleave", esconderTooltip);
  return chart;
}

const container = document.getElementById("ge-grafico");
for (const area of AREAS){
  const h = document.createElement("div");
  h.className = "ge-area-titulo"; h.textContent = area;
  container.appendChild(h);
  const p = document.createElement("div");
  p.className = "ge-painel"; p.appendChild(painel(area));
  container.appendChild(p);
}
</script>

Com essa visualização já temos assunto para discutir. Mas não agora.

Obrigado, até a próxima!