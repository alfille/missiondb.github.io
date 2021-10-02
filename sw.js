var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
  '/',
  '/style/base.css',
  '/style/bg.png',
  '/js/app.js',
  '/js/base.js',
  '/index.html',
  '//cdn.jsdelivr.net/npm/pouchdb@7.2.1/dist/pouchdb.min.js',
];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
