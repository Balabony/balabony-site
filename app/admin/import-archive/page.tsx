'use client'

import { useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"

const CHUNK = 20

type Item = { title?: string; author?: string }

export default function ImportArchivePage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(0)
  const [added, setAdded] = useState(0)
  const [skipped, setSkipped] = useState(0)
  const [log, setLog] = useState<string[]>([])
  const [err, setErr] = useState('')

  const pick = async (f: File | null) => {
    setErr(''); setItems(null); setLog([]); setDone(0); setAdded(0); setSkipped(0)
    if (!f) return
    try {
      const parsed = JSON.parse(await f.text()) as Item[]
      if (!Array.isArray(parsed)) { setErr('У файлі має бути масив історій'); return }
      setItems(parsed)
    } catch {
      setErr('Не вдалося прочитати JSON')
    }
  }

  const run = async () => {
    if (!items) return
    setBusy(true); setLog([]); setDone(0); setAdded(0); setSkipped(0)
    try {
      for (let i = 0; i < items.length; i += CHUNK) {
        const part = items.slice(i, i + CHUNK)
        const res = await fetch('/api/admin/import-archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: part }),
        })
        const d = (await res.json()) as { ok: boolean; error?: string; added?: number; skipped?: number; problems?: string[] }
        if (!d.ok) { setErr(d.error ?? 'Помилка партії'); break }
        setAdded(p => p + (d.added ?? 0))
        setSkipped(p => p + (d.skipped ?? 0))
        setDone(Math.min(i + CHUNK, items.length))
        if (d.problems?.length) setLog(p => [...p, ...(d.problems ?? [])].slice(0, 40))
      }
    } catch {
      setErr('Обірвався звʼязок — можна запустити ще раз, дублів не буде')
    } finally {
      setBusy(false)
    }
  }

  const total = items?.length ?? 0
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <main style={{ background: NAVY_DEEP, padding: '36px 20px 72px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px' }}>Імпорт архіву</h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
          Історії лягають чернетками з іменем автора. Повторний запуск дублів не створює.
        </p>

        <div style={{ background: NAVY, border: '1px solid rgba(143,163,196,0.22)', borderRadius: 12, padding: 20 }}>
          <input
            type="file"
            accept=".json,application/json"
            onChange={e => { void pick(e.target.files?.[0] ?? null) }}
            style={{
              display: 'block', width: '100%', boxSizing: 'border-box', fontSize: 14, color: CREAM,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(143,163,196,0.3)',
              borderRadius: 9, padding: '10px 12px', fontFamily: FONT,
            }}
          />

          {items && (
            <p style={{ fontSize: 15, color: CREAM, margin: '14px 0 0' }}>
              У файлі <strong style={{ color: GOLD }}>{total}</strong> історій
            </p>
          )}

          {err && <p style={{ color: '#F09595', fontSize: 14.5, margin: '12px 0 0' }}>{err}</p>}

          {items && (
            <button
              type="button"
              disabled={busy}
              onClick={() => { void run() }}
              style={{
                marginTop: 16, fontSize: 15, fontWeight: 700, color: NAVY_DEEP, background: GOLD,
                border: 'none', borderRadius: 10, padding: '12px 24px',
                cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, fontFamily: FONT,
              }}
            >
              {busy ? 'Заливаємо…' : 'Почати імпорт'}
            </button>
          )}

          {(busy || done > 0) && (
            <div style={{ marginTop: 18 }}>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(143,163,196,0.2)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: GOLD }} />
              </div>
              <p style={{ fontSize: 14.5, color: MUTED, margin: '10px 0 0' }}>
                Оброблено {done} з {total} · додано <strong style={{ color: '#C0DD97' }}>{added}</strong> ·
                пропущено <strong style={{ color: MUTED }}>{skipped}</strong>
              </p>
            </div>
          )}

          {log.length > 0 && (
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 9, background: NAVY_DEEP }}>
              <div style={{ fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
                Не залито
              </div>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{l}</div>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, marginTop: 18 }}>
          Після імпорту історії видно в адмінці як чернетки. Автор побачить свої в кабінеті лише
          після того, як його акаунт буде прив’язано до імені.
        </p>
      </div>
    </main>
  )
}
