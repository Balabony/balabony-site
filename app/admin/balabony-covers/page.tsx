'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// Галерея обкладинок «Балабонів» — сторінка для РЕВІЗІЇ, не для генерації.
//
// Задача: переглянути всі ~102 обкладинки й знайти збої ШІ-генерації
// (зайві кінцівки, предмети в повітрі, спотворені написи, крива анатомія).
// Тому головне тут — РОЗМІР картинки: на дрібних мініатюрах артефакти
// не видно. Три розміри перемикаються, за замовчуванням великий.
//
// Показується ОРИГІНАЛ обкладинки повністю (object-fit: contain), а не
// кадр 275×200, як на картці сайту: артефакт може сидіти в тій частині,
// яку картка обрізає, і на сайті його не видно, а у файлі він є.
// Для роботи з кадром є окрема сторінка /admin/cover-position.

type Row = {
  id: string
  slug: string
  title: string
  season_number: number | null
  episode_number: number | null
  cover_url: string | null
  cover_position: string | null
  status: string
  is_premium: boolean | null
}

const BG = '#0a1628'
const CARD = '#101d33'
const GOLD = '#d0a355'
const INK = '#f5f0e8'
const FONT = "'Montserrat', Arial, sans-serif"

// Ширина картки для трьох режимів. «Великий» — щоб роздивитись деталі.
const SIZES: Record<string, number> = {
  Малий: 220,
  Середній: 320,
  Великий: 460,
}

