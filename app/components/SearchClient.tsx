'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type Work = {
  id: string
  title: string
  author: string
  genre: string
  label: string
  url: string
}

type Author = {
  name: string
  slug: string
  avatar: string | null
}

const FONT  = "'Montserrat', sans-serif"
const SERIF = "'Lora', Georgia, serif"

export default function SearchClient() {
  const params = useSearchParams()
  const router = useRouter()
  const initial = params.get('q') ?? ''

  const [value, setValue]     = useState(initial)
  const [works, setWorks]     = useState<Work[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(false)
  const [asked, setAsked]     = useState(initial.trim().length >= 2)

  // Відповідь на застарілий запит не має затирати свіжу: рахуємо покоління.
  const gen = useRef(0)

  useEffect(() => {
    const q = value.trim()

    if (q.length < 2) {
      setWorks([])
      setAuthors([])
      setAsked(false)
      setLoading(false)
      return
    }

    const mine = ++gen.current
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (mine !== gen.current) return
        setWorks(Array.isArray(data.works) ? data.works : [])
        setAuthors(Array.isArray(data.authors) ? data.authors : [])
        setAsked(true)
      } catch {
        if (mine !== gen.current) return
        setWorks([])
        setAuthors([])
        setAsked(true)
      } finally {
        if (mine === gen.current) setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [value])

  // Адресу оновлюємо без перезавантаження — щоб посилання на результат
  // можна було переслати або зберегти.
  useEffect(() => {
    const q = value.trim()
    const url = q.length >= 2 ? `/search?q=${encodeURIComponent(q)}` : '/search'
    router.replace(url, { scroll: false })
  }, [value, router])

  const nothing = asked && !loading && works.length === 0 && authors.length === 0

  return (
    <div>
      <label htmlFor="site-search" style={{
        display: 'block',
        fontFamily: FONT,
        fontSize: 14,
        color: 'var(--muted)',
        marginBottom: 8,
      }}>
        Введіть назву твору, ім'я або псевдонім автора
      </label>

      <input
        id="site-search"
        type="search"
        value={value}
        autoFocus
        autoComplete="off"
        onChange={(e) => setValue(e.target.value)}
        placeholder="Наприклад: Хутір Мазури або Данільчик"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '14px 16px',
          fontSize: 17,
          fontFamily: FONT,
          color: 'var(--text)',
          background: 'var(--white)',
          border: '2px solid var(--border)',
          borderRadius: 12,
          outline: 'none',
        }}
      />

      <div aria-live="polite" style={{ minHeight: 24, marginTop: 12 }}>
        {loading && (
          <span style={{ fontFamily: FONT, fontSize: 14, color: 'var(--muted)' }}>
            Шукаємо…
          </span>
        )}
        {nothing && (
          <span style={{ fontFamily: FONT, fontSize: 15, color: 'var(--muted)' }}>
            Нічого не знайшли. Спробуйте коротше слово — пошук шукає точний
            збіг літер, без відмінків.
          </span>
        )}
      </div>

      {authors.length > 0 && (
        <section style={{ marginTop: 28 }}>
          <h2 style={{
            fontFamily: SERIF, fontSize: 20, color: 'var(--accent-gold)',
            margin: '0 0 14px',
          }}>
            Автори
          </h2>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {authors.map((a) => (
              <a
                key={a.slug}
                href={`/avtor/${a.slug}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px 8px 8px',
                  border: '1px solid var(--border)',
                  borderRadius: 100,
                  textDecoration: 'none',
                  color: 'var(--text)',
                  fontFamily: FONT,
                  fontSize: 15,
                  background: 'var(--white)',
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: '50%',
                  overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(240,165,0,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: 'var(--accent-gold)',
                }}>
                  {a.avatar
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={a.avatar} alt="" width={32} height={32}
                           style={{ width: 32, height: 32, objectFit: 'cover' }} />
                    : a.name.slice(0, 1)}
                </span>
                {a.name}
              </a>
            ))}
          </div>
        </section>
      )}

      {works.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2 style={{
            fontFamily: SERIF, fontSize: 20, color: 'var(--accent-gold)',
            margin: '0 0 14px',
          }}>
            Твори
          </h2>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {works.map((w) => (
              <li key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <a
                  href={w.url}
                  style={{
                    display: 'block',
                    padding: '14px 4px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                  }}
                >
                  <span style={{
                    fontFamily: SERIF, fontSize: 19, fontWeight: 600,
                    display: 'block', marginBottom: 4,
                  }}>
                    {w.title}
                  </span>
                  <span style={{
                    fontFamily: FONT, fontSize: 13, color: 'var(--muted)',
                  }}>
                    {[w.author, w.genre, w.label].filter(Boolean).join(' · ')}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
