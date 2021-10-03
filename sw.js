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
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('Opened cache');
            cache.addAll(urlsToCache.map(function(urlToPrefetch) {
                console.log(urlToPrefetch);
                return new Request(urlToPrefetch, { mode: 'no-cors' });
            })).then(function() {
                console.log('All resources have been fetched and cached.');
            });
        }));
    }
);

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});
