'use client'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

interface Audience {
  id: string
  title: string
  subtitle: string
  Icon: () => React.ReactElement
}

function ShieldIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}
function WheelchairIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="2.5"/>
      <path d="M12 9.5v6"/>
      <path d="M8 12l4-2 4 2"/>
      <path d="M9 21l3-5.5 3 5.5"/>
      <circle cx="19" cy="14" r="2"/>
    </svg>
  )
}
function HomeMoveIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h2l2-5h10l2 5h2"/>
      <path d="M3 12v6h18v-6"/>
      <circle cx="8" cy="18" r="1.5"/>
      <circle cx="16" cy="18" r="1.5"/>
      <path d="M9 4l1-2h4l1 2"/>
    </svg>
  )
}
function EyeIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <circle cx="12" cy="12" r="8"/>
      <line x1="12" y1="2" x2="12" y2="5"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/>
      <line x1="19" y1="12" x2="22" y2="12"/>
    </svg>
  )
}

const AUDIENCES: Audience[] = [
  { id: 'veterans', title: 'УБД',             subtitle: 'Учасники бойових дій',  Icon: ShieldIcon     },
  { id: 'disability', title: 'Люди',  subtitle: 'з інвалідністю',   Icon: WheelchairIcon },
  { id: 'idp',      title: 'Діти ВПО',         subtitle: 'Внутрішньо переміщені', Icon: HomeMoveIcon   },
  { id: 'vision',   title: 'Зір',   subtitle: 'Крупний шрифт і темна тема', Icon: EyeIcon       },
]

export default function InclusivitySection() {
  return (
    <section id="inclusivity" className="inc-section">
      <div className="inc-wrap">

        <div className="inc-heart">
          <svg className="inc-heart-svg" width="56" height="56" viewBox="0 0 24 24" fill={GOLD}>
            <path d="M12 21s-7-4.5-9.3-9.1C1.2 8.4 3 5 6 5c1.9 0 3.5 1 4.5 2.5h.5C12 6 13.6 5 15.5 5c3 0 4.8 3.4 3.3 6.9C18 16.5 12 21 12 21z"/>
          </svg>
        </div>

        <div className="inc-eyebrow">Для кожного</div>
        <h2 className="inc-title">Балабони доступні всім</h2>
        <p className="inc-lead">
          Соціальний тариф — 1 ₴ на рік — для тих, кому це найважливіше. Верифікація через сервіс «Дія».
        </p>

        <div className="inc-grid">
          {AUDIENCES.map(a => {
            const { Icon } = a
            return (
              <div key={a.id} className="inc-audience">
                <div className="inc-audience-icon"><Icon /></div>
                <div className="inc-audience-title">{a.title}</div>
                <div className="inc-audience-sub">{a.subtitle}</div>
              </div>
            )
          })}
        </div>

        <div className="inc-actions">
          <a href="/#pricing" className="inc-btn-primary">Оформити соціальний тариф →</a>
          <a href="/support" className="inc-btn-secondary">Підтримати ініціативу</a>
        </div>

      </div>

      <style jsx>{`
        @keyframes incHeartBeat {
          0%, 100% { transform: scale(1); }
          14%, 42% { transform: scale(1.15); }
          28%      { transform: scale(1); }
        }
        @keyframes incPulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,159,39,0.45), 0 0 30px rgba(239,159,39,0.25); }
          50%      { box-shadow: 0 0 0 14px rgba(239,159,39,0), 0 0 50px rgba(239,159,39,0.55); }
        }
        .inc-section {
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid ${GOLD};
          border-radius: 16px;
          padding: 48px 28px;
          margin-bottom: 40px;
        }
        .inc-wrap {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
        }
        .inc-heart {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: rgba(239,159,39,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 22px;
          animation: incPulseGlow 2.8s ease-in-out infinite;
        }
        .inc-heart-svg {
          animation: incHeartBeat 1.6s ease-in-out infinite;
        }
        .inc-eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: ${GOLD};
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-family: ${FONT};
        }
        .inc-title {
          font-family: 'Lora', serif;
          font-size: 28px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.25;
          margin: 0 0 14px;
        }
        .inc-lead {
          font-size: 15px;
          color: #DCE5F0;
          line-height: 1.7;
          margin: 0 auto 32px;
          max-width: 540px;
          font-family: ${FONT};
        }
        .inc-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }
        @media (max-width: 720px) {
          .inc-grid { grid-template-columns: 1fr; }
        }
        .inc-audience {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(239,159,39,0.28);
          border-radius: 12px;
          padding: 18px 14px;
          text-align: center;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .inc-audience:hover {
          transform: translateY(-3px);
          border-color: ${GOLD};
          background: rgba(239,159,39,0.08);
        }
        .inc-audience-icon {
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
        }
        .inc-audience-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 4px;
          font-family: ${FONT};
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        .inc-audience-sub {
          font-size: 11px;
          color: #B5D4F4;
          line-height: 1.4;
          font-family: ${FONT};
        }
        .inc-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .inc-btn-primary {
          background: ${GOLD};
          color: #FFFFFF;
          padding: 13px 28px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
          font-family: ${FONT};
        }
        .inc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239,159,39,0.35);
        }
        .inc-btn-secondary {
          background: rgba(255,255,255,0.06);
          color: #FFFFFF;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 13px 28px;
          border-radius: 9px;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          display: inline-block;
          transition: background 0.15s ease, border-color 0.15s ease;
          font-family: ${FONT};
        }
        .inc-btn-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.35);
        }
      `}</style>
    </section>
  )
}
