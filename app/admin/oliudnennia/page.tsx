'use client'

import { useState } from 'react'
import AiStyleReport, { type StyleCheck, indexOf, indexBand } from '@/app/components/AiStyleReport'

/**
 * Олюднення — редактура ВЛАСНИХ текстів редакції (статті, листи, анонси) за
 * тими самими 10 ознаками, що шукає «Перевірка стилю (ШІ)». Після правки текст
 * можна одразу прогнати визначальником і порівняти індекс «до» і «після».
 * Твори авторів і конкурсні роботи сюди не вставляємо — див. lib/ai-humanize.ts.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628', CARD = '#0f1f38', GOLD = '#ef9f27', CREAM = '#FFF8EE', MUTED = '#b9c6db', LINE = 'rgba(143,163,196,0.25)'
const KINDS = ['стаття', 'лист', 'анонс або допис', 'опис послуги', 'інше']
type Change = { before: string; after: string; why: string }

export default function Page() {
  const [kind, setKind] = useState(KINDS[0])
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [notes, setNotes] = useState('')
  const [out, setOut] = useState('')
  const [changes, setChanges] = useState<Change[]>([])
  const [placeholders, setPlaceholders] = useState(0)
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [before, setBefore] = useState<StyleCheck | null>(null)
  const [after, setAfter] = useState<StyleCheck | null>(null)
  const [copied, setCopied] = useState(false)
  const [mode, setMode] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])

  // Спершу перевірка оригіналу (якщо її ще немає): від індексу залежить режим —
  // легкий для низького індексу, точковий для конкретних маркерів. Без цього
  // модель переписувала вже чистий текст і додавала нових ознак (тест 22.09.2026).
  const humanize = async () => {
    setOut(''); setChanges([]); setAfter(null); setWarnings([]); setMode('')
    const base = before ?? await check('before')
    if (!base) return
    setErr(''); setBusy('h')
    try {
      const r = await fetch('/api/admin/humanize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text, title, kind, notes,
          index: indexOf(base.result ?? { markers: [] }),
          markers: (base.result?.markers ?? []).map((m) => ({ n: m.n, name: m.name, score: m.score, evidence: m.evidence })),
        }),
      })
      if (r.status === 401) { window.location.href = '/admin/login'; return }
      const d = await r.json() as { ok?: boolean; error?: string; text?: string; changes?: Change[]; placeholders?: number; mode?: string; warnings?: string[] }
      if (!d.ok || !d.text) { setErr(d.error ?? 'Помилка'); return }
      setOut(d.text); setChanges(d.changes ?? []); setPlaceholders(d.placeholders ?? 0)
      setMode(d.mode ?? ''); setWarnings(d.warnings ?? [])
    } catch { setErr('Немає звʼязку з сервером') } finally { setBusy('') }
  }

  const check = async (which: 'before' | 'after'): Promise<StyleCheck | null> => {
    setErr(''); setBusy(which)
    try {
      const r = await fetch('/api/admin/ai-style-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'manual', id: 'oliudnennia', text: which === 'before' ? text : out, title: `${title || 'Текст редакції'} · ${which === 'before' ? 'до' : 'після'}` }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; check?: StyleCheck }
      if (!d.ok || !d.check) { setErr(d.error ?? 'Помилка перевірки'); return null }
      if (which === 'before') setBefore(d.check); else setAfter(d.check)
      return d.check
    } catch { setErr('Немає звʼязку з сервером'); return null } finally { setBusy('') }
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* поле можна скопіювати вручну */ }
  }

  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 9, border: `1px solid ${LINE}`, background: NAVY, color: CREAM, fontFamily: FONT, fontSize: 14, marginBottom: 10 }
  const btn = (bg: string, fg: string): React.CSSProperties => ({ padding: '10px 18px', borderRadius: 9, border: bg === 'transparent' ? `1px solid ${GOLD}` : 'none', cursor: 'pointer', background: bg, color: fg, fontWeight: 700, fontFamily: FONT })
  const Idx = ({ c, label }: { c: StyleCheck | null; label: string }) => {
    if (!c) return null
    const i = indexOf(c.result ?? { markers: [] })
    const [band, color] = indexBand(i)
    return <p style={{ margin: '4px 0', fontSize: 15 }}>{label}: <strong style={{ color }}>{i}/100</strong> <span style={{ color: MUTED }}>({band})</span></p>
  }

  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 90px' }}>
        <h1 style={{ color: GOLD, fontSize: 26, margin: '0 0 8px' }}>Олюднення тексту</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 0 8px' }}>
          Редактура власних текстів редакції за тими самими 10 ознаками, що шукає «Перевірка стилю (ШІ)»: названі емоції,
          кліше, афоризми-мораль, формульні кінцівки, однаковий ритм, змішана типографіка. Факти й цифри не змінюються.
          Де потрібен живий приклад — зʼявиться позначка [ДОДАЙТЕ ВЛАСНИЙ ПРИКЛАД], його дописуєте ви.
        </p>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 0 8px' }}>
          Перед правкою текст автоматично проходить перевірку. Індекс нижче 31 — <strong>легкий</strong> режим: лише точкові правки,
          бо чистий текст «пожвавлення» тільки псує. Інакше — <strong>точковий</strong>: переписуються саме ті фрагменти, які знайшла перевірка.
        </p>
        <p style={{ color: '#ffcf8a', fontSize: 13, lineHeight: 1.6, margin: '0 0 18px' }}>
          Лише для текстів редакції. Твори авторів і конкурсні роботи сюди не вставляйте: для них діє заборона
          «ШІ переписує стиль» (п. 8.11 договору, правила конкурсів). Жоден інструмент не гарантує, що текст пройде сторонні детектори.
          Перевірки з цієї сторінки не потрапляють в історію ШІ-перевірки й видаляються через 10 хвилин.
        </p>

        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} style={field}>
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <input placeholder="Назва (необовʼязково)" value={title} onChange={(e) => setTitle(e.target.value)} style={field} />
          <textarea placeholder="Вставте текст (від 80 слів, до 30 000 знаків)" value={text} onChange={(e) => { setText(e.target.value); setBefore(null) }} style={{ ...field, minHeight: 220 }} />
          <textarea placeholder="Ваші деталі й факти (необовʼязково): випадки з досвіду, цифри, імена, що саме бачили — їх буде вписано в текст без змін змісту" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...field, minHeight: 100 }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" disabled={!!busy} onClick={humanize} style={{ ...btn(GOLD, NAVY), opacity: busy ? 0.6 : 1 }}>
              {busy === 'before' && !before ? 'Спершу перевіряємо оригінал…' : busy === 'h' ? 'Редагуємо… (до 3 хвилин)' : 'Олюднити'}
            </button>
            <button type="button" disabled={!!busy || !text} onClick={() => check('before')} style={btn('transparent', GOLD)}>
              {busy === 'before' ? 'Перевіряємо…' : 'Індекс оригіналу'}
            </button>
          </div>
          {err && <p style={{ color: '#ff9b8a', margin: '10px 0 0' }}>{err}</p>}
          <Idx c={before} label="До" />
        </div>

        {out && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <h2 style={{ color: GOLD, fontSize: 18, margin: '0 0 10px' }}>Результат{mode ? <span style={{ color: MUTED, fontSize: 14, fontWeight: 400 }}> · режим: {mode}</span> : null}</h2>
            {warnings.length > 0 && (
              <div style={{ border: '1px solid #ff9b8a', borderRadius: 9, padding: '10px 12px', marginBottom: 10 }}>
                <strong style={{ color: '#ff9b8a' }}>Правка додала прийомів, які перевірка вважає ознаками:</strong>
                <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: CREAM, fontSize: 14 }}>{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            )}
            {placeholders > 0 && (
              <p style={{ color: '#ffcf8a', fontSize: 14, margin: '0 0 10px' }}>
                Позначок для вашого прикладу: {placeholders}. Допишіть їх перед публікацією — саме вони роблять текст вашим.
              </p>
            )}
            <textarea value={out} onChange={(e) => setOut(e.target.value)} style={{ ...field, minHeight: 320 }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={copy} style={btn(GOLD, NAVY)}>{copied ? 'Скопійовано' : 'Скопіювати'}</button>
              <button type="button" disabled={!!busy} onClick={() => check('after')} style={btn('transparent', GOLD)}>
                {busy === 'after' ? 'Перевіряємо… (до 2 хвилин)' : 'Перевірити результат'}
              </button>
            </div>
            <Idx c={before} label="До" />
            <Idx c={after} label="Після" />

            {changes.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, margin: '18px 0 8px' }}>Що змінено</h3>
                {changes.map((c, i) => (
                  <div key={i} style={{ borderTop: `1px solid ${LINE}`, padding: '10px 0', fontSize: 14, lineHeight: 1.55 }}>
                    <div style={{ color: MUTED }}><s>{c.before}</s></div>
                    <div>{c.after}</div>
                    <div style={{ color: GOLD, fontSize: 12 }}>{c.why}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {after && <AiStyleReport check={after} />}
      </div>
    </main>
  )
}
