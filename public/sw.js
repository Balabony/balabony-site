// public/sw.js — Balabony PWA Service Worker
// Сторінки: Network First, кеш як запасний варіант (працює офлайн).
// Аудіо: Cache First.
// Bump CACHE_VERSION on every meaningful deploy to trigger update flow
const CACHE_VERSION = 'v9'
const CACHE_STATIC = `balabony-static-${CACHE_VERSION}`
const CACHE_AUDIO  = 'balabony-audio-v1'

// Прочитані сторінки лежать ОКРЕМО і НЕ прив'язані до версії збірки.
// Раніше вони жили в balabony-static-vN, а activate видаляв усі кеші з
// іншим іменем — тобто кожен деплой стирав читачеві весь офлайн-архів.
const CACHE_PAGES = 'balabony-pages-v1'

// Скільки сторінок тримаємо офлайн. Більше — і кеш браузера роздувається
// на телефонах, де місця мало.
const PAGES_LIMIT = 60

const STATIC_PRECACHE = [
  '/',
  '/offline',
  '/manifest.json',
]

/* Ніколи не кешувати: у кабінеті автора лежать банківські реквізити, в /api
   відповіді конкретного користувача. Кеш живе в браузері й віддавався б
   офлайн будь-кому, хто відкриє пристрій. */
const NEVER_CACHE = [
  '/api/',
  '/auth/',
  '/admin/',
  '/author/',
  '/profile',
  '/login',
]

function isPrivate(pathname) {
  return NEVER_CACHE.some((p) => pathname === p || pathname.startsWith(p))
}

/** Обрізаємо кеш сторінок до ліміту, найстаріші йдуть першими. */
async function trimPages() {
  const cache = await caches.open(CACHE_PAGES)
  const keys = await cache.keys()
  if (keys.length <= PAGES_LIMIT) return
  for (const key of keys.slice(0, keys.length - PAGES_LIMIT)) {
    await cache.delete(key)
  }
}

// ─── Install: precache shell, but do NOT skipWaiting ─────────────────────────
// The banner + SKIP_WAITING message controls when the new SW takes over.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      cache.addAll(STATIC_PRECACHE.filter(Boolean))
        .catch(() => { /* ignore missing files during install */ })
    )
  )
  // intentionally no skipWaiting() — controlled via banner
})

// ─── Activate: purge old caches, claim clients ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_AUDIO && k !== CACHE_PAGES)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// ─── Message: allow client to trigger skipWaiting ─────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }
  // Pre-cache a specific audio URL on demand
  if (event.data?.type === 'CACHE_AUDIO' && event.data.url) {
    caches.open(CACHE_AUDIO).then((cache) => {
      fetch(event.data.url).then((res) => {
        if (res.ok && res.status !== 206) cache.put(event.data.url, res)
      }).catch(() => {})
    })
  }
})

// ─── Fetch: Network First with offline fallback ───────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)

  // Audio: Cache First (large files, offline priority)
  if (
    url.pathname.match(/\.(mp3|ogg|wav|m4a|aac)$/i) ||
    url.pathname.includes('/audio/') ||
    url.hostname.includes('cloudinary.com')
  ) {
    event.respondWith(
      caches.open(CACHE_AUDIO).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        try {
          const response = await fetch(event.request)
          if (response.ok && response.status !== 206) cache.put(event.request, response.clone())
          return response
        } catch {
          return new Response('Аудіо недоступне офлайн', { status: 503 })
        }
      })
    )
    return
  }

  // Skip cross-origin requests (fonts, analytics, etc.)
  if (url.origin !== self.location.origin) return

  // Приватне не кешуємо взагалі: ані пишемо, ані віддаємо з кешу.
  if (isPrivate(url.pathname)) return

  const isPage = event.request.mode === 'navigate' || event.request.destination === 'document'
  const target = isPage ? CACHE_PAGES : CACHE_STATIC

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          try {
            const clone = response.clone()
            caches.open(target).then((cache) =>
              cache.put(event.request, clone).then(() => (isPage ? trimPages() : undefined))
            )
          } catch {}
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        if (isPage) {
          // Читаної сторінки в кеші немає — пояснюємо, що сталося,
          // замість того щоб підсовувати головну як підміну.
          const offline = await caches.match('/offline')
          if (offline) return offline
        }
        return new Response('', { status: 404 })
      })
  )
})
