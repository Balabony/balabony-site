// public/sw.js — Balabony PWA Service Worker
// Strategy: Network First for pages/assets, Cache First for audio
// Bump CACHE_VERSION on every meaningful deploy to trigger update flow
const CACHE_VERSION = 'v4'
const CACHE_STATIC = `balabony-static-${CACHE_VERSION}`
const CACHE_AUDIO  = 'balabony-audio-v1'

const STATIC_PRECACHE = [
  '/',
  '/manifest.json',
]

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

// ─── Activate: purge old caches, claim clients, notify about update ───────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_AUDIO)
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
        if (res.ok) cache.put(event.data.url, res)
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
          if (response.ok) cache.put(event.request, response.clone())
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

  // Pages & assets: Network First, cache as fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_STATIC).then((cache) =>
            cache.put(event.request, response.clone())
          )
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached
          if (event.request.destination === 'document') return caches.match('/')
        })
      )
  )
})
