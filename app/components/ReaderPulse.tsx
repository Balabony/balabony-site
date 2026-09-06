'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Три питання після прочитаної історії.
 *
 * Повне опитування на /survey має вісімнадцять питань і нуль відповідей —
 * людина зайшла почитати, а не заповнювати анкету. Тут інша ставка: три
 * питання, кожне в один клік, прямо в кінці тексту, анонімно й без реєстрації.
 *
 * З'являється лише тому, хто дочитав, і лише раз на кілька днів: питати
 * після кожної серії — це набриднути й отримати сміття замість відповідей.
 */

const ASK_AGAIN_DAYS = 5
const STORE_KEY = 'bb_pulse_at'
const GOLD = '#EF9F27'

type Step = 'liked' | 'genre' | 'age' | 'done'

// Коди інтересів читача. Підписи мусять збігатися з канонічними жанрами
// (lib/genres.ts): читач голосує за «Про війну», а фільтр шукає у базі
// «Військову прозу» — саме через таку розбіжність голоси не працювали.
const GENRES: [string, string][] = [
  ['life', 'Життєві історії'],
  ['family', 'Сімейна історія'],
  ['love', 'Про кохання'],
  ['war', 'Військова проза'],
  ['drama', 'Драма'],
  ['humor', 'Гумор'],
  ['mystic', 'Містика'],
  ['detective', 'Детектив'],
  ['kids', 'Казка'],
]

const AGES: [string, string][] = [
  ['<18', 'До 18'],
  ['18-29', '18–29'],
  ['30-44', '30–44'],
  ['45-59', '45–59'],
  ['60+', '60 і більше'],
]

export default function ReaderPulse({ contentId }: { contentId?: string | null }) {
  const [step, setStep] = useState<Step | null>(null)
  const anchor = useRef<HTMLDivElement | null>(null)
  const [liked, setLiked] = useState<string | null>(null)
  const [genre, setGenre] = useState<string | null>(null)

  const remember = () => {
    try { window.localStorage.setItem(STORE_KEY, String(Date.now())) } catch { /* нічого */ }
  }

  // Компонент стоїть у розмітці завжди, тож саме по собі відкриття сторінки
  // ще нічого не означає: людина могла заглянути й одразу піти. Показуємо
  // тільки коли блок справді потрапив на екран — це і є ознака, що текст
  // дочитано до кінця.
  //
  // Позначку «питали» ставимо в ТОЙ САМИЙ момент, а не після відповіді.
  // Раніше вона писалась лише тому, хто дійшов до останнього питання;
  // решта — тобто більшість — бачили ті самі три питання під кожним твором.
  useEffect(() => {
    try {
      const at = window.localStorage.getItem(STORE_KEY)
      if (at) {
        const days = (Date.now() - Number(at)) / 86400000
        if (days < ASK_AGAIN_DAYS) return
      }
    } catch {
      // приватний режим — просто показуємо
    }

    const node = anchor.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      remember()
      setStep('liked')
      return
    }

    const io = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          io.disconnect()
          remember()
          setStep('liked')
        }
      },
      { threshold: 0.6 },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [])

  const send = async (payload: Record<string, string | null>) => {
    try {
      await fetch('/api/reader-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: contentId ?? null, ...payload }),
      })
    } catch {
      // відповідь читача не варта того, щоб показувати йому помилку
    }
  }

  // Поки не показуємо — лишаємо порожній якір, інакше спостерігачу нема за чим стежити
  if (!step) return <div ref={anchor} aria-hidden="true" style={{ height: 1 }} />

  // reader-card: у денній темі колонка стає світлим аркушем, а ця картка
  // з власним світлим текстом лишається темною — інакше вона зникає.
  const wrap: React.CSSProperties = {
    marginTop: 30, padding: '18px 20px', borderRadius: 14,
    background: 'rgba(239,159,39,0.07)', border: '1px solid rgba(239,159,39,0.28)',
    textAlign: 'center',
  }
  const question: React.CSSProperties = {
    // Сайт темний: попередній var(--ink) зливався з фоном і читач бачив
    // три кнопки без питання. Золотий — той самий, що в рамці блока
    // й у заголовках сайту, тож опитування читається як частина Балабонів.
    fontSize: 15.5, fontWeight: 700, color: GOLD, margin: '0 0 12px',
  }
  const row: React.CSSProperties = {
    display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
  }
  const chip: React.CSSProperties = {
    padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
    border: '1px solid rgba(22,32,46,0.22)', background: '#fff',
    color: '#16202e', fontSize: 14.5, fontFamily: 'inherit',
  }
  // Перше питання — рівно три відповіді, і вони мають лишатись одним рядком
  // навіть на вузькому телефоні: «Не зайшла» окремим рядком виглядає так,
  // ніби це інша, менш бажана відповідь.
  const rowTight: React.CSSProperties = {
    display: 'flex', gap: 6, flexWrap: 'nowrap', justifyContent: 'center',
  }
  // Три відповіді на перше питання стоять одним рядком і мають лишатись
  // скромними: це підпис під твором, а не головна дія сторінки. Розміри
  // під найвужчий реальний екран — на iPhone SE всередині блока близько
  // 287px, трійка вміщується з полями з обох боків.
  const chipTight: React.CSSProperties = {
    ...chip, padding: '7px 12px', fontSize: 12.5, whiteSpace: 'nowrap',
    flex: '0 1 auto', minWidth: 0, borderWidth: 1,
  }

  if (step === 'done') {
    return (
      <div className="reader-card" style={wrap}>
        <p style={{ ...question, margin: 0 }}>Дякуємо!</p>
        <p style={{ fontSize: 14, color: 'rgba(242,245,249,0.68)', margin: '6px 0 0' }}>
          Ваша відповідь допомагає нам вибирати, що публікувати далі.
        </p>
      </div>
    )
  }

  if (step === 'liked') {
    return (
      <div className="reader-card" style={wrap}>
        <p style={question}>Як вам ця історія?</p>
        <div style={rowTight}>
          {[['yes', 'Сподобалась'], ['ok', 'Нормально'], ['no', 'Не зайшла']].map(([k, label]) => (
            <button
              key={k}
              type="button"
              style={chipTight}
              onClick={() => { setLiked(k); setStep('genre') }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'genre') {
    return (
      <div className="reader-card" style={wrap}>
        <p style={question}>Що вам цікаво читати далі?</p>
        <div style={row}>
          {GENRES.map(([k, label]) => (
            <button
              key={k}
              type="button"
              style={chip}
              onClick={() => { setGenre(k); setStep('age') }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { remember(); void send({ liked, genre: null, age: null }); setStep('done') }}
          style={{
            marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(242,245,249,0.58)', fontSize: 13.5, fontFamily: 'inherit',
          }}
        >
          Пропустити
        </button>
      </div>
    )
  }

  return (
    <div className="reader-card" style={wrap}>
      <p style={question}>Скільки вам років?</p>
      <div style={row}>
        {AGES.map(([k, label]) => (
          <button
            key={k}
            type="button"
            style={chip}
            onClick={() => { remember(); void send({ liked, genre, age: k }); setStep('done') }}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => { remember(); void send({ liked, genre, age: null }); setStep('done') }}
        style={{
          marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(242,245,249,0.58)', fontSize: 13.5, fontFamily: 'inherit',
        }}
      >
        Не хочу відповідати
      </button>
    </div>
  )
}
