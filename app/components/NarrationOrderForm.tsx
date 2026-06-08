'use client'

import { useState } from 'react'

const FONT = "'Montserrat', Arial, sans-serif"

type Variant = 'dark' | 'cream'

function getTheme(variant: Variant) {
  if (variant === 'cream') {
    return {
      card: '#f6f1e7', border: '#ef9f27', title: '#b45309', body: '#292524',
      label: '#78716c', inputBg: '#ffffff', inputBorder: '#e7e0d2', inputText: '#1c1917',
      btnBg: '#ef9f27', btnText: '#1c1917',
    }
  }
  return {
    card: '#0f1e3a', border: 'var(--accent-gold)', title: 'var(--accent-gold)', body: 'rgba(255,255,255,0.78)',
    label: 'rgba(255,255,255,0.7)', inputBg: 'rgba(255,255,255,0.04)', inputBorder: 'rgba(255,255,255,0.15)', inputText: '#f5f0e8',
    btnBg: 'var(--accent-gold)', btnText: '#fff',
  }
}

export default function NarrationOrderForm({ variant = 'dark' }: { variant?: Variant }) {
  const t = getTheme(variant)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.inputText,
    fontFamily: FONT, fontSize: 15, marginBottom: 14, boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, color: t.label, marginBottom: 6, fontFamily: FONT,
  }

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workTitle, setWorkTitle] = useState('')
  const [workType, setWorkType] = useState('Книга')
  const [volume, setVolume] = useState('')
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !workTitle.trim()) {
      setErrorMsg("Заповніть ім'я, email і назву твору")
      setStatus('error')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/narration-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, workTitle, workType, volume, comment, website }),
      })
      if (res.ok) {
        setStatus('sent')
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error || 'Не вдалося надіслати. Спробуйте пізніше.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Не вдалося надіслати. Перевірте зʼєднання.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: '28px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.title, fontFamily: FONT, marginBottom: 12 }}>
          Заявку отримано
        </div>
        <p style={{ fontSize: 15, color: t.body, lineHeight: 1.7, margin: 0 }}>
          Дякуємо! Ми порахуємо вартість під ваш текст і звʼяжемося з вами найближчими днями.
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: t.card, border: `1.5px solid ${t.border}`, borderRadius: 16, padding: '28px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: t.title, fontFamily: FONT, marginBottom: 8 }}>
        Замовити озвучення
      </div>
      <p style={{ fontSize: 15, color: t.body, lineHeight: 1.7, marginBottom: 20 }}>
        Хочете аудіоверсію своєї книги чи серіалу? Озвучуємо голосами наших редакторів і письменників, які дали згоду на створення своїх синтезованих голосів. Залиште заявку — порахуємо вартість під ваш текст.
      </p>

      <input type="text" value={website} onChange={e => setWebsite(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

      <label style={labelStyle}>Ваше ім'я *</label>
      <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Ім'я та прізвище" />

      <label style={labelStyle}>Email *</label>
      <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />

      <label style={labelStyle}>Назва твору *</label>
      <input style={inputStyle} value={workTitle} onChange={e => setWorkTitle(e.target.value)} placeholder="Назва книги або серіалу" />

      <label style={labelStyle}>Тип</label>
      <select style={inputStyle} value={workType} onChange={e => setWorkType(e.target.value)}>
        <option>Книга</option>
        <option>Серіал</option>
      </select>

      <label style={labelStyle}>Орієнтовний обсяг (слів або сторінок)</label>
      <input style={inputStyle} value={volume} onChange={e => setVolume(e.target.value)} placeholder="Напр.: 20 000 слів або 80 сторінок" />

      <label style={labelStyle}>Коментар (необовʼязково)</label>
      <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={comment} onChange={e => setComment(e.target.value)} placeholder="Бажаний термін, побажання до голосу тощо" />

      {status === 'error' && (
        <p style={{ color: '#d92d20', fontSize: 14, marginBottom: 12 }}>{errorMsg}</p>
      )}

      <button onClick={handleSubmit} disabled={status === 'sending'}
        style={{
          display: 'inline-block', padding: '14px 32px',
          background: t.btnBg, color: t.btnText, border: 'none', borderRadius: 12,
          fontWeight: 700, fontSize: 16, fontFamily: FONT,
          cursor: status === 'sending' ? 'default' : 'pointer',
          opacity: status === 'sending' ? 0.6 : 1,
        }}>
        {status === 'sending' ? 'Надсилаємо…' : 'Надіслати заявку →'}
      </button>
    </div>
  )
}
