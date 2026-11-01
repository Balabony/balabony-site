'use client'
// 01.11.2026: програвач квесту — крок за кроком; диплом наприкінці доступний після входу (батьки або вчитель).
import { useEffect, useState, type CSSProperties } from 'react'
import type { Kvest } from '@/lib/kvesty'

const NAVY = '#0f172a', GOLD = '#ef9f27', GOLD_BG = '#fff7e8', BORDER = '#e2e8f0', TEXT = '#1e293b', MUTED = '#64748b'
const btn: CSSProperties = { fontFamily: 'inherit', fontSize: 20, fontWeight: 800, padding: '12px 22px', borderRadius: 14, border: `2px solid ${GOLD}`, background: GOLD, color: NAVY, cursor: 'pointer' }
const opt: CSSProperties = { ...btn, background: '#fff', border: `2px solid ${BORDER}`, fontWeight: 700, textAlign: 'left' }

export default function Player({ k }: { k: Kvest }) {
  const [i, setI] = useState(-1) // -1 — старт, steps.length — фінал
  const [picked, setPicked] = useState<number | null>(null)
  const [stars, setStars] = useState(0)
  const [user, setUser] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [showDiploma, setShowDiploma] = useState(false)

  useEffect(() => {
    if (i === k.steps.length && user === null) {
      fetch('/api/kids-contest', { cache: 'no-store' }).then((r) => r.json()).then((j) => setUser(!!j.user)).catch(() => setUser(false))
    }
  }, [i, k.steps.length, user])

  const next = () => { setPicked(null); setI((x) => x + 1); if (typeof window !== 'undefined') document.getElementById('kvest')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  const total = k.steps.filter((s) => s.type === 'riddle' || s.type === 'quiz').length

  const box: CSSProperties = { background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, padding: '20px 20px 22px' }
  const progress = i >= 0 && i < k.steps.length && (
    <div aria-label="Прогрес" style={{ display: 'flex', gap: 6, margin: '0 0 16px' }}>
      {k.steps.map((_, n) => <span key={n} style={{ flex: 1, height: 8, borderRadius: 4, background: n < i ? GOLD : n === i ? '#fac775' : BORDER }} />)}
    </div>
  )

  if (i === -1) return (
    <div id="kvest" style={box}>
      <p style={{ fontSize: 21, margin: '0 0 18px', color: TEXT }}>{k.lead}</p>
      <button type="button" style={btn} onClick={next}>Почати квест →</button>
    </div>
  )

  if (i === k.steps.length) return (
    <div id="kvest" style={box}>
      <p style={{ fontSize: 21, margin: '0 0 14px' }}>{k.finale}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: '0 0 18px' }}>Зірочок: {'★'.repeat(stars)}{'☆'.repeat(Math.max(0, total - stars))} ({stars} з {total})</p>
      {user === null && <p style={{ color: MUTED }}>Готуємо диплом…</p>}
      {user === false && (
        <div style={{ background: GOLD_BG, border: `2px dashed ${GOLD}`, borderRadius: 16, padding: '16px 18px' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, color: NAVY }}>Отримай цифровий диплом «Мандрівник Балабонів»! Для цього потрібна реєстрація — зверніться до батьків або педагогів, вони допоможуть.</p>
          <a href={`/login?next=${encodeURIComponent('/kvesty/' + k.slug)}`} style={{ ...btn, display: 'inline-block', textDecoration: 'none', fontSize: 18 }}>Увійти й отримати диплом →</a>
        </div>
      )}
      {user === true && !showDiploma && (
        <div>
          <label htmlFor="kv-name" style={{ display: 'block', fontWeight: 700, color: NAVY, margin: '0 0 6px' }}>Ім’я мандрівника для диплома</label>
          <input id="kv-name" value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} style={{ fontFamily: 'inherit', fontSize: 20, padding: '10px 14px', borderRadius: 12, border: `2px solid ${BORDER}`, width: '100%', maxWidth: 360, boxSizing: 'border-box' }} />
          <div style={{ marginTop: 12 }}><button type="button" style={btn} disabled={name.trim().length < 2} onClick={() => setShowDiploma(true)}>Показати диплом</button></div>
        </div>
      )}
      {user === true && showDiploma && (
        <div>
          <div id="diploma" style={{ border: `6px double ${GOLD}`, borderRadius: 20, padding: '28px 22px', textAlign: 'center', background: '#fffdf7' }}>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: GOLD }}>Балабони · диплом</div>
            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 30, fontWeight: 700, color: NAVY, margin: '10px 0 6px' }}>Мандрівник Балабонів</div>
            <div style={{ fontSize: 18, color: MUTED }}>вручається</div>
            <div style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 34, fontWeight: 700, color: NAVY, margin: '6px 0 10px' }}>{name.trim()}</div>
            <div style={{ fontSize: 18 }}>за проходження квесту «{k.title}»</div>
            <div style={{ fontSize: 26, color: GOLD, margin: '8px 0' }}>{'★'.repeat(stars)}</div>
            <div style={{ fontSize: 14, color: MUTED }}>{new Date().toLocaleDateString('uk-UA')} · balabony.com/kvesty</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
            <button type="button" style={btn} onClick={() => window.print()}>Надрукувати або зберегти PDF</button>
            <a href="/kvesty" style={{ ...opt, display: 'inline-block', textDecoration: 'none', fontSize: 18 }}>Інші квести →</a>
          </div>
        </div>
      )}
    </div>
  )

  const s = k.steps[i]
  return (
    <div id="kvest" style={box}>
      {progress}
      {'text' in s && s.text && <p style={{ fontSize: 21, margin: '0 0 14px', color: TEXT }}>{s.text}</p>}

      {s.type === 'story' && <button type="button" style={btn} onClick={next}>Далі →</button>}

      {(s.type === 'riddle' || s.type === 'quiz') && (
        <div>
          <p style={{ fontSize: 23, fontWeight: 800, color: NAVY, margin: '0 0 12px', whiteSpace: 'pre-line' }}>{s.q}</p>
          <div style={{ display: 'grid', gap: 10 }}>
            {s.options.map((o, n) => {
              const right = picked !== null && n === s.answer, wrong = picked === n && n !== s.answer
              return (
                <button key={o} type="button" disabled={picked !== null && picked === s.answer}
                  onClick={() => { if (picked === null && n === s.answer) setStars((x) => x + 1); setPicked(n) }}
                  style={{ ...opt, background: right ? GOLD : wrong ? BORDER : '#fff', borderColor: right ? GOLD : BORDER, textDecoration: wrong ? 'line-through' : 'none' }}>{o}</button>
              )
            })}
          </div>
          {picked !== null && picked !== s.answer && <p role="status" style={{ margin: '12px 0 0', color: NAVY, fontWeight: 700 }}>Майже! Спробуй ще раз.</p>}
          {picked === s.answer && (
            <div role="status" style={{ marginTop: 14 }}>
              <p style={{ margin: '0 0 12px', background: GOLD_BG, borderRadius: 12, padding: '10px 14px' }}><b>Правильно!</b> {s.why}</p>
              <button type="button" style={btn} onClick={next}>Далі →</button>
            </div>
          )}
        </div>
      )}

      {s.type === 'choice' && (
        <div>
          <p style={{ fontSize: 23, fontWeight: 800, color: NAVY, margin: '0 0 12px' }}>{s.q}</p>
          {picked === null ? (
            <div style={{ display: 'grid', gap: 10 }}>{s.options.map((o, n) => <button key={o.label} type="button" style={opt} onClick={() => setPicked(n)}>{o.label}</button>)}</div>
          ) : (
            <div><p style={{ margin: '0 0 12px', background: GOLD_BG, borderRadius: 12, padding: '10px 14px' }}>{s.options[picked].reply}</p><button type="button" style={btn} onClick={next}>Далі →</button></div>
          )}
        </div>
      )}

      {s.type === 'say' && (
        <div>
          <p style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 26, fontWeight: 700, color: NAVY, whiteSpace: 'pre-line', background: GOLD_BG, border: `2px dashed ${GOLD}`, borderRadius: 14, padding: '14px 18px', margin: '0 0 12px' }}>{s.phrase}</p>
          <p style={{ margin: '0 0 12px' }}>{s.q}</p>
          <button type="button" style={btn} onClick={next}>Сказав(ла)! →</button>
        </div>
      )}
    </div>
  )
}
