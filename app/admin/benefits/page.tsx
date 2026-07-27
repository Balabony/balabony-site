'use client'

/**
 * Черга перевірки пільгових статусів.
 *
 * Тут лише заявки, подані вручну — цивільна інвалідність, яку Дія
 * валідувати не вміє. Пільга в людини вже діє; редактор або підтверджує
 * її, або знімає. Після рішення скан видаляється зі сховища.
 */

import { useState, useEffect, useCallback } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0f1e3a'

interface Item {
  userId: string
  email: string | null
  category: string
  submittedAt: string | null
  validUntil: string | null
  docUrl: string | null
  hasDoc: boolean
}

const CATEGORY_LABEL: Record<string, string> = {
  disability: 'Людина з інвалідністю',
  vpo: 'ВПО',
  veteran: 'Ветеран / ОІВВ',
  age: 'Пенсійний вік',
  other: 'Інше',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: 'long', year: 'numeric' })
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

export default function AdminBenefitsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/benefits')
      if (res.status === 401) {
        setError('Немає доступу. Увійдіть в адмінку.')
        setItems([])
        return
      }
      const data = (await res.json()) as { items?: Item[]; error?: string }
      if (data.error) setError(data.error)
      else setItems(data.items ?? [])
    } catch {
      setError('Не вдалося завантажити список')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const decide = useCallback(
    async (userId: string, decision: 'verified' | 'rejected', why?: string) => {
      setBusy(userId)
      try {
        const res = await fetch('/api/admin/benefits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, decision, reason: why }),
        })
        const data = (await res.json()) as { ok?: boolean; error?: string }
        if (data.ok) {
          setItems((prev) => prev.filter((i) => i.userId !== userId))
          setRejecting(null)
          setReason('')
        } else {
          setError(data.error ?? 'Не вдалося зберегти рішення')
        }
      } catch {
        setError('Помилка зʼєднання')
      } finally {
        setBusy(null)
      }
    },
    [],
  )

  return (
    <div style={{ fontFamily: FONT, padding: '32px 24px', maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 6 }}>
        Пільгові статуси на перевірці
      </h1>
      <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.5 }}>
        Заявки, подані зі скан-копією документа. Пільга в людини вже діє —
        ви або підтверджуєте її, або знімаєте. Після рішення скан видаляється.
      </p>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          borderRadius: 10,
          padding: '12px 16px',
          fontSize: 14,
          marginBottom: 20,
        }}>
          {error}
        </div>
      )}

      {loading && <p style={{ color: '#64748b', fontSize: 15 }}>Завантаження…</p>}

      {!loading && !error && items.length === 0 && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          borderRadius: 12,
          padding: '20px 24px',
          fontSize: 15,
        }}>
          Заявок на перевірці немає.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((it) => {
          const days = daysSince(it.submittedAt)
          const stale = days !== null && days >= 7
          return (
            <div
              key={it.userId}
              style={{
                border: `1px solid ${stale ? '#fed7aa' : '#e2e8f0'}`,
                background: stale ? '#fffbeb' : '#fff',
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 4 }}>
                    {CATEGORY_LABEL[it.category] ?? it.category}
                  </div>
                  <div style={{ fontSize: 14, color: '#475569', marginBottom: 2 }}>
                    {it.email ?? <span style={{ color: '#94a3b8' }}>пошта недоступна</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Подано {fmtDate(it.submittedAt)}
                    {days !== null && (
                      <span style={{ color: stale ? '#b45309' : '#64748b', fontWeight: stale ? 700 : 400 }}>
                        {' '}· {days === 0 ? 'сьогодні' : `${days} дн. тому`}
                      </span>
                    )}
                  </div>
                </div>

                {it.docUrl ? (
                  <a
                    href={it.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      alignSelf: 'flex-start',
                      padding: '10px 16px',
                      borderRadius: 10,
                      background: NAVY,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Відкрити документ
                  </a>
                ) : (
                  <span style={{ fontSize: 13, color: '#b45309', alignSelf: 'flex-start' }}>
                    файл відсутній
                  </span>
                )}
              </div>

              {rejecting === it.userId ? (
                <div style={{ marginTop: 16 }}>
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Причина відмови — побачить користувач"
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: 14,
                      fontFamily: FONT,
                      boxSizing: 'border-box',
                      marginBottom: 10,
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      disabled={busy === it.userId}
                      onClick={() => decide(it.userId, 'rejected', reason)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#dc2626',
                        color: '#fff',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      {busy === it.userId ? 'Зберігаємо…' : 'Підтвердити відмову'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setRejecting(null); setReason('') }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        color: '#475569',
                        fontSize: 14,
                        cursor: 'pointer',
                        fontFamily: FONT,
                      }}
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    disabled={busy === it.userId}
                    onClick={() => decide(it.userId, 'verified')}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#1d9e75',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    {busy === it.userId ? 'Зберігаємо…' : 'Підтвердити'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === it.userId}
                    onClick={() => setRejecting(it.userId)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '1px solid #fecaca',
                      background: '#fff',
                      color: '#dc2626',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: FONT,
                    }}
                  >
                    Відхилити
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
