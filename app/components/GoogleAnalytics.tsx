'use client'

import Script from 'next/script'

const GA_ID = 'G-NTQKS1MZZD'

// Рекламний тег Google Ads (AW-...) тут БІЛЬШЕ НЕ ПІДКЛЮЧАЄТЬСЯ.
// Він тягнув окремий скрипт на 192,5 КіБ на кожній сторінці сайту заради
// однієї конверсії на /support. Тепер живе в GoogleAds.tsx і монтується
// точково. Якщо додасте нову конверсію Ads — не повертайте рядок сюди,
// а підключіть <GoogleAds /> на потрібній сторінці.

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          // Consent Mode: до згоди користувача аналітика й реклама нічого не зберігають
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  )
}
