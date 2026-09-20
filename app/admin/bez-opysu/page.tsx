'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * /admin/bez-opysu — описи історій для стрічки UKR.NET (20.09.2026).
 *
 * UKR.NET бере лише новини з коротким змістом на 3–4 речення без HTML.
 * Історії без опису у стрічку /feed/ukrnet.xml не потрапляють. Тут редактор
 * бачить їх (найсвіжіші зверху) і пише опис; після збереження історія
 * з'являється у стрічці протягом 30 хвилин (кеш стрічки).
 *
 * ШІ лише пропонує чернетки (кнопка «Запропонувати» або «Чернетки для 20»):
 * три варіанти на історію. Зберігає тільки редактор — після перевірки й правки.
 * Спойлерів і фіналу не розкриваємо — лише зав'язка.
 */

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'
const MIN = 80
const MAX = 400

type Item = { id: string; slug: string; title: string; author: string | null; date: string | null; current: string }
type Data = { readyCount: number; inFeed: number; missing: Item[] }

const sentences = (t: string) => (t.match(/[^.!?…]+[.!?…]+/g) || []).length

function fmt(d: string | null) {
  if (!d) return ''
  const x = new Date(d)
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BezOpysuPage() {
  const [data, setData] = useState<Data | null>(null)
  const [err, setErr] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState(0)
  const [variants, setVariants] = useState<Record<string, string[]>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null)
  const [aiNote, setAiNote] = useState<Record<string, string>>({})

  // Три чернетки від ШІ для однієї історії. Перша одразу лягає в поле — редактор її перевіряє.
  const suggest = useCallback(async (item: Item, fill: boolean) => {
    setBusy((b) => ({ ...b, [item.id]: true }))
    setAiNote((n) => ({ ...n, [item.id]: '' }))
    try {
      const res = await fetch('/api/admin/suggest-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      const json = await res.json() as { ok?: boolean; variants?: string[]; error?: string }
      if (!json.ok || !json.variants?.length) throw new Error(json.error || 'помилка')
      setVariants((v) => ({ ...v, [item.id]: json.variants! }))
      if (fill) setDrafts((d) => (d[item.id]?.trim() ? d : { ...d, [item.id]: json.variants![0] }))
    } catch (e) {
      setAiNote((n) => ({ ...n, [item.id]: String((e as Error).message || e) }))
    }
    setBusy((b) => ({ ...b, [item.id]: false }))
  }, [])

  async function suggestBatch() {
    if (!data) return
    const list = data.missing.filter((m) => !variants[m.id]).slice(0, 20)
    setBatch({ done: 0, total: list.length })
    for (const [i, item] of list.entries()) {
      await suggest(item, true)
      setBatch({ done: i + 1, total: list.length })
    }
    setBatch(null)
  }

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/bez-opysu', { cache: 'no-store' })
      if (res.status === 401) { setErr('Потрібен вхід в адмінку'); return }
      const json = await res.json()
      if (!res.ok) { setErr(json.error || 'Не вдалося завантажити'); return }
      setData(json as Data)
      setErr('')
    } catch {
      setErr('Не вдалося завантажити')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function save(item: Item) {
    const text = (drafts[item.id] ?? '').replace(/\s+/g, ' ').trim()
    if (text.length < MIN) return
    setSaving(item.id)
    try {
      const res = await fetch(`/api/admin/content/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ short_description: text }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'помилка')
      setData((d) => d && { ...d, readyCount: d.readyCount + 1, inFeed: Math.min(d.readyCount + 1, 50), missing: d.missing.filter((m) => m.id !== item.id) })
      setSaved((n) => n + 1)
    } catch (e) {
      alert('Не збереглося: ' + String(e))
    }
    setSaving(null)
  }

  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 20px 90px' }}>
        <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Описи для ukr.net</h1>
        <p style={{ color: MUTED, margin: '8px 0 20px', lineHeight: 1.6 }}>
          У стрічку <a href="/feed/ukrnet.xml" target="_blank" rel="noreferrer" style={{ color: GOLD }}>ukr.net</a>{" "}потрапляють
          лише історії з описом: 3–4 речення про зав&apos;язку, без фіналу й спойлерів, без HTML. Після збереження історія
          з&apos;явиться у стрічці протягом 30 хвилин.
        </p>

        {err && <p style={{ color: '#ff8a80' }}>{err}</p>}
        {!data && !err && <p style={{ color: MUTED }}>Завантаження…</p>}

        {data && (
          <>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '0 0 24px' }}>
              {[
                ['Готові до ukr.net', data.readyCount],
                ['Без опису', data.missing.length],
                ['Додано зараз', saved],
              ].map(([k, v]) => (
                <div key={k as string} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 16px', minWidth: 150 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>{v}</div>
                  <div style={{ fontSize: 13, color: MUTED }}>{k}</div>
                </div>
              ))}
            </div>
            {data.missing.length > 0 && (
              <p style={{ margin: '0 0 20px' }}>
                <button type="button" onClick={suggestBatch} disabled={!!batch}
                  style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '9px 16px', fontWeight: 700, cursor: batch ? 'wait' : 'pointer', font: 'inherit' }}>
                  {batch ? `Готую чернетки… ${batch.done} / ${batch.total}` : 'Чернетки ШІ для 20 найсвіжіших'}
                </button>
                <span style={{ color: MUTED, fontSize: 13, marginLeft: 12 }}>Нічого не зберігається без вашої перевірки.</span>
              </p>
            )}
            {data.readyCount < 15 && (
              <p style={{ color: MUTED, fontSize: 14, margin: '-8px 0 24px' }}>
                Для заявки в ukr.net бажано щонайменше 15–20 готових історій зі свіжими датами.
              </p>
            )}

            {data.missing.map((item) => {
              const val = drafts[item.id] ?? item.current
              const len = val.replace(/\s+/g, ' ').trim().length
              const n = sentences(val)
              const ok = len >= MIN && len <= MAX && !/[<>]/.test(val)
              return (
                <section key={item.id} style={{ background: NAVY, border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
                    <a href={`/stories/${item.slug}`} target="_blank" rel="noreferrer" style={{ color: CREAM, fontWeight: 700, fontSize: 17 }}>
                      {item.title}
                    </a>
                    <span style={{ color: MUTED, fontSize: 13 }}>{item.author || 'Автор не вказаний'} · {fmt(item.date)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                    <button type="button" onClick={() => suggest(item, !val.trim())} disabled={busy[item.id]}
                      style={{ background: 'transparent', color: GOLD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 12px', cursor: busy[item.id] ? 'wait' : 'pointer', font: 'inherit', fontSize: 13 }}>
                      {busy[item.id] ? 'Думаю…' : variants[item.id] ? 'Ще варіанти' : 'Запропонувати'}
                    </button>
                    {(variants[item.id] ?? []).map((v, i) => (
                      <button key={i} type="button" onClick={() => setDrafts((d) => ({ ...d, [item.id]: v }))}
                        title={v}
                        style={{ background: val === v ? GOLD : 'transparent', color: val === v ? NAVY_DEEP : MUTED, border: `1px solid ${LINE}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer', font: 'inherit', fontSize: 13 }}>
                        Варіант {i + 1}
                      </button>
                    ))}
                    {variants[item.id] && <span style={{ fontSize: 12, color: MUTED }}>чернетка ШІ — перевірте факти й спойлери</span>}
                    {aiNote[item.id] && <span style={{ fontSize: 12, color: '#ff8a80' }}>{aiNote[item.id]}</span>}
                  </div>
                  <textarea
                    aria-label={`Опис історії «${item.title}»`}
                    value={val}
                    maxLength={MAX}
                    rows={4}
                    onChange={(e) => setDrafts((d) => ({ ...d, [item.id]: e.target.value }))}
                    placeholder="Про що історія: герой, місце, зав'язка. 3–4 речення без фіналу."
                    style={{ width: '100%', marginTop: 10, background: NAVY_DEEP, color: CREAM, border: `1px solid ${LINE}`, borderRadius: 8, padding: 10, font: 'inherit', fontSize: 15, lineHeight: 1.5, resize: 'vertical' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, color: ok ? '#8fd694' : MUTED }}>
                      {len} / {MAX} знаків · речень: {n}{len < MIN ? ` · ще ${MIN - len} знаків до мінімуму` : ''}{/[<>]/.test(val) ? ' · прибрати символи < >' : ''}
                    </span>
                    <button
                      type="button"
                      disabled={!ok || saving === item.id}
                      onClick={() => save(item)}
                      style={{ background: ok ? GOLD : 'transparent', color: ok ? NAVY_DEEP : MUTED, border: `1px solid ${ok ? GOLD : LINE}`, borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: ok ? 'pointer' : 'not-allowed', font: 'inherit' }}
                    >
                      {saving === item.id ? 'Зберігаю…' : 'Зберегти опис'}
                    </button>
                  </div>
                </section>
              )
            })}
            {data.missing.length === 0 && <p style={{ color: '#8fd694' }}>Усі історії мають опис.</p>}
          </>
        )}
      </div>
    </main>
  )
}
