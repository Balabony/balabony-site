'use client'

import { useState } from 'react'

/**
 * Форма редакційної оцінки.
 *
 * ТРИ ОПОРНІ ТОЧКИ біля кожного критерію — нуль, половина, максимум — щоб
 * редактори розуміли шкалу однаково. Свідомо НЕ робимо: середніх значень,
 * «рекомендованої оцінки», підказок від ШІ. Половина підсумку в конкурсі —
 * людське рішення.
 *
 * Сума показується тут лише для орієнтиру. У базі вона рахується окремо,
 * тож розійтися з балами не може.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD = '#ef9f27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

type Key = 'plot' | 'language' | 'characters' | 'structure' | 'ending' | 'hook'

const FIELDS: { key: Key; max: number; label: string; hint: string }[] = [
  { key: 'plot',       max: 12, label: 'Сюжет',      hint: 'чи є історія, чи щось відбувається, чи тримає' },
  { key: 'language',   max: 12, label: 'Мова',       hint: 'жива українська; чи не спотикаєшся' },
  { key: 'characters', max: 8,  label: 'Характери',  hint: 'чи люди схожі на людей' },
  { key: 'structure',  max: 8,  label: 'Композиція', hint: 'початок і кінець на місці, без провисань' },
  { key: 'ending',     max: 6,  label: 'Фінал',      hint: 'закриває історію, не обривається' },
  { key: 'hook',       max: 4,  label: 'Гачок',      hint: 'чи хочеться читати далі після першого абзацу' },
]

export interface ExistingScore {
  plot: number; language: number; characters: number
  structure: number; ending: number; hook: number
  comment: string; status: string; total: number
}

export default function ScoreForm({
  entryId, existing,
}: {
  entryId: string
  existing: ExistingScore | null
}) {
  const locked = existing?.status === 'submitted'

  const [vals, setVals] = useState<Record<Key, string>>({
    plot:       existing ? String(existing.plot) : '',
    language:   existing ? String(existing.language) : '',
    characters: existing ? String(existing.characters) : '',
    structure:  existing ? String(existing.structure) : '',
    ending:     existing ? String(existing.ending) : '',
    hook:       existing ? String(existing.hook) : '',
  })
  const [comment, setComment] = useState(existing?.comment ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [saved, setSaved] = useState<string | null>(existing?.status ?? null)

  const total = FIELDS.reduce((s, f) => s + (Number(vals[f.key]) || 0), 0)

  async function save(action: 'draft' | 'submit') {
    if (busy || locked) return
    if (action === 'submit' && !confirm(
      'Подати оцінку? Після подання змінити її не можна.',
    )) return

    setBusy(true); setMsg('')
    try {
      const res = await fetch('/api/editor/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId, action, comment,
          ...Object.fromEntries(FIELDS.map(f => [f.key, Number(vals[f.key])])),
        }),
      })
      const d = await res.json() as { ok: boolean; error?: string; status?: string }
      if (!d.ok) { setMsg(d.error ?? 'Не вдалося зберегти'); return }
      setSaved(d.status ?? action)
      setMsg(d.status === 'submitted' ? 'Оцінку подано.' : 'Чернетку збережено.')
      if (d.status === 'submitted') location.reload()
    } catch {
      setMsg('Немає зв’язку — спробуйте ще раз')
    } finally {
      setBusy(false)
    }
  }

  if (locked) {
    return (
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
                    padding: '1rem 1.1rem', fontFamily: FONT }}>
        <div style={{ fontSize: 13, color: GOLD_L, marginBottom: '.6rem' }}>Ваша оцінка подана</div>
        <div style={{ fontSize: 14, color: CREAM, lineHeight: 1.9 }}>
          {FIELDS.map(f => (
            <div key={f.key}>
              {f.label}: <b>{existing?.[f.key]}</b> з {f.max}
            </div>
          ))}
          <div style={{ marginTop: 8, color: GOLD }}>
            Разом: <b>{existing?.total}</b> з 50
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7, marginTop: '.8rem', marginBottom: 0 }}>
          {existing?.comment}
        </p>
      </div>
    )
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
                  padding: '1rem 1.1rem', fontFamily: FONT }}>
      <div style={{ fontSize: 13, color: GOLD_L, marginBottom: '.2rem' }}>Ваша оцінка</div>
      <p style={{ fontSize: 12.5, color: MUTED, margin: '0 0 1rem', lineHeight: 1.6 }}>
        Цілі числа, без половинок. Нуль — критерій провалений. Половина —
        звичайний рівень. Максимум — так добре, що запам’ятається.
      </p>

      {FIELDS.map(f => (
        <div key={f.key} style={{ display: 'flex', gap: '.8rem', alignItems: 'baseline',
                                  marginBottom: '.7rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 14.5, color: CREAM, minWidth: 110 }}>{f.label}</label>
          <input
            type="number" min={0} max={f.max} step={1}
            value={vals[f.key]}
            onChange={e => setVals({ ...vals, [f.key]: e.target.value })}
            style={{ width: 70, padding: '.4rem .5rem', fontSize: 15, fontFamily: FONT,
                     background: NAVY, color: CREAM, border: `1px solid ${LINE}`,
                     borderRadius: 8 }}
          />
          <span style={{ fontSize: 12.5, color: MUTED }}>
            з {f.max} · {f.hint}
          </span>
        </div>
      ))}

      <div style={{ fontSize: 14.5, color: GOLD, margin: '.9rem 0' }}>
        Разом: <b>{total}</b> з 50
      </div>

      <label style={{ display: 'block', fontSize: 14.5, color: CREAM, marginBottom: '.35rem' }}>
        Коментар для протоколу
      </label>
      <p style={{ fontSize: 12.5, color: MUTED, margin: '0 0 .5rem', lineHeight: 1.6 }}>
        Не для автора. Підсумки підписують усі редактори, і кожен має бачити,
        чому бал саме такий. Щонайменше 40 символів.
      </p>
      <textarea
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={5}
        style={{ width: '100%', boxSizing: 'border-box', padding: '.6rem .7rem',
                 fontSize: 14.5, fontFamily: FONT, lineHeight: 1.6,
                 background: NAVY, color: CREAM, border: `1px solid ${LINE}`,
                 borderRadius: 8, resize: 'vertical' }}
      />
      <div style={{ fontSize: 12, color: comment.trim().length < 40 ? '#eab308' : MUTED,
                    marginTop: 4 }}>
        {comment.trim().length} символів
      </div>

      {msg && (
        <p style={{ fontSize: 13.5, color: msg.includes('не') ? '#ff9b9b' : '#22c55e',
                    margin: '.7rem 0 0' }}>{msg}</p>
      )}

      <div style={{ display: 'flex', gap: '.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => void save('draft')} disabled={busy}
          style={{ font: 'inherit', fontSize: 14.5, background: 'transparent', color: CREAM,
                   border: `1px solid ${LINE}`, borderRadius: 8, padding: '.55rem 1.1rem',
                   cursor: busy ? 'default' : 'pointer' }}
        >
          Зберегти чернетку
        </button>
        <button
          onClick={() => void save('submit')} disabled={busy}
          style={{ font: 'inherit', fontSize: 14.5, fontWeight: 600, background: GOLD,
                   color: '#2a1a02', border: 0, borderRadius: 8, padding: '.55rem 1.2rem',
                   cursor: busy ? 'default' : 'pointer', opacity: busy ? .6 : 1 }}
        >
          Подати оцінку
        </button>
        {saved === 'draft' && (
          <span style={{ fontSize: 12.5, color: MUTED, alignSelf: 'center' }}>
            чернетку збережено — подати можна пізніше
          </span>
        )}
      </div>
    </div>
  )
}
