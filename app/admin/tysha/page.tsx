'use client'

import { useState, useMemo } from 'react'
import { checkTysha, summarize, type Finding, type Severity } from '@/lib/canon/tysha'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'
const NAVY = '#0f1e3a'
const NAVY_DEEP = '#0a1628'
const INK = '#f5f0e8'

const SEV: Record<Severity, { label: string; color: string; bg: string; order: number }> = {
  error: { label: 'помилка', color: '#d94545', bg: 'rgba(217,69,69,0.12)', order: 0 },
  warn:  { label: 'увага',   color: '#f0a500', bg: 'rgba(240,165,0,0.10)', order: 1 },
  info:  { label: 'інфо',    color: '#7aa2c4', bg: 'rgba(255,255,255,0.05)', order: 2 },
}

function countWords(t: string): number {
  return (t.match(/[А-Яа-яІіЇїЄєҐґ'’\u02bc-]+/g) ?? []).length
}

export default function TyshaMaisternia() {
  const [text, setText] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)

  const words = useMemo(() => countWords(text), [text])

  function run() {
    setFindings(checkTysha(text))
  }
  function clear() {
    setText('')
    setFindings(null)
  }

  const sum = findings ? summarize(findings) : null
  const sorted = findings
    ? [...findings].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order)
    : []

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px 16px', fontFamily: FONT, color: INK }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>
        Майстерня «Тиші»
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', margin: '0 0 18px' }}>
        Встав текст серії й перевір канон: передвісники, надмірна «тиша», магія, розжовування,
        складні конструкції, формат реплік, довжина. Механіка ловить грубе й часте — вичитуй ще й оком.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Встав сюди повний текст серії…"
        style={{
          width: '100%', minHeight: 280, resize: 'vertical', boxSizing: 'border-box',
          padding: 14, borderRadius: 10, background: NAVY_DEEP, color: INK,
          border: '1px solid rgba(255,255,255,0.12)', fontSize: 14, lineHeight: 1.5,
          fontFamily: "'Georgia', serif", outline: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 4px' }}>
        <button
          onClick={run}
          disabled={!text.trim()}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            background: text.trim() ? GOLD : 'rgba(240,165,0,0.3)', color: NAVY_DEEP,
            fontWeight: 700, fontSize: 14, fontFamily: FONT,
          }}
        >
          Перевірити канон
        </button>
        <button
          onClick={clear}
          style={{
            padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
            background: 'transparent', color: 'rgba(245,240,232,0.7)',
            border: '1px solid rgba(255,255,255,0.15)', fontSize: 14, fontFamily: FONT,
          }}
        >
          Очистити
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>
          {words} слів {words > 0 && words < 1500 ? '· закоротко' : ''}
          {words > 2300 ? '· задовго' : ''}
        </span>
      </div>

      {sum && (
        <div style={{ display: 'flex', gap: 10, margin: '16px 0' }}>
          {(['error', 'warn', 'info'] as Severity[]).map((s) => (
            <div key={s} style={{
              flex: 1, textAlign: 'center', padding: '12px 8px', borderRadius: 10,
              background: SEV[s].bg, border: `1px solid ${SEV[s].color}`,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: SEV[s].color }}>{sum[s]}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,240,232,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {SEV[s].label}
              </div>
            </div>
          ))}
        </div>
      )}

      {findings && findings.length === 0 && (
        <div style={{
          padding: 16, borderRadius: 10, background: 'rgba(45,143,78,0.12)',
          border: '1px solid #2d8f4e', color: '#7ddb9f', fontSize: 14,
        }}>
          Чисто — механічних зауважень немає. Усе одно перечитай оком: функція не ловить прихованих
          передвісників і магію в підтексті.
        </div>
      )}

      {sorted.map((f, i) => (
        <div key={i} style={{
          margin: '8px 0', padding: '12px 14px', borderRadius: 10,
          background: SEV[f.severity].bg, borderLeft: `3px solid ${SEV[f.severity].color}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              color: SEV[f.severity].color,
            }}>
              {SEV[f.severity].label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{f.rule}</span>
          </div>
          <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.85)', lineHeight: 1.45 }}>
            {f.message}
          </div>
          {f.excerpt && (
            <div style={{
              marginTop: 6, padding: '6px 10px', borderRadius: 6,
              background: 'rgba(0,0,0,0.25)', fontSize: 12.5, color: 'rgba(245,240,232,0.7)',
              fontFamily: "'Georgia', serif", fontStyle: 'italic',
            }}>
              «{f.excerpt}»
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
