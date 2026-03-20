// ══════════════════════════════════════════════════════
//  HazzinBR Health Survey — Service Worker v2.0
//  Required for PWA install prompt on Android Chrome
// ══════════════════════════════════════════════════════

const CACHE = 'hazzinbr-survey-v2';

const PRECACHE = [
  './health_survey.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ── Install: pre-cache core files ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] Failed to cache:', url, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network first, fall back to cache ──
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // Never intercept Supabase API calls — always needs network
  if (e.request.url.includes('supabase.co')) return;

  // Never intercept Google Fonts
  if (e.request.url.includes('fonts.googleapis.com') ||
      e.request.url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200 && res.type !== 'opaque') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached =>
          cached || caches.match('./health_survey.html')
        )
      )
  );
});
