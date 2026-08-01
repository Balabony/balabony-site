'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TEMPLATE_LABEL, suggestTemplate, type AuthorEmailTemplate,
} from '@/lib/author-emails'

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
  last_email_template: string | null
  last_email_at: string | null
  last_email_status: string | null
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
  const [sendingId, setSendingId] = useState('')
  const [sendNote, setSendNote] = useState<Record<string, string>>({})
  const [pickTemplate, setPickTemplate] = useState<Record<string, AuthorEmailTemplate>>({})
  const [bulkArmed, setBulkArmed] = useState(false)
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkDone, setBulkDone] = useState(0)
  const [bulkSent, setBulkSent] = useState(0)
  const [bulkFailed, setBulkFailed] = useState(0)
  const bulkStopRef = useRef(false)

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

  const send = async (r: Row, template: AuthorEmailTemplate) => {
    setSendingId(r.user_id)
    setSendNote(prev => ({ ...prev, [r.user_id]: '' }))
    try {
      const res = await fetch('/api/admin/send-author-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: r.user_id, template }),
      })
      const raw = await res.text()
      type Payload = { ok?: boolean; error?: string }
      let d: Payload | null = null
      try { d = JSON.parse(raw) as Payload } catch { d = null }

      if (!d) {
        setSendNote(prev => ({ ...prev, [r.user_id]: `Помилка сервера (код ${res.status})` }))
        return
      }
      if (!d.ok) {
        setSendNote(prev => ({ ...prev, [r.user_id]: d?.error ?? 'Не надіслано' }))
        return
      }
      setSendNote(prev => ({ ...prev, [r.user_id]: 'Надіслано' }))
      setRows(prev => prev.map(x => x.user_id === r.user_id
        ? { ...x, last_email_template: template, last_email_at: new Date().toISOString(), last_email_status: 'sent' }
        : x))
    } catch {
      setSendNote(prev => ({ ...prev, [r.user_id]: 'Немає звʼязку з сервером' }))
    } finally {
      setSendingId('')
    }
  }

  /**
   * Масова розсилка.
   *
   * Свідомо йде з браузера по одному листу, а не одним запитом на сервер:
   * так видно прогрес, розсилку можна спинити посеред процесу, і вона не
   * впирається в обмеження часу виконання серверної функції.
   *
   * Кожен лист — окреме відправлення на одну адресу. Автори не бачать
   * пошт одне одного.
   */
  const sendBulk = async (list: Row[]) => {
    setBulkRunning(true)
    setBulkArmed(false)
    bulkStopRef.current = false
    setBulkDone(0); setBulkSent(0); setBulkFailed(0)

    let failStreak = 0

    for (const r of list) {
      if (bulkStopRef.current) break

      const template = pickTemplate[r.user_id] ?? suggestTemplate(r)
      if (!template) { setBulkDone(n => n + 1); continue }

      try {
        const res = await fetch('/api/admin/send-author-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: r.user_id, template }),
        })
        const raw = await res.text()
        type Payload = { ok?: boolean; error?: string }
        let d: Payload | null = null
        try { d = JSON.parse(raw) as Payload } catch { d = null }

        if (d?.ok) {
          failStreak = 0
          setBulkSent(n => n + 1)
          setSendNote(prev => ({ ...prev, [r.user_id]: 'Надіслано' }))
          setRows(prev => prev.map(x => x.user_id === r.user_id
            ? { ...x, last_email_template: template, last_email_at: new Date().toISOString(), last_email_status: 'sent' }
            : x))
        } else {
          failStreak += 1
          setBulkFailed(n => n + 1)
          setSendNote(prev => ({ ...prev, [r.user_id]: d?.error ?? `Помилка (код ${res.status})` }))
        }
      } catch {
        failStreak += 1
        setBulkFailed(n => n + 1)
        setSendNote(prev => ({ ...prev, [r.user_id]: 'Немає звʼязку' }))
      }

      setBulkDone(n => n + 1)

      // Три помилки поспіль — зупиняємось. Якщо відправлення зламане,
      // немає сенсу гнати решту списку в стіну.
      if (failStreak >= 3) break

      // Пауза між листами: поштові сервіси не люблять сплесків.
      await new Promise(res2 => setTimeout(res2, 900))
    }

    setBulkRunning(false)
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

        {/* Масова розсилка */}
        {!loading && !err && (() => {
          const targets = shown.filter(r =>
            r.email
            && r.consent !== 'refused' && r.consent !== 'revoked'
            && (pickTemplate[r.user_id] ?? suggestTemplate(r)) !== null
          )
          if (targets.length === 0 && !bulkRunning) return null
          return (
            <div style={{
              marginTop: 20, padding: '14px 16px', borderRadius: 12,
              background: NAVY, border: `1px solid ${LINE}`,
            }}>
              {bulkRunning ? (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: CREAM }}>
                    Надсилаємо: {bulkDone} з {targets.length} · надіслано {bulkSent}
                    {bulkFailed > 0 && <span style={{ color: BAD }}> · помилок {bulkFailed}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => { bulkStopRef.current = true }}
                    style={{
                      padding: '7px 13px', borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${LINE}`, background: 'transparent',
                      color: BAD, fontSize: 13, fontFamily: FONT, fontWeight: 600,
                    }}
                  >
                    Спинити
                  </button>
                </div>
              ) : bulkArmed ? (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, color: CREAM, lineHeight: 1.6 }}>
                    Надіслати <strong>{targets.length}</strong> листів? Кожен автор отримає окремий лист
                    на свою адресу і не побачить чужих пошт. Шаблон для кожного — той, що обрано
                    в його рядку.
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => { void sendBulk(targets) }}
                      style={{
                        padding: '8px 15px', borderRadius: 9, cursor: 'pointer',
                        border: 'none', background: GOLD, color: NAVY_DEEP,
                        fontSize: 13.5, fontFamily: FONT, fontWeight: 700,
                      }}
                    >
                      Так, надіслати
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkArmed(false)}
                      style={{
                        padding: '8px 13px', borderRadius: 9, cursor: 'pointer',
                        border: `1px solid ${LINE}`, background: 'transparent',
                        color: MUTED, fontSize: 13.5, fontFamily: FONT,
                      }}
                    >
                      Скасувати
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setBulkArmed(true)}
                    style={{
                      padding: '8px 15px', borderRadius: 9, cursor: 'pointer',
                      border: `1px solid ${GOLD}`, background: 'transparent',
                      color: GOLD, fontSize: 13.5, fontFamily: FONT, fontWeight: 700,
                    }}
                  >
                    Надіслати всім показаним ({targets.length})
                  </button>
                  <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>
                    Окремий лист кожному, з паузою між відправленнями.
                    {bulkSent > 0 && ` Минулого разу надіслано ${bulkSent}.`}
                  </span>
                </div>
              )}
            </div>
          )
        })()}

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
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={th}>Автор</th>
                  <th style={th}>Вхід</th>
                  <th style={th}>Реквізити</th>
                  <th style={th}>Твори</th>
                  <th style={th}>Договір</th>
                  <th style={th}>Згода</th>
                  <th style={th}>Ставка</th>
                  <th style={th}>Лист</th>
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

                      <td style={{ ...td, minWidth: 210 }}>
                        {r.email ? (() => {
                          const suggested = suggestTemplate(r)
                          const chosen = pickTemplate[r.user_id] ?? suggested ?? 'login'
                          const note = sendNote[r.user_id] ?? ''
                          const blocked = r.consent === 'refused' || r.consent === 'revoked'
                          return (
                            <>
                              {r.last_email_at && (
                                <div style={{ color: MUTED, fontSize: 12, marginBottom: 6 }}>
                                  {r.last_email_status === 'failed' ? '⚠ не дійшов · ' : 'надіслано '}
                                  {dateShort(r.last_email_at)}
                                  {r.last_email_template && ` · ${TEMPLATE_LABEL[r.last_email_template as AuthorEmailTemplate] ?? r.last_email_template}`}
                                </div>
                              )}
                              {blocked ? (
                                <span style={{ color: BAD, fontSize: 12.5 }}>Згоди немає</span>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      disabled={sendingId === r.user_id}
                                      onClick={() => { void send(r, chosen) }}
                                      style={{
                                        padding: '6px 11px', borderRadius: 8, cursor: 'pointer',
                                        border: 'none', background: GOLD, color: NAVY_DEEP,
                                        fontSize: 12.5, fontFamily: FONT, fontWeight: 700,
                                        opacity: sendingId === r.user_id ? 0.6 : 1,
                                      }}
                                    >
                                      {sendingId === r.user_id ? 'Шлемо…' : 'Надіслати'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { void copy(r) }}
                                      style={{
                                        padding: '6px 9px', borderRadius: 8, cursor: 'pointer',
                                        border: `1px solid ${LINE}`, background: 'transparent',
                                        color: copied === r.user_id ? OK : MUTED,
                                        fontSize: 12.5, fontFamily: FONT,
                                      }}
                                    >
                                      {copied === r.user_id ? '✓' : 'Копія'}
                                    </button>
                                  </div>
                                </>
                              )}
                              {note && (
                                <div style={{
                                  fontSize: 12, marginTop: 6, lineHeight: 1.5,
                                  color: note === 'Надіслано' ? OK : BAD,
                                }}>
                                  {note}
                                </div>
                              )}
                            </>
                          )
                        })() : <span style={{ color: MUTED, fontSize: 12.5 }}>немає пошти</span>}
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
