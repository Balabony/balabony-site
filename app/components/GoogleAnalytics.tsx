'use client'

import Script from 'next/script'

const GA_ID = 'G-NTQKS1MZZD' // 27.10.2026: lazyOnload -> afterInteractive (Google Ad Grants: GA4 губив рекламних відвідувачів, конверсії не доходили в Ads)

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
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          // 01.11.2026 (рішення Богдана): аудиторія Балабонів — Україна, не ЄС.
          // Поза ЄЕЗ/Британією/Швейцарією аналітика й облік реклами працюють одразу
          // (банер — повідомлення з кнопкою «Відмовитися»); персоналізація реклами —
          // лише за явним «Гаразд». Для ЄЕЗ/UK/CH — як раніше: усе вимкнено до згоди.
          // Причина: Ad Grants рахує конверсії лише тих, хто натиснув «Прийняти»,
          // а більшість банер ігнорувала — кампанії «навчалися» наосліп.
          var bbStored = null;
          try { bbStored = localStorage.getItem('balabony_cookie_consent'); } catch (e) {}
          if (bbStored === 'denied') {
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied'
            });
          } else {
            gtag('consent', 'default', {
              ad_storage: 'granted',
              ad_user_data: 'granted',
              ad_personalization: 'denied',
              analytics_storage: 'granted'
            });
            gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'],
              wait_for_update: 500
            });
          }
          // 18.09.2026: згода, дана раніше, вмикається ТУТ, до config.
          // CookieConsent теж її вмикає, але робить це одразу після
          // гідрації, а цей скрипт (lazyOnload) приходить пізніше — тоді
          // window.gtag ще не існувало, і постійні читачі, що погодились,
          // у GA не потрапляли зовсім.
          try {
            if (localStorage.getItem('balabony_cookie_consent') === 'granted') {
              gtag('consent', 'update', {
                ad_storage: 'granted',
                ad_user_data: 'granted',
                ad_personalization: 'granted',
                analytics_storage: 'granted'
              });
            }
          } catch (e) {}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
          // 01.11.2026: подія «прочитав історію» (prochytav_istoriiu) для конверсій Google Ads:
          // сторінка /stories/... або /episodes/..., прокручено 50% і минуло 40 секунд.
          (function () {
            var sent = false, t0 = Date.now(), last = location.pathname;
            function chk() {
              if (location.pathname !== last) { last = location.pathname; sent = false; t0 = Date.now(); }
              if (sent) return;
              var p = location.pathname;
              if (p.indexOf('/stories/') !== 0 && p.indexOf('/episodes/') !== 0) return;
              if (p.indexOf('/stories/zhanr') === 0) return;
              var d = document.documentElement;
              if ((window.scrollY + window.innerHeight) / d.scrollHeight < 0.5) return;
              if (Date.now() - t0 < 40000) return;
              sent = true;
              gtag('event', 'prochytav_istoriiu', { page_path: p });
            }
            window.addEventListener('scroll', chk, { passive: true });
          })();
        `}
      </Script>
    </>
  )
}
