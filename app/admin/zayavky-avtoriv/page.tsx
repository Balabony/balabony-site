'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Заявки авторів — пробні історії, подані формою на /become-author.
 *
 * Замінює ручне заведення: прочитали → «Прийняти» (кабінет, згода, чернетка,
 * лист автору) або «Відхилити» (ввічливий лист, з коментарем за бажанням).
 * /admin/authors лишається для тих, хто прийшов поза формою.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD = '#ef9f27'
const CREAM = '#FFF8EE'
const MUTED = '#b9c6db'
const LINE = 'rgba(143,163,196,0.25)'
const GREEN = '#7fd08a'
const RED = '#ff9b8a'

type App = {
  id: string; email: string; full_name: string; pen_name: string | null; phone: string
  title: string; genre: string | null; words: number; filename: string | null
  status: 'new' | 'accepted' | 'rejected'; admin_note: string | null; content_id: string | null
  decided_at: string | null; created_at: string
}

const fmt = (d: string) => new Date(d).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const STATUS: Record<App['status'], [string, string]> = {
  new: ['Нова', GOLD], accepted: ['Прийнято', GREEN], rejected: ['Відхилено', RED],
}

export default function Page() {
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [filter, setFilter] = useState<'new' | 'all'>('new')
  const [open, setOpen] = useState<string | null>(null)
  const [bodies, setBodies] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setErr('')
    try {
      const r = await fetch('/api/admin/author-applications', { cache: 'no-store' })
      if (r.status === 401) { window.location.href = '/admin/login'; return }
      const d = await r.json() as { ok?: boolean; applications?: App[]; error?: string }
      if (!d.ok) { setErr(d.error ?? 'Помилка'); return }
      setApps(d.applications ?? [])
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { void load() }, [load])

  const toggle = async (id: string) => {
    if (open === id) { setOpen(null); return }
    setOpen(id)
    if (bodies[id] !== undefined) return
    try {
      const r = await fetch(`/api/admin/author-applications?id=${id}`, { cache: 'no-store' })
      const d = await r.json() as { ok?: boolean; body?: string }
      setBodies(b => ({ ...b, [id]: d.ok ? (d.body ?? '') : 'Не вдалося завантажити текст' }))
    } catch {
      setBodies(b => ({ ...b, [id]: 'Не вдалося завантажити текст' }))
    }
  }

  const act = async (a: App, action: 'accept' | 'reject') => {
    const q = action === 'accept'
      ? `Прийняти ${a.full_name}? Відкриється кабінет автора, історія стане чернеткою, автору піде лист.`
      : `Відхилити заявку ${a.full_name}? Автору піде ввічливий лист${notes[a.id]?.trim() ? ' з вашим коментарем' : ''}.`
    if (!window.confirm(q)) return
    setBusy(a.id)
    try {
      const r = await fetch('/api/admin/author-applications', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: a.id, action, note: notes[a.id] ?? '' }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; mailed?: boolean }
      setMsg(m => ({
        ...m,
        [a.id]: d.ok
          ? (action === 'accept' ? 'Прийнято: кабінет відкрито, чернетку створено.' : 'Відхилено.') +
            (d.mailed ? ' Лист надіслано.' : ' Лист НЕ надіслано — напишіть автору вручну.')
          : (d.error ?? 'Помилка'),
      }))
      if (d.ok) await load()
    } catch {
      setMsg(m => ({ ...m, [a.id]: 'Немає звʼязку з сервером' }))
    } finally {
      setBusy(null)
    }
  }

  const shown = filter === 'new' ? apps.filter(a => a.status === 'new') : apps
  const fresh = apps.filter(a => a.status === 'new').length

  const btn = (bg: string, fg: string): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
    background: bg, color: fg, fontWeight: 700, fontSize: 14, fontFamily: FONT,
  })

  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 90px' }}>
        <h1 style={{ color: GOLD, fontSize: 26, margin: '0 0 8px' }}>Заявки авторів</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>
          Пробні історії з форми на /become-author. «Прийняти» відкриває кабінет на акаунті, з якого подано
          заявку, записує згоду, додає історію чернеткою й надсилає автору лист. «Відхилити» надсилає ввічливий
          лист — з коментарем, якщо ви його напишете.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button type="button" onClick={() => setFilter('new')} style={btn(filter === 'new' ? GOLD : CARD, filter === 'new' ? NAVY : CREAM)}>
            Нові ({fresh})
          </button>
          <button type="button" onClick={() => setFilter('all')} style={btn(filter === 'all' ? GOLD : CARD, filter === 'all' ? NAVY : CREAM)}>
            Усі ({apps.length})
          </button>
        </div>

        {loading && <p style={{ color: MUTED }}>Завантажуємо…</p>}
        {err && <p style={{ color: RED }}>{err}</p>}
        {!loading && shown.length === 0 && <p style={{ color: MUTED }}>Нових заявок немає.</p>}

        {shown.map(a => {
          const [sLabel, sColor] = STATUS[a.status]
          return (
            <div key={a.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 19, color: CREAM }}>«{a.title}»</div>
                  <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
                    {a.genre ? `${a.genre} · ` : ''}{a.words} слів{a.filename ? ` · ${a.filename}` : ' · вставлений текст'} · #{a.id} · {fmt(a.created_at)}
                  </div>
                </div>
                <span style={{ color: sColor, fontWeight: 700, fontSize: 13 }}>{sLabel}</span>
              </div>

              <div style={{ fontSize: 14, marginTop: 10, lineHeight: 1.7 }}>
                <strong>{a.full_name}</strong>{a.pen_name ? ` (псевдонім: ${a.pen_name})` : ''}<br />
                <a href={`mailto:${a.email}`} style={{ color: GOLD }}>{a.email}</a> · <a href={`tel:${a.phone.replace(/[^\d+]/g, '')}`} style={{ color: GOLD }}>{a.phone}</a>
              </div>

              {a.admin_note && <p style={{ fontSize: 13, color: MUTED, fontStyle: 'italic', margin: '8px 0 0' }}>Коментар: {a.admin_note}</p>}
              {a.decided_at && <p style={{ fontSize: 12, color: MUTED, margin: '6px 0 0' }}>Рішення: {fmt(a.decided_at)}</p>}

              <button type="button" onClick={() => toggle(a.id)} style={{ ...btn('transparent', GOLD), padding: '8px 0', marginTop: 8 }}>
                {open === a.id ? 'Згорнути текст ▲' : 'Читати історію ▼'}
              </button>

              {open === a.id && (
                <div style={{
                  whiteSpace: 'pre-wrap', fontFamily: SERIF, fontSize: 16, lineHeight: 1.75, color: CREAM,
                  background: NAVY, border: `1px solid ${LINE}`, borderRadius: 10, padding: 16, marginTop: 8,
                  maxHeight: 520, overflowY: 'auto',
                }}>
                  {bodies[a.id] ?? 'Завантажуємо…'}
                </div>
              )}

              {a.status === 'new' && (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    placeholder="Коментар для автора (необовʼязково; піде в лист при відхиленні)"
                    value={notes[a.id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [a.id]: e.target.value }))}
                    style={{
                      width: '100%', boxSizing: 'border-box', minHeight: 60, padding: 10, borderRadius: 9,
                      border: `1px solid ${LINE}`, background: NAVY, color: CREAM, fontFamily: FONT, fontSize: 14, marginBottom: 10,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" disabled={busy === a.id} onClick={() => act(a, 'accept')} style={{ ...btn(GREEN, NAVY), opacity: busy === a.id ? 0.6 : 1 }}>
                      Прийняти
                    </button>
                    <button type="button" disabled={busy === a.id} onClick={() => act(a, 'reject')} style={{ ...btn('transparent', RED), border: `1px solid ${RED}`, opacity: busy === a.id ? 0.6 : 1 }}>
                      Відхилити
                    </button>
                  </div>
                </div>
              )}
              {msg[a.id] && <p style={{ fontSize: 14, color: MUTED, margin: '10px 0 0' }}>{msg[a.id]}</p>}
            </div>
          )
        })}
      </div>
    </main>
  )
}
