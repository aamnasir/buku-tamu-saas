const CACHE_NAME = 'buku-tamu-kiosk-v1';

// Daftar file yang wajib di-cache agar aplikasi bisa dibuka offline
const URLS_TO_CACHE = [
  '/',
  '/kiosk',
  '/manifest.json'
];

// Install: Simpan file ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache opened');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Hapus cache lama jika ada
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Ambil dari cache jika offline, jika online ambil dari network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => caches.match('/kiosk'));
    })
  );
});