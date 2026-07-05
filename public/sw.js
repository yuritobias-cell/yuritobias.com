/* Service worker — páginas e ferramentas funcionam offline após a primeira visita.
   Estratégias:
   - Navegação (HTML): rede primeiro, cache como fallback (atualizações chegam rápido,
     offline continua funcionando).
   - /_astro/ (assets com hash no nome): cache primeiro — são imutáveis.
   - PDFs: rede primeiro com fallback no cache (PDF corrigido com o mesmo nome propaga).
   - Fontes do Google: cache primeiro (aceita respostas opacas).
   Para invalidar tudo, incremente VERSAO. */
const VERSAO = 'v1';
const CACHE_PAGINAS = 'paginas-' + VERSAO;
const CACHE_ASSETS = 'assets-' + VERSAO;
const CACHE_EXTRAS = 'extras-' + VERSAO;

const PRECACHE = [
  '/',
  '/ferramentas/',
  '/ferramentas/sorteador-grupos/',
  '/ferramentas/testador-senhas/',
  '/ferramentas/pluviometria-biomas/',
  '/ferramentas/angulos-circunferencia/',
  '/ferramentas/corrida-ao-20/',
  '/ferramentas/cifrador-emojis/',
];

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

function cacheFirst(req, cacheName, aceitaOpaca) {
  return caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || (aceitaOpaca && res.type === 'opaque')) {
      const copia = res.clone();
      caches.open(cacheName).then((c) => c.put(req, copia));
    }
    return res;
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
    e.respondWith(cacheFirst(req, CACHE_ASSETS, false));
    return;
  }

  if (url.origin === location.origin && url.pathname.endsWith('.pdf')) {
    e.respondWith(networkFirst(req, CACHE_EXTRAS));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(cacheFirst(req, CACHE_EXTRAS, true));
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req, CACHE_EXTRAS, false));
  }
});
