'use client'
// 07.11.2026: поставити фото профілю автору, який надіслав його поштою.
import { useState } from 'react'
import { shrinkImage } from '@/lib/shrink-image'

const box: React.CSSProperties = { maxWidth: 620, margin: '24px auto', padding: 20, color: '#e8eef7', fontFamily: 'Montserrat, Arial, sans-serif' }
const inp: React.CSSProperties = { width: '100%', padding: 10, borderRadius: 8, border: '1px solid #3a4f73', background: '#13233f', color: '#e8eef7', fontSize: 15, marginTop: 6 }

export default function FotoAvtora() {
  const [email, setEmail] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pos, setPos] = useState(50)
  const [msg, setMsg] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const preview = file ? URL.createObjectURL(file) : ''

  const save = async () => {
    if (!email || !file) { setMsg('Вкажіть пошту автора й виберіть фото'); return }
    setBusy(true); setMsg(''); setUrl('')
    try {
      const fd = new FormData()
      fd.append('email', email); fd.append('position', String(pos))
      fd.append('file', await shrinkImage(file, 2400, 0.9))
      const r = await fetch('/api/admin/author-avatar', { method: 'POST', body: fd })
      const d = await r.json().catch(() => ({ error: `Помилка ${r.status}` }))
      if (d.ok) { setMsg('Фото поставлено. Воно вже на сторінці автора.'); setUrl(d.url) } else setMsg(d.error ?? 'Не вдалося')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Немає звʼязку') } finally { setBusy(false) }
  }

  return (
    <main style={box}>
      <h1 style={{ color: '#ef9f27', fontSize: 24 }}>Фото профілю автора</h1>
      <p style={{ color: '#9fb0c6' }}>Для авторів, які надіслали фото поштою. Фото обрізається квадратом, як у кабінеті.</p>
      <label>Пошта автора<input style={inp} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="author@gmail.com" /></label>
      <label style={{ display: 'block', marginTop: 14 }}>Фото<input style={inp} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
      <label style={{ display: 'block', marginTop: 14 }}>Кадр: {pos === 0 ? 'верх' : pos === 100 ? 'низ' : pos === 50 ? 'центр' : pos}
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} style={{ width: '100%' }} /></label>
      {preview && <div style={{ width: 220, height: 220, overflow: 'hidden', borderRadius: '50%', margin: '12px 0', backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: `${pos}% ${pos}%` }} />}
      <button onClick={save} disabled={busy} style={{ marginTop: 12, padding: '10px 22px', borderRadius: 8, border: 0, background: '#ef9f27', color: '#0a1628', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{busy ? 'Зберігаю…' : 'Поставити фото'}</button>
      {msg && <p style={{ marginTop: 14 }}>{msg}</p>}
      {url && <img src={url} alt="" width={160} height={160} style={{ borderRadius: '50%' }} />}
    </main>
  )
}
