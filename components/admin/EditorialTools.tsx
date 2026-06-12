'use client'
// components/admin/EditorialTools.tsx
// Спільний редакторський конвеєр для тексту серії:
//   Аналіз (звіт) → Олюднити ×2 (подвійний прохід проти штампів) → було/стало → Застосувати/Відхилити
//   + окрема кнопка «Грамотність».
// Використовується і у формі створення, і в редакторі серії.

import { useState, useCallback } from 'react'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"

interface Props {
  text: string
  genre?: string
  title?: string
  authorName?: string
  onApply: (newText: string) => void
  showAnalysis?: boolean
}

interface HumanizeResp { humanized_text?: string; changes_summary?: unknown[]; error?: string }
interface CorrectResp  { corrected_text?: string;  changes?: unknown[];        error?: string }

export default function EditorialTools({
  text, genre, title, authorName, onApply, showAnalysis = true,
}: Props) {
  const [busy,    setBusy]    = useState<'idle' | 'correct' | 'humanize' | 'check'>('idle')
  const [msg,     setMsg]     = useState('')
  const [report,  setReport]  = useState('')
  const [pending, setPending] = useState<{ mode: 'correct' | 'humanize'; text: string; changes: string[] } | null>(null)

  const humanizeOnce = useCallback(async (input: string): Promise<{ text: string; changes: string[] }> => {
    const res = await fetch('/api/admin/stories1/humanize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, genre }),
    })
    const data = await res.json() as HumanizeResp
    if (!res.ok || data.error) throw new Error(data.error || 'Помилка олюднення')
    const out = (data.humanized_text && data.humanized_text.trim()) ? data.humanized_text : input
    const ch = Array.isArray(data.changes_summary) ? data.changes_summary.map(c => String(c)) : []
    return { text: out, changes: ch }
  }, [genre])

  // Подвійне олюднення — два проходи поспіль
  const runHumanizeDouble = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('humanize'); setMsg(''); setReport(''); setPending(null)
    try {
      setMsg('Олюднення, прохід 1 із 2…')
      const p1 = await humanizeOnce(text)
      setMsg('Олюднення, прохід 2 із 2…')
      const p2 = await humanizeOnce(p1.text)
      setPending({ mode: 'humanize', text: p2.text, changes: [...p1.changes, ...p2.changes] })
      setMsg('Готово: два проходи олюднення. Переглянь «було/стало» і виріши.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Помилка з'єднання")
    } finally {
      setBusy('idle')
    }
  }, [text, humanizeOnce])

  const runCorrect = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('correct'); setMsg(''); setReport(''); setPending(null)
    try {
      const res = await fetch('/api/admin/stories1/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, genre }),
      })
      const data = await res.json() as CorrectResp
      if (!res.ok || data.error) { setMsg(data.error ?? 'Помилка'); return }
      const next = (data.corrected_text && data.corrected_text.trim()) ? data.corrected_text : ''
      if (next) {
        const changes = Array.isArray(data.changes) ? data.changes.map(c => String(c)) : []
        setPending({ mode: 'correct', text: next, changes })
        setMsg('Готова пропозиція щодо грамотності — переглянь і виріши.')
      } else {
        setMsg('AI не повернув тексту')
      }
    } catch {
      setMsg("Помилка з'єднання")
    } finally {
      setBusy('idle')
    }
  }, [text, genre])

  const runCheck = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('check'); setMsg(''); setReport(''); setPending(null)
    try {
      const res = await fetch('/api/admin/stories1/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName || 'Назар Колодій',
          title:      title || 'Без назви',
          genre:      genre || 'Оповідання',
          text,
        }),
      })
      const data = await res.json() as { report?: unknown; error?: string }
      if (!res.ok || data.error) { setMsg(data.error ?? 'Помилка аналізу'); return }
      setReport(JSON.stringify(data.report ?? {}, null, 2))
      setMsg('Аналіз готовий — див. звіт нижче. Далі раджу «Олюднити ×2».')
    } catch {
      setMsg("Помилка з'єднання")
    } finally {
      setBusy('idle')
    }
  }, [text, authorName, title, genre])

  const applyPending = useCallback(() => {
    if (!pending) return
    onApply(pending.text)
    setMsg('Застосовано. Не забудь зберегти.')
    setPending(null)
  }, [pending, onApply])

  const rejectPending = useCallback(() => {
    setPending(null)
    setMsg('Пропозицію відхилено — текст лишився без змін.')
  }, [])

  const btn = (active: boolean, primary: boolean): React.CSSProperties => ({
    background: primary ? 'rgba(240,165,0,0.12)' : 'rgba(255,255,255,0.06)',
    color: primary ? GOLD : '#f5f0e8',
    border: `1px solid ${primary ? 'rgba(240,165,0,0.35)' : 'rgba(255,255,255,0.15)'}`,
    borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 700,
    cursor: busy === 'idle' ? 'pointer' : 'wait', fontFamily: FONT,
    opacity: busy !== 'idle' && !active ? 0.5 : 1,
  })

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        {showAnalysis && (
          <button onClick={runCheck} disabled={busy !== 'idle'} style={btn(busy === 'check', false)}>
            {busy === 'check' ? 'Аналізую…' : '1. Аналіз'}
          </button>
        )}
        <button onClick={runHumanizeDouble} disabled={busy !== 'idle'} style={btn(busy === 'humanize', true)}>
          {busy === 'humanize' ? 'Олюднюю…' : `${showAnalysis ? '2. ' : ''}Олюднити ×2 (проти штампів)`}
        </button>
        <button onClick={runCorrect} disabled={busy !== 'idle'} style={btn(busy === 'correct', false)}>
          {busy === 'correct' ? 'Перевіряю…' : 'Грамотність'}
        </button>
      </div>

      {msg && (
        <div style={{ fontSize: 13, color: '#cbd5e1', fontFamily: FONT, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 12 }}>
          {msg}
        </div>
      )}

      {pending && (
        <div style={{ border: `1px solid ${GOLD}55`, borderRadius: 12, background: 'rgba(240,165,0,0.05)', padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, fontFamily: FONT, marginBottom: 10 }}>
            {pending.mode === 'humanize' ? 'Пропозиція олюднення (×2)' : 'Пропозиція щодо грамотності'} — рішення за тобою
          </div>

          {pending.changes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', fontFamily: FONT, marginBottom: 6 }}>Що змінено:</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: 12, fontFamily: FONT, lineHeight: 1.6 }}>
                {pending.changes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', fontFamily: FONT, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Було</div>
              <div style={{ fontSize: 12, color: '#9fb0c8', fontFamily: 'Georgia, serif', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: 10, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{text}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: FONT, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>Стало (пропозиція)</div>
              <div style={{ fontSize: 12, color: '#dde6f0', fontFamily: 'Georgia, serif', lineHeight: 1.6, background: 'rgba(240,165,0,0.06)', border: `1px solid ${GOLD}33`, borderRadius: 8, padding: 10, maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{pending.text}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={applyPending} style={{ background: GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FONT }}>
              ✓ Застосувати
            </button>
            <button onClick={rejectPending} style={{ background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
              ✗ Відхилити
            </button>
          </div>
        </div>
      )}

      {report && (
        <pre style={{ fontSize: 12, color: '#cbd5e1', fontFamily: 'monospace', background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: 14, maxHeight: 320, overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>
          {report}
        </pre>
      )}

      <div style={{ fontSize: 11, color: '#667799', fontFamily: FONT, marginTop: 10, lineHeight: 1.5 }}>
        Порядок: {showAnalysis ? <><b>Аналіз</b> → </> : null}<b>Олюднити ×2</b> (два проходи проти штампів) → переглянь «було/стало» → <b>Застосувати</b> або <b>Відхилити</b>. Після «Застосувати» не забудь зберегти.
      </div>
    </div>
  )
}
