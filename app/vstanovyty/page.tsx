import type { Metadata } from 'next'
import Link from 'next/link'

/**
 * Як поставити Балабони на екран телефона.
 *
 * Чому ця сторінка існує. У підвалі рядки «iOS (Safari PWA)» і
 * «Android (Chrome PWA)» стояли з плашкою «Скоро», хоча все для встановлення
 * давно є: manifest.json, іконки 192/512, service worker (public/sw.js).
 * Тобто ми ховали готову функцію. Але саме зняття плашки нічого не дає:
 * «Safari PWA» пересічному читачеві не каже нічого — потрібні три кроки.
 *
 * Свідомо БЕЗ визначення платформи скриптом і без beforeinstallprompt:
 * показуємо обидві інструкції одразу. Причини дві. Перша — сторінка має
 * працювати офлайн і без JS. Друга — наша аудиторія читає з екранними
 * читалками, і блок, що з'являється після перевірки браузера, для них
 * поводиться непередбачувано.
 */

export const metadata: Metadata = {
  title: 'Як встановити Балабони на телефон — застосунок без магазину',
  description:
    'Три кроки, щоб додати Балабони на екран iPhone або Android: читання на весь екран, швидший запуск і доступ до вже прочитаних текстів без інтернету.',
  alternates: { canonical: 'https://balabony.com/vstanovyty' },
}

const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const MUTED = '#C8D4E8'

const STEPS_IOS = [
  'Відкрийте balabony.com у Safari — саме в Safari, інші браузери на iPhone цього не вміють.',
  'Натисніть кнопку «Поділитися» — квадратик зі стрілкою вгору, внизу екрана.',
  'Прогорніть список і виберіть «На екран “Домів”», тоді «Додати».',
]

const STEPS_ANDROID = [
  'Відкрийте balabony.com у Chrome.',
  'Натисніть три крапки вгорі праворуч.',
  'Виберіть «Встановити застосунок» або «Додати на головний екран».',
]

function Card({ title, note, steps }: { title: string; note: string; steps: string[] }) {
  return (
    <section
      style={{
        background: '#0D1B2A',
        border: '1px solid rgba(239,159,39,0.3)',
        borderRadius: 16,
        padding: '22px 20px',
      }}
    >
      <h2
        style={{
          fontFamily: "'Comfortaa', sans-serif",
          fontSize: 20,
          fontWeight: 700,
          color: GOLD,
          margin: '0 0 6px',
        }}
      >
        {title}
      </h2>
      <p style={{ fontSize: 14, color: '#8CA0B8', margin: '0 0 16px', lineHeight: 1.5 }}>{note}</p>
      <ol style={{ margin: 0, paddingLeft: 22, color: MUTED, fontSize: 16, lineHeight: 1.7 }}>
        {steps.map((s) => (
          <li key={s} style={{ marginBottom: 10 }}>
            {s}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function InstallPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2.5rem 1.25rem calc(88px + env(safe-area-inset-bottom, 0px))',
        background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 100%)',
        fontFamily: "'Montserrat', sans-serif",
        color: CREAM,
      }}
    >
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: "'Comfortaa', sans-serif",
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 700,
            margin: '0 0 14px',
            lineHeight: 1.25,
          }}
        >
          Балабони на екрані телефона
        </h1>

        <p style={{ fontSize: 17, lineHeight: 1.65, color: MUTED, margin: '0 0 10px' }}>
          Окремого застосунку в магазинах немає — і не потрібен. Сайт можна додати
          на головний екран, і він відкриватиметься як звичайний застосунок: своя
          іконка, читання на весь екран без адресного рядка, швидший запуск.
        </p>

        <p style={{ fontSize: 17, lineHeight: 1.65, color: MUTED, margin: '0 0 28px' }}>
          Головне — тексти, які ви вже відкривали, залишаються на пристрої. У дорозі,
          у метро чи при вимкненому світлі вони читаються без інтернету.
        </p>

        <div style={{ display: 'grid', gap: 16, marginBottom: 28 }}>
          <Card
            title="iPhone та iPad"
            note="Через браузер Safari"
            steps={STEPS_IOS}
          />
          <Card
            title="Android"
            note="Через браузер Chrome"
            steps={STEPS_ANDROID}
          />
        </div>

        <section
          style={{
            background: 'rgba(239,159,39,0.08)',
            border: '1px solid rgba(239,159,39,0.25)',
            borderRadius: 14,
            padding: '18px 20px',
            marginBottom: 28,
          }}
        >
          <h2
            style={{
              fontFamily: "'Comfortaa', sans-serif",
              fontSize: 17,
              fontWeight: 700,
              color: GOLD,
              margin: '0 0 8px',
            }}
          >
            Якщо щось пішло не так
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: MUTED, margin: 0 }}>
            На iPhone пункт «На екран “Домів”» буває сховано глибоко в списку —
            прогорніть його до кінця. Якщо кнопки немає взагалі, ви, найпевніше,
            у Chrome або в браузері з посилання: скопіюйте адресу і відкрийте в Safari.
            Не вийшло — напишіть на nazar@balabony.com, підкажемо.
          </p>
        </section>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ef9f27 0%, #f4b942 100%)',
              color: '#0a1628',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            На головну
          </Link>
          <Link
            href="/accessibility"
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: '1px solid rgba(239,159,39,0.5)',
              color: '#FAC775',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            Доступність
          </Link>
        </div>
      </div>
    </main>
  )
}
