'use client'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

interface Quest {
  id: string
  title: string
  desc: string
  reward: string
  Icon: () => React.ReactElement
}

function InviteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  )
}
function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}
function ReviewIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  )
}
function SurveyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  )
}

const QUESTS: Quest[] = [
  { id: 'invite',  title: 'Запроси друга',     desc: 'Обидва отримуєте по 50 балів', reward: '+50', Icon: InviteIcon },
  { id: 'share',   title: 'Поділись історією', desc: '10 балів за кожен шерінг',     reward: '+10', Icon: ShareIcon  },
  { id: 'review',  title: 'Залиш відгук',      desc: '10 балів за кожен коментар',   reward: '+10', Icon: ReviewIcon },
  { id: 'survey',  title: 'Пройди опитування', desc: '3 хвилини · одноразово',       reward: '+50', Icon: SurveyIcon },
]

export default function BonusSection() {
  return (
    <section className="bn-section">

      <div className="bn-header">
        <div className="bn-header-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="16" cy="16" r="11"/>
            <path d="M11 16h10M16 11v10"/>
          </svg>
        </div>
        <div>
          <div className="bn-eyebrow">Гра</div>
          <div className="bn-title">Бонусна програма</div>
        </div>
      </div>

      <div className="bn-balance">
        <div className="bn-balance-row">
          <div>
            <div className="bn-balance-label">Твій баланс</div>
            <div className="bn-balance-amount">— <span className="bn-balance-unit">балів</span></div>
          </div>
          <div className="bn-coin">Б</div>
        </div>
        <div className="bn-balance-foot">Увійдіть, щоб бачити свій баланс і отримувати бонуси.</div>
      </div>

      <div className="bn-quests">
        {QUESTS.map(q => {
          const { Icon } = q
          return (
            <div key={q.id} className="bn-quest">
              <div className="bn-quest-icon"><Icon /></div>
              <div className="bn-quest-body">
                <div className="bn-quest-head">
                  <div className="bn-quest-title">{q.title}</div>
                  <span className="bn-quest-reward">{q.reward}</span>
                </div>
                <div className="bn-quest-desc">{q.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bn-invite">
        <div className="bn-invite-label">Реферальний код</div>
        <div className="bn-invite-row">
          <div className="bn-invite-hint">Увійдіть, щоб отримати свій код</div>
          <a href="/login" className="bn-invite-btn">Увійти</a>
        </div>
      </div>

      <style jsx>{`
        @keyframes bnCoinPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,159,39,0.5); }
          50%      { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239,159,39,0); }
        }
        @keyframes bnPulseGlow {
          0%, 100% { box-shadow: 0 8px 32px rgba(239,159,39,0.35), 0 0 0 0 rgba(239,159,39,0.4); }
          50%      { box-shadow: 0 8px 32px rgba(239,159,39,0.55), 0 0 0 12px rgba(239,159,39,0); }
        }
        .bn-section {
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid ${GOLD};
          border-radius: 16px;
          padding: 36px 24px;
          margin-bottom: 40px;
        }
        .bn-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
        }
        .bn-header-icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: #1a2f4a;
          border: 1.5px solid rgba(239,159,39,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bn-eyebrow {
          font-size: 10px;
          font-weight: 700;
          color: ${GOLD};
          letter-spacing: 2px;
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 4px;
          font-family: ${FONT};
        }
        .bn-title {
          font-size: 20px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          font-family: ${FONT};
        }
        .bn-balance {
          background: linear-gradient(135deg, ${GOLD} 0%, #FAC775 100%);
          border-radius: 16px;
          padding: 22px 24px;
          margin: 0 auto 28px;
          max-width: 760px;
          position: relative;
          overflow: hidden;
          animation: bnPulseGlow 3s ease-in-out infinite;
        }
        .bn-balance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .bn-balance-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(14,26,43,0.7);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 6px;
          font-family: ${FONT};
        }
        .bn-balance-amount {
          font-size: 38px;
          font-weight: 900;
          color: #0E1A2B;
          line-height: 1;
          font-family: 'Lora', serif;
        }
        .bn-balance-unit {
          font-size: 18px;
          font-weight: 700;
        }
        .bn-coin {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #0E1A2B;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Lora', serif;
          font-size: 32px;
          font-weight: 900;
          color: ${GOLD};
          animation: bnCoinPulse 2.2s ease-in-out infinite;
          flex-shrink: 0;
        }
        .bn-balance-foot {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid rgba(14,26,43,0.15);
          font-size: 12px;
          color: rgba(14,26,43,0.75);
          line-height: 1.5;
          font-family: ${FONT};
        }
        .bn-quests {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 0 auto 24px;
          max-width: 760px;
        }
        @media (max-width: 600px) {
          .bn-quests { grid-template-columns: 1fr; }
        }
        .bn-quest {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(239,159,39,0.25);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .bn-quest:hover {
          transform: translateY(-3px);
          border-color: ${GOLD};
          background: rgba(239,159,39,0.08);
        }
        .bn-quest-icon {
          width: 36px;
          height: 36px;
          background: rgba(239,159,39,0.15);
          border: 1px solid rgba(239,159,39,0.4);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .bn-quest-body { flex: 1; min-width: 0; }
        .bn-quest-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .bn-quest-title {
          font-size: 14px;
          font-weight: 700;
          color: #FFFFFF;
          font-family: ${FONT};
        }
        .bn-quest-reward {
          background: rgba(239,159,39,0.18);
          color: ${GOLD};
          border: 1px solid rgba(239,159,39,0.4);
          border-radius: 14px;
          padding: 2px 9px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          font-family: ${FONT};
          flex-shrink: 0;
        }
        .bn-quest-desc {
          font-size: 12px;
          color: #B5D4F4;
          line-height: 1.45;
          font-family: ${FONT};
        }
        .bn-invite {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          max-width: 760px;
          margin: 0 auto;
        }
        .bn-invite-label {
          font-size: 11px;
          font-weight: 700;
          color: #B5D4F4;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
          font-family: ${FONT};
        }
        .bn-invite-row {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }
        .bn-invite-hint {
          color: #B5D4F4;
          font-size: 14px;
          font-family: ${FONT};
        }
        .bn-invite-btn {
          background: ${GOLD};
          color: #FFFFFF;
          border: none;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: ${FONT};
          text-decoration: none;
          display: inline-block;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .bn-invite-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239,159,39,0.35);
        }
      `}</style>
    </section>
  )
}
