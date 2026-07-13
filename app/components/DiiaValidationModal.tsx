'use client'

/**
 * DiiaValidationModal — підтвердження пільгового статусу через застосунок «Дія».
 *
 * Сценарій «Валідація документа»: сервер отримує від Дії лише «дійсний/недійсний»,
 * ЖОДНИХ персональних даних. У БД (benefit_status) пишеться тільки category.
 *
 * Працює на Vercel (не потребує VPS/ІІТ) для трьох категорій:
 *   ВПО (reference-internally-displaced-person),
 *   УБД (veteran-certificate),
 *   пенсіонер (pension-card).
 *
 * Інвалідність (група з pension-card) читається ТІЛЬКИ шерингом і тут
 * позначається як `soon: true` — кнопка неактивна до запуску Етапу 2.
 *
 * Один компонент, дві точки входу — набір статусів задається через `options`.
 */

import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

export type DiiaDocType =
  | 'reference-internally-displaced-person'
  | 'veteran-certificate'
  | 'pension-card'

export interface DiiaOption {
  docType: DiiaDocType
  label: string        // "Внутрішньо переміщена особа (ВПО)"
  hint?: string        // назва документа в Дії, напр. "Довідка ВПО"
  soon?: boolean       // true → кнопка неактивна (інвалідність, чекає шеринг)
}

interface DiiaValidationModalProps {
  title: string
  subtitle?: string
  options: DiiaOption[]
  onClose: () => void
  onVerified?: (category: string) => void
}

type Step = 'select' | 'code' | 'success' | 'fail'

interface ValidateResponse {
  verified?: boolean
  category?: string
  reason?: string
  error?: string
}

// ── стилі (дзеркалять PaymentModal для консистентності) ──────────────
const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 500,
  padding: 16,
}

const card: React.CSSProperties = {
  background: '#ffffff',
  padding: '32px 28px',
  borderRadius: 24,
  width: '90%',
  maxWidth: 420,
  textAlign: 'center',
  maxHeight: '90vh',
  overflowY: 'auto',
}

const h3: React.CSSProperties = {
  fontFamily: "'Lora', serif",
  fontSize: 20,
  fontWeight: 600,
  marginBottom: 6,
  color: '#0f1e3a',
}

const sub: React.CSSProperties = {
  fontSize: 14,
  color: '#475569',
  marginBottom: 24,
  lineHeight: 1.5,
}

const primaryBtn: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: 14,
  borderRadius: 12,
  border: 'none',
  background: '#0f1e3a',
  color: '#fff',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Montserrat', sans-serif",
}

const linkBtn: React.CSSProperties = {
  display: 'inline-block',
  marginTop: 16,
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: 13,
  cursor: 'pointer',
  textDecoration: 'underline',
}

