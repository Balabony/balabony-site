'use client'

import { useEffect, useState } from 'react'

// =============================================================================
// АДМІН: ТЕСТ ПАРНОЇ ОБКЛАДИНКИ (Панас + Ганя)
// Розвідка перед тим, як заводити повноцінну бібліотеку pair-poses.
// Обираєш позу Панаса й позу Гані → бек склеює їх у колаж → Kontext зводить
// обох в одну сцену. Дивимось очима, чи два обличчя лишились різними.
// =============================================================================

const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#d0a355'
const GOLD2 = '#FAC775'
const CREAM = '#FFF8EE'
const BLUE = '#B5D4F4'
const FONT = 'Montserrat, system-ui, sans-serif'

type Shot = { url: string | null; collageUrl: string; seed?: number }

export default function PairTestPage() {
  const [panasList, setPanasList] = useState<string[]>([])
  const [ganyaList, setGanyaList] = useState<string[]>([])
  const [panasFile, setPanasFile] = useState('panas-walking.jpg')
  const [ganyaFile, setGanyaFile] = useState('ganya-standing.jpg')
  const [scene, setScene] = useState('an elderly village couple standing together in their farmyard, talking')
  const [shots, setShots] = useState<Shot[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/pair-test')
      .then(r => r.json())
      .then(d => {
        setPanasList(d.panas || [])
        setGanyaList(d.ganya || [])
      })
      .catch(() => setErr('Не вдалося завантажити список поз'))
  }, [])

  async function call(collageOnly: boolean, count: number) {
    setErr('')
    setBusy(collageOnly ? 'collage' : 'gen')
    if (!collageOnly) setShots([])
    try {
      const runs = Array.from({ length: count }, () =>
        fetch('/api/admin/pair-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ panasFile, ganyaFile, scene, collageOnly }),
        }).then(r => r.json()),
      )
      const out = await Promise.all(runs)
      const ok = out.filter(o => !o.error)
      if (ok.length === 0) setErr(out[0]?.error || 'Нічого не згенерувалось')
      setShots(ok)
    } catch {
      setErr('Помилка запиту')
    } finally {
      setBusy(null)
    }
  }

  const btn = (on: boolean): React.CSSProperties => ({
    background: on ? GOLD : '#3a4a60',
    color: on ? NAVY : '#8fa0b8',
    border: 'none',
    borderRadius: 8,
    padding: '11px 18px',
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 700,
    cursor: on ? 'pointer' : 'not-allowed',
  })

  const sel: React.CSSProperties = {
    background: NAVY2,
    color: CREAM,
    border: '1px solid #2c3e57',
    borderRadius: 8,
    padding: '10px 12px',
    fontFamily: FONT,
    fontSize: 13,
    minWidth: 220,
  }

  return (
    <div style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT, padding: '32px 20px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ color: GOLD2, fontSize: 26, margin: '0 0 6px' }}>Тест парної обкладинки</h1>
        <p style={{ color: BLUE, fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Kontext бере лише одне вхідне зображення, тому дві пози склеюються в колаж
          (ліворуч Панас, праворуч Ганя) і подаються разом. Дивимось, чи лишились
          обличчя різними — чи модель зліпила їх в одне.
        </p>

        {err && (
          <div style={{ background: '#3b1f22', border: '1px solid #7d3b42', color: '#ffb4bb', padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>
            {err}
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <label style={{ display: 'block', color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Поза Панаса</label>
            <select value={panasFile} onChange={e => setPanasFile(e.target.value)} style={sel}>
              {panasList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Поза Гані</label>
            <select value={ganyaFile} onChange={e => setGanyaFile(e.target.value)} style={sel}>
              {ganyaList.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display: 'block', color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          Сцена (англійською, одне речення)
        </label>
        <textarea
          value={scene}
          onChange={e => setScene(e.target.value)}
          rows={3}
          style={{ width: '100%', background: NAVY2, color: CREAM, border: '1px solid #2c3e57', borderRadius: 8, padding: 12, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, resize: 'vertical', marginBottom: 18 }}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 26 }}>
          <button style={btn(!busy)} disabled={!!busy} onClick={() => call(true, 1)}>
            {busy === 'collage' ? 'Роблю колаж…' : 'Тільки колаж (безкоштовно)'}
          </button>
          <button style={btn(!busy)} disabled={!!busy} onClick={() => call(false, 4)}>
            {busy === 'gen' ? 'Генерую 4 варіанти…' : 'Згенерувати 4 варіанти'}
          </button>
        </div>

        {shots.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {shots.map((s, i) => (
              <div key={i} style={{ background: NAVY2, borderRadius: 10, overflow: 'hidden', border: '1px solid #2c3e57' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url || s.collageUrl} alt={`варіант ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                <div style={{ padding: '8px 10px', fontSize: 12, color: BLUE, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span>{s.url ? `seed ${s.seed}` : 'колаж'}</span>
                  <a href={s.url || s.collageUrl} target="_blank" rel="noreferrer" style={{ color: GOLD2 }}>відкрити</a>
                </div>
                {s.url && (
                  <div style={{ padding: '0 10px 10px', fontSize: 12 }}>
                    <a href={s.collageUrl} target="_blank" rel="noreferrer" style={{ color: '#7d8aa0' }}>вхідний колаж</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
