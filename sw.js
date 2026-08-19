// Offline-capable cache for the app shell.
//
// Strategy:
//   - App code (HTML/CSS/JS that changes on every update) uses
//     NETWORK-FIRST: always fetch the latest deployed version when online,
//     and only fall back to the cached copy when offline. This is the fix
//     for "I pushed an update but the phone still shows the old version" —
//     a pure cache-first strategy (the previous approach) can serve a
//     stale copy indefinitely once cached.
//   - Large third-party vendor libraries (rarely change) use CACHE-FIRST
//     so they don't re-download on every load.
//   - /api/* (the AI endpoint) is never cached — always network.
//
// IMPORTANT: bump CACHE_VERSION whenever files change, so old cached
// entries are discarded on the next visit.
const CACHE_VERSION = 'v3';
const CACHE = 'icool-docs-' + CACHE_VERSION;

const APP_SHELL = [
  './', './index.html', './styles.css', './i18n.js', './store.js', './render.js', './app.js',
  './manifest.json',
  './assets/logo.png', './assets/signature.png',
  './fonts/Tajawal-Regular.ttf', './fonts/Tajawal-Medium.ttf', './fonts/Tajawal-Bold.ttf', './fonts/Tajawal-ExtraBold.ttf',
  './icons/icon-192.png', './icons/icon-512.png',
];
const VENDOR_SHELL = [
  './vendor_qrcode.js', './vendor_jsqr.js', './vendor_html2canvas.js', './vendor_jspdf.js',
  './vendor_pdfjs.js', './vendor_pdfjs.worker.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL.concat(VENDOR_SHELL)))
      .catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

function isVendorAsset(pathname){
  return VENDOR_SHELL.some((v) => pathname.endsWith(v.replace('./', '/')));
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/')) return; // always network for AI calls
  if (event.request.method !== 'GET') return;

  if (isVendorAsset(url.pathname)){
    // cache-first for large, rarely-changing third-party libraries
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((resp) => {
        if (resp && resp.status === 200){
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      }))
    );
    return;
  }

  // network-first for the app's own code, so updates are picked up immediately
  event.respondWith(
    fetch(event.request).then((resp) => {
      if (resp && resp.status === 200){
        const copy = resp.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});
