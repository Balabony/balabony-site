'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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

const TYSHA_RULES = [
  'Прибери передвісники й анонси майбутнього (жодних «я ще не знав, що…», «згодом зрозумів», «це теж минеться»). Усе має лишатися сюрпризом.',
  'Пиши простою людською мовою. Уникай складних вкладених конструкцій і нагромадження лапок.',
  'Прибери зайві слова, що розжовують рішення героя й убивають інтригу (читач здогадається сам).',
  'Зберігай формат реплік «Імʼя: текст», не через тире.',
  'Не вигадуй нових подій, персонажів чи магії. Зберігай сюжет, голос автора і приблизний обсяг.',
]

interface SeriesItem {
  id: string
  title: string
  season_number: number | null
  episode_number: number | null
  status: string
}

function countWords(t: string): number {
  return (t.match(/[А-Яа-яІіЇїЄєҐґ'’\u02bc-]+/g) ?? []).length
}

export default function TyshaMaisternia() {
  const [list, setList] = useState<SeriesItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [findings, setFindings] = useState<Finding[] | null>(null)
  const [improved, setImproved] = useState<string | null>(null)

  const [loadingList, setLoadingList] = useState(true)
  const [loadingItem, setLoadingItem] = useState(false)
  const [saving, setSaving] = useState(false)
  const [improving, setImproving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const words = useMemo(() => countWords(text), [text])
  const dirty = text !== savedText

  const loadList = useCallback(async () => {
    setLoadingList(true); setErr('')
    try {
      const r = await fetch('/api/admin/tysha-list', { credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка завантаження списку')
      setList(d.items ?? [])
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])

  async function selectSeries(id: string) {
    if (dirty && !confirm('Є незбережені зміни. Відкрити іншу серію без збереження?')) return
    setLoadingItem(true); setErr(''); setMsg(''); setFindings(null); setImproved(null)
    try {
      const r = await fetch(`/api/admin/content/${id}`, { credentials: 'same-origin' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Не вдалося відкрити серію')
      const body = (d.item?.text ?? '') as string
      setSelectedId(id); setText(body); setSavedText(body)
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setLoadingItem(false)
    }
  }

  async function save() {
    if (!selectedId) return
    setSaving(true); setErr(''); setMsg('')
    try {
      const r = await fetch(`/api/admin/content/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка збереження')
      setSavedText(text); setMsg('Збережено')
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setSaving(false)
    }
  }

  function runCheck() {
    setFindings(checkTysha(text))
  }

  async function improve() {
    setImproving(true); setErr(''); setMsg(''); setImproved(null)
    try {
      const r = await fetch('/api/admin/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ text, recommendations: TYSHA_RULES }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Помилка олюднення')
      setImproved((d.improvedText ?? '').trim())
    } catch (e) {
      setErr(String(e instanceof Error ? e.message : e))
    } finally {
      setImproving(false)
    }
  }

  const sum = findings ? summarize(findings) : null
  const sorted = findings
    ? [...findings].sort((a, b) => SEV[a.severity].order - SEV[b.severity].order)
    : []

  const btn = (bg: string, on: boolean): React.CSSProperties => ({
    padding: '9px 16px', borderRadius: 8, border: 'none', cursor: on ? 'pointer' : 'default',
    background: on ? bg : 'rgba(255,255,255,0.15)', color: on ? NAVY_DEEP : 'rgba(245,240,232,0.5)',
    fontWeight: 700, fontSize: 13, fontFamily: FONT,
  })

  return (
    <div style={{ display: 'flex', gap: 16, maxWidth: 1180, margin: '0 auto', padding: '20px 16px', fontFamily: FONT, color: INK, alignItems: 'flex-start' }}>

      <aside style={{ width: 230, flexShrink: 0, position: 'sticky', top: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px' }}>Серії «Тиші»</h2>
        {loadingList && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>Завантаження…</div>}
        {list.map((s) => {
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              onClick={() => selectSeries(s.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', marginBottom: 4,
                padding: '9px 11px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: FONT,
                background: active ? GOLD : NAVY, color: active ? NAVY_DEEP : INK,
                border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
                fontWeight: active ? 700 : 500,
              }}
            >
              {s.episode_number != null ? `${s.episode_number}. ` : ''}{s.title}
              <span style={{ display: 'block', fontSize: 10, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                {s.status}
              </span>
            </button>
          )
        })}
      </aside>

      <main style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: 'rgba(245,240,232,0.6)', margin: '0 0 12px' }}>
          Обери серію зліва, правь текст, перевіряй канон і зберігай. «Олюднити» — Gemini за правилами «Тиші».
          Механіка ловить грубе — вичитуй ще й оком.
        </p>

        {err && <div style={{ padding: 10, borderRadius: 8, background: 'rgba(217,69,69,0.15)', border: '1px solid #d94545', marginBottom: 10, fontSize: 13 }}>{err}</div>}

        {!selectedId && !loadingItem && (
          <div style={{ padding: 24, textAlign: 'center', color: 'rgba(245,240,232,0.5)', fontSize: 14 }}>
            ← Обери серію зі списку
          </div>
        )}

        {loadingItem && <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>Відкриваю серію…</div>}

        {selectedId && !loadingItem && (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{
                width: '100%', minHeight: 360, resize: 'vertical', boxSizing: 'border-box',
                padding: 14, borderRadius: 10, background: NAVY_DEEP, color: INK,
                border: `1px solid ${dirty ? GOLD : 'rgba(255,255,255,0.12)'}`,
                fontSize: 14, lineHeight: 1.55, fontFamily: "'Georgia', serif", outline: 'none',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', flexWrap: 'wrap' }}>
              <button onClick={save} disabled={!dirty || saving} style={btn(GOLD, dirty && !saving)}>
                {saving ? 'Зберігаю…' : dirty ? 'Зберегти' : 'Збережено'}
              </button>
              <button onClick={runCheck} disabled={!text.trim()} style={btn('#7aa2c4', !!text.trim())}>
                Перевірити канон
              </button>
              <button onClick={improve} disabled={improving || !text.trim()} style={btn('#9b8cff', !improving && !!text.trim())}>
                {improving ? 'Олюднюю…' : 'Олюднити (Gemini)'}
              </button>
              {msg && <span style={{ fontSize: 13, color: '#7ddb9f' }}>{msg}</span>}
              <span style={{ marginLeft: 'auto', fontSize: 13, color: 'rgba(245,240,232,0.5)' }}>
                {words} слів{words > 0 && words < 1500 ? ' · закоротко' : ''}{words > 2300 ? ' · задовго' : ''}
                {dirty ? ' · не збережено' : ''}
              </span>
            </div>

            {improved !== null && (
              <div style={{ margin: '14px 0', padding: 14, borderRadius: 10, background: 'rgba(155,140,255,0.08)', border: '1px solid #9b8cff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <strong style={{ fontSize: 13, color: '#bcb0ff' }}>Олюднена версія (Gemini)</strong>
                  <button
                    onClick={() => { setText(improved); setImproved(null); setMsg('Застосовано — не забудь зберегти') }}
                    style={{ ...btn('#9b8cff', true), padding: '6px 12px', fontSize: 12 }}
                  >
                    Застосувати в редактор
                  </button>
                  <button
                    onClick={() => setImproved(null)}
                    style={{ padding: '6px 12px', borderRadius: 6, cursor: 'pointer', background: 'transparent', color: 'rgba(245,240,232,0.6)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 12, fontFamily: FONT }}
                  >
                    Відхилити
                  </button>
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.5, color: 'rgba(245,240,232,0.9)', fontFamily: "'Georgia', serif" }}>
                  {improved}
                </div>
              </div>
            )}

            {sum && (
              <div style={{ display: 'flex', gap: 10, margin: '14px 0' }}>
                {(['error', 'warn', 'info'] as Severity[]).map((s) => (
                  <div key={s} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: SEV[s].bg, border: `1px solid ${SEV[s].color}` }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: SEV[s].color }}>{sum[s]}</div>
                    <div style={{ fontSize: 11, color: 'rgba(245,240,232,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{SEV[s].label}</div>
                  </div>
                ))}
              </div>
            )}

            {findings && findings.length === 0 && (
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(45,143,78,0.12)', border: '1px solid #2d8f4e', color: '#7ddb9f', fontSize: 14 }}>
                Чисто — механічних зауважень немає. Усе одно перечитай оком: прихований передвісник і магію в підтексті функція не ловить.
              </div>
            )}

            {sorted.map((f, i) => (
              <div key={i} style={{ margin: '8px 0', padding: '11px 13px', borderRadius: 10, background: SEV[f.severity].bg, borderLeft: `3px solid ${SEV[f.severity].color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: SEV[f.severity].color }}>{SEV[f.severity].label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{f.rule}</span>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.85)', lineHeight: 1.4 }}>{f.message}</div>
                {f.excerpt && (
                  <div style={{ marginTop: 5, padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.25)', fontSize: 12.5, color: 'rgba(245,240,232,0.7)', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
                    «{f.excerpt}»
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </main>
    </div>
  )
}
