'use client'

import { useState } from 'react'

// =============================================================================
// АДМІН: ЗВІТ «ХТО ГОЛОВНИЙ ГЕРОЙ»
// Проганяє всі серії через детектор (Haiku) пакетами і показує,
// де головна Ганя — щоб точково перегенерувати обкладинки.
// Обкладинки НЕ генеруються — лише класифікація тексту.
// =============================================================================

const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#d0a355'
const GOLD2 = '#FAC775'
const CREAM = '#FFF8EE'
const BLUE = '#B5D4F4'
const FONT = 'Montserrat, system-ui, sans-serif'
const BATCH = 6

type Ep = { slug: string; title: string }
type Res = { slug: string; title: string; character: 'panas' | 'ganya' }

export default function ProtagonistReportPage() {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [total, setTotal] = useState(0)
  const [results, setResults] = useState<Res[]>([])
  const [err, setErr] = useState('')

  async function run() {
    setErr(''); setRunning(true); setResults([]); setDone(0); setTotal(0)
    try {
      const list = await fetch('/api/admin/protagonist-report').then(r => r.json())
      const episodes: Ep[] = list.episodes || []
      if (episodes.length === 0) { setErr('Серій не знайдено'); setRunning(false); return }
      setTotal(episodes.length)

      const acc: Res[] = []
      for (let i = 0; i < episodes.length; i += BATCH) {
        const slugs = episodes.slice(i, i + BATCH).map(e => e.slug)
        const res = await fetch('/api/admin/protagonist-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs }),
        }).then(r => r.json())
        if (res.results) acc.push(...res.results)
        setResults([...acc])
        setDone(Math.min(i + BATCH, episodes.length))
      }
    } catch {
      setErr('Помилка під час аналізу — спробуй ще раз')
    } finally {
      setRunning(false)
    }
  }

  const ganya = results.filter(r => r.character === 'ganya')
  const panas = results.filter(r => r.character === 'panas')

  return (
    <div style={{ minHeight: '100%', background: NAVY, color: CREAM, fontFamily: FONT, padding: '28px 22px 120px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <h1 style={{ color: GOLD2, fontSize: 26, margin: '0 0 6px' }}>Хто головний герой</h1>
        <p style={{ color: BLUE, fontSize: 14, lineHeight: 1.5, margin: '0 0 20px' }}>
          Класифікує всі серії за головним героєм у кадрі. Обкладинки <b>не</b> генеруються.
          Серії «Ганя» нижче — це ті, де варто перегенерувати обкладинку (у Списку серій постав «Герой: Ганя» → 🔄 Обкладинка).
        </p>

        {err && (
          <div style={{ background: '#5a1d1d', color: '#ffd9d9', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{err}</div>
        )}

        <button
          onClick={run}
          disabled={running}
          style={{ background: running ? '#5b6b80' : GOLD, color: NAVY, border: 'none', borderRadius: 8, padding: '11px 18px', fontFamily: FONT, fontWeight: 700, fontSize: 15, cursor: running ? 'default' : 'pointer' }}
        >
          {running ? `Аналізую… ${done}/${total}` : 'Проаналізувати всі серії'}
        </button>

        {total > 0 && (
          <div style={{ marginTop: 14, height: 8, background: NAVY2, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${total ? (done / total) * 100 : 0}%`, background: GOLD, transition: 'width .2s' }} />
          </div>
        )}

        {results.length > 0 && (
          <>
            <h2 style={{ color: GOLD2, fontSize: 18, margin: '28px 0 10px' }}>
              Головна — Ганя ({ganya.length})
            </h2>
            {ganya.length === 0 ? (
              <p style={{ color: '#7d8aa0', fontSize: 14 }}>Поки не знайдено.</p>
            ) : (
              <div style={{ display: 'grid', gap: 6 }}>
                {ganya.map(r => (
                  <div key={r.slug} style={{ background: NAVY2, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '8px 12px', display: 'flex', gap: 10, alignItems: 'baseline' }}>
                    <span style={{ color: GOLD2, fontWeight: 700, fontSize: 12, minWidth: 56 }}>{r.slug.toUpperCase()}</span>
                    <span style={{ color: CREAM, fontSize: 14 }}>{r.title}</span>
                  </div>
                ))}
              </div>
            )}

            <h2 style={{ color: '#7d8aa0', fontSize: 16, margin: '28px 0 10px' }}>
              Головний — Панас ({panas.length})
            </h2>
            <div style={{ display: 'grid', gap: 4 }}>
              {panas.map(r => (
                <div key={r.slug} style={{ padding: '4px 12px', display: 'flex', gap: 10, alignItems: 'baseline', fontSize: 13, color: '#9fb0c8' }}>
                  <span style={{ fontWeight: 700, minWidth: 56 }}>{r.slug.toUpperCase()}</span>
                  <span>{r.title}</span>
                </div>
              ))}
            </div>

            {!running && (
              <p style={{ color: '#7d8aa0', fontSize: 12, marginTop: 20, lineHeight: 1.5 }}>
                Детектор інколи помиляється на серіях, де Панас і Ганя нарівні. Якщо якась серія потрапила не туди — просто перегенеруй її в Списку серій із потрібним героєм вручну.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
