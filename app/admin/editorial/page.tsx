'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface Assignment {
  id: number
  editorName: string
  editorEmail: string
  token: string
  responseAction: string | null
  revisedText: string | null
  comment: string | null
  respondedAt: string | null
}

interface Submission {
  id: number
  filename: string
  status: string
  submitted_at: string
  updated_at: string
  assignments: Assignment[] | null
}

interface SubmissionsResponse {
  submissions?: Submission[]
  error?: string
}

interface DecideResponse {
  ok?: boolean
  error?: string
}

interface RemindResponse {
  ok?: boolean
  error?: string
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string; bg: string }> = {
    in_review: { label: '🔄 На перевірці', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    approved: { label: '✅ Погоджено', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
    has_revisions: { label: '✏️ Є правки', color: '#fb923c', bg: 'rgba(251,146,60,0.1)' },
  }
  const cfg = configs[status] ?? { label: status, color: '#8899bb', bg: 'rgba(136,153,187,0.1)' }
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      color: cfg.color,
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6,
      padding: '3px 9px',
      fontFamily: FONT,
    }}>
      {cfg.label}
    </span>
  )
}

function wordCount(text: string | null) {
  if (!text) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function EditorialPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRevisions, setExpandedRevisions] = useState<Set<number>>(new Set())
  const [actionLoading, setActionLoading] = useState<Set<number>>(new Set())

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/editorial')
      const data = await res.json() as SubmissionsResponse
      if (data.submissions) setSubmissions(data.submissions)
    } catch {
      // swallow
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSubmissions()
    const interval = setInterval(loadSubmissions, 30000)
    return () => clearInterval(interval)
  }, [loadSubmissions])

  async function remind(assignmentId: number) {
    setActionLoading(prev => new Set([...prev, assignmentId]))
    try {
      const res = await fetch('/api/admin/editorial/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      const data = await res.json() as RemindResponse
      if (!data.ok) {
        alert(data.error ?? 'Помилка надсилання нагадування')
      }
    } catch {
      alert("Помилка з'єднання")
    } finally {
      setActionLoading(prev => { const s = new Set(prev); s.delete(assignmentId); return s })
    }
  }

  async function decide(assignmentId: number, action: 'accept' | 'reject') {
    setActionLoading(prev => new Set([...prev, assignmentId]))
    try {
      const res = await fetch('/api/admin/editorial/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentId, action }),
      })
      const data = await res.json() as DecideResponse
      if (data.ok) {
        await loadSubmissions()
      } else {
        alert(data.error ?? 'Помилка')
      }
    } catch {
      alert("Помилка з'єднання")
    } finally {
      setActionLoading(prev => { const s = new Set(prev); s.delete(assignmentId); return s })
    }
  }

  function toggleRevision(assignmentId: number) {
    setExpandedRevisions(prev => {
      const s = new Set(prev)
      if (s.has(assignmentId)) s.delete(assignmentId)
      else s.add(assignmentId)
      return s
    })
  }

  const grouped = {
    in_review: submissions.filter(s => s.status === 'in_review'),
    has_revisions: submissions.filter(s => s.status === 'has_revisions'),
    approved: submissions.filter(s => s.status === 'approved'),
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingBottom: 20, borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="14" rx="2" stroke="#0a1628" strokeWidth="1.6"/>
              <path d="M5 7h10M5 10h7M5 13h5" stroke="#0a1628" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: GOLD, textTransform: 'uppercase', marginBottom: 2 }}>Адмін панель</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8' }}>Редакційні погодження</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => router.push('/admin/editors')}
              style={{ fontSize: 12, fontWeight: 600, color: '#c8d4e8', background: 'rgba(200,212,232,0.07)', border: '1px solid rgba(200,212,232,0.2)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              ← Редактори
            </button>
            <button
              onClick={() => router.push('/admin/batch-review')}
              style={{ fontSize: 12, fontWeight: 600, color: GOLD, background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              ← Пакетна перевірка
            </button>
            <button
              onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login') }}
              style={{ fontSize: 12, fontWeight: 600, color: '#8899bb', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontFamily: FONT }}
            >
              Вийти
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', fontSize: 14, color: '#445566' }}>
            Завантажуємо…
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div style={{ background: NAVY, borderRadius: 16, padding: '32px', textAlign: 'center', border: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, color: '#8899bb' }}>Немає поданих серій на погодження.</div>
            <div style={{ fontSize: 12, color: '#445566', marginTop: 8 }}>Надсилайте серії зі сторінки пакетної перевірки.</div>
          </div>
        )}

        {/* Sections */}
        {(['has_revisions', 'in_review', 'approved'] as const).map(sectionKey => {
          const items = grouped[sectionKey]
          if (items.length === 0) return null
          const sectionLabels: Record<string, string> = {
            in_review: '🔄 На перевірці',
            has_revisions: '✏️ Є правки',
            approved: '✅ Погоджено',
          }
          return (
            <div key={sectionKey} style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, fontFamily: FONT }}>
                {sectionLabels[sectionKey]} ({items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(sub => {
                  const assignments = sub.assignments?.filter(a => a.id !== null) ?? []
                  return (
                    <div key={sub.id} style={{ background: '#081420', borderRadius: 14, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                      {/* Submission header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: assignments.length > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sub.filename}
                          </div>
                          <div style={{ fontSize: 11, color: '#445566', marginTop: 2 }}>
                            Подано: {new Date(sub.submitted_at).toLocaleString('uk-UA')} · {wordCount(sub.assignments?.[0] ? null : null)} слів
                          </div>
                        </div>
                        <StatusBadge status={sub.status} />
                      </div>

                      {/* Assignments */}
                      {assignments.length > 0 && (
                        <div style={{ padding: '8px 16px 12px' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#445566', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, fontFamily: FONT }}>
                            Редактори:
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {assignments.map(a => (
                              <div key={a.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c8d4e8' }}>{a.editorName}</span>
                                    <span style={{ fontSize: 11, color: '#445566', marginLeft: 8 }}>{a.editorEmail}</span>
                                  </div>

                                  {a.responseAction === null && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 11, color: '#8899bb' }}>⏳ Очікує</span>
                                      <button
                                        onClick={() => remind(a.id)}
                                        disabled={actionLoading.has(a.id)}
                                        style={{
                                          fontSize: 11, fontWeight: 600,
                                          color: '#fbbf24',
                                          background: 'rgba(251,191,36,0.1)',
                                          border: '1px solid rgba(251,191,36,0.25)',
                                          borderRadius: 6, padding: '4px 10px',
                                          cursor: actionLoading.has(a.id) ? 'wait' : 'pointer',
                                          fontFamily: FONT,
                                        }}
                                      >
                                        {actionLoading.has(a.id) ? '⏳' : '🔔 Нагадати'}
                                      </button>
                                    </div>
                                  )}

                                  {a.responseAction === 'approve' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✅ Погоджено</span>
                                      {a.respondedAt && (
                                        <span style={{ fontSize: 10, color: '#445566' }}>
                                          {new Date(a.respondedAt).toLocaleString('uk-UA')}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {a.responseAction === 'revise' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <button
                                        onClick={() => toggleRevision(a.id)}
                                        style={{
                                          fontSize: 11, fontWeight: 600,
                                          color: '#fb923c',
                                          background: 'rgba(251,146,60,0.1)',
                                          border: '1px solid rgba(251,146,60,0.25)',
                                          borderRadius: 6, padding: '4px 10px',
                                          cursor: 'pointer',
                                          fontFamily: FONT,
                                        }}
                                      >
                                        ✏️ Є правки {expandedRevisions.has(a.id) ? '▲' : '▼'}
                                      </button>
                                      <button
                                        onClick={() => decide(a.id, 'accept')}
                                        disabled={actionLoading.has(a.id)}
                                        style={{
                                          fontSize: 11, fontWeight: 600,
                                          color: '#4ade80',
                                          background: 'rgba(74,222,128,0.1)',
                                          border: '1px solid rgba(74,222,128,0.25)',
                                          borderRadius: 6, padding: '4px 10px',
                                          cursor: actionLoading.has(a.id) ? 'wait' : 'pointer',
                                          fontFamily: FONT,
                                        }}
                                      >
                                        {actionLoading.has(a.id) ? '⏳' : 'Прийняти правки'}
                                      </button>
                                      <button
                                        onClick={() => decide(a.id, 'reject')}
                                        disabled={actionLoading.has(a.id)}
                                        style={{
                                          fontSize: 11, fontWeight: 600,
                                          color: '#f87171',
                                          background: 'rgba(248,113,113,0.1)',
                                          border: '1px solid rgba(248,113,113,0.25)',
                                          borderRadius: 6, padding: '4px 10px',
                                          cursor: actionLoading.has(a.id) ? 'wait' : 'pointer',
                                          fontFamily: FONT,
                                        }}
                                      >
                                        Відхилити
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Expanded revision */}
                                {a.responseAction === 'revise' && expandedRevisions.has(a.id) && (
                                  <div style={{ marginTop: 10 }}>
                                    {a.comment && (
                                      <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 6, fontStyle: 'italic' }}>
                                        💬 {a.comment}
                                      </div>
                                    )}
                                    <div style={{
                                      background: 'rgba(255,255,255,0.04)',
                                      borderRadius: 8,
                                      padding: '10px 12px',
                                      fontSize: 12,
                                      color: '#c8d4e8',
                                      lineHeight: 1.7,
                                      whiteSpace: 'pre-wrap',
                                      maxHeight: 300,
                                      overflowY: 'auto',
                                      border: '1px solid rgba(255,255,255,0.07)',
                                    }}>
                                      {a.revisedText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div style={{ fontSize: 11, color: '#334455', textAlign: 'center', marginTop: 16 }}>
          Автоматичне оновлення кожні 30 секунд
        </div>
      </div>
    </div>
  )
}
