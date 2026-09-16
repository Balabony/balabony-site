'use client'

import { useState } from 'react'

/**
 * Готовий текст допису про власний твір — для кабінету автора.
 *
 * НАВІЩО, рішення Богдана 16.09.2026. Кнопки «поділитися» стоять на кожній
 * сторінці твору з першого дня, і ними не користуються. Причина не в тому,
 * що ділитися складно: людина не знає, ЩО написати, і соромиться просити
 * читати себе. Готовий текст знімає обидва бар'єри — лишається натиснути
 * «копіювати» і вставити.
 *
 * Чому текст один на всі мережі, а не окремий під кожну: рішення Богдана.
 * Різниця між Facebook і Telegram тут не варта трьох варіантів, у яких
 * автор мусить обирати.
 *
 * Чому без AI: гачки генеруються лише для серіалів. На 978 авторських
 * творів це була б майже тисяча викликів Gemini заради тексту, який автор
 * усе одно перепише під себе. Тому шаблон збирається з того, що вже є в
 * базі, коштує нуль і з'являється миттєво.
 *
 * Текст РЕДАГОВАНИЙ навмисно: автор краще за нас знає, як звертається до
 * своїх читачів. Шаблон — це чернетка, а не остаточний допис.
 */

const AMBER = '#ef9f27'

export default function ShareWorkTemplate({
  title,
  slug,
  votes = 0,
}: {
  title: string
  slug: string
  /** Голоси за озвучення: якщо вони вже є, згадуємо це в тексті. */
  votes?: number
}) {
  const url = `https://balabony.com/stories/${slug}`

  // Рядок про чергу озвучення — не прикраса. Він дає авторові привід
  // просити («проголосуйте»), а не просто хвалитися, і саме прохання
  // найкраще знімає незручність.
  const draft = [
    `Моя історія «${title}» — на Balabony.`,
    '',
    'Читати безкоштовно, без реєстрації:',
    url,
    '',
    'Якщо сподобається — там можна віддати голос за озвучення цього тексту.',
    '',
    '#балабони #українськігісторії',
  ].join('\n')

  const [open, setOpen] = useState(false)
  const [text, setText] = useState(draft)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      return
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-block', marginTop: 10, marginRight: 8,
          fontSize: '0.85rem', fontWeight: 700, color: AMBER,
          background: 'transparent', cursor: 'pointer',
          border: `1px solid ${AMBER}73`, borderRadius: 8, padding: '7px 13px',
          fontFamily: 'inherit',
        }}
      >
        Текст для соцмереж
      </button>
    )
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: 14,
        borderRadius: 10,
        border: '1px solid rgba(239,159,39,0.35)',
        background: 'rgba(239,159,39,0.06)',
      }}
    >
      <div style={{ fontSize: '0.85rem', color: '#e8eef7', lineHeight: 1.6, marginBottom: 8 }}>
        Готовий допис — виправте під себе й скопіюйте. Підходить для Facebook,
        Telegram, Viber і будь-якої іншої мережі.
        {votes > 0 && ` За цей твір уже віддали голосів: ${votes}.`}
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={9}
        style={{
          width: '100%',
          padding: 10,
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.18)',
          background: 'rgba(0,0,0,0.25)',
          color: '#f5f0e8',
          fontSize: '0.88rem',
          lineHeight: 1.6,
          fontFamily: 'inherit',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => void copy()}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700,
            border: `1px solid ${copied ? AMBER : 'rgba(239,159,39,0.5)'}`,
            background: copied ? AMBER : 'transparent',
            color: copied ? '#0e1a2b' : AMBER,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ Скопійовано' : 'Копіювати'}
        </button>
        <button
          type="button"
          onClick={() => setText(draft)}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.18)', background: 'transparent',
            color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Повернути шаблон
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: '8px 12px', borderRadius: 8, fontSize: '0.85rem',
            border: 'none', background: 'transparent', color: '#94a3b8',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Згорнути
        </button>
      </div>

      {/* Єдина відмінність між мережами, яку не можна замовчати: в Instagram
          посилання в підписі не клікається, і допис без цієї поправки просто
          нікуди не веде. */}
      <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6, marginTop: 8 }}>
        В Instagram посилання в підписі не працює — там замініть його на слова
        «посилання в біо» або додайте в Stories.
      </div>
    </div>
  )
}
