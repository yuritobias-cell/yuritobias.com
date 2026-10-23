/* Service worker — páginas e ferramentas funcionam offline após a primeira visita.
   TEMPLATE: os marcadores de versão e de precache abaixo são preenchidos no
   build pela integração em astro.config.mjs, com a lista real de ferramentas.
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

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_PAGINAS)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
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
  return caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) {
      const copia = res.clone();
      caches.open(cacheName).then((c) => c.put(req, copia));
    }
    return res;
  }));
}

function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then((c) => c.match(req).then((hit) => {
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
  }).catch(() => caches.match(req, { ignoreSearch: true }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Analytics nunca passa pelo cache
  if (url.hostname === 'gc.zgo.at' || url.hostname.endsWith('goatcounter.com')) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      networkFirst(req, CACHE_PAGINAS).then((r) => r || caches.match('/'))
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
