'use client'

import { useMemo, useState } from 'react'

// Компонент живе на світлій кремовій картці сторінки /author/dashboard/works.
// Палітра раніше була від темного макета — текст був майже не видно.
const BRAND = {
  cream: '#fffdf8',
  amber: '#b8730f',
  amberDark: '#8a5a10',
  ink: '#0c0a09',
  text: '#1c1917',
  muted: '#44403c',
  line: 'rgba(28,25,23,0.28)',
}

export type WorkRow = {
  id: string
  title: string
  prior_publication: string | null
  confirmed_at: string | null
  added_at: string | null
  content_status: string | null
  published_at: string | null
  content_type: string | null
  episode_number: number | null
  has_third_party_audio?: boolean | null
  audio_with_consent?: boolean | null
  audio_sources?: string | null
  series_name?: string | null
  series_order?: number | null
}

type Extra = {
  hasAudio: boolean
  consent: 'yes' | 'no'
  sources: string
  inSeries: boolean
  seriesName: string
  seriesOrder: string
}

const EMPTY_EXTRA: Extra = {
  hasAudio: false, consent: 'no', sources: '',
  inSeries: false, seriesName: '', seriesOrder: '',
}

type Props = {
  contractId: string
  contractNumber: string
  works: WorkRow[]
  generatedAt: string
}

// Статуси твору — як їх бачить автор (Додаток № 1)
const WORK_STATUS: Record<string, string> = {
  draft: 'не опубліковано',
  humanizing: 'на розгляді',
  human_review: 'на розгляді',
  review: 'на розгляді',
  approved: 'на розгляді',
  scheduled: 'на розгляді',
  published: 'опубліковано',
}

function d(v: string | null): string {
  if (!v) return '—'
  const t = new Date(v)
  return Number.isNaN(t.getTime()) ? '—' : t.toLocaleDateString('uk-UA')
}

