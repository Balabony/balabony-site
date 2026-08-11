'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'

/**
 * /admin/kanaly — щотижневий звіт по каналах приходу.
 *
 * Сторінка відповідає на три питання і більше ні на які:
 *   1. Скільки людей прийшло цього тижня і звідки.
 *   2. Скільки з них ДОЧИТАЛО.
 *   3. Скільки лишило пошту.
 *
 * Навмисно без графіків: цифри малі, графік на десятку переходів
 * створює хибне відчуття динаміки. Коли числа виростуть — додамо.
 */

const GOLD = '#f5a623'
const FONT = "'Montserrat', Arial, sans-serif"

interface Link  { code: string; target: string; campaign: string | null; is_active: boolean | null; channel: string | null }
interface Hit   { code: string; created_at: string; user_agent: string | null }
interface Issue { id: string; issue_date: string; paper_name: string; print_run: number | null; code: string | null; note: string | null }
interface Send  { id: string; sent_at: string; subject: string | null; from_email: string | null; recipients: number | null; code: string | null; note: string | null }
interface Sub   { email: string; source: string | null; created_at: string }
interface Read  { article_slug: string | null; article_title: string | null; completed: boolean | null; read_date: string; read_percentage: number | null }

interface Data {
  links: Link[]; hits: Hit[]; issues: Issue[]; sends: Send[]; subs: Sub[]; reads: Read[]
  errors?: Record<string, string | null>
}

/** Понеділок того тижня, якому належить дата. Тиждень рахуємо пн–нд. */
function weekStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7 // 0 = понеділок
  x.setDate(x.getDate() - day)
  return x
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })
}

