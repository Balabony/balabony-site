'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'
const VIOLET    = '#818cf8'
const TEAL      = '#2dd4bf'

const GENRES = ['оповідання', 'гумор', 'драма', 'казка', 'пригода', 'історична проза']

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Field({ label, children, right }: { label: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>{label}</span>
        {right && <span style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>{right}</span>}
      </div>
      {children}
    </div>
  )
}

function SectionCard({ n, title, accent, children }: { n: number | string; title: string; accent?: string; children: React.ReactNode }) {
  const bg = accent ?? GOLD
  return (
    <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: NAVY_DEEP, flexShrink: 0, fontFamily: FONT }}>{n}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function verdictColor(v: string): string {
  const s = v.toLowerCase()
  if (s.includes('відповідає') && !s.includes('не') && !s.includes('частково')) return '#4ade80'
  if (s.includes('унікальний') || s.includes('людиною') || s.includes('без помилок')) return '#4ade80'
  if (s.includes('частково') || s.includes('можливо') || s.includes('незначні')) return '#fbbf24'
  return '#f87171'
}
function scoreColor(n: number) { return n >= 75 ? '#4ade80' : n >= 50 ? '#fbbf24' : '#f87171' }

function VerdictBadge({ text }: { text: string }) {
  const color = verdictColor(text)
  return <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontFamily: FONT, whiteSpace: 'nowrap' }}>{text}</span>
}

function RecommendationBadge({ text }: { text: string }) {
  let color = '#4ade80', bg = 'rgba(74,222,128,0.1)', border = 'rgba(74,222,128,0.35)'
  if (text.includes('доопрацювання')) { color = '#fbbf24'; bg = 'rgba(251,191,36,0.1)'; border = 'rgba(251,191,36,0.35)' }
  if (text.includes('Відхилити'))     { color = '#f87171'; bg = 'rgba(248,113,113,0.1)'; border = 'rgba(248,113,113,0.35)' }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: bg, border: `1.5px solid ${border}`, borderRadius: 12, fontFamily: FONT }}>
      <span style={{ fontSize: 20 }}>{text.includes('Рекомендовано') ? '✓' : text.includes('доопрацювання') ? '⚠' : '✕'}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color }}>{text}</span>
    </div>
  )
}

// ── Para diff helper ──────────────────────────────────────────────────────────

