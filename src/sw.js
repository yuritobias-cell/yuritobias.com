/* Service worker — páginas e ferramentas funcionam offline após a primeira visita.
   TEMPLATE: os marcadores de versão e de precache abaixo são preenchidos no
   build pela integração em astro.config.mjs, com a lista real de ferramentas
   e dos arquivos (CSS, JS, fontes) de que elas precisam para funcionar.
   Estratégias:
   - Navegação (HTML): rede primeiro, cache como fallback (atualizações chegam rápido,
     offline continua funcionando).
   - /_astro/ (assets com hash no nome): cache primeiro — são imutáveis.
   - PDFs e o índice da busca: rede primeiro com fallback no cache (arquivo trocado
     com o mesmo nome propaga).
   - Demais recursos locais (fontes, imagens, dados das análises): cache na hora
     e atualização em segundo plano — o arquivo trocado com o mesmo nome chega já
     na visita seguinte, sem depender de a versão do cache mudar. */
const VERSAO = '__VERSAO__';
const CACHE_PAGINAS = 'paginas-' + VERSAO;
const CACHE_ASSETS = 'assets-' + VERSAO;
const CACHE_EXTRAS = 'extras-' + VERSAO;

const PRECACHE = __PRECACHE__;

// O CSS e o JS que as páginas do precache carregam (e o que esses importam):
// sem eles a ferramenta abriria offline sem estilo e sem funcionar.
const ASSETS = __ASSETS__;

// As fontes do site.
const FONTES = __FONTES__;

/* No cache, o endereço decide tudo: cada URL daqui tem uma resposta só. Sem
   isto, um `Vary` do servidor (Origin, por exemplo) faz o pedido de um
   <script type="module"> ou de uma fonte não casar com a cópia guardada pelo
   precache — e o arquivo "some" offline mesmo estando no cache. */
const SEM_VARY = { ignoreVary: true };

/* Busca só o que ainda não está no cache. Os assets têm hash no nome (o mesmo
   nome é sempre o mesmo arquivo), então a cada versão nova do site só desce o
   que de fato mudou — e não o three.js inteiro de novo. */
function completar(cacheName, urls) {
  return caches.open(cacheName).then((c) => Promise.all(
    urls.map((u) => c.match(u, SEM_VARY).then((hit) => hit || c.add(u)))
  ));
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    Promise.all([
      caches.open(CACHE_PAGINAS).then((c) => c.addAll(PRECACHE)),
      completar(CACHE_ASSETS, ASSETS),
      completar(CACHE_EXTRAS, FONTES),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.endsWith('-' + VERSAO)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

function cacheFirst(req, cacheName) {
  return caches.match(req, SEM_VARY).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(cacheName).then((c) => c.put(req, copia));
    }
    return res;
  }));
}

function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then((c) => c.match(req, SEM_VARY).then((hit) => {
    const rede = fetch(req).then((res) => {
      if (res.ok) c.put(req, res.clone());
      return res;
    });
    if (!hit) return rede;
    rede.catch(() => {}); // offline: fica com o que já está no cache
    return hit;
  }));
}

function networkFirst(req, cacheName) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(cacheName).then((c) => c.put(req, copia));
    }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true, ignoreVary: true }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Analytics nunca passa pelo cache
  if (url.hostname === 'gc.zgo.at' || url.hostname.endsWith('goatcounter.com')) return;

  if (req.mode === 'navigate') {
    // As páginas ficam no cache com a barra final (/ferramentas/x/), que é como
    // o servidor as entrega. Endereço digitado ou guardado sem a barra tem de
    // achar a mesma página offline — senão cairia na home, com a URL errada.
    const comBarra = url.pathname.endsWith('/') ? null : url.pathname + '/';
    e.respondWith(
      networkFirst(req, CACHE_PAGINAS)
        .then((r) => r || (comBarra && caches.match(comBarra, SEM_VARY)))
        .then((r) => r || caches.match('/', SEM_VARY))
    );
    return;
  }

  if (url.origin === location.origin && url.pathname.startsWith('/_astro/')) {
    e.respondWith(cacheFirst(req, CACHE_ASSETS));
    return;
  }

  // PDFs e o índice da busca: rede primeiro, cache como reserva. Os dois mudam
  // sem mudar de nome — material novo no site tem de aparecer na busca de quem
  // já visitou, e PDF corrigido tem de substituir o antigo.
  if (url.origin === location.origin
      && (url.pathname.endsWith('.pdf') || url.pathname === '/busca-index.json')) {
    e.respondWith(networkFirst(req, CACHE_EXTRAS));
    return;
  }

  // Sem hash no nome, então nada garante que não mudou: serve o que tem e confere.
  if (url.origin === location.origin) {
    e.respondWith(staleWhileRevalidate(req, CACHE_EXTRAS));
  }
});