export default function KanalyPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'gazeta' | 'email'>('gazeta')

  // форма додавання номера
  const [issueDate, setIssueDate] = useState('')
  const [printRun, setPrintRun] = useState('20000')
  const [issueCode, setIssueCode] = useState('1')

  // форма додавання розсилки
  const [sendSubject, setSendSubject] = useState('')
  const [sendCount, setSendCount] = useState('')
  const [sendCode, setSendCode] = useState('')

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/kanaly-data')
      if (res.status === 401) { setError('Потрібен вхід в адмінку'); setLoading(false); return }
      const json = await res.json() as Data
      setData(json)
      setError('')
    } catch {
      setError('Не вдалося завантажити дані')
    }
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/kanaly-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json() as { ok?: boolean; error?: string }
      if (!json.ok) setError(json.error ?? 'Не збереглося')
      else { setError(''); await load() }
    } catch {
      setError('Помилка збереження')
    }
    setSaving(false)
  }

  /** Коди, що належать поточній вкладці. */
  const codesOfTab = useMemo(() => {
    if (!data) return new Set<string>()
    const s = new Set<string>()
    data.links.forEach(l => {
      const ch = l.channel ?? 'gazeta'
      if (tab === 'gazeta' ? ch === 'gazeta' : ch !== 'gazeta') s.add(l.code)
    })
    return s
  }, [data, tab])

  /** Зведення по тижнях: приходи, дочитування, підписки. */
  const weeks = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { hits: number; reads: number; subs: number }>()

    const bump = (iso: string, field: 'hits' | 'reads' | 'subs') => {
      const k = weekStart(new Date(iso)).toISOString().slice(0, 10)
      const row = map.get(k) ?? { hits: 0, reads: 0, subs: 0 }
      row[field] += 1
      map.set(k, row)
    }

    data.hits.forEach(h => { if (codesOfTab.has(h.code)) bump(h.created_at, 'hits') })

    // Дочитування і підписки поки не розділяються за каналом — показуємо
    // загальні по сайту, це чесніше, ніж приписувати їх одному каналу.
    data.reads.forEach(r => { if (r.completed) bump(r.read_date, 'reads') })
    data.subs.forEach(s => bump(s.created_at, 'subs'))

    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 12)
  }, [data, codesOfTab])

  const thisWeek = weeks[0]?.[1] ?? { hits: 0, reads: 0, subs: 0 }
  const prevWeek = weeks[1]?.[1] ?? { hits: 0, reads: 0, subs: 0 }

  /** Переходи в розрізі кодів — які саме посилання працюють. */
  const byCode = useMemo(() => {
    if (!data) return []
    const map = new Map<string, number>()
    data.hits.forEach(h => {
      if (!codesOfTab.has(h.code)) return
      map.set(h.code, (map.get(h.code) ?? 0) + 1)
    })
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([code, n]) => {
        const link = data.links.find(l => l.code === code)
        return { code, n, target: link?.target ?? '—' }
      })
  }, [data, codesOfTab])

  if (loading) return <div style={S.wrap}><p style={S.muted}>Завантаження…</p></div>

  return (
    <div style={S.wrap}>
      <h1 style={S.h1}>Канали приходу</h1>
      <p style={S.muted}>
        Головна цифра — не переходи, а дочитування. Людина, що клікнула й пішла
        через десять секунд, каналу не робить.
      </p>

      {error && <div style={S.err}>{error}</div>}

      {/* Три числа за тиждень */}
      <div style={S.cards}>
        <Card label="Приходів за тиждень" value={thisWeek.hits} prev={prevWeek.hits} />
        <Card label="Дочитувань (весь сайт)" value={thisWeek.reads} prev={prevWeek.reads} />
        <Card label="Нових підписок" value={thisWeek.subs} prev={prevWeek.subs} />
      </div>

      {/* Вкладки */}
      <div style={S.tabs}>
        <button type="button" onClick={() => setTab('gazeta')} style={tab === 'gazeta' ? S.tabOn : S.tab}>Газета</button>
        <button type="button" onClick={() => setTab('email')} style={tab === 'email' ? S.tabOn : S.tab}>Пошта</button>
      </div>

      {/* Тижні */}
      <h2 style={S.h2}>По тижнях</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Тиждень з</th>
            <th style={S.th}>Приходи</th>
            <th style={S.th}>Дочитування</th>
            <th style={S.th}>Підписки</th>
          </tr>
        </thead>
        <tbody>
          {weeks.length === 0 && (
            <tr><td colSpan={4} style={S.td}>Даних ще немає</td></tr>
          )}
          {weeks.map(([w, v]) => (
            <tr key={w}>
              <td style={S.td}>{fmtDate(w)}</td>
              <td style={S.tdNum}>{v.hits}</td>
              <td style={S.tdNum}>{v.reads}</td>
              <td style={S.tdNum}>{v.subs}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Розріз по кодах */}
      <h2 style={S.h2}>Які посилання працюють</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Код</th>
            <th style={S.th}>Веде на</th>
            <th style={S.th}>Переходів</th>
          </tr>
        </thead>
        <tbody>
          {byCode.length === 0 && (
            <tr><td colSpan={3} style={S.td}>Переходів ще не було</td></tr>
          )}
          {byCode.map(r => (
            <tr key={r.code}>
              <td style={S.td}><code>{r.code}</code></td>
              <td style={S.td}>{r.target}</td>
              <td style={S.tdNum}>{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Журнал */}
      {tab === 'gazeta' ? (
        <>
          <h2 style={S.h2}>Журнал номерів</h2>
          <div style={S.form}>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={S.input} />
            <input type="number" value={printRun} onChange={e => setPrintRun(e.target.value)} placeholder="Наклад" style={S.input} />
            <input type="text" value={issueCode} onChange={e => setIssueCode(e.target.value)} placeholder="Код QR" style={S.input} />
            <button
              type="button"
              disabled={saving}
              onClick={() => save({ kind: 'issue', issue_date: issueDate, print_run: Number(printRun) || null, code: issueCode })}
              style={S.btn}
            >
              Записати номер
            </button>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Дата</th>
                <th style={S.th}>Газета</th>
                <th style={S.th}>Наклад</th>
                <th style={S.th}>Код</th>
                <th style={S.th}>Сканів</th>
                <th style={S.th}>На 1000</th>
              </tr>
            </thead>
            <tbody>
              {(data?.issues ?? []).length === 0 && (
                <tr><td colSpan={6} style={S.td}>Номерів ще не записано</td></tr>
              )}
              {(data?.issues ?? []).map(i => {
                const scans = (data?.hits ?? []).filter(h =>
                  h.code === i.code && h.created_at.slice(0, 10) >= i.issue_date
                ).length
                const per1000 = i.print_run ? (scans / i.print_run * 1000).toFixed(1) : '—'
                return (
                  <tr key={i.id}>
                    <td style={S.td}>{fmtDate(i.issue_date)}</td>
                    <td style={S.td}>{i.paper_name}</td>
                    <td style={S.tdNum}>{i.print_run ?? '—'}</td>
                    <td style={S.td}><code>{i.code ?? '—'}</code></td>
                    <td style={S.tdNum}>{scans}</td>
                    <td style={S.tdNum}>{per1000}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h2 style={S.h2}>Журнал розсилок</h2>
          <div style={S.form}>
            <input type="text" value={sendSubject} onChange={e => setSendSubject(e.target.value)} placeholder="Тема листа" style={{ ...S.input, flex: '2 1 240px' }} />
            <input type="number" value={sendCount} onChange={e => setSendCount(e.target.value)} placeholder="Скільки адрес" style={S.input} />
            <input type="text" value={sendCode} onChange={e => setSendCode(e.target.value)} placeholder="Код посилання" style={S.input} />
            <button
              type="button"
              disabled={saving}
              onClick={() => save({ kind: 'send', subject: sendSubject, recipients: Number(sendCount) || null, code: sendCode })}
              style={S.btn}
            >
              Записати розсилку
            </button>
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Дата</th>
                <th style={S.th}>Тема</th>
                <th style={S.th}>Надіслано</th>
                <th style={S.th}>Код</th>
                <th style={S.th}>Переходів</th>
                <th style={S.th}>% переходів</th>
              </tr>
            </thead>
            <tbody>
              {(data?.sends ?? []).length === 0 && (
                <tr><td colSpan={6} style={S.td}>Розсилок ще не було</td></tr>
              )}
              {(data?.sends ?? []).map(s => {
                const clicks = (data?.hits ?? []).filter(h =>
                  h.code === s.code && h.created_at >= s.sent_at
                ).length
                const pct = s.recipients ? (clicks / s.recipients * 100).toFixed(1) + '%' : '—'
                return (
                  <tr key={s.id}>
                    <td style={S.td}>{fmtDate(s.sent_at)}</td>
                    <td style={S.td}>{s.subject ?? '—'}</td>
                    <td style={S.tdNum}>{s.recipients ?? '—'}</td>
                    <td style={S.td}><code>{s.code ?? '—'}</code></td>
                    <td style={S.tdNum}>{clicks}</td>
                    <td style={S.tdNum}>{pct}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}

      {/* Останні підписки — щоб бачити, з яких саме історій приходять */}
      <h2 style={S.h2}>Останні підписки</h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Дата</th>
            <th style={S.th}>Пошта</th>
            <th style={S.th}>Звідки</th>
          </tr>
        </thead>
        <tbody>
          {(data?.subs ?? []).slice(0, 30).length === 0 && (
            <tr><td colSpan={3} style={S.td}>Підписок ще немає</td></tr>
          )}
          {(data?.subs ?? []).slice(0, 30).map((s, i) => (
            <tr key={s.email + i}>
              <td style={S.td}>{fmtDate(s.created_at)}</td>
              <td style={S.td}>{s.email}</td>
              <td style={S.td}>{s.source ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button type="button" onClick={() => void load()} style={{ ...S.btn, marginTop: 24 }}>
        Оновити
      </button>
    </div>
  )
}

function Card({ label, value, prev }: { label: string; value: number; prev: number }) {
  const diff = value - prev
  const sign = diff > 0 ? '+' : ''
  const color = diff > 0 ? '#22c55e' : diff < 0 ? '#ef4444' : '#94a3b8'
  return (
    <div style={S.card}>
      <div style={S.cardLabel}>{label}</div>
      <div style={S.cardValue}>{value}</div>
      <div style={{ ...S.cardDiff, color }}>
        {prev === 0 && value === 0 ? 'без змін' : `${sign}${diff} до минулого тижня`}
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrap:      { maxWidth: 1100, margin: '0 auto', padding: '28px 18px 80px', fontFamily: FONT, color: '#e2e8f0' },
  h1:        { fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: '#fff' },
  h2:        { fontSize: 17, fontWeight: 700, margin: '32px 0 12px', color: GOLD },
  muted:     { fontSize: 14, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 20px' },
  err:       { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: '12px 14px', color: '#fca5a5', fontSize: 14, marginBottom: 16 },
  cards:     { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 },
  card:      { flex: '1 1 200px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 14, padding: '18px 20px' },
  cardLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  cardValue: { fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1 },
  cardDiff:  { fontSize: 12, marginTop: 6 },
  tabs:      { display: 'flex', gap: 8, marginBottom: 8 },
  tab:       { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 10, border: '1px solid rgba(245,166,35,0.3)', background: 'transparent', color: '#94a3b8', cursor: 'pointer' },
  tabOn:     { fontFamily: FONT, fontSize: 14, fontWeight: 700, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
  table:     { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th:        { textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
  td:        { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tdNum:     { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  form:      { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  input:     { flex: '1 1 130px', minWidth: 0, fontFamily: FONT, fontSize: 14, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(245,166,35,0.3)', background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', outline: 'none' },
  btn:       { fontFamily: FONT, fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 10, border: 'none', background: GOLD, color: '#1a1205', cursor: 'pointer' },
}
