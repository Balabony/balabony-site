'use client'

import { useMemo, useRef, useState } from 'react'
import { shrinkImage } from './AuthorCoverUpload'

/**
 * 11.11.2026: обкладинки до всіх серій одним махом.
 * Автор вибирає кілька фото; номер серії береться з назви файлу (01.jpg, «серія 3.png»),
 * а якщо номера немає — за порядком. Кожне фото йде через той самий /api/author/cover,
 * тож перевірка «це ваш твір» і підтвердження прав — ті самі, що й для однієї серії.
 */

const C = { amber: '#ef9f27', ink: '#f5f0e8', muted: '#b9c6db', line: 'rgba(143,163,196,0.22)', ok: '#7ddca4', bad: '#ff8f8f' }

type Ep = { contentId: string; n: number }

function numberOf(name: string): number | null {
  const m = name.replace(/\.[^.]+$/, '').match(/(\d{1,3})(?!.*\d)/)
  return m ? Number(m[1]) : null
}

export default function AuthorSeriesCovers({ title, episodes }: { title: string; episodes: Ep[] }) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [rights, setRights] = useState(false)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<Record<number, 'ok' | 'err' | 'wait'>>({})
  const [note, setNote] = useState<string | null>(null)
  const input = useRef<HTMLInputElement | null>(null)
  const eps = useMemo(() => [...episodes].sort((a, b) => a.n - b.n), [episodes])

  // Пара «серія → файл». Спершу за номером у назві, решта — за порядком на вільні серії.
  const plan = useMemo(() => {
    const byN = new Map<number, File>()
    const rest: File[] = []
    for (const f of [...files].sort((a, b) => a.name.localeCompare(b.name, 'uk', { numeric: true }))) {
      const n = numberOf(f.name)
      if (n != null && eps.some((e) => e.n === n) && !byN.has(n)) byN.set(n, f)
      else rest.push(f)
    }
    for (const e of eps) if (!byN.has(e.n) && rest.length) byN.set(e.n, rest.shift()!)
    return eps.filter((e) => byN.has(e.n)).map((e) => ({ ...e, file: byN.get(e.n)! }))
  }, [files, eps])

  async function run() {
    if (!rights) { setNote('Підтвердіть права на зображення'); return }
    setBusy(true); setNote(null)
    let ok = 0
    for (const p of plan) {
      setState((s) => ({ ...s, [p.n]: 'wait' }))
      try {
        const fd = new FormData()
        fd.append('content_id', p.contentId)
        fd.append('file', await shrinkImage(p.file))
        fd.append('rights_confirmed', 'yes')
        const r = await fetch('/api/author/cover', { method: 'POST', body: fd })
        const d = (await r.json().catch(() => ({}))) as { ok?: boolean }
        setState((s) => ({ ...s, [p.n]: d.ok ? 'ok' : 'err' }))
        if (d.ok) ok++
      } catch {
        setState((s) => ({ ...s, [p.n]: 'err' }))
      }
    }
    setBusy(false)
    setNote(ok === plan.length ? `Готово: ${ok} обкладинок збережено. Оновіть сторінку, щоб побачити їх у списку.` : `Збережено ${ok} з ${plan.length}. Позначені червоним спробуйте ще раз.`)
  }

  const btn = { fontSize: '0.88rem', fontWeight: 700, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', minHeight: 38 } as const

  return (
    <div style={{ borderTop: `1px solid ${C.line}`, padding: '0.9rem 1.5rem', background: 'rgba(239,159,39,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ color: C.ink, fontWeight: 700 }}>
          {title} <span style={{ color: C.muted, fontWeight: 400 }}>· {eps.length} серій</span>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ ...btn, color: '#1a1206', background: C.amber, border: 'none' }}>
          {open ? 'Згорнути' : 'Обкладинки до всіх серій'}
        </button>
      </div>
      {open && (
        <div style={{ marginTop: 12, color: C.muted, fontSize: '0.9rem', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 10px' }}>
            Виберіть одразу кілька фото (JPG, PNG або WebP). Назвіть файли номерами серій — <strong style={{ color: C.ink }}>01.jpg, 02.jpg…</strong> —
            і кожне стане на свою серію. Якщо номерів у назвах немає, фото підуть за порядком.
          </p>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={busy}
            onChange={(e) => { setFiles(Array.from(e.target.files ?? [])); setState({}); setNote(null) }}
            style={{ color: C.ink, marginBottom: 10 }}
          />
          {plan.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'grid', gap: 4 }}>
              {plan.map((p) => (
                <li key={p.n} style={{ color: C.ink }}>
                  Серія {p.n} ← <span style={{ color: C.muted }}>{p.file.name}</span>{' '}
                  {state[p.n] === 'ok' && <strong style={{ color: C.ok }}>збережено</strong>}
                  {state[p.n] === 'err' && <strong style={{ color: C.bad }}>помилка</strong>}
                  {state[p.n] === 'wait' && <span>завантажую…</span>}
                </li>
              ))}
            </ul>
          )}
          {files.length > plan.length && (
            <p style={{ margin: '0 0 10px', color: C.bad }}>Фото більше, ніж серій: зайві {files.length - plan.length} не використано.</p>
          )}
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '0 0 10px', cursor: 'pointer' }}>
            <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} style={{ marginTop: 4 }} />
            <span>Я маю право використовувати ці зображення (власні фото, згенеровані мною або з дозволу автора).</span>
          </label>
          <button type="button" onClick={run} disabled={busy || plan.length === 0} style={{ ...btn, color: '#1a1206', background: C.amber, border: 'none', opacity: busy || plan.length === 0 ? 0.55 : 1 }}>
            {busy ? 'Завантажую…' : `Зберегти ${plan.length || ''} обкладинок`}
          </button>
          {note && <p role="status" style={{ margin: '10px 0 0', color: note.startsWith('Готово') ? C.ok : C.bad, fontWeight: 600 }}>{note}</p>}
        </div>
      )}
    </div>
  )
}
