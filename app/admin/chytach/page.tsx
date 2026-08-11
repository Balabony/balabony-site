'use client'

import { Fragment, useEffect, useMemo, useState, useCallback } from 'react'

/**
 * /admin/chytach — що робить читач після першої серії.
 *
 * Головне питання платформи зараз не «скільки прийшло», а «скільки лишилось».
 * Тому сторінка показує не суму переглядів, а падіння між кроками: серія 1 →
 * серія 2 → замок на серії 3 → інші тексти. Місце найбільшого падіння і є
 * те єдине, що варто лагодити наступним.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface Read {
  user_id: string | null
  content_id: string | null
  article_slug: string | null
  article_title: string | null
  completed: boolean | null
  read_percentage: number | null
  read_date: string
  time_spent_seconds: number | null
}
interface Paywall { user_id: string | null; limit_type: string | null; hit_at: string; content_id: string | null; content_type: string | null }
interface Acq     { user_id: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null }
interface Episode { id: string; slug: string; title: string; season_number: number | null; episode_number: number | null; type: string | null }

interface Catalog { slug: string; title: string; genre: string | null; author_name: string | null; type: string | null }
interface Sub     { email: string; source: string | null; created_at: string }

interface Data {
  reads: Read[]; paywall: Paywall[]; acq: Acq[]; episodes: Episode[]
  catalog: Catalog[]; subs: Sub[]
  errors?: Record<string, string | null>
}

type Source = 'all' | 'gazeta' | 'email'

export default function ChytachPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [source, setSource] = useState<Source>('all')
  const [openReader, setOpenReader] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/chytach-data')
      if (res.status === 401) { setError('Потрібен вхід в адмінку'); setLoading(false); return }
      setData(await res.json() as Data)
      setError('')
    } catch {
      setError('Не вдалося завантажити дані')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  /** Читачі обраного джерела. 'all' — усі, включно з тими, про кого джерела не знаємо. */
  const cohort = useMemo(() => {
    if (!data) return null
    if (source === 'all') return null // null = без фільтра
    const medium = source === 'gazeta' ? 'qr' : 'email'
    return new Set(
      data.acq.filter(a => a.utm_medium === medium).map(a => a.user_id)
    )
  }, [data, source])

  const inCohort = useCallback(
    (uid: string | null) => !cohort || (uid ? cohort.has(uid) : false),
    [cohort],
  )

  /** Серії «Балабонів» за порядком. «Тиша» має slug tysha-*, відділяємо. */
  const balabonyEps = useMemo(() => {
    if (!data) return []
    return data.episodes
      .filter(e => !e.slug.startsWith('tysha-') && e.episode_number != null)
      .sort((a, b) => (a.episode_number ?? 0) - (b.episode_number ?? 0))
  }, [data])

  /** По кожній серії: скільки відкрило, скільки дочитало, середній відсоток. */
  const perEpisode = useMemo(() => {
    if (!data) return []
    return balabonyEps.slice(0, 12).map(ep => {
      const rows = data.reads.filter(r => r.article_slug === ep.slug && inCohort(r.user_id))
      const opened = new Set(rows.map(r => r.user_id)).size
      const done = new Set(rows.filter(r => r.completed).map(r => r.user_id)).size
      const pcts = rows.map(r => r.read_percentage ?? 0).filter(p => p > 0)
      const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0
      const times = rows.map(r => r.time_spent_seconds ?? 0).filter(t => t > 0)
      const avgMin = times.length
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length / 60 * 10) / 10
        : 0
      return { ep, opened, done, avg, avgMin }
    })
  }, [data, balabonyEps, inCohort])

  /** Воронка: серія 1 → серія 2 → замок → інші тексти. */
  const funnel = useMemo(() => {
    if (!data || balabonyEps.length < 2) return null

    const e1 = balabonyEps[0], e2 = balabonyEps[1], e3 = balabonyEps[2]

    const readersOf = (slug: string) =>
      new Set(data.reads.filter(r => r.article_slug === slug && inCohort(r.user_id) && r.user_id).map(r => r.user_id as string))

    const r1 = readersOf(e1.slug)
    const r1done = new Set(
      data.reads.filter(r => r.article_slug === e1.slug && r.completed && inCohort(r.user_id) && r.user_id).map(r => r.user_id as string)
    )
    const r2 = readersOf(e2.slug)
    const r2from1 = [...r2].filter(u => r1.has(u))

    // Замок: показ третьої серії тим, хто вже читав перші
    const lock = new Set(
      data.paywall.filter(p => inCohort(p.user_id) && p.user_id).map(p => p.user_id as string)
    )
    const lockFrom1 = [...lock].filter(u => r1.has(u))

    // Інші тексти поза серіалом
    const serialSlugs = new Set(balabonyEps.map(e => e.slug))
    const otherReaders = new Set(
      data.reads
        .filter(r => r.article_slug && !serialSlugs.has(r.article_slug) && !r.article_slug.startsWith('tysha-') && inCohort(r.user_id) && r.user_id)
        .map(r => r.user_id as string)
    )
    const otherFrom1 = [...otherReaders].filter(u => r1.has(u))

    // «Тиша» — другий серіал
    const tyshaReaders = new Set(
      data.reads.filter(r => r.article_slug?.startsWith('tysha-') && inCohort(r.user_id) && r.user_id).map(r => r.user_id as string)
    )
    const tyshaFrom1 = [...tyshaReaders].filter(u => r1.has(u))

    return {
      e1, e2, e3,
      opened1: r1.size,
      done1: r1done.size,
      went2: r2from1.length,
      hitLock: lockFrom1.length,
      wentOther: otherFrom1.length,
      wentTysha: tyshaFrom1.length,
    }
  }, [data, balabonyEps, inCohort])

  /** Довідник slug → жанр, автор, назва. */
  const byslug = useMemo(() => {
    const m = new Map<string, Catalog>()
    ;(data?.catalog ?? []).forEach(c => m.set(c.slug, c))
    ;(data?.episodes ?? []).forEach(e => {
      if (!m.has(e.slug)) m.set(e.slug, { slug: e.slug, title: e.title, genre: 'серіал', author_name: null, type: e.type })
    })
    return m
  }, [data])

  /** Профіль кожного читача: що читав, у якому порядку, які смаки. */
  const readers = useMemo(() => {
    if (!data) return []
    const m = new Map<string, Read[]>()
    data.reads.forEach(r => {
      if (!r.user_id || !inCohort(r.user_id)) return
      const arr = m.get(r.user_id) ?? []
      arr.push(r)
      m.set(r.user_id, arr)
    })

    const paywallBy = new Set(data.paywall.map(p => p.user_id).filter(Boolean) as string[])
    const acqBy = new Map((data.acq ?? []).map(a => [a.user_id, a]))

    return [...m.entries()].map(([uid, rows]) => {
      const sorted = [...rows].sort((a, b) => a.read_date.localeCompare(b.read_date))
      const done = sorted.filter(r => r.completed).length
      const secs = sorted.reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0)

      // Смаки: які жанри читав найчастіше
      const genres = new Map<string, number>()
      sorted.forEach(r => {
        const g = r.article_slug ? byslug.get(r.article_slug)?.genre : null
        const key = g?.trim() || 'без жанру'
        genres.set(key, (genres.get(key) ?? 0) + 1)
      })
      const topGenres = [...genres.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)

      // Улюблені автори
      const authors = new Map<string, number>()
      sorted.forEach(r => {
        const a = r.article_slug ? byslug.get(r.article_slug)?.author_name : null
        if (a) authors.set(a, (authors.get(a) ?? 0) + 1)
      })
      const topAuthor = [...authors.entries()].sort((a, b) => b[1] - a[1])[0]

      const acq = acqBy.get(uid)
      const src = acq?.utm_medium === 'qr' ? 'газета'
        : acq?.utm_medium === 'email' ? 'пошта'
        : acq?.utm_source ?? '—'

      return {
        uid,
        rows: sorted,
        opened: sorted.length,
        done,
        minutes: Math.round(secs / 60),
        topGenres,
        topAuthor: topAuthor ? topAuthor[0] : null,
        hitLock: paywallBy.has(uid),
        first: sorted[0]?.read_date ?? '',
        last: sorted[sorted.length - 1]?.read_date ?? '',
        src,
      }
    }).sort((a, b) => b.opened - a.opened).slice(0, 60)
  }, [data, inCohort, byslug])

  /** Що читають найбільше поза серіалом — підказка, що ставити в газету. */
  const topTexts = useMemo(() => {
    if (!data) return []
    const m = new Map<string, { opened: number; done: number; pcts: number[] }>()
    data.reads.forEach(r => {
      if (!r.article_slug || !inCohort(r.user_id)) return
      const row = m.get(r.article_slug) ?? { opened: 0, done: 0, pcts: [] }
      row.opened += 1
      if (r.completed) row.done += 1
      if ((r.read_percentage ?? 0) > 0) row.pcts.push(r.read_percentage as number)
      m.set(r.article_slug, row)
    })
    return [...m.entries()]
      .map(([slug, v]) => ({
        slug,
        title: byslug.get(slug)?.title ?? slug,
        genre: byslug.get(slug)?.genre ?? '—',
        author: byslug.get(slug)?.author_name ?? '—',
        opened: v.opened,
        done: v.done,
        avg: v.pcts.length ? Math.round(v.pcts.reduce((a, b) => a + b, 0) / v.pcts.length) : 0,
      }))
      .sort((a, b) => b.opened - a.opened)
      .slice(0, 20)
  }, [data, inCohort, byslug])

  /** Жанрова картина по всій когорті. */
  const genreMap = useMemo(() => {
    if (!data) return []
    const m = new Map<string, { opened: number; done: number }>()
    data.reads.forEach(r => {
      if (!r.article_slug || !inCohort(r.user_id)) return
      const g = byslug.get(r.article_slug)?.genre?.trim() || 'без жанру'
      const row = m.get(g) ?? { opened: 0, done: 0 }
      row.opened += 1
      if (r.completed) row.done += 1
      m.set(g, row)
    })
    return [...m.entries()].sort((a, b) => b[1].opened - a[1].opened).slice(0, 12)
  }, [data, inCohort, byslug])

  const pct = (n: number, base: number) => base > 0 ? Math.round(n / base * 100) + '%' : '—' 

  if (loading) return <div style={S.wrap}><p style={S.muted}>Завантаження…</p></div>

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Шлях читача</h1>
      <p style={S.muted}>
        Не скільки прийшло, а скільки лишилось. Найбільше падіння між кроками —
        це і є те єдине, що варто лагодити наступним.
      </p>

      {error && <div style={S.err}>{error}</div>}

      <div style={S.tabs}>
        <button type="button" onClick={() => setSource('all')} style={source === 'all' ? S.tabOn : S.tab}>Усі читачі</button>
        <button type="button" onClick={() => setSource('gazeta')} style={source === 'gazeta' ? S.tabOn : S.tab}>Тільки з газети</button>
        <button type="button" onClick={() => setSource('email')} style={source === 'email' ? S.tabOn : S.tab}>Тільки з пошти</button>
      </div>

      {/* Воронка */}
      <h2 style={S.h2}>Після першої серії</h2>
      {!funnel ? (
        <p style={S.muted}>Даних ще немає.</p>
      ) : (
        <div style={S.funnel}>
          <Step label={`Відкрили серію 1 «${funnel.e1.title}»`} value={funnel.opened1} base={funnel.opened1} pct={pct} />
          <Step label="Дочитали серію 1 до кінця" value={funnel.done1} base={funnel.opened1} pct={pct} />
          <Step label={`Взялися за серію 2 «${funnel.e2.title}»`} value={funnel.went2} base={funnel.opened1} pct={pct} />
          <Step label="Уперлися в замок (спроба платної серії)" value={funnel.hitLock} base={funnel.opened1} pct={pct} />
          <Step label="Пішли читати інші історії" value={funnel.wentOther} base={funnel.opened1} pct={pct} />
          <Step label="Перейшли на серіал «Тиша»" value={funnel.wentTysha} base={funnel.opened1} pct={pct} />
        </div>
      )}

      {/* Дочитуваність по серіях */}
      <h2 style={S.h2}>Кожна серія окремо</h2>
      <p style={S.muted}>
        Середній відсоток нижче 70 означає, що текст кидають, не дійшовши до кінця.
        Дивитись треба на серію, де відсоток різко падає — саме там зачин не тримає.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>№</th>
            <th style={S.th}>Серія</th>
            <th style={S.th}>Відкрили</th>
            <th style={S.th}>Дочитали</th>
            <th style={S.th}>Середній %</th>
            <th style={S.th}>Хвилин</th>
          </tr>
        </thead>
        <tbody>
          {perEpisode.length === 0 && (
            <tr><td colSpan={6} style={S.td}>Даних ще немає</td></tr>
          )}
          {perEpisode.map(r => (
            <tr key={r.ep.slug}>
              <td style={S.td}>{r.ep.episode_number}</td>
              <td style={S.td}>{r.ep.title}</td>
              <td style={S.tdNum}>{r.opened}</td>
              <td style={S.tdNum}>{r.done}</td>
              <td style={{ ...S.tdNum, color: r.avg > 0 && r.avg < 70 ? '#fca5a5' : undefined }}>
                {r.avg > 0 ? r.avg + '%' : '—'}
              </td>
              <td style={S.tdNum}>{r.avgMin > 0 ? r.avgMin : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Жанрова картина */}
      <h2 style={S.h2}>Що заходить за жанрами</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Жанр</th>
            <th style={S.th}>Відкриттів</th>
            <th style={S.th}>Дочитувань</th>
            <th style={S.th}>Дочитуваність</th>
          </tr>
        </thead>
        <tbody>
          {genreMap.length === 0 && <tr><td colSpan={4} style={S.td}>Даних ще немає</td></tr>}
          {genreMap.map(([g, v]) => (
            <tr key={g}>
              <td style={S.td}>{g}</td>
              <td style={S.tdNum}>{v.opened}</td>
              <td style={S.tdNum}>{v.done}</td>
              <td style={S.tdNum}>{pct(v.done, v.opened)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Найпопулярніші тексти */}
      <h2 style={S.h2}>Що читають найбільше</h2>
      <p style={S.muted}>
        Верхні рядки — кандидати в наступний номер газети. Дивитись не на
        відкриття, а на дочитуваність: текст із 20 відкриттями і 80% дочитування
        сильніший за текст зі 100 відкриттями і 15%.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Твір</th>
            <th style={S.th}>Автор</th>
            <th style={S.th}>Жанр</th>
            <th style={S.th}>Відкр.</th>
            <th style={S.th}>Дочит.</th>
            <th style={S.th}>Сер. %</th>
          </tr>
        </thead>
        <tbody>
          {topTexts.length === 0 && <tr><td colSpan={6} style={S.td}>Даних ще немає</td></tr>}
          {topTexts.map(t => (
            <tr key={t.slug}>
              <td style={S.td}>{t.title}</td>
              <td style={S.td}>{t.author}</td>
              <td style={S.td}>{t.genre}</td>
              <td style={S.tdNum}>{t.opened}</td>
              <td style={S.tdNum}>{t.done}</td>
              <td style={{ ...S.tdNum, color: t.avg > 0 && t.avg < 70 ? '#fca5a5' : undefined }}>
                {t.avg > 0 ? t.avg + '%' : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Окремі читачі */}
      <h2 style={S.h2}>Окремі читачі</h2>
      <p style={S.muted}>
        Кожен рядок — один пристрій, не людина: імені й пошти тут немає й бути
        не може. Натисніть на рядок, щоб побачити весь шлях по порядку.
      </p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Читач</th>
            <th style={S.th}>Звідки</th>
            <th style={S.th}>Текстів</th>
            <th style={S.th}>Дочитав</th>
            <th style={S.th}>Хвилин</th>
            <th style={S.th}>Смаки</th>
            <th style={S.th}>Замок</th>
          </tr>
        </thead>
        <tbody>
          {readers.length === 0 && <tr><td colSpan={7} style={S.td}>Читачів ще немає</td></tr>}
          {readers.map(r => (
            <Fragment key={r.uid}>
              <tr
                onClick={() => setOpenReader(openReader === r.uid ? null : r.uid)}
                style={{ cursor: 'pointer', background: openReader === r.uid ? 'rgba(245,166,35,0.07)' : undefined }}
              >
                <td style={S.td}><code style={{ fontSize: 12 }}>{r.uid.slice(0, 8)}</code></td>
                <td style={S.td}>{r.src}</td>
                <td style={S.tdNum}>{r.opened}</td>
                <td style={S.tdNum}>{r.done}</td>
                <td style={S.tdNum}>{r.minutes}</td>
                <td style={S.td}>
                  {r.topGenres.map(([g, n]) => `${g} (${n})`).join(', ') || '—'}
                  {r.topAuthor && <div style={{ fontSize: 12, color: '#94a3b8' }}>автор: {r.topAuthor}</div>}
                </td>
                <td style={S.td}>{r.hitLock ? 'так' : '—'}</td>
              </tr>
              {openReader === r.uid && (
                <tr>
                  <td colSpan={7} style={{ ...S.td, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.9 }}>
                      {r.rows.map((row, i) => {
                        const c = row.article_slug ? byslug.get(row.article_slug) : null
                        return (
                          <div key={i}>
                            <span style={{ color: '#94a3b8' }}>{row.read_date}</span>
                            {'  ·  '}
                            <b>{row.article_title ?? c?.title ?? row.article_slug}</b>
                            {c?.genre ? <span style={{ color: '#94a3b8' }}> · {c.genre}</span> : null}
                            {'  ·  '}
                            {row.completed
                              ? <span style={{ color: '#22c55e' }}>дочитав ({row.read_percentage ?? 0}%)</span>
                              : <span style={{ color: '#fca5a5' }}>кинув ({row.read_percentage ?? 0}%)</span>}
                            {row.time_spent_seconds
                              ? <span style={{ color: '#94a3b8' }}> · {Math.round(row.time_spent_seconds / 60)} хв</span>
                              : null}
                          </div>
                        )
                      })}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={() => void load()} style={{ ...S.btn, marginTop: 24 }}>
        Оновити
      </button>
    </div>
  )
}

function Step({ label, value, base, pct }: {
  label: string; value: number; base: number
  pct: (n: number, b: number) => string
}) {
  const width = base > 0 ? Math.max(4, Math.round(value / base * 100)) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: '#94a3b8' }}>
          <b style={{ color: '#fff', fontSize: 16 }}>{value}</b> · {pct(value, base)}
        </span>
      </div>
      <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: width + '%', height: '100%', background: GOLD }} />
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap:   { maxWidth: 1000, margin: '0 auto', padding: '28px 18px 80px', fontFamily: FONT, color: '#e2e8f0' },
  h1:     { fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' },
  h2:     { fontSize: 17, fontWeight: 700, margin: '32px 0 12px', color: GOLD },
  muted:  { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 18px' },
  err:    { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  tabs:   { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  tab:    { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(245,166,35,0.3)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' },
  tabOn:  { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  funnel: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,166,35,0.22)', borderRadius: 14, padding: '20px 22px' },
  table:  { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:     { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td:     { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tdNum:  { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  btn:    { fontFamily: FONT, fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
}
