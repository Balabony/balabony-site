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
export const metadata: Metadata = {
  metadataBase: new URL('https://balabony.com'),
  title: 'Українські історії, казки й серіали онлайн — Балабони',
  description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО.',
  keywords: ['українські історії', 'балабони', 'інклюзивна література', 'доступ для людей з інвалідністю', 'література для ВПО', 'соціальний проєкт'],
  authors: [{ name: 'Balabony™' }],
  robots: 'index, follow',
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
    description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО.',
    images: [{ url: 'https://balabony.com/og-image-v4.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Українські історії, казки й серіали онлайн — Балабони',
    description: 'Читати українські оповідання, казки й серіали онлайн; аудіо — незабаром. Понад 990 історій українських авторів. Соціальний тариф 1 ₴ на рік для ветеранів, людей з інвалідністю та родин ВПО.',
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
        {/* Шрифти Google підключені НЕБЛОКУВАЛЬНО.

            display=optional, а не swap: зі swap браузер малював текст
            запасним шрифтом, потім підміняв на Lora/Montserrat і
            перераховував висоту всього тексту — CLS 0,948 із 1,131
            (вимір PageSpeed 08.09.2026).

            media="print" робить таблицю стилів необов'язковою для першого
            малювання: браузер качає її паралельно, а не тримає порожній
            екран, поки шукає fonts.googleapis.com, домовляється про
            шифрування й тягне файл. У звіті цей один запит на 2,5 КіБ
            коштував 750 мс із 2 680 мс блокування, а FCP стояв на 5,9 с.
            Скрипт нижче вмикає стилі після завантаження сторінки.

            Ціна, ухвалена свідомо: новий читач на першому відкритті майже
            завжди побачить запасний шрифт (Georgia / Arial). З другого
            разу шрифт береться з кешу й показується одразу.

            noscript — для читачів без JavaScript: там звичайне блокувальне
            підключення, бо інакше вони шрифту не побачать ніколи. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Lora:wght@400;600&family=Montserrat:wght@400;600;700&display=optional"
          rel="stylesheet"
          media="print"
          data-google-fonts=""
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `addEventListener('load',function(){var l=document.querySelector('link[data-google-fonts]');if(l)l.media='all';});`,
          }}
        />
        <noscript>
          <link
            href="https://fonts.googleapis.com/css2?family=Comfortaa:wght@700&family=Lora:wght@400;600&family=Montserrat:wght@400;600;700&display=optional"
            rel="stylesheet"
          />
        </noscript>
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
        <ReferralCapture />
        <GoogleAnalytics />
        <CookieConsent />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
