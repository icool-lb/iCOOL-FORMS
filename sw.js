// Simple offline-first cache for the app shell. The /api/* AI endpoint is
// always fetched from the network (never cached) since it requires a live
// connection to the AI service.
const CACHE = 'icool-docs-v1';
const SHELL = [
  './', './index.html', './styles.css', './i18n.js', './store.js', './render.js', './app.js',
  './vendor_qrcode.js', './vendor_jsqr.js', './manifest.json',
  './assets/logo.png', './assets/signature.png',
  './fonts/Tajawal-Regular.ttf', './fonts/Tajawal-Medium.ttf', './fonts/Tajawal-Bold.ttf', './fonts/Tajawal-ExtraBold.ttf',
  './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return; // always network for AI calls
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((resp) => {
        if (resp && resp.status === 200 && event.request.method === 'GET') {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
