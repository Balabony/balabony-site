'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Конкурсні заявки — окремий розділ адмінки.
 *
 * До 12.09.2026 надіслане через /konkursy/podaty не читав ніхто: таблиці
 * заповнювалися й лежали. Ця сторінка — єдине місце, де видно, що прийшло.
 *
 * Що вона робить і чого свідомо НЕ робить:
 *   робить  — показує заявки по конкурсах, дає прочитати серії підряд,
 *             приймає й відхиляє, а при прийманні створює чернетки в
 *             content і звʼязує їх із заявкою;
 *   не робить — не публікує. Приймання ставить статус `draft`, далі текст
 *             іде звичайною чергою редактури («На редактурі», правопис,
 *             AI-перегляд), тими самими інструментами, що й усі твори.
 *             Другий конвеєр поруч із наявним був би помилкою.
 *
 * Тексти серій тягнемо ЛИШЕ для розгорнутої заявки, окремим запитом:
 * десять серій по 1800 слів у кожній із десятків заявок — це мегабайти,
 * які нікому не потрібні, поки їх не відкрили.
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628'
const CARD = '#0f1f38'
const GOLD = '#ef9f27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

type Entry = {
  id: string
  author_name: string
  email: string
  contest: string
  title: string
  annotation: string
  genre: string
  status: string
  created_at: string
  episodes: number
  words: number
  published: number
  counted: number
}

type Episode = {
  id: string
  ord: number
  words: number
  filename: string
  body: string
  content_id: string | null
  slug: string | null
  content_status: string | null
  publish_at: string | null
}

type Stages = {
  publishFrom:  string | null
  publishUntil: string | null
  reviewUntil:  string | null
  scoresUntil:  string | null
  resultsAt:    string | null
}

type Stat = {
  id: string
  name: string
  episodesNeed: number
  threshold: number
  opensAt: string
  closesAt: string
  stages: Stages
  entries: number
  accepted: number
  rejected: number
  fresh: number
  episodes: number
  published: number
}

const STATUS_LABEL: Record<string, string> = {
  new:      'нова',
  accepted: 'прийнята',
  rejected: 'відхилена',
}

const STATUS_COLOR: Record<string, string> = {
  new:      '#eab308',
  accepted: '#22c55e',
  rejected: '#ef4444',
}

