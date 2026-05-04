'use client'

import { useState, useEffect } from 'react'

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"
const TOPICS = ['Питання', 'Співпраця', 'Стати автором', 'Технічна проблема', 'Інше']

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)',
  color: '#f5f0e8', fontSize: 15, fontFamily: FONT, outline: 'none',
  boxSizing: 'border-box', transition: 'border-color 0.15s',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: 'rgba(255,255,255,0.7)', fontFamily: FONT, marginBottom: 6,
}

function ThankYouScreen() {
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => setCountdown(c => c - 1), 1000)
    const redirect = setTimeout(() => { window.location.href = '/' }, 3000)
    return () => { clearInterval(interval); clearTimeout(redirect) }
  }, [])

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ background: '#0f1e3a', border: `1.5px solid ${GOLD}`, borderRadius: 20, padding: '48px 36px', maxWidth: 500, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 700, color: '#f5f0e8', marginBottom: 12 }}>
          Дякуємо!
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 20 }}>
          Ми відповімо найближчим часом.
        </p>
        <p style={{ fontSize: 14, color: '#8899bb' }}>
          Перенаправлення на головну через {countdown}…
        </p>
      </div>
    </main>
  )
}

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '', website: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.topic || !form.message.trim()) {
      setError("Будь ласка, заповніть усі поля")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Помилка надсилання')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Помилка з'єднання. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return <ThankYouScreen />

  return (
    <main style={{ minHeight: '100vh', background: '#0a1628', padding: '48px 20px 80px' }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ marginBottom: 36 }}>
          <a href="/" style={{ fontFamily: "'Comfortaa', cursive", fontSize: 22, fontWeight: 700, color: GOLD, textDecoration: 'none' }}>
            Balabony<sup style={{ fontSize: 9 }}>®</sup>
          </a>
        </div>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 700, color: '#f5f0e8', marginBottom: 8 }}>
          Напишіть нам
        </h1>
        <p style={{ fontSize: 15, color: '#8899bb', marginBottom: 36, lineHeight: 1.6 }}>
          Ми відповідаємо протягом 1–2 робочих днів.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Honeypot — hidden from real users */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', height: 0, overflow: 'hidden' }} aria-hidden="true">
            <label htmlFor="website">Залиште порожнім</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={e => set('website', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Name + Email row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div>
                <label htmlFor="name" style={labelStyle}>Ім'я</label>
                <input
                  id="name" type="text" placeholder="Ваше ім'я"
                  value={form.name} onChange={e => set('name', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="email" style={labelStyle}>Email</label>
                <input
                  id="email" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label htmlFor="topic" style={labelStyle}>Тема</label>
              <select
                id="topic"
                value={form.topic} onChange={e => set('topic', e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled style={{ background: '#0f1e3a' }}>Оберіть тему…</option>
                {TOPICS.map(t => (
                  <option key={t} value={t} style={{ background: '#0f1e3a' }}>{t}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" style={labelStyle}>Повідомлення</label>
              <textarea
                id="message" rows={6}
                placeholder="Ваше повідомлення…"
                value={form.message} onChange={e => set('message', e.target.value)}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#fca5a5', fontFamily: FONT }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '14px',
                background: loading ? 'rgba(245,166,35,0.5)' : GOLD,
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                fontFamily: FONT, transition: 'background 0.2s',
              }}
            >
              {loading ? 'Надсилання…' : 'Надіслати'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
