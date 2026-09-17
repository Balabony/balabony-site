'use client'

import { useState } from 'react'
import { workPath } from '@/lib/rss'

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

/**
 * Хештеги — ОДНЕ МІСЦЕ НА ВСІ ВАРІАНТИ (17.09.2026).
 *
 * Однакові для всіх авторів і всіх творів: жанрові довелося б підбирати
 * під кожен текст, а автор отримує готовий допис, а не конструктор.
 *
 * #балабони — бренд. #українськіісторії та #короткіісторії описують те,
 * що є в кожного автора без винятку. #щопочитати — робочий пошуковий тег
 * українського Facebook та Instagram, єдиний тут не про нас, а про читача.
 *
 * Попереднє формулювання містило помилку (#українськігісторії) і жило
 * трьома копіями в тексті — саме тому винесено в константу.
 */
const HASHTAGS = '#балабони #українськіісторії #короткіісторії #щопочитати'

export default function ShareWorkTemplate({
  title,
  slug,
  type = null,
  refCode = null,
  votes = 0,
}: {
  title: string
  slug: string
  /** Тип твору: серії живуть не на /stories/. */
  type?: string | null
  /** Реферальний код автора — мітка, за якою видно, кого він привів. */
  refCode?: string | null
  /** Голоси за озвучення: якщо вони вже є, згадуємо це в тексті. */
  votes?: number
}) {
  /**
   * АДРЕСА З МІТКОЮ АВТОРА (17.09.2026).
   *
   * Було жорстко `/stories/${slug}` без жодної мітки, і це давало дві біди
   * одразу. Перша: серії «Балабонів» і «Тиші» живуть на /episodes/ і /tysha/,
   * тобто автор серії роздавав читачам 404 — та сама помилка, на якій ми вже
   * обпеклися в кнопці зняття з публікації. Друга, важливіша: читач, якого
   * привів автор, у базі був невідрізненний від того, хто прийшов із Google.
   * Ми просили авторів ділитися посиланням і не вимірювали результат.
   *
   * `?ref=` не нова механіка: код лягає в cookie на 90 днів і при першому
   * вході пишеться в users.referred_by (lib/referral.ts). Тобто рахунок
   * «скільки читачів привів автор» тепер збирається сам, без нових таблиць.
   * Зараховується лише той, хто зареєструвався, — і це правильно: саме
   * зареєстрований читач може голосувати за озвучення.
   */
  const base = `https://balabony.com${workPath(type, slug)}`
  const url = refCode ? `${base}?ref=${encodeURIComponent(refCode)}` : base

  /**
   * ТРИ ВАРІАНТИ, А НЕ ОДИН (17.09.2026).
   *
   * Перша версія давала всім один і той самий текст. Якщо ним скористається
   * хоч десяток авторів, стрічка отримує десяток однакових дописів — і це
   * читається як розсилка ботів, тобто гірше, ніж мовчання.
   *
   * Початковий варіант обирається за адресою твору, а не випадково: у двох
   * творів одного автора тексти будуть різні, але при кожному відкритті
   * того самого твору — той самий. Випадковість тут заважала б: автор,
   * який уже правив текст і повернувся, не мусить бачити чужий варіант.
   *
   * Рядок про чергу озвучення лишається в кожному: він дає авторові привід
   * ПРОСИТИ, а не хвалитися, і саме прохання знімає незручність.
   */
  const variants: string[] = [
    [
      `«${title}» — моя історія на Балабонах. Читається за кілька хвилин, безкоштовно й без реєстрації:`,
      url,
      '',
      'Там-таки можна віддати голос за те, щоб її озвучили: чергу на озвучення складають читачі, не редакція.',
      '',
      HASHTAGS,
    ].join('\n'),

    [
      `Якщо маєте кілька вільних хвилин — ось моя історія. «${title}»:`,
      url,
      '',
      'Відкривається без реєстрації й без оплати. А якщо захочеться почути її вголос — унизу сторінки є кнопка голосування за озвучення.',
      '',
      HASHTAGS,
    ].join('\n'),

    [
      `Одна з моїх історій на Балабонах — «${title}».`,
      url,
      '',
      votes > 0
        ? `За її озвучення вже віддано ${votes} ${votes === 1 ? 'голос' : votes < 5 ? 'голоси' : 'голосів'}. Кожен наступний наближає запис — проголосувати можна просто на сторінці.`
        : 'Читати безкоштовно. І якщо зачепить — там один дотик, щоб віддати голос за її озвучення.',
      '',
      HASHTAGS,
    ].join('\n'),
  ]

  // Проста сума кодів літер: стабільна, без залежностей, розподіл достатній.
  const seed = slug.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)

  const [open, setOpen] = useState(false)
  const [vi, setVi] = useState(seed % variants.length)
  const [text, setText] = useState(variants[seed % variants.length])
  const [copied, setCopied] = useState(false)

  // Наступний варіант ЗАМІНЮЄ правки автора — тому кнопка підписана прямо.
  const nextVariant = () => {
    const n = (vi + 1) % variants.length
    setVi(n)
    setText(variants[n])
    setCopied(false)
  }

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
          onClick={nextVariant}
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.18)', background: 'transparent',
            color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Інший варіант ({vi + 1}/{variants.length})
        </button>
        <button
          type="button"
          onClick={() => setText(variants[vi])}
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
