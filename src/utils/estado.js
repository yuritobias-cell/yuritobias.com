/* ==========================================================================
   O ESTADO DA LISTA NA URL — permalink das ferramentas geradoras.

   Uma lista gerada é a configuração dos controles mais a semente do sorteio.
   As duas cabem na querystring, e com elas a lista volta idêntica: é o que
   permite guardar a lista de hoje, mandá-la para um colega e imprimir o QR
   que leva o aluno à mesma folha.

   Vanilla JS de navegador (ver o cabeçalho de matematica.js). Genérico de
   propósito: o que cada ferramenta tem de controle sai do próprio PADRAO e
   do objeto de chips — nenhuma lista de campos é repetida aqui.
   ========================================================================== */
import { $, ROTULOS } from './folha.js';
import { qrDaFolha } from './qr.js';

const P_SEMENTE = 's';
const P_VERSAO = 'v';

/* A versão isolada vem da URL de abertura e não muda depois: quem chegou pelo
   QR da folha B continua vendo a folha B enquanto não pedir para ver todas.
   Rótulo que não existe é o mesmo que nenhum — e some da URL na primeira escrita. */
const rotuloDaUrl = new URLSearchParams(location.search).get(P_VERSAO);
const versaoAbertura = rotuloDaUrl && ROTULOS.includes(rotuloDaUrl) ? rotuloDaUrl : null;

/* --------------------------------------------------------------------------
   De que tipo é cada campo — deduzido do padrão e do DOM, sem catálogo à mão.
   Chips múltiplos guardam lista; chips únicos, um valor; o resto é o próprio
   <input>.
   -------------------------------------------------------------------------- */
function tipoDe(campo, padrao, ctl) {
  if (ctl[campo]) return Array.isArray(padrao[campo]) ? 'multi' : 'unico';
  const el = $(campo);
  if (!el) return null;
  if (el.type === 'checkbox') return 'bool';
  if (el.type === 'number') return 'num';
  return 'texto';
}

function valorDe(campo, tipo, ctl) {
  if (tipo === 'multi' || tipo === 'unico') return ctl[campo].ler();
  const el = $(campo);
  if (tipo === 'bool') return el.checked;
  if (tipo === 'num') return parseInt(el.value, 10);
  return el.value.trim();
}

const mesmoValor = (a, b) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((x) => b.includes(x))
    : a === b;

/* Só o que difere do padrão entra na URL — link curto, e legível o bastante
   para se entender o que ele carrega. */
function paramsDaConfig(padrao, ctl) {
  const p = new URLSearchParams();
  for (const campo of Object.keys(padrao)) {
    const tipo = tipoDe(campo, padrao, ctl);
    if (!tipo) continue;
    const v = valorDe(campo, tipo, ctl);
    if (mesmoValor(v, padrao[campo])) continue;
    p.set(campo, tipo === 'multi' ? v.join(',') : tipo === 'bool' ? (v ? '1' : '0') : String(v));
  }
  return p;
}

/* --------------------------------------------------------------------------
   Aplicar o que veio da URL. Tudo aqui é entrada de fora: valor de chip que
   não existe é descartado, número fica para limita() corrigir na leitura e
   texto é cortado no maxlength do campo.
   -------------------------------------------------------------------------- */
export function aplicaUrl(padrao, ctl) {
  const p = new URLSearchParams(location.search);

  for (const campo of Object.keys(padrao)) {
    if (!p.has(campo)) continue;
    const tipo = tipoDe(campo, padrao, ctl);
    const bruto = p.get(campo);
    if (tipo === 'multi' || tipo === 'unico') {
      const aceitos = ctl[campo].valores();
      const vs = bruto.split(',').filter((v) => aceitos.includes(v));
      if (!vs.length) continue;                        // grupo nunca fica vazio
      ctl[campo].repor(tipo === 'multi' ? vs : vs[0]);
    } else if (tipo === 'bool') {
      $(campo).checked = bruto === '1';
    } else if (tipo === 'num') {
      $(campo).value = bruto;
    } else if (tipo === 'texto') {
      const el = $(campo);
      el.value = el.maxLength > 0 ? bruto.slice(0, el.maxLength) : bruto;
    }
  }

  if (versaoAbertura) avisoDeVersao(versaoAbertura);
  return p.get(P_SEMENTE) || '';
}

/* Quem chegou pelo QR de uma folha vê só aquela versão — com a saída para
   voltar à lista inteira, para que ninguém fique preso numa folha só. */
function avisoDeVersao(rotulo) {
  const saida = $('saida');
  if (!saida) return;
  const url = new URL(location.href);
  url.searchParams.delete(P_VERSAO);
  const p = document.createElement('p');
  p.className = 'so-versao';
  p.innerHTML = `Mostrando só a <b>versão ${rotulo}</b> desta lista. `
    + `<a href="${url.pathname}${url.search}">Ver todas as versões</a>`;
  saida.parentNode.insertBefore(p, saida);
}

/** Índice da versão isolada (0 = A), ou null quando a lista sai inteira. */
export const versaoIsolada = () => (versaoAbertura ? ROTULOS.indexOf(versaoAbertura) : null);

/* --------------------------------------------------------------------------
   Escrever a URL. Sem entrada nova no histórico (o botão Voltar continua
   saindo da página) e com folga entre as escritas, porque isto roda a cada
   tecla digitada nos campos de texto.
   -------------------------------------------------------------------------- */
let agendado;
export function guardaUrl(padrao, ctl, semente) {
  clearTimeout(agendado);
  agendado = setTimeout(() => {
    const p = paramsDaConfig(padrao, ctl);
    p.set(P_SEMENTE, semente);
    if (versaoAbertura) p.set(P_VERSAO, versaoAbertura);
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }, 300);
}

/** URL absoluta desta lista. `extra` acrescenta ou sobrescreve parâmetros. */
export function linkDaLista(padrao, ctl, semente, extra = {}) {
  const p = paramsDaConfig(padrao, ctl);
  p.set(P_SEMENTE, semente);
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return `${location.origin}${location.pathname}?${p}`;
}

/* --------------------------------------------------------------------------
   Os extras que o permalink acrescenta à folha: o QR do link e o filtro de
   versão. Uma linha só no pintar() de cada ferramenta.
   -------------------------------------------------------------------------- */
export function extrasDaFolha(padrao, ctl, semente) {
  const ligado = $('qr') && $('qr').checked;
  return {
    soVersao: versaoIsolada(),
    // O link do QR já vem sem o gabarito e preso à versão daquela folha.
    qr: ligado
      ? (rotulo) => qrDaFolha(linkDaLista(padrao, ctl, semente, {
          temGab: '0',
          ...(rotulo ? { [P_VERSAO]: rotulo } : {}),
        }))
      : null,
  };
}

/* --------------------------------------------------------------------------
   Botão de copiar o link, com a confirmação no próprio rótulo. Sem área de
   transferência disponível, mostra o link para copiar à mão.
   -------------------------------------------------------------------------- */
export function copiaLink(botao, padrao, ctl, semente) {
  const link = linkDaLista(padrao, ctl, semente);
  const rotulo = botao.dataset.rotulo || (botao.dataset.rotulo = botao.textContent);
  const avisa = (txt) => {
    botao.textContent = txt;
    clearTimeout(botao._volta);
    botao._volta = setTimeout(() => { botao.textContent = rotulo; }, 2200);
  };
  if (!navigator.clipboard) { prompt('Link desta lista:', link); return; }
  navigator.clipboard.writeText(link)
    .then(() => avisa('Link copiado ✓'))
    .catch(() => prompt('Link desta lista:', link));
}
