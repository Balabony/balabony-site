'use client'

import { useState, useEffect } from 'react'

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

const GENRES = [
  'Драма', 'Гумор', 'Казка', 'Детектив', 'Романтика',
  'Трилер', 'Пригоди', 'Фантастика', 'Містика',
  'Історична проза', 'Сімейна історія', 'Бойовик',
  'Жахи', 'Психологія', 'Біографія',
]

interface Question {
  id: string
  label: string
  type: 'radio' | 'checkbox' | 'textarea' | 'text'
  options?: string[]
  hasOther?: boolean
}

const QUESTIONS: Question[] = [
  {
    id: 'age',
    label: 'Скільки вам років?',
    type: 'radio',
    options: ['до 18', '18–24', '25–34', '35–44', '45–54', '55+'],
  },
  {
    id: 'gender',
    label: 'Ваша стать?',
    type: 'radio',
    options: ['Чоловік', 'Жінка', 'Не хочу вказувати'],
  },
  {
    id: 'location',
    label: 'Де ви проживаєте?',
    type: 'text',
  },
  {
    id: 'device',
    label: 'З якого пристрою читаєте?',
    type: 'radio',
    options: ['Телефон', 'Планшет', 'Комп\'ютер'],
  },
  {
    id: 'reading_time',
    label: 'Коли зазвичай читаєте?',
    type: 'radio',
    options: ['Вранці', 'Вдень', 'Ввечері', 'Вночі'],
  },
  {
    id: 'frequency',
    label: 'Як часто читаєте художню літературу?',
    type: 'radio',
    options: ['Щодня', 'Кілька разів на тиждень', 'Рідше'],
  },
  {
    id: 'format',
    label: 'Що більше до вподоби?',
    type: 'radio',
    options: ['Окремі історії', 'Серіали з продовженням', 'Однаково'],
  },
  {
    id: 'audio',
    label: 'Чи слухаєте аудіоверсії?',
    type: 'radio',
    options: ['Так', 'Ні', 'Інколи'],
  },
  {
    id: 'duration',
    label: 'Скільки часу на день готові читати?',
    type: 'radio',
    options: ['До 15 хв', '15–30 хв', '30–60 хв', 'Більше години'],
  },
  {
    id: 'genres',
    label: 'Які жанри подобаються?',
    type: 'checkbox',
    options: GENRES,
    hasOther: true,
  },
  {
    id: 'plan',
    label: 'Який пакет ви обрали і чому?',
    type: 'textarea',
  },
  {
    id: 'source',
    label: 'Звідки дізнались про Balabony?',
    type: 'radio',
    options: ['Соцмережі', 'Друзі', 'Пошук', 'Реклама', 'Інше'],
  },
  {
    id: 'attraction',
    label: 'Що найбільше приваблює на платформі?',
    type: 'textarea',
  },
  {
    id: 'missing',
    label: 'Чого не вистачає?',
    type: 'textarea',
  },
  {
    id: 'budget',
    label: 'Яку суму комфортно витрачати щомісяця?',
    type: 'radio',
    options: ['До 50 грн', '50–100 грн', '100–200 грн', 'Більше 200 грн'],
  },
  {
    id: 'sharing',
    label: 'Чи ділитесь історіями з друзями?',
    type: 'radio',
    options: ['Так', 'Ні', 'Інколи'],
  },
  {
    id: 'recommend',
    label: 'Чи порекомендували б Balabony другу?',
    type: 'radio',
    options: ['Так', 'Ні', 'Можливо'],
  },
]

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
  color: '#f5f0e8', fontSize: 15, fontFamily: FONT, lineHeight: 1.6,
  outline: 'none', boxSizing: 'border-box',
}

