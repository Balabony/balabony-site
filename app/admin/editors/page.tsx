'use client'

import { useEffect, useState } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#d0a355'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface Editor {
  id: number
  name: string
  email: string
  created_at: string
}

interface EditorsResponse {
  editors?: Editor[]
  error?: string
}

interface EditorMutationResponse {
  editor?: Editor
  ok?: boolean
  error?: string
}

export default function EditorsPage() {
  const [editors, setEditors] = useState<Editor[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function loadEditors() {
    try {
      const res = await fetch('/api/admin/editors')
      const data = await res.json() as EditorsResponse
      if (data.editors) setEditors(data.editors)
    } catch {
      setErrorMsg("Помилка завантаження")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEditors() }, [])

  async function addEditor(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/admin/editors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json() as EditorMutationResponse
      if (data.error) {
        setErrorMsg(data.error)
      } else if (data.editor) {
        setEditors(prev => [...prev, data.editor!].sort((a, b) => a.name.localeCompare(b.name)))
        setName('')
        setEmail('')
        setSuccessMsg(`Редактора «${data.editor.name}» додано`)
      }
    } catch {
      setErrorMsg("Помилка з'єднання")
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteEditor(editor: Editor) {
    if (!window.confirm(`Видалити редактора «${editor.name}»?`)) return
    try {
      const res = await fetch(`/api/admin/editors?id=${editor.id}`, { method: 'DELETE' })
      const data = await res.json() as EditorMutationResponse
      if (data.ok) {
        setEditors(prev => prev.filter(e => e.id !== editor.id))
        setSuccessMsg(`Редактора «${editor.name}» видалено`)
      } else {
        setErrorMsg(data.error ?? 'Помилка видалення')
      }
    } catch {
      setErrorMsg("Помилка з'єднання")
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: '#f5f0e8', fontFamily: FONT, padding: '24px 16px 80px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>

        {/* Messages */}
        {successMsg && (
          <div style={{ background: 'rgba(124, 199, 155,0.1)', border: '1px solid rgba(124, 199, 155,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#7cc79b', marginBottom: 16 }}>
            ✅ {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ background: 'rgba(221, 143, 143,0.1)', border: '1px solid rgba(221, 143, 143,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#dd8f8f', marginBottom: 16 }}>
            ❌ {errorMsg}
          </div>
        )}

        {/* Add editor form */}
        <div style={{ background: NAVY, borderRadius: 16, padding: '20px 18px', border: '0.5px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#c8d4e8', marginBottom: 16 }}>Додати редактора</div>
          <form onSubmit={addEditor} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Ім'я"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={{
                flex: '1 1 160px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 9,
                padding: '9px 12px',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                flex: '1 1 200px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 9,
                padding: '9px 12px',
                color: '#f5f0e8',
                fontSize: 13,
                fontFamily: FONT,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: submitting ? 'rgba(208, 163, 85,0.4)' : GOLD,
                color: '#081420',
                border: 'none',
                borderRadius: 9,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: submitting ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {submitting ? '⏳ Додаю…' : '+ Додати'}
            </button>
          </form>
        </div>

        {/* Editors list */}
        <div style={{ background: NAVY, borderRadius: 16, border: '0.5px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.07)', fontSize: 11, fontWeight: 700, color: '#8899bb', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Редакторів: {editors.length}
          </div>

          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#445566' }}>
              Завантажуємо…
            </div>
          )}

          {!loading && editors.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: 13, color: '#445566' }}>
              Редакторів ще немає. Додайте першого редактора вище.
            </div>
          )}

          {editors.map((editor, idx) => (
            <div
              key={editor.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 18px',
                borderBottom: idx < editors.length - 1 ? '0.5px solid rgba(255,255,255,0.05)' : undefined,
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(208, 163, 85,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                {editor.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f5f0e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editor.name}
                </div>
                <div style={{ fontSize: 12, color: '#8899bb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editor.email}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#445566', flexShrink: 0 }}>
                {new Date(editor.created_at).toLocaleDateString('uk-UA')}
              </div>
              <button
                onClick={() => deleteEditor(editor)}
                style={{
                  background: 'rgba(221, 143, 143,0.1)',
                  border: '1px solid rgba(221, 143, 143,0.25)',
                  borderRadius: 7,
                  padding: '5px 11px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#dd8f8f',
                  cursor: 'pointer',
                  fontFamily: FONT,
                  flexShrink: 0,
                }}
              >
                Видалити
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
