'use client'

import { useState } from 'react'

const FONT     = "'Montserrat', Arial, sans-serif"
const GOLD     = '#f0a500'
const NAVY     = '#0f1e3a'

interface AnalysisResult {
  rating: number
  emotion: string
  complexity: string
  recommendedAge: string
  tags: string[]
  teaser: string
  improvements: string[]
}

interface Props {
  title?: string
  text: string
  onApplyTeaser: (teaser: string) => void
  onApplyImprovedText: (text: string) => void
}

export default function GeminiAnalyzer({ text, onApplyTeaser, onApplyImprovedText }: Props) {
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [analysis,        setAnalysis]        = useState<AnalysisResult | null>(null)
  const [improveLoading,  setImproveLoading]  = useState(false)
  const [improveError,    setImproveError]    = useState('')

  const improve = async () => {
    if (!analysis) return
    setImproveLoading(true); setImproveError('')
    try {
      const res = await fetch('/api/admin/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, recommendations: analysis.improvements }),
      })
      const data = await res.json() as { improvedText?: string; error?: string }
      if (!res.ok || data.error) { setImproveError(data.error ?? 'Помилка покращення'); return }
      onApplyImprovedText(data.improvedText ?? '')
    } catch {
      setImproveError("Помилка з'єднання з API")
    } finally {
      setImproveLoading(false)
    }
  }

  const analyze = async () => {
    setLoading(true); setError(''); setAnalysis(null)
    try {
      const res = await fetch('/api/admin/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json() as AnalysisResult & { error?: string }
      if (!res.ok || data.error) { setError(data.error ?? 'Помилка аналізу'); return }
      setAnalysis(data)
    } catch {
      setError("Помилка з'єднання з API")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 12 }}>
        ШІ Аналіз
      </div>

      <button
        onClick={analyze}
        disabled={loading || !text.trim()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          background: loading
            ? 'rgba(99,102,241,0.45)'
            : !text.trim()
              ? 'rgba(255,255,255,0.05)'
              : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: !text.trim() ? '#445566' : '#fff',
          border: 'none', borderRadius: 12,
          padding: '14px 18px', fontSize: 14, fontWeight: 700,
          cursor: loading ? 'wait' : !text.trim() ? 'not-allowed' : 'pointer',
          fontFamily: FONT, marginBottom: 14,
          boxShadow: !text.trim() || loading ? 'none' : '0 2px 12px rgba(99,102,241,0.3)',
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
            </svg>
            Аналізую…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="#fff" strokeWidth="1.4"/>
              <path d="M5.5 8.5l2 2 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Проаналізувати текст (Gemini AI)
          </>
        )}
      </button>

      {error && (
        <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
          {error}
        </div>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* 4 метрики */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>📊 Оцінка</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: FONT, lineHeight: 1 }}>{analysis.rating}</span>
                <span style={{ fontSize: 13, color: '#8899bb', fontFamily: FONT }}>/10</span>
              </div>
            </div>

            <div style={{ background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fb923c', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>💚 Емоційність</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT, textTransform: 'capitalize' }}>{analysis.emotion}</div>
            </div>

            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>📖 Складність</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT, textTransform: 'capitalize' }}>{analysis.complexity}</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#fbbf24', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 6 }}>👤 Вік аудиторії</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: FONT }}>{analysis.recommendedAge}</div>
            </div>
          </div>

          {/* Теги */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8899bb', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>🏷️ Авто-теги</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {analysis.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 20, padding: '4px 12px', fontFamily: FONT }}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Тизер */}
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT }}>💬 Пропонований тизер</div>
              <button
                onClick={() => onApplyTeaser(analysis.teaser)}
                style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap' }}
              >
                Застосувати тизер
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#c8d4e8', lineHeight: 1.65, margin: 0, fontFamily: FONT }}>{analysis.teaser}</p>
          </div>

          {/* Рекомендації */}
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT, marginBottom: 8 }}>💡 Рекомендації по покращенню</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analysis.improvements.map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#c8d4e8', lineHeight: 1.5, fontFamily: FONT }}>
                  <span style={{ color: '#f87171', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Кнопка покращення */}
          {improveError && (
            <div style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', background: 'rgba(239,68,68,0.09)', borderRadius: 10, fontFamily: FONT }}>
              {improveError}
            </div>
          )}
          <button
            onClick={improve}
            disabled={improveLoading}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              background: improveLoading
                ? 'rgba(16,185,129,0.4)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px 18px', fontSize: 14, fontWeight: 700,
              cursor: improveLoading ? 'wait' : 'pointer',
              fontFamily: FONT,
              boxShadow: improveLoading ? 'none' : '0 2px 12px rgba(16,185,129,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {improveLoading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="2" strokeDasharray="20 18" strokeLinecap="round"/>
                </svg>
                Покращую…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5Z" fill="#fff" opacity="0.9"/>
                </svg>
                Покращити текст (AI)
              </>
            )}
          </button>

        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// keep navy in scope to avoid lint warning
void NAVY
