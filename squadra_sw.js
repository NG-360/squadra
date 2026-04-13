const CACHE = 'squadra-v1';
const ASSETS = [
  '/squadra/',
  '/squadra/index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Supabase → jamais caché
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  // Statique → réseau d'abord, cache si offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Hors ligne', {status: 503})))
  );
});
