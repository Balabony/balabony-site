import type { Metadata, Viewport } from 'next'
import GoogleAnalytics from './components/GoogleAnalytics'
import './globals.css'
import UpdateBanner from './components/UpdateBanner'
import AnalyticsTracker from './components/AnalyticsTracker'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
import BottomBar from './components/BottomBar'
import A11yApplier from './components/A11yApplier'
import CookieConsent from './components/CookieConsent'
export const metadata: Metadata = {
  metadataBase: new URL('https://balabony.com'),
  title: 'Balabony™ — українські історії для всієї родини',
  description: 'Українські історії в тексті й аудіо. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО — верифікація через Дію.',
  keywords: ['українські історії', 'балабони', 'інклюзивна література', 'доступ для людей з інвалідністю', 'література для ВПО', 'соціальний проєкт'],
  authors: [{ name: 'Balabony™' }],
  robots: 'index, follow',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/',
    title: 'Balabony™ — українські історії для всієї родини',
    description: 'Українські історії в тексті й аудіо. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО — верифікація через Дію.',
    images: [{ url: 'https://balabony.com/og-image-v4.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Balabony™ — українські історії для всієї родини',
    description: 'Українські історії в тексті й аудіо. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО — верифікація через Дію.',
    images: ['https://balabony.com/og-image-v4.jpg'],
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
        <A11yApplier />
        {children}
        <BottomBar />
        <UpdateBanner />
        <AnalyticsTracker />
        <GoogleAnalytics />
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
