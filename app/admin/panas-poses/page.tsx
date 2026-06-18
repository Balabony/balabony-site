'use client'

import { useEffect, useState } from 'react'

type Pose = { key: string; label: string; fileName: string }

// Канонічний еталон Панаса за замовчуванням — твоє фото з public/panas-poses/.
// kontext бере це обличчя й ліпить кожну позу на ЧИСТОМУ фоні.
const DEFAULT_REF = 'https://balabony.com/panas-poses/panas-holding.jpg'

export default function PanasPosesPage() {
  const [poses, setPoses] = useState<Pose[]>([])

  // Канонічний еталон (URL фото)
  const [refUrl, setRefUrl] = useState(DEFAULT_REF)
  const [refInput, setRefInput] = useState(DEFAULT_REF)

  // Крок 2 — пози
  const [poseBusy, setPoseBusy] = useState<Record<string, boolean>>({})
  const [poseUrls, setPoseUrls] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch('/api/admin/generate-panas-pose')
      .then(r => r.json())
      .then(d => setPoses(d.poses || []))
      .catch(() => setErr('Не вдалося завантажити список поз'))
  }, [])

  function applyRef() {
    const u = refInput.trim()
    if (!u) { setErr('Встав URL канонічного фото'); return }
    setRefUrl(u)
    setErr('')
  }

  async function genPose(key: string) {
    if (!refUrl) { setErr('Спершу задай канонічне фото-еталон'); return }
    setErr('')
    setPoseBusy(p => ({ ...p, [key]: true }))
    try {
      const r = await fetch('/api/admin/generate-panas-pose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'pose', pose: key, referenceImageUrl: refUrl }),
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

  async function genAll() {
    for (const p of poses) {
      // послідовно, щоб не перевантажити Replicate
      // eslint-disable-next-line no-await-in-loop
      await genPose(p.key)
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 24, color: '#e8e8e8' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Генератор поз Панаса</h1>
      <p style={{ opacity: 0.8, marginBottom: 20, lineHeight: 1.5 }}>
        Канонічне фото Панаса = еталон. З нього генеруємо кожну позу на ЧИСТОМУ фоні
        (обличчя зберігається), щоб обкладинки потім накладали різні локації.
        Завантаж готові пози й поклади в <code>public/panas-poses/</code> як <code>panas-&lt;поза&gt;.jpg</code>.
      </p>

      {err && (
        <div style={{ background: '#5b1a1a', padding: 12, borderRadius: 8, marginBottom: 16 }}>{err}</div>
      )}

      {/* КАНОНІЧНИЙ ЕТАЛОН */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Канонічний еталон</h2>
        <p style={{ opacity: 0.7, marginBottom: 10, fontSize: 14 }}>
          URL фото Панаса, з якого братиметься обличчя. За замовчуванням — твій <code>panas-holding.jpg</code>.
          Можеш вставити інший URL (фото має відкриватися в браузері).
        </p>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <input
            value={refInput}
            onChange={e => setRefInput(e.target.value)}
            style={{ flex: 1, padding: 10, borderRadius: 8, background: '#1a2236', color: '#e8e8e8', border: '1px solid #33405e' }}
            placeholder="https://balabony.com/panas-poses/panas-holding.jpg"
          />
          <button onClick={applyRef}
            style={{ padding: '10px 18px', borderRadius: 8, background: '#2E75B6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Застосувати
          </button>
        </div>
        {refUrl && (
          <div style={{ maxWidth: 240, border: '3px solid #4caf50', borderRadius: 10, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={refUrl} alt="еталон" style={{ width: '100%', display: 'block' }} />
            <div style={{ textAlign: 'center', padding: 4, background: '#1b5e20', fontSize: 13 }}>еталон ✓</div>
          </div>
        )}
      </section>

      {/* КРОК 2 */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Пози (на чистому фоні)</h2>
          <button onClick={genAll}
            style={{ padding: '8px 16px', borderRadius: 8, background: '#1b5e20', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            Згенерувати ВСІ по черзі
          </button>
        </div>
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
                <button onClick={() => genPose(p.key)} disabled={!!poseBusy[p.key]}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 6, background: poseBusy[p.key] ? '#444' : '#2E75B6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}>
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
