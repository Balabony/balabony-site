'use client'

import { useState } from 'react'

type Tier = 'individual' | 'family'
type Term = 'quarter' | 'half' | 'annual'

const TERMS: { key: Term; label: string; months: number }[] = [
  { key: 'quarter', label: '3 місяці',  months: 3 },
  { key: 'half',    label: '6 місяців', months: 6 },
  { key: 'annual',  label: '1 рік',     months: 12 },
]

const PRICES: Record<Tier, Record<Term, number>> = {
  individual: { quarter: 349, half: 649, annual: 890 },
  family:     { quarter: 549, half: 990, annual: 1390 },
}

const MONTHLY: Record<Tier, number> = { individual: 129, family: 199 }

const PERKS: Record<Tier, string[]> = {
  individual: ['Усі серії Балабонів', 'Історії та казки сучасних авторів', 'Без реклами'],
  family:     ['До 4 акаунтів у родині', 'Усі серії Балабонів', 'Історії та казки сучасних авторів'],
}

function giftTypeKey(tier: Tier, term: Term): string {
  return tier === 'family' ? `family-${term}` : term
}

function discountPct(tier: Tier, term: Term): number {
  const months = TERMS.find(t => t.key === term)!.months
  const full = MONTHLY[tier] * months
  return Math.round((1 - PRICES[tier][term] / full) * 100)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function GiftPage() {
  const [tier, setTier]                       = useState<Tier>('individual')
  const [term, setTerm]                       = useState<Term>('annual')
  const [senderName, setSenderName]           = useState('')
  const [senderEmail, setSenderEmail]         = useState('')
  const [recipientName, setRecipientName]     = useState('')
  const [recipientEmail, setRecipientEmail]   = useState('')
  const [activationDate, setActivationDate]   = useState(todayIso())
  const [personalMessage, setPersonalMessage] = useState('')
  const [busy, setBusy]                       = useState(false)
  const [errorMsg, setErrorMsg]               = useState<string | null>(null)

  const price = PRICES[tier][term]
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
          giftType: giftTypeKey(tier, term), senderName, senderEmail,
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
            border: '1px solid rgba(239,159,39,0.5)', color: 'var(--accent-gold)',
            fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16,
          }}>Подарунок</div>
          <h1 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>
            Подаруй <span style={{ color: 'var(--accent-gold)' }}>Балабонів</span>
          </h1>
          <p style={{ color: '#c8d4e8', fontSize: 16, margin: 0 }}>
            Внукам — бабусям, батькам — друзям. Електронна вітальна картка приходить на пошту в день, який обереш.
          </p>
        </header>

        {/* Тип підписки: індивідуальний / сімейний */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: '#0f1e3a', padding: 6, borderRadius: 14, border: '1px solid rgba(200,212,232,0.12)' }}>
          {([['individual','Індивідуальний'],['family','Сімейний (до 4)']] as [Tier,string][]).map(([t,label]) => {
            const active = tier === t
            return (
              <button
                key={t} type="button" onClick={() => setTier(t)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10, cursor: 'pointer',
                  border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  background: active ? 'var(--accent-gold)' : 'transparent',
                  color: active ? '#0a1628' : '#c8d4e8', transition: 'all .15s',
                }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Термін: 3 / 6 / 12 місяців */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 18 }}>
          {TERMS.map(({ key, label, months }) => {
            const selected = term === key
            const p = PRICES[tier][key]
            const disc = discountPct(tier, key)
            const perMonth = Math.round(p / months)
            return (
              <div
                key={key} onClick={() => setTerm(key)}
                style={{
                  position: 'relative', background: selected ? 'rgba(239,159,39,0.08)' : '#0f1e3a',
                  border: selected ? '2px solid var(--accent-gold)' : '1px solid rgba(200,212,232,0.15)',
                  borderRadius: 16, padding: '18px 12px', cursor: 'pointer', textAlign: 'center',
                  transition: 'all .2s',
                }}>
                {disc > 0 && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8, fontSize: 11, fontWeight: 700,
                    color: '#0a1628', background: 'var(--accent-gold)', borderRadius: 6, padding: '2px 6px',
                  }}>−{disc}%</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 6 }} aria-hidden>🎁</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f5f0e8', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-gold)' }}>{p} ₴</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 2 }}>≈ {perMonth} ₴/міс</div>
              </div>
            )
          })}
        </div>

        {/* Що входить */}
        <ul style={{ margin: '0 0 32px', padding: 0, listStyle: 'none', fontSize: 14, color: '#c8d4e8' }}>
          {PERKS[tier].map((x, i) => (
            <li key={i} style={{ paddingLeft: 18, position: 'relative', marginBottom: 6 }}>
              <span style={{ position: 'absolute', left: 0, color: 'var(--accent-gold)' }}>✓</span> {x}
            </li>
          ))}
        </ul>

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
            width: '100%', background: busy ? '#664400' : 'var(--accent-gold)',
            color: '#0a1628', fontWeight: 700, fontSize: 16, padding: '16px 24px',
            border: 'none', borderRadius: 12, cursor: busy ? 'not-allowed' : 'pointer',
            boxShadow: busy ? 'none' : '0 0 24px rgba(239,159,39,0.4)',
            transition: 'all .2s',
          }}>
            {busy ? 'Обробка…' : `Оплатити подарунок — ${price} ₴`}
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
