// FILE: app/legal/author-contract/page.tsx
// Серверний компонент. Повний текст авторського договору у відкритому доступі.
//
// До 03.09.2026 тут був переказ умов «своїми словами» з номерами пунктів збоку.
// Переказ прибрано свідомо: він жив окремо від тексту договору і після кожної
// правки розходився з ним. Тепер сторінка читає той самий масив CONTRACT_BLOCKS,
// з якого рендериться кабінет автора (/author/contract/[id]) і рахується
// контрольна сума (lib/contract/hash.ts). Розійтися вони більше не можуть.
//
// Персональні дані не оприлюднюються: плейсхолдери {{...}} замінено рисками.
// Короткий блок «Головне за хвилину» — єдине місце, яке треба звіряти вручну
// після правки договору. Тримати його мінімальним.

import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTRACT_BLOCKS } from '@/lib/contract/template'
import { templateFingerprint } from '@/lib/contract/hash'

export const metadata: Metadata = {
  title: 'Авторський договір — Balabony',
  description:
    'Повний текст авторського договору Balabony у відкритому доступі: ставки 50% і 40%, формула винагороди, строк передачі прав, аудіо, переклади, доступні формати, права, що залишаються за автором.',
  alternates: { canonical: 'https://balabony.com/legal/author-contract' },
  openGraph: {
    title: 'Авторський договір — Balabony',
    description:
      'Повний текст авторського договору Balabony у відкритому доступі, без персональних даних. Умови однакові для всіх авторів.',
    url: 'https://balabony.com/legal/author-contract',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
  },
}

// Редакція та дата — правити разом із lib/contract/template.ts.
const REVISION = 'v5.0'
const REVISION_DATE = '3 вересня 2026'

// Звіряти після кожної правки договору. Тримати коротким.
const KEY_TERMS: { t: string; d: string }[] = [
  {
    t: 'Скільки ви отримуєте',
    d: '50% доходу, якщо ви ФОП. 40% «на руки», якщо фізична особа — податки платимо ми понад цю суму. Ставка однакова для всіх авторів (п. 5.3).',
  },
  {
    t: 'Як рахується',
    d: 'Ваша частка прочитань і прослуховувань від усіх на платформі, помножена на базу розрахунку і на ставку. Виплати щомісяця (п. 5.2, 5.8).',
  },
  {
    t: 'Скільки триває',
    d: 'Три роки на кожен твір окремо, від дня його публікації. Далі автопродовження на рік, якщо ніхто не заперечив (п. 4.2).',
  },
  {
    t: 'Що ви передаєте',
    d: 'Текст, аудіо, переклади, доступні формати для незрячих, публікацію в наших газетах і читання вголос на заходах (розділ 3).',
  },
  {
    t: 'Що залишається вам',
    d: 'Видати твір книжкою. Екранізація і сценарій. Навчання чужого ШІ на ваших текстах. Ім’я автора зазначається завжди (п. 2.7-1, 3.14, 3.19, 6.5).',
  },
  {
    t: 'Гонорари за газету',
    d: 'Виплачені раніше гонорари за друк договір не скасовує і нових зобов’язань щодо них не створює. Права на цифру передаються вперше саме цим договором (п. 2.4-2).',
  },
  {
    t: 'Гранти',
    d: 'Твори можуть безоплатно використовуватися в грантових і соціальних проєктах. Грантові кошти в базу розрахунку не входять і між авторами не діляться — винагорода йде з передплати (п. 3.15, 1.20-1).',
  },
]

/** Прибирає плейсхолдери: у відкритому тексті персональних даних немає. */
function depersonalise(t: string): string {
  return t.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (key === 'WORKS_COUNT') return '___'
    if (key === 'PEN_NAME') return '—'
    return '_______________'
  })
}

