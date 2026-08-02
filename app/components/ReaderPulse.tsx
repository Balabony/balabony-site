'use client'

import { useEffect, useState } from 'react'

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

type Step = 'liked' | 'genre' | 'age' | 'done'

const GENRES: [string, string][] = [
  ['family', 'Сімейні історії'],
  ['life', 'Життєві історії'],
  ['war', 'Про війну'],
  ['mystic', 'Містика'],
  ['love', 'Про кохання'],
  ['kids', 'Для дітей'],
  ['humor', 'Гумор'],
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
  const [liked, setLiked] = useState<string | null>(null)
  const [genre, setGenre] = useState<string | null>(null)

  const remember = () => {
    try { window.localStorage.setItem(STORE_KEY, String(Date.now())) } catch { /* нічого */ }
  }

  // Чи не питали нещодавно. localStorage тут доречний: це не дані, а вимикач
  // настирливості; якщо він загубиться, людину спитають ще раз, і тільки.
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
    // Позначку ставимо в момент ПОКАЗУ, а не відповіді. Раніше вона писалась
    // лише тому, хто дійшов до кінця опитування; більшість читачів просто
    // йшли зі сторінки — і бачили ті самі три питання під кожним твором.
    remember()
    setStep('liked')
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

  if (!step) return null

  const wrap: React.CSSProperties = {
    marginTop: 34, padding: '22px 24px', borderRadius: 14,
    background: 'rgba(239,159,39,0.07)', border: '1px solid rgba(239,159,39,0.28)',
    textAlign: 'center',
  }
  const question: React.CSSProperties = {
    fontSize: 17, fontWeight: 700, color: 'var(--ink, #16202e)', margin: '0 0 14px',
  }
  const row: React.CSSProperties = {
    display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
  }
  const chip: React.CSSProperties = {
    padding: '9px 16px', borderRadius: 999, cursor: 'pointer',
    border: '1px solid rgba(22,32,46,0.22)', background: '#fff',
    color: '#16202e', fontSize: 14.5, fontFamily: 'inherit',
  }

  if (step === 'done') {
    return (
      <div style={wrap}>
        <p style={{ ...question, margin: 0 }}>Дякуємо!</p>
        <p style={{ fontSize: 14, color: 'rgba(22,32,46,0.62)', margin: '6px 0 0' }}>
          Ваша відповідь допомагає нам вибирати, що публікувати далі.
        </p>
      </div>
    )
  }

  if (step === 'liked') {
    return (
      <div style={wrap}>
        <p style={question}>Як вам ця історія?</p>
        <div style={row}>
          {[['yes', 'Сподобалась'], ['ok', 'Нормально'], ['no', 'Не зайшла']].map(([k, label]) => (
            <button
              key={k}
              type="button"
              style={chip}
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
      <div style={wrap}>
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
            color: 'rgba(22,32,46,0.5)', fontSize: 13.5, fontFamily: 'inherit',
          }}
        >
          Пропустити
        </button>
      </div>
    )
  }

  return (
    <div style={wrap}>
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
          color: 'rgba(22,32,46,0.5)', fontSize: 13.5, fontFamily: 'inherit',
        }}
      >
        Не хочу відповідати
      </button>
    </div>
  )
}
