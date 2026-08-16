'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"

const BATCH = 5

type Scan = {
  pending: number
  pendingBytes: number
  byFormat: Record<string, number>
  heaviest: { name: string; size: number }[]
  done: { n: number; skipped: number; was: string; now: string }
  error?: string
}

type Result = {
  name: string
  status: 'ok' | 'skipped' | 'failed'
  oldSize?: number
  newSize?: number
  rows?: number
  reason?: string
  oldUrl?: string
  newUrl?: string
}

type Batch = {
  processed: number
  ok: number
  skipped: number
  failed: number
  savedBytes: number
  dryRun: boolean
  results: Result[]
  error?: string
}

function mb(bytes: number): string {
  if (!bytes) return '0'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export default function CompressCoversPage() {
  const [scan, setScan] = useState<Scan | null>(null)
  const [busy, setBusy] = useState(false)
  // Прапорець зупинки тримаємо в ref: значення зі стану замерзає всередині
  // циклу, і кнопка «Зупинити» просто не спрацьовувала б.
  const stopRef = useRef(false)
  const [log, setLog] = useState<Result[]>([])
  const [saved, setSaved] = useState(0)
  const [err, setErr] = useState('')

  const refresh = useCallback(async () => {
    setErr('')
    try {
      // no-store обов'язково: інакше браузер віддає відповідь, збережену при
      // першому відкритті сторінки, і лічильник показує стан до обробки —
      // виглядає так, ніби стиснення нічого не зробило.
      const res = await fetch('/api/admin/compress-covers', { cache: 'no-store' })
      const d = (await res.json()) as Scan
      if (d.error) { setErr(d.error); return }
      setScan(d)
    } catch {
      setErr('Не вдалось прочитати стан')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  const runOne = async (dryRun: boolean): Promise<Batch | null> => {
    const res = await fetch('/api/admin/compress-covers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: BATCH, dryRun }),
    })
    const d = (await res.json()) as Batch
    if (d.error) { setErr(d.error); return null }
    setLog(p => [...d.results, ...p].slice(0, 200))
    if (!dryRun) setSaved(p => p + d.savedBytes)
    return d
  }

  const testRun = async () => {
    setBusy(true); setErr(''); setLog([])
    await runOne(true)
    setBusy(false)
  }

  const realFive = async () => {
    setBusy(true); setErr(''); setLog([]); setSaved(0)
    await runOne(false)
    setBusy(false)
    await refresh()
  }

  const runAll = async () => {
    setBusy(true); stopRef.current = false; setErr(''); setLog([]); setSaved(0)
    for (;;) {
      const d = await runOne(false)
      if (!d || d.processed === 0) break
      // Партія без жодного стиснутого файла означає, що лишилось тільки те,
      // що не стискається. Продовжувати — крутити цикл даремно.
      if (d.ok === 0) break
      if (stopRef.current) break
      await refresh()
    }
    setBusy(false)
    await refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: CREAM, fontFamily: FONT, padding: '32px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 28, margin: '0 0 8px' }}>Стиснення обкладинок</h1>
        <p style={{ color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
          Обкладинки переводяться у WebP, щоб збити витрату трафіку Supabase.
          Оригінали залишаються у сховищі недоторканими — стиснена копія лягає
          окремим файлом у теку <code>webp/</code>. Посилання твору перемикається
          лише після того, як новий файл залито й перевірено.
        </p>

        {err && (
          <div style={{ background: '#3a1a1a', border: '1px solid #a33', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            {err}
          </div>
        )}

        <div style={{ background: NAVY, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          {!scan ? (
            <div style={{ color: MUTED }}>Рахую…</div>
          ) : (
            <>
              <div style={{ fontSize: 18, marginBottom: 10 }}>
                Лишилось стиснути: <b style={{ color: GOLD }}>{scan.pending}</b>
                {' '}({mb(scan.pendingBytes)})
              </div>
              <div style={{ color: MUTED, fontSize: 14, marginBottom: 10 }}>
                {Object.entries(scan.byFormat).map(([k, v]) => `${k}: ${v}`).join(' · ') || '—'}
              </div>
              {scan.done?.n > 0 && (
                <div style={{ color: MUTED, fontSize: 14 }}>
                  Стиснуто: {scan.done.n} · було {mb(Number(scan.done.was))} → стало {mb(Number(scan.done.now))}
                  {scan.done.skipped > 0 && ` · пропущено як безнадійні: ${scan.done.skipped}`}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={testRun}
            disabled={busy}
            style={{
              background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`,
              borderRadius: 10, padding: '12px 22px', fontSize: 15, fontFamily: FONT,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            Пробний прогін ({BATCH} шт.)
          </button>
          <button
            onClick={realFive}
            disabled={busy}
            style={{
              background: 'transparent', color: CREAM, border: `1px solid ${CREAM}`,
              borderRadius: 10, padding: '12px 22px', fontSize: 15, fontFamily: FONT,
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            Залити {BATCH} по-справжньому
          </button>
          <button
            onClick={runAll}
            disabled={busy}
            style={{
              background: GOLD, color: NAVY_DEEP, border: 'none',
              borderRadius: 10, padding: '12px 26px', fontSize: 15, fontWeight: 600,
              fontFamily: FONT, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? 'Працюю…' : 'Стиснути всі'}
          </button>
          {busy && (
            <button
              onClick={() => { stopRef.current = true }}
              style={{
                background: 'transparent', color: MUTED, border: `1px solid ${MUTED}`,
                borderRadius: 10, padding: '12px 22px', fontSize: 15, fontFamily: FONT, cursor: 'pointer',
              }}
            >
              Зупинити
            </button>
          )}
        </div>

        {saved > 0 && (
          <div style={{ color: GOLD, fontSize: 17, marginBottom: 20 }}>
            Заощаджено за цей сеанс: {mb(saved)}
          </div>
        )}

        {log.length > 0 && (
          <div style={{ background: NAVY, borderRadius: 14, padding: 16 }}>
            {log.map((r, i) => (
              <div
                key={`${r.name}-${i}`}
                style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12,
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)',
                  fontSize: 14,
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.status === 'ok' ? '✓' : r.status === 'skipped' ? '–' : '✗'} {r.name}
                </span>
                <span style={{ color: r.status === 'failed' ? '#e88' : MUTED, whiteSpace: 'nowrap' }}>
                  {r.oldSize && r.newSize
                    ? `${mb(r.oldSize)} → ${mb(r.newSize)}`
                    : ''}
                  {r.reason ? ` · ${r.reason}` : ''}
                  {r.rows !== undefined ? ` · записів: ${r.rows}` : ''}
                  {r.oldUrl && r.newUrl ? (
                    <>
                      {' · '}
                      <a href={r.oldUrl} target="_blank" rel="noreferrer" style={{ color: GOLD }}>було</a>
                      {' / '}
                      <a href={r.newUrl} target="_blank" rel="noreferrer" style={{ color: GOLD }}>стало</a>
                    </>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