export default function AuthorContractPage() {
  const fingerprint = templateFingerprint()

  return (
    <>
      <div
        style={{
          border: '1px solid #d6c9b4',
          background: 'rgba(214, 201, 180, 0.18)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 26,
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 14,
          lineHeight: 1.65,
        }}
      >
        <p style={{ margin: 0 }}>
          Нижче — <strong>повний текст</strong> договору, який ми укладаємо з авторами.
          Редакція <strong>{REVISION}</strong> від {REVISION_DATE}. Персональні дані
          й номер договору замінено рисками: вони з’являються лише у вашому власному
          примірнику в кабінеті.
        </p>
        <p style={{ margin: '10px 0 0' }}>
          Стороною договору є <strong>ФОП Хомин Богдан Іванович</strong> («Видавець»).
          Ставка винагороди й формула розрахунку однакові для всіх — окремих умов
          для окремих людей у нас немає.
        </p>
        <p style={{ margin: '10px 0 0', color: '#6b5c46' }}>
          Контрольна сума редакції:{' '}
          <code style={{ fontSize: 12.5 }}>{fingerprint.slice(0, 16)}</code> — за нею
          можна впевнитися, що текст у вашому кабінеті не відрізняється від цього.
        </p>
      </div>

      <section style={{ marginBottom: 34, fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <h2 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 4px' }}>Головне за хвилину</h2>
        <p style={{ fontSize: 13.5, color: '#6b5c46', margin: '0 0 4px' }}>
          Короткий виклад. У разі розбіжності діє текст договору нижче.
        </p>
        <dl style={{ margin: 0 }}>
          {KEY_TERMS.map((item) => (
            <div key={item.t} style={{ borderTop: '1px solid #e2d8c6', paddingTop: 12, marginTop: 12 }}>
              <dt style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.t}</dt>
              <dd style={{ fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{item.d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div
        style={{
          borderTop: '2px solid #c9b896',
          paddingTop: 26,
          fontFamily: "'Times New Roman', Georgia, serif",
        }}
      >
        {CONTRACT_BLOCKS.map((b, i) => {
          const t = depersonalise(b.t)

          if (b.k === 'h1') {
            return (
              <h1
                key={i}
                style={{
                  fontSize: 23,
                  textAlign: 'center',
                  margin: '0 0 6px',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                {t}
              </h1>
            )
          }

          // Підзаголовок під назвою договору
          if (i === 1) {
            return (
              <p
                key={i}
                style={{ fontSize: 16, textAlign: 'center', margin: '0 0 26px', fontWeight: 700 }}
              >
                {t}
              </p>
            )
          }

          // Рядок «№ … від …» і місто — по краях одного рядка
          if (t.startsWith('№') && t.includes('м. Львів')) {
            const city = 'м. Львів'
            const left = t.replace(city, '').trim()
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 16,
                  flexWrap: 'wrap',
                  fontSize: 14.5,
                  fontWeight: 700,
                  margin: '0 0 20px',
                }}
              >
                <span>{left}</span>
                <span>{city}</span>
              </div>
            )
          }

          if (b.k === 'h2') {
            return (
              <h2 key={i} style={{ fontSize: 16, margin: '22px 0 8px', fontWeight: 700 }}>
                {t}
              </h2>
            )
          }

          if (b.k === 'req') {
            return (
              <p
                key={i}
                style={{ fontSize: 15, margin: '18px 0 6px', fontWeight: 700, letterSpacing: 0.5 }}
              >
                {t}
              </p>
            )
          }

          return (
            <p
              key={i}
              style={{ fontSize: 14.5, lineHeight: 1.65, margin: '0 0 8px', textAlign: 'justify' }}
            >
              {t}
            </p>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: '1px solid #d6c9b4',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        <p style={{ margin: 0 }}>
          Питання щодо умов — напишіть, відповімо на будь-яке:{' '}
          <a href="mailto:nazar@balabony.com" style={{ color: '#5b4a36' }}>
            nazar@balabony.com
          </a>
        </p>
        <p style={{ margin: '10px 0 0' }}>
          <Link href="/become-author" style={{ color: '#5b4a36' }}>
            Стати автором Balabony
          </Link>
        </p>
      </div>
    </>
  )
}