function ThankYouScreen() {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => setCountdown(c => c - 1), 1000)
    const redirect = setTimeout(() => { window.location.href = 'https://balabony.com' }, 3000)
    return () => { clearInterval(interval); clearTimeout(redirect) }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ background: '#0f1e3a', border: `1.5px solid ${GOLD}`, borderRadius: 20, padding: '48px 36px', maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 700, color: '#f5f0e8', marginBottom: 12 }}>
          Дякуємо!
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 20 }}>
          Твої відповіді допоможуть нам стати кращими. 50 бонусних балів вже зараховано на твій рахунок.
        </p>
        <p style={{ fontSize: 14, color: '#8899bb' }}>
          Перенаправлення на головну через {countdown}…
        </p>
      </div>
    </main>
  )
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let id = sessionStorage.getItem('bly_sid')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bly_sid', id) }
  return id
}

export default function SurveyPage() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [genreOther, setGenreOther] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleRadio(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  function handleCheckbox(id: string, value: string) {
    setAnswers(prev => {
      const current = (prev[id] as string[]) ?? []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [id]: updated }
    })
  }

  function handleText(id: string, value: string) {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Save to Supabase (fire-and-forget — don't block on failure)
    fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...answers,
        genres:     (answers.genres as string[]) ?? [],
        genre_other: genreOther || null,
        session_id:  getSessionId(),
      }),
    }).catch(() => { /* silent */ })
    setSubmitted(true)
  }

  if (submitted) return <ThankYouScreen />

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', padding: '48px 20px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        <div style={{ marginBottom: 36 }}>
          <a href="/" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
            Balabony<sup style={{ fontSize: 9 }}>®</sup>
          </a>
        </div>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: '#f5f0e8', marginBottom: 8 }}>
          Пройди опитування — отримай 50 бонусів
        </h1>
        <p style={{ fontSize: 16, color: '#8899bb', marginBottom: 36, lineHeight: 1.6 }}>
          Допоможи нам стати кращими — це займе 3 хвилини. Опитування анонімне.
        </p>

        <form onSubmit={handleSubmit}>
          {QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              style={{ background: '#0f1e3a', border: '1.5px solid rgba(245,166,35,0.3)', borderRadius: 14, padding: '24px 22px', marginBottom: 16 }}
            >
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f5f0e8', marginBottom: 16, fontFamily: FONT }}>
                {i + 1}. {q.label}
              </p>

              {q.type === 'radio' && q.options && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={answers[q.id] === opt}
                        onChange={() => handleRadio(q.id, opt)}
                        style={{ accentColor: GOLD, width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontFamily: FONT }}>{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'checkbox' && q.options && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: q.hasOther ? 16 : 0 }}>
                    {q.options.map(opt => {
                      const checked = ((answers[q.id] as string[]) ?? []).includes(opt)
                      return (
                        <label
                          key={opt}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                            padding: '6px 14px', borderRadius: 20,
                            border: `1.5px solid ${checked ? GOLD : 'rgba(255,255,255,0.2)'}`,
                            background: checked ? `${GOLD}22` : 'transparent',
                            transition: 'all 0.15s',
                          }}
                        >
                          <input
                            type="checkbox"
                            value={opt}
                            checked={checked}
                            onChange={() => handleCheckbox(q.id, opt)}
                            style={{ accentColor: GOLD, width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: 14, color: checked ? GOLD : 'rgba(255,255,255,0.8)', fontFamily: FONT, fontWeight: checked ? 700 : 400 }}>{opt}</span>
                        </label>
                      )
                    })}
                  </div>
                  {q.hasOther && (
                    <input
                      type="text"
                      value={genreOther}
                      onChange={e => setGenreOther(e.target.value)}
                      placeholder="Інше — впишіть свій жанр"
                      style={inputStyle}
                    />
                  )}
                </>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  value={(answers[q.id] as string) ?? ''}
                  onChange={e => handleText(q.id, e.target.value)}
                  placeholder="Місто або область..."
                  style={inputStyle}
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  rows={3}
                  value={(answers[q.id] as string) ?? ''}
                  onChange={e => handleText(q.id, e.target.value)}
                  placeholder="Ваша відповідь..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            style={{
              display: 'block', width: '100%', padding: '16px', marginTop: 8,
              background: GOLD, color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            Надіслати відповіді та отримати 50 бонусів
          </button>
        </form>
      </div>
    </main>
  )
}
