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
  stats: Record<string, unknown> & {
    topRepeats?: { phrase: string; count: number }[]; mixedScriptWords?: string[]
    typography?: Record<string, number | string[]> & { mixed?: string[]; segmentSwitches?: string[] }
  }
  result: {
    level: string; summary: string; scenario: string; markers: Marker[]
    human_signs: { quote: string; why: string }[]; answers_analysis: string | null
    questions_for_author: string[]; recommendation: string; recommendation_reason: string
    unverified_quotes?: string[]
    index?: number
    stage?: string
  }
}

/** Індекс 0–100 з балів маркерів (для старих перевірок, де він не збережений). */
export function indexOf(r: { index?: number; markers?: { score: number }[] }): number {
  if (typeof r.index === 'number') return r.index
  const m = (r.markers ?? []).slice(0, 10)
  if (!m.length) return 0
  return Math.round(m.reduce((a, x) => a + (Number(x.score) || 0), 0) / (12 * m.length) * 100)
}
export const indexBand = (i: number) => (i >= 76 ? ['дуже значна', '#ff8a7a'] : i >= 56 ? ['значна', '#f3b35a'] : i >= 31 ? ['помірна', '#e8d27a'] : ['низька', '#7fd08a'])

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
  const idx = indexOf(r)
  const [band, bandColor] = indexBand(idx)
  const stage = r.stage ?? 'попередній'
  const box: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16, marginBottom: 12 }
  const h: React.CSSProperties = { color: C.gold, fontSize: 15, fontWeight: 700, margin: '0 0 10px' }
  return (
    <div style={{ color: C.cream, fontSize: 14, lineHeight: 1.6 }}>
      <div style={box}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 10 }}>
          <div style={{ fontSize: 44, fontWeight: 800, color: bandColor, lineHeight: 1 }}>{idx}<span style={{ fontSize: 18, color: C.muted }}> / 100</span></div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Індекс ознак ШІ — <span style={{ color: bandColor }}>{band}</span> концентрація</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {stage === 'остаточний' ? 'Остаточний: текст разом із відповідями автора' : 'Попередній: лише текст, без відповідей автора'}
            </div>
          </div>
        </div>
        <div style={{ height: 8, background: C.deep, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: `${idx}%`, height: 8, background: bandColor }} />
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: '0 0 12px' }}>
          0–30 низька · 31–55 помірна · 56–75 значна · 76–100 дуже значна. Це не ймовірність і не відсоток тексту, написаного ШІ,
          а зведений показник виразності 10 ознак (сума балів ÷ 120 × 100).
        </p>
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

      {s.typography && (() => {
        const ty = s.typography!
        const n = (k: string) => Number(ty[k] ?? 0)
        return (
          <div style={box}>
            <div style={h}>Типографіка</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '4px 16px' }}>
              <div><span style={{ color: C.muted }}>Тире «—» / «–» / « - »:</span> <strong>{n('emDash')} / {n('enDash')} / {n('hyphenAsDash')}</strong></div>
              <div><span style={{ color: C.muted }}>Трикрапки «…» / «...»:</span> <strong>{n('ellipsisChar')} / {n('threeDots')}</strong></div>
              <div><span style={{ color: C.muted }}>Лапки «» / “” / "" / „“:</span> <strong>{n('quotesAngle')} / {n('quotesCurly')} / {n('quotesStraight')} / {n('quotesLow')}</strong></div>
              <div><span style={{ color: C.muted }}>Апострофи ’ / ' / ʼ:</span> <strong>{n('apostropheRight')} / {n('apostropheAscii')} / {n('apostropheModifier')}</strong></div>
              <div><span style={{ color: C.muted }}>Нерозривні пробіли:</span> <strong>{n('nbsp')}</strong></div>
              <div><span style={{ color: C.muted }}>Невидимі символи:</span> <strong style={{ color: n('invisible') ? '#f3b35a' : undefined }}>{n('invisible')}</strong></div>
              <div><span style={{ color: C.muted }}>Залишки розмітки (**, #):</span> <strong style={{ color: n('markdown') ? '#f3b35a' : undefined }}>{n('markdown')}</strong></div>
            </div>
            {!!ty.mixed?.length && <p style={{ margin: '10px 0 0', color: '#f3b35a' }}>Змішані стилі: {ty.mixed.join('; ')}.</p>}
            {!!ty.segmentSwitches?.length && (
              <div style={{ margin: '8px 0 0', color: '#f3b35a' }}>
                Стиль змінюється посеред тексту:
                <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>{ty.segmentSwitches.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}
            <p style={{ margin: '8px 0 0', fontSize: 12, color: C.muted }}>
              Часте довге тире для української — норма, не ознака ШІ. Інформативні змішування стилів і їх зміна між частинами тексту: це може означати частини різного походження.
            </p>
          </div>
        )
      })()}

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
