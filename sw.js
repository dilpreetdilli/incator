/* IncAtor service worker: lets the app open instantly and when offline. Your data is never touched (it lives in the browser / your Google Drive). */
var CACHE = 'incator-v9';
self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (/(^|\.)(google|googleapis|gstatic|googleusercontent)\.com$/.test(u.hostname) && !/fonts\./.test(u.hostname)) return;   // never cache sign-in or Drive traffic
  // the page itself is always fetched fresh from GitHub (not from the browser's 10-minute cache), so an upload shows up right away
  e.respondWith(
    fetch(r.mode === 'navigate' || /\.html?$/.test(u.pathname) ? new Request(r.url, { cache: 'no-cache', credentials: 'same-origin' }) : r).then(function (res) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(r, copy); }); return res; })
      .catch(function () { return caches.match(r).then(function (m) { return m || (r.mode === 'navigate' ? caches.match('./index.html') || caches.match('./') : undefined); }); })
  );
});
