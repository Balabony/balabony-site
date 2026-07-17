'use client'

import { useEffect, useState } from 'react'

const GOLD = '#EF9F27'
const NAVY = '#0E1A2B'
const FONT = "'Montserrat', Arial, sans-serif"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function ShareIcon({ size = 16, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size + 2} viewBox="0 0 14 16" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
      aria-hidden="true"
    >
      <path d="M2 7 L2 14 Q2 15 3 15 L11 15 Q12 15 12 14 L12 7" />
      <line x1="7" y1="10" x2="7" y2="1" />
      <polyline points="3.5,5 7,1 10.5,5" />
    </svg>
  )
}

function AddToHomeIcon({ size = 16, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
      aria-hidden="true"
    >
      <rect x="1" y="1" width="12" height="12" rx="2" />
      <line x1="7" y1="4" x2="7" y2="10" />
      <line x1="4" y1="7" x2="10" y2="7" />
    </svg>
  )
}

const ANDROID_STEPS: React.ReactNode[] = [
  'Натисни ⋮ (три крапки вгорі справа)',
  'Вибери «Додати на головний екран»',
  'Підтверди — іконка з\u2019явиться на екрані',
]

const IPHONE_STEPS: React.ReactNode[] = [
  <>{'Натисни кнопку «Поділитися» '}<ShareIcon />{' — внизу екрана посередині'}</>,
  'Прокрути список, що відкрився, вниз',
  <>{'Натисни '}<AddToHomeIcon />{' «На Початковий екран»'}</>,
  'Натисни «Додати» у правому верхньому куті',
]

export default function PwaSection() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean }
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
    if (isStandalone) setInstalled(true)

    const ua = window.navigator.userAgent
    setIsIos(/iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document))

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      setShowSteps(false)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (installed) return null

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt()
      const { outcome } = await deferred.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferred(null)
      return
    }
    setShowSteps((v) => !v)
  }

  const steps = isIos ? IPHONE_STEPS : ANDROID_STEPS

  return (
    <section className="pwa-section">
      <h4 className="pwa-title">Завжди під рукою</h4>
      <p className="pwa-lead">
        Balabony можна поставити на головний екран — відкриватиметься як звичайний
        застосунок, без завантажень і місця в памʼяті.
      </p>

      <button
        type="button"
        className="pwa-btn"
        onClick={handleClick}
        aria-expanded={deferred ? undefined : showSteps}
      >
        Поставити Balabony на головний екран
      </button>

      {showSteps && !deferred && (
        <div className="pwa-steps">
          <p className="pwa-steps-head">
            {isIos ? 'На iPhone — чотири кроки:' : 'У твоєму браузері — три кроки:'}
          </p>
          <ol className="pwa-steps-list">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="pwa-num">{i + 1}</span>
                <span className="pwa-step-text">{s}</span>
              </li>
            ))}
          </ol>
          {isIos && (
            <p className="pwa-note">
              Якщо кнопки «Поділитися» не видно — відкрий balabony.com у Safari.
            </p>
          )}
        </div>
      )}

      <style jsx>{`
        .pwa-section {
          max-width: 720px;
          margin: 0 auto;
          padding: 40px 20px;
          text-align: center;
          font-family: ${FONT};
        }
        .pwa-title {
          font-size: 26px;
          font-weight: 700;
          color: #ffffff;
          margin: 0 0 12px;
        }
        .pwa-lead {
          font-size: 17px;
          line-height: 1.6;
          color: #c9d4e2;
          margin: 0 auto 28px;
          max-width: 560px;
        }
        .pwa-btn {
          display: inline-block;
          background: ${GOLD};
          color: ${NAVY};
          border: none;
          border-radius: 999px;
          padding: 18px 36px;
          font-family: ${FONT};
          font-size: 18px;
          font-weight: 700;
          line-height: 1.3;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 18px rgba(239, 159, 39, 0.28);
        }
        .pwa-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 22px rgba(239, 159, 39, 0.4);
        }
        .pwa-btn:focus-visible {
          outline: 3px solid #ffffff;
          outline-offset: 3px;
        }
        .pwa-steps {
          margin: 28px auto 0;
          max-width: 520px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid ${GOLD};
          border-radius: 16px;
          padding: 24px 22px;
          text-align: left;
        }
        .pwa-steps-head {
          margin: 0 0 16px;
          font-size: 17px;
          font-weight: 700;
          color: ${GOLD};
        }
        .pwa-steps-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .pwa-steps-list li {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
        }
        .pwa-steps-list li:last-child {
          margin-bottom: 0;
        }
        .pwa-num {
          flex: 0 0 26px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1.5px solid ${GOLD};
          color: ${GOLD};
          font-size: 14px;
          font-weight: 700;
          line-height: 24px;
          text-align: center;
        }
        .pwa-step-text {
          font-size: 16px;
          line-height: 1.55;
          color: #e6edf5;
        }
        .pwa-note {
          margin: 16px 0 0;
          font-size: 14px;
          line-height: 1.5;
          color: #9fb0c4;
        }
        @media (max-width: 480px) {
          .pwa-btn {
            width: 100%;
            padding: 18px 20px;
            font-size: 17px;
          }
          .pwa-title {
            font-size: 22px;
          }
        }
      `}</style>
    </section>
  )
}
