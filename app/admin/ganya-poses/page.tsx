'use client'

import { useEffect, useState } from 'react'

// =============================================================================
// АДМІН: ГЕНЕРАТОР ПОЗ БАБИ ГАНІ
// Крок 1 — згенерувати кілька еталонів, обрати один (канонічний вигляд).
// Крок 2 — з еталона згенерувати кожну позу (Flux тримає те саме обличчя).
// Крок 3 — завантажити найкращі й покласти у public/ganya-poses/ як ganya-<key>.jpg
// =============================================================================

const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD2 = '#FAC775'
const CREAM = '#FFF8EE'
const BLUE = '#B5D4F4'
const FONT = 'Montserrat, system-ui, sans-serif'

type PoseItem = { key: string; label: string; fileName: string }

export default function GanyaPosesPage() {
  const [look, setLook] = useState('')
  const [poses, setPoses] = useState<PoseItem[]>([])
  const [refs, setRefs] = useState<string[]>([])
  const [chosenRef, setChosenRef] = useState('')
  const [poseImgs, setPoseImgs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/generate-ganya-pose')
      .then(r => r.json())
      .then(d => {
        setPoses(d.poses || [])
        if (d.defaultLook) setLook(d.defaultLook)
      })
      .catch(() => setErr('Не вдалося завантажити список поз'))
  }, [])

  async function genRefs() {
    setErr(''); setBusy('refs'); setRefs([])
    try {
      const seeds = [0, 1, 2, 3].map(() => Math.floor(Math.random() * 2_000_000))
      const results = await Promise.all(
        seeds.map(seed =>
          fetch('/api/admin/generate-ganya-pose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: 'reference', description: look, seed }),
          }).then(r => r.json())
        )
      )
      const urls = results.map(r => r.url).filter(Boolean) as string[]
      if (urls.length === 0) setErr('Жоден еталон не згенерувався. Спробуй ще раз.')
      setRefs(urls)
    } catch {
      setErr('Помилка генерації еталонів')
    } finally {
      setBusy(null)
    }
  }

  async function genPose(key: string) {
    if (!chosenRef) { setErr('Спершу обери еталон угорі'); return }
    setErr(''); setBusy(key)
    try {
      const res = await fetch('/api/admin/generate-ganya-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pose', description: look, pose: key, referenceImageUrl: chosenRef }),
      }).then(r => r.json())
      if (res.url) setPoseImgs(prev => ({ ...prev, [key]: res.url }))
      else setErr(res.error || 'Поза не згенерувалась')
    } catch {
      setErr('Помилка генерації пози')
    } finally {
      setBusy(null)
    }
  }

  const btn = (active = true): React.CSSProperties => ({
    background: active ? GOLD : '#5b6b80',
    color: NAVY,
    border: 'none',
    borderRadius: 8,
    padding: '10px 16px',
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 14,
    cursor: active ? 'pointer' : 'default',
  })

  return (
    <div style={{ minHeight: '100%', background: NAVY, color: CREAM, fontFamily: FONT, padding: '28px 22px 120px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ color: GOLD2, fontSize: 26, margin: '0 0 6px' }}>Пози баби Гані</h1>
        <p style={{ color: BLUE, fontSize: 14, lineHeight: 1.5, margin: '0 0 24px' }}>
          Крок 1 — згенеруй еталони й обери один. Крок 2 — з нього згенеруй кожну позу.
          Крок 3 — завантаж найкращі (ПКМ → «Зберегти зображення як…») і поклади у{' '}
          <code style={{ color: GOLD2 }}>public/ganya-poses/</code> з відповідним іменем файлу.
        </p>

        {err && (
          <div style={{ background: '#5a1d1d', color: '#ffd9d9', padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: 14 }}>
            {err}
          </div>
        )}

        {/* ОПИС ВИГЛЯДУ */}
        <label style={{ display: 'block', color: GOLD2, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
          Опис вигляду Гані (англійською — це «замок» обличчя й одягу)
        </label>
        <textarea
          value={look}
          onChange={e => setLook(e.target.value)}
          rows={4}
          style={{ width: '100%', background: NAVY2, color: CREAM, border: `1px solid #2c3e57`, borderRadius: 8, padding: 12, fontFamily: FONT, fontSize: 13, lineHeight: 1.5, resize: 'vertical', marginBottom: 22 }}
        />

        {/* КРОК 1 — ЕТАЛОНИ */}
        <h2 style={{ color: GOLD2, fontSize: 18, margin: '0 0 10px' }}>1. Еталон обличчя</h2>
        <button style={btn(busy !== 'refs')} disabled={busy === 'refs'} onClick={genRefs}>
          {busy === 'refs' ? 'Генерую 4 еталони…' : 'Згенерувати 4 еталони'}
        </button>

        {refs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginTop: 16 }}>
            {refs.map((url, i) => {
              const selected = url === chosenRef
              return (
                <div
                  key={i}
                  onClick={() => setChosenRef(url)}
                  style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: selected ? `3px solid ${GOLD}` : '3px solid transparent', background: NAVY2 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`еталон ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                  <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 13, color: selected ? GOLD2 : BLUE, fontWeight: selected ? 700 : 400 }}>
                    {selected ? '✓ обрано' : 'обрати'}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* КРОК 2 — ПОЗИ */}
        <h2 style={{ color: GOLD2, fontSize: 18, margin: '32px 0 4px' }}>2. Пози</h2>
        <p style={{ color: chosenRef ? BLUE : '#7d8aa0', fontSize: 13, margin: '0 0 14px' }}>
          {chosenRef ? 'Еталон обрано. Генеруй пози по одній.' : 'Спершу обери еталон вище.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {poses.map(p => {
            const img = poseImgs[p.key]
            const isBusy = busy === p.key
            return (
              <div key={p.key} style={{ background: NAVY2, borderRadius: 10, padding: 12, border: '1px solid #2c3e57' }}>
                <div style={{ color: CREAM, fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{p.label}</div>
                <div style={{ color: '#7d8aa0', fontSize: 11, marginBottom: 8 }}>{p.fileName}</div>
                {img && (
                  <a href={img} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={p.label} style={{ width: '100%', borderRadius: 8, display: 'block', marginBottom: 8 }} />
                  </a>
                )}
                <button style={{ ...btn(!isBusy && !!chosenRef), width: '100%' }} disabled={isBusy || !chosenRef} onClick={() => genPose(p.key)}>
                  {isBusy ? 'Генерую…' : img ? 'Перегенерувати' : 'Згенерувати'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
