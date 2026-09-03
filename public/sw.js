/**
 * Service worker de Pato.
 *
 * Objetivo: que la app abra desde la pantalla de inicio aunque no haya red,
 * que es lo que separa una web guardada de algo que se siente nativo.
 *
 * Estrategias:
 *   - Navegación  → red primero, con el shell cacheado como respaldo offline.
 *   - Estáticos   → caché primero (los nombres llevan hash, nunca cambian).
 *   - API         → solo red. Cartas, OAuth y "ahora suena" jamás se cachean.
 */
const VERSION = 'v1'
const SHELL_CACHE = `pato-shell-${VERSION}`
const ASSET_CACHE = `pato-assets-${VERSION}`

// Mínimo imprescindible para pintar la app sin red.
const SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll falla entero si un recurso falla: se añaden de uno en uno.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('pato-') && k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Nada de otro origen (Spotify, YouTube, Google Fonts) ni la API propia.
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstShell(request))
    return
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request))
  }
})

function isStaticAsset(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/photos_videos/') ||
    /\.(?:css|js|svg|png|jpe?g|webp|woff2?)$/.test(pathname)
  )
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE)
  const hit = await cache.match(request)
  if (hit) return hit

  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') cache.put(request, response.clone())
    return response
  } catch (err) {
    // Sin red y sin copia: que lo resuelva el navegador.
    throw err
  }
}

async function networkFirstShell(request) {
  const cache = await caches.open(SHELL_CACHE)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put('/', response.clone())
    return response
  } catch {
    // Es una SPA: cualquier ruta se sirve desde el mismo shell.
    return (await cache.match('/')) || Response.error()
  }
}
