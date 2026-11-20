/* 紫八匯 service worker：預先快取所有檔案，之後離線都開到。版本號 = 內容雜湊，內容一變就會更新。 */
var VERSION = 'd27b31a0bb';
var CACHE = 'pp-' + VERSION;
var ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icons/apple-touch-icon.png", "./icons/favicon.svg", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(ASSETS.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
        if (!r.ok) throw new Error('快取失敗 ' + u + ' ' + r.status);
        return c.put(u, r);
      });
    }));
  }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('pp-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(req).catch(function () {
      return req.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    });
  }));
});
