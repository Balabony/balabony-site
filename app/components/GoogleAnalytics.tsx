'use client'

import Script from 'next/script'

const GA_ID = 'G-NTQKS1MZZD'

// Рекламний тег Google Ads (AW-...) тут БІЛЬШЕ НЕ ПІДКЛЮЧАЄТЬСЯ.
// Він тягнув окремий скрипт на 192,5 КіБ на кожній сторінці сайту заради
// однієї конверсії на /support. Тепер живе в GoogleAds.tsx і монтується
// точково. Якщо додасте нову конверсію Ads — не повертайте рядок сюди,
// а підключіть <GoogleAds /> на потрібній сторінці.

// 08.09.2026: strategy змінено з afterInteractive на lazyOnload.
// Після усунення подвійного завантаження сторінки TBT показав справжнє
// значення 1 040 мс, і 404 мс з нього — це виконання gtag. afterInteractive
// запускає його одразу після гідрації, тобто просто у вікні вимірювання
// TBT і в момент, коли основний потік і так зайнятий. lazyOnload відкладає
// до події load.
//
// Ціна: відвідувач, який пішов у перші секунди, до аналітики не потрапить.
// Для наших обсягів трафіку це прийнятно; якщо колись знадобиться точний
// підрахунок відмов — повертати afterInteractive і платити балами.

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
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
