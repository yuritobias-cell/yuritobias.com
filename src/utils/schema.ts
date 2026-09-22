/* Peças compartilhadas dos dados estruturados (JSON-LD).

   As páginas montam o próprio esquema — é o conteúdo delas que manda —, mas a
   identidade do autor, a do site, a licença e a tradução de `assuntos` para nós
   do grafo são as mesmas em todo lugar, e repeti-las é o caminho curto para
   duas páginas dizerem coisas diferentes sobre a mesma pessoa.

   Importa `assuntos.json` direto, e não `utils/assuntos.ts`: aquele módulo
   importa `ferramentas.ts`, que consome este — pelo manifesto não há ciclo. */
import assuntos from '../data/assuntos.json';

export const SITE = 'https://yuritobias.com';

/** Referências aos nós definidos na home (`Person` e `WebSite`). */
export const AUTOR = { '@id': `${SITE}/#eu` };
export const SITE_REF = { '@id': `${SITE}/#site` };

/** A mesma licença anunciada no rodapé e em /para-professores. */
export const LICENCA = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';

/** Para quem o material é feito — vale para as ferramentas e para os materiais. */
export const NIVEL = 'Ensino Fundamental (anos finais) e Ensino Médio';

const nomeDoAssunto = new Map(assuntos.map((a) => [a.slug, a.nome]));

/** Os `assuntos` de um item viram nós `about`, ligados à página do assunto —
    é o que costura ferramenta, curso e material ao mesmo tema dentro do grafo.
    Slug inexistente já derruba o build em utils/assuntos.ts; aqui, no pior
    caso, o próprio slug serve de nome. */
export const sobreAssuntos = (slugs?: string[]) =>
  (slugs ?? []).map((slug) => ({
    '@type': 'Thing',
    name: nomeDoAssunto.get(slug) ?? slug,
    url: `${SITE}/assuntos/${slug}`,
  }));

/** Conteúdo gratuito e sem cadastro: o par que o schema.org espera para dizer isso. */
export const DE_GRACA = {
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'BRL' },
};
