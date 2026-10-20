// Service worker de Loppy. El build (vite.pwa.ts) completa el nombre de la caché y la lista de archivos.
// Guarda la app y Python en el dispositivo: abre al instante y funciona sin internet.

const CACHE = '__CACHE__'
const PRECACHE = __PRECACHE__

self.addEventListener('install', (event) => {
  // { cache: 'reload' } evita copiar una versión vieja desde la caché HTTP.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))),
  )
  // Primera instalación: activar de inmediato. Actualizaciones: esperan a que la app lo pida.
  if (!self.registration.active) self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // Páginas: red primero (para recibir versiones nuevas); sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req))
    return
  }

  // Archivos propios (JS, CSS, Python, fuentes, iconos): caché primero, son inmutables por versión.
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)))
  }
})

async function networkFirst(req) {
  const cache = await caches.open(CACHE)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(req, { signal: controller.signal })
    clearTimeout(timer)
    // Loppy es una sola página: solo la raíz se guarda como copia sin conexión.
    if (res.ok && new URL(req.url).pathname === '/') cache.put('/', res.clone())
    return res
  } catch {
    return (await cache.match('/')) || Response.error()
  }
}

