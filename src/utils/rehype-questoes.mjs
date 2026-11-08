/* Âncoras nas questões das listas em HTML (src/content/listas/).

   Cada questão — um <li> filho direto da lista numerada no topo do arquivo —
   ganha id="q1", "q2"… e o número dela vira um link para a própria âncora:
   <a class="q-num" href="#q3">3.</a>. Assim dá para mandar o aluno direto para
   /materiais/2em/fatorial-somatorio#q8, e o endereço já sai pronto no HTML
   estático — sem JavaScript, e visível para o buscador.

   O número é o mesmo que o aluno vê na folha: a lista em MDX é uma `1.`, `1.`, …
   contínua, e o plugin conta na mesma ordem. Se um arquivo tiver mais de uma
   lista numerada no topo (texto solto no meio), a contagem continua em vez de
   recomeçar, para nunca repetir id. */

const ehElemento = (no, tag) => no?.type === 'element' && no.tagName === tag;

export default function rehypeQuestoes() {
  return (arvore, arquivo) => {
    const caminho = (arquivo.path ?? arquivo.history?.[0] ?? '').replaceAll('\\', '/');
    if (!caminho.includes('/src/content/listas/')) return;

    let n = 0;
    for (const ol of arvore.children.filter((no) => ehElemento(no, 'ol'))) {
      // Continua a contagem numa segunda lista do topo, como o `start` do HTML.
      if (n > 0) ol.properties = { ...ol.properties, start: n + 1 };
      for (const li of ol.children.filter((no) => ehElemento(no, 'li'))) {
        n += 1;
        li.properties = { ...li.properties, id: `q${n}` };
        li.children.unshift({
          type: 'element',
          tagName: 'a',
          properties: {
            className: ['q-num'],
            href: `#q${n}`,
            ariaLabel: `Questão ${n} — link direto`,
          },
          children: [{ type: 'text', value: `${n}.` }],
        });
      }
    }
  };
}
