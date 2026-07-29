import ProtectedEmail from '@/app/components/ProtectedEmail'
export const metadata = {
  title: 'Політика Cookies — Balabony',
  description: 'Як Balabony використовує файли cookie та локальне сховище.',
  alternates: { canonical: '/legal/cookies' },
  openGraph: {
    type: 'website',
    url: 'https://balabony.com/legal/cookies',
    title: 'Політика Cookies — Balabony',
    description: 'Як Balabony використовує файли cookie та локальне сховище.',
    images: [{ url: 'https://balabony.com/og-image.jpg', width: 1200, height: 630 }],
    locale: 'uk_UA',
    siteName: 'Balabony™',
  },
}

export default function CookiesPage() {
  return (
    <>
      <h1>Політика щодо файлів Cookie</h1>
      <p className="legal-meta">Редакція від 29 липня 2026 року</p>

      <h2>1. Що таке cookies</h2>
      <p>
        Файли <strong>cookie</strong> — це невеликі текстові фрагменти даних, які вебсайт зберігає у вашому браузері. Вони використовуються для запам&apos;ятовування налаштувань, аутентифікації, аналітики й покращення взаємодії з сайтом.
      </p>
      <p>
        Окрім класичних cookie, ми також використовуємо <strong>localStorage</strong> та <strong>sessionStorage</strong> — аналогічні механізми збереження даних безпосередньо у браузері.
      </p>

      <h2>2. Які cookies використовує Balabony</h2>

      <h3>2.1. Технічно необхідні (обов&apos;язкові)</h3>
      <ul>
        <li><strong>Сесія аутентифікації</strong> — підтримує ваш вхід в обліковий запис.</li>
        <li><strong>free_view_start</strong> (localStorage) — відлік 8-годинного циклу безкоштовного доступу.</li>
        <li><strong>balabony_age_ok</strong> (localStorage) — запам&apos;ятовує підтвердження повноліття для рубрики 18+, щоб не питати щоразу.</li>
        <li><strong>balabony_user_id</strong> (localStorage) — знеособлений ідентифікатор пристрою; за ним ведеться облік прочитань, з яких нараховується винагорода авторам.</li>
        <li><strong>bly_sid</strong> (sessionStorage) і <strong>bly_acq_sent</strong> (localStorage) — технічна позначка візиту й джерела переходу, щоб не рахувати одне й те саме двічі.</li>
      </ul>
      <p>
        Ці записи необхідні для роботи сайту й не можуть бути відключені.
      </p>

      <h3>2.2. Ваші налаштування</h3>
      <ul>
        <li><strong>balabony-night</strong> — світла або темна тема.</li>
        <li><strong>balabony-font-size</strong> — обраний розмір шрифту.</li>
        <li><strong>balabony-eyecare</strong> — режим дбайливого читання.</li>
        <li><strong>balabony_a11y</strong> — налаштування доступності.</li>
        <li><strong>balabony_reviews</strong>, <strong>balabony_support</strong> — щоб повторно не показувати вікна, які ви вже закрили.</li>
      </ul>
      <p>
        Ці записи зберігаються лише у вашому браузері й нікуди не передаються.
      </p>

      <h3>2.3. Аналітичні — лише за вашою згодою</h3>
      <ul>
        <li><strong>Google Analytics / gtag</strong> — допомагає нам розуміти, які історії читають, де люди натрапляють на труднощі та що виправити. Збирає знеособлені дані: тип пристрою, країну, поведінку на сторінці.</li>
        <li><strong>Google Ads</strong> — облік результативності наших оголошень.</li>
        <li><strong>Vercel Analytics</strong> — анонімна статистика продуктивності сайту.</li>
      </ul>
      <p>
        До того, як ви дасте згоду, ці сервіси працюють у режимі без збереження даних: аналітичні
        й рекламні файли у вашому браузері не створюються. Ваш вибір зберігається у записі{" "}
        <strong>balabony_cookie_consent</strong> — його можна змінити будь-коли, натиснувши
        «Налаштування cookie» внизу сторінки або очистивши дані сайту в браузері.
      </p>

      <h3>2.4. Платіжні</h3>
      <p>
        Під час оплати через <strong>LiqPay</strong>, <strong>ПриватБанк</strong> або <strong>Ощадбанк</strong> ці провайдери можуть встановлювати власні cookies для безпеки транзакції. Управління цими файлами регулюється політиками відповідних компаній.
      </p>

      <h2>3. Управління cookies</h2>
      <p>
        Ви можете в будь-який момент змінити налаштування cookie у вашому браузері:
      </p>
      <ul>
        <li><strong>Chrome:</strong> Налаштування → Конфіденційність і безпека → Cookies та інші дані сайтів</li>
        <li><strong>Safari:</strong> Налаштування → Конфіденційність → Керування даними вебсайтів</li>
        <li><strong>Firefox:</strong> Налаштування → Приватність та безпека → Cookie та дані сайтів</li>
        <li><strong>Edge:</strong> Налаштування → Файли cookie та дозволи сайтів</li>
      </ul>
      <p>
        Зверніть увагу: вимкнення необхідних cookie може зламати функціонал авторизації та читання.
      </p>

      <h2>4. Третя сторона</h2>
      <p>
        Деякі сторінки можуть вбудовувати контент із зовнішніх сервісів (YouTube, Vimeo, соцмережі). Ці сервіси встановлюють власні cookie незалежно від нас. Ми не контролюємо їх політики.
      </p>

      <h2>5. Зміни в політиці</h2>
      <p>
        Ми залишаємо за собою право оновлювати цю Політику. Про суттєві зміни повідомимо банером на сайті або у листі на ваш email.
      </p>

      <h2>6. Контакти</h2>
      <p>
        Питання щодо cookies — пишіть на <ProtectedEmail user="nazar" domain="balabony.com" />.
      </p>
    </>
  )
}
