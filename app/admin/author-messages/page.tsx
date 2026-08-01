'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Журнал звернень авторів.
 *
 * Відповідати звідси не треба — кожне звернення приходить на пошту редакції
 * з Reply-To автора. Ця сторінка потрібна, щоб нічого не загубилося у скриньці
 * і щоб було видно, про що люди пишуть найчастіше.
 */

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'
const BAD = '#E88686'

const TOPIC_LABEL: Record<string, string> = {
  works: 'Твори',
  tech: 'Не працює',
  contract: 'Договір',
  voice: 'Голос',
  idea: 'Пропозиція',
  payout: 'Виплати',
  other: 'Інше',
}

type Row = {
  id: string
  author_id: string
  author_name: string
  email: string
  topic: string
  body: string
  created_at: string
}

function when(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('uk-UA', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminAuthorMessagesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [topic, setTopic] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/admin/author-messages')
        const raw = await res.text()
        type Payload = { ok?: boolean; rows?: Row[]; error?: string }
        let d: Payload | null = null
        try { d = JSON.parse(raw) as Payload } catch { d = null }
        if (!alive) return
        if (!d) { setErr(`Сервер відповів помилкою (код ${res.status})`); return }
        if (!d.ok) { setErr(d.error ?? 'Не вдалося завантажити'); return }
        setRows(d.rows ?? [])
      } catch {
        if (alive) setErr('Не вдалося звʼязатися з сервером')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const topics = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.topic, (m.get(r.topic) ?? 0) + 1)
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
  }, [rows])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return rows.filter(r => {
      if (topic && r.topic !== topic) return false
      if (!needle) return true
      return `${r.author_name} ${r.email} ${r.body}`.toLowerCase().includes(needle)
    })
  }, [rows, topic, q])

  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, paddingBottom: 90 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Звернення авторів</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 14, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, marginTop: 14, maxWidth: 700 }}>
          Листи, які автори надіслали з кабінету. Кожен приходить і на пошту редакції —
          відповідати найзручніше просто звідти, кнопкою «Відповісти».
        </p>

        {!loading && !err && topics.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setTopic('')}
              style={{
                padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${topic === '' ? GOLD : LINE}`,
                background: 'transparent', color: topic === '' ? GOLD : MUTED,
                fontSize: 13, fontFamily: FONT, fontWeight: 600,
              }}
            >
              Усі ({rows.length})
            </button>
            {topics.map(([t, n]) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t === topic ? '' : t)}
                style={{
                  padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                  border: `1px solid ${topic === t ? GOLD : LINE}`,
                  background: 'transparent', color: topic === t ? GOLD : MUTED,
                  fontSize: 13, fontFamily: FONT, fontWeight: 600,
                }}
              >
                {TOPIC_LABEL[t] ?? t} ({n})
              </button>
            ))}
          </div>
        )}

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Пошук за іменем, поштою або текстом"
          style={{
            width: '100%', padding: '10px 13px', borderRadius: 10, marginTop: 16,
            border: `1px solid ${LINE}`, background: NAVY, color: CREAM,
            fontSize: 14, fontFamily: FONT, outline: 'none',
          }}
        />

        {loading && <p style={{ color: MUTED, marginTop: 26 }}>Завантаження…</p>}
        {err && <p style={{ color: BAD, marginTop: 26 }}>{err}</p>}

        {!loading && !err && shown.length === 0 && (
          <p style={{ color: MUTED, marginTop: 26 }}>
            {rows.length === 0 ? 'Звернень поки немає.' : 'Нічого не знайдено.'}
          </p>
        )}

        {shown.map(r => (
          <div key={r.id} style={{
            marginTop: 14, padding: '16px 18px', borderRadius: 12,
            background: NAVY, border: `1px solid ${LINE}`,
          }}>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontWeight: 700, color: CREAM, fontSize: 15 }}>
                  {r.author_name || '(без імені)'}
                </span>
                <a
                  href={`mailto:${r.email}?subject=${encodeURIComponent('Ваше звернення · Балабони')}`}
                  style={{ color: MUTED, fontSize: 13, marginLeft: 10, textDecoration: 'none' }}
                >
                  {r.email}
                </a>
              </div>
              <span style={{ color: MUTED, fontSize: 12.5 }}>{when(r.created_at)}</span>
            </div>

            <div style={{
              display: 'inline-block', marginTop: 8, padding: '3px 10px', borderRadius: 999,
              background: 'rgba(239,159,39,0.12)', color: GOLD, fontSize: 12, fontWeight: 700,
            }}>
              {TOPIC_LABEL[r.topic] ?? r.topic}
            </div>

            <div style={{
              marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}`,
              color: CREAM, fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {r.body}
            </div>

            <a
              href={`mailto:${r.email}?subject=${encodeURIComponent('Ваше звернення · Балабони')}`}
              style={{
                display: 'inline-block', marginTop: 14, padding: '7px 13px', borderRadius: 9,
                border: `1px solid ${LINE}`, color: MUTED, fontSize: 13, textDecoration: 'none',
              }}
            >
              Відповісти поштою
            </a>
          </div>
        ))}

      </div>
    </main>
  )
}
