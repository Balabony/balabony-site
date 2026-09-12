'use client'

import { useEffect, useState } from 'react'

/**
 * Рядок фактів під гаслом: скільки історій, авторів, скільки нового за місяць.
 *
 * Клієнтський, бо app/page.tsx має 'use client' — числа беремо з /api/stats.
 * Поки числа не прийшли або дорівнюють нулю, рядок не рендериться зовсім:
 * порожній або нульовий лічильник гірший за його відсутність.
 */

const FONT = "'Montserrat', sans-serif"
const GOLD = '#C08A2E'

type Stats = { works: number; authors: number; fresh: number }

function plural(n: number, one: string, few: string, many: string): string {
  const m100 = n % 100
  const m10 = n % 10
  if (m100 >= 11 && m100 <= 14) return many
  if (m10 === 1) return one
  if (m10 >= 2 && m10 <= 4) return few
  return many
}

export default function FactsLine({ initial }: { initial?: Stats } = {}) {
  // Готові числа з сервера — щоб рядок фактів був у HTML одразу.
  const [s, setS] = useState<Stats | null>(initial && initial.works > 0 ? initial : null)

  useEffect(() => {
    if (initial) return
    fetch('/api/stats')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((d: Stats) => {
        if (d && d.works > 0) setS(d)
      })
      .catch(() => {})
  }, [initial])

  if (!s) return null

  const items = [
    `${s.works} ${plural(s.works, 'історія', 'історії', 'історій')}`,
    `${s.authors} ${plural(s.authors, 'автор', 'автори', 'авторів')}`,
  ]
  // «N нових за місяць» прибрано 12.09.2026 (рішення Богдана): цифра
  // прив'язана до темпу публікацій і в слабкий місяць працює проти нас —
  // «3 нових за місяць» під гаслом читається гірше, ніж мовчання.
  //
  // На її місце — інклюзія. Два числа кажуть про масштаб, третій пункт про
  // те, кому цей масштаб доступний. Формулювання не «темна тема» і не
  // «великий шрифт»: перше звучить як налаштування для програміста, друге
  // називає функцію замість людини.
  items.push('Налаштування для слабкого зору')

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 20px 14px',
        fontFamily: FONT,
        // Було 13px, кремовий #FFF8EE і opacity 0.75 — саме прозорість робила
        // рядок сірим, а не колір. Тепер чистий білий без прозорості й більший
        // кегль: рядок несе три головні числа сайту, і його мають прочитати
        // з першого погляду, зокрема ті, кому адресований третій пункт.
        fontSize: 15,
        fontWeight: 600,
        color: '#ffffff',
        textAlign: 'center',
        lineHeight: 1.6,
      }}
    >
      {items.map((t, i) => (
        <span key={t}>
          {i > 0 && <span style={{ color: GOLD, margin: '0 8px' }}>·</span>}
          {t}
        </span>
      ))}
    </div>
  )
}
