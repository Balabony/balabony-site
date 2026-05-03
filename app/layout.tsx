import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateBanner from './components/UpdateBanner'

export const metadata: Metadata = {
  title: 'Balabony® — Українські аудіоісторії для дітей і дорослих',
  description: 'Balabony — платформа українських аудіоісторій. Слухайте серіали та окремі твори від авторів з усієї України. Перші 3 серії безкоштовно.',
  keywords: ['аудіоісторії', 'аудіоказки', 'українські казки', 'балабони', 'слухати українською'],
  authors: [{ name: 'Balabony®' }],
  robots: 'index, follow',
  alternates: { canonical: 'https://balabony.com/' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/',
    title: 'Balabony® — Українські аудіоісторії',
    description: 'Слухайте українські аудіоісторії онлайн і офлайн. Серіали, казки, оповідання. Перші 3 серії — безкоштовно.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony®',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balabony® — Українські аудіоісторії',
    description: 'Слухайте українські аудіоісторії онлайн і офлайн.',
    images: ['https://balabony.com/og-image.jpg'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ef9f27',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Balabony" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body>
        {children}
        <UpdateBanner />
        <script dangerouslySetInnerHTML={{
          __html: `
(function() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {

      function notifyUpdate() {
        window.__swUpdateAvailable = true;
        window.dispatchEvent(new CustomEvent('sw-update'));
      }

      // Already a waiting worker on page load (e.g. user refreshed)
      if (reg.waiting && navigator.serviceWorker.controller) notifyUpdate();

      reg.addEventListener('updatefound', function() {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function() {
          // New SW installed and there's an existing controller = real update
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate();
          }
        });
      });

      // When SKIP_WAITING takes effect, reload once
      var reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });

    }).catch(function(err) {
      console.warn('SW registration failed:', err);
    });
  });
})();
          `
        }} />
      </body>
    </html>
  )
}