function buildParaDiff(original: string, humanized: string) {
  const origLines = original.split('\n')
  const humLines  = humanized.split('\n')
  const origNorm  = new Set(origLines.map(l => l.trim()))
  const humNorm   = new Set(humLines.map(l => l.trim()))
  return {
    orig: origLines.map(l => ({ text: l, changed: l.trim() !== '' && !humNorm.has(l.trim()) })),
    hum:  humLines.map(l => ({ text: l, changed: l.trim() !== '' && !origNorm.has(l.trim()) })),
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AIReport {
  plagiarism:   { score: number; verdict: string; details: string }
  ai_detection: { score: number; verdict: string; details: string }
  genre_match:  { score: number; verdict: string; details: string }
  grammar:      { score: number; verdict: string; details: string; errors?: string[] }
  overall:      { recommendation: string; summary: string; suggestions?: string[] }
}

interface Change { id: number; original: string; corrected: string; reason: string }

type Segment = { type: 'text'; content: string } | { type: 'change'; content: string; change: Change }
type Phase   = 'idle' | 'loading' | 'done' | 'error'

// ── Correction diff builder ───────────────────────────────────────────────────

function buildSegments(correctedText: string, changes: Change[]): Segment[] {
  if (!changes.length) return [{ type: 'text', content: correctedText }]
  const usedRanges: Array<[number, number]> = []
  const positioned: Array<{ change: Change; start: number; end: number }> = []
  for (const change of changes) {
    if (!change.corrected) continue
    let from = 0
    while (from < correctedText.length) {
      const pos = correctedText.indexOf(change.corrected, from)
      if (pos === -1) break
      const end = pos + change.corrected.length
      if (!usedRanges.some(([s, e]) => pos < e && end > s)) {
        usedRanges.push([pos, end]); positioned.push({ change, start: pos, end }); break
      }
      from = pos + 1
    }
  }
  positioned.sort((a, b) => a.start - b.start)
  const segments: Segment[] = []
  let cursor = 0
  for (const { change, start, end } of positioned) {
    if (start < cursor) continue
    if (start > cursor) segments.push({ type: 'text', content: correctedText.slice(cursor, start) })
    segments.push({ type: 'change', content: change.corrected, change })
    cursor = end
  }
  if (cursor < correctedText.length) segments.push({ type: 'text', content: correctedText.slice(cursor) })
  return segments
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Stories1Page() {
  const router = useRouter()

  // Form
  const [authorName, setAuthorName] = useState('')
  const [title,      setTitle]      = useState('')
  const [genre,      setGenre]      = useState(GENRES[0])
  const [text,       setText]       = useState('')

  // Photo
  const [imgSrc,   setImgSrc]   = useState('')
  const [photoB64, setPhotoB64] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // AI check
  const [checkPhase, setCheckPhase] = useState<Phase>('idle')
  const [checkError, setCheckError] = useState('')
  const [report,     setReport]     = useState<AIReport | null>(null)

  // Editorial correction
  const [correctPhase,  setCorrectPhase]  = useState<Phase>('idle')
  const [correctError,  setCorrectError]  = useState('')
  const [correctedText, setCorrectedText] = useState('')
  const [corrections,   setCorrections]   = useState<Change[]>([])
  const segments = correctedText ? buildSegments(correctedText, corrections) : []

  // Humanize
  const [humanizePhase,   setHumanizePhase]   = useState<Phase>('idle')
  const [humanizeError,   setHumanizeError]   = useState('')
  const [humanizedText,   setHumanizedText]   = useState('')
  const [humanizeSummary, setHumanizeSummary] = useState<string[]>([])
  const paraDiff = (humanizePhase === 'done' && humanizedText) ? buildParaDiff(text, humanizedText) : null

  // Claude originals (for "reset to Claude" buttons)
  const [claudeCorrectedText, setClaudeCorrectedText] = useState('')
  const [claudeHumanizedText, setClaudeHumanizedText] = useState('')

  // Correction edit mode
  const [correctEditMode,       setCorrectEditMode]       = useState(false)
  const [correctDraft,          setCorrectDraft]          = useState('')
  const [correctManuallyEdited, setCorrectManuallyEdited] = useState(false)

  // Humanize edit mode
  const [humanizeEditMode,       setHumanizeEditMode]       = useState(false)
  const [humanizeDraft,          setHumanizeDraft]          = useState('')
  const [humanizeManuallyEdited, setHumanizeManuallyEdited] = useState(false)

  // Decision
  const [adminNotes,   setAdminNotes]   = useState('')
  const [actionPhase,  setActionPhase]  = useState<Phase>('idle')
  const [actionMsg,    setActionMsg]    = useState('')
  const [actionStatus, setActionStatus] = useState<'approved' | 'rejected' | 'revision' | ''>('')

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  const hasCorrected = correctPhase === 'done' && correctedText && corrections.length > 0
  const hasHumanized = humanizePhase === 'done' && humanizedText

  // ── Photo ────────────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { const r = ev.target?.result as string; setImgSrc(r); setPhotoB64(r) }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) loadFile(f)
  }, [loadFile])

  // ── AI Check ─────────────────────────────────────────────────────────────

  const handleCheck = async () => {
    if (!title || !genre || !text) { setCheckError('Заповніть назву, жанр та текст'); setCheckPhase('error'); return }
    setCheckPhase('loading'); setCheckError(''); setReport(null)
    setCorrectPhase('idle'); setCorrectedText(''); setCorrections([])
    setHumanizePhase('idle'); setHumanizedText(''); setHumanizeSummary([])
    try {
      const res  = await fetch('/api/admin/stories1/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ authorName, title, genre, text }) })
      const data = await res.json() as { report?: AIReport; error?: string }
      if (!res.ok || data.error) { setCheckError(data.error ?? 'Помилка'); setCheckPhase('error'); return }
      setReport(data.report ?? null); setCheckPhase('done')
    } catch { setCheckError("Помилка з'єднання"); setCheckPhase('error') }
  }

  // ── Editorial Correction ─────────────────────────────────────────────────

  const handleCorrect = async () => {
    setCorrectPhase('loading'); setCorrectError(''); setCorrectedText(''); setCorrections([])
    try {
      const res  = await fetch('/api/admin/stories1/correct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, genre }) })
      const data = await res.json() as { corrected_text?: string; changes?: Change[]; error?: string }
      if (!res.ok || data.error) { setCorrectError(data.error ?? 'Помилка'); setCorrectPhase('error'); return }
      const ct = data.corrected_text ?? text
      setCorrectedText(ct); setClaudeCorrectedText(ct); setCorrections(data.changes ?? [])
      setCorrectPhase('done'); setCorrectManuallyEdited(false)
    } catch { setCorrectError("Помилка з'єднання"); setCorrectPhase('error') }
  }

  // ── Humanize ─────────────────────────────────────────────────────────────

  const handleHumanize = async () => {
    setHumanizePhase('loading'); setHumanizeError(''); setHumanizedText(''); setHumanizeSummary([])
    try {
      const res  = await fetch('/api/admin/stories1/humanize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, genre }) })
      const data = await res.json() as { humanized_text?: string; changes_summary?: string[]; error?: string }
      if (!res.ok || data.error) { setHumanizeError(data.error ?? 'Помилка'); setHumanizePhase('error'); return }
      const ht = data.humanized_text ?? text
      setHumanizedText(ht); setClaudeHumanizedText(ht); setHumanizeSummary(data.changes_summary ?? [])
      setHumanizePhase('done'); setHumanizeManuallyEdited(false)
    } catch { setHumanizeError("Помилка з'єднання"); setHumanizePhase('error') }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  const handleAction = async (action: 'approve' | 'reject' | 'revision', publishedVersion?: string) => {
    setActionPhase('loading'); setActionMsg('')
    try {
      const res  = await fetch('/api/admin/stories1/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName, title, genre, text, photoBase64: photoB64, aiReport: report, action, adminNotes,
          correctedText:   correctedText  || null,
          changes:         corrections.length ? corrections : null,
          humanizedText:   humanizedText  || null,
          humanizeSummary: humanizeSummary.length ? humanizeSummary : null,
          publishedVersion: publishedVersion ?? 'original',
        }),
      })
      const data = await res.json() as { message?: string; error?: string; status?: string; coverGenerating?: boolean }
      if (!res.ok || data.error) { setActionMsg(data.error ?? 'Помилка'); setActionPhase('error'); return }
      setActionMsg((data.message ?? 'Готово') + (data.coverGenerating ? ' Обкладинка генерується у фоні (~60 с).' : ''))
      setActionStatus(data.status as typeof actionStatus); setActionPhase('done')
    } catch { setActionMsg("Помилка з'єднання"); setActionPhase('error') }
  }

  const handleReset = () => {
    setAuthorName(''); setTitle(''); setGenre(GENRES[0]); setText('')
    setImgSrc(''); setPhotoB64(''); setReport(null)
    setCheckPhase('idle'); setCheckError('')
    setCorrectPhase('idle'); setCorrectError(''); setCorrectedText(''); setCorrections([])
    setHumanizePhase('idle'); setHumanizeError(''); setHumanizedText(''); setHumanizeSummary([])
    setClaudeCorrectedText(''); setClaudeHumanizedText('')
    setCorrectEditMode(false); setCorrectDraft(''); setCorrectManuallyEdited(false)
    setHumanizeEditMode(false); setHumanizeDraft(''); setHumanizeManuallyEdited(false)
    setActionPhase('idle'); setActionMsg(''); setActionStatus(''); setAdminNotes('')
  }

  const selectStyle: React.CSSProperties = { ...inputBase, appearance: 'none', cursor: 'pointer' }

  // ── Publish button grid ───────────────────────────────────────────────────

  function PublishButtons() {
    const disabled = actionPhase === 'loading'
    if (!hasCorrected && !hasHumanized) {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <button onClick={() => handleAction('approve', 'original')}  disabled={disabled} style={actionBtn('#4ade80', 'rgba(74,222,128,0.12)',   'rgba(74,222,128,0.35)',   disabled)}><span>✓</span><span>Схвалити</span></button>
          <button onClick={() => handleAction('revision')}             disabled={disabled} style={actionBtn('#fbbf24', 'rgba(251,191,36,0.1)',    'rgba(251,191,36,0.3)',    disabled)}><span>⟳</span><span>Доопрацювання</span></button>
          <button onClick={() => handleAction('reject')}               disabled={disabled} style={actionBtn('#f87171', 'rgba(248,113,113,0.1)',   'rgba(248,113,113,0.3)',   disabled)}><span>✕</span><span>Відхилити</span></button>
        </div>
      )
    }
    if (hasCorrected && !hasHumanized) {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <button onClick={() => handleAction('approve', 'original')}  disabled={disabled} style={actionBtn('#4ade80', 'rgba(74,222,128,0.12)', 'rgba(74,222,128,0.35)', disabled)}><span>✓</span><span>Опублікувати оригінал</span></button>
            <button onClick={() => handleAction('approve', 'corrected')} disabled={disabled} style={actionBtn(VIOLET,   'rgba(129,140,248,0.12)', 'rgba(129,140,248,0.4)',  disabled)}><span>✍</span><span>З редакторською правкою</span></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => handleAction('revision')} disabled={disabled} style={actionBtn('#fbbf24', 'rgba(251,191,36,0.1)',  'rgba(251,191,36,0.3)',  disabled)}><span>⟳</span><span>Доопрацювання</span></button>
            <button onClick={() => handleAction('reject')}   disabled={disabled} style={actionBtn('#f87171', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', disabled)}><span>✕</span><span>Відхилити</span></button>
          </div>
        </>
      )
    }
    if (!hasCorrected && hasHumanized) {
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <button onClick={() => handleAction('approve', 'original')}  disabled={disabled} style={actionBtn('#4ade80', 'rgba(74,222,128,0.12)', 'rgba(74,222,128,0.35)', disabled)}><span>✓</span><span>Опублікувати оригінал</span></button>
            <button onClick={() => handleAction('approve', 'humanized')} disabled={disabled} style={actionBtn(TEAL,     'rgba(45,212,191,0.12)',  'rgba(45,212,191,0.4)',  disabled)}><span>✨</span><span>Природніший варіант</span></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => handleAction('revision')} disabled={disabled} style={actionBtn('#fbbf24', 'rgba(251,191,36,0.1)',  'rgba(251,191,36,0.3)',  disabled)}><span>⟳</span><span>Доопрацювання</span></button>
            <button onClick={() => handleAction('reject')}   disabled={disabled} style={actionBtn('#f87171', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', disabled)}><span>✕</span><span>Відхилити</span></button>
          </div>
        </>
      )
    }
    // Both available
    return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <button onClick={() => handleAction('approve', 'original')}           disabled={disabled} style={actionBtn('#4ade80', 'rgba(74,222,128,0.12)', 'rgba(74,222,128,0.35)', disabled)}><span>✓</span><span>Оригінал</span></button>
          <button onClick={() => handleAction('approve', 'corrected')}          disabled={disabled} style={actionBtn(VIOLET,   'rgba(129,140,248,0.12)', 'rgba(129,140,248,0.4)',  disabled)}><span>✍</span><span>З правкою</span></button>
          <button onClick={() => handleAction('approve', 'humanized')}          disabled={disabled} style={actionBtn(TEAL,     'rgba(45,212,191,0.12)',  'rgba(45,212,191,0.4)',  disabled)}><span>✨</span><span>Природніший</span></button>
          <button onClick={() => handleAction('approve', 'corrected_humanized')} disabled={disabled} style={actionBtn(GOLD,    'rgba(240,165,0,0.12)',   'rgba(240,165,0,0.4)',   disabled)}><span>⚡</span><span>Правка + Природній</span></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => handleAction('revision')} disabled={disabled} style={actionBtn('#fbbf24', 'rgba(251,191,36,0.1)',  'rgba(251,191,36,0.3)',  disabled)}><span>⟳</span><span>Доопрацювання</span></button>
          <button onClick={() => handleAction('reject')}   disabled={disabled} style={actionBtn('#f87171', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', disabled)}><span>✕</span><span>Відхилити</span></button>
        </div>
      </>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4 L4 16 L10 13 L16 16 L16 4 Z" stroke={NAVY_DEEP} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="7" y1="8" x2="13" y2="8" stroke={NAVY_DEEP} strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="7" y1="11" x2="11" y2="11" stroke={NAVY_DEEP} strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>Адмін панель</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Нові Історії · Рецензія</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={() => router.push('/admin/stories')} style={navBtn('#8899bb')}>📖 Серії</button>
            <button onClick={() => router.push('/admin/reviews')} style={navBtn(GOLD)}>⭐ Відгуки</button>
            <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }} style={navBtn('#556677')}>Вийти</button>
          </div>
        </div>

        {/* ━━━ 1 — Форма ━━━ */}
        <SectionCard n={1} title="Завантаження історії">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Ім'я автора">
              <input style={inputBase} value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Ім'я та прізвище" />
            </Field>
            <Field label="Жанр">
              <select style={selectStyle} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY }}>{g}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Назва історії">
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва твору" />
          </Field>
          <Field label="Текст історії" right={wordCount > 0 ? `${wordCount} слів · ~${readMin} хв` : undefined}>
            <textarea style={{ ...inputBase, height: 280, resize: 'vertical', lineHeight: 1.75 }} placeholder="Вставте або введіть повний текст..." value={text} onChange={e => setText(e.target.value)} />
          </Field>
          <Field label="Фото для обкладинки">
            <div onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()} style={{ border: `1.5px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: '22px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: imgSrc ? 10 : 0 }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>🖼</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', marginBottom: 3, fontFamily: FONT }}>Перетягніть фото або клікніть</div>
              <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>PNG · JPG · WEBP · Обличчя не будуть обрізані</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            </div>
            {imgSrc && (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="cover" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.5) 0%, transparent 50%)' }} />
                <button onClick={() => { setImgSrc(''); setPhotoB64('') }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            )}
          </Field>
          <button onClick={handleCheck} disabled={checkPhase === 'loading'} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: checkPhase === 'loading' ? 'rgba(240,165,0,0.45)' : 'linear-gradient(135deg,#f0a500,#e8920a)', color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '15px 18px', fontSize: 15, fontWeight: 800, cursor: checkPhase === 'loading' ? 'wait' : 'pointer', fontFamily: FONT, boxShadow: checkPhase === 'loading' ? 'none' : '0 2px 14px rgba(240,165,0,0.3)', transition: 'all 0.2s' }}>
            {checkPhase === 'loading' ? <><Spinner color={NAVY_DEEP} /> Claude аналізує…</> : <><StarIcon /> Перевірити через Claude AI</>}
          </button>
          {checkPhase === 'error' && <ErrorBox>{checkError}</ErrorBox>}
        </SectionCard>

        {/* ━━━ 2 — AI Report ━━━ */}
        {report && (
          <SectionCard n={2} title="Результат перевірки Claude AI">
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontFamily: FONT }}>Загальна оцінка</div>
              <RecommendationBadge text={report.overall.recommendation} />
              <p style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.7, margin: '16px 0 0', fontFamily: FONT, textAlign: 'left' }}>{report.overall.summary}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {([
                { label: 'Плагіат',      icon: '🔍', data: report.plagiarism,   inv: true  },
                { label: 'ШІ-детекція',  icon: '🤖', data: report.ai_detection, inv: false },
                { label: 'Жанр і стиль', icon: '📚', data: report.genre_match,  inv: false },
                { label: 'Граматика',    icon: '✏️', data: report.grammar,      inv: false },
              ] as const).map(({ label, icon, data, inv }) => {
                const s = inv ? 100 - data.score : data.score
                return (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>{icon} {label}</div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(s), fontFamily: FONT }}>{s}</span>
                    </div>
                    <VerdictBadge text={data.verdict} />
                    <ScoreBar score={s} color={scoreColor(s)} />
                    <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6, margin: '10px 0 0', fontFamily: FONT }}>{data.details}</p>
                  </div>
                )
              })}
            </div>
            {report.grammar.errors && report.grammar.errors.length > 0 && (
              <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(248,113,113,0.06)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>Знайдені помилки</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.grammar.errors.map((e, i) => <li key={i} style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.7, fontFamily: FONT }}>{e}</li>)}
                </ul>
              </div>
            )}
            {report.overall.suggestions && report.overall.suggestions.length > 0 && (
              <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(240,165,0,0.05)', border: '0.5px solid rgba(240,165,0,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>Рекомендації редактора</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.overall.suggestions.map((s, i) => <li key={i} style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.7, fontFamily: FONT }}>{s}</li>)}
                </ul>
              </div>
            )}
            <button onClick={handleCorrect} disabled={correctPhase === 'loading'} style={triggerBtn(VIOLET, correctPhase === 'loading')}>
              {correctPhase === 'loading' ? <><Spinner color={VIOLET} /> Claude редагує…</> : <>✍️ Отримати редакторську правку</>}
            </button>
            {correctPhase === 'error' && <ErrorBox>{correctError}</ErrorBox>}
          </SectionCard>
        )}

        {/* ━━━ 2.5 — Editorial Correction ━━━ */}
        {hasCorrected && (
          <SectionCard n="✍" title="Редакторська правка" accent={VIOLET}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: 'rgba(129,140,248,0.08)', border: '0.5px solid rgba(129,140,248,0.25)', borderRadius: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: VIOLET, fontFamily: FONT }}>{corrections.length}</span>
              <span style={{ fontSize: 13, color: '#c8d4e8', fontFamily: FONT }}>
                {correctEditMode ? 'правок' : 'правок · наведіть на підкреслений текст для деталей'}
              </span>
              {correctManuallyEdited && !correctEditMode && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 6, padding: '2px 8px', fontFamily: FONT, whiteSpace: 'nowrap' }}>✓ Відредаговано</span>
              )}
              {!correctEditMode && (
                <button
                  onClick={() => { setCorrectDraft(correctedText); setCorrectEditMode(true) }}
                  style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 700, color: VIOLET, background: `${VIOLET}18`, border: `1px solid ${VIOLET}44`, borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
                >✏️ Редагувати</button>
              )}
            </div>
            {correctEditMode ? (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { setCorrectedText(correctDraft); setCorrectManuallyEdited(true); setCorrectEditMode(false) }}
                    style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                  >✓ Зберегти зміни</button>
                  <button
                    onClick={() => setCorrectEditMode(false)}
                    style={{ fontSize: 12, fontWeight: 700, color: '#8899bb', background: 'rgba(136,153,187,0.1)', border: '1px solid rgba(136,153,187,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                  >✕ Скасувати</button>
                  <button
                    onClick={() => setCorrectDraft(claudeCorrectedText)}
                    style={{ fontSize: 12, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                  >↺ Скинути до варіанту Claude</button>
                </div>
                <textarea
                  value={correctDraft}
                  onChange={e => setCorrectDraft(e.target.value)}
                  style={{ ...inputBase, height: 320, resize: 'vertical', lineHeight: 1.8, marginBottom: 20 }}
                />
              </>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px', marginBottom: 20, lineHeight: 1.85, fontSize: 14, color: '#c8d4e8', fontFamily: FONT, whiteSpace: 'pre-wrap' }}>
                {segments.map((seg, i) => {
                  if (seg.type === 'text') return <span key={i}>{seg.content}</span>
                  return (
                    <span key={i} className="correction">
                      {seg.content}<span className="cnum">{seg.change.id}</span>
                      <span className="tip">
                        <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8899bb', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Правка #{seg.change.id}</span>
                        <span style={{ display: 'block', marginBottom: 4 }}><span style={{ color: '#8899bb', fontSize: 11 }}>було: </span><em style={{ color: '#f87171', fontSize: 12 }}>&ldquo;{seg.change.original}&rdquo;</em></span>
                        <span style={{ display: 'block', marginBottom: 6 }}><span style={{ color: '#8899bb', fontSize: 11 }}>стало: </span><em style={{ color: '#4ade80', fontSize: 12 }}>&ldquo;{seg.change.corrected}&rdquo;</em></span>
                        <span style={{ display: 'block', borderTop: '0.5px solid rgba(255,255,255,0.1)', paddingTop: 6, fontSize: 11, color: '#c8d4e8', lineHeight: 1.5 }}>{seg.change.reason}</span>
                      </span>
                    </span>
                  )
                })}
              </div>
            )}
            {!correctEditMode && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.06)', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Всі правки</div>
                {corrections.map((c, i) => (
                  <div key={c.id} style={{ padding: '12px 16px', borderBottom: i < corrections.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : 'none', display: 'grid', gridTemplateColumns: '22px 1fr', gap: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(129,140,248,0.2)', border: `1px solid rgba(129,140,248,0.4)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: VIOLET, flexShrink: 0, fontFamily: FONT }}>{c.id}</div>
                    <div>
                      <div style={{ fontSize: 13, marginBottom: 4, fontFamily: FONT }}>
                        <span style={{ color: '#f87171' }}>&ldquo;{c.original}&rdquo;</span>
                        <span style={{ color: '#445566', margin: '0 6px' }}>→</span>
                        <span style={{ color: '#4ade80' }}>&ldquo;{c.corrected}&rdquo;</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>{c.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ━━━ 2.7 — Humanize ━━━ */}
        {report && (
          <SectionCard n="✨" title="Природність стилю" accent={TEAL}>
            <p style={{ fontSize: 13, color: '#8899bb', lineHeight: 1.6, margin: '0 0 16px', fontFamily: FONT }}>
              Переписує текст так, щоб він звучав живіше — варіює речення, прибирає ШІ-патерни, додає природну нерівність. Працює з оригінальним текстом.
            </p>
            <button onClick={handleHumanize} disabled={humanizePhase === 'loading'} style={triggerBtn(TEAL, humanizePhase === 'loading')}>
              {humanizePhase === 'loading' ? <><Spinner color={TEAL} /> Claude переписує…</> : <>✨ Зробити стиль природнішим</>}
            </button>
            {humanizePhase === 'error' && <ErrorBox>{humanizeError}</ErrorBox>}

            {paraDiff && (
              <>
                {humanizeEditMode ? (
                  /* ── Edit mode ── */
                  <div style={{ marginTop: 20 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => { setHumanizedText(humanizeDraft); setHumanizeManuallyEdited(true); setHumanizeEditMode(false) }}
                        style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                      >✓ Зберегти зміни</button>
                      <button
                        onClick={() => setHumanizeEditMode(false)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#8899bb', background: 'rgba(136,153,187,0.1)', border: '1px solid rgba(136,153,187,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                      >✕ Скасувати</button>
                      <button
                        onClick={() => setHumanizeDraft(claudeHumanizedText)}
                        style={{ fontSize: 12, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: FONT }}
                      >↺ Скинути до варіанту Claude</button>
                    </div>
                    <textarea
                      value={humanizeDraft}
                      onChange={e => setHumanizeDraft(e.target.value)}
                      style={{ ...inputBase, height: 360, resize: 'vertical', lineHeight: 1.8 }}
                    />
                  </div>
                ) : (
                  /* ── Normal two-column diff ── */
                  <>
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, borderRadius: 12, overflow: 'hidden', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                      {/* Header */}
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>Оригінал</div>
                      <div style={{ background: `rgba(45,212,191,0.08)`, padding: '10px 14px', fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          Природніший варіант
                          {humanizeManuallyEdited && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 5, padding: '1px 6px', textTransform: 'none', letterSpacing: 0 }}>✓ Відредаговано</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setHumanizeDraft(humanizedText); setHumanizeEditMode(true) }}
                          style={{ fontSize: 11, fontWeight: 700, color: TEAL, background: `${TEAL}18`, border: `1px solid ${TEAL}44`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: FONT, flexShrink: 0 }}
                        >✏️ Ред.</button>
                      </div>
                      {/* Content */}
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 14px', fontSize: 13, lineHeight: 1.8, color: '#8899bb', fontFamily: FONT, borderRight: '0.5px solid rgba(255,255,255,0.06)', maxHeight: 420, overflowY: 'auto' }}>
                        {paraDiff.orig.map((line, i) => (
                          <div key={i} style={{ borderLeft: line.changed ? `3px solid ${GOLD}` : '3px solid transparent', paddingLeft: 8, marginBottom: line.text === '' ? 8 : 2, color: line.changed ? '#dde6f0' : '#8899bb', transition: 'all 0.2s', minHeight: line.text === '' ? 8 : 'auto' }}>
                            {line.text || ' '}
                          </div>
                        ))}
                      </div>
                      <div style={{ background: `rgba(45,212,191,0.04)`, padding: '16px 14px', fontSize: 13, lineHeight: 1.8, color: '#c8d4e8', fontFamily: FONT, maxHeight: 420, overflowY: 'auto' }}>
                        {paraDiff.hum.map((line, i) => (
                          <div key={i} style={{ borderLeft: line.changed ? `3px solid ${TEAL}` : '3px solid transparent', paddingLeft: 8, marginBottom: line.text === '' ? 8 : 2, color: line.changed ? '#f5f0e8' : '#c8d4e8', fontWeight: line.changed ? 500 : 400, transition: 'all 0.2s', minHeight: line.text === '' ? 8 : 'auto' }}>
                            {line.text || ' '}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8899bb', fontFamily: FONT }}>
                        <div style={{ width: 12, height: 12, borderLeft: `3px solid ${GOLD}`, flexShrink: 0 }} />
                        Змінено в оригіналі
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8899bb', fontFamily: FONT }}>
                        <div style={{ width: 12, height: 12, borderLeft: `3px solid ${TEAL}`, flexShrink: 0 }} />
                        Нова версія
                      </div>
                    </div>

                    {/* Changes summary */}
                    {humanizeSummary.length > 0 && (
                      <div style={{ marginTop: 16, padding: '14px 16px', background: `rgba(45,212,191,0.06)`, border: `0.5px solid rgba(45,212,191,0.2)`, borderRadius: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: TEAL, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>Що змінено і чому</div>
                        <ol style={{ margin: 0, paddingLeft: 20 }}>
                          {humanizeSummary.map((s, i) => (
                            <li key={i} style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.7, marginBottom: 6, fontFamily: FONT }}>{s}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </SectionCard>
        )}

        {/* ━━━ 3 — Рішення адміна ━━━ */}
        {report && actionPhase !== 'done' && (
          <SectionCard n={3} title="Рішення адміна">
            <Field label="Коментар для автора (необов'язково)">
              <textarea style={{ ...inputBase, height: 80, resize: 'vertical', lineHeight: 1.6 }} placeholder="Пояснення для автора..." value={adminNotes} onChange={e => setAdminNotes(e.target.value)} />
            </Field>
            {imgSrc && (
              <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 14, padding: '8px 12px', background: 'rgba(240,165,0,0.06)', borderRadius: 8, fontFamily: FONT }}>
                🎨 Після схвалення фото буде оброблено через Replicate (~60 с)
              </div>
            )}
            <PublishButtons />
            {actionPhase === 'loading' && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
                <Spinner color={GOLD} /> Зберігаємо…
              </div>
            )}
            {actionPhase === 'error' && <ErrorBox>{actionMsg}</ErrorBox>}
          </SectionCard>
        )}

        {/* Done */}
        {actionPhase === 'done' && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '32px 20px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{actionStatus === 'approved' ? '🎉' : actionStatus === 'rejected' ? '🚫' : '✏️'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f0e8', marginBottom: 8, fontFamily: FONT }}>{actionStatus === 'approved' ? 'Схвалено!' : actionStatus === 'rejected' ? 'Відхилено' : 'На доопрацювання'}</div>
            <div style={{ fontSize: 14, color: '#8899bb', lineHeight: 1.6, marginBottom: 24, fontFamily: FONT }}>{actionMsg}</div>
            <button onClick={handleReset} style={{ background: GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>+ Нова Історія</button>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .correction { border-bottom: 2px solid #f0a500; cursor: help; position: relative; display: inline; }
        .correction .tip { display: none; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); width: 270px; background: #0b1729; border: 1px solid rgba(240,165,0,0.45); border-radius: 11px; padding: 12px 14px; z-index: 1000; box-shadow: 0 10px 30px rgba(0,0,0,0.75); white-space: normal; pointer-events: none; font-style: normal; }
        .correction:hover .tip { display: block; }
        .cnum { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: #f0a500; color: #0a1628; font-size: 9px; font-weight: 800; vertical-align: super; margin-left: 1px; font-family: Montserrat, Arial, sans-serif; }
      `}</style>
    </div>
  )
}

// ── Small components ──────────────────────────────────────────────────────────

function Spinner({ color }: { color: string }) {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6, display: 'inline-block' }}><circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/></svg>
}

function StarIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ verticalAlign: 'middle', marginRight: 6 }}><path d="M9 2 L11 7 L16 7 L12 10.5 L13.5 15.5 L9 12.5 L4.5 15.5 L6 10.5 L2 7 L7 7 Z" fill="#0a1628"/></svg>
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: 10, fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: "'Montserrat', Arial, sans-serif" }}>{children}</div>
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function navBtn(color: string): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Montserrat', Arial, sans-serif", whiteSpace: 'nowrap' as const }
}

function triggerBtn(color: string, disabled: boolean): React.CSSProperties {
  return { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: disabled ? `${color}30` : `${color}18`, color, border: `1.5px solid ${color}55`, borderRadius: 12, padding: '13px 18px', fontSize: 14, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer', fontFamily: "'Montserrat', Arial, sans-serif", transition: 'all 0.2s' }
}

function actionBtn(color: string, bg: string, border: string, disabled: boolean): React.CSSProperties {
  return { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4, padding: '14px 10px', borderRadius: 12, border: `1.5px solid ${border}`, background: bg, color, fontFamily: "'Montserrat', Arial, sans-serif", fontSize: 12, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer', transition: 'all 0.15s', opacity: disabled ? 0.6 : 1 }
}
