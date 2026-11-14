'use client'
// 01.11.2026: мінітест «Перевір себе» під кожним правилом (Учням / Студентам). Без збереження на сервері:
// відповідь показуємо одразу з поясненням, наприкінці — результат і заклик читати на Балабонах.
import { useState } from 'react'
import type { Quiz as Q } from '@/lib/pravopys/data'

const NAVY = '#0f172a', GOLD = '#ef9f27', IVORY = '#f8fafc'

export default function Quiz({ items, title }: { items: Q[]; title: string }) {
  const [picked, setPicked] = useState<(number | null)[]>(items.map(() => null))
  const done = picked.every((p) => p !== null)
  const score = picked.filter((p, i) => p === items[i].answer).length
  return (
    <section style={{ background: NAVY, color: IVORY, borderRadius: 22, padding: '24px 24px 26px', margin: '0 0 24px', border: `2px solid ${GOLD}` }} aria-labelledby="quiz-h">
      <h2 id="quiz-h" style={{ fontFamily: "'Lora', Georgia, serif", color: GOLD, fontSize: 26, margin: '0 0 14px' }}>{title}</h2>
      {items.map((it, i) => {
        const p = picked[i]
        return (
          <div key={i} style={{ margin: '0 0 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{i + 1}. {it.q}</div>
            <div role="group" aria-label={`Питання ${i + 1}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {it.options.map((o, j) => {
                const chosen = p === j
                const right = p !== null && j === it.answer
                return (
                  <button key={j} type="button" aria-disabled={p !== null} aria-pressed={chosen}
                    onClick={() => { if (p === null) setPicked((a) => a.map((x, k) => (k === i ? j : x))) }}
                    style={{ fontFamily: 'inherit', fontSize: 21, fontWeight: 700, padding: '8px 18px', borderRadius: 12, cursor: p === null ? 'pointer' : 'default',
                      background: right ? GOLD : chosen ? '#334155' : '#1e293b', color: right ? NAVY : IVORY, border: `2px solid ${right ? GOLD : '#334155'}`,
                      textDecoration: chosen && !right ? 'line-through' : 'none' }}>
                    {o}
                  </button>
                )
              })}
            </div>
            {p !== null && <p role="status" style={{ margin: '8px 0 0', fontSize: 18, color: p === it.answer ? GOLD : '#cbd5e1' }}>{p === it.answer ? 'Правильно! ' : 'Не зовсім. '}{it.why}</p>}
          </div>
        )
      })}
      {done && (
        <div style={{ borderTop: '1px solid #334155', paddingTop: 14 }}>
          <p style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Результат: {score} з {items.length}</p>
          <button type="button" onClick={() => setPicked(items.map(() => null))} style={{ fontFamily: 'inherit', fontSize: 17, fontWeight: 700, padding: '10px 18px', borderRadius: 999, background: 'transparent', color: IVORY, border: '2px solid #334155', cursor: 'pointer', marginRight: 10 }}>Пройти ще раз</button>
          <a href="/stories" style={{ display: 'inline-block', background: GOLD, color: NAVY, fontWeight: 800, padding: '10px 20px', borderRadius: 999, textDecoration: 'none', fontSize: 17 }}>Читати оповідання українською →</a>
        </div>
      )}
    </section>
  )
}
