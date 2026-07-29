'use client'

import { useState } from 'react'

const BRAND = {
  cream: '#f6f1e7',
  amber: '#ef9f27',
  amberDark: '#b45309',
  ink: '#1c1917',
  text: '#292524',
  muted: '#78716c',
  line: '#e7e0d2',
}
const SERIF = 'Georgia, "Times New Roman", serif'

const UI = {
  labelText: '#2b2118',
  fieldBorder: '#ded4bf',
  chipBg: '#fffdf7',
  chipBorder: '#cfc3aa',
  chipText: '#4a423a',
  chipOnBg: '#fbe3b4',
  chipOnBorder: '#d98324',
  chipOnText: '#7a4a06',
  solidBg: '#ef9f27',
  solidBorder: '#d98324',
  solidText: '#3a2708',
}


export type Requisites = {
  full_name: string | null
  rnokpp: string | null
  address: string | null
  phone: string | null
  payout_iban: string | null
  bank_name: string | null
  payout_recipient: string | null
  pen_name: string | null
  is_fop: boolean
  requisites_updated_at: string | null
}

type Props = { initial: Requisites }

const REQUIRED: (keyof Requisites)[] = ['full_name', 'rnokpp', 'address', 'phone', 'payout_iban', 'bank_name']

export function isComplete(r: Requisites): boolean {
  return REQUIRED.every(k => {
    const v = r[k]
    return typeof v === 'string' && v.trim().length > 0
  })
}

export default function AuthorRequisites({ initial }: Props) {
  const [open, setOpen] = useState(!isComplete(initial))
  const [form, setForm] = useState<Requisites>(initial)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  function set<K extends keyof Requisites>(k: K, v: Requisites[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function validate(): string | null {
    const name = (form.full_name ?? '').trim()
    if (name.split(/\s+/).length < 3) return 'Впишіть прізвище, імʼя та по батькові повністю.'
    const rnokpp = (form.rnokpp ?? '').replace(/\D/g, '')
    if (rnokpp.length !== 10) return 'РНОКПП має містити 10 цифр.'
    const iban = (form.payout_iban ?? '').replace(/\s/g, '').toUpperCase()
    if (!/^UA\d{27}$/.test(iban)) return 'IBAN має починатися з UA і містити 29 символів.'
    if ((form.phone ?? '').replace(/\D/g, '').length < 10) return 'Впишіть номер телефону.'
    if (!(form.address ?? '').trim()) return 'Впишіть адресу.'
    if (!(form.bank_name ?? '').trim()) return 'Впишіть назву банку.'
    return null
  }

  async function save() {
    const bad = validate()
    if (bad) { setErr(bad); setNote(null); return }
    setErr(null)
    setBusy(true)
    try {
      const res = await fetch('/api/author/requisites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: (form.full_name ?? '').trim(),
          rnokpp: (form.rnokpp ?? '').replace(/\D/g, ''),
          address: (form.address ?? '').trim(),
          phone: (form.phone ?? '').trim(),
          iban: (form.payout_iban ?? '').replace(/\s/g, '').toUpperCase(),
          bankName: (form.bank_name ?? '').trim(),
          payoutRecipient: (form.payout_recipient ?? '').trim() || null,
          penName: (form.pen_name ?? '').trim() || null,
          isFop: form.is_fop,
        }),
      })
      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!data.ok) { setErr(data.error || 'Не вдалося зберегти.'); return }
      setNote('Дані збережено. Вони підставляться у ваш договір.')
      setForm(f => ({ ...f, requisites_updated_at: new Date().toISOString() }))
      setOpen(false)
    } catch {
      setErr('Немає звʼязку із сервером.')
    } finally {
      setBusy(false)
    }
  }

  const complete = isComplete(form)

  return (
    <section style={{
      background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.25)', marginTop: '1.5rem',
    }}>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: '1.3rem', color: BRAND.ink, margin: '0 0 0.25rem' }}>
            Мої дані для договору
          </h2>
          <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: 0 }}>
            Ці дані автоматично підставляються у ваш авторський договір і в розрахунок винагороди.
          </p>
        </div>
        <span style={{
          flex: 'none', fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999,
          letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.5,
          ...(complete
            ? { background: '#e8f1e2', color: '#3f6212', border: '1px solid #d3e3c6' }
            : { background: '#fbeccd', color: '#8a5a06', border: '1px solid #eed6a6' }),
        }}>
          {complete ? 'Заповнено' : 'Треба заповнити'}
        </span>
      </div>

      {!open && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ color: BRAND.text, fontSize: '0.92rem', lineHeight: 1.7 }}>
            {form.full_name} · {form.is_fop ? 'ФОП, ставка 50%' : 'фізична особа, ставка 40% на руки'}
            <br />
            {form.payout_iban} · {form.bank_name}
            {form.pen_name ? <><br />Публікуюся як: {form.pen_name}</> : null}
          </div>
          <button type="button" onClick={() => setOpen(true)} style={secondaryBtn}>Змінити дані</button>
        </div>
      )}

      {open && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={label}>Ваш статус</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => set('is_fop', false)} style={form.is_fop ? choiceOff : choiceOn}>
                Фізична особа · 40% на руки
              </button>
              <button type="button" onClick={() => set('is_fop', true)} style={form.is_fop ? choiceOn : choiceOff}>
                ФОП · 50%
              </button>
            </div>
            <p style={{ color: BRAND.muted, fontSize: '0.83rem', lineHeight: 1.6, marginTop: 8 }}>
              {form.is_fop
                ? 'Ви отримуєте 50% і сплачуєте податки самостійно.'
                : 'Ви отримуєте 40% на руки. Податок на доходи фізичних осіб і військовий збір платформа сплачує понад цю суму власним коштом.'}
            </p>
            <p style={{ color: BRAND.muted, fontSize: '0.83rem', lineHeight: 1.6, marginTop: 4 }}>
              Відсоток рахується від доходу після комісій платіжних систем, тому сума
              в гривнях щомісяця різна.
            </p>
          </div>

          <Field label="Прізвище, імʼя, по батькові" value={form.full_name ?? ''} onChange={v => set('full_name', v)} placeholder="Прізвище Імʼя По батькові" />
          <Field label="РНОКПП (ідентифікаційний код)" value={form.rnokpp ?? ''} onChange={v => set('rnokpp', v)} placeholder="10 цифр" />
          <Field label="Адреса" value={form.address ?? ''} onChange={v => set('address', v)} placeholder="Місто, вулиця, будинок, квартира" />
          <Field label="Телефон" value={form.phone ?? ''} onChange={v => set('phone', v)} placeholder="+380…" />
          <Field label="IBAN" value={form.payout_iban ?? ''} onChange={v => set('payout_iban', v)} placeholder="UA…" />
          <div style={{ marginBottom: '0.9rem' }}>
            <div style={label}>Назва банку</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {BANKS.map(b => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set('bank_name', b)}
                  style={(form.bank_name ?? '') === b ? bankOn : bankOff}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.bank_name ?? ''}
              placeholder="Або впишіть свій банк"
              onChange={e => set('bank_name', e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${UI.fieldBorder}`,
                borderRadius: 10, background: '#fffdf7', color: BRAND.text, fontSize: '0.95rem',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>
          <Field label="Одержувач платежу (якщо відрізняється)" value={form.payout_recipient ?? ''} onChange={v => set('payout_recipient', v)} placeholder="необовʼязково" />
          <Field label="Псевдонім для публікації" value={form.pen_name ?? ''} onChange={v => set('pen_name', v)} placeholder="необовʼязково — тоді публікуємо під справжнім імʼям" />

          {err && <p style={{ color: '#b91c1c', fontSize: '0.88rem', margin: '0 0 10px' }}>{err}</p>}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button type="button" onClick={save} disabled={busy} style={primaryBtn}>
              {busy ? 'Зберігаю…' : 'Зберегти'}
            </button>
            {isComplete(initial) && (
              <button type="button" onClick={() => { setOpen(false); setForm(initial); setErr(null) }} style={secondaryBtn}>
                Скасувати
              </button>
            )}
          </div>

          <p style={{ color: BRAND.muted, fontSize: '0.82rem', lineHeight: 1.6, marginTop: 14 }}>
            Дані потрібні для нарахування й виплати винагороди та податкової звітності.
            Псевдонім показуємо читачам; справжнє імʼя публічно не розкриваємо.
            Обробка — згідно з{' '}
            <a href="/legal/privacy" style={{ color: BRAND.amberDark }}>політикою конфіденційності</a>.
          </p>
        </div>
      )}

      {note && <p style={{ color: BRAND.text, fontSize: '0.9rem', marginTop: 12 }}>{note}</p>}
    </section>
  )
}

function Field(
  { label: text, value, onChange, placeholder }:
  { label: string; value: string; onChange: (v: string) => void; placeholder?: string },
) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={label}>{text}</div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${UI.fieldBorder}`,
          borderRadius: 10, background: '#fffdf7', color: BRAND.text, fontSize: '0.95rem',
          fontFamily: 'inherit', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}

const BANKS = ['ПриватБанк', 'Ощадбанк', 'monobank'] as const

const bankOn: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 999, border: `1.5px solid ${UI.chipOnBorder}`,
  background: UI.chipOnBg, color: UI.chipOnText, fontWeight: 700, fontSize: '0.88rem',
  cursor: 'pointer', fontFamily: 'inherit',
}

