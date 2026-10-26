import type { Metadata, Viewport } from 'next'
import GoogleAnalytics from './components/GoogleAnalytics'
import './globals.css'
import './reader.css'
import UpdateBanner from './components/UpdateBanner'
import AnalyticsTracker from './components/AnalyticsTracker'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
import BottomBar from './components/BottomBar'
import A11yApplier from './components/A11yApplier'
import CookieConsent from './components/CookieConsent'
import ReferralCapture from './components/ReferralCapture'
import VercelAnalyticsGated from './components/VercelAnalyticsGated'
export const metadata: Metadata = {
  metadataBase: new URL('https://balabony.com'),
  title: 'Українські історії, казки й серіали онлайн — Балабони',
  description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів.',
  keywords: ['українські історії', 'балабони', 'інклюзивна література', 'доступ для людей з інвалідністю', 'література для ВПО', 'соціальний проєкт'],
  authors: [{ name: 'Balabony™' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxImagePreview: 'large',
      maxSnippet: -1,
      maxVideoPreview: -1,
    },
  },
  alternates: {
    canonical: '/',
    // Автовиявлення фідів: читалки і скрінрідери шукають саме тут.
    types: {
      'application/rss+xml': [
        { url: '/feed.xml',          title: 'Балабони — усі нові матеріали' },
        { url: '/feed/balabony.xml', title: 'Балабони — сімейний серіал' },
        { url: '/feed/tysha.xml',    title: 'Тиша — авторський серіал' },
        { url: '/feed/stories.xml',  title: 'Історії письменників' },
      ],
    },
  },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/',
    title: 'Українські історії, казки й серіали онлайн — Балабони',
    description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів.',
    // 23.09.2026: головна — комерційна воронка, тож картинка v6 без пільги.
    // Пільга 1 ₴ має власну сторінку /pilga з картинкою v5.
    images: [{ url: 'https://balabony.com/og-image-v6.jpg', width: 1200, height: 630, alt: 'Балабони: понад 990 історій українських авторів — оповідання, казки, серіали' }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Українські історії, казки й серіали онлайн — Балабони',
    description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів.',
    images: ['https://balabony.com/og-image-v6.jpg'],
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
        {/* 12.10.2026: шрифти тепер з нашого сервера (globals.css, public/fonts) — без запитів до Google (GDPR).
            Попереднє завантаження двох основних кириличних файлів: текст історій (Lora) і інтерфейс (Montserrat).
            font-display: optional лишається (рішення 08.09.2026 про CLS). */}
        <link rel="preload" href="/fonts/lora-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/montserrat-cyrillic-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Balabony" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="shortcut icon" href="/icon-192.png" />
        {/* Налаштування читалки — до першого малювання, щоб не блимала
            нічна тема при переході між сторінками. Той самий ключ, що й
            у app/components/ReaderSettings.tsx. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var p=JSON.parse(localStorage.getItem('balabony_reader_v1')||'{}');var d=document.documentElement;if(p.theme)d.setAttribute('data-reader-theme',p.theme);if(p.font)d.setAttribute('data-reader-font',p.font);if(p.scale)d.style.setProperty('--r-scale',String(p.scale));}catch(e){}})()",
          }}
        />
      </head>
      <body>
        <A11yApplier />
        {children}
        <BottomBar />
        <UpdateBanner />
        <AnalyticsTracker />
        <VercelAnalyticsGated />
        <ReferralCapture />
        <GoogleAnalytics />
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
