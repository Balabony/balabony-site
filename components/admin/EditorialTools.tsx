'use client'
// components/admin/EditorialTools.tsx
// Спільний редакторський конвеєр для тексту серії:
//   Аналіз (звіт) → Олюднити ×2 (проти штампів) / Грамотність → ПІДСВІЧЕНА різниця → Застосувати/Відхилити
// Підсвітка: видалене — червоним закресленим, додане/виправлене — зеленим.
// Для «Грамотності» додатково показуються причини правок (reason).
// Інтерфейс Props незмінний — використовується і у формі створення, і в редакторі серії.

import { useState, useCallback, useMemo } from 'react'

const GOLD      = '#f0a500'
const NAVY_DEEP = '#0a1628'
const FONT      = "'Montserrat', Arial, sans-serif"
const SERIF     = "'Georgia', serif"

interface Props {
  text: string
  genre?: string
  title?: string
  authorName?: string
  onApply: (newText: string) => void
  showAnalysis?: boolean
}

interface Change { id?: number; original?: string; corrected?: string; reason?: string }
interface HumanizeResp { humanized_text?: string; changes_summary?: unknown[]; error?: string }
interface CorrectResp  { corrected_text?: string;  changes?: unknown[];        error?: string }

type Pending =
  | { mode: 'humanize'; text: string; before: string; changes: string[] }
  | { mode: 'correct';  text: string; before: string; corrections: Change[] }

// ── DIFF: токенізація на слова+пробіли+пунктуацію ───────────────────────────────
function tokenize(s: string): string[] {
  // зберігаємо роздільники, щоб склеювання давало точний оригінал
  return s.match(/\s+|[^\s]+/g) ?? []
}

type DiffPart = { type: 'equal' | 'del' | 'ins'; text: string }

