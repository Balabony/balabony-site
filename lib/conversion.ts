/**
 * Змістовні конверсії (17.10.2026).
 *
 * Правила Google Ad Grants: основною конверсією може бути лише змістовна дія —
 * підписка, реєстрація, пожертва, заявка. Перегляд сторінки, прокрутка чи час
 * на сайті — НЕ конверсії (їх ставлять у категорію «Інше»).
 *
 * Кожна така дія:
 *  1) іде в Google Analytics подією з тією самою назвою (звідти — імпорт у Google Ads);
 *  2) пишеться в нашу таблицю conversion_events — щоб у /admin/analytics
 *     було видно, скільки й звідки (реклама Google, пошук, Facebook…).
 *
 * НАЗВИ ПОДІЙ НЕ ПЕРЕЙМЕНОВУВАТИ: на них прив'язані цілі в Google Ads.
 */
export type ConversionName =
  | 'pidpyska'              // підписка на розсилку
  | 'donat'                 // скопіював реквізити для пожертви ГО
  | 'pilga_zaiavka'         // подав заявку на пільгу 1 ₴
  | 'stati_avtorom'         // заявка «Стати автором»
  | 'zaiavka_orhanizatsii'  // заявка бібліотеки / НГО / школи
  | 'reiestratsiia'         // новий акаунт читача
  | 'zavantazhennia_pdf'    // завантажив безкоштовний PDF (календар тощо)
  | 'zaiavka_konkurs'       // подав твір на конкурс
  | 'namir_konkurs'         // автор позначив намір узяти участь
  | 'klub'                  // вступ до Клубу Балабонів
  | 'chytets'               // запис у волонтери-читці

export const CONVERSION_LABELS: Record<ConversionName, string> = {
  pidpyska: 'Підписка на розсилку',
  donat: 'Пожертва (реквізити)',
  pilga_zaiavka: 'Заявка на пільгу',
  stati_avtorom: 'Заявка «Стати автором»',
  zaiavka_orhanizatsii: 'Заявка організації',
  reiestratsiia: 'Реєстрація читача',
  zavantazhennia_pdf: 'Завантаження PDF',
  zaiavka_konkurs: 'Заявка на конкурс',
  namir_konkurs: 'Намір участі в конкурсі',
  klub: 'Вступ до Клубу',
  chytets: 'Волонтер-читець',
}

/** Джерело поточної сесії — записує AnalyticsTracker на першій сторінці сесії. */
export function sessionSource(): string {
  try { return sessionStorage.getItem('bly_src') || 'невідомо' } catch { return 'невідомо' }
}

/** Визначити джерело за адресою входу. Викликається один раз на сесію. */
export function rememberSessionSource(): void {
  try {
    if (sessionStorage.getItem('bly_src')) return
    const p = new URLSearchParams(window.location.search)
    let src = 'прямий'
    if (p.get('gclid') || p.get('gbraid') || p.get('wbraid')) src = 'google_ads'
    else if (p.get('utm_source')) src = String(p.get('utm_source')).toLowerCase()
    else if (document.referrer) {
      try {
        const h = new URL(document.referrer).hostname.replace(/^www\./, '')
        if (h !== window.location.hostname.replace(/^www\./, '')) src = h
      } catch { /* ignore */ }
    }
    sessionStorage.setItem('bly_src', src)
  } catch { /* storage blocked */ }
}

export function trackConversion(name: ConversionName, detail?: string): void {
  if (typeof window === 'undefined') return
  // Тег Google Analytics вантажиться ліниво (lazyOnload) — на першій сторінці
  // сесії його може ще не бути. Тоді чекаємо до ~12 секунд, щоб подія не загубилась.
  const sendGa = (tries: number) => {
    try {
      const w = window as unknown as { gtag?: (...args: unknown[]) => void }
      if (typeof w.gtag === 'function') { w.gtag('event', name, detail ? { detail } : {}); return }
      if (tries > 0) setTimeout(() => sendGa(tries - 1), 1000)
    } catch { /* ignore */ }
  }
  sendGa(12)
  try {
    let sid = ''
    try { sid = sessionStorage.getItem('bly_sid') || '' } catch { /* ignore */ }
    const body = JSON.stringify({
      type: 'conversion',
      name,
      detail: detail ? String(detail).slice(0, 200) : null,
      path: window.location.pathname,
      source: sessionSource(),
      session_id: sid || null,
    })
    const blob = new Blob([body], { type: 'application/json' })
    if (!navigator.sendBeacon || !navigator.sendBeacon('/api/analytics/track', blob)) {
      fetch('/api/analytics/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {})
    }
  } catch { /* never break the page */ }
}
