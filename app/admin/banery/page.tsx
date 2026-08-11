'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * /admin/banery — що дає кожен банер і кожен зовнішній канал.
 *
 * Сторінка відповідає на одне питання: чи вартий банер того місця,
 * яке займає. Для цього мало знати, скільки людей прийшло, —
 * важливо, скільки з них лишилось читати.
 *
 * Мітка utm_campaign = один банер. Мітки задаються в посиланні банера
 * на storriss.com, тож рядок таблиці читається як назва місця:
 *   a2_serial    — вертикальний у правій колонці
 *   a4_stories   — широкий угорі сторінок
 *   b3_konkursy  — конкурси (B1, B4)
 *   b4_avtory    — «124 автори» (B2)
 *   b3_stories   — темний «Балабони» (B5)
 *   b6_kazky     — казки (B6)
 */

const GOLD = '#f5a623'
const DARK = '#0d1b2a'
const FONT = "'Montserrat', Arial, sans-serif"

interface Acq {
  user_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  referrer: string | null
  landing_path: string | null
}
interface Read { user_id: string | null; completed: boolean | null }

interface Data {
  acquisition: Acq[]
  reads: Read[]
  subscribers: string[]
}

interface Row {
  key: string
  came: number
  opened: number
  finished: number
  paid: number
}

/** Людські назви для міток. Невідома мітка показується як є. */
const LABELS: Record<string, string> = {
  a1_top:            'A1 · топбанер угорі',
  a2_serial:         'A2 · права колонка, вертикальний',
  a3_serial:         'A3 · права колонка, низ',
  a4_stories:        'A4 · широкий під меню',
  b1_avtoram:        'B1 · для авторів',
  b2_stories:        'B2 · «Панас і 5G»',
  b3_konkursy:       'B1+B4 · конкурси',
  b3_stories:        'B5 · «Балабони» темний',
  b4_avtory:         'B2 · «124 автори»',
  b4_stories:        'B4 · «Панас і 5G»',
  b6_kazky:          'B6 · казки',
  stories_block:     'старий банер «Історії та серіали»',
  'gazeta-balabony-e01': 'газета · QR на першу серію',
}

/** Канал: utm_source, або хост реферера, або «прямий». */
function channelOf(a: Acq): string {
  if (a.utm_source) return a.utm_source.toLowerCase()
  const ref = a.referrer
  if (!ref) return 'прямий захід'
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '')
    if (host.includes('balabony')) return 'прямий захід'
    return host
  } catch {
    return 'прямий захід'
  }
}

/** Рахує лійку для довільного групування рядків набуття. */
function buildRows(
  acq: Acq[],
  keyOf: (a: Acq) => string | null,
  openedIds: Set<string>,
  finishedIds: Set<string>,
  paidIds: Set<string>,
): Row[] {
  const map = new Map<string, Row>()

  acq.forEach(a => {
    const key = keyOf(a)
    if (!key) return
    let row = map.get(key)
    if (!row) {
      row = { key, came: 0, opened: 0, finished: 0, paid: 0 }
      map.set(key, row)
    }
    row.came += 1
    const uid = a.user_id
    if (!uid) return
    if (openedIds.has(uid))   row.opened   += 1
    if (finishedIds.has(uid)) row.finished += 1
    if (paidIds.has(uid))     row.paid     += 1
  })

  return Array.from(map.values()).sort((a, b) => b.came - a.came)
}

function pct(part: number, whole: number): string {
  if (!whole) return '—'
  return Math.round((part / whole) * 100) + '%'
}

