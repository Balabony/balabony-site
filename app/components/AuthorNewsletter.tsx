'use client'

import { useState } from 'react'

/**
 * Згода автора на листи редакції.
 *
 * Свідомо НЕ ховаємо це в дрібний шрифт унизу: автор має бачити, що вибір є,
 * і мати змогу відписатись у два кліки, не пишучи листа. Технічні листи
 * (вхід, договір, виплати) не вимикаються — це не розсилка, а робота сервісу,
 * і людина не повинна втратити доступ до кабінету через відписку.
 */

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
}
const SERIF = 'Georgia, "Times New Roman", serif'

const UI = {
  chipBg: 'rgba(255,255,255,0.05)',
  chipBorder: 'rgba(143,163,196,0.32)',
  chipText: '#f5f0e8',
  chipOnBg: 'rgba(239,159,39,0.18)',
  chipOnBorder: '#ef9f27',
  chipOnText: '#ef9f27',
}

export default function AuthorNewsletter({ initialOptOut }: { initialOptOut: boolean }) {
  const [optOut, setOptOut] = useState<boolean>(initialOptOut)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function save(next: boolean) {
    setBusy(true)
    setNote(null)
    const before = optOut
    setOptOut(next)
    try {
      const res = await fetch('/api/author/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optOut: next }),
      })
      // Сервер може віддати сторінку помилки замість JSON — тоді .json() кине.
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        setOptOut(before)
        setNote(data?.error ?? `Не вдалося зберегти (код ${res.status}). Спробуйте ще раз.`)
        return
      }
      setNote(next
        ? 'Готово. Листів про конкурси й новини більше не надсилатимемо.'
        : 'Готово. Ви знову отримуватимете листи редакції.')
    } catch {
      setOptOut(before)
      setNote('Немає звʼязку із сайтом. Перевірте інтернет і спробуйте ще раз.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section
      id="rozsylka"
      style={{
        background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginTop: '1.5rem',
      }}
    >
      <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.25rem' }}>
        Листи від редакції
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
        Це листи про конкурси, новини платформи й запрошення. Кілька разів на місяць,
        не частіше. Ви можете відмовитись від них будь-коли, і це ніяк не вплине
        на вашу співпрацю з нами.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(false)}
          style={optOut ? pickOff : pickOn}
        >
          Так, надсилайте
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => save(true)}
          style={optOut ? pickOn : pickOff}
        >
          Відписатись від розсилки
        </button>
      </div>

      {note && (
        <p style={{ color: BRAND.text, fontSize: '0.88rem', marginTop: '0.9rem', marginBottom: 0 }}>
          {note}
        </p>
      )}

      <p style={{ color: BRAND.muted, fontSize: '0.8rem', marginTop: '1rem', marginBottom: 0, lineHeight: 1.6 }}>
        Службові листи — посилання для входу, договір, виплати — надходитимуть у будь-якому разі:
        без них кабінет не працює.
      </p>
    </section>
  )
}

const pickOn: React.CSSProperties = {
  padding: '0.55rem 1.1rem', borderRadius: 999, border: `1.5px solid ${UI.chipOnBorder}`,
  background: UI.chipOnBg, color: UI.chipOnText, fontWeight: 700, fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
}

const pickOff: React.CSSProperties = {
  padding: '0.55rem 1.1rem', borderRadius: 999, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
}
