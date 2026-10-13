'use client'

import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { findContest } from '@/lib/contests'
import type { ReviewResult } from '@/lib/contest-ai-review'
import { indexBand } from '@/app/components/AiStyleReport'

/**
 * Оцінка конкурсних творів ШІ — паралельна й незалежна від редакторів.
 * Кожна вимога з умов конкурсу отримує окремий бал 0–10 з поясненням і
 * цитатами; окремо — граматика й стилістика. Обсяги рахує код, не модель.
 * Редактори цієї сторінки не бачать.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628', CARD = '#0f1f38', GOLD = '#ef9f27', CREAM = '#FFF8EE', MUTED = '#8CA0B8', LINE = 'rgba(255,255,255,.10)'
const GREEN = '#5cc98a', AMBER = '#f0b54a', RED = '#ef6b6b'

type Entry = { id: string; contest: string; title: string; status: string; created_at: string; episodes: number; words: number; ai_total: number | null; ai_at: string | null; style_index: number | null; style_at: string | null; orig_verdict: string | null; orig_matches: number | null }
type Review = { id: string; entry_id: string; total: number; words: number; model: string; result: ReviewResult; created_at: string }

const color = (s: number | null, max = 10) => s === null ? MUTED : s / max >= 0.75 ? GREEN : s / max >= 0.5 ? AMBER : RED
const date = (s: string) => new Date(s).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Page() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const [review, setReview] = useState<Review | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/contest-ai-review', { cache: 'no-store' })
    if (r.status === 401) { window.location.href = '/admin/login'; return }
    const d = await r.json() as { ok?: boolean; entries?: Entry[]; error?: string }
    if (!d.ok) { setErr(d.error ?? 'Помилка'); return }
    setEntries(d.entries ?? [])
  }, [])

  useEffect(() => { void load() }, [load])

  const show = async (id: string) => {
    if (open === id) { setOpen(null); setReview(null); return }
    setOpen(id); setReview(null); setErr('')
    const r = await fetch(`/api/admin/contest-ai-review?entry=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const d = await r.json() as { review?: Review | null }
    setReview(d.review ?? null)
  }

  const run = async (id: string, force: boolean) => {
    setBusy(id); setErr('')
    try {
      const r = await fetch('/api/admin/contest-ai-review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, force }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; review?: Review }
      if (!d.ok || !d.review) { setErr(d.error ?? 'Помилка'); return }
      setOpen(id); setReview(d.review); void load()
    } catch {
      setErr('Немає звʼязку з сервером. Довгий серіал оцінюється до 3 хвилин — оновіть сторінку пізніше.')
    } finally { setBusy(null) }
  }

  // Ознаки ШІ — наявна «ШІ-перевірка» (source = 'contest'). Окремий показник,
  // у бал відповідності умовам НЕ входить: за правилами це привід для розмови
  // з автором (14 днів зняти сумнів), а не вирок.
  const runStyle = async (id: string) => {
    setBusy('s' + id); setErr('')
    try {
      const r = await fetch('/api/admin/ai-style-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'contest', id }),
      })
      const d = await r.json() as { ok?: boolean; error?: string }
      if (!d.ok) { setErr(d.error ?? 'Помилка'); return }
      void load()
    } catch {
      setErr('Немає звʼязку з сервером. Оновіть сторінку за хвилину.')
    } finally { setBusy(null) }
  }

  type Orig = { verdict: string; created_at: string; result: { matches: { phrase: string; url: string; title: string; note: string }[]; summary: string; phrases: string[] } }
  const [orig, setOrig] = useState<Record<string, Orig | null>>({})
  const runOrig = async (id: string) => {
    setBusy('o' + id); setErr('')
    try {
      const r = await fetch('/api/admin/contest-originality', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id, force: true }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; check?: Orig }
      if (!d.ok || !d.check) { setErr(d.error ?? 'Помилка'); return }
      setOrig({ ...orig, [id]: d.check }); void load()
    } catch {
      setErr('Немає звʼязку з сервером. Оновіть сторінку за хвилину.')
    } finally { setBusy(null) }
  }
  const showOrig = async (id: string) => {
    if (orig[id]) { setOrig({ ...orig, [id]: null }); return }
    const r = await fetch(`/api/admin/contest-originality?entry=${encodeURIComponent(id)}`, { cache: 'no-store' })
    const d = await r.json() as { check?: Orig | null }
    if (d.check) setOrig({ ...orig, [id]: d.check })
  }

  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT, padding: '24px 16px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 6px' }}>Оцінка конкурсних творів ШІ</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>
          Паралельна й незалежна оцінка: кожна вимога з умов конкурсу — окремий бал 0–10 з поясненням і цитатами,
          плюс граматика й стилістика. Обсяги й кількість серій рахує програма, а не модель. Редактори цієї оцінки не бачать.
          Ознаки ШІ в тексті показуємо окремим рядком у картці — з «ШІ-перевірки»; у бал відповідності вони не входять. Новизну твору (чи не публікувався деінде) програма не перевіряє.
          ШІ теж може помилятися: кожен бал має пояснення й цитату, щоб його можна було перевірити.
        </p>
        {err && <p style={{ color: RED, fontSize: 14 }}>{err}</p>}

        {entries.length === 0 && !err && <p style={{ color: MUTED }}>Конкурсних заявок поки немає.</p>}

        {entries.map((e) => {
          const c = findContest(e.contest)
          return (
            <div key={e.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: GOLD }}>{c?.name ?? e.contest}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{e.title || 'Без назви'}</div>
                  <div style={{ fontSize: 12, color: MUTED }}>
                    Заявка № {e.id} · серій: {e.episodes} · слів: {e.words} · статус: {e.status}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {e.ai_total !== null && (
                    <span style={{ fontWeight: 700, fontSize: 18, color: color(e.ai_total, 100) }}>{e.ai_total}/100</span>
                  )}
                  {e.ai_total !== null && <button onClick={() => void show(e.id)} style={btn(false)}>{open === e.id ? 'Згорнути' : 'Відкрити'}</button>}
                  <button disabled={busy !== null} onClick={() => void run(e.id, e.ai_total !== null)} style={btn(true)}>
                    {busy === e.id ? 'Оцінюю… (до 3 хв)' : e.ai_total === null ? 'Оцінити' : 'Оцінити заново'}
                  </button>
                </div>
              </div>
              {e.ai_at && <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>Остання оцінка: {date(e.ai_at)}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${LINE}`, fontSize: 13 }}>
                <span style={{ color: MUTED }}>Ознаки ШІ в тексті (окремо, у бал не входить):</span>
                {e.style_index !== null
                  ? <span style={{ fontWeight: 700, color: indexBand(e.style_index)[1] }}>концентрація {indexBand(e.style_index)[0]} · {e.style_index}/100</span>
                  : <span style={{ color: MUTED }}>ще не перевіряли</span>}
                {e.style_index !== null && <a href={`/admin/shi-perevirka?source=contest&id=${encodeURIComponent(e.id)}`} style={{ color: GOLD, fontSize: 13 }}>повний звіт</a>}
                <button disabled={busy !== null} onClick={() => void runStyle(e.id)} style={btn(false)}>
                  {busy === 's' + e.id ? 'Перевіряю…' : e.style_index === null ? 'Перевірити' : 'Перевірити заново'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: `1px dashed ${LINE}`, fontSize: 13 }}>
                <span style={{ color: MUTED }}>Публікація в інших онлайн-медіа:</span>
                {e.orig_verdict === null
                  ? <span style={{ color: MUTED }}>ще не перевіряли</span>
                  : e.orig_verdict === 'clean'
                    ? <span style={{ fontWeight: 700, color: GREEN }}>збігів не знайдено</span>
                    : <span style={{ fontWeight: 700, color: e.orig_verdict === 'found' ? RED : AMBER }}>{e.orig_verdict === 'found' ? 'ЗНАЙДЕНО' : 'є схожі'} · {e.orig_matches ?? 0}</span>}
                {e.orig_verdict !== null && <button onClick={() => void showOrig(e.id)} style={btn(false)}>{orig[e.id] ? 'Згорнути' : 'Деталі'}</button>}
                <button disabled={busy !== null} onClick={() => void runOrig(e.id)} style={btn(false)}>
                  {busy === 'o' + e.id ? 'Шукаю… (до 2 хв)' : e.orig_verdict === null ? 'Перевірити' : 'Перевірити заново'}
                </button>
              </div>
              {orig[e.id] && (
                <div style={{ fontSize: 13, lineHeight: 1.55, marginTop: 8, padding: 10, background: NAVY, borderRadius: 8 }}>
                  <p style={{ margin: '0 0 6px' }}>{orig[e.id]!.result.summary}</p>
                  {orig[e.id]!.result.matches.map((m, k) => (
                    <div key={k} style={{ borderTop: `1px solid ${LINE}`, padding: '6px 0' }}>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>{m.title || m.url}</a>
                      <span style={{ color: MUTED }}> — {m.note}</span>
                      <div style={{ color: MUTED, fontStyle: 'italic' }}>«{m.phrase}»</div>
                    </div>
                  ))}
                  <p style={{ color: MUTED, fontSize: 12, margin: '6px 0 0' }}>
                    Шукали {orig[e.id]!.result.phrases.length} фраз з тексту. Пошук бачить лише відкриті сторінки: платні розділи, закриті групи й Telegram — ні.
                    Публікація на власних ресурсах автора й у паперовій газеті умовами дозволена — рішення за вами.
                  </p>
                </div>
              )}
              {open === e.id && review && <ReviewView r={review} />}
            </div>
          )
        })}
      </div>
    </main>
  )
}

function btn(primary: boolean): CSSProperties {
  return {
    fontFamily: FONT, fontSize: 13, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
    border: primary ? 'none' : `1px solid ${LINE}`, background: primary ? GOLD : 'transparent', color: primary ? NAVY : CREAM,
  }
}

function ReviewView({ r }: { r: Review }) {
  const res = r.result
  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}`, paddingTop: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: color(res.total, 100) }}>{res.total}/100</span>
        <span style={{ color: MUTED, fontSize: 12 }}>{date(r.created_at)} · {r.model}</span>
      </div>
      {res.summary && <p style={{ fontSize: 14, lineHeight: 1.55, margin: '8px 0 14px' }}>{res.summary}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ color: MUTED, textAlign: 'left' }}>
            <th style={th}>Вимога</th><th style={{ ...th, width: 70 }}>Бал</th><th style={th}>Пояснення</th>
          </tr>
        </thead>
        <tbody>
          {res.items.map((i) => (
            <tr key={i.id} style={{ borderTop: `1px solid ${LINE}`, verticalAlign: 'top' }}>
              <td style={td}>
                {i.label}
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{i.source === 'code' ? 'пораховано програмою' : 'оцінка ШІ'}</div>
              </td>
              <td style={{ ...td, fontWeight: 700, color: color(i.score) }}>{i.score === null ? '—' : `${i.score}/10`}</td>
              <td style={td}>
                {i.comment}
                {i.quotes.map((q, k) => <div key={k} style={{ color: MUTED, fontStyle: 'italic', marginTop: 4 }}>«{q}»</div>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Issues title="Граматика: помилки" list={res.grammar.issues} />
      <Issues title="Стилістика: що поправити" list={res.style.issues} />

      {res.unverified_quotes.length > 0 && (
        <p style={{ fontSize: 12, color: AMBER, marginTop: 12 }}>
          Цитат, яких немає в тексті, прибрано з оцінки: {res.unverified_quotes.length}. Пункти з ними перевірте вручну.
        </p>
      )}
    </div>
  )
}

function Issues({ title, list }: { title: string; list: { quote: string; fix: string; note: string }[] }) {
  if (!list.length) return null
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{title} ({list.length})</div>
      {list.map((i, k) => (
        <div key={k} style={{ fontSize: 13, lineHeight: 1.5, padding: '6px 0', borderTop: `1px solid ${LINE}` }}>
          <span style={{ color: RED }}>«{i.quote}»</span> → <span style={{ color: GREEN }}>{i.fix}</span>
          {i.note && <span style={{ color: MUTED }}> — {i.note}</span>}
        </div>
      ))}
    </div>
  )
}

const th: CSSProperties = { padding: '6px 8px', fontWeight: 600 }
const td: CSSProperties = { padding: '8px', lineHeight: 1.5 }
