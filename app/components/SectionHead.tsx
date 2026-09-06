'use client'

/**
 * Шапка секції головної сторінки.
 *
 * До неї кожна секція мала власний вигляд: «Свіжі історії» з рамкою навколо
 * надзаголовка, «Казки» із золотою рискою збоку, «Тиша» із синьою плашкою.
 * Посилання «усі» теж різнилися — двічі текстом по центру внизу, один раз
 * великою кнопкою в рамці. Три стилі для однієї дії читаються як три різні
 * сайти.
 *
 * Головне тут не однаковість заради однаковості: посилання переїхало вгору,
 * на рівень заголовка. Окремий рядок унизу з'їдав близько шістдесяти пікселів
 * на секцію плюс повітря навколо — на чотирьох секціях це цілий екран
 * телефона, який читач мусив проминути, щоб дійти до «Тиші» й підписки.
 */

import Link from 'next/link'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

export default function SectionHead({
  kicker,
  title,
  subtitle,
  href,
  linkLabel,
  adult = false,
  color = '#FFFFFF',
  subColor = 'rgba(255,255,255,0.65)',
}: {
  kicker?: string
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
  /** Показати позначку 18+ поруч із надзаголовком. */
  adult?: boolean
  color?: string
  subColor?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 14,
        flexWrap: 'wrap',
        marginBottom: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        {kicker && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: GOLD,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {kicker}
            {adult && (
              <span
                style={{
                  background: '#E0484D',
                  color: '#fff',
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 3,
                  marginLeft: 6,
                  letterSpacing: 0,
                }}
              >
                18+
              </span>
            )}
          </div>
        )}

        <div style={{ fontFamily: FONT, fontSize: 19, fontWeight: 800, color, lineHeight: 1.2 }}>
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              fontFamily: FONT,
              fontSize: 12.5,
              fontStyle: 'italic',
              color: subColor,
              lineHeight: 1.35,
              marginTop: 5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {href && linkLabel && (
        <Link
          href={href}
          style={{
            fontFamily: FONT,
            fontSize: 13.5,
            fontWeight: 700,
            color: GOLD,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            letterSpacing: 0.3,
          }}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  )
}
