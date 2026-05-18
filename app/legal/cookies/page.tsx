import type { Metadata } from 'next'
import LegalLayout, { legalStyles as s } from '../LegalLayout'

export const metadata: Metadata = {
  title: 'Політика використання Cookies — Balabony',
  description: 'Як платформа Balabony використовує файли cookies та інші технології відстеження.',
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Політика використання Cookies" updated="18 травня 2026 року">

      <p style={s.p}>
        Ця Політика пояснює, що таке cookies, які саме cookies використовує платформа <strong>balabony.com</strong>, для чого ми їх використовуємо та як ви можете керувати своїми налаштуваннями.
      </p>

      <h2 style={s.h2}>1. Що таке cookies</h2>
      <p style={s.p}>
        Cookies — це невеликі текстові файли, які сайт зберігає у вашому браузері при відвідуванні. Вони допомагають сайту запам&apos;ятати ваші дії та налаштування (мова, тема, авторизація) і покращують зручність користування.
      </p>
      <p style={s.p}>
        Окрім cookies, ми також використовуємо <strong>localStorage</strong> — технологію зберігання даних безпосередньо у вашому браузері, яка не передається на сервер.
      </p>

      <h2 style={s.h2}>2. Які cookies ми використовуємо</h2>

      <h3 style={s.h3}>2.1. Необхідні (technical)</h3>
      <p style={s.p}>Потрібні для базової роботи сайту. Не можуть бути вимкнені.</p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Сесія користувача</strong> — підтримання авторизованого стану</li>
        <li style={s.li}><strong>Безпека</strong> — захист від CSRF та інших атак</li>
        <li style={s.li}><strong>Налаштування</strong> — тема (день/ніч/амбер), розмір шрифту</li>
      </ul>

      <h3 style={s.h3}>2.2. Функціональні</h3>
      <ul style={s.ul}>
        <li style={s.li}><strong>balabony-v2-progress</strong> (localStorage) — прогрес прослуховування для відновлення з місця зупинки</li>
        <li style={s.li}>Збереження останніх переглянутих історій</li>
      </ul>

      <h3 style={s.h3}>2.3. Аналітичні</h3>
      <ul style={s.ul}>
        <li style={s.li}>Знеособлена статистика відвідувань (популярні сторінки, тривалість сесій)</li>
        <li style={s.li}>Не містять персональних даних, не дозволяють ідентифікувати окремого користувача</li>
      </ul>

      <h3 style={s.h3}>2.4. Третіх сторін</h3>
      <p style={s.p}>
        При вбудовуванні зовнішніх сервісів (платіжні системи Fondy/LiqPay/Stripe, відеоплеєр YouTube, кнопки соцмереж) можуть встановлюватись cookies цих сервісів. Їхня політика регулюється відповідними компаніями.
      </p>

      <h2 style={s.h2}>3. Як керувати cookies</h2>
      <p style={s.p}>
        Ви можете в будь-який момент:
      </p>
      <ul style={s.ul}>
        <li style={s.li}>Видалити cookies через налаштування браузера</li>
        <li style={s.li}>Заблокувати cookies повністю або вибірково</li>
        <li style={s.li}>Очистити локальні дані (localStorage) — це скине ваш прогрес прослуховування та налаштування</li>
      </ul>
      <p style={s.p}>
        Інструкції для популярних браузерів:
      </p>
      <ul style={s.ul}>
        <li style={s.li}><strong>Chrome:</strong> Налаштування → Конфіденційність і безпека → Файли cookie</li>
        <li style={s.li}><strong>Firefox:</strong> Налаштування → Приватність і безпека → Куки та дані сайтів</li>
        <li style={s.li}><strong>Safari:</strong> Налаштування → Конфіденційність</li>
        <li style={s.li}><strong>Edge:</strong> Налаштування → Файли cookie та дозволи сайтів</li>
      </ul>
      <p style={s.p}>
        Зверніть увагу: блокування необхідних cookies може призвести до того, що частина функціоналу сайту не працюватиме коректно.
      </p>

      <h2 style={s.h2}>4. Зміни до Політики</h2>
      <p style={s.p}>
        Ми можемо оновлювати цю Політику. Актуальна редакція завжди розміщена за цією адресою; дата останнього оновлення вказана вгорі сторінки.
      </p>

      <h2 style={s.h2}>5. Контакти</h2>
      <p style={s.p}>
        Питання щодо використання cookies — <a href="mailto:nazar@balabony.net" style={{ color: '#f0a500', textDecoration: 'underline' }}>nazar@balabony.net</a>.
      </p>

    </LegalLayout>
  )
}
