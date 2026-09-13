'use client'

import Link from 'next/link'

/**
 * FreeBanner — банер «читати безкоштовно» під Hero.
 *
 * ПЕРЕРОБЛЕНО 13.09.2026 на вимогу Богдана: банер має виглядати так само,
 * як блок конкурсів нижче на головній. Була біла плашка з лівою золотою
 * смугою і темно-синьою кнопкою — єдиний світлий елемент серед темних
 * карток, і на телефоні він читався як чужа вставка, майже як реклама.
 *
 * Тепер оформлення один в один із KonkursyBanner: темна картка, тонка
 * золота рамка, той самий радіус і поля, золота кнопка-пігулка. Текст
 * вирівняний по центру — теж рішення Богдана.
 *
 * Класи free-banner* прибрані свідомо: правила в globals.css перебудовували
 * банер у колонку на вузькому екрані й додавали пульсацію кнопці. Новий
 * банер і так колонка, а пульсації в блоці конкурсів немає — з нею
 * однаковості не вийшло б.
 */

const NAVY_CARD = '#14253B'
const GOLD = '#EF9F27'
const CREAM = '#FFF8EE'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

export default function FreeBanner() {
  return (
    <section
      aria-label="Безкоштовне ознайомлення"
      style={{ maxWidth: 1100, margin: '0 auto', padding: '8px 20px 4px' }}
    >
      <div
        style={{
          border: '1px solid rgba(239,159,39,0.45)',
          borderRadius: 14,
          background: NAVY_CARD,
          padding: '18px 20px',
          textAlign: 'center',
        }}
      >
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
          БЕЗКОШТОВНО. БЕЗ РЕЄСТРАЦІЇ.
        </div>

        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: CREAM }}>
          Понад 900 історій і 24 серії
        </div>

        <Link
          href="#how-it-works"
          style={{
            display: 'inline-block',
            marginTop: 14,
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
          Читати&nbsp;→
        </Link>
      </div>
    </section>
  )
}
