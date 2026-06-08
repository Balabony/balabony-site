'use client'

import { useEffect, useState } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'

interface Rule {
  id: number
  topic: string
  category: string | null
  rule_short: string
  examples: string | null
  norm_type: 'mandatory' | 'variant'
  audience: 'editor' | 'all'
  status: 'draft' | 'verified'
  source: string | null
  sort_order: number
  updated_at: string
}

const EMPTY = {
  id: 0, topic: '', category: '', rule_short: '', examples: '',
  norm_type: 'mandatory' as const, audience: 'all' as const,
  status: 'draft' as const, source: '', sort_order: 0,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)',
  color: '#f5f0e8', fontFamily: FONT, fontSize: 14, marginBottom: 12, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 4, fontFamily: FONT,
}

export default function SpellingAdminPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  async function load() {
    try {
      const res = await fetch('/api/admin/spelling')
      const data = await res.json()
      if (data.rules) setRules(data.rules)
      else if (data.error) setErr(data.error)
    } catch {
      setErr('Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  function resetForm() {
    setForm({ ...EMPTY }); setEditingId(null)
  }

  function startEdit(r: Rule) {
    setForm({
      id: r.id, topic: r.topic, category: r.category ?? '', rule_short: r.rule_short,
      examples: r.examples ?? '', norm_type: r.norm_type, audience: r.audience,
      status: r.status, source: r.source ?? '', sort_order: r.sort_order,
    })
    setEditingId(r.id)
    setMsg(null); setErr(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function save() {
    setErr(null); setMsg(null)
    if (!form.topic.trim() || !form.rule_short.trim()) {
      setErr("Заповніть 'Тема' і 'Правило'"); return
    }
    setSubmitting(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch('/api/admin/spelling', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok && data.rule) {
        setMsg(editingId ? 'Оновлено' : 'Додано')
        resetForm(); load()
      } else {
        setErr(data.error || 'Помилка збереження')
      }
    } catch {
      setErr('Помилка мережі')
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(id: number) {
    if (!confirm('Видалити цю статтю?')) return
    try {
      await fetch(`/api/admin/spelling?id=${id}`, { method: 'DELETE' })
      if (editingId === id) resetForm()
      load()
    } catch {
      setErr('Помилка видалення')
    }
  }

  async function toggleStatus(r: Rule) {
    const next = r.status === 'verified' ? 'draft' : 'verified'
    try {
      await fetch('/api/admin/spelling', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r, status: next }),
      })
      load()
    } catch {
      setErr('Помилка зміни статусу')
    }
  }

  const filtered = filter === 'all' ? rules : rules.filter(r => (r.category ?? '') === filter)
  const categories = Array.from(new Set(rules.map(r => r.category).filter(Boolean))) as string[]

  return (
    <main style={{ minHeight: '100vh', background: NAVY_DEEP, padding: '32px 20px 80px', fontFamily: FONT, color: '#f5f0e8' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 26, marginBottom: 6 }}>Довідник правопису</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Джерело правди — стандарт «Український правопис» (рішення Нацкомісії №47 від 01.03.2026, чинний з 28.03.2026),
          текст на <a href="https://mova.gov.ua/diyalnist-i-proyekti/termini/pravopys-ukrainskoi-movy" target="_blank" rel="noopener" style={{ color: GOLD }}>mova.gov.ua</a>.
          Кожну статтю звіряйте з офіційним текстом і лише тоді ставте статус «Вивірено». Публічно показуються лише вивірені.
        </p>

        {/* ФОРМА */}
        <div style={{ background: NAVY, border: `1px solid rgba(240,165,0,0.3)`, borderRadius: 14, padding: 24, marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>
            {editingId ? 'Редагувати статтю' : 'Нова стаття'}
          </div>

          <label style={labelStyle}>Тема *</label>
          <input style={inputStyle} value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="Напр.: Літера ґ" />

          <label style={labelStyle}>Категорія</label>
          <input style={inputStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Напр.: Літери і звуки / Разом, окремо, дефіс / Велика літера / Фемінітиви / Запозичення" />

          <label style={labelStyle}>Правило (просто, своїми словами) *</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.rule_short} onChange={e => setForm({ ...form, rule_short: e.target.value })} />

          <label style={labelStyle}>Приклади</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.examples} onChange={e => setForm({ ...form, examples: e.target.value })} placeholder="проєкт (не проект); ґанок, ґуля; индик / индичка" />

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Тип норми</label>
              <select style={inputStyle} value={form.norm_type} onChange={e => setForm({ ...form, norm_type: e.target.value as 'mandatory' | 'variant' })}>
                <option value="mandatory">Обов'язкова</option>
                <option value="variant">Варіантна (допустимі обидві форми)</option>
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Для кого</label>
              <select style={inputStyle} value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as 'editor' | 'all' })}>
                <option value="all">Для всіх (публічно)</option>
                <option value="editor">Лише для редакції</option>
              </select>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={labelStyle}>Статус</label>
              <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'verified' })}>
                <option value="draft">Чернетка</option>
                <option value="verified">Вивірено</option>
              </select>
            </div>
          </div>

          <label style={labelStyle}>Джерело (посилання на пункт стандарту на mova.gov.ua)</label>
          <input style={inputStyle} value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="https://mova.gov.ua/..." />

          {err && <p style={{ color: '#ff8080', fontSize: 13, marginBottom: 10 }}>{err}</p>}
          {msg && <p style={{ color: '#7ee787', fontSize: 13, marginBottom: 10 }}>{msg}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} disabled={submitting}
              style={{ padding: '12px 28px', background: GOLD, color: '#1c1c1c', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1, fontFamily: FONT }}>
              {submitting ? 'Зберігаємо…' : (editingId ? 'Зберегти зміни' : 'Додати статтю')}
            </button>
            {editingId && (
              <button onClick={resetForm}
                style={{ padding: '12px 20px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, fontSize: 15, cursor: 'pointer', fontFamily: FONT }}>
                Скасувати
              </button>
            )}
          </div>
        </div>

        {/* ФІЛЬТР */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Категорія:</span>
            <button onClick={() => setFilter('all')} style={chip(filter === 'all')}>Усі</button>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={chip(filter === c)}>{c}</button>
            ))}
          </div>
        )}

        {/* СПИСОК */}
        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Завантаження…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Поки немає статей. Додайте першу вище.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(r => (
              <div key={r.id} style={{ background: NAVY, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 auto' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                      <strong style={{ fontSize: 16 }}>{r.topic}</strong>
                      {r.category && <span style={tag('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.7)')}>{r.category}</span>}
                      <span style={tag(r.status === 'verified' ? 'rgba(34,197,94,0.18)' : 'rgba(240,165,0,0.18)', r.status === 'verified' ? '#7ee787' : GOLD)}>
                        {r.status === 'verified' ? '✓ Вивірено' : 'Чернетка'}
                      </span>
                      {r.norm_type === 'variant' && <span style={tag('rgba(96,165,250,0.18)', '#93c5fd')}>Варіантна</span>}
                      {r.audience === 'editor' && <span style={tag('rgba(255,255,255,0.08)', 'rgba(255,255,255,0.6)')}>лише редакція</span>}
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: '0 0 6px' }}>{r.rule_short}</p>
                    {r.examples && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 6px' }}>Приклади: {r.examples}</p>}
                    {r.source && <a href={r.source} target="_blank" rel="noopener" style={{ fontSize: 12, color: GOLD }}>джерело ↗</a>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button onClick={() => toggleStatus(r)} style={miniBtn}>{r.status === 'verified' ? '↩ У чернетки' : '✓ Вивірено'}</button>
                    <button onClick={() => startEdit(r)} style={miniBtn}>Редагувати</button>
                    <button onClick={() => remove(r.id)} style={{ ...miniBtn, color: '#ff8080', borderColor: 'rgba(255,128,128,0.3)' }}>Видалити</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 12px', borderRadius: 999, fontSize: 13, cursor: 'pointer', fontFamily: FONT,
    background: active ? GOLD : 'rgba(255,255,255,0.06)', color: active ? '#1c1c1c' : 'rgba(255,255,255,0.75)',
    border: 'none', fontWeight: active ? 700 : 400,
  }
}
function tag(bg: string, color: string): React.CSSProperties {
  return { fontSize: 11, padding: '2px 8px', borderRadius: 999, background: bg, color, fontWeight: 600 }
}
const miniBtn: React.CSSProperties = {
  padding: '6px 12px', background: 'transparent', color: 'rgba(255,255,255,0.8)',
  border: '1px solid rgba(255,255,255,0.18)', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: FONT, whiteSpace: 'nowrap',
}
