'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { CONTESTS } from '@/lib/contests'

/**
 * Зведена таблиця оцінок по кожному конкурсу (13.10.2026).
 * Поруч три незалежні оцінки: ШІ (0–100), редактор (0–50, лише подана) і
 * засновник (0–100, ставиться після прочитання, можна змінювати).
 * Контакти автора й редактора — тут же, щоб не шукати пошту окремо.
 * Редактори цієї сторінки не бачать.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628', CARD = '#0f1f38', GOLD = '#ef9f27', CREAM = '#FFF8EE', MUTED = '#8CA0B8', LINE = 'rgba(255,255,255,.10)'
const GREEN = '#5cc98a', AMBER = '#f0b54a', RED = '#ef6b6b'

type Row = {
  id: string; entry_number: number | null; title: string; author_name: string; email: string; phone: string | null
  status: string; episodes: number
  ai_total: number | null; style_index: number | null; orig_verdict: string | null
  editor_total: number | null; editor_name: string | null; editor_email: string | null
  recheck_total: number | null; recheck_name: string | null; recheck_email: string | null
  founder_score: number | null; founder_comment: string | null
  cover_brief: string | null
}
type SortKey = 'number' | 'ai' | 'editor' | 'founder'

const pct = (v: number | null, max: number) => (v === null ? null : Math.round(v / max * 100))
const color = (v: number | null) => (v === null ? MUTED : v >= 75 ? GREEN : v >= 50 ? AMBER : RED)

export default function Page() {
  const [contest, setContest] = useState(CONTESTS[0].id as string)
  const [rows, setRows] = useState<Row[]>([])
  const [err, setErr] = useState('')
  const [sort, setSort] = useState<SortKey>('ai')
  const [draft, setDraft] = useState<Record<string, { score: string; comment: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [covers, setCovers] = useState<Record<string, string>>({})

  const load = useCallback(async (c: string) => {
    setErr('')
    const r = await fetch(`/api/admin/contest-ranking?contest=${encodeURIComponent(c)}`, { cache: 'no-store' })
    if (r.status === 401) { window.location.href = '/admin/login'; return }
    const d = await r.json() as { ok?: boolean; entries?: Row[]; error?: string }
    if (!d.ok) { setErr(d.error ?? 'Помилка'); setRows([]); return }
    const list = d.entries ?? []
    setRows(list)
    setCovers(Object.fromEntries(list.map((x) => [x.id, x.cover_brief ?? ''])))
    setDraft(Object.fromEntries(list.map((x) => [x.id, { score: x.founder_score === null ? '' : String(x.founder_score), comment: x.founder_comment ?? '' }])))
  }, [])

  useEffect(() => { void load(contest) }, [contest, load])

  const save = async (id: string) => {
    const d = draft[id]
    setSaving(id); setErr(''); setSaved(null)
    try {
      const r = await fetch('/api/admin/contest-ranking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, score: Number(d.score), comment: d.comment }),
      })
      const j = await r.json() as { ok?: boolean; error?: string }
      if (!j.ok) { setErr(j.error ?? 'Помилка'); return }
      setSaved(id); void load(contest)
    } finally { setSaving(null) }
  }

  const saveCover = async (id: string) => {
    setSaving('cover' + id); setErr(''); setSaved(null)
    try {
      const r = await fetch('/api/admin/contest-ranking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cover-brief', entryId: id, coverBrief: covers[id] ?? '' }),
      })
      const j = await r.json() as { ok?: boolean; error?: string }
      if (!j.ok) { setErr(j.error ?? 'Помилка'); return }
      setSaved('cover' + id)
    } finally { setSaving(null) }
  }

  const routeAll = async () => {
    setSaving('route'); setErr('')
    try {
      const r = await fetch('/api/admin/contest-ranking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'route-all' }),
      })
      const j = await r.json() as { ok?: boolean; error?: string; routed?: number }
      if (!j.ok) { setErr(j.error ?? 'Помилка'); return }
      setErr(`Скеровано робіт: ${j.routed ?? 0}`); void load(contest)
    } finally { setSaving(null) }
  }

  const val = (r: Row, k: SortKey) =>
    k === 'number' ? -(r.entry_number ?? 9999) : k === 'ai' ? r.ai_total : k === 'editor' ? pct(r.editor_total, 50) : r.founder_score
  const sorted = [...rows].sort((a, b) => (val(b, sort) ?? -1) - (val(a, sort) ?? -1))

  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT, padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Оцінки конкурсів</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.5, margin: '0 0 16px' }}>
          Три незалежні оцінки поруч: ШІ, редактор і ваша. Редактор бачить лише свою. Оцінку ШІ запускає сторінка{' '}
          <a href="/admin/ocinka-shi" style={{ color: GOLD }}>«Оцінка ШІ»</a>, редактора призначають у{' '}
          <a href="/admin/konkursy" style={{ color: GOLD }}>«Конкурсних заявках»</a>. Бал редактора — з 50, у дужках переведено у відсотки.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {CONTESTS.map((c) => (
            <button key={c.id} onClick={() => setContest(c.id)} style={tab(contest === c.id)}>{c.name}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 14, fontSize: 13 }}>
          <span style={{ color: MUTED }}>Сортувати:</span>
          {([['ai', 'за ШІ'], ['editor', 'за редактором'], ['founder', 'за моєю'], ['number', 'за номером']] as [SortKey, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} style={tab(sort === k)}>{l}</button>
          ))}
        </div>

        <div style={{ marginBottom: 14 }}>
          <button disabled={saving !== null} onClick={() => void routeAll()} style={tab(true)}>
            {saving === 'route' ? 'Скеровую…' : 'Скерувати всі нерозподілені'}
          </button>
          <span style={{ color: MUTED, fontSize: 12, marginLeft: 10 }}>
            Нові роботи скеровуються самі при подачі. Кнопка — для старих: дає номер, призначає редактора з найменшим навантаженням і надсилає йому лист.
          </span>
        </div>
        {err && <p style={{ color: RED }}>{err}</p>}
        {!err && rows.length === 0 && <p style={{ color: MUTED }}>У цьому конкурсі заявок поки немає.</p>}

        {sorted.map((r, i) => {
          const d = draft[r.id] ?? { score: '', comment: '' }
          const ed = pct(r.editor_total, 50)
          return (
            <div key={r.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' }}>
                <div style={{ minWidth: 240, flex: '1 1 300px' }}>
                  <div style={{ fontSize: 12, color: MUTED }}>#{i + 1} · робота № {r.entry_number ?? '—'} · заявка {r.id} · {r.status} · серій: {r.episodes}</div>
                  <div style={{ fontSize: 17, fontWeight: 700, margin: '2px 0 6px' }}>{r.title || 'Без назви'}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <b>Автор:</b> {r.author_name || '—'}<br />
                    <a href={`mailto:${r.email}`} style={{ color: GOLD }}>{r.email}</a>
                    {r.phone && <> · <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`} style={{ color: GOLD }}>{r.phone}</a></>}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                    <b>Редактор:</b>{' '}
                    {r.editor_name ? <>{r.editor_name} · <a href={`mailto:${r.editor_email}`} style={{ color: GOLD }}>{r.editor_email}</a></> : <span style={{ color: MUTED }}>не призначено</span>}
                    {r.recheck_name && <><br /><b>Друга думка:</b> {r.recheck_name} · <a href={`mailto:${r.recheck_email}`} style={{ color: GOLD }}>{r.recheck_email}</a></>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <Score label="ШІ" value={r.ai_total === null ? null : `${r.ai_total}/100`} c={color(r.ai_total)} note={[r.style_index !== null ? `ознаки ШІ: ${r.style_index}/100` : '', r.orig_verdict === 'found' ? '⚠ знайдено в інтернеті' : r.orig_verdict === 'unclear' ? 'є схожі в інтернеті' : r.orig_verdict === 'clean' ? 'в інтернеті не знайдено' : ''].filter(Boolean).join(' · ') || undefined} />
                  <Score label="Редактор" value={r.editor_total === null ? null : `${r.editor_total}/50 (${ed}%)`} c={color(ed)}
                    note={r.recheck_total !== null ? `друга думка: ${r.recheck_total}/50` : undefined} />
                  <Score label="Моя" value={r.founder_score === null ? null : `${r.founder_score}/100`} c={color(r.founder_score)} />
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${LINE}` }}>
                <label style={{ fontSize: 13, color: MUTED, paddingTop: 8 }}>Моя оцінка (0–100):</label>
                <input type="number" min={0} max={100} value={d.score}
                  onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, score: e.target.value } })}
                  style={{ ...inp, width: 80 }} />
                <textarea placeholder="Коментар (для себе)" value={d.comment} rows={2}
                  onChange={(e) => setDraft({ ...draft, [r.id]: { ...d, comment: e.target.value } })}
                  style={{ ...inp, flex: '1 1 260px', resize: 'vertical' }} />
                <button disabled={saving !== null || d.score === ''} onClick={() => void save(r.id)} style={tab(true)}>
                  {saving === r.id ? 'Зберігаю…' : 'Зберегти'}
                </button>
                {saved === r.id && <span style={{ color: GREEN, fontSize: 13, paddingTop: 8 }}>Збережено</span>}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start', marginTop: 10 }}>
                <label style={{ fontSize: 13, color: MUTED, paddingTop: 8, minWidth: 150 }}>
                  Герої для обкладинки:{!(covers[r.id] ?? '').trim() && <><br /><span style={{ color: AMBER }}>ще немає</span></>}
                </label>
                <textarea placeholder="Опис від автора (з форми або вставте з його листа)" value={covers[r.id] ?? ''} rows={3}
                  onChange={(e) => setCovers({ ...covers, [r.id]: e.target.value })}
                  style={{ ...inp, flex: '1 1 260px', resize: 'vertical' }} />
                <button disabled={saving !== null} onClick={() => void saveCover(r.id)} style={tab(false)}>
                  {saving === 'cover' + r.id ? 'Зберігаю…' : 'Зберегти опис'}
                </button>
                {saved === 'cover' + r.id && <span style={{ color: GREEN, fontSize: 13, paddingTop: 8 }}>Збережено</span>}
              </div>
            </div>
          )
        })}
      </div>
    </main>
  )
}

function Score({ label, value, c, note }: { label: string; value: string | null; c: string; note?: string }) {
  return (
    <div style={{ minWidth: 110, background: NAVY, border: `1px solid ${LINE}`, borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{value ?? '—'}</div>
      {note && <div style={{ fontSize: 11, color: MUTED }}>{note}</div>}
    </div>
  )
}

const inp: CSSProperties = { fontFamily: FONT, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: `1px solid ${LINE}`, background: NAVY, color: CREAM }
function tab(on: boolean): CSSProperties {
  return { fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: on ? 'none' : `1px solid ${LINE}`, background: on ? GOLD : 'transparent', color: on ? NAVY : CREAM }
}
