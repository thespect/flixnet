// Service Worker Oficial de Cineflex Max 4K PWA + CineShield™ AdBlock Filter
// Almacena en caché la interfaz adaptativa y bloquea redes publicitarias a nivel de red,
// sin interceptar flujos de video .m3u8/.ts ni llamadas dinámicas de streaming.

const CACHE_NAME = 'cineflex-max-4k-v4';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './hls.min.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Lista negra de dominios y palabras clave de publicidad / popups para neutralizar a nivel de red
const AD_PATTERNS = [
  'adsterra',
  'monetag',
  'propellerads',
  'popcash',
  'popads',
  'clickadu',
  'exoclick',
  'trafficjunky',
  'hilltopads',
  'admaven',
  'adnxs',
  'doubleclick',
  'taboola',
  'outbrain',
  'mgid',
  '1xbet',
  'bet365',
  'betano',
  'caliente.mx',
  'adservice',
  'popunder',
  'onclickmega',
  'highcpmgate',
  'clksite',
  'ad2up',
  'waptap',
  'tsyndicate',
  'exdynsrv'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  const hrefLower = url.href.toLowerCase();

  // 1. CINESHIELD AD-BLOCK: Neutraliza peticiones a dominios de publicidad y rastreo a nivel de red
  for (const adPattern of AD_PATTERNS) {
    if (hrefLower.includes(adPattern)) {
      event.respondWith(
        new Response('', {
          status: 204,
          statusText: 'No Content (Blocked by CineShield 4K)'
        })
      );
      return;
    }
  }

  if (req.method !== 'GET') return;

  // Nunca interceptar streams de video (.m3u8, .ts, .mp4), API de escaneo ni SDK de Cast
  if (
    url.pathname.includes('/api/scan-streams') ||
    url.pathname.endsWith('api.php') ||
    url.pathname.endsWith('.m3u8') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.mp4') ||
    url.hostname.includes('acek-cdn') ||
    url.hostname.includes('dramiyos-cdn') ||
    url.hostname.includes('edgeone.dev') ||
    url.hostname.includes('vidrack') ||
    url.hostname.includes('gstatic.com')
  ) {
    return;
  }

  // Estrategia Stale-While-Revalidate para imágenes de TMDB
  if (url.hostname === 'image.tmdb.org') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkPromise;
      })
    );
    return;
  }

  // Estrategia Network-First con respaldo en caché para navegación y recursos locales
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          if (req.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return Response.error();
        })
    );
  }
});
