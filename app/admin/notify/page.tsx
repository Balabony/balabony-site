'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * «Сповістити підписників» — розсилка листа тим, хто стежить за автором.
 *
 * Кнопка на кожному творі, а не автоматика при публікації: до запуску
 * контент заливається пачками, і автоматична розсилка висипала б читачеві
 * десяток листів за вечір.
 */

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"

type Item = {
  id: string
  title: string
  type: string
  slug: string | null
  created_at: string
  author_name: string
  followers: number
  sent_at: string | null
}

type SendResult = { sent: number; failed: number; note?: string; error?: string }

function dateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function plural(n: number, one: string, few: string, many: string): string {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return one
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few
  return many
}

export default function NotifyPage() {
  const [items, setItems] = useState<Item[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setErr('')
    try {
      const res = await fetch('/api/admin/notify-followers', { cache: 'no-store' })
      const d = await res.json()
      if (d.error) { setErr(d.error); return }
      setItems(d.items ?? [])
    } catch {
      setErr('Не вдалось прочитати список')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const send = async (it: Item) => {
    if (!confirm(`Надіслати лист ${it.followers} ${plural(it.followers, 'підписнику', 'підписникам', 'підписникам')} автора ${it.author_name}?\n\n«${it.title}»`)) return
    setBusy(it.id); setErr('')
    try {
      const res = await fetch('/api/admin/notify-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId: it.id }),
      })
      const d = (await res.json()) as SendResult
      if (d.error) {
        setErr(d.error)
      } else if (d.note) {
        setDone(p => ({ ...p, [it.id]: d.note as string }))
      } else {
        setDone(p => ({ ...p, [it.id]: `надіслано ${d.sent}${d.failed ? `, не пройшло ${d.failed}` : ''}` }))
        await load()
      }
    } catch {
      setErr('Помилка розсилки')
    }
    setBusy(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: NAVY_DEEP, color: CREAM, fontFamily: FONT, padding: '32px 20px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <h1 style={{ color: GOLD, fontSize: 28, margin: '0 0 8px' }}>Сповістити підписників</h1>
        <p style={{ color: MUTED, lineHeight: 1.6, margin: '0 0 24px' }}>
          Лист про новий твір тим, хто натиснув «стежити за автором».
          Показано лише те, що опубліковане й має автора з підписниками.
          Один твір розсилається один раз.
        </p>

        {err && (
          <div style={{ background: '#3a1a1a', border: '1px solid #a33', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
            {err}
          </div>
        )}

        {!items && <div style={{ color: MUTED }}>Читаю…</div>}

        {items && items.length === 0 && (
          <div style={{ background: NAVY, borderRadius: 14, padding: 20, color: MUTED, lineHeight: 1.6 }}>
            Немає кому надсилати. Це означає, що в жодного автора з опублікованими
            творами поки немає підписників — кнопка «стежити» стоїть на сторінці автора.
          </div>
        )}

        {items && items.map(it => {
          const already = Boolean(it.sent_at)
          const result = done[it.id]
          return (
            <div key={it.id} style={{
              background: NAVY, borderRadius: 12, padding: '14px 18px', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                <div style={{ fontSize: 16, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {it.title}
                </div>
                <div style={{ fontSize: 13, color: MUTED }}>
                  {it.author_name} · {it.followers} {plural(it.followers, 'підписник', 'підписники', 'підписників')} · {dateShort(it.created_at)}
                </div>
              </div>

              {result ? (
                <span style={{ color: GOLD, fontSize: 14 }}>{result}</span>
              ) : already ? (
                <span style={{ color: MUTED, fontSize: 13 }}>
                  розіслано {dateShort(it.sent_at as string)}
                </span>
              ) : (
                <button
                  onClick={() => send(it)}
                  disabled={busy !== null}
                  style={{
                    background: busy === it.id ? 'transparent' : GOLD,
                    color: busy === it.id ? GOLD : NAVY_DEEP,
                    border: `1px solid ${GOLD}`, borderRadius: 9,
                    padding: '9px 18px', fontSize: 14, fontWeight: 600, fontFamily: FONT,
                    cursor: busy ? 'default' : 'pointer', opacity: busy && busy !== it.id ? 0.4 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {busy === it.id ? 'Надсилаю…' : 'Надіслати'}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