// LCS-діф по токенах (для абзацу). Обмежуємо розмір — інакше fallback.
function diffTokens(aStr: string, bStr: string): DiffPart[] {
  const a = tokenize(aStr)
  const b = tokenize(bStr)
  const n = a.length, m = b.length
  // захист від надто великих абзаців
  if (n * m > 600000) {
    return [{ type: 'del', text: aStr }, { type: 'ins', text: bStr }]
  }
  // DP таблиця довжин LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const parts: DiffPart[] = []
  let i = 0, j = 0
  const push = (type: DiffPart['type'], text: string) => {
    const last = parts[parts.length - 1]
    if (last && last.type === type) last.text += text
    else parts.push({ type, text })
  }
  while (i < n && j < m) {
    if (a[i] === b[j]) { push('equal', a[i]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', a[i]); i++ }
    else { push('ins', b[j]); j++ }
  }
  while (i < n) { push('del', a[i]); i++ }
  while (j < m) { push('ins', b[j]); j++ }
  return parts
}

// Абзацний diff + word-diff усередині змінених абзаців.
type Block =
  | { kind: 'equal'; text: string }
  | { kind: 'changed'; parts: DiffPart[] }
  | { kind: 'added'; text: string }
  | { kind: 'removed'; text: string }

function diffParagraphs(beforeStr: string, afterStr: string): Block[] {
  const A = beforeStr.split(/\n/)
  const B = afterStr.split(/\n/)
  const n = A.length, m = B.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i].trim() === B[j].trim() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])

  const blocks: Block[] = []
  let i = 0, j = 0
  // буфери для парування видалених+доданих абзаців у «змінені»
  let pendDel: string[] = [], pendIns: string[] = []
  const flush = () => {
    const k = Math.min(pendDel.length, pendIns.length)
    for (let t = 0; t < k; t++) {
      const d = pendDel[t], ins = pendIns[t]
      if (d.trim() === '' && ins.trim() === '') { blocks.push({ kind: 'equal', text: ins }); continue }
      blocks.push({ kind: 'changed', parts: diffTokens(d, ins) })
    }
    for (let t = k; t < pendDel.length; t++) if (pendDel[t].trim() !== '') blocks.push({ kind: 'removed', text: pendDel[t] })
    for (let t = k; t < pendIns.length; t++) blocks.push({ kind: 'added', text: pendIns[t] })
    pendDel = []; pendIns = []
  }
  while (i < n && j < m) {
    if (A[i].trim() === B[j].trim()) { flush(); blocks.push({ kind: 'equal', text: B[j] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { pendDel.push(A[i]); i++ }
    else { pendIns.push(B[j]); j++ }
  }
  while (i < n) { pendDel.push(A[i]); i++ }
  while (j < m) { pendIns.push(B[j]); j++ }
  flush()
  return blocks
}

// підсвітка corrected-фраз у тексті (для «Грамотності»)
type Seg = { type: 'text'; content: string } | { type: 'change'; content: string; change: Change }
function buildCorrectSegments(correctedText: string, changes: Change[]): Seg[] {
  const valid = changes.filter(c => c.corrected && c.corrected.trim())
  if (!valid.length) return [{ type: 'text', content: correctedText }]
  const used: Array<[number, number]> = []
  const placed: Array<{ change: Change; start: number; end: number }> = []
  for (const change of valid) {
    const needle = change.corrected as string
    let from = 0
    while (from < correctedText.length) {
      const pos = correctedText.indexOf(needle, from)
      if (pos === -1) break
      const end = pos + needle.length
      if (!used.some(([s, e]) => pos < e && end > s)) { used.push([pos, end]); placed.push({ change, start: pos, end }); break }
      from = pos + 1
    }
  }
  placed.sort((a, b) => a.start - b.start)
  const segs: Seg[] = []
  let cur = 0
  for (const { change, start, end } of placed) {
    if (start < cur) continue
    if (start > cur) segs.push({ type: 'text', content: correctedText.slice(cur, start) })
    segs.push({ type: 'change', content: correctedText.slice(start, end), change })
    cur = end
  }
  if (cur < correctedText.length) segs.push({ type: 'text', content: correctedText.slice(cur) })
  return segs
}

export default function EditorialTools({
  text, genre, title, authorName, onApply, showAnalysis = true,
}: Props) {
  const [busy,    setBusy]    = useState<'idle' | 'correct' | 'humanize' | 'check'>('idle')
  const [msg,     setMsg]     = useState('')
  const [report,  setReport]  = useState('')
  const [pending, setPending] = useState<Pending | null>(null)

  const humanizeOnce = useCallback(async (input: string): Promise<{ text: string; changes: string[] }> => {
    const res = await fetch('/api/admin/stories1/humanize', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input, genre }),
    })
    const data = await res.json() as HumanizeResp
    if (!res.ok || data.error) throw new Error(data.error || 'Помилка олюднення')
    const out = (data.humanized_text && data.humanized_text.trim()) ? data.humanized_text : input
    const ch = Array.isArray(data.changes_summary) ? data.changes_summary.map(c => String(c)) : []
    return { text: out, changes: ch }
  }, [genre])

  const runHumanizeDouble = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('humanize'); setMsg(''); setReport(''); setPending(null)
    try {
      setMsg('Олюднення, прохід 1 із 2…')
      const p1 = await humanizeOnce(text)
      setMsg('Олюднення, прохід 2 із 2…')
      const p2 = await humanizeOnce(p1.text)
      setPending({ mode: 'humanize', text: p2.text, before: text, changes: [...p1.changes, ...p2.changes] })
      setMsg('Готово. Підсвічене червоним — прибрано, зеленим — додано. Виріши: застосувати чи ні.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Помилка з'єднання")
    } finally { setBusy('idle') }
  }, [text, humanizeOnce])

  const runCorrect = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('correct'); setMsg(''); setReport(''); setPending(null)
    try {
      const res = await fetch('/api/admin/stories1/correct', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, genre }),
      })
      const data = await res.json() as CorrectResp
      if (!res.ok || data.error) { setMsg(data.error ?? 'Помилка'); return }
      const next = (data.corrected_text && data.corrected_text.trim()) ? data.corrected_text : ''
      if (!next) { setMsg('AI не повернув тексту'); return }
      const corrections: Change[] = Array.isArray(data.changes)
        ? (data.changes as Change[]).filter(c => c && typeof c === 'object')
        : []
      setPending({ mode: 'correct', text: next, before: text, corrections })
      setMsg(corrections.length
        ? 'Готово. Підсвічені місця — пропоновані виправлення (наведи, щоб побачити «було» й причину).'
        : 'AI не виділив окремих правок — порівняй тексти нижче.')
    } catch {
      setMsg("Помилка з'єднання")
    } finally { setBusy('idle') }
  }, [text, genre])

  const runCheck = useCallback(async () => {
    if (!text.trim()) { setMsg('Текст порожній'); return }
    setBusy('check'); setMsg(''); setReport(''); setPending(null)
    try {
      const res = await fetch('/api/admin/stories1/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName || 'Назар Колодій',
          title: title || 'Без назви', genre: genre || 'Оповідання', text,
        }),
      })
      const data = await res.json() as { report?: unknown; error?: string }
      if (!res.ok || data.error) { setMsg(data.error ?? 'Помилка аналізу'); return }
      setReport(JSON.stringify(data.report ?? {}, null, 2))
      setMsg('Аналіз готовий — див. звіт нижче. Далі раджу «Олюднити ×2».')
    } catch {
      setMsg("Помилка з'єднання")
    } finally { setBusy('idle') }
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

  // стилі підсвітки
  const delStyle: React.CSSProperties = { background: 'rgba(248,113,113,0.18)', color: '#fca5a5', textDecoration: 'line-through', borderRadius: 3, padding: '0 2px' }
  const insStyle: React.CSSProperties = { background: 'rgba(74,222,128,0.20)', color: '#bbf7d0', borderRadius: 3, padding: '0 2px' }
  const chgStyle: React.CSSProperties = { background: 'rgba(240,165,0,0.22)', color: '#ffe9b8', borderRadius: 3, padding: '0 2px', borderBottom: `2px solid ${GOLD}` }

  // блоки для humanize-diff
  const paraBlocks = useMemo(
    () => (pending && pending.mode === 'humanize') ? diffParagraphs(pending.before, pending.text) : null,
    [pending],
  )
  // сегменти для correct
  const correctSegs = useMemo(
    () => (pending && pending.mode === 'correct') ? buildCorrectSegments(pending.text, pending.corrections) : null,
    [pending],
  )
  const correctCount = pending && pending.mode === 'correct' ? pending.corrections.filter(c => c.corrected).length : 0

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
          <div style={{ fontSize: 14, fontWeight: 800, color: GOLD, fontFamily: FONT, marginBottom: 6 }}>
            {pending.mode === 'humanize' ? 'Пропозиція олюднення (×2)' : 'Пропозиція щодо грамотності'} — рішення за тобою
          </div>

          {/* легенда */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, fontFamily: FONT, color: '#9fb0c8', marginBottom: 10 }}>
            {pending.mode === 'humanize' ? (
              <>
                <span><span style={{ ...delStyle, padding: '1px 6px' }}>прибрано</span></span>
                <span><span style={{ ...insStyle, padding: '1px 6px' }}>додано</span></span>
              </>
            ) : (
              <span>
                <span style={{ ...chgStyle, padding: '1px 6px' }}>виправлено</span>
                {correctCount > 0 ? ` — ${correctCount} прав.` : ''} (наведи курсор, щоб побачити «було» й причину)
              </span>
            )}
          </div>

          {/* ПІДСВІЧЕНИЙ ТЕКСТ */}
          <div style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px', maxHeight: 460, overflow: 'auto', fontFamily: SERIF, fontSize: 14, lineHeight: 1.75, color: '#e6ecf5', whiteSpace: 'pre-wrap', marginBottom: 12 }}>
            {pending.mode === 'humanize' && paraBlocks && paraBlocks.map((blk, bi) => {
              if (blk.kind === 'equal')   return <span key={bi}>{blk.text}{'\n'}</span>
              if (blk.kind === 'added')   return <span key={bi}><span style={insStyle}>{blk.text}</span>{'\n'}</span>
              if (blk.kind === 'removed') return <span key={bi}><span style={delStyle}>{blk.text}</span>{'\n'}</span>
              return (
                <span key={bi}>
                  {blk.parts.map((p, pi) =>
                    p.type === 'equal' ? <span key={pi}>{p.text}</span>
                    : p.type === 'del' ? <span key={pi} style={delStyle}>{p.text}</span>
                    : <span key={pi} style={insStyle}>{p.text}</span>
                  )}{'\n'}
                </span>
              )
            })}

            {pending.mode === 'correct' && correctSegs && (
              correctCount > 0
                ? correctSegs.map((seg, si) =>
                    seg.type === 'text'
                      ? <span key={si}>{seg.content}</span>
                      : <span key={si} style={chgStyle} title={`було: «${seg.change.original ?? ''}»${seg.change.reason ? `\n${seg.change.reason}` : ''}`}>{seg.content}</span>
                  )
                : <span>{pending.text}</span>
            )}
          </div>

          {/* перелік правок для «Грамотності» */}
          {pending.mode === 'correct' && correctCount > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', fontFamily: FONT, marginBottom: 6 }}>Перелік правок:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pending.corrections.filter(c => c.corrected).map((c, i) => (
                  <div key={i} style={{ fontSize: 12, fontFamily: FONT, color: '#cbd5e1', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px', lineHeight: 1.5 }}>
                    <span style={{ color: '#fca5a5', textDecoration: 'line-through' }}>{c.original}</span>
                    {' → '}
                    <span style={{ color: '#bbf7d0' }}>{c.corrected}</span>
                    {c.reason ? <div style={{ color: '#8899bb', marginTop: 2 }}>{c.reason}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* підсумок змін для олюднення (якщо API дав) */}
          {pending.mode === 'humanize' && pending.changes.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', fontFamily: FONT, marginBottom: 6 }}>Що змінено (підсумок AI):</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: 12, fontFamily: FONT, lineHeight: 1.6 }}>
                {pending.changes.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

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
        Порядок: {showAnalysis ? <><b>Аналіз</b> → </> : null}<b>Олюднити ×2</b> або <b>Грамотність</b> → переглянь <b>підсвічену</b> різницю → <b>Застосувати</b> або <b>Відхилити</b>. Після «Застосувати» не забудь зберегти.
      </div>
    </div>
  )
}