const bankOff: React.CSSProperties = {
  padding: '0.5rem 0.9rem', borderRadius: 999, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.88rem',
  cursor: 'pointer', fontFamily: 'inherit',
}

const label: React.CSSProperties = {
  fontSize: '0.88rem', color: UI.labelText, fontWeight: 700, marginBottom: 6,
  letterSpacing: '0.01em',
}

const primaryBtn: React.CSSProperties = {
  padding: '0.65rem 1.3rem', borderRadius: 10, border: `1.5px solid ${UI.solidBorder}`,
  background: UI.solidBg, color: UI.solidText, fontWeight: 700,
  fontSize: '0.92rem', cursor: 'pointer', fontFamily: 'inherit',
}

const secondaryBtn: React.CSSProperties = {
  padding: '0.6rem 1.1rem', borderRadius: 10, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.9rem',
  cursor: 'pointer', fontFamily: 'inherit', marginTop: 10,
}

const choiceOn: React.CSSProperties = {
  padding: '0.7rem 1rem', borderRadius: 10, border: `1.5px solid ${UI.solidBorder}`,
  background: UI.solidBg, color: UI.solidText, fontWeight: 700, fontSize: '0.95rem',
  cursor: 'pointer', fontFamily: 'inherit', flex: '1 1 180px',
}

const choiceOff: React.CSSProperties = {
  padding: '0.7rem 1rem', borderRadius: 10, border: `1px solid ${UI.chipBorder}`,
  background: UI.chipBg, color: UI.chipText, fontSize: '0.95rem',
  cursor: 'pointer', fontFamily: 'inherit', flex: '1 1 180px',
}
