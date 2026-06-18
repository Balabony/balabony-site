'use client'

import { useEffect, useState } from 'react'

type Pose = { key: string; label: string; fileName: string }

export default function PanasPosesPage() {
  const [poses, setPoses] = useState<Pose[]>([])
  const [defaultLook, setDefaultLook] = useState('')
  const [look, setLook] = useState('')

  // Крок 1 — еталони
  const [refs, setRefs] = useState<string[]>([])
  const [chosenRef, setChosenRef] = useState('')
  const [refBusy, setRefBusy] = useState(false)

  // Крок 2 — пози
  const [poseBusy, setPoseBusy] = useState<Record<string, boolean>>({})
  const [poseUrls, setPoseUrls] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/generate-panas-pose')
      .then(r => r.json())
      .then(d => {
        setPoses(d.poses || [])
        setDefaultLook(d.defaultLook || '')
        setLook(d.defaultLook || '')
      })
      .catch(() => setErr('Не вдалося завантажити список поз'))
  }, [])

  async function genReference() {
    setErr('')
    setRefBusy(true)
    try {
      const r = await fetch('/api/admin/generate-panas-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'reference', description: look }),
      })
      const d = await r.json()
      if (d.url) setRefs(prev => [d.url, ...prev])
      else setErr(d.error || 'Помилка генерації еталона')
    } catch {
      setErr('Помилка мережі')
    } finally {
      setRefBusy(false)
    }
  }

  async function genPose(key: string) {
    if (!chosenRef) { setErr('Спершу обери еталон (клікни на портрет)'); return }
    setErr('')
    setPoseBusy(p => ({ ...p, [key]: true }))
    try {
      const r = await fetch('/api/admin/generate-panas-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pose', pose: key, referenceImageUrl: chosenRef }),
      })
      const d = await r.json()
      if (d.url) setPoseUrls(p => ({ ...p, [key]: d.url }))
      else setErr(d.error || `Помилка пози ${key}`)
    } catch {
      setErr('Помилка мережі')
    } finally {
      setPoseBusy(p => ({ ...p, [key]: false }))
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#e8e8e8' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Генератор поз Панаса</h1>
      <p style={{ opacity: 0.8, marginBottom: 20, lineHeight: 1.5 }}>
        Крок 1 — згенеруй кілька еталонів і обери канонічний вигляд Панаса.
        Крок 2 — з обраного еталона генеруй кожну позу (обличчя зберігається).
        Усі пози — на ЧИСТОМУ фоні, щоб обкладинки потім накладали різні локації.
        Завантаж готові й поклади в <code>public/panas-poses/</code> як <code>panas-&lt;поза&gt;.jpg</code>.
      </p>

      {err && (
        <div style={{ background: '#5b1a1a', padding: 12, borderRadius: 8, marginBottom: 16 }}>{err}</div>
      )}

      {/* КРОК 1 */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Крок 1 · Еталон</h2>
        <textarea
          value={look}
          onChange={e => setLook(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: 10, borderRadius: 8, background: '#1a2236', color: '#e8e8e8', border: '1px solid #33405e', marginBottom: 10 }}
          placeholder="Опис зовнішності Панаса (англійською)"
        />
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <button onClick={genReference} disabled={refBusy}
            style={{ padding: '10px 18px', borderRadius: 8, background: refBusy ? '#444' : '#2E75B6', color: '#fff', border: 'none', fontWeight: 600, cursor: refBusy ? 'default' : 'pointer' }}>
            {refBusy ? 'Генерую…' : 'Згенерувати еталон'}
          </button>
          <button onClick={() => setLook(defaultLook)}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#33405e', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Скинути опис
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {refs.map((u, i) => (
            <div key={i} onClick={() => setChosenRef(u)}
              style={{ border: chosenRef === u ? '3px solid #4caf50' : '3px solid transparent', borderRadius: 10, overflow: 'hidden', cursor: 'pointer' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`ref-${i}`} style={{ width: '100%', display: 'block' }} />
              {chosenRef === u && <div style={{ textAlign: 'center', padding: 4, background: '#1b5e20', fontSize: 13 }}>обрано ✓</div>}
            </div>
          ))}
        </div>
      </section>

      {/* КРОК 2 */}
      <section>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
          Крок 2 · Пози {chosenRef ? '' : '(спершу обери еталон вище)'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {poses.map(p => (
            <div key={p.key} style={{ background: '#161d2e', borderRadius: 10, padding: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.label}</div>
              <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>{p.fileName}</div>
              {poseUrls[p.key] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={poseUrls[p.key]} alt={p.key} style={{ width: '100%', borderRadius: 6, marginBottom: 8, display: 'block' }} />
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => genPose(p.key)} disabled={!!poseBusy[p.key] || !chosenRef}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: poseBusy[p.key] ? '#444' : (chosenRef ? '#2E75B6' : '#33405e'), color: '#fff', border: 'none', cursor: chosenRef ? 'pointer' : 'default', fontSize: 13 }}>
                  {poseBusy[p.key] ? 'Генерую…' : (poseUrls[p.key] ? 'Перегенерувати' : 'Згенерувати')}
                </button>
                {poseUrls[p.key] && (
                  <a href={poseUrls[p.key]} download={p.fileName} target="_blank" rel="noreferrer"
                    style={{ padding: '8px 10px', borderRadius: 6, background: '#1b5e20', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
                    ↓
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
