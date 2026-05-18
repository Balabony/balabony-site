'use client'

const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const NAVY = '#0E1A2B'
const FONT = "'Montserrat', Arial, sans-serif"

function ShareIcon({ size = 14, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size + 2} viewBox="0 0 14 16" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
    >
      <path d="M2 7 L2 14 Q2 15 3 15 L11 15 Q12 15 12 14 L12 7" />
      <line x1="7" y1="10" x2="7" y2="1" />
      <polyline points="3.5,5 7,1 10.5,5" />
    </svg>
  )
}

function AddToHomeIcon({ size = 14, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 14 14" fill="none"
      stroke={color} strokeWidth="1.6" strokeLinecap="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: 2 }}
    >
      <rect x="1" y="1" width="12" height="12" rx="2" />
      <line x1="7" y1="4" x2="7" y2="10" />
      <line x1="4" y1="7" x2="10" y2="7" />
    </svg>
  )
}

const ANDROID_STEPS = [
  'Відкрий balabony.com у Chrome',
  'Натисни ⋮ (вгорі справа) → «Додати на головний екран»',
  'Підтверди — іконка з\'явиться на робочому столі',
]

const IPHONE_STEPS: React.ReactNode[] = [
  'Відкрий balabony.com у браузері Safari',
  <>{'Натисни кнопку "Поділитися" '}<ShareIcon />{' — внизу екрану посередині'}</>,
  'У меню, що відкрилось — прокрути список вниз',
  <>{'Натисни '}<AddToHomeIcon />{' "На Початковий екран"'}</>,
  'Натисни "Додати" у правому верхньому куті',
]

