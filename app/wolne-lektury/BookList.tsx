'use client'

import { useMemo, useState } from 'react'

const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DEEP = '#B5710C'
const CREAM = '#FFF8EE'
const LIGHTBLUE = '#B5D4F4'
const SERIF = "'Lora', Georgia, serif"

export interface Book {
  title: string
  author: string
  kind?: string
  genre?: string
  epoch?: string
  slug?: string
  url: string
  hasAudio: boolean
  formats: string[]
}

export default function BookList({ books }: { books: Book[] }) {
  const [q, setQ] = useState('')
  const [author, setAuthor] = useState('')
  const [audioOnly, setAudioOnly] = useState(false)

  const authors = useMemo(
    () => Array.from(new Set(books.map((b) => b.author))).sort((a, b) => a.localeCompare(b, 'pl')),
    [books]
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return books.filter((b) => {
      if (audioOnly && !b.hasAudio) return false
      if (author && b.author !== author) return false
      if (!needle) return true
      return (
        b.title.toLowerCase().includes(needle) ||
        b.author.toLowerCase().includes(needle) ||
        (b.genre || '').toLowerCase().includes(needle) ||
        (b.epoch || '').toLowerCase().includes(needle)
      )
    })
  }, [books, q, author, audioOnly])

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,248,238,0.06)',
    border: '1px solid rgba(181,212,244,0.35)',
    borderRadius: 10,
    color: CREAM,
    fontSize: 15,
    padding: '10px 14px',
    fontFamily: 'inherit',
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <label htmlFor="wl-search" style={{ position: 'absolute', left: -9999 }}>
          Пошук за назвою, автором, жанром
        </label>
        <input
          id="wl-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук за назвою, автором, жанром…"
          style={{ ...inputStyle, flex: '1 1 260px', minWidth: 0 }}
        />

        <label htmlFor="wl-author" style={{ position: 'absolute', left: -9999 }}>
          Автор
        </label>
        <select
          id="wl-author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={{ ...inputStyle, flex: '0 1 220px' }}
        >
          <option value="">Усі автори</option>
          {authors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setAudioOnly((v) => !v)}
          aria-pressed={audioOnly}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            fontWeight: 700,
            color: audioOnly ? '#0E1A2B' : LIGHTBLUE,
            background: audioOnly ? GOLD : 'rgba(255,248,238,0.06)',
            borderColor: audioOnly ? GOLD : 'rgba(181,212,244,0.35)',
          }}
        >
          Лише з аудіо
        </button>
      </div>

      <p
        aria-live="polite"
        style={{
          color: 'rgba(255,248,238,0.55)',
          fontSize: 13,
          lineHeight: 1.7,
          marginBottom: 20,
        }}
      >
        Показано: <strong style={{ color: CREAM }}>{shown.length}</strong> із {books.length}
      </p>

      {shown.length === 0 ? (
        <div style={{ background: CARD, borderRadius: 16, padding: 28, color: 'rgba(255,248,238,0.7)' }}>
          За цим запитом нічого не знайдено.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '0 0 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {shown.map((b) => (
            <li
              key={b.slug || `${b.author}-${b.title}`}
              style={{
                background: CARD,
                border: '1px solid rgba(239,159,39,0.18)',
                borderRadius: 14,
                padding: '18px 22px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 4,
                }}
              >
                <h3 style={{ fontFamily: SERIF, color: GOLD, fontSize: 20, margin: 0 }}>{b.title}</h3>
                {b.hasAudio && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'rgba(181,212,244,0.15)',
                      color: LIGHTBLUE,
                      fontWeight: 600,
                    }}
                  >
                    Є аудіо
                  </span>
                )}
              </div>

              <p style={{ fontSize: 14, color: LIGHTBLUE, margin: '0 0 6px' }}>{b.author}</p>

              {(b.genre || b.kind || b.epoch) && (
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'rgba(255,248,238,0.55)',
                    margin: '0 0 10px',
                  }}
                >
                  {[b.kind, b.genre, b.epoch].filter(Boolean).join(' · ')}
                </p>
              )}

              {b.formats.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {b.formats.map((f) => (
                    <span
                      key={f}
                      style={{
                        fontSize: 11,
                        letterSpacing: 0.5,
                        padding: '2px 8px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,248,238,0.22)',
                        color: 'rgba(255,248,238,0.7)',
                        fontWeight: 600,
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}

              <a
                href={b.url}
                target="_blank"
                rel="noopener"
                style={{ fontSize: 14, color: GOLD_DEEP, textDecoration: 'none' }}
              >
                Читати або слухати у Wolne Lektury ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
