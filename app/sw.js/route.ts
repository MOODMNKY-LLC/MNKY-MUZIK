/**
 * PWA service worker: caches app shell and static assets on install,
 * cache-first for static assets, network-first for API and document.
 */
const CACHE_NAME = 'mnky-muzik-v1';
const STATIC_URLS = [
  '/site.webmanifest',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
];

const SW_SCRIPT = `
const CACHE_NAME = '${CACHE_NAME}';
const STATIC_URLS = ${JSON.stringify(STATIC_URLS)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function isStaticAsset(url) {
  const u = new URL(url);
  if (u.pathname === '/site.webmanifest') return true;
  if (/\\/(favicon|apple-touch-icon|android-chrome).*/.test(u.pathname)) return true;
  if (u.pathname.startsWith('/images/') && /\\.(png|jpg|jpeg|webp|ico|svg)$/i.test(u.pathname)) return true;
  if (u.pathname.startsWith('/_next/static/')) return true;
  return false;
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  if (!url.startsWith(self.location.origin)) return;
  if (url.includes('/api/')) return;

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        const clone = res.clone();
        if (res.ok) caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }))
    );
  }
});
`;

export function GET() {
  return new Response(SW_SCRIPT, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
