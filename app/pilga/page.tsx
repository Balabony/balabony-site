import type { Metadata } from 'next'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import SocialTariffButton from '@/app/components/SocialTariff'

/**
 * Сторінка пільгового доступу (соціальний тариф 1 ₴ на рік).
 *
 * Чому окрема адреса (23.09.2026). Раніше всі місійні посилання — «Дія»,
 * ветеранські організації, газети — вели на головну, і її прев'ю з пільгою
 * бачила також комерційна аудиторія (батьки, передплата). Воронки
 * змішувалися. Тепер місійні посилання ведуть сюди, а головна отримує
 * власну картинку без пільги.
 *
 * Картинка прев'ю — og-image-v7.jpg (з плашкою «1 ₴ на рік»). Її НЕ міняти
 * на загальну: саме вона пояснює пільгу в чатах і соцмережах.
 *
 * Статуси й вікно підтвердження — спільні з PricingSection
 * (app/components/SocialTariff.tsx), щоб не розійшлися.
 */

const TITLE = 'Пільговий доступ 1 ₴ на рік — Балабони'
const DESCRIPTION =
  'Повний доступ до бібліотеки Балабонів за 1 ₴ на рік для ветеранів (УБД), внутрішньо переміщених осіб і людей з інвалідністю. Статус ВПО та УБД підтверджується через «Дію».'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://balabony.com/pilga' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://balabony.com/pilga',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: [{
      url: 'https://balabony.com/og-image-v7.jpg',
      width: 1200,
      height: 630,
      alt: 'Балабони: 1 ₴ на рік, повний доступ до бібліотеки для ветеранів, людей з інвалідністю та родин ВПО',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['https://balabony.com/og-image-v7.jpg'],
  },
}

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'

const GROUPS = [
  {
    title: 'Ветерани',
    text: 'Учасники бойових дій та особи з інвалідністю внаслідок війни.',
    how: 'Підтвердження через «Дію» — посвідчення УБД або ОІВВ.',
  },
  {
    title: 'Внутрішньо переміщені особи',
    text: 'Люди та родини, які були змушені покинути свій дім.',
    how: 'Підтвердження через «Дію» — довідка ВПО.',
  },
  {
    title: 'Люди з інвалідністю',
    text: 'Незалежно від групи та причини інвалідності.',
    how: 'Завантажте фото довідки МСЕК або посвідчення. Доступ відкривається одразу, документ перевіряє редакція.',
  },
]

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(239,159,39,0.35)',
  borderRadius: 14,
  padding: '20px 22px',
}

export default function PilgaPage() {
  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', fontFamily: FONT, color: CREAM }}>
      <Breadcrumbs items={[{ label: 'Пільговий доступ' }]} />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '8px 5% 56px' }}>
        <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.7rem, 4.5vw, 2.4rem)', lineHeight: 1.2, fontWeight: 800 }}>
          Пільговий доступ: <span style={{ color: GOLD, whiteSpace: 'nowrap' }}>1 ₴ на рік</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, margin: '0 0 28px' }}>
          Повний доступ до бібліотеки українських історій, казок і серіалів —
          для ветеранів, внутрішньо переміщених осіб і людей з інвалідністю.
        </p>

        <div style={{ textAlign: 'center', margin: '0 0 40px' }}>
          <SocialTariffButton />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px' }}>Хто має право</h2>
        <div style={{ display: 'grid', gap: 14, margin: '0 0 40px' }}>
          {GROUPS.map(g => (
            <div key={g.title} style={card}>
              <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: GOLD }}>{g.title}</h3>
              <p style={{ margin: '0 0 8px', fontSize: 17, lineHeight: 1.5 }}>{g.text}</p>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, color: '#c9d3e0' }}>{g.how}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 16px' }}>Як отримати доступ</h2>
        <ol style={{ fontSize: 17, lineHeight: 1.6, margin: '0 0 40px', paddingLeft: 24 }}>
          <li>Натисніть кнопку «Отримати пільговий доступ».</li>
          <li>Оберіть свою категорію.</li>
          <li>Ветерани й ВПО підтверджують статус у застосунку «Дія»; люди з інвалідністю завантажують фото документа.</li>
          <li>Доступ діє рік із дня підтвердження.</li>
        </ol>

        <div style={{ ...card, margin: '0 0 40px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Ваші дані</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: '#c9d3e0' }}>
            Через «Дію» ми отримуємо лише відповідь «статус підтверджено» або «не підтверджено» —
            без імені, адреси чи номера документа. Докладніше — у{' '}
            <a href="/legal/privacy" style={{ color: GOLD }}>політиці конфіденційності</a>.
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <SocialTariffButton />
          <p style={{ margin: '20px 0 0', fontSize: 16, color: '#c9d3e0' }}>
            Питання? Пишіть на <a href="mailto:nazar@balabony.com" style={{ color: GOLD }}>nazar@balabony.com</a>
            {' '}· <a href="/support" style={{ color: GOLD }}>Підтримати ініціативу</a>
          </p>
        </div>
      </div>
    </main>
  )
}