export default function BalabonyCoversPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [withoutCover, setWithoutCover] = useState(0)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [size, setSize] = useState<keyof typeof SIZES>('Великий')
  const [season, setSeason] = useState<string>('усі')
  const [onlyNoCover, setOnlyNoCover] = useState(false)

  // Позначені як «треба перегенерувати». Живуть лише в пам'яті сторінки:
  // це робочий список для одного сеансу перегляду, не дані для бази.
  const [flagged, setFlagged] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const r = await fetch('/api/admin/balabony-covers', { credentials: 'same-origin' })
      if (!r.ok) throw new Error(r.status === 401 ? 'Потрібен вхід в адмінку' : `Помилка ${r.status}`)
      const j = await r.json() as { rows: Row[]; total: number; withoutCover: number }
      setRows(j.rows ?? [])
      setTotal(j.total ?? 0)
      setWithoutCover(j.withoutCover ?? 0)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не вдалось завантажити')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const seasons = useMemo(() => {
    const s = new Set<number>()
    rows.forEach(r => { if (r.season_number != null) s.add(r.season_number) })
    return Array.from(s).sort((a, b) => a - b)
  }, [rows])

  const shown = useMemo(() => {
    let out = rows
    if (season !== 'усі') out = out.filter(r => String(r.season_number) === season)
    if (onlyNoCover) out = out.filter(r => !r.cover_url)
    return out
  }, [rows, season, onlyNoCover])

  const toggleFlag = (id: string) => {
    setFlagged(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Список позначених у вигляді «S1E4, S2E11» — щоб скопіювати й переслати.
  const flaggedLabel = useMemo(() => {
    return rows
      .filter(r => flagged.has(r.id))
      .map(r => `S${r.season_number ?? '?'}E${r.episode_number ?? '?'}`)
      .join(', ')
  }, [rows, flagged])

  const cardWidth = SIZES[size]

  return (
    <div style={{ minHeight: '100vh', background: BG, color: INK, fontFamily: FONT, padding: '20px 16px 60px' }}>
      <div style={{ maxWidth: 1500, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>Обкладинки «Балабонів»</h1>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', margin: '0 0 18px', lineHeight: 1.6, maxWidth: 780 }}>
          Перегляд усіх обкладинок серій для пошуку збоїв генерації: зайві руки й пальці, предмети
          в повітрі, спотворені написи, крива анатомія тварин. Показано оригінал повністю — картка
          на сайті обрізає його під 275×200, тож частина кадру там не видно.
          Клік по картинці відкриває файл у повному розмірі.
        </p>

        {/* Панель керування */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', padding: 14, background: CARD, border: '1px solid #22304d', borderRadius: 12, marginBottom: 20 }}>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.6)' }}>Розмір:</span>
            {(Object.keys(SIZES) as (keyof typeof SIZES)[]).map(k => (
              <button
                key={k}
                onClick={() => setSize(k)}
                style={{
                  padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT,
                  fontSize: 12.5, fontWeight: 700, border: 'none',
                  background: size === k ? GOLD : 'rgba(255,255,255,0.07)',
                  color: size === k ? '#0a1628' : 'rgba(245,240,232,0.75)',
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12.5, color: 'rgba(245,240,232,0.6)' }}>Сезон:</span>
            <select
              value={season}
              onChange={e => setSeason(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 7, background: '#0c1830', color: INK, border: '1px solid #33405e', fontFamily: FONT, fontSize: 13 }}
            >
              <option value="усі">усі</option>
              {seasons.map(s => <option key={s} value={String(s)}>{s}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12.5, cursor: 'pointer', color: 'rgba(245,240,232,0.75)' }}>
            <input type="checkbox" checked={onlyNoCover} onChange={e => setOnlyNoCover(e.target.checked)} />
            лише без обкладинки
          </label>

          <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'rgba(245,240,232,0.6)' }}>
            Показано <strong style={{ color: GOLD }}>{shown.length}</strong> із {total}
            {withoutCover > 0 && <> · без обкладинки: <strong style={{ color: '#e0a34d' }}>{withoutCover}</strong></>}
          </div>
        </div>

        {/* Робочий список позначених */}
        {flagged.size > 0 && (
          <div style={{ padding: 14, background: 'rgba(224,163,77,0.1)', border: '1px solid #e0a34d66', borderRadius: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#e0a34d', marginBottom: 6 }}>
              Позначено на перегенерацію: {flagged.size}
            </div>
            <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.6, wordBreak: 'break-word' }}>{flaggedLabel}</div>
            <button
              onClick={() => setFlagged(new Set())}
              style={{ marginTop: 10, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.2)', fontFamily: FONT, fontSize: 12 }}
            >
              Очистити список
            </button>
          </div>
        )}

        {err && (
          <div style={{ padding: 12, borderRadius: 10, background: 'rgba(217,69,69,0.15)', border: '1px solid #d94545', marginBottom: 16, fontSize: 13.5 }}>{err}</div>
        )}
        {loading && <div style={{ fontSize: 14, color: 'rgba(245,240,232,0.55)' }}>Завантаження…</div>}

        {/* Сітка */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(min(${cardWidth}px, 100%), 1fr))`, gap: 18 }}>
          {shown.map(row => {
            const isFlagged = flagged.has(row.id)
            const label = `S${row.season_number ?? '?'}E${row.episode_number ?? '?'}`
            return (
              <div
                key={row.id}
                style={{
                  background: CARD,
                  border: isFlagged ? '2px solid #e0a34d' : '1px solid #22304d',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {row.cover_url ? (
                  <a href={row.cover_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#000' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={row.cover_url}
                      alt={row.title}
                      loading="lazy"
                      style={{ width: '100%', display: 'block', objectFit: 'contain' }}
                    />
                  </a>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '3 / 2', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.04)', color: 'rgba(245,240,232,0.4)', fontSize: 13 }}>
                    без обкладинки
                  </div>
                )}

                <div style={{ padding: '10px 12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>{label}</span>
                    {row.status !== 'published' && (
                      <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 5, background: 'rgba(155,140,255,0.18)', color: '#b3a6ff' }}>{row.status}</span>
                    )}
                    {row.is_premium && (
                      <span style={{ fontSize: 10.5, padding: '2px 6px', borderRadius: 5, background: 'rgba(239,159,39,0.18)', color: GOLD }}>бонус</span>
                    )}
                  </div>

                  <div style={{ fontSize: 13.5, lineHeight: 1.4, marginBottom: 9 }}>{row.title}</div>

                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => toggleFlag(row.id)}
                      style={{
                        padding: '5px 10px', borderRadius: 7, cursor: 'pointer', fontFamily: FONT, fontSize: 11.5, fontWeight: 700,
                        border: isFlagged ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        background: isFlagged ? '#e0a34d' : 'transparent',
                        color: isFlagged ? '#0a1628' : 'rgba(245,240,232,0.7)',
                      }}
                    >
                      {isFlagged ? '✓ позначено' : 'позначити'}
                    </button>
                    <a
                      href={`https://balabony.com/episodes/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11.5, textDecoration: 'none', color: 'rgba(245,240,232,0.55)', border: '1px solid rgba(255,255,255,0.14)' }}
                    >
                      серія ↗
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!loading && shown.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: 'rgba(245,240,232,0.5)', fontSize: 14 }}>
            Нічого не знайдено за цими фільтрами.
          </div>
        )}
      </div>
    </div>
  )
}
