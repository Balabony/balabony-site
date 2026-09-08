'use client'

import Script from 'next/script'

/**
 * Рекламний тег Google Ads — ТІЛЬКИ на сторінках, де може статися конверсія.
 *
 * Раніше `gtag('config', 'AW-...')` стояв у GoogleAnalytics.tsx, тобто в layout,
 * і виконувався на кожній сторінці сайту. Через це gtag дотягував окремий
 * рекламний скрипт вагою 192,5 КіБ — у замірі PageSpeed від 08.09.2026 він
 * стояв двічі, разом близько 385 КіБ на КОЖНЕ відкриття будь-якої сторінки.
 * А реальна конверсія є рівно одна: копіювання донат-реквізитів на /support
 * (send_to: AW-16967022103/klXQCNbSx7IcEJfswJo_).
 *
 * Події `begin_checkout` і `purchase` сюди не належать — це події GA4, вони
 * йдуть через основний тег і рекламного скрипта не потребують.
 *
 * Черга dataLayer працює незалежно від порядку завантаження: конфіг можна
 * покласти в неї до того, як приїде gtag.js — він розбере її, коли завантажиться.
 */
const ADS_ID = 'AW-16967022103'

export default function GoogleAds() {
  return (
    <Script id="google-ads-config" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('config', '${ADS_ID}');
      `}
    </Script>
  )
}