export default function DiiaValidationModal({
  title,
  subtitle,
  options,
  onClose,
  onVerified,
}: DiiaValidationModalProps) {
  // Якщо доступний лише один статус — крок вибору не потрібен,
  // одразу показуємо інструкцію (інакше самотня кнопка збиває з пантелику).
  const single = options.length === 1
  const [step, setStep] = useState<Step>(single ? 'code' : 'select')
  const [selected, setSelected] = useState<DiiaOption | null>(single ? options[0] : null)
  const [barcode, setBarcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const pickStatus = useCallback((opt: DiiaOption) => {
    if (opt.soon) return
    setSelected(opt)
    setBarcode('')
    setMessage(null)
    setStep('code')
  }, [])

  const onBarcodeChange = useCallback((raw: string) => {
    setBarcode(raw.replace(/\D/g, '').slice(0, 13))
  }, [])

  const submit = useCallback(async () => {
    if (!selected || barcode.length !== 13) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch('/api/diia/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docType: selected.docType, barcode }),
      })

      if (res.status === 401) {
        setMessage('Спершу увійдіть у свій акаунт, щоб підтвердити статус.')
        setLoading(false)
        return
      }

      const data = (await res.json()) as ValidateResponse

      if (data.verified === true) {
        setStep('success')
        onVerified?.(data.category ?? '')
      } else if (data.error) {
        setMessage(data.error)
      } else {
        setMessage(data.reason ?? 'Документ не підтверджено. Перевірте код і спробуйте ще раз.')
        setStep('fail')
      }
    } catch {
      setMessage('Не вдалося зв’язатися з сервером. Спробуйте ще раз.')
    } finally {
      setLoading(false)
    }
  }, [selected, barcode, onVerified])

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!mounted) return null

  return createPortal(
    <div onClick={closeOnBackdrop} style={overlay}>
      <div style={card}>
        {/* ── КРОК 1: вибір статусу ── */}
        {step === 'select' && (
          <>
            <h3 style={h3}>{title}</h3>
            <p style={sub}>{subtitle ?? 'Оберіть свій статус для підтвердження через «Дію»'}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {options.map((opt) => (
                <button
                  key={opt.docType}
                  type="button"
                  onClick={() => pickStatus(opt)}
                  disabled={opt.soon}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    background: opt.soon ? '#f8fafc' : '#fff',
                    color: opt.soon ? '#94a3b8' : '#0f1e3a',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: opt.soon ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  <span>{opt.label}</span>
                  {opt.soon && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#ef9f27', flexShrink: 0 }}>
                      незабаром
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button type="button" onClick={onClose} style={linkBtn}>
              Скасувати
            </button>
          </>
        )}

        {/* ── КРОК 2: введення штрихкоду ── */}
        {step === 'code' && selected && (
          <>
            <h3 style={h3}>Підтвердження через «Дію»</h3>
            <p style={sub}>{selected.label}</p>

            <div style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0f1e3a',
              textAlign: 'left',
              marginBottom: 12,
            }}>
              Як отримати код у «Дії»:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {[
                <>Візьміть телефон і відкрийте застосунок <b>Дія</b> (жовтий значок).</>,
                <>Унизу екрана натисніть кнопку <b>«Документи»</b>.</>,
                <>Знайдіть на екрані <b>«{selected.hint ?? selected.label}»</b> і натисніть на нього.</>,
                <>Натисніть круглу кнопку <b>«Штрихкод»</b> (з чорними смужками).</>,
                <>Над кнопкою з’явиться штрихкод, а під ним <b>13 цифр</b>. Перепишіть їх у віконце нижче.</>,
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}>
                  <span style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#ef9f27',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 15, color: '#334155', lineHeight: 1.5, paddingTop: 3 }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 10,
              padding: '11px 14px',
              marginBottom: 16,
              fontSize: 14,
              color: '#9a3412',
              textAlign: 'left',
              lineHeight: 1.5,
            }}>
              ⏱ Код діє лише <b>3 хвилини</b>. Вводьте одразу, щойно він з’явиться.
            </div>

            <div style={{
              fontSize: 13,
              color: '#64748b',
              textAlign: 'left',
              marginBottom: 16,
              lineHeight: 1.5,
            }}>
              Не виходить самостійно? Попросіть допомогти рідних або зверніться до нас — ми підкажемо.
            </div>

            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="13 цифр коду"
              value={barcode}
              onChange={(e) => onBarcodeChange(e.target.value)}
              style={{
                width: '100%',
                padding: '13px 14px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: 18,
                letterSpacing: 2,
                textAlign: 'center',
                marginBottom: 8,
                fontFamily: "'Montserrat', sans-serif",
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
              {barcode.length}/13
            </div>

            {message && (
              <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 14, lineHeight: 1.4 }}>
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={loading || barcode.length !== 13}
              style={{
                ...primaryBtn,
                opacity: loading || barcode.length !== 13 ? 0.5 : 1,
                cursor: loading || barcode.length !== 13 ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Перевірка…' : 'Підтвердити статус'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (single) { onClose() }
                else { setStep('select'); setMessage(null) }
              }}
              style={linkBtn}
            >
              {single ? 'Скасувати' : '← Обрати інший статус'}
            </button>
          </>
        )}

        {/* ── КРОК 3: успіх ── */}
        {step === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8, color: '#1d9e75' }}>✓</div>
            <h3 style={h3}>Статус підтверджено</h3>
            <p style={sub}>
              Дякуємо! Ваш пільговий статус активовано. Він діє протягом року —
              наступного разу підтверджувати не потрібно.
            </p>
            <button type="button" onClick={onClose} style={primaryBtn}>
              Готово
            </button>
          </>
        )}

        {/* ── КРОК 3: невдача ── */}
        {step === 'fail' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 8, color: '#dc2626' }}>✕</div>
            <h3 style={h3}>Не вдалося підтвердити</h3>
            <p style={sub}>
              {message ?? 'Документ не підтверджено.'}
            </p>
            <button
              type="button"
              onClick={() => { setStep('code'); setMessage(null); setBarcode('') }}
              style={primaryBtn}
            >
              Спробувати ще раз
            </button>
            <button type="button" onClick={onClose} style={linkBtn}>
              Закрити
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
