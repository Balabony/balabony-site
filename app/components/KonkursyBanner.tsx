'use client'

/**
 * Блок конкурсів на головній.
 *
 * Конкурси — найсильніший привід зайти для автора й найпомітніша причина
 * повернутися для читача, а на головній їх не було взагалі. Заявки на «Це
 * довгу історію» приймаються до 31 жовтня, і без цього блока про них знає
 * лише той, хто сам відкриє /konkursy.
 *
 * Блок зникає сам, коли обидва прийоми закінчаться: показувати конкурс із
 * простроченим дедлайном гірше, ніж не показувати нічого.
 */

import Link from 'next/link'

const NAVY_CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

/** Кінець прийому робіт короткого конкурсу — після нього блок ховається. */
const HIDE_AFTER = new Date('2026-12-16T00:00:00+02:00')

type Konkurs = {
  nazva: string
  pryz: string
  umova: string
  deadline: string
  aktyvnyi: boolean
}

export default function KonkursyBanner() {
  const now = new Date()
  if (now >= HIDE_AFTER) return null

  const dovga = now < new Date('2026-11-01T00:00:00+02:00')

  const konkursy: Konkurs[] = [
    {
      nazva: 'Це довга історія',
      pryz: '20 000 ₴',
      umova: 'Десять серій за десять тижнів',
      deadline: dovga ? 'Заявки до 31 жовтня' : 'Прийом завершено',
      aktyvnyi: dovga,
    },
    {
      nazva: 'Коротка історія',
      pryz: '3 000 · 2 000 · 1 000 ₴',
      umova: 'Одна історія до 1500 слів',
      deadline: 'Прийом з 1 листопада до 15 грудня',
      aktyvnyi: true,
    },
  ]

  return (
    <section
      aria-label="Конкурси для авторів"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 4px' }}
    >
      <div
        style={{
          border: `1px solid rgba(239,159,39,0.45)`,
          borderRadius: 14,
          background: NAVY_CARD,
          padding: '18px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: GOLD,
                marginBottom: 4,
              }}
            >
              КОНКУРСИ ДЛЯ АВТОРІВ
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: CREAM }}>
              Напишіть свою історію
            </div>
          </div>

          <Link
            href="/konkursy"
            style={{
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 700,
              color: '#0E1A2B',
              background: GOLD,
              padding: '9px 18px',
              borderRadius: 20,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Умови участі →
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
            gap: 12,
          }}
        >
          {konkursy.map((k) => (
            <Link
              key={k.nazva}
              href="/konkursy"
              style={{
                display: 'block',
                textDecoration: 'none',
                border: '1px solid rgba(239,159,39,0.28)',
                borderRadius: 10,
                padding: '13px 15px',
                opacity: k.aktyvnyi ? 1 : 0.55,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 15,
                  fontWeight: 700,
                  color: CREAM,
                  marginBottom: 5,
                }}
              >
                {k.nazva}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 19,
                  fontWeight: 700,
                  color: GOLD_SOFT,
                  marginBottom: 6,
                }}
              >
                {k.pryz}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: '#B5C6DA', marginBottom: 8 }}>
                {k.umova}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: GOLD }}>
                {k.deadline}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
