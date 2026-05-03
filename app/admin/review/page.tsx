'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FONT      = "'Montserrat', Arial, sans-serif"
const GOLD      = '#f0a500'
const NAVY      = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

const inputBase: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
  padding: '10px 13px', color: '#f5f0e8', fontSize: 14,
  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
}

interface ReviewScore {
  key: string
  label: string
  score: number
  comment: string
}

interface ReviewReport {
  overall: number
  scores: ReviewScore[]
  problems: string[]
  recommendations: string[]
}

function scoreColor(s: number): string {
  if (s >= 8) return '#4ade80'
  if (s >= 5) return GOLD
  return '#f87171'
}

function scoreBg(s: number): string {
  if (s >= 8) return 'rgba(74,222,128,0.08)'
  if (s >= 5) return 'rgba(240,165,0,0.08)'
  return 'rgba(248,113,113,0.08)'
}

function scoreBorder(s: number): string {
  if (s >= 8) return 'rgba(74,222,128,0.2)'
  if (s >= 5) return 'rgba(240,165,0,0.2)'
  return 'rgba(248,113,113,0.2)'
}

const SCORE_ICONS: Record<string, string> = {
  grammar:    '✍️',
  style:      '🎭',
  characters: '👥',
  emotion:    '💚',
  uniqueness: '✨',
}

