'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import KepUpload from '@/app/components/KepUpload'

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

export default function AuthorContracts({ contracts }: { contracts: ContractRow[] }) {
  const [rows, setRows] = useState<ContractRow[]>(contracts)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [session, setSession] = useState<StartResult | null>(null)
  const [left, setLeft] = useState(0)
  const [busy, setBusy] = useState(false)
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

      {rows.length === 0 && (
        <p style={{ color: BRAND.text, lineHeight: 1.6, margin: 0 }}>
          Договорів поки немає. Редакція підготує договір після додавання ваших творів.
        </p>
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
                  Підписано {new Date(c.signed_at).toLocaleDateString('uk-UA')} · Дія.Підпис
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
            <a href={`/author/dashboard/works?contract=${c.id}`} style={linkBtn}>Перелік творів</a>
            {c.status !== 'signed' && (
              <button type="button" onClick={() => start(c.id)} disabled={busy} style={primaryBtn}>
                Підписати через Дію
              </button>
            )}
            {c.status === 'signed' && c.signed_pdf_url && (
              <a href={c.signed_pdf_url} style={linkBtn}>Договір із підписом</a>
            )}
            {c.status === 'signed' && c.signature_url && (
              <a href={c.signature_url} style={linkBtn}>Файл підпису</a>
            )}
          </div>

          {c.status !== 'signed' && <KepUpload contractId={c.id} docUrl={c.doc_url} />}

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

      <p style={{ color: BRAND.muted, fontSize: '0.82rem', marginTop: 16, lineHeight: 1.6 }}>
        Немає Дія.Підпису? Підпишіть договір кваліфікованим електронним підписом і додайте файл нижче,
        або{' '}
        <a href="/contact" style={{ color: BRAND.amberDark }}>замовте паперовий примірник</a>.
      </p>
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
