'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import KepUpload from '@/app/components/KepUpload'
import OtpSign from '@/app/components/OtpSign'

const BRAND = {
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = 'Georgia, "Times New Roman", serif'

export type ContractRow = {
  id: string
  number: string
  status: string
  rate: number
  is_fop: boolean
  works_count: number
  /** Скільки творів у переліку ще не підтверджені автором. */
  pending_count?: number
  doc_url: string | null
  signed_pdf_url: string | null
  signature_url: string | null
  signed_at: string | null
}

type StartResult = {
  ok: boolean
  sessionId?: string
  deeplink?: string
  qr?: string
  expiresAt?: string
  stub?: boolean
  error?: string
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Готується',
  awaiting: 'Не підписано',
  signed: 'Підписано',
  terminated: 'Припинено',
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

export default function AuthorContracts(
  { contracts, diiaEnabled = false }: { contracts: ContractRow[]; diiaEnabled?: boolean },
) {
  const [rows, setRows] = useState<ContractRow[]>(contracts)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [session, setSession] = useState<StartResult | null>(null)
  const [left, setLeft] = useState(0)
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const createContract = async () => {
    setCreating(true); setCreateErr('')
    try {
      const res = await fetch('/api/contracts/create', { method: 'POST' })
      // Сервер може віддати не-JSON (сторінку помилки). Раніше це падало в catch
      // і автор бачив «Немає звʼязку», хоча звʼязок був. Тепер розрізняємо.
      const raw = await res.text()
      let d: { ok?: boolean; error?: string } | null = null
      try { d = JSON.parse(raw) as { ok?: boolean; error?: string } } catch { d = null }

      if (!d) {
        setCreateErr(`Сервер відповів помилкою (код ${res.status}). Напишіть у редакцію — ми полагодимо.`)
        return
      }
      if (!d.ok) { setCreateErr(d.error ?? `Не вдалося створити договір (код ${res.status})`); return }
      window.location.reload()
    } catch {
      setCreateErr('Не вдалося звʼязатися з сайтом. Перевірте інтернет і спробуйте ще раз.')
    } finally {
      setCreating(false)
    }
  }
  const [note, setNote] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  useEffect(() => stopTimers, [stopTimers])

  const start = useCallback(async (contractId: string) => {
    setBusy(true)
    setNote(null)
    stopTimers()
    try {
      const res = await fetch('/api/contracts/sign/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId }),
      })
      const data = (await res.json()) as StartResult
      if (!data.ok) {
        setNote(data.error || 'Не вдалося відкрити сесію підпису. Спробуйте ще раз.')
        setBusy(false)
        return
      }
      setActiveId(contractId)
      setSession(data)

      const deadline = data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 180000
      const tick = () => setLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)))
      tick()
      tickRef.current = setInterval(tick, 1000)

      if (data.sessionId && !data.stub) {
        pollRef.current = setInterval(async () => {
          const r = await fetch(`/api/contracts/sign/status?session=${data.sessionId}`)
          const s = (await r.json()) as { status?: string; signedPdfUrl?: string | null; signatureUrl?: string | null }
          if (s.status === 'signed') {
            stopTimers()
            setSession(null)
            setActiveId(null)
            setRows(prev => prev.map(c => c.id === contractId
              ? { ...c, status: 'signed', signed_at: new Date().toISOString(), signed_pdf_url: s.signedPdfUrl ?? null, signature_url: s.signatureUrl ?? null }
              : c))
            setNote('Договір підписано.')
          } else if (s.status === 'failed' || s.status === 'expired') {
            stopTimers()
            setNote('Сесію підпису завершено. Згенеруйте новий код.')
          }
        }, 3000)
      }
    } catch {
      setNote('Немає звʼязку із сервісом підпису.')
    } finally {
      setBusy(false)
    }
  }, [stopTimers])

  const close = useCallback(() => {
    stopTimers()
    setSession(null)
    setActiveId(null)
  }, [stopTimers])

  const box: React.CSSProperties = {
    background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
  }

  return (
    <section style={{ ...box, marginTop: '1.5rem' }}>
      <h2 style={{ fontFamily: SERIF, fontSize: '1.35rem', color: BRAND.amber, margin: '0 0 0.25rem' }}>
        Мої договори
      </h2>
      <p style={{ color: BRAND.muted, fontSize: '0.85rem', margin: '0 0 1.25rem' }}>
        Умови однакові для всіх авторів і опубліковані на{' '}
        <a href="/legal/author-contract" style={{ color: BRAND.amberDark }}>сторінці умов</a>.
      </p>

      {/* 08.11.2026 (Богдан: «поясни авторам, що як робити, поруч у кабінеті») */}
      {(rows.length === 0 || rows.some(r => r.status !== 'signed')) && (
        <div style={{ border: `1px solid ${BRAND.line}`, borderRadius: 12, padding: '14px 16px', margin: '0 0 16px', background: 'rgba(239,159,39,0.06)' }}>
          <div style={{ fontWeight: 800, color: BRAND.ink, fontSize: '1.02rem', marginBottom: 8 }}>Як підписати договір — 3 кроки, 2 хвилини</div>
          <ol style={{ color: BRAND.text, margin: 0, paddingLeft: 22, lineHeight: 1.7, fontSize: '0.95rem' }}>
            <li>У «Реквізитах» вище впишіть 4 поля: <b>ПІБ, РНОКПП, дату народження й телефон</b>. Банківський рахунок і адресу — пізніше, перед першою виплатою.</li>
            <li>Натисніть <b>«Сформувати договір»</b> і прочитайте його — кнопка «Прочитати договір».</li>
            <li>Поставте позначку <b>«Погоджуюсь»</b>, натисніть <b>«Надіслати код на пошту»</b> і введіть 6 цифр з листа. Готово — копія договору прийде на пошту.</li>
          </ol>
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: 'pointer', color: BRAND.amberDark, fontWeight: 700, fontSize: '0.92rem' }}>Часті питання</summary>
            <dl style={{ color: BRAND.text, fontSize: '0.92rem', lineHeight: 1.6, margin: '10px 0 0' }}>
              <dt style={{ fontWeight: 700, color: BRAND.ink, marginTop: 8 }}>Що таке «перелік творів»? Його треба сформувати до підпису?</dt>
              <dd style={{ margin: '2px 0 0' }}>Ні. Перелік — це Додаток № 1: твори, які Ви подаєте на Балабони. Він поповнюється сам, коли Ви подаєте нові твори. Порожній перелік підписанню не заважає.</dd>
              <dt style={{ fontWeight: 700, color: BRAND.ink, marginTop: 8 }}>Можна підписати без банківського рахунку?</dt>
              <dd style={{ margin: '2px 0 0' }}>Так. Рахунок потрібен лише для виплат — впишіть його в реквізитах до першої виплати.</dd>
              <dt style={{ fontWeight: 700, color: BRAND.ink, marginTop: 8 }}>Підпис кодом має юридичну силу?</dt>
              <dd style={{ margin: '2px 0 0' }}>Так, як письмовий (п. 16.1 договору, ст. 12 Закону «Про електронну комерцію»). Якщо хочете інакше — під кнопкою «Інші способи підписати» є «Дія» і ключ КЕП.</dd>
              <dt style={{ fontWeight: 700, color: BRAND.ink, marginTop: 8 }}>Мій твір уже публікувався в інших виданнях чи на сайтах</dt>
              <dd style={{ margin: '2px 0 0' }}>Не ставте позначку «раніше не публікувалися». Після підпису відкрийте «Перелік творів» і зазначте, де твір публікувався, — тоді щодо нього права будуть невиключні. Публікації в газетах «Життя» та інших наших виданнях і на Ваших сторінках у соцмережах не рахуються.</dd>
              <dt style={{ fontWeight: 700, color: BRAND.ink, marginTop: 8 }}>Лист із кодом не прийшов</dt>
              <dd style={{ margin: '2px 0 0' }}>Перевірте папки «Спам» і «Промоакції», зачекайте хвилину й натисніть «Надіслати код ще раз». Не допомогло — напишіть на <a href="mailto:nazar@balabony.com" style={{ color: BRAND.amberDark }}>nazar@balabony.com</a>.</dd>
            </dl>
          </details>
        </div>
      )}

      {rows.length === 0 && (
        <div>
          <p style={{ color: BRAND.text, lineHeight: 1.6, margin: '0 0 12px' }}>
            Договору ще немає. Заповніть вище лише 4 поля — ПІБ, РНОКПП, дату народження й телефон — і
            сформуйте договір. Банківський рахунок і адресу можна додати пізніше, перед першою виплатою.
          </p>
          <button
            type="button"
            disabled={creating}
            onClick={() => { void createContract() }}
            style={{ ...primaryBtn, opacity: creating ? 0.6 : 1 }}
          >
            {creating ? 'Формуємо…' : 'Сформувати договір'}
          </button>
          {createErr && <p style={{ color: '#F09595', fontSize: '0.88rem', marginTop: 10 }}>{createErr}</p>}
        </div>
      )}

      {rows.map(c => (
        <div key={c.id} style={{ borderTop: `1px solid ${BRAND.line}`, padding: '1rem 0' }}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: BRAND.ink }}>Авторський договір № {c.number}</div>
              <div style={{ color: BRAND.muted, fontSize: '0.88rem', marginTop: 2 }}>
                {c.works_count} творів у переліку · ставка {Math.round(Number(c.rate))}%{c.is_fop ? '' : ' на руки'}
              </div>
              {c.signed_at && (
                <div style={{ color: BRAND.muted, fontSize: '0.8rem', marginTop: 4 }}>
                  Підписано {new Date(c.signed_at).toLocaleDateString('uk-UA')}
                </div>
              )}
            </div>
            <span style={{
              flex: 'none', fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999,
              letterSpacing: '0.02em', whiteSpace: 'nowrap', lineHeight: 1.5,
              fontWeight: 700,
              ...(c.status === 'signed' ? { background: 'rgba(151,196,89,0.16)', color: '#C0DD97', border: '1px solid rgba(151,196,89,0.4)' } : { background: 'rgba(143,163,196,0.15)', color: '#e8eef7', border: '1px solid rgba(143,163,196,0.35)' }),
            }}>
              {STATUS_LABEL[c.status] || c.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {c.doc_url && (
              <a href={c.doc_url} target="_blank" rel="noreferrer" style={linkBtn}>Прочитати договір</a>
            )}
            {/* Назва кнопки залежить від стану. «Перелік творів» звучало як
                довідка, і саме тому підтвердження не ставив ніхто: людина не
                бачила, що там треба ДІЯТИ. Коли все підтверджено, повертаємо
                нейтральну назву — вимагати вже нічого. */}
            <a
              href={`/author/dashboard/works?contract=${c.id}`}
              style={(c.pending_count ?? 0) > 0
                ? { ...linkBtn, background: '#ef9f27', color: '#0a1628', fontWeight: 700, border: 'none' }
                : linkBtn}
            >
              {(c.pending_count ?? 0) > 0
                ? `Підтвердити твори (${c.pending_count} очікують)`
                : 'Перелік творів'}
            </a>

            {c.status === 'signed' && c.signed_pdf_url && (
              <a href={c.signed_pdf_url} style={linkBtn}>Договір із підписом</a>
            )}
            {c.status === 'signed' && c.signature_url && (
              <a href={c.signature_url} style={linkBtn}>Файл підпису</a>
            )}
          </div>

          {/* 08.11.2026 (рішення засновника): головний спосіб — код з пошти; Дія, КЕП і папір — під «Інші способи». */}
          {c.status !== 'signed' && (
            <OtpSign
              contractId={c.id}
              pendingCount={c.pending_count ?? 0}
              docUrl={c.doc_url}
              onSigned={() => setRows(prev => prev.map(x => x.id === c.id ? { ...x, status: 'signed', signed_at: new Date().toISOString() } : x))}
            />
          )}
          {c.status !== 'signed' && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', color: BRAND.muted, fontSize: '0.9rem' }}>Інші способи підписати: «Дія», ключ КЕП</summary>
              {diiaEnabled && (
                <button type="button" onClick={() => start(c.id)} disabled={busy} style={{ ...primaryBtn, marginTop: 10 }}>
                  Підписати через Дію
                </button>
              )}
              <KepUpload contractId={c.id} docUrl={c.doc_url} />
            </details>
          )}

          {activeId === c.id && session && (
            <div style={{ marginTop: 16, padding: '1rem', border: `1px solid ${BRAND.line}`, borderRadius: 12, background: '#fffdf8' }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{
                  width: 150, height: 150, flex: 'none', borderRadius: 10, background: '#ffffff' /* QR: лишається білим */,
                  border: `1px solid ${BRAND.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  {session.qr
                    ? <img src={session.qr} alt="QR-код для підпису в Дії" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: BRAND.muted, fontSize: '0.8rem', textAlign: 'center', padding: 8 }}>QR-код зʼявиться після підключення сервера підпису</span>}
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 200 }}>
                  <div style={{ fontWeight: 700, color: BRAND.ink, marginBottom: 6 }}>Відскануйте код застосунком Дія</div>
                  <p style={{ color: BRAND.text, fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                    Відкрийте Дію на телефоні, наведіть камеру на код, перевірте документ і підтвердіть Дія.Підписом.
                  </p>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    background: '#fef3c7', color: '#92400e', borderRadius: 8, fontSize: '0.88rem', marginBottom: 12,
                  }}>
                    {left > 0
                      ? <>Код дійсний ще <strong>{Math.floor(left / 60)}:{pad(left % 60)}</strong></>
                      : <>Код більше не дійсний</>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => start(c.id)} disabled={busy} style={linkBtnAsButton}>
                      Новий код
                    </button>
                    {session.deeplink && (
                      <a href={session.deeplink} style={linkBtn}>Відкрити Дію на цьому телефоні</a>
                    )}
                    <button type="button" onClick={close} style={linkBtnAsButton}>Закрити</button>
                  </div>
                </div>
              </div>
              <p style={{ color: BRAND.muted, fontSize: '0.82rem', margin: '14px 0 0', paddingTop: 12, borderTop: `1px solid ${BRAND.line}` }}>
                {session.stub
                  ? 'Демонстраційний режим: сервіс підпису ще не підключено.'
                  : 'Очікуємо підпис. Не закривайте цю сторінку — статус оновиться сам.'}
              </p>
            </div>
          )}
        </div>
      ))}

      {note && (
        <p style={{ color: BRAND.text, fontSize: '0.88rem', marginTop: 12 }}>{note}</p>
      )}

    </section>
  )
}

const linkBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.5rem 0.9rem', borderRadius: 9,
  border: `1px solid ${BRAND.line}`, background: 'transparent', color: BRAND.text,
  textDecoration: 'none', fontSize: '0.85rem',
}

const linkBtnAsButton: React.CSSProperties = {
  ...linkBtn, cursor: 'pointer', fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-block', padding: '0.5rem 0.9rem', borderRadius: 9,
  border: 'none', background: BRAND.amber, color: BRAND.ink,
  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
}
