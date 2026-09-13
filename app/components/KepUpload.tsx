'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

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

  /**
   * Файл іде ПРЯМО В СХОВИЩЕ, не через наш сервер.
   *
   * До 13.09.2026 форма надсилала файл на /api/contracts/sign/kep у
   * FormData. Vercel ріже тіло запиту приблизно на 4,5 МБ, тому підписаний
   * PDF на 10,7 МБ не доходив нікуди, а людина бачила «немає зв'язку» і
   * думала, що винен її інтернет. Тепер сервер видає одноразове посилання,
   * браузер ллє файл у сховище сам, а на сервер іде лише шлях.
   */
  const send = async () => {
    if (!file) { setMsg('Спершу оберіть файл підпису'); return }
    setBusy(true); setMsg('')
    try {
      // 1. Одноразове посилання на завантаження.
      const urlRes = await fetch('/api/contracts/sign/kep-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, filename: file.name }),
      })
      const u = (await urlRes.json()) as
        { ok: boolean; error?: string; path?: string; token?: string; bucket?: string }
      if (!u.ok || !u.path || !u.token || !u.bucket) {
        setMsg(u.error ?? 'Не вдалося підготувати завантаження')
        return
      }

      // 2. Файл у сховище.
      const supabase = createSupabaseBrowserClient()
      const { error: upErr } = await supabase.storage
        .from(u.bucket)
        .uploadToSignedUrl(u.path, u.token, file)
      if (upErr) {
        setMsg('Файл не завантажився. Перевірте зв’язок і спробуйте ще раз')
        return
      }

      // 3. Позначаємо договір підписаним.
      const res = await fetch('/api/contracts/sign/kep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, path: u.path }),
      })
      const d = (await res.json()) as { ok: boolean; error?: string }
      if (!d.ok) { setMsg(d.error ?? 'Не вдалося зафіксувати підпис'); return }
      setDone(true)
    } catch {
      setMsg('Не вдалося надіслати. Перевірте зв’язок і спробуйте ще раз')
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
          Підпишіть його своїм ключем — через Дію на{' '}
          <a href="https://ca.diia.gov.ua/sign" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_SOFT, fontWeight: 700 }}>
            ca.diia.gov.ua/sign
          </a>, на{' '}
          <a href="https://czo.gov.ua/sign" target="_blank" rel="noopener noreferrer" style={{ color: GOLD_SOFT, fontWeight: 700 }}>
            czo.gov.ua/sign
          </a>{' '}
          або в застосунку свого банку. Ключ лишається у вас — ми його не бачимо й не просимо.
        </li>
        <li>
          <b style={{ color: CREAM }}>Завантажте «файл з підписом»</b> — портал не надсилає його нам.
          Це файл .p7s (іноді .asice або підписаний PDF). Якщо ви його не зберегли,
          підпису у вас на руках немає.
        </li>
        <li>Додайте цей файл сюди й натисніть «Надіслати підпис».</li>
      </ol>

      <p style={{ fontSize: 14, lineHeight: 1.7, color: MUTED, margin: '12px 0 0' }}>
        Докладно, з поясненням кожного кроку —{' '}
        <a href="/yak-pidpysaty" style={{ color: GOLD_SOFT, fontWeight: 700 }}>
          як підписати договір
        </a>.
      </p>

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
