/* IncAtor service worker: lets the app open instantly and when offline, and shows work order notifications from your IncAtor server.
   Your data is never touched (it lives in the browser / your Google Drive). */
var CACHE = 'incator-v34';
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

/* notifications from your IncAtor server (work orders found in Gmail). Tapping one opens IncAtor on that work order. */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'IncAtor', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'IncAtor', { body: d.body || '', tag: d.tag || undefined, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || './', self.location).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.split('#')[0] === url.split('#')[0] && 'focus' in c) { c.postMessage({ type: 'incator-open', url: url }); return c.focus(); }
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : undefined;
  }));
});
