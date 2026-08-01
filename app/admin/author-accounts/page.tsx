'use client'

import { useEffect, useMemo, useState } from 'react'

/**
 * Усі кабінети авторів на одній сторінці.
 *
 * Питання, на які вона відповідає без жодного запиту в базу:
 * хто вже заходив, хто заповнив реквізити, у кого прив'язані твори,
 * у кого є договір і чи він підписаний.
 */

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

const OK = '#8FBF6A'
const WARN = '#ef9f27'
const BAD = '#E88686'

type Row = {
  user_id: string
  display_name: string
  pen_name: string | null
  email: string | null
  is_fop: boolean
  rate: number | null
  is_active: boolean
  created_at: string | null
  last_sign_in_at: string | null
  requisites_filled: number
  requisites_missing: string[]
  works_total: number
  works_published: number
  contract_number: string | null
  contract_status: string | null
  contract_works: number
  consent: string | null
}

const CONTRACT_LABEL: Record<string, string> = {
  draft: 'Готується',
  awaiting: 'Не підписано',
  signed: 'Підписано',
  terminated: 'Припинено',
}

const CONSENT_LABEL: Record<string, string> = {
  given: 'Є',
  granted: 'Є',
  yes: 'Є',
  pending: 'Чекаємо',
  refused: 'Відмова',
  revoked: 'Відкликана',
}

const FIELD_LABEL: Record<string, string> = {
  full_name: 'ПІБ',
  rnokpp: 'РНОКПП',
  address: 'адреса',
  phone: 'телефон',
  payout_iban: 'IBAN',
  bank_name: 'банк',
}

function dateShort(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

/** Чи потрібна цьому авторові увага. Використовується фільтром «є що робити». */
function needsAttention(r: Row): boolean {
  return !r.last_sign_in_at
    || r.requisites_missing.length > 0
    || r.works_total === 0
    || !r.contract_number
    || r.contract_status !== 'signed'
    || r.consent === 'refused'
    || r.consent === 'revoked'
}

function Dot({ tone }: { tone: 'ok' | 'warn' | 'bad' }) {
  const color = tone === 'ok' ? OK : tone === 'warn' ? WARN : BAD
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: 999,
      background: color, marginRight: 7, verticalAlign: 'middle', flex: 'none',
    }} />
  )
}

