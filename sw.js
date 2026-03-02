const CACHE_NAME = 'ip-analyzer-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './config.js',
  './utils.js',
  './ui.js',
  './api.js',
  './main.js',
  './assets/favicon/favicon.png',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
