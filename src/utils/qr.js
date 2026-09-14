/* ==========================================================================
   QR code das folhas geradas — o link da própria lista, impresso no papel.

   Vanilla JS de navegador (ver o cabeçalho de matematica.js). O desenho é
   SVG, e não imagem: vetor imprime nítido em qualquer tamanho. Os módulos
   escuros saem num único <path>, e não num <rect> cada — com oito versões na
   tela a diferença é de centenas de KB de DOM.
   ========================================================================== */
import qrcode from 'qrcode-generator';

// A biblioteca converte texto em bytes truncando cada caractere em 8 bits
// (latin-1). No modo byte o que os leitores esperam é UTF-8 — então trocamos
// o conversor antes de qualquer codificação. Mesma correção do gerador-qrcode.
qrcode.stringToBytes = (s) => Array.from(new TextEncoder().encode(s));

/* Um quadradinho por módulo escuro, em coordenadas de módulo. */
function caminho(qr) {
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
  }
  return d;
}

/* --------------------------------------------------------------------------
   O bloco que vai no canto do cabeçalho: o QR e a legenda que diz o que ele é
   (sem a legenda, um quadrado preto no alto da prova só gera dúvida).
   Devolve '' se o texto não couber num QR — a folha sai sem ele, sem quebrar.
   -------------------------------------------------------------------------- */
export function qrDaFolha(link, legenda = 'Esta lista na web') {
  let qr;
  try {
    qr = qrcode(0, 'M');
    qr.addData(link, 'Byte');
    qr.make();
  } catch {
    return '';                       // link longo demais para um QR: folha sem ele
  }
  const n = qr.getModuleCount();
  const m = 2;                       // zona de silêncio, em módulos
  const lado = n + 2 * m;
  const svg = `<svg viewBox="0 0 ${lado} ${lado}" xmlns="http://www.w3.org/2000/svg" role="img">`
    + `<rect width="${lado}" height="${lado}" fill="#fff"/>`
    + `<path transform="translate(${m} ${m})" fill="#1a1a1a" d="${caminho(qr)}"/></svg>`;
  return `<div class="qr" aria-hidden="true">${svg}<span class="qr-txt">${legenda}</span></div>`;
}
