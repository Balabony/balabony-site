'use client'
import { useCallback, useEffect, useState } from 'react'

/** Автор тижня на головній: обрати з кандидатів (багато творів, немає в рейтингу) — 21.10.2026. */
type C = { user_id: string; slug: string; name: string; works: number; reads7: number; avatar: boolean; bio: boolean; last?: string | null }
type D = { weekStart: string; week: { slug: string; name: string | null; chosen_by: string } | null; current: string; candidates: C[] }
const GOLD = '#ef9f27', NAVY = '#0f1e3a', CREAM = '#f5f0e8', MUTED = '#b9c6db', FONT = "'Montserrat', Arial, sans-serif"
export default function AvtorTyzhnia() {
  const [d, setD] = useState<D | null>(null), [err, setErr] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState('')
  const load = useCallback(async () => {
    const r = await fetch('/api/admin/featured-author', { cache: 'no-store' }); const j = await r.json().catch(() => ({}))
    if (r.ok) setD(j as D); else setErr((j as { error?: string }).error || 'Помилка')
  }, [])
  useEffect(() => { void load() }, [load])
  const pick = async (c: C) => {
    setBusy(c.user_id); setMsg('')
    const r = await fetch('/api/admin/featured-author', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(c) })
    setBusy(''); if (r.ok) { setMsg(`✓ ${c.name} — автор тижня. Головна оновиться за хвилину.`); void load() } else setMsg('Не вдалося зберегти.')
  }
  const wk = d ? new Date(d.weekStart + 'T12:00:00').toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' }) : ''
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 20px 60px', fontFamily: FONT, color: CREAM }}>
      <h1 style={{ color: GOLD, fontSize: 26, margin: '0 0 6px' }}>Автор тижня</h1>
      <p style={{ color: MUTED, margin: '0 0 18px' }}>Блок «Знайомтеся: автор тижня» на головній. Кандидати — автори з багатьма творами, яких немає в топ-10 прочитань за тиждень і яких не показували пів року. Якщо до середи нікого не обрати — сайт поставить першого кандидата сам.</p>
      {err && <p style={{ color: '#ef6b6b' }}>{err}</p>}
      {d && (
        <div style={{ background: NAVY, borderRadius: 12, padding: 16, marginBottom: 18, border: '1px solid rgba(239,159,39,.35)' }}>
          <p style={{ margin: 0 }}>Тиждень з <b>{wk}</b>: {d.week ? <><b style={{ color: GOLD }}>{d.week.name || d.week.slug}</b> ({d.week.chosen_by === 'auto' ? 'поставлено автоматично' : 'обрано вами'})</> : <>ще не обрано — зараз на головній <b>{d.current}</b></>}. <a href={`/avtor/${d.week?.slug || d.current}`} style={{ color: GOLD }}>Сторінка автора →</a></p>
        </div>
      )}
      {msg && <p role="status" style={{ color: '#7ee2a0', fontWeight: 600 }}>{msg}</p>}
      {d && <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {d.candidates.map((c, i) => (
          <li key={c.user_id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: NAVY, borderRadius: 10, padding: '10px 14px' }}>
            <span style={{ color: GOLD, fontWeight: 700, minWidth: 22 }}>{i + 1}</span>
            <span style={{ flex: '1 1 260px', minWidth: 0 }}>
              <a href={`/avtor/${c.slug}`} target="_blank" rel="noreferrer" style={{ color: CREAM, fontWeight: 700 }}>{c.name}</a>
              <span style={{ display: 'block', color: MUTED, fontSize: 13 }}>{c.works} творів · {c.reads7} прочитань за 7 днів · {c.avatar ? 'є фото' : 'без фото'} · {c.bio ? 'є опис' : 'без опису'}{c.last ? ` · був автором тижня ${c.last}` : ''}</span>
            </span>
            <button type="button" disabled={busy === c.user_id || d.week?.slug === c.slug} onClick={() => void pick(c)} style={{ font: 'inherit', fontWeight: 700, background: GOLD, color: '#0a1628', border: 0, borderRadius: 999, padding: '8px 16px', cursor: 'pointer', opacity: d.week?.slug === c.slug ? 0.5 : 1 }}>{d.week?.slug === c.slug ? 'Автор тижня' : 'Зробити автором тижня'}</button>
          </li>
        ))}
      </ol>}
    </main>
  )
}