export default function PwaSection() {
  return (
    <section className="pwa-section">
      <h4 className="pwa-title">Завжди під рукою</h4>
      <p className="pwa-lead">
        Додай Balabony на головний екран — як звичайний застосунок, без завантажень.
      </p>

      {/* ━━━━━ 2 phone mockups ━━━━━ */}
      <div className="pwa-phones">

        {/* ────── iPhone (back, tilted left) ────── */}
        <div className="pwa-iphone">
          <div className="pwa-iphone-screen">
            {/* Dynamic Island */}
            <div className="pwa-iphone-island" />

            {/* Status bar: time left, signal/wifi/battery right */}
            <div className="pwa-iphone-status">
              <span className="pwa-iphone-time">9:41</span>
              <span className="pwa-iphone-status-right">
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none" aria-hidden="true">
                  <rect x="0" y="5" width="1.6" height="2" rx="0.3" fill="#fff"/>
                  <rect x="2.4" y="3.5" width="1.6" height="3.5" rx="0.3" fill="#fff"/>
                  <rect x="4.8" y="2" width="1.6" height="5" rx="0.3" fill="#fff"/>
                  <rect x="7.2" y="0.5" width="1.6" height="6.5" rx="0.3" fill="#fff"/>
                </svg>
                <svg width="10" height="7" viewBox="0 0 10 7" fill="none" aria-hidden="true">
                  <path d="M5 6.5 L5 6.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
                  <path d="M2.5 4.5 A4 4 0 0 1 7.5 4.5" stroke="#fff" strokeWidth="0.8" fill="none"/>
                  <path d="M0.5 2.5 A7 7 0 0 1 9.5 2.5" stroke="#fff" strokeWidth="0.8" fill="none"/>
                </svg>
                <span className="pwa-iphone-battery">
                  <span className="pwa-iphone-battery-fill" />
                </span>
              </span>
            </div>

            {/* URL bar */}
            <div className="pwa-iphone-url">
              <span className="pwa-iphone-lock">🔒</span>
              <span className="pwa-iphone-url-text">balabony.com</span>
            </div>

            {/* Content */}
            <div className="pwa-iphone-content">
              <div className="pwa-iphone-brand">BALABONY®</div>
              <div className="pwa-iphone-headline">Читай українське</div>
              <div className="pwa-iphone-cta" />
              <div className="pwa-iphone-cover" />
              <div className="pwa-iphone-line pwa-iphone-line-1" />
              <div className="pwa-iphone-line pwa-iphone-line-2" />
              <div className="pwa-iphone-line pwa-iphone-line-3" />
            </div>

            {/* Bottom Safari toolbar with 4 buttons */}
            <div className="pwa-iphone-toolbar">
              <span className="pwa-iphone-toolbar-btn">‹</span>
              <span className="pwa-iphone-toolbar-btn pwa-iphone-toolbar-btn-disabled">›</span>
              <span className="pwa-iphone-toolbar-share">
                <span className="pwa-iphone-share-halo" />
                <ShareIcon size={11} color="#fff" />
              </span>
              <span className="pwa-iphone-toolbar-btn">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="7" height="7" rx="1" stroke="#fff" strokeWidth="1" fill="none"/>
                  <rect x="3" y="3" width="4" height="4" stroke="#fff" strokeWidth="0.7" fill="none"/>
                </svg>
              </span>
            </div>

            {/* "тут!" badge pointing to share */}
            <div className="pwa-iphone-badge">тут!</div>
          </div>
        </div>

        {/* ────── Android (front, tilted right) ────── */}
        <div className="pwa-android">
          <div className="pwa-android-screen">
            {/* punch-hole camera */}
            <div className="pwa-android-camera" />

            {/* Status bar: time right (android-style) */}
            <div className="pwa-android-status">
              <span className="pwa-android-status-left">
                <svg width="6" height="6" viewBox="0 0 6 6" fill="#fff" aria-hidden="true">
                  <circle cx="3" cy="3" r="2"/>
                </svg>
              </span>
              <span className="pwa-android-status-right">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                  <path d="M0.5 3 A5 5 0 0 1 9.5 3" stroke="#fff" strokeWidth="0.8" fill="none"/>
                  <path d="M2.5 4.5 A3 3 0 0 1 7.5 4.5" stroke="#fff" strokeWidth="0.8" fill="none"/>
                </svg>
                <span className="pwa-android-battery">
                  <span className="pwa-android-battery-fill" />
                </span>
                <span className="pwa-android-time">9:41</span>
              </span>
            </div>

            {/* URL bar with menu ⋮ */}
            <div className="pwa-android-url">
              <span className="pwa-android-lock">🔒</span>
              <span className="pwa-android-url-text">balabony.com</span>
              <span className="pwa-android-menu">
                <span className="pwa-android-menu-halo" />
                <span className="pwa-android-menu-dot" />
                <span className="pwa-android-menu-dot" />
                <span className="pwa-android-menu-dot" />
              </span>
            </div>

            {/* "тут!" badge pointing to menu */}
            <div className="pwa-android-badge">тут!</div>

            {/* Content cards */}
            <div className="pwa-android-content">
              <div className="pwa-android-cards-row">
                <div className="pwa-android-card" />
                <div className="pwa-android-card" />
              </div>
              <div className="pwa-android-section-title">Серії Балабонів</div>
              <div className="pwa-android-list-item">
                <div className="pwa-android-thumb" />
                <div className="pwa-android-text">
                  <div className="pwa-android-line-1" />
                  <div className="pwa-android-line-2" />
                </div>
              </div>
              <div className="pwa-android-list-item">
                <div className="pwa-android-thumb" />
                <div className="pwa-android-text">
                  <div className="pwa-android-line-1" />
                  <div className="pwa-android-line-2" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━━━ Instructions ━━━━━ */}
      <div className="pwa-instructions">
        <div className="pwa-col">
          <div className="pwa-col-title">Android · Chrome</div>
          {ANDROID_STEPS.map((step, i) => (
            <div key={i} className="pwa-step">
              <span className="pwa-step-num">{i + 1}</span>
              <span className="pwa-step-text">{step}</span>
            </div>
          ))}
        </div>
        <div className="pwa-col">
          <div className="pwa-col-title">iPhone · Safari</div>
          {IPHONE_STEPS.map((step, i) => (
            <div key={i} className="pwa-step">
              <span className="pwa-step-num">{i + 1}</span>
              <span className="pwa-step-text">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pwaPulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,159,39,0.6); opacity: 1; }
          50%      { box-shadow: 0 0 0 8px rgba(239,159,39,0); opacity: 0.85; }
        }
        @keyframes pwaBadgeBob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        @keyframes pwaPhoneFloat {
          0%, 100% { transform: var(--phone-base) translateY(0); }
          50%      { transform: var(--phone-base) translateY(-4px); }
        }

        .pwa-section {
          background: #1a2035;
          border: 1.5px solid ${GOLD};
          border-radius: 16px;
          padding: 28px 24px;
          margin-bottom: 56px;
        }

        .pwa-title {
          font-size: 20px;
          font-weight: 700;
          color: #f5f0e8;
          margin: 0 0 8px;
          text-align: center;
          font-family: ${FONT};
        }
        .pwa-lead {
          font-size: 16px;
          color: #8899bb;
          margin: 0 0 28px;
          text-align: center;
          font-family: ${FONT};
        }

        /* ━━━━━ Phones layout ━━━━━ */
        .pwa-phones {
          position: relative;
          height: 360px;
          margin-bottom: 36px;
          max-width: 460px;
          margin-left: auto;
          margin-right: auto;
        }

        /* iPhone */
        .pwa-iphone {
          --phone-base: rotate(-8deg);
          position: absolute;
          left: 8%;
          top: 0;
          width: 158px;
          height: 322px;
          background: #1a1a1a;
          border-radius: 28px;
          padding: 5px;
          box-shadow: 0 20px 44px rgba(0,0,0,0.55);
          transform: var(--phone-base);
          animation: pwaPhoneFloat 4s ease-in-out infinite;
        }
        .pwa-iphone-screen {
          position: relative;
          background: #0E1A2B;
          border-radius: 24px;
          height: 100%;
          overflow: hidden;
        }
        .pwa-iphone-island {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 50px;
          height: 14px;
          background: #1a1a1a;
          border-radius: 8px;
          z-index: 3;
        }
        .pwa-iphone-status {
          position: relative;
          z-index: 2;
          padding: 5px 14px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 22px;
          font-size: 9px;
          color: #fff;
          font-weight: 700;
        }
        .pwa-iphone-time {
          font-family: ${FONT};
        }
        .pwa-iphone-status-right {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .pwa-iphone-battery {
          display: inline-block;
          width: 14px;
          height: 7px;
          border: 0.8px solid #fff;
          border-radius: 2px;
          padding: 0.6px;
          position: relative;
        }
        .pwa-iphone-battery::after {
          content: '';
          position: absolute;
          right: -2px;
          top: 2px;
          width: 1.2px;
          height: 2px;
          background: #fff;
          border-radius: 0 1px 1px 0;
        }
        .pwa-iphone-battery-fill {
          display: block;
          width: 78%;
          height: 100%;
          background: #fff;
          border-radius: 0.5px;
        }

        .pwa-iphone-url {
          margin: 8px 8px 6px;
          padding: 4px 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          font-size: 8px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: center;
        }
        .pwa-iphone-lock {
          font-size: 7px;
          opacity: 0.85;
        }
        .pwa-iphone-url-text {
          font-family: ${FONT};
        }

        .pwa-iphone-content {
          padding: 4px 10px 0;
          text-align: center;
        }
        .pwa-iphone-brand {
          font-size: 9px;
          color: ${GOLD};
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 4px;
          font-family: ${FONT};
        }
        .pwa-iphone-headline {
          font-family: 'Lora', serif;
          font-size: 12px;
          color: #fff;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .pwa-iphone-cta {
          width: 64px;
          height: 16px;
          background: ${GOLD};
          border-radius: 8px;
          margin: 0 auto 8px;
        }
        .pwa-iphone-cover {
          height: 62px;
          background: linear-gradient(135deg, #14253B, #1f3a5f);
          border: 1px solid ${GOLD};
          border-radius: 7px;
          margin-bottom: 5px;
        }
        .pwa-iphone-line {
          height: 3px;
          border-radius: 2px;
          margin-bottom: 3px;
        }
        .pwa-iphone-line-1 { background: ${GOLD}; width: 70%; margin-left: auto; margin-right: auto; }
        .pwa-iphone-line-2 { background: rgba(255,255,255,0.22); }
        .pwa-iphone-line-3 { background: rgba(255,255,255,0.22); width: 60%; margin-left: auto; margin-right: auto; }

        .pwa-iphone-toolbar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 28px;
          background: rgba(0,0,0,0.55);
          border-top: 0.5px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 6px;
        }
        .pwa-iphone-toolbar-btn {
          color: #fff;
          font-size: 14px;
          font-weight: 400;
          opacity: 0.9;
          display: inline-flex;
          align-items: center;
        }
        .pwa-iphone-toolbar-btn-disabled {
          opacity: 0.35;
        }
        .pwa-iphone-toolbar-share {
          position: relative;
          width: 22px;
          height: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }
        .pwa-iphone-share-halo {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: rgba(239,159,39,0.5);
          border: 1.5px solid ${GOLD};
          z-index: 1;
          animation: pwaPulseGlow 2s ease-in-out infinite;
        }
        .pwa-iphone-badge {
          position: absolute;
          bottom: 38px;
          left: 50%;
          transform: translateX(-50%);
          background: ${GOLD};
          color: ${NAVY};
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          font-family: ${FONT};
          animation: pwaBadgeBob 1.5s ease-in-out infinite;
          z-index: 4;
          white-space: nowrap;
        }
        .pwa-iphone-badge::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid ${GOLD};
        }

        /* Android */
        .pwa-android {
          --phone-base: rotate(6deg);
          position: absolute;
          right: 8%;
          top: 30px;
          width: 158px;
          height: 322px;
          background: #2a2a2a;
          border-radius: 24px;
          padding: 4px;
          box-shadow: 0 20px 44px rgba(0,0,0,0.55);
          transform: var(--phone-base);
          animation: pwaPhoneFloat 4s ease-in-out infinite;
          animation-delay: 0.4s;
        }
        .pwa-android-screen {
          position: relative;
          background: #0E1A2B;
          border-radius: 20px;
          height: 100%;
          overflow: hidden;
        }
        .pwa-android-camera {
          position: absolute;
          top: 7px;
          left: 50%;
          transform: translateX(-50%);
          width: 9px;
          height: 9px;
          background: #2a2a2a;
          border-radius: 50%;
          z-index: 3;
        }
        .pwa-android-status {
          position: relative;
          z-index: 2;
          padding: 5px 10px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 22px;
          font-size: 9px;
          color: #fff;
          font-weight: 700;
        }
        .pwa-android-status-left {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .pwa-android-status-right {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .pwa-android-battery {
          display: inline-block;
          width: 14px;
          height: 7px;
          border: 0.8px solid #fff;
          border-radius: 2px;
          padding: 0.6px;
          position: relative;
        }
        .pwa-android-battery::after {
          content: '';
          position: absolute;
          right: -2px;
          top: 2px;
          width: 1.2px;
          height: 2px;
          background: #fff;
          border-radius: 0 1px 1px 0;
        }
        .pwa-android-battery-fill {
          display: block;
          width: 78%;
          height: 100%;
          background: #fff;
          border-radius: 0.5px;
        }
        .pwa-android-time {
          font-family: ${FONT};
        }

        .pwa-android-url {
          position: relative;
          margin: 8px 8px 6px;
          padding: 5px 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          font-size: 8px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .pwa-android-lock {
          font-size: 7px;
          opacity: 0.85;
        }
        .pwa-android-url-text {
          font-family: ${FONT};
          flex: 1;
        }
        .pwa-android-menu {
          position: relative;
          width: 14px;
          height: 18px;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5px;
          flex-shrink: 0;
          z-index: 2;
        }
        .pwa-android-menu-halo {
          position: absolute;
          inset: -3px -2px;
          border-radius: 8px;
          background: rgba(239,159,39,0.5);
          border: 1.5px solid ${GOLD};
          z-index: 1;
          animation: pwaPulseGlow 2s ease-in-out infinite;
        }
        .pwa-android-menu-dot {
          width: 2.5px;
          height: 2.5px;
          background: #fff;
          border-radius: 50%;
          z-index: 2;
          position: relative;
        }

        .pwa-android-badge {
          position: absolute;
          top: 38px;
          right: 8px;
          background: ${GOLD};
          color: ${NAVY};
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          font-family: ${FONT};
          animation: pwaBadgeBob 1.5s ease-in-out infinite;
          z-index: 4;
          white-space: nowrap;
        }
        .pwa-android-badge::before {
          content: '';
          position: absolute;
          top: -3px;
          right: 8px;
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-bottom: 4px solid ${GOLD};
        }

        .pwa-android-content {
          padding: 4px 10px 8px;
        }
        .pwa-android-cards-row {
          display: flex;
          gap: 4px;
          margin-bottom: 7px;
        }
        .pwa-android-card {
          height: 36px;
          flex: 1;
          background: linear-gradient(135deg, #14253B, #1f3a5f);
          border: 1px solid ${GOLD};
          border-radius: 5px;
        }
        .pwa-android-section-title {
          font-size: 8px;
          color: ${GOLD};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
          font-family: ${FONT};
        }
        .pwa-android-list-item {
          display: flex;
          gap: 5px;
          align-items: center;
          padding: 5px;
          background: rgba(255,255,255,0.05);
          border-radius: 5px;
          border: 1px solid rgba(245,166,35,0.3);
          margin-bottom: 4px;
        }
        .pwa-android-thumb {
          width: 18px;
          height: 18px;
          background: ${GOLD};
          border-radius: 4px;
          flex-shrink: 0;
        }
        .pwa-android-text {
          flex: 1;
        }
        .pwa-android-line-1 {
          height: 3px;
          background: #fff;
          border-radius: 1px;
          margin-bottom: 2px;
        }
        .pwa-android-line-2 {
          height: 2px;
          background: rgba(255,255,255,0.3);
          border-radius: 1px;
          width: 70%;
        }

        /* ━━━━━ Instructions ━━━━━ */
        .pwa-instructions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
          max-width: 760px;
          margin: 0 auto;
        }
        .pwa-col-title {
          font-size: 18px;
          font-weight: 700;
          color: ${GOLD};
          margin-bottom: 12px;
          text-align: center;
          font-family: ${FONT};
        }
        .pwa-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }
        .pwa-step-num {
          min-width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(245,166,35,0.15);
          border: 1.5px solid ${GOLD};
          color: ${GOLD};
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-family: ${FONT};
        }
        .pwa-step-text {
          font-size: 16px;
          color: #c8d8e8;
          line-height: 1.6;
          font-family: ${FONT};
        }

        @media (max-width: 480px) {
          .pwa-phones {
            transform: scale(0.92);
            transform-origin: top center;
          }
        }
      `}</style>
    </section>
  )
}
