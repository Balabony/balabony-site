'use client'

import { useCallback, useEffect, useState } from 'react'
import { CONTESTS, isOpen, acceptsEpisodes } from '@/lib/contests'

/**
 * «Плануєте подати?» — чотири галочки в кабінеті автора.
 *
 * Стоїть під лічильником конкурсів: спершу автор бачить, що відбувається,
 * тоді відповідає. Зберігається одразу, без кнопки «зберегти» — інакше
 * половина поставить галочку і піде, не натиснувши.
 *
 * Показуємо лише конкурси, куди ще можна податися. Питати про закритий
 * конкурс немає сенсу, а відповідь на нього тільки зіпсує підрахунок.
 */

const BRAND = {
  card: '#0f1e3a',
  amber: '#ef9f27',
  amberSoft: '#FAC775',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}

/** Коротка назва — у кабінеті довгі офіційні назви не потрібні. */
const SHORT: Record<string, string> = {
  'ce-dovha-istoriya': 'Це довга історія — серіал, 10 серій',
  'pyat-vechoriv': "П'ять вечорів — 5 серій",
  'odyn-den': 'Один день, який усе змінив — одна історія',
  'z-viterczem': 'З вітерцем — одна історія, гумор',
}

export default function ContestIntent() {
  const [on, setOn] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  const list = CONTESTS.filter(c => isOpen(c) || acceptsEpisodes(c))

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/contest/intent')
      const d = await res.json() as { intents?: string[] }
      setOn(new Set(d.intents ?? []))
    } catch {
      /* мовчки: галочки не критичні для роботи кабінету */
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggle(id: string) {
    if (busy) return
    const next = !on.has(id)

    // Показуємо одразу, повертаємо назад лише якщо сервер не прийняв.
    setOn(prev => {
      const s = new Set(prev)
      if (next) s.add(id); else s.delete(id)
      return s
    })
    setBusy(id); setErr('')

    try {
      const res = await fetch('/api/contest/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contest: id, on: next }),
      })
      const d = await res.json() as { ok?: boolean; error?: string }
      if (!d.ok) throw new Error(d.error ?? 'не збережено')
    } catch (e) {
      setOn(prev => {
        const s = new Set(prev)
        if (next) s.delete(id); else s.add(id)
        return s
      })
      setErr((e as Error).message === 'не збережено'
        ? 'Не вдалося зберегти. Спробуйте ще раз.'
        : 'Немає зв’язку. Спробуйте ще раз.')
    } finally {
      setBusy(null)
    }
  }

  if (list.length === 0) return null

  return (
    <div style={{
      background: BRAND.card,
      border: `1px solid ${BRAND.line}`,
      borderRadius: 14,
      padding: '1.1rem 1.4rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{
        fontSize: '0.85rem', color: BRAND.amber, fontWeight: 700,
        letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.5rem',
      }}>
        Плануєте подати?
      </div>
      <p style={{ color: BRAND.muted, fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 0.9rem' }}>
        Позначте конкурси, на які збираєтеся подати твір. Це не заявка й не
        бронювання місця — подавати все одно треба через сторінку подачі,
        а галочку можна зняти будь-коли. Нам це потрібно, щоб знати наперед,
        скільки текстів чекати на редактуру.
      </p>

      {list.map(c => {
        const checked = on.has(c.id)
        return (
          <label
            key={c.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '0.5rem 0', cursor: ready ? 'pointer' : 'default',
              color: BRAND.text, fontSize: '0.93rem', lineHeight: 1.5,
              opacity: busy === c.id ? 0.55 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={!ready || busy === c.id}
              onChange={() => void toggle(c.id)}
              style={{ marginTop: 3, width: 17, height: 17, accentColor: BRAND.amber, flex: 'none' }}
            />
            <span style={{ color: checked ? BRAND.amberSoft : BRAND.text }}>
              {SHORT[c.id] ?? c.name}
            </span>
          </label>
        )
      })}

      {err && (
        <p style={{ color: '#ff9b9b', fontSize: '0.85rem', margin: '0.6rem 0 0' }}>{err}</p>
      )}
    </div>
  )
}