export default function ReviewPage() {
  const router = useRouter()
  const [text,         setText]         = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError,   setReviewError]   = useState('')
  const [report,        setReport]        = useState<ReviewReport | null>(null)
  const [ttsLoading,    setTtsLoading]    = useState(false)
  const [ttsError,      setTtsError]      = useState('')
  const [cleanedText,   setCleanedText]   = useState('')
  const [replaced,      setReplaced]      = useState(false)

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const runReview = async () => {
    setReviewLoading(true); setReviewError(''); setReport(null)
    try {
      const res = await fetch('/api/admin/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as ReviewReport & { error?: string }
      if (!res.ok || data.error) { setReviewError(data.error ?? 'Помилка аналізу'); return }
      setReport(data)
    } catch {
      setReviewError("Помилка з'єднання з API")
    } finally {
      setReviewLoading(false)
    }
  }

  const runTts = async () => {
    setTtsLoading(true); setTtsError(''); setCleanedText(''); setReplaced(false)
    try {
      const res = await fetch('/api/admin/clean-for-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as { cleanedText?: string; error?: string }
      if (!res.ok || data.error) { setTtsError(data.error ?? 'Помилка очищення'); return }
      setCleanedText(data.cleanedText ?? '')
    } catch {
      setTtsError("Помилка з'єднання з API")
    } finally {
      setTtsLoading(false)
    }
  }

  const applyClean = () => {
    setText(cleanedText)
    setCleanedText('')
    setReport(null)
    setReplaced(true)
    setTimeout(() => setReplaced(false), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h10M3 15h7" stroke={NAVY_DEEP} strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx="16" cy="14" r="3" stroke={NAVY_DEEP} strokeWidth="1.5"/>
              <path d="M18.5 16.5l1.5 1.5" stroke={NAVY_DEEP} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2, fontFamily: FONT }}>Адмін панель</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT }}>Редактор серіалу</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => router.push('/admin/stories')}
              style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              ← Редактор
            </button>
            <button
              onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }}
              style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              Вийти
            </button>
          </div>
        </div>

        {/* Text input */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>Текст серії</span>
            {wordCount > 0 && <span style={{ fontSize: 11, color: GOLD, fontFamily: FONT }}>{wordCount} слів</span>}
          </div>
          <textarea
            style={{ ...inputBase, height: 280, resize: 'vertical', lineHeight: 1.75 }}
            placeholder="Вставте текст серії для перевірки…"
            value={text}
            onChange={e => { setText(e.target.value); setReport(null); setCleanedText('') }}
          />
          {replaced && (
            <div style={{ fontSize: 12, color: '#4ade80', marginTop: 8, fontFamily: FONT }}>✓ Текст замінено на очищений</div>
          )}

          {/* Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <button
              onClick={runReview}
              disabled={reviewLoading || !text.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: reviewLoading ? 'rgba(99,102,241,0.45)' : !text.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: !text.trim() ? '#445566' : '#fff',
                border: 'none', borderRadius: 12, padding: '14px 16px',
                fontSize: 14, fontWeight: 700, fontFamily: FONT,
                cursor: reviewLoading ? 'wait' : !text.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !text.trim() || reviewLoading ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {reviewLoading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                  </svg>
                  Перевіряю…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="1.6"/>
                    <path d="M11 11l3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>
                  </svg>
                  Перевірити серію (AI)
                </>
              )}
            </button>

            <button
              onClick={runTts}
              disabled={ttsLoading || !text.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: ttsLoading ? 'rgba(16,185,129,0.4)' : !text.trim() ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: !text.trim() ? '#445566' : '#fff',
                border: 'none', borderRadius: 12, padding: '14px 16px',
                fontSize: 14, fontWeight: 700, fontFamily: FONT,
                cursor: ttsLoading ? 'wait' : !text.trim() ? 'not-allowed' : 'pointer',
                boxShadow: !text.trim() || ttsLoading ? 'none' : '0 2px 12px rgba(16,185,129,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {ttsLoading ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                  </svg>
                  Очищую…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8 Q8 3 13 8 Q8 13 3 8Z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
                    <circle cx="8" cy="8" r="2" fill="#fff"/>
                  </svg>
                  Підготувати до озвучки (AI)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Review errors */}
        {reviewError && (
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
            {reviewError}
          </div>
        )}

        {/* Review report */}
        {report && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>

            {/* Overall */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '0.5px solid rgba(255,255,255,0.08)' }}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 42, fontWeight: 800, color: scoreColor(report.overall), fontFamily: FONT, lineHeight: 1 }}>{report.overall}</div>
                <div style={{ fontSize: 11, color: '#445566', fontFamily: FONT }}>/10</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f5f0e8', fontFamily: FONT, marginBottom: 2 }}>Загальна оцінка серії</div>
                <div style={{ fontSize: 12, color: '#8899bb', fontFamily: FONT }}>
                  {report.overall >= 8 ? 'Відмінна робота — серія готова до публікації' :
                   report.overall >= 6 ? 'Добре — є деякі моменти для покращення' :
                   'Потребує доопрацювання перед публікацією'}
                </div>
              </div>
            </div>

            {/* Score cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
              {report.scores.map(s => (
                <div key={s.key} style={{ background: scoreBg(s.score), border: `1px solid ${scoreBorder(s.score)}`, borderRadius: 12, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: scoreColor(s.score), letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: FONT }}>
                      {SCORE_ICONS[s.key]} {s.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: scoreColor(s.score), fontFamily: FONT, lineHeight: 1, flexShrink: 0, marginLeft: 8 }}>
                      {s.score}<span style={{ fontSize: 11, fontWeight: 400, color: '#445566' }}>/10</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>{s.comment}</div>
                </div>
              ))}
            </div>

            {/* Problems */}
            {report.problems.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>⚠️ Виявлені проблеми</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {report.problems.map((p, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                      <span style={{ color: '#f87171', fontWeight: 700, flexShrink: 0 }}>·</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>💡 Рекомендації</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {report.recommendations.map((r, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                      <span style={{ color: '#818cf8', fontWeight: 700, flexShrink: 0 }}>·</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TTS errors */}
        {ttsError && (
          <div style={{ fontSize: 13, color: '#f87171', marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
            {ttsError}
          </div>
        )}

        {/* TTS cleaned result */}
        {cleanedText && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', border: '1px solid rgba(16,185,129,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 2 }}>🎙️ Текст для озвучки</div>
                <div style={{ fontSize: 11, color: '#8899bb', fontFamily: FONT }}>Очищено від ремарок та stage directions</div>
              </div>
              <button
                onClick={applyClean}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none', borderRadius: 10, padding: '8px 16px',
                  cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                }}
              >
                ↑ Замінити текст серії
              </button>
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px 16px',
              fontSize: 13, color: '#c8d4e8', lineHeight: 1.8, fontFamily: FONT,
              whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto',
            }}>
              {cleanedText}
            </div>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
