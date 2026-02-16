const CACHE_NAME = 'photo-pwa-v1';

self.addEventListener('install', (e) => {
  const base = self.location.pathname.replace(/sw\.js$/, '');
  const urls = [base + 'offline.html', base, base + 'index.html'];
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urls).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    const base = self.location.pathname.replace(/sw\.js$/, '');
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(base + 'offline.html').then((r) => r || caches.match(base))
      )
    );
  }
});
