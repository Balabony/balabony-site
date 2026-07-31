'use client'

import { useState } from 'react'

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

const CHANNELS: [string, string][] = [
  ['email', 'Електронна пошта'],
  ['viber', 'Вайбер'],
  ['telegram', 'Телеграм'],
  ['phone', 'Телефонна розмова'],
  ['paper', 'Паперова заява'],
  ['form', 'Форма на сайті'],
  ['other', 'Інше'],
]

type Result = { fullName: string; email: string; link: string; reused: boolean }

export default function AdminAuthorsPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [penName, setPenName] = useState('')
  const [isFop, setIsFop] = useState(false)
  const [channel, setChannel] = useState('email')
  const [note, setNote] = useState('')

  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<Result[]>([])
  const [copied, setCopied] = useState('')

  const submit = async () => {
    setErr('')
    setBusy(true)
    try {
      const res = await fetch('/api/admin/create-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          penName: penName.trim(),
          isFop,
          consentChannel: channel,
          consentNote: note.trim(),
        }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string; loginLink?: string; reused?: boolean }
      if (!d.ok) {
        setErr(d.error ?? 'Не вдалося завести автора')
        return
      }
      setDone((prev) => [
        { fullName: fullName.trim(), email: email.trim(), link: d.loginLink ?? '', reused: d.reused === true },
        ...prev,
      ])
      setFullName(''); setEmail(''); setPenName(''); setNote(''); setIsFop(false)
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally {
      setBusy(false)
    }
  }

  // Автор входить тим самим шляхом, що й читачі: пошта -> лист із посиланням.
  // Це надійніше за одноразовий magic link, який згорає до того, як автор його відкриє.
  const msgFor = (d: Result): string =>
    `Вітаємо! Ваш кабінет автора на Балабонах створено.\n\n` +
    `Щоб увійти:\n` +
    `1. Відкрийте balabony.com/login\n` +
    `2. Введіть цю адресу: ${d.email}\n` +
    `3. Натисніть «Отримати посилання» — на пошту прийде лист із входом.\n\n` +
    `У кабінеті ви побачите свої твори, умови договору й нарахування.`

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 13px', borderRadius: 10,
    border: `1px solid ${LINE}`, background: NAVY_DEEP, color: CREAM,
    fontSize: 15, fontFamily: FONT, outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, color: MUTED, marginBottom: 6, fontWeight: 600,
  }

  return (
    <main style={{ background: NAVY_DEEP, minHeight: '100vh', color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px 90px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Заведення авторів</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 14, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, marginTop: 14 }}>
          Створює кабінет автора і одразу записує згоду на публікацію в Балабонах.
          Паролів на сайті немає: система віддає одноразове посилання, яке одразу
          відкриває автору його кабінет. Скопіюйте й передайте будь-яким каналом.
          Якщо посилання застаріє, автор завжди може зайти на сторінку входу і
          ввести свою пошту. Наявний акаунт із такою адресою використовується повторно.
        </p>

        <div style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 16, padding: 22, marginTop: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Прізвище, імʼя, по батькові</label>
            <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Василів Наталія Петрівна" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Електронна пошта</label>
            <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="avtor@example.com" inputMode="email" />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Псевдонім для публікації (необовʼязково)</label>
            <input style={inputStyle} value={penName} onChange={(e) => setPenName(e.target.value)} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Чим підтверджена згода</label>
            <select style={inputStyle} value={channel} onChange={(e) => setChannel(e.target.value)}>
              {CHANNELS.map(([v, l]) => <option key={v} value={v} style={{ background: NAVY_DEEP }}>{l}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Примітка до згоди (дата листа, хто розмовляв)</label>
            <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Лист від 28.07.2026" />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', fontSize: 15 }}>
            <input type="checkbox" checked={isFop} onChange={(e) => setIsFop(e.target.checked)} style={{ width: 18, height: 18, accentColor: GOLD }} />
            <span>Автор — ФОП <span style={{ color: MUTED, fontSize: 13 }}>(ставка 50% замість 40%)</span></span>
          </label>

          {err ? <p style={{ color: '#ff8a80', fontSize: 14, marginBottom: 14 }}>{err}</p> : null}

          <button
            onClick={() => void submit()}
            disabled={busy}
            style={{
              padding: '13px 26px', borderRadius: 12, border: 'none',
              background: busy ? 'rgba(239,159,39,0.45)' : GOLD, color: '#10151f',
              fontSize: 15, fontWeight: 700, fontFamily: FONT,
              cursor: busy ? 'default' : 'pointer',
            }}
          >
            {busy ? 'Заводимо…' : 'Завести автора'}
          </button>
        </div>

        {done.length > 0 && (
          <div style={{ marginTop: 26 }}>
            <h2 style={{ color: GOLD, fontSize: 18, marginBottom: 12 }}>Заведено в цій сесії</h2>
            {done.map((d, i) => (
              <div key={i} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{d.fullName}</div>
                <div style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>
                  {d.email}{d.reused ? ' \u00b7 акаунт уже існував, використано наявний' : ''}
                </div>

                <div style={{
                  marginTop: 14, padding: '13px 15px', borderRadius: 10,
                  background: NAVY_DEEP, border: `1px solid ${LINE}`,
                  fontSize: 14, color: CREAM, lineHeight: 1.7, whiteSpace: 'pre-wrap',
                }}>
                  {msgFor(d)}
                </div>

                <button
                  onClick={() => { void navigator.clipboard.writeText(msgFor(d)); setCopied(d.email) }}
                  style={{
                    marginTop: 12, padding: '11px 22px', borderRadius: 10,
                    border: 'none', background: GOLD, color: '#10151f',
                    fontSize: 14, fontWeight: 700, fontFamily: FONT, cursor: 'pointer',
                  }}
                >
                  {copied === d.email ? 'Скопійовано' : 'Копіювати повідомлення авторові'}
                </button>

                {d.link ? (
                  <details style={{ marginTop: 14 }}>
                    <summary style={{ color: MUTED, fontSize: 13, cursor: 'pointer' }}>
                      Швидкий вхід одним посиланням
                    </summary>
                    <p style={{ color: '#ffcc80', fontSize: 12.5, lineHeight: 1.55, margin: '8px 0 0' }}>
                      Одноразове й короткоживуче. Кожне нове заведення скасовує попереднє.
                      Годиться, щоб перевірити кабінет самому, але не для пересилання — поки
                      автор відкриє, воно, найпевніше, вже не спрацює.
                    </p>
                    <div style={{
                      marginTop: 8, padding: '9px 11px', borderRadius: 8,
                      background: NAVY_DEEP, border: `1px solid ${LINE}`,
                      fontSize: 11.5, wordBreak: 'break-all', color: MUTED, lineHeight: 1.5,
                    }}>
                      {d.link}
                    </div>
                    <button
                      onClick={() => { void navigator.clipboard.writeText(d.link); setCopied(`link:${d.email}`) }}
                      style={{
                        marginTop: 8, padding: '7px 15px', borderRadius: 9,
                        border: `1px solid ${LINE}`, background: 'transparent', color: MUTED,
                        fontSize: 13, fontFamily: FONT, cursor: 'pointer',
                      }}
                    >
                      {copied === `link:${d.email}` ? 'Скопійовано' : 'Копіювати посилання'}
                    </button>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
