'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const GENRES = ['оповідання', 'гумор', 'драма', 'казка', 'пригода', 'історична проза']

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

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

function SectionCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20, background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: NAVY_DEEP, flexShrink: 0, fontFamily: FONT }}>{n}</div>
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

function verdictColor(verdict: string): string {
  const v = verdict.toLowerCase()
  if (v.includes('відповідає') && !v.includes('не') && !v.includes('частково')) return '#4ade80'
  if (v.includes('унікальний') || v.includes('людиною') || v.includes('без помилок')) return '#4ade80'
  if (v.includes('частково') || v.includes('можливо') || v.includes('незначні')) return '#fbbf24'
  return '#f87171'
}

function scoreColor(score: number): string {
  if (score >= 75) return '#4ade80'
  if (score >= 50) return '#fbbf24'
  return '#f87171'
}

function VerdictBadge({ text }: { text: string }) {
  const color = verdictColor(text)
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 6, padding: '2px 8px', fontFamily: FONT, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  )
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

interface AIReport {
  plagiarism:   { score: number; verdict: string; details: string }
  ai_detection: { score: number; verdict: string; details: string }
  genre_match:  { score: number; verdict: string; details: string }
  grammar:      { score: number; verdict: string; details: string; errors?: string[] }
  overall:      { recommendation: string; summary: string; suggestions?: string[] }
}