export default function ContractWorksList({ contractId, contractNumber, works, generatedAt }: Props) {
  const [rows, setRows] = useState<WorkRow[]>(works)
  const [prior, setPrior] = useState<Record<string, string>>({})
  const [extra, setExtra] = useState<Record<string, Extra>>({})
  const [editing, setEditing] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const pending = useMemo(() => rows.filter(w => !w.confirmed_at), [rows])
  const confirmed = useMemo(() => rows.filter(w => w.confirmed_at), [rows])

  type SendItem = {
    id: string
    priorPublication: string | null
    hasThirdPartyAudio: boolean
    audioWithConsent: boolean | null
    audioSources: string | null
    seriesName: string | null
    seriesOrder: number | null
  }

  function ex(id: string): Extra {
    return extra[id] ?? EMPTY_EXTRA
  }

  // Автор може повернутися до вже підтвердженого твору — наприклад, згадав про
  // аудіоверсію на ютубі або вирішив обʼєднати твори в серію.
  function openEdit(w: WorkRow) {
    setExtra(prev => ({
      ...prev,
      [w.id]: {
        hasAudio: Boolean(w.has_third_party_audio),
        consent: w.audio_with_consent ? 'yes' : 'no',
        sources: w.audio_sources ?? '',
        inSeries: Boolean(w.series_name),
        seriesName: w.series_name ?? '',
        seriesOrder: w.series_order ? String(w.series_order) : '',
      },
    }))
    setPrior(prev => ({ ...prev, [w.id]: w.prior_publication ?? '' }))
    setEditing(prev => ({ ...prev, [w.id]: true }))
  }

  function patch(id: string, p: Partial<Extra>) {
    setExtra(prev => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_EXTRA), ...p } }))
  }

  async function send(items: SendItem[]) {
    if (items.length === 0) return
    setBusy(true)
    setNote(null)
    try {
      const res = await fetch('/api/contracts/works/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId, works: items }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) {
        setNote(data.error || 'Не вдалося зберегти. Спробуйте ще раз.')
        return
      }
      const now = new Date().toISOString()
      const map = new Map(items.map(i => [i.id, i]))
      setRows(prev => prev.map(w => {
        const it = map.get(w.id)
        if (!it) return w
        return {
          ...w,
          confirmed_at: now,
          prior_publication: it.priorPublication,
          has_third_party_audio: it.hasThirdPartyAudio,
          audio_with_consent: it.audioWithConsent,
          audio_sources: it.audioSources,
          series_name: it.seriesName,
          series_order: it.seriesOrder,
        }
      }))
      setEditing(prev => {
        const next = { ...prev }
        for (const it of items) delete next[it.id]
        return next
      })
      setNote(items.length === 1 ? 'Збережено.' : `Збережено творів: ${items.length}.`)
    } catch {
      setNote('Немає звʼязку із сервером.')
    } finally {
      setBusy(false)
    }
  }

  function buildItem(w: WorkRow): SendItem {
    const p = (prior[w.id] ?? '').trim()
    const e = ex(w.id)
    const orderNum = e.inSeries && e.seriesOrder.trim()
      ? Number.parseInt(e.seriesOrder, 10)
      : NaN
    return {
      id: w.id,
      priorPublication: p ? p : null,
      hasThirdPartyAudio: e.hasAudio,
      audioWithConsent: e.hasAudio ? e.consent === 'yes' : null,
      audioSources: e.hasAudio && e.sources.trim() ? e.sources.trim() : null,
      seriesName: e.inSeries && e.seriesName.trim() ? e.seriesName.trim() : null,
      seriesOrder: Number.isFinite(orderNum) ? orderNum : null,
    }
  }

  function confirmOne(w: WorkRow) {
    void send([buildItem(w)])
  }

  function confirmAllClean() {
    const items = pending
      .filter(w => {
        const e = ex(w.id)
        return !(prior[w.id] ?? '').trim() && !e.hasAudio && !e.inSeries
      })
      .map(w => ({
        id: w.id,
        priorPublication: null,
        hasThirdPartyAudio: false,
        audioWithConsent: null,
        audioSources: null,
        seriesName: null,
        seriesOrder: null,
      }))
    void send(items)
  }

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.95rem', color: '#f5f0e8', lineHeight: 1.7 }}>
          Це перелік творів до договору № {contractNumber} — Додаток № 1. Підтвердження твору
          означає, що ви погоджуєтесь на його розміщення та озвучення на умовах договору.
        </div>
        <div style={{ fontSize: '0.9rem', color: BRAND.text, lineHeight: 1.7, marginTop: 8 }}>
          Якщо твір раніше публікувався в інших виданнях — впишіть яких. На такі твори
          передаються невиключні права: ви зможете й далі використовувати їх деінде.
          Тут же можна позначити наявні аудіоверсії й обʼєднати твори в серію. Уже
          підтверджений твір можна змінити — кнопка «змінити» в його рядку.
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
        padding: '0.85rem 1rem', background: '#fffdf8', border: `1px solid ${BRAND.line}`,
        borderRadius: 10, marginBottom: '1.25rem',
      }}>
        <div style={{ fontSize: '0.9rem', color: BRAND.text }}>
          Підтверджено <strong>{confirmed.length}</strong> із {rows.length}
        </div>
        <div style={{ fontSize: '0.82rem', color: BRAND.muted }}>
          Редакція від {d(generatedAt)}
        </div>
        {pending.length > 0 && (
          <button type="button" onClick={confirmAllClean} disabled={busy} style={primaryBtn}>
            Підтвердити всі, що не публікувалися
          </button>
        )}
        <button type="button" onClick={() => window.print()} style={secondaryBtn}>
          Зберегти як PDF
        </button>
      </div>

      {rows.length === 0 && (
        <p style={{ color: BRAND.text }}>У переліку поки немає творів.</p>
      )}

      {rows.map((w, i) => (
        <div key={w.id} style={{ borderTop: `1px solid ${BRAND.line}`, padding: '0.9rem 0' }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              <div style={{ fontWeight: 700, color: BRAND.ink }}>
                <span style={{ color: BRAND.muted, marginRight: 8 }}>{i + 1}.</span>
                {w.title}
              </div>
              <div style={{ fontSize: '0.85rem', color: BRAND.muted, marginTop: 4, lineHeight: 1.6 }}>
                Статус: {WORK_STATUS[w.content_status ?? ''] ?? 'не опубліковано'}
                {' · '}Опубліковано: {d(w.published_at)}
                {' · '}Долучено: {d(w.added_at)}
              </div>
              {w.confirmed_at && !editing[w.id] && (
                <div style={{ fontSize: '0.85rem', color: BRAND.muted, marginTop: 3 }}>
                  Підтверджено {d(w.confirmed_at)}
                  {w.prior_publication ? ` · раніше: ${w.prior_publication}` : ''}
                  {w.has_third_party_audio
                    ? ` · аудіо третіх осіб: ${w.audio_with_consent ? 'за згодою' : 'без згоди'}`
                    : ''}
                  {w.series_name
                    ? ` · серія: ${w.series_name}${w.series_order ? ` (№${w.series_order})` : ''}`
                    : ''}
                  {'  '}
                  <button
                    type="button"
                    onClick={() => openEdit(w)}
                    style={{
                      border: 'none', background: 'none', padding: 0, cursor: 'pointer',
                      color: BRAND.amberDark, fontSize: '0.85rem', fontFamily: 'inherit',
                      textDecoration: 'underline',
                    }}
                  >
                    змінити
                  </button>
                </div>
              )}
            </div>
            <span style={{
              flex: 'none', fontSize: '0.75rem', padding: '3px 9px', borderRadius: 999,
              letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.5,
              fontWeight: 700,
              ...(w.confirmed_at
                ? { background: 'rgba(101,163,13,0.14)', color: '#3f6212', border: '1px solid rgba(101,163,13,0.35)' }
                : { background: 'rgba(28,25,23,0.06)', color: '#57534e', border: '1px solid rgba(28,25,23,0.18)' }),
            }}>
              {w.confirmed_at ? 'Підтверджено' : 'Очікує'}
            </span>
          </div>

          {(!w.confirmed_at || editing[w.id]) && (
            <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
              <input
                type="text"
                value={prior[w.id] ?? ''}
                onChange={e => setPrior(p => ({ ...p, [w.id]: e.target.value }))}
                placeholder="Раніше публікувався в… (якщо ні — лишіть порожнім)"
                style={inputStyle}
              />

              <label style={checkRow}>
                <input
                  type="checkbox"
                  checked={ex(w.id).hasAudio}
                  onChange={e => patch(w.id, { hasAudio: e.target.checked })}
                  style={{ marginTop: 3 }}
                />
                <span>Твір має аудіоверсію, створену третіми особами</span>
              </label>

              {ex(w.id).hasAudio && (
                <div style={nestedBox}>
                  <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                    <label style={radioRow}>
                      <input
                        type="radio"
                        name={`consent-${w.id}`}
                        checked={ex(w.id).consent === 'yes'}
                        onChange={() => patch(w.id, { consent: 'yes' })}
                      />
                      <span>З моєї згоди</span>
                    </label>
                    <label style={radioRow}>
                      <input
                        type="radio"
                        name={`consent-${w.id}`}
                        checked={ex(w.id).consent === 'no'}
                        onChange={() => patch(w.id, { consent: 'no' })}
                      />
                      <span>Без моєї згоди</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={ex(w.id).sources}
                    onChange={e => patch(w.id, { sources: e.target.value })}
                    placeholder="Де саме розміщено (посилання або назви каналів)"
                    style={inputStyle}
                  />
                  <div style={hintStyle}>
                    {ex(w.id).consent === 'yes'
                      ? 'Права на цей твір передаються як невиключні (п. 2.8-1).'
                      : 'Це не є порушенням договору. Ми можемо допомогти з вилученням (п. 6.2-1).'}
                  </div>
                </div>
              )}

              <label style={checkRow}>
                <input
                  type="checkbox"
                  checked={ex(w.id).inSeries}
                  onChange={e => patch(w.id, e.target.checked
                    ? { inSeries: true }
                    : { inSeries: false, seriesName: '', seriesOrder: '' })}
                  style={{ marginTop: 3 }}
                />
                <span>Твір належить до серії (циклу)</span>
              </label>

              {ex(w.id).inSeries && (
                <div style={nestedBox}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={ex(w.id).seriesName}
                      onChange={e => patch(w.id, { seriesName: e.target.value })}
                      placeholder="Назва серії"
                      style={{ ...inputStyle, flex: '1 1 220px' }}
                    />
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={ex(w.id).seriesOrder}
                      onChange={e => patch(w.id, { seriesOrder: e.target.value })}
                      placeholder="№"
                      style={{ ...inputStyle, flex: '0 0 90px', minWidth: 70 }}
                    />
                  </div>
                  <div style={hintStyle}>
                    Номер — за хронологією подій, а не за порядком написання (п. 2.5-2).
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => confirmOne(w)} disabled={busy} style={secondaryBtn}>
                  {editing[w.id] ? 'Зберегти' : 'Підтвердити'}
                </button>
                {editing[w.id] && (
                  <button
                    type="button"
                    onClick={() => setEditing(p => ({ ...p, [w.id]: false }))}
                    disabled={busy}
                    style={{ ...secondaryBtn, borderColor: 'transparent', color: BRAND.muted }}
                  >
                    Скасувати
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {note && (
        <p style={{ color: BRAND.text, fontSize: '0.9rem', marginTop: 16 }}>{note}</p>
      )}

      <p style={{ color: BRAND.muted, fontSize: '0.82rem', marginTop: 20, lineHeight: 1.6 }}>
        Перелік оновлюється автоматично. Ви можете будь-коли повернутися сюди й переглянути,
        які твори охоплені договором і коли ви їх підтвердили.
      </p>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 9, border: 'none',
  background: '#ef9f27', color: '#1c1917', fontWeight: 700,
  fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.7rem',
  border: `1px solid ${BRAND.line}`, borderRadius: 8, background: 'transparent',
  color: BRAND.text, fontSize: '0.88rem', fontFamily: 'inherit',
}

const checkRow: React.CSSProperties = {
  display: 'flex', gap: 9, alignItems: 'flex-start',
  fontSize: '0.86rem', color: BRAND.text, lineHeight: 1.5, cursor: 'pointer',
}

const radioRow: React.CSSProperties = {
  display: 'flex', gap: 7, alignItems: 'center',
  fontSize: '0.86rem', color: BRAND.text, cursor: 'pointer',
}

const nestedBox: React.CSSProperties = {
  display: 'grid', gap: 8, padding: '0.7rem 0.8rem',
  border: `1px solid ${BRAND.line}`, borderRadius: 9,
  background: 'rgba(239,159,39,0.07)',
}

const hintStyle: React.CSSProperties = {
  fontSize: '0.82rem', color: BRAND.muted, lineHeight: 1.55,
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 9, border: `1px solid ${BRAND.line}`,
  background: 'transparent', color: BRAND.text, fontSize: '0.85rem',
  cursor: 'pointer', fontFamily: 'inherit',
}
