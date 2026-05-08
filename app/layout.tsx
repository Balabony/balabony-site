import type { Metadata, Viewport } from 'next'
import './globals.css'
import UpdateBanner from './components/UpdateBanner'
import AnalyticsTracker from './components/AnalyticsTracker'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

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
    icon: [{ url: '/icon-192.png', type: 'image/png' }],
    apple: '/icon-192.png',
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Balabony" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="shortcut icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <UpdateBanner />
        <AnalyticsTracker />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
