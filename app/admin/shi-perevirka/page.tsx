'use client'

import { useCallback, useEffect, useState } from 'react'
import AiStyleReport, { type StyleCheck } from '@/app/components/AiStyleReport'

/**
 * Перевірка стилю (ознаки можливого використання ШІ).
 * Джерело: заявка автора, конкурсна заявка, твір із бази або вставлений текст.
 * Результат — концентрація ознак і докази, а не вердикт «написав ШІ».
 */

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY = '#0a1628', CARD = '#0f1f38', GOLD = '#ef9f27', CREAM = '#FFF8EE', MUTED = '#b9c6db', LINE = 'rgba(143,163,196,0.25)'
type Hist = { id: string; source: string; source_id: string | null; title: string | null; words: number; level: string; recommendation: string; created_at: string }
const SRC: Record<string, string> = { application: 'Заявка автора', contest: 'Конкурсна заявка', content: 'Твір (content)', manual: 'Вставлений текст' }

export default function Page() {
  const [source, setSource] = useState('application')
  const [id, setId] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [check, setCheck] = useState<StyleCheck | null>(null)
  const [cached, setCached] = useState(false)
  const [hist, setHist] = useState<Hist[]>([])

  const loadHist = useCallback(async () => {
    const r = await fetch('/api/admin/ai-style-check', { cache: 'no-store' })
    if (r.status === 401) { window.location.href = '/admin/login'; return }
    const d = await r.json() as { history?: Hist[] }
    setHist(d.history ?? [])
  }, [])

  useEffect(() => {
    void loadHist()
    const p = new URLSearchParams(window.location.search)
    if (p.get('source')) setSource(p.get('source')!)
    if (p.get('id')) setId(p.get('id')!)
  }, [loadHist])

  const run = async (force = false) => {
    setErr(''); setBusy(true); setCheck(null)
    try {
      const r = await fetch('/api/admin/ai-style-check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, id, text, title, force }),
      })
      const d = await r.json() as { ok?: boolean; error?: string; check?: StyleCheck; cached?: boolean }
      if (!d.ok || !d.check) { setErr(d.error ?? 'Помилка'); return }
      setCheck(d.check); setCached(Boolean(d.cached)); void loadHist()
    } catch {
      setErr('Немає звʼязку з сервером')
    } finally { setBusy(false) }
  }

  const open = async (cid: string) => {
    const r = await fetch(`/api/admin/ai-style-check?check=${cid}`, { cache: 'no-store' })
    const d = await r.json() as { check?: StyleCheck }
    if (d.check) { setCheck(d.check); setCached(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  }

  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 9, border: `1px solid ${LINE}`, background: NAVY, color: CREAM, fontFamily: FONT, fontSize: 14, marginBottom: 10 }
  const btn = (bg: string, fg: string): React.CSSProperties => ({ padding: '10px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', background: bg, color: fg, fontWeight: 700, fontFamily: FONT })

  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 90px' }}>
        <h1 style={{ color: GOLD, fontSize: 26, margin: '0 0 8px' }}>Перевірка стилю (ШІ)</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: '0 0 18px' }}>
          Показує концентрацію ознак, сумісних із використанням ШІ, з цитатами й ознаками людської руки. Це допомога редактору,
          а не доказ авторства. Той самий текст повторно не оплачується — береться збережений результат.
        </p>

        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <select value={source} onChange={(e) => setSource(e.target.value)} style={field}>
            {Object.entries(SRC).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {source === 'manual' ? (
            <>
              <input placeholder="Назва (необовʼязково)" value={title} onChange={(e) => setTitle(e.target.value)} style={field} />
              <textarea placeholder="Вставте текст твору (від 150 слів)" value={text} onChange={(e) => setText(e.target.value)} style={{ ...field, minHeight: 200 }} />
            </>
          ) : (
            <input placeholder={source === 'content' ? 'ID твору (uuid)' : 'Номер заявки'} value={id} onChange={(e) => setId(e.target.value)} style={field} />
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" disabled={busy} onClick={() => run(false)} style={{ ...btn(GOLD, NAVY), opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Аналізуємо… (до 2 хвилин)' : 'Перевірити'}
            </button>
            {check && <button type="button" disabled={busy} onClick={() => run(true)} style={btn('transparent', GOLD)}>Перевірити заново (платно)</button>}
          </div>
          {err && <p style={{ color: '#ff9b8a', margin: '10px 0 0' }}>{err}</p>}
        </div>

        {check && (
          <>
            {cached && <p style={{ color: MUTED, fontSize: 13 }}>Показано збережений результат.</p>}
            <h2 style={{ fontSize: 20, margin: '0 0 10px' }}>{check.title || 'Без назви'} <span style={{ color: MUTED, fontSize: 14 }}>· {SRC[check.source]}{check.source_id ? ` #${check.source_id}` : ''}</span></h2>
            <AiStyleReport check={check} />
          </>
        )}

        <h2 style={{ color: GOLD, fontSize: 18, margin: '26px 0 10px' }}>Історія перевірок</h2>
        {hist.length === 0 && <p style={{ color: MUTED }}>Перевірок ще не було.</p>}
        {hist.map((h) => (
          <button key={h.id} type="button" onClick={() => open(h.id)}
            style={{ display: 'block', width: '100%', textAlign: 'left', background: CARD, border: `1px solid ${LINE}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8, color: CREAM, cursor: 'pointer', fontFamily: FONT }}>
            <strong>{h.title || 'Без назви'}</strong>{' '}
            <span style={{ color: MUTED, fontSize: 13 }}>· {SRC[h.source]}{h.source_id ? ` #${h.source_id}` : ''} · {h.words} слів · {new Date(h.created_at).toLocaleDateString('uk-UA')}</span>
            <div style={{ fontSize: 13, color: MUTED }}>Концентрація: <span style={{ color: GOLD }}>{h.level}</span> · {h.recommendation}</div>
          </button>
        ))}
      </div>
    </main>
  )
}
