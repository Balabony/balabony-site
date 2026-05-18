'use client'

const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const FONT = "'Montserrat', Arial, sans-serif"

interface Revenue {
  id: string
  split: string
  title: string
  subtitle: string
  perks: string[]
  featured: boolean
}

const REVENUE: Revenue[] = [
  {
    id: 'fop',
    split: '50/50',
    title: 'Автор-ФОП',
    subtitle: 'Половина доходу — твоя',
    perks: [
      'Половина від кожного прочитання',
      'Прямі виплати без посередників',
      'Прозорий звіт у кабінеті',
    ],
    featured: true,
  },
  {
    id: 'no-fop',
    split: '60/40',
    title: 'Без ФОП',
    subtitle: 'Без бухгалтерії — ми сплачуємо податки',
    perks: [
      '40% автору, 60% платформі',
      'Платформа сплачує податки за тебе',
      'Жодних звітів і бюрократії',
    ],
    featured: false,
  },
]

export default function AuthorSection() {
  return (
    <section className="as-section">

      {/* HERO: feather 88px + title */}
      <div className="as-hero">
        <div className="as-feather-wrap">
          <svg className="as-feather" width="88" height="88" viewBox="0 0 88 88" fill="none">
            {/* Quill feather */}
            <path
              d="M70 12 C58 14, 44 22, 32 38 C24 49, 20 60, 18 70 L26 70 C28 60, 32 50, 40 42 L48 50 C42 56, 38 62, 36 68 L52 68 C56 60, 62 52, 70 44 L70 12 Z"
              stroke={GOLD}
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="rgba(239,159,39,0.12)"
            />
            {/* Spine */}
            <line x1="70" y1="14" x2="22" y2="76" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round"/>
            {/* Barbs */}
            <line x1="60" y1="22" x2="50" y2="32" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
            <line x1="54" y1="30" x2="42" y2="42" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
            <line x1="48" y1="38" x2="34" y2="52" stroke={GOLD} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
            {/* Tip writing line */}
            <line x1="22" y1="76" x2="14" y2="80" stroke={GOLD} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="as-eyebrow">ДЛЯ АВТОРІВ</div>
        <h2 className="as-title">Стань автором Balabony</h2>
        <p className="as-lead">
          Пишеш історії? Публікуй їх на Balabony і отримуй гонорар з кожного прочитання.
          Ми ділимо доходи чесно — обирай умови, що підходять саме тобі.
        </p>
      </div>

      {/* Revenue cards */}
      <div className="as-grid">
        {REVENUE.map(r => (
          <div key={r.id} className={`as-card ${r.featured ? 'as-card-featured' : ''}`}>
            {r.featured && <div className="as-badge">НАЙВИГІДНІШЕ</div>}
            <div className="as-split">{r.split}</div>
            <div className="as-card-title">{r.title}</div>
            <div className="as-card-sub">{r.subtitle}</div>
            <ul className="as-perks">
              {r.perks.map((p, i) => (
                <li key={i}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M2 7 L6 11 L12 3" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="as-cta-wrap">
        <a href="/become-author" className="as-cta">Подати заявку →</a>
        <div className="as-cta-note">Відповідь протягом 3 робочих днів</div>
      </div>

      <style jsx>{`
        @keyframes asFeatherWrite {
          0%   { transform: rotate(0deg)   translateX(0)   translateY(0); }
          25%  { transform: rotate(-4deg)  translateX(-2px) translateY(1px); }
          50%  { transform: rotate(2deg)   translateX(3px)  translateY(-1px); }
          75%  { transform: rotate(-2deg)  translateX(-1px) translateY(2px); }
          100% { transform: rotate(0deg)   translateX(0)   translateY(0); }
        }
        @keyframes asPulseGlow {
          0%, 100% { box-shadow: 0 8px 28px rgba(239,159,39,0.30), 0 0 0 0 rgba(239,159,39,0.4); }
          50%      { box-shadow: 0 8px 28px rgba(239,159,39,0.55), 0 0 0 14px rgba(239,159,39,0); }
        }
        @keyframes asCtaBreath {
          0%, 100% { transform: scale(1);    box-shadow: 0 6px 20px rgba(239,159,39,0.35); }
          50%      { transform: scale(1.03); box-shadow: 0 10px 28px rgba(239,159,39,0.55); }
        }

        .as-section {
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid ${GOLD};
          border-radius: 16px;
          padding: 44px 24px;
          margin-bottom: 40px;
        }

        .as-hero {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 36px;
        }
        .as-feather-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .as-feather {
          transform-origin: 22px 76px;
          animation: asFeatherWrite 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(239,159,39,0.35));
        }
        .as-eyebrow {
          font-size: 11px;
          font-weight: 800;
          color: ${GOLD};
          letter-spacing: 2.5px;
          text-transform: uppercase;
          margin-bottom: 10px;
          font-family: ${FONT};
        }
        .as-title {
          font-size: 28px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.2;
          margin: 0 0 14px;
          font-family: 'Lora', serif;
        }
        .as-lead {
          font-size: 16px;
          color: #B5D4F4;
          line-height: 1.65;
          margin: 0;
          font-family: ${FONT};
        }

        .as-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          max-width: 820px;
          margin: 0 auto 32px;
        }
        @media (max-width: 640px) {
          .as-grid { grid-template-columns: 1fr; }
          .as-title { font-size: 24px; }
        }

        .as-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(239,159,39,0.25);
          border-radius: 14px;
          padding: 28px 22px 22px;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .as-card:hover {
          transform: translateY(-4px);
          border-color: ${GOLD};
          background: rgba(239,159,39,0.06);
        }
        .as-card-featured {
          background: linear-gradient(180deg, rgba(239,159,39,0.10) 0%, rgba(239,159,39,0.04) 100%);
          border: 1.5px solid ${GOLD};
          animation: asPulseGlow 3s ease-in-out infinite;
        }

        .as-badge {
          position: absolute;
          top: -11px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%);
          color: #0E1A2B;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
          padding: 5px 12px;
          border-radius: 12px;
          font-family: ${FONT};
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(239,159,39,0.4);
        }

        .as-split {
          font-family: 'Lora', serif;
          font-size: 42px;
          font-weight: 900;
          color: ${GOLD};
          line-height: 1;
          margin-bottom: 6px;
          letter-spacing: -1px;
        }
        .as-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 4px;
          font-family: ${FONT};
        }
        .as-card-sub {
          font-size: 13px;
          color: #B5D4F4;
          margin-bottom: 18px;
          line-height: 1.45;
          font-family: ${FONT};
        }

        .as-perks {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .as-perks li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 14px;
          color: rgba(255,255,255,0.88);
          line-height: 1.55;
          font-family: ${FONT};
          margin-bottom: 9px;
        }
        .as-perks li :global(svg) {
          flex-shrink: 0;
          margin-top: 4px;
        }

        .as-cta-wrap {
          text-align: center;
        }
        .as-cta {
          display: inline-block;
          padding: 14px 36px;
          background: linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%);
          color: #FFFFFF;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          text-decoration: none;
          font-family: ${FONT};
          letter-spacing: 0.3px;
          animation: asCtaBreath 2.5s ease-in-out infinite;
        }
        .as-cta:hover {
          opacity: 0.95;
        }
        .as-cta-note {
          margin-top: 12px;
          font-size: 13px;
          color: #8899bb;
          font-family: ${FONT};
        }
      `}</style>
    </section>
  )
}
