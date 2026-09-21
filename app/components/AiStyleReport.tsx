'use client'

/**
 * Звіт визначальника стилю. Використовується на /admin/shi-perevirka і в
 * «Заявках авторів». Лише показує збережений результат, нічого не рахує.
 */

type Marker = { n: number; name: string; score: number; evidence: string[]; human_explanation: string }
export type StyleCheck = {
  id: string
  source: string
  source_id: string | null
  title: string | null
  words: number
  created_at: string
  stats: Record<string, unknown> & { topRepeats?: { phrase: string; count: number }[]; mixedScriptWords?: string[] }
  result: {
    level: string; summary: string; scenario: string; markers: Marker[]
    human_signs: { quote: string; why: string }[]; answers_analysis: string | null
    questions_for_author: string[]; recommendation: string; recommendation_reason: string
    unverified_quotes?: string[]
  }
}

const C = { card: '#0f1f38', deep: '#0a1628', gold: '#ef9f27', cream: '#FFF8EE', muted: '#b9c6db', line: 'rgba(143,163,196,0.25)' }
const scoreColor = (s: number) => (s >= 9 ? '#ff8a7a' : s >= 7 ? '#f3b35a' : s >= 5 ? '#e8d27a' : '#7fd08a')
const recColor = (r: string) => (r.startsWith('є серйозні') ? '#ff8a7a' : r.startsWith('запросити') ? '#f3b35a' : r.includes('уточнень') ? '#e8d27a' : '#7fd08a')

const STAT_LABELS: [string, string][] = [
  ['words', 'Слів'], ['sentences', 'Речень'], ['meanSentence', 'Середнє речення, слів'], ['medianSentence', 'Медіана речення'],
  ['shortShare', 'Частка речень ≤5 слів'], ['longShare', 'Частка речень ≥25 слів'], ['oneSentenceParagraphShare', 'Абзаців з одного речення'],
  ['dialogueLines', 'Реплік діалогу'], ['dashesPer1000', 'Тире на 1000 слів'], ['ellipsesPer1000', 'Трикрапок на 1000 слів'],
  ['similesPer1000', '«мов/ніби/наче» на 1000 слів'], ['antithesisCount', 'Антитез «не…, а…»'], ['neVidAVidCount', '«не від…, а…»'],
]

export default function AiStyleReport({ check }: { check: StyleCheck }) {
  const r = check.result
  const s = check.stats
  const box: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 12 }
  const h: React.CSSProperties = { color: C.gold, fontSize: 15, fontWeight: 700, margin: '0 0 10px' }
  return (
    <div style={{ color: C.cream, fontSize: 14, lineHeight: 1.6 }}>
      <div style={box}>
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
          Концентрація ознак: <span style={{ color: C.gold }}>{r.level}</span>
        </div>
        <p style={{ margin: '0 0 8px' }}>{r.summary}</p>
        <p style={{ margin: '0 0 8px', color: C.muted }}><strong>Найімовірніший сценарій:</strong> {r.scenario}</p>
        <p style={{ margin: '0 0 8px' }}>
          <strong>Редакційна порада:</strong>{' '}
          <span style={{ color: recColor(r.recommendation), fontWeight: 700 }}>{r.recommendation}</span> — {r.recommendation_reason}
        </p>
        <p style={{ margin: 0, fontSize: 12.5, color: C.muted, fontStyle: 'italic' }}>
          Це не є доказом того, що текст створено ШІ. Для встановлення авторства потрібні додаткові матеріали: попередні тексти
          автора, чернетки, історія редагування або порівняльний стилометричний аналіз.
        </p>
      </div>

      <div style={box}>
        <div style={h}>Цифри (порахувала програма)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '4px 16px' }}>
          {STAT_LABELS.map(([k, label]) => (
            <div key={k}><span style={{ color: C.muted }}>{label}:</span> <strong>{String(s[k] ?? '—')}</strong></div>
          ))}
        </div>
        {!!s.topRepeats?.length && (
          <p style={{ margin: '10px 0 0' }}><span style={{ color: C.muted }}>Повтори з 3 слів:</span>{' '}
            {s.topRepeats.map((t) => `«${t.phrase}» ×${t.count}`).join(', ')}</p>
        )}
        {!!s.mixedScriptWords?.length && (
          <p style={{ margin: '6px 0 0', color: '#f3b35a' }}>Слова зі змішаними латинськими й кириличними літерами: {s.mixedScriptWords.join(', ')}</p>
        )}
      </div>

      <div style={box}>
        <div style={h}>10 маркерів</div>
        {(r.markers ?? []).map((m) => (
          <div key={m.n} style={{ borderTop: `1px solid ${C.line}`, padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <strong>{m.n}. {m.name}</strong>
              <span style={{ color: scoreColor(m.score), fontWeight: 800 }}>{m.score} / 12</span>
            </div>
            {(m.evidence ?? []).map((q, i) => <div key={i} style={{ color: C.cream, fontStyle: 'italic', margin: '4px 0 0 10px' }}>«{q}»</div>)}
            <div style={{ color: C.muted, marginTop: 4 }}>Людське пояснення: {m.human_explanation}</div>
          </div>
        ))}
      </div>

      {!!r.human_signs?.length && (
        <div style={box}>
          <div style={h}>Ознаки людської руки</div>
          {r.human_signs.map((x, i) => (
            <div key={i} style={{ margin: '0 0 8px' }}><em>«{x.quote}»</em> <span style={{ color: C.muted }}>— {x.why}</span></div>
          ))}
        </div>
      )}

      {r.answers_analysis && (
        <div style={box}><div style={h}>Відповіді автора</div><p style={{ margin: 0 }}>{r.answers_analysis}</p></div>
      )}

      {!!r.questions_for_author?.length && (
        <div style={box}>
          <div style={h}>Що спитати в автора</div>
          <ol style={{ margin: 0, paddingLeft: 20 }}>{r.questions_for_author.map((q, i) => <li key={i}>{q}</li>)}</ol>
        </div>
      )}

      {!!r.unverified_quotes?.length && (
        <div style={{ ...box, borderColor: '#f3b35a' }}>
          <div style={{ ...h, color: '#f3b35a' }}>Цитати, яких немає в тексті дослівно (прибрано з доказів)</div>
          {r.unverified_quotes.map((q, i) => <div key={i} style={{ color: C.muted }}>«{q}»</div>)}
        </div>
      )}
      <p style={{ color: C.muted, fontSize: 12 }}>Перевірка #{check.id} · {check.words} слів · {new Date(check.created_at).toLocaleString('uk-UA')}</p>
    </div>
  )
}
