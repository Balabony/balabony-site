'use client'

import { useState } from 'react'

type GiftType = 'annual' | 'family-annual'

const PACKAGES: Record<GiftType, { price: number; name: string; sub: string; perks: string[] }> = {
  'annual': {
    price: 890,
    name: 'Річний',
    sub: 'Цілий рік українських історій',
    perks: ['Всі серії Балабонів', 'Без реклами', 'Офлайн-завантаження', 'Економія 658 ₴ проти місячної'],
  },
  'family-annual': {
    price: 1390,
    name: 'Сімейний річний',
    sub: 'До 4 акаунтів — для всієї родини',
    perks: ['До 4 акаунтів у родині', 'Усе те саме, що в Річному', 'По 29 ₴ на особу/міс', 'Економія 998 ₴'],
  },
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function GiftPage() {
  const [giftType, setGiftType]               = useState<GiftType>('annual')
  const [senderName, setSenderName]           = useState('')
  const [senderEmail, setSenderEmail]         = useState('')
  const [recipientName, setRecipientName]     = useState('')
  const [recipientEmail, setRecipientEmail]   = useState('')
  const [activationDate, setActivationDate]   = useState(todayIso())
  const [personalMessage, setPersonalMessage] = useState('')
  const [busy, setBusy]                       = useState(false)
  const [errorMsg, setErrorMsg]               = useState<string | null>(null)

  const pkg = PACKAGES[giftType]
  const minDate = todayIso()
  const charCount = personalMessage.length
  const charLimit = 200

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)

    if (!senderName.trim() || !senderEmail.trim() || !recipientName.trim() || !recipientEmail.trim()) {
      setErrorMsg('Будь ласка, заповни всі обовʼязкові поля')
      return
    }
    if (charCount > charLimit) {
      setErrorMsg(`Побажання задовге (${charCount} з ${charLimit} символів)`)
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/gift/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          giftType, senderName, senderEmail,
          recipientName, recipientEmail,
          activationDate, personalMessage,
        }),
      })

      const json = await res.json()
      if (!res.ok || !json.data || !json.signature) {
        throw new Error(json.error || 'Не вдалося створити подарунок')
      }

      // Submit invisible form to LiqPay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = 'https://www.liqpay.ua/api/3/checkout'
      form.acceptCharset = 'utf-8'

      const addField = (name: string, value: string) => {
        const i = document.createElement('input')
        i.type = 'hidden'
        i.name = name
        i.value = value
        form.appendChild(i)
      }
      addField('data', json.data)
      addField('signature', json.signature)

      document.body.appendChild(form)
      form.submit()
    } catch (err: unknown) {
      setBusy(false)
      setErrorMsg(err instanceof Error ? err.message : 'Сталась помилка. Спробуй ще раз.')
    }
  }

  return (
    <main style={{
      minHeight: '100vh', background: '#0a1628', color: '#f5f0e8',
      padding: '48px 16px', fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <header style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: 999,
            border: '1px solid rgba(240,165,0,0.5)', color: '#f0a500',
            fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
          }}>Подарунок</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>
            Подаруй <span style={{ color: '#f0a500' }}>Балабонів</span>
          </h1>
          <p style={{ color: '#c8d4e8', fontSize: 16, margin: 0 }}>
            Внукам — бабусям, батькам — друзям. Електронна вітальна картка приходить на пошту в день, який обереш.
          </p>
        </header>

        {/* Вибір пакету */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
          {(['annual','family-annual'] as GiftType[]).map(t => {
            const p = PACKAGES[t]
            const selected = giftType === t
            return (
              <div
                key={t} type="button" onClick={() => setGiftType(t)}
                style={{
                  background: selected ? 'rgba(240,165,0,0.08)' : '#0f1e3a',
                  border: selected ? '2px solid #f0a500' : '1px solid rgba(200,212,232,0.15)',
                  borderRadius: 16, padding: 20, cursor: 'pointer', textAlign: 'left',
                  color: '#f5f0e8', transition: 'all .2s',
                }}>
                <div style={{ fontSize: 12, color: '#8899bb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f0a500', marginBottom: 4 }}>
                  {p.price} ₴
                </div>
                <div style={{ color: '#c8d4e8', fontSize: 13, marginBottom: 12 }}>{p.sub}</div>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: 13, color: '#c8d4e8' }}>
                  {p.perks.map((x, i) => (
                    <li key={i} style={{ paddingLeft: 14, position: 'relative', marginBottom: 4 }}>
                      <span style={{ position: 'absolute', left: 0, color: '#f0a500' }}>✓</span> {x}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} style={{
          background: '#0f1e3a', borderRadius: 16, padding: 24,
          border: '1px solid rgba(200,212,232,0.1)',
        }}>
          <Section title="Від кого">
            <Input label="Твоє імʼя"  value={senderName}  onChange={setSenderName}  placeholder="Богдан" required />
            <Input label="Твій email" value={senderEmail} onChange={setSenderEmail} placeholder="ti@example.com" type="email" required />
          </Section>

          <Section title="Кому">
            <Input label="Імʼя одержувача"  value={recipientName}  onChange={setRecipientName}  placeholder="Бабуся Ганна" required />
            <Input label="Email одержувача" value={recipientEmail} onChange={setRecipientEmail} placeholder="hanna@example.com" type="email" required />
          </Section>

          <Section title="Коли і що написати">
            <Input
              label="Дата вручення"
              value={activationDate}
              onChange={setActivationDate}
              type="date"
              min={minDate}
              required
            />
            <label style={{ display: 'block', marginBottom: 16 }}>
              <span style={{ display: 'block', fontSize: 13, color: '#8899bb', marginBottom: 6 }}>
                Особисте побажання <span style={{ color: charCount > charLimit ? '#ff6b6b' : '#8899bb' }}>({charCount}/{charLimit})</span>
              </span>
              <textarea
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={4}
                placeholder="З Днем народження, бабусю! Тепер у тебе цілий рік історій."
                style={{
                  width: '100%', background: '#0a1628', border: '1px solid rgba(200,212,232,0.15)',
                  borderRadius: 8, padding: 12, color: '#f5f0e8', fontFamily: 'inherit',
                  fontSize: 14, resize: 'vertical',
                }}
              />
            </label>
          </Section>

          {errorMsg && (
            <div style={{
              background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)',
              borderRadius: 8, padding: 12, color: '#ff6b6b', marginBottom: 16, fontSize: 14,
            }}>{errorMsg}</div>
          )}

          <button type="submit" disabled={busy} style={{
            width: '100%', background: busy ? '#664400' : '#f0a500',
            color: '#0a1628', fontWeight: 700, fontSize: 16, padding: '16px 24px',
            border: 'none', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : '0 0 24px rgba(240,165,0,0.4)',
            transition: 'all .2s',
          }}>
            {busy ? 'Обробка…' : `Оплатити подарунок — ${pkg.price} ₴`}
          </button>

          <p style={{ marginTop: 16, fontSize: 12, color: '#8899bb', textAlign: 'center' }}>
            Оплата захищена LiqPay · Visa · Mastercard · Apple Pay · Google Pay
          </p>
        </form>

      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, color: '#8899bb', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Input({
  label, value, onChange, placeholder, type = 'text', required, min,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; min?: string
}) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 13, color: '#8899bb', marginBottom: 6 }}>{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required={required} min={min}
        style={{
          width: '100%', background: '#0a1628', border: '1px solid rgba(200,212,232,0.15)',
          borderRadius: 8, padding: 12, color: '#f5f0e8', fontSize: 14, fontFamily: 'inherit',
        }}
      />
    </label>
  )
}
