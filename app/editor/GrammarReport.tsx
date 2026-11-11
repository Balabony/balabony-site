import type { GrammarResult } from '@/lib/grammar-check'

// 05.11.2026: готовий звіт ШІ про грамотність — щоб редактор не шукав дрібні помилки сам.
const GOLD_L = '#FAC775'
const MUTED = '#8CA0B8'
const LINE = 'rgba(255,255,255,.10)'

export default function GrammarReport({ g, open = true }: { g: GrammarResult | null; open?: boolean }) {
  if (!g) {
    return (
      <div style={{ fontSize: 13, color: MUTED, margin: '0 0 1.2rem' }}>
        ШІ-перевірка грамотності ще не готова — з’явиться тут протягом години.
      </div>
    )
  }
  const color = g.level === 'добра' ? '#7FD1A0' : g.level === 'середня' ? GOLD_L : '#F09A8A'
  return (
    <details open={open} style={{ margin: '0 0 1.4rem', border: `1px solid ${LINE}`, borderRadius: 12, padding: '.8rem 1rem', background: 'rgba(255,255,255,.03)' }}>
      <summary style={{ cursor: 'pointer', fontSize: 15, color: GOLD_L, fontWeight: 600 }}>
        ШІ-перевірка грамотності: <span style={{ color }}>{g.level}</span> · зауважень: {g.issues.length}
      </summary>
      <p style={{ fontSize: 14, color: '#C9D6E6', lineHeight: 1.6, margin: '.7rem 0' }}>{g.summary}</p>
      {g.potential && <p style={{ fontSize: 13.5, color: MUTED, margin: '0 0 .7rem' }}>{g.potential}</p>}
      {g.issues.length > 0 && (
        <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'grid', gap: 8 }}>
          {g.issues.map((i, k) => (
            <li key={k} style={{ fontSize: 14, lineHeight: 1.55, color: '#E8EEF7' }}>
              <span style={{ color: MUTED }}>{i.type}: </span>
              «<span style={{ textDecoration: 'line-through', color: '#F09A8A' }}>{i.quote}</span>» → «<span style={{ color: '#7FD1A0' }}>{i.fix}</span>»
              {i.why ? <span style={{ color: MUTED }}> — {i.why}</span> : null}
            </li>
          ))}
        </ol>
      )}
      {g.truncated && <div style={{ fontSize: 12.5, color: MUTED, marginTop: '.6rem' }}>Перевірено перші {g.checked_chars.toLocaleString('uk-UA')} знаків тексту.</div>}
      <div style={{ fontSize: 12, color: MUTED, marginTop: '.6rem' }}>Це підказка ШІ: рішення й правки — за редактором.</div>
    </details>
  )
}
