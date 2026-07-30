'use client'

import { useState } from 'react'

const GOLD = '#ef9f27'
const GOLD_SOFT = '#FAC775'
const NAVY_DEEP = '#0a1628'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"

/**
 * Підписання договору КЕП без передавання ключа на сервер.
 * Автор підписує файл у себе (czo.gov.ua/sign або клієнт свого банку)
 * і завантажує сюди готовий .p7s.
 */
export default function KepUpload({ contractId, docUrl }: { contractId: string; docUrl?: string | null }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [done, setDone] = useState(false)

  const send = async () => {
    if (!file) { setMsg('Спершу оберіть файл підпису'); return }
    setBusy(true); setMsg('')
    try {
      const fd = new FormData()
      fd.append('contractId', contractId)
      fd.append('file', file)
      const res = await fetch('/api/contracts/sign/kep', { method: 'POST', body: fd })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) { setMsg(d.error ?? 'Не вдалося надіслати'); return }
      setDone(true)
    } catch {
      setMsg('Немає зв’язку — спробуйте ще раз')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div style={{ marginTop: 14, padding: '14px 16px', borderRadius: 10, background: 'rgba(151,196,89,0.14)', border: '1px solid rgba(151,196,89,0.4)', fontFamily: FONT }}>
        <p style={{ margin: 0, fontSize: 14.5, color: '#C0DD97', lineHeight: 1.6 }}>
          Підпис отримано. Договір позначено підписаним — редактор перевірить сертифікат і зв’яжеться,
          якщо будуть питання.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12, fontSize: 14, fontWeight: 700, color: CREAM, background: 'transparent',
          border: '1px solid rgba(143,163,196,0.4)', borderRadius: 9, padding: '10px 18px',
          cursor: 'pointer', fontFamily: FONT,
        }}
      >
        Підписати КЕП
      </button>
    )
  }

  return (
    <div style={{ marginTop: 14, padding: '18px 18px 16px', borderRadius: 12, background: NAVY_DEEP, border: `1px solid ${GOLD}55`, fontFamily: FONT }}>
      <div style={{ fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 12 }}>
        Підписання кваліфікованим підписом
      </div>

      <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.75, color: MUTED }}>
        <li>
          Завантажте файл договору
          {docUrl ? (
            <>
              {' — '}
              <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD_SOFT, fontWeight: 700 }}>
                відкрити договір
              </a>
            </>
          ) : (
            ' зі свого кабінету'
          )}
          .
        </li>
        <li>
          Підпишіть його своїм ключем на{' '}
          <a href="https://czo.gov.ua/sign" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_SOFT, fontWeight: 700 }}>
            czo.gov.ua/sign
          </a>{' '}
          або в застосунку свого банку. Ключ лишається у вас — ми його не бачимо й не просимо.
        </li>
        <li>Збережіть результат і додайте його сюди.</li>
      </ol>

      <input
        type="file"
        accept=".p7s,.asics,.asice,.pdf"
        onChange={e => { setFile(e.target.files?.[0] ?? null); setMsg('') }}
        style={{
          display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 14,
          fontSize: 14, color: CREAM, background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(143,163,196,0.3)', borderRadius: 9, padding: '10px 12px', fontFamily: FONT,
        }}
      />

      {msg && <p style={{ color: '#F09595', fontSize: 14, margin: '10px 0 0' }}>{msg}</p>}

      <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => { void send() }}
          style={{
            fontSize: 14.5, fontWeight: 700, color: NAVY_DEEP, background: GOLD, border: 'none',
            borderRadius: 9, padding: '11px 22px', cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.6 : 1, fontFamily: FONT,
          }}
        >
          {busy ? 'Надсилаємо…' : 'Надіслати підпис'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setFile(null); setMsg('') }}
          style={{
            fontSize: 14.5, color: MUTED, background: 'transparent',
            border: '1px solid rgba(143,163,196,0.3)', borderRadius: 9, padding: '11px 18px',
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          Скасувати
        </button>
      </div>
    </div>
  )
}
