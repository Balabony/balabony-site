'use client'

import { useState } from 'react'

/**
 * Лист авторa до редакції просто з кабінету.
 *
 * Автор не має шукати адресу й перемикатися в пошту: питання виникає в
 * кабінеті — там і задається. Тема обирається зі списку, щоб потім було видно,
 * про що люди пишуть найчастіше, і щоб редакція могла сортувати звернення.
 *
 * Лист приходить редакції на пошту з Reply-To автора — відповідати можна
 * звичайним «Відповісти» зі своєї скриньки.
 */

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
  navyDeep: '#0a1628',
}
const SERIF = 'Georgia, "Times New Roman", serif'

export const MESSAGE_TOPICS: [string, string][] = [
  ['contest', 'Заявка на конкурс'],
  ['works', 'Мої твори — додати або виправити'],
  ['tech', 'Щось не працює'],
  ['contract', 'Питання щодо договору'],
  ['voice', 'Хочу записати свій голос'],
  ['idea', 'Пропозиція щодо платформи'],
  ['payout', 'Питання щодо виплат'],
  ['other', 'Інше'],
]

export default function AuthorMessageForm() {
  const [topic, setTopic] = useState('contest')
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)

  const submit = async () => {
    const text = body.trim()
    if (text.length < 10) {
      setNote('Напишіть, будь ласка, трохи докладніше — принаймні кілька слів.')
      return
    }
    setBusy(true)
    setNote('')
    try {
      const res = await fetch('/api/author/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, body: text }),
      })
      const raw = await res.text()
      type Payload = { ok?: boolean; error?: string }
      let d: Payload | null = null
      try { d = JSON.parse(raw) as Payload } catch { d = null }

      if (!d) { setNote(`Сервер відповів помилкою (код ${res.status}). Спробуйте пізніше.`); return }
      if (!d.ok) { setNote(d.error ?? 'Не вдалося надіслати'); return }

      setSent(true)
      setBody('')
    } catch {
      setNote('Не вдалося звʼязатися з сайтом. Перевірте інтернет.')
    } finally {
      setBusy(false)
    }
  }

  const box: React.CSSProperties = {
    background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginTop: '1.5rem',
  }

  if (sent) {
    return (
      <section style={box}>
        <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.5rem' }}>
          Написати редакції
        </h2>
        <p style={{ color: BRAND.text, lineHeight: 1.65, margin: '0 0 14px' }}>
          Лист надіслано. Ми читаємо всі звернення й відповімо на вашу пошту.
        </p>
        <button
          type="button"
          onClick={() => { setSent(false); setNote('') }}
          style={{
            padding: '0.5rem 0.9rem', borderRadius: 9, cursor: 'pointer',
            border: `1px solid ${BRAND.line}`, background: 'transparent',
            color: BRAND.text, fontSize: '0.85rem', fontFamily: 'inherit',
          }}
        >
          Написати ще
        </button>
      </section>
    )
  }

  return (
    <section style={box}>
      <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.25rem' }}>
        Написати редакції
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 1.1rem', lineHeight: 1.6 }}>
        Питання, зауваження, пропозиція, знайдена помилка — пишіть просто звідси.
        Ми відповімо на вашу пошту.
      </p>

      <label style={{ display: 'block', fontSize: '0.82rem', color: BRAND.muted, marginBottom: 6 }}>
        Про що йдеться
      </label>
      <select
        value={topic}
        onChange={e => setTopic(e.target.value)}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 9, marginBottom: 14,
          border: `1px solid ${BRAND.line}`, background: BRAND.navyDeep, color: BRAND.ink,
          fontSize: 15, fontFamily: 'inherit', outline: 'none',
        }}
      >
        {MESSAGE_TOPICS.map(([k, label]) => (
          <option key={k} value={k}>{label}</option>
        ))}
      </select>

      <label style={{ display: 'block', fontSize: '0.82rem', color: BRAND.muted, marginBottom: 6 }}>
        Ваше повідомлення
      </label>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={7}
        placeholder="Напишіть докладно — так ми швидше зрозуміємо, чим допомогти."
        style={{
          width: '100%', padding: '11px 13px', borderRadius: 9,
          border: `1px solid ${BRAND.line}`, background: BRAND.navyDeep, color: BRAND.ink,
          fontSize: 15, lineHeight: 1.6, fontFamily: 'inherit', outline: 'none',
          resize: 'vertical',
        }}
      />

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => { void submit() }}
          style={{
            padding: '0.55rem 1.1rem', borderRadius: 9, cursor: 'pointer',
            border: 'none', background: BRAND.amber, color: BRAND.cream,
            fontWeight: 700, fontSize: '0.9rem', fontFamily: 'inherit',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'Надсилаємо…' : 'Надіслати'}
        </button>
        <span style={{ color: BRAND.muted, fontSize: '0.8rem' }}>
          {body.trim().length > 0 && `${body.trim().length} знаків`}
        </span>
      </div>

      {note && (
        <p style={{ color: '#F09595', fontSize: '0.88rem', marginTop: 10, lineHeight: 1.55 }}>{note}</p>
      )}

      <p style={{ color: BRAND.muted, fontSize: '0.8rem', marginTop: 14, lineHeight: 1.6 }}>
        Не надсилайте тут реквізити для виплат — їх заповнюють у розділі вище, так безпечніше.
      </p>
    </section>
  )
}