/** Дата у вигляді 25.11.2026, або «не задано», якщо її ще немає. */
function stageLabel(iso: string | null): string {
  if (!iso) return 'не задано'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const STAGE_TITLES: Array<[keyof Stages, string]> = [
  ['publishFrom',  'перша серія'],
  ['publishUntil', 'остання серія'],
  ['reviewUntil',  'редактори дочитали'],
  ['scoresUntil',  'бали виставлені'],
  ['resultsAt',    'підсумки'],
]

function dateLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('uk-UA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function AdminKonkursyPage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [stats, setStats] = useState<Stat[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [openEp, setOpenEp] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (entryId?: string) => {
    setErr('')
    try {
      const url = entryId
        ? `/api/admin/konkursy?entry=${encodeURIComponent(entryId)}`
        : '/api/admin/konkursy'
      const res = await fetch(url)
      const d = await res.json()
      if (!res.ok || !d.ok) {
        setErr(d?.error || 'Не вдалося завантажити')
        return
      }
      setEntries(d.entries as Entry[])
      setStats(d.stats as Stat[])
      if (entryId) setEpisodes(d.episodes as Episode[])
    } catch {
      setErr('Немає звʼязку із сервером')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function open(id: string) {
    if (openId === id) { setOpenId(null); setEpisodes([]); return }
    setOpenId(id)
    setOpenEp(null)
    setEpisodes([])
    await load(id)
  }

  async function act(entryId: string, action: 'accept' | 'reject' | 'reset') {
    if (action === 'accept' && !confirm(
      'Прийняти заявку? Кожна серія стане чернеткою твору в каталозі. ' +
      'Публікації не буде — далі текст іде на редактуру.',
    )) return

    setBusy(true)
    setErr('')
    try {
      const res = await fetch('/api/admin/konkursy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, action }),
      })
      const d = await res.json()
      if (!res.ok || !d.ok) {
        setErr(d?.error || 'Дія не виконалася')
        return
      }
      await load(openId ?? undefined)
    } catch {
      setErr('Немає звʼязку із сервером')
    } finally {
      setBusy(false)
    }
  }

  const shown = filter ? entries.filter(e => e.contest === filter) : entries

  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '24px 18px 80px', fontFamily: FONT, color: CREAM }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, color: GOLD_L, fontWeight: 600, margin: '0 0 .3rem' }}>
          Конкурсні заявки
        </h1>
        <p style={{ color: MUTED, fontSize: 13.5, margin: '0 0 1.2rem', lineHeight: 1.6 }}>
          Приймання створює чернетки творів у каталозі й повʼязує їх із заявкою.
          Публікації не відбувається: далі текст іде звичайною чергою редактури.
        </p>

        {err && (
          <p style={{ color: '#ff9b9b', background: 'rgba(255,60,60,.08)',
                      border: '1px solid rgba(255,60,60,.3)', borderRadius: 8,
                      padding: '.6rem .8rem' }}>{err}</p>
        )}

        {/* ── Зведення по конкурсах ─────────────────────────────── */}
        <div style={{ display: 'grid', gap: '.7rem', marginBottom: '1.4rem',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {stats.map(s => (
            <button
              key={s.id}
              onClick={() => setFilter(filter === s.id ? '' : s.id)}
              style={{
                textAlign: 'left', cursor: 'pointer', font: 'inherit',
                background: filter === s.id ? 'rgba(239,159,39,.12)' : CARD,
                border: `1px solid ${filter === s.id ? 'rgba(239,159,39,.55)' : LINE}`,
                borderRadius: 10, padding: '.7rem .85rem', color: CREAM,
              }}
            >
              <div style={{ fontSize: 13, color: GOLD_L, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.7 }}>
                Заявок: <b style={{ color: CREAM }}>{s.entries}</b>
                {' · '}нових: <b style={{ color: CREAM }}>{s.fresh}</b>
                <br />
                Прийнято: <b style={{ color: CREAM }}>{s.accepted}</b>
                {' · '}відхилено: <b style={{ color: CREAM }}>{s.rejected}</b>
                <br />
                Серій: <b style={{ color: CREAM }}>{s.episodes}</b>
                {' · '}у каталозі: <b style={{ color: CREAM }}>{s.published}</b>
                <br />
                Поріг {s.threshold} подолали:{' '}
                <b style={{ color: CREAM }}>
                  {entries.filter(e => e.contest === s.id && e.counted >= s.threshold).length}
                </b>
              </div>

              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${LINE}`,
                            fontSize: 11.5, color: MUTED, lineHeight: 1.65 }}>
                <div>прийом: {stageLabel(s.opensAt)} — {stageLabel(s.closesAt)}</div>
                {STAGE_TITLES.map(([k, label]) => (
                  <div key={k}>
                    {label}:{' '}
                    <span style={{ color: s.stages[k] ? CREAM : '#eab308' }}>
                      {stageLabel(s.stages[k])}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        {loading && <p style={{ color: MUTED }}>Завантажую…</p>}

        {!loading && shown.length === 0 && (
          <p style={{ color: MUTED }}>
            {filter ? 'У цьому конкурсі заявок немає.' : 'Заявок поки немає.'}
          </p>
        )}

        {/* ── Заявки ───────────────────────────────────────────── */}
        {shown.map(e => {
          const st = stats.find(x => x.id === e.contest)
          const need = st?.episodesNeed ?? 0
          const late = Boolean(st && e.created_at.slice(0, 10) > st.closesAt)
          return (
          <div key={e.id} style={{ background: CARD, border: `1px solid ${LINE}`,
                                   borderRadius: 12, padding: '.85rem 1rem', marginBottom: '.7rem' }}>
            <div style={{ display: 'flex', gap: '.8rem', alignItems: 'baseline', flexWrap: 'wrap' }}>
              <button onClick={() => void open(e.id)}
                      style={{ font: 'inherit', background: 'transparent', border: 0,
                               color: GOLD_L, fontSize: 15.5, fontWeight: 600,
                               cursor: 'pointer', padding: 0, textAlign: 'left' }}>
                {openId === e.id ? '▾ ' : '▸ '}{e.title}
              </button>
              <span style={{ fontSize: 12, color: STATUS_COLOR[e.status] ?? MUTED }}>
                {STATUS_LABEL[e.status] ?? e.status}
              </span>
              {late && (
                <span style={{ fontSize: 12, color: '#ff9b9b' }}>
                  після закриття прийому
                </span>
              )}
              <span style={{ fontSize: 12.5, color: MUTED, marginLeft: 'auto' }}>
                {e.author_name} · {e.email} · {dateLabel(e.created_at)}
              </span>
            </div>

            <div style={{ fontSize: 12.5, color: MUTED, marginTop: 4 }}>
              Серій: <span style={{
                color: need && e.episodes < need ? '#eab308' : CREAM,
              }}>{e.episodes}{need ? ` з ${need}` : ''}</span>
              {' · '}слів: {e.words.toLocaleString('uk-UA')}
              {st && (
                <>
                  {' · '}дочитувань:{' '}
                  <b style={{ color: e.counted >= st.threshold ? '#22c55e' : '#eab308' }}>
                    {e.counted} з {st.threshold}
                  </b>
                </>
              )}
              {e.genre ? ` · ${e.genre}` : ''}
              {e.published > 0 && ` · у каталозі: ${e.published}`}
            </div>

            {e.annotation && (
              <p style={{ fontSize: 13.5, color: '#B8C6D8', margin: '.5rem 0 0', lineHeight: 1.6 }}>
                {e.annotation}
              </p>
            )}

            {openId === e.id && (
              <div style={{ marginTop: '.9rem', borderTop: `1px solid ${LINE}`, paddingTop: '.8rem' }}>
                {episodes.length === 0 && (
                  <p style={{ color: MUTED, fontSize: 13 }}>Читаю серії…</p>
                )}

                {episodes.map(ep => (
                  <div key={ep.id} style={{ marginBottom: '.55rem' }}>
                    <button
                      onClick={() => setOpenEp(openEp === ep.id ? null : ep.id)}
                      style={{ font: 'inherit', background: 'transparent', border: 0,
                               color: CREAM, cursor: 'pointer', padding: 0, fontSize: 13.5 }}
                    >
                      {openEp === ep.id ? '▾ ' : '▸ '}
                      Серія {ep.ord} · {ep.words} слів
                      {ep.filename ? ` · ${ep.filename}` : ''}
                      {ep.slug && (
                        <span style={{ color: '#22c55e' }}> · у каталозі ({ep.content_status})</span>
                      )}
                    </button>

                    {ep.slug && (
                      <a href={`/stories/${ep.slug}`} target="_blank" rel="noreferrer"
                         style={{ color: GOLD, fontSize: 12.5, marginLeft: '.6rem' }}>
                        відкрити →
                      </a>
                    )}

                    {openEp === ep.id && (
                      <pre style={{
                        whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif',
                        fontSize: 14.5, lineHeight: 1.7, color: '#E6EDF7',
                        background: 'rgba(255,255,255,.03)', border: `1px solid ${LINE}`,
                        borderRadius: 8, padding: '.8rem .9rem', margin: '.5rem 0 0',
                        maxHeight: 480, overflow: 'auto',
                      }}>{ep.body}</pre>
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '.6rem', marginTop: '.9rem', flexWrap: 'wrap' }}>
                  {e.status !== 'accepted' && (
                    <button onClick={() => void act(e.id, 'accept')} disabled={busy}
                            style={{ font: 'inherit', background: GOLD, color: '#2a1a02',
                                     border: 0, borderRadius: 8, padding: '.5rem 1.1rem',
                                     fontWeight: 600, cursor: busy ? 'default' : 'pointer',
                                     opacity: busy ? .6 : 1 }}>
                      Прийняти
                    </button>
                  )}
                  {e.status === 'accepted' && e.published < e.episodes && (
                    <button onClick={() => void act(e.id, 'accept')} disabled={busy}
                            style={{ font: 'inherit', background: 'rgba(239,159,39,.12)',
                                     color: GOLD_L, border: `1px solid rgba(239,159,39,.5)`,
                                     borderRadius: 8, padding: '.5rem 1.1rem',
                                     cursor: busy ? 'default' : 'pointer' }}>
                      Додати нові серії в каталог
                    </button>
                  )}
                  {e.status !== 'rejected' && (
                    <button onClick={() => void act(e.id, 'reject')} disabled={busy}
                            style={{ font: 'inherit', background: 'transparent', color: '#ff9b9b',
                                     border: '1px solid rgba(255,60,60,.4)', borderRadius: 8,
                                     padding: '.5rem 1.1rem', cursor: busy ? 'default' : 'pointer' }}>
                      Відхилити
                    </button>
                  )}
                  {e.status !== 'new' && (
                    <button onClick={() => void act(e.id, 'reset')} disabled={busy}
                            style={{ font: 'inherit', background: 'transparent', color: MUTED,
                                     border: `1px solid ${LINE}`, borderRadius: 8,
                                     padding: '.5rem 1.1rem', cursor: busy ? 'default' : 'pointer' }}>
                      Повернути в нові
                    </button>
                  )}
                </div>

                {e.status === 'accepted' && (
                  <p style={{ color: MUTED, fontSize: 12.5, marginTop: '.7rem', marginBottom: 0 }}>
                    Чернетки створені. Далі — <a href="/admin/na-redakturi" style={{ color: GOLD }}>на редактуру</a>,
                    там ставиться дата виходу. Опублікує їх cron, коли дата настане.
                  </p>
                )}
              </div>
            )}
          </div>
          )
        })}
      </div>
    </main>
  )
}