export default function BaneryPage() {
  const [data, setData]       = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    fetch('/api/admin/banery-data')
      .then(async r => {
        if (!r.ok) throw new Error(r.status === 401 ? 'Потрібен вхід в адмінку' : 'Помилка ' + r.status)
        return r.json()
      })
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const view = useMemo(() => {
    if (!data) return null

    const openedIds   = new Set<string>()
    const finishedIds = new Set<string>()
    data.reads.forEach(r => {
      if (!r.user_id) return
      openedIds.add(r.user_id)
      if (r.completed) finishedIds.add(r.user_id)
    })
    const paidIds = new Set(data.subscribers)

    const banners = buildRows(
      data.acquisition,
      a => (a.utm_campaign ? a.utm_campaign : null),
      openedIds, finishedIds, paidIds,
    )
    const channels = buildRows(
      data.acquisition,
      a => channelOf(a),
      openedIds, finishedIds, paidIds,
    )

    const total     = data.acquisition.length
    const withUtm   = data.acquisition.filter(a => a.utm_campaign).length
    const fromStor  = data.acquisition.filter(a => (a.utm_source ?? '').toLowerCase() === 'storriss').length

    return { banners, channels, total, withUtm, fromStor }
  }, [data])

  if (loading) return <Shell><p style={{ color: '#c9d4e0' }}>Рахую…</p></Shell>
  if (error)   return <Shell><p style={{ color: '#ff8a8a' }}>{error}</p></Shell>
  if (!view)   return <Shell><p style={{ color: '#c9d4e0' }}>Даних немає.</p></Shell>

  return (
    <Shell>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <Stat label="Усього приходів у базі" value={view.total} />
        <Stat label="З них із міткою банера" value={view.withUtm} />
        <Stat label="Зі Storriss" value={view.fromStor} />
      </div>

      <H>Банери — по мітках</H>
      <Note>
        Один рядок — один банер. «Відкрив» означає, що людина розгорнула хоча б
        один текст; «дочитав» — доклала до кінця. Банер, який приводить людей,
        але не має жодного дочитування, займає місце дарма.
      </Note>
      <Table rows={view.banners} nameOf={k => LABELS[k] ?? k} emptyText="Жодного приходу з міткою. Або банери щойно поставлені, або посилання без utm_campaign." />

      <div style={{ height: 36 }} />

      <H>Канали загалом</H>
      <Note>
        Те саме, але згруповано за джерелом, а не за окремим банером.
        Показує, чи Storriss узагалі щось дає проти газети й прямих заходів.
      </Note>
      <Table rows={view.channels} nameOf={k => k} emptyText="Порожньо." />
    </Shell>
  )
}

/* ─── дрібні складові ────────────────────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: DARK, color: '#fff', fontFamily: FONT, padding: '32px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Банери й канали</h1>
        <p style={{ color: '#8fa3b8', fontSize: 14, marginBottom: 26 }}>
          Звідки приходять люди і що з ними далі.
        </p>
        {children}
      </div>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginBottom: 6 }}>{children}</h2>
}

function Note({ children }: { children: React.ReactNode }) {
  return <p style={{ color: '#8fa3b8', fontSize: 13, lineHeight: 1.5, marginBottom: 14, maxWidth: 720 }}>{children}</p>
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ background: '#12263a', border: '1px solid #2a4258', borderRadius: 10, padding: '14px 18px', minWidth: 170 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, color: '#8fa3b8', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

function Table({ rows, nameOf, emptyText }: { rows: Row[]; nameOf: (k: string) => string; emptyText: string }) {
  if (!rows.length) {
    return <p style={{ color: '#8fa3b8', fontSize: 14, padding: '14px 0' }}>{emptyText}</p>
  }
  const th: React.CSSProperties = {
    textAlign: 'right', padding: '10px 12px', fontSize: 11, letterSpacing: 1,
    color: '#8fa3b8', textTransform: 'uppercase', borderBottom: '1px solid #2a4258', whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    textAlign: 'right', padding: '11px 12px', fontSize: 15, borderBottom: '1px solid #1b3049', whiteSpace: 'nowrap',
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#12263a', borderRadius: 10 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left' }}>Банер / канал</th>
            <th style={th}>Прийшло</th>
            <th style={th}>Відкрив</th>
            <th style={th}>Дочитав</th>
            <th style={th}>Підписка</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key}>
              <td style={{ ...td, textAlign: 'left' }}>
                <div>{nameOf(r.key)}</div>
                {nameOf(r.key) !== r.key && (
                  <div style={{ fontSize: 11, color: '#6b8299', marginTop: 2 }}>{r.key}</div>
                )}
              </td>
              <td style={{ ...td, fontWeight: 700 }}>{r.came}</td>
              <td style={td}>{r.opened} <span style={{ color: '#6b8299', fontSize: 12 }}>{pct(r.opened, r.came)}</span></td>
              <td style={td}>{r.finished} <span style={{ color: '#6b8299', fontSize: 12 }}>{pct(r.finished, r.came)}</span></td>
              <td style={{ ...td, color: r.paid ? GOLD : undefined }}>{r.paid}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