export default function AdminAuthorAccountsPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')
  const [onlyTodo, setOnlyTodo] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch('/api/admin/author-accounts')
        const raw = await res.text()
        type Payload = { ok?: boolean; rows?: Row[]; warnings?: string[]; error?: string }
        let d: Payload | null = null
        try { d = JSON.parse(raw) as Payload } catch { d = null }
        if (!alive) return
        if (!d) { setErr(`Сервер відповів помилкою (код ${res.status})`); return }
        if (!d.ok) { setErr(d.error ?? 'Не вдалося завантажити'); return }
        setRows(d.rows ?? [])
        setWarnings(d.warnings ?? [])
      } catch {
        if (alive) setErr('Не вдалося звʼязатися з сервером')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => { alive = false }
  }, [])

  const sorted = useMemo(
    () => rows.slice().sort((a, b) => a.display_name.localeCompare(b.display_name, 'uk')),
    [rows],
  )

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return sorted.filter(r => {
      if (onlyTodo && !needsAttention(r)) return false
      if (!needle) return true
      return `${r.display_name} ${r.pen_name ?? ''} ${r.email ?? ''}`.toLowerCase().includes(needle)
    })
  }, [sorted, q, onlyTodo])

  const stats = useMemo(() => ({
    total: rows.length,
    signedIn: rows.filter(r => r.last_sign_in_at).length,
    requisites: rows.filter(r => r.requisites_missing.length === 0).length,
    withWorks: rows.filter(r => r.works_total > 0).length,
    withContract: rows.filter(r => r.contract_number).length,
    signed: rows.filter(r => r.contract_status === 'signed').length,
  }), [rows])

  const loginMessage = (r: Row): string =>
    `Вітаємо! Ваш кабінет автора на Балабонах створено.\n\n` +
    `Щоб увійти:\n` +
    `1. Відкрийте balabony.com/login\n` +
    `2. Введіть цю адресу: ${r.email ?? ''}\n` +
    `3. Натисніть «Отримати посилання» — на пошту прийде лист із входом.\n\n` +
    `У кабінеті ви побачите свої твори, умови договору й нарахування.`

  const copy = async (r: Row) => {
    try {
      await navigator.clipboard.writeText(loginMessage(r))
      setCopied(r.user_id)
      setTimeout(() => setCopied(''), 1800)
    } catch {
      setCopied('')
    }
  }

  const th: React.CSSProperties = {
    textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700,
    color: MUTED, borderBottom: `1px solid ${LINE}`, whiteSpace: 'nowrap',
  }
  const td: React.CSSProperties = {
    padding: '12px', fontSize: 13.5, borderBottom: `1px solid ${LINE}`,
    verticalAlign: 'top', color: CREAM,
  }

  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT, paddingBottom: 90 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 20px 0' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Кабінети авторів</h1>
          <a href="/admin" style={{ color: MUTED, fontSize: 14, textDecoration: 'none' }}>← В адмінку</a>
        </div>

        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, marginTop: 14, maxWidth: 720 }}>
          Стан кожного заведеного кабінету: чи автор заходив, чи заповнив реквізити,
          чи прив&apos;язані його твори, чи є договір. Сторінка лише показує — заводять
          авторів у розділі «Заведення авторів», прив&apos;язують твори у «Прив&apos;язці».
        </p>

        {/* Зведення */}
        {!loading && !err && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
            {[
              ['Кабінетів', stats.total, null],
              ['Заходили', stats.signedIn, stats.total],
              ['Реквізити', stats.requisites, stats.total],
              ['Із творами', stats.withWorks, stats.total],
              ['Договір є', stats.withContract, stats.total],
              ['Підписано', stats.signed, stats.total],
            ].map(([label, n, of]) => (
              <div key={String(label)} style={{
                background: NAVY, border: `1px solid ${LINE}`, borderRadius: 12,
                padding: '11px 16px', minWidth: 108,
              }}>
                <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 21, fontWeight: 700, color: GOLD, marginTop: 3 }}>
                  {String(n)}
                  {of != null && <span style={{ fontSize: 13, color: MUTED, fontWeight: 600 }}> / {String(of)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div style={{
            marginTop: 18, padding: '11px 15px', borderRadius: 10,
            background: 'rgba(239,159,39,0.10)', border: `1px solid ${GOLD}55`,
            fontSize: 13, color: CREAM, lineHeight: 1.6,
          }}>
            Частина даних не зчиталася, ці колонки будуть порожні:
            <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
              {warnings.map(w => <li key={w}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* Пошук і фільтр */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '22px 0 6px' }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Пошук за іменем або поштою"
            style={{
              flex: '1 1 260px', minWidth: 220, padding: '10px 13px', borderRadius: 10,
              border: `1px solid ${LINE}`, background: NAVY, color: CREAM,
              fontSize: 14, fontFamily: FONT, outline: 'none',
            }}
          />
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: MUTED, cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyTodo} onChange={e => setOnlyTodo(e.target.checked)} />
            Лише ті, з ким є що робити
          </label>
          <span style={{ fontSize: 13, color: MUTED }}>Показано: {shown.length}</span>
        </div>

        {loading && <p style={{ color: MUTED, marginTop: 26 }}>Завантаження…</p>}
        {err && <p style={{ color: BAD, marginTop: 26 }}>{err}</p>}

        {!loading && !err && shown.length === 0 && (
          <p style={{ color: MUTED, marginTop: 26 }}>Нічого не знайдено.</p>
        )}

        {!loading && !err && shown.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={th}>Автор</th>
                  <th style={th}>Вхід</th>
                  <th style={th}>Реквізити</th>
                  <th style={th}>Твори</th>
                  <th style={th}>Договір</th>
                  <th style={th}>Згода</th>
                  <th style={th}>Ставка</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {shown.map(r => {
                  const consentTone = r.consent === 'refused' || r.consent === 'revoked'
                    ? 'bad' : r.consent ? 'ok' : 'warn'
                  return (
                    <tr key={r.user_id}>
                      <td style={{ ...td, minWidth: 210 }}>
                        <div style={{ fontWeight: 700 }}>
                          {r.display_name || '(без імені)'}
                          {!r.is_active && <span style={{ color: BAD, fontWeight: 600, fontSize: 12 }}> · вимкнено</span>}
                        </div>
                        {r.pen_name && (
                          <div style={{ color: MUTED, fontSize: 12.5, marginTop: 2 }}>псевдонім: {r.pen_name}</div>
                        )}
                        <div style={{ color: MUTED, fontSize: 12.5, marginTop: 2, wordBreak: 'break-all' }}>
                          {r.email ?? '—'}
                        </div>
                      </td>

                      <td style={td}>
                        {r.last_sign_in_at
                          ? <><Dot tone="ok" />{dateShort(r.last_sign_in_at)}</>
                          : <span style={{ color: BAD }}><Dot tone="bad" />жодного разу</span>}
                      </td>

                      <td style={{ ...td, minWidth: 150 }}>
                        {r.requisites_missing.length === 0
                          ? <><Dot tone="ok" />повні</>
                          : (
                            <>
                              <Dot tone={r.requisites_filled === 0 ? 'bad' : 'warn'} />
                              {r.requisites_filled} з 6
                              <div style={{ color: MUTED, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>
                                бракує: {r.requisites_missing.map(f => FIELD_LABEL[f] ?? f).join(', ')}
                              </div>
                            </>
                          )}
                      </td>

                      <td style={td}>
                        {r.works_total > 0
                          ? <><Dot tone="ok" />{r.works_total}
                              <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                                опубліковано {r.works_published}
                              </div>
                            </>
                          : <a href="/admin/link-authors" style={{ color: WARN, textDecoration: 'none' }}>
                              <Dot tone="warn" />не прив&apos;язано →
                            </a>}
                      </td>

                      <td style={{ ...td, minWidth: 140 }}>
                        {r.contract_number
                          ? (
                            <>
                              <Dot tone={r.contract_status === 'signed' ? 'ok' : 'warn'} />
                              № {r.contract_number}
                              <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                                {CONTRACT_LABEL[r.contract_status ?? ''] ?? r.contract_status}
                                {' · '}{r.contract_works} творів
                              </div>
                            </>
                          )
                          : <span style={{ color: MUTED }}><Dot tone="warn" />немає</span>}
                      </td>

                      <td style={td}>
                        <Dot tone={consentTone} />
                        {r.consent ? (CONSENT_LABEL[r.consent] ?? r.consent) : 'не записано'}
                      </td>

                      <td style={td}>
                        {r.rate != null ? `${r.rate}%` : '—'}
                        <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
                          {r.is_fop ? 'ФОП' : 'фізособа'}
                        </div>
                      </td>

                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {r.email && (
                          <button
                            type="button"
                            onClick={() => { void copy(r) }}
                            style={{
                              padding: '7px 11px', borderRadius: 9, cursor: 'pointer',
                              border: `1px solid ${LINE}`, background: 'transparent',
                              color: copied === r.user_id ? OK : MUTED,
                              fontSize: 12.5, fontFamily: FONT, fontWeight: 600,
                            }}
                          >
                            {copied === r.user_id ? 'Скопійовано' : 'Лист про вхід'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.65, marginTop: 22, maxWidth: 720 }}>
          «Вхід» — коли автор востаннє заходив у кабінет. «Згода» береться з останнього
          запису про згоду на публікацію в Балабонах за іменем автора; якщо автор
          записаний у творах під іншим написанням імені, згода тут не покажеться,
          хоча в базі вона є.
        </p>

      </div>
    </main>
  )
}
