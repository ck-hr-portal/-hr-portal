// CK HR Portal service worker.
// Keeps the app installable and loads the page shell quickly. It never stores HR data:
// Firebase requests (other domains) are not touched, so salary and personal data
// always come live from the server and nothing is kept on the phone by this file.
const CACHE = 'ck-hr-shell-v1';
const SHELL = ['./', 'index.html', 'ck_logo.png', 'ckc_logo.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Network first, so a new index.html uploaded to GitHub is picked up straight away.
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
