// public/sw.js — Service Worker для Balabony PWA v2
// Офлайн-режим + кешування аудіо для сіл та потягів
const CACHE_STATIC = 'balabony-static-v2'
const CACHE_AUDIO = 'balabony-audio-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/apple-icon.png',
  '/icon-light-32x32.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_AUDIO)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  if (url.pathname.match(/\.(mp3|ogg|wav|m4a|aac)$/i) || url.pathname.includes('/audio/')) {
    event.respondWith(
      caches.open(CACHE_AUDIO).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        try {
          const response = await fetch(event.request)
          if (response.ok) {
            const clone = response.clone()
            cache.put(event.request, clone)
          }
          return response
        } catch {
          return cached || new Response('Аудіо недоступне офлайн', { status: 503 })
        }
      })
    )
    return
  }

  if (url.origin !== self.location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_STATIC).then((cache) => cache.put(event.request, clone))
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

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_AUDIO' && event.data.url) {
    caches.open(CACHE_AUDIO).then((cache) => {
      fetch(event.data.url).then((response) => {
        if (response.ok) cache.put(event.data.url, response)
      })
    })
  }
})
