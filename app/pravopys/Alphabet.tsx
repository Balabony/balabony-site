'use client'
// 14.11.2026: «Українська абетка» — інтерактивні плитки (Учням) і таблиця з назвами (Студентам).
// Дані — з таблиці розділу 4.1 стандарту (33 букви, порядкові номери, назви).
import { useState } from 'react'
import { ALPHABET, type Letter } from '@/lib/pravopys/data'

const NAVY = '#0f172a', GOLD = '#ef9f27', GOLD_BG = '#fff7e8', BORDER = '#e2e8f0', MUTED = '#475569'
const SERIF = "'Lora', Georgia, serif"
const KIND_SHORT: Record<Letter['kind'], string> = { v: 'голосна', c: 'приголосна', s: 'м’який знак' }
const KIND_LABEL: Record<Letter['kind'], string> = { v: 'голосна', c: 'приголосна', s: 'не має окремого звука — показує м’якість' }

function Word({ word, letter }: { word: string; letter: string }) {
  const i = word.toLowerCase().indexOf(letter)
  if (i < 0) return <>{word}</>
  return <>{word.slice(0, i)}<b style={{ color: NAVY, background: '#fef08a', borderRadius: 4, padding: '0 3px' }}>{word.slice(i, i + 1)}</b>{word.slice(i + 1)}</>
}

export function AlphabetGrid() {
  const [sel, setSel] = useState<number | null>(null)
  const [f, setF] = useState<'all' | Letter['kind']>('all')
  const cur = sel === null ? null : ALPHABET[sel]
  const filters: { k: 'all' | Letter['kind']; l: string }[] = [{ k: 'all', l: 'Усі 33' }, { k: 'v', l: 'Голосні 10' }, { k: 'c', l: 'Приголосні 22' }, { k: 's', l: 'М’який знак' }]
  return (
    <div style={{ margin: '18px 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        {filters.map((x) => (
          <button key={x.k} type="button" aria-pressed={f === x.k} onClick={() => setF(x.k)}
            style={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 700, padding: '8px 16px', borderRadius: 999, cursor: 'pointer', background: f === x.k ? GOLD : '#fff', color: NAVY, border: `2px solid ${f === x.k ? GOLD : BORDER}` }}>{x.l}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: 10 }}>
        {ALPHABET.map((L, i) => {
          const on = sel === i
          if (f !== 'all' && L.kind !== f) return null
          return (
            <button key={L.n} type="button" aria-pressed={on} aria-label={`Буква ${L.up}, номер ${L.n}, назва: ${L.name}, ${KIND_SHORT[L.kind]}`} onClick={() => setSel(i)}
              style={{ fontFamily: SERIF, cursor: 'pointer', padding: '8px 2px', borderRadius: 14, textAlign: 'center',
                background: on ? NAVY : L.kind === 'v' ? GOLD_BG : '#fff', color: on ? GOLD : NAVY, border: `2px solid ${on ? NAVY : L.kind === 'v' ? GOLD : BORDER}` }}>
              <span style={{ display: 'block', fontSize: 26, fontWeight: 700, lineHeight: 1.1 }}>{L.up}{L.lo}</span>
              <span aria-hidden="true" style={{ display: 'block', fontSize: 14, color: on ? '#cbd5e1' : MUTED, fontFamily: "'Montserrat', Arial, sans-serif" }}>{L.kind === 'v' ? '● ' : ''}{L.n}</span>
            </button>
          )
        })}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 15, color: MUTED }}>● — голосна буква (золота плитка). Букву можна вибрати мишею, пальцем або клавішею Tab і Enter.</p>
      <div role="status" aria-live="polite" style={{ marginTop: 16, background: NAVY, color: '#f8fafc', borderRadius: 18, padding: '18px 22px', minHeight: 84, border: `2px solid ${GOLD}` }}>
        {cur ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{cur.up}{cur.lo}</span>
              <span style={{ fontSize: 22 }}>№ {cur.n} · називається <b style={{ color: GOLD }}>{cur.name}</b></span>
            </div>
            <div style={{ marginTop: 8, fontSize: 18 }}>{KIND_LABEL[cur.kind]} · слово: <span style={{ fontSize: 22, fontWeight: 700 }}><Word word={cur.word} letter={cur.lo} /></span></div>
          </>
        ) : <span style={{ fontSize: 18, color: '#cbd5e1' }}>Натисни на букву — побачиш її назву, номер і слово-приклад. Золоті плитки — голосні.</span>}
      </div>
    </div>
  )
}

export function AlphabetTable() {
  const th = { textAlign: 'left' as const, padding: '8px 12px', background: NAVY, color: GOLD, fontSize: 15 }
  const td = { padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, fontSize: 18 }
  return (
    <div style={{ overflowX: 'auto', margin: '16px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
        <caption style={{ textAlign: 'left', fontSize: 15, color: MUTED, padding: '0 0 8px' }}>Український алфавіт за стандартом 2026, підрозділ 4.1</caption>
        <thead><tr><th style={th}>№</th><th style={th}>Велика</th><th style={th}>Мала</th><th style={th}>Назва букви</th></tr></thead>
        <tbody>
          {ALPHABET.map((L) => (
            <tr key={L.n}><td style={td}>{L.n}</td><td style={{ ...td, fontFamily: SERIF, fontWeight: 700, color: NAVY, fontSize: 22 }}>{L.up}</td><td style={{ ...td, fontFamily: SERIF, fontWeight: 700, color: NAVY, fontSize: 22 }}>{L.lo}</td><td style={td}>{L.name}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