type CheckPhase  = 'idle' | 'loading' | 'done' | 'error'
type ActionPhase = 'idle' | 'loading' | 'done' | 'error'

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Stories1Page() {
  const router = useRouter()

  // Form fields
  const [authorName, setAuthorName] = useState('')
  const [title,      setTitle]      = useState('')
  const [genre,      setGenre]      = useState(GENRES[0])
  const [text,       setText]       = useState('')

  // Photo
  const [imgSrc,     setImgSrc]     = useState('')
  const [photoB64,   setPhotoB64]   = useState('')
  const [dragOver,   setDragOver]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // AI check
  const [checkPhase, setCheckPhase] = useState<CheckPhase>('idle')
  const [checkError, setCheckError] = useState('')
  const [report,     setReport]     = useState<AIReport | null>(null)

  // Admin decision
  const [adminNotes,   setAdminNotes]   = useState('')
  const [actionPhase,  setActionPhase]  = useState<ActionPhase>('idle')
  const [actionMsg,    setActionMsg]    = useState('')
  const [actionStatus, setActionStatus] = useState<'approved' | 'rejected' | 'revision' | ''>('')

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0
  const readMin   = Math.ceil(wordCount / 180) || 0

  // ── Photo ─────────────────────────────────────────────────────────────────

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = ev.target?.result as string
      setImgSrc(result)
      setPhotoB64(result)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }, [loadFile])

  // ── AI Check ─────────────────────────────────────────────────────────────

  const handleCheck = async () => {
    if (!title || !genre || !text) {
      setCheckError('Заповніть назву, жанр та текст'); setCheckPhase('error'); return
    }
    setCheckPhase('loading'); setCheckError(''); setReport(null)
    try {
      const res = await fetch('/api/admin/stories1/check', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ authorName, title, genre, text }),
      })
      const data = await res.json() as { report?: AIReport; error?: string }
      if (!res.ok || data.error) { setCheckError(data.error ?? 'Помилка перевірки'); setCheckPhase('error'); return }
      setReport(data.report ?? null)
      setCheckPhase('done')
    } catch {
      setCheckError("Помилка з'єднання з API"); setCheckPhase('error')
    }
  }

  // ── Approve / Reject / Revision ──────────────────────────────────────────

  const handleAction = async (action: 'approve' | 'reject' | 'revision') => {
    setActionPhase('loading'); setActionMsg('')
    try {
      const res = await fetch('/api/admin/stories1/approve', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ authorName, title, genre, text, photoBase64: photoB64, aiReport: report, action, adminNotes }),
      })
      const data = await res.json() as { message?: string; error?: string; status?: string; coverGenerating?: boolean }
      if (!res.ok || data.error) { setActionMsg(data.error ?? 'Помилка'); setActionPhase('error'); return }
      setActionMsg(data.message ?? 'Готово')
      setActionStatus(data.status as typeof actionStatus)
      setActionPhase('done')
      if (data.coverGenerating) {
        setActionMsg((data.message ?? '') + ' Обкладинка генерується у фоні (~60 с).')
      }
    } catch {
      setActionMsg("Помилка з'єднання"); setActionPhase('error')
    }
  }

  const selectStyle: React.CSSProperties = { ...inputBase, appearance: 'none', cursor: 'pointer' }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── Header ── */}
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

        {/* ━━━ SECTION 1 — Завантаження ━━━ */}
        <SectionCard n={1} title="Завантаження історії">

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Ім'я автора">
              <input style={inputBase} value={authorName} onChange={e => setAuthorName(e.target.value)} placeholder="Ім'я та прізвище автора" />
            </Field>
            <Field label="Жанр">
              <select style={selectStyle} value={genre} onChange={e => setGenre(e.target.value)}>
                {GENRES.map(g => <option key={g} value={g} style={{ background: NAVY, textTransform: 'capitalize' }}>{g}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Назва історії">
            <input style={inputBase} value={title} onChange={e => setTitle(e.target.value)} placeholder="Назва твору" />
          </Field>

          <Field label="Текст історії" right={wordCount > 0 ? `${wordCount} слів · ~${readMin} хв` : undefined}>
            <textarea
              style={{ ...inputBase, height: 280, resize: 'vertical', lineHeight: 1.75 }}
              placeholder="Вставте або введіть повний текст історії..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </Field>

          {/* Photo upload */}
          <Field label="Фото для обкладинки">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{ border: `1.5px dashed ${dragOver ? GOLD : 'rgba(255,255,255,0.15)'}`, borderRadius: 12, padding: '22px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(240,165,0,0.06)' : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', marginBottom: imgSrc ? 10 : 0 }}
            >
              <div style={{ fontSize: 26, marginBottom: 6 }}>🖼</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f0e8', marginBottom: 3, fontFamily: FONT }}>Перетягніть фото або клікніть</div>
              <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>PNG · JPG · WEBP · Обличчя не будуть обрізані</div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
            </div>

            {imgSrc && (
              <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt="cover preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.5) 0%, transparent 50%)' }} />
                <button onClick={() => { setImgSrc(''); setPhotoB64('') }} style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            )}
          </Field>

          {/* Check button */}
          <button
            onClick={handleCheck}
            disabled={checkPhase === 'loading'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: checkPhase === 'loading' ? 'rgba(240,165,0,0.45)' : 'linear-gradient(135deg, #f0a500 0%, #e8920a 100%)',
              color: NAVY_DEEP, border: 'none', borderRadius: 12,
              padding: '15px 18px', fontSize: 15, fontWeight: 800,
              cursor: checkPhase === 'loading' ? 'wait' : 'pointer',
              fontFamily: FONT, boxShadow: checkPhase === 'loading' ? 'none' : '0 2px 14px rgba(240,165,0,0.3)',
              transition: 'all 0.2s', letterSpacing: 0.3,
            }}
          >
            {checkPhase === 'loading' ? (
              <><svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="9" cy="9" r="7" stroke={NAVY_DEEP} strokeWidth="2.5" strokeDasharray="22 20" strokeLinecap="round"/></svg> Claude аналізує…</>
            ) : (
              <><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2 L11 7 L16 7 L12 10.5 L13.5 15.5 L9 12.5 L4.5 15.5 L6 10.5 L2 7 L7 7 Z" fill={NAVY_DEEP}/></svg> Перевірити через Claude AI</>
            )}
          </button>

          {checkPhase === 'error' && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
              {checkError}
            </div>
          )}
        </SectionCard>

        {/* ━━━ SECTION 2 — AI Report (shown after check) ━━━ */}
        {report && (
          <SectionCard n={2} title="Результат перевірки Claude AI">

            {/* Overall recommendation */}
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, fontFamily: FONT }}>Загальна оцінка</div>
              <RecommendationBadge text={report.overall.recommendation} />
              <p style={{ fontSize: 14, color: '#c8d4e8', lineHeight: 1.7, margin: '16px 0 0', fontFamily: FONT, textAlign: 'left' }}>
                {report.overall.summary}
              </p>
            </div>

            {/* 4 analysis cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Плагіат',       icon: '🔍', data: report.plagiarism,   invertScore: true },
                { label: 'ШІ-детекція',   icon: '🤖', data: report.ai_detection, invertScore: false },
                { label: 'Жанр і стиль',  icon: '📚', data: report.genre_match,  invertScore: false },
                { label: 'Граматика',     icon: '✏️', data: report.grammar,      invertScore: false },
              ].map(({ label, icon, data, invertScore }) => {
                const displayScore = invertScore ? (100 - data.score) : data.score
                return (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>{icon} {label}</div>
                      <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(displayScore), fontFamily: FONT }}>{displayScore}</span>
                    </div>
                    <VerdictBadge text={data.verdict} />
                    <ScoreBar score={displayScore} color={scoreColor(displayScore)} />
                    <p style={{ fontSize: 12, color: '#8899bb', lineHeight: 1.6, margin: '10px 0 0', fontFamily: FONT }}>{data.details}</p>
                  </div>
                )
              })}
            </div>

            {/* Grammar errors */}
            {report.grammar.errors && report.grammar.errors.length > 0 && (
              <div style={{ marginBottom: 16, padding: '14px 16px', background: 'rgba(248,113,113,0.06)', border: '0.5px solid rgba(248,113,113,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>Знайдені помилки</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.grammar.errors.map((err, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.7, fontFamily: FONT }}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {report.overall.suggestions && report.overall.suggestions.length > 0 && (
              <div style={{ padding: '14px 16px', background: 'rgba(240,165,0,0.05)', border: '0.5px solid rgba(240,165,0,0.2)', borderRadius: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontFamily: FONT }}>Рекомендації редактора</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {report.overall.suggestions.map((s, i) => (
                    <li key={i} style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.7, fontFamily: FONT }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        )}

        {/* ━━━ SECTION 3 — Admin Decision ━━━ */}
        {report && actionPhase !== 'done' && (
          <SectionCard n={3} title="Рішення адміна">

            <Field label="Коментар для автора (необов'язково)">
              <textarea
                style={{ ...inputBase, height: 80, resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Пояснення причин відхилення або побажання для доопрацювання..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
              />
            </Field>

            {imgSrc && (
              <div style={{ fontSize: 12, color: '#8899bb', marginBottom: 14, padding: '8px 12px', background: 'rgba(240,165,0,0.06)', borderRadius: 8, fontFamily: FONT }}>
                🎨 Після схвалення фото обкладинки буде оброблено через Replicate (~60 с)
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {/* Approve */}
              <button
                onClick={() => handleAction('approve')}
                disabled={actionPhase === 'loading'}
                style={actionBtn('#4ade80', 'rgba(74,222,128,0.12)', 'rgba(74,222,128,0.35)', actionPhase === 'loading')}
              >
                <span style={{ fontSize: 18 }}>✓</span>
                <span>Схвалити</span>
              </button>

              {/* Revision */}
              <button
                onClick={() => handleAction('revision')}
                disabled={actionPhase === 'loading'}
                style={actionBtn('#fbbf24', 'rgba(251,191,36,0.1)', 'rgba(251,191,36,0.3)', actionPhase === 'loading')}
              >
                <span style={{ fontSize: 18 }}>⟳</span>
                <span>Доопрацювання</span>
              </button>

              {/* Reject */}
              <button
                onClick={() => handleAction('reject')}
                disabled={actionPhase === 'loading'}
                style={actionBtn('#f87171', 'rgba(248,113,113,0.1)', 'rgba(248,113,113,0.3)', actionPhase === 'loading')}
              >
                <span style={{ fontSize: 18 }}>✕</span>
                <span>Відхилити</span>
              </button>
            </div>

            {actionPhase === 'loading' && (
              <div style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#8899bb', fontFamily: FONT }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }}><circle cx="8" cy="8" r="6" stroke={GOLD} strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/></svg>
                Зберігаємо…
              </div>
            )}

            {actionPhase === 'error' && (
              <div style={{ marginTop: 12, fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
                {actionMsg}
              </div>
            )}
          </SectionCard>
        )}

        {/* ━━━ Done state ━━━ */}
        {actionPhase === 'done' && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '32px 20px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {actionStatus === 'approved' ? '🎉' : actionStatus === 'rejected' ? '🚫' : '✏️'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#f5f0e8', marginBottom: 8, fontFamily: FONT }}>
              {actionStatus === 'approved' ? 'Схвалено!' : actionStatus === 'rejected' ? 'Відхилено' : 'На доопрацювання'}
            </div>
            <div style={{ fontSize: 14, color: '#8899bb', lineHeight: 1.6, marginBottom: 24, fontFamily: FONT }}>{actionMsg}</div>
            <button
              onClick={() => {
                setAuthorName(''); setTitle(''); setGenre(GENRES[0]); setText('')
                setImgSrc(''); setPhotoB64(''); setReport(null)
                setCheckPhase('idle'); setActionPhase('idle')
                setActionMsg(''); setActionStatus(''); setAdminNotes('')
              }}
              style={{ background: GOLD, color: NAVY_DEEP, border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
            >
              + Нова Історія
            </button>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────

function navBtn(color: string): React.CSSProperties {
  return { fontSize: 12, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Montserrat', Arial, sans-serif", whiteSpace: 'nowrap' as const }
}

function actionBtn(color: string, bg: string, border: string, disabled: boolean): React.CSSProperties {
  return {
    display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
    padding: '14px 10px', borderRadius: 12, border: `1.5px solid ${border}`,
    background: bg, color, fontFamily: "'Montserrat', Arial, sans-serif",
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer',
    transition: 'all 0.15s', opacity: disabled ? 0.6 : 1,
  }
}
