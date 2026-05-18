'use client'

export default function ChannelsSection() {
  const channels = [
    { name: 'Telegram',  handle: '@balabony',         url: 'https://t.me/balabony',                icon: 'telegram'  },
    { name: 'Viber',     handle: 'Спільнота',         url: 'https://invite.viber.com/?g2=AQB8...',  icon: 'viber'     },
    { name: 'WhatsApp',  handle: 'Написати',  url: 'https://wa.me/380505859141',           icon: 'whatsapp'  },
    { name: 'Facebook',  handle: 'Balabony',          url: 'https://facebook.com/balabony',        icon: 'facebook'  },
    { name: 'Instagram', handle: '@balabony_',        url: 'https://instagram.com/balabony_',      icon: 'instagram' },
    { name: 'TikTok',    handle: '@balabony',         url: 'https://tiktok.com/@balabony',         icon: 'tiktok'    },
  ]

  const GOLD = '#EF9F27'
  const NAVY = '#0E1A2B'

  const renderIcon = (icon: string) => {
    const stroke = GOLD
    switch (icon) {
      case 'telegram':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.5 4 2.5 11.5l6 2 2 6.5 4-4 5 4z" />
            <path d="m8.5 13.5 8-6" />
          </svg>
        )
      case 'viber':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
            <path d="M8 9c1.5 3 3.5 5 6.5 6" />
          </svg>
        )
      case 'whatsapp':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 21l1.6-4.6A8 8 0 1 1 8 19.4z" />
            <path d="M8.5 9.5c.4 2 2 3.6 4 4.4l1-1.2 2.4.9-.5 1.6c-3 0-7.4-2.5-8-7l1.6-.5 1 2.4-1.5 1z" />
          </svg>
        )
      case 'facebook':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 8V5a2 2 0 0 1 2-2h2" />
            <path d="M10 12h7" />
            <path d="M13 21V8" />
          </svg>
        )
      case 'instagram':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.8" fill={stroke} />
          </svg>
        )
      case 'tiktok':
        return (
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 4v10a4 4 0 1 1-4-4" />
            <path d="M14 4c.5 2 2 3.5 4.5 4" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <section className="ch-section" aria-labelledby="ch-title">
      <div className="ch-container">
        <div className="ch-header">
          <div className="ch-label">ДЕ ЧИТАТИ</div>
          <h2 id="ch-title" className="ch-title">Шість каналів — обирай свій</h2>
          <p className="ch-lead">Нові історії, аудіо й анонси — у месенджері, який тобі найзручніший.</p>
        </div>

        <div className="ch-grid">
          {channels.map((c) => (
            <a key={c.name} className="ch-card" href={c.url} target="_blank" rel="noopener noreferrer">
              <div className="ch-icon">{renderIcon(c.icon)}</div>
              <div className="ch-text">
                <div className="ch-name">{c.name}</div>
                <div className="ch-handle">{c.handle}</div>
              </div>
              <div className="ch-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7" />
                  <path d="M8 7h9v9" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </div>

      <style jsx>{`
        .ch-section {
          background: linear-gradient(180deg, ${NAVY} 0%, #14253B 50%, ${NAVY} 100%);
          padding: 56px 16px;
        }
        .ch-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .ch-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .ch-label {
          color: ${GOLD};
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          margin-bottom: 10px;
        }
        .ch-title {
          font-family: 'Lora', serif;
          color: #fff;
          font-size: 28px;
          font-weight: 600;
          margin: 0 0 10px;
        }
        .ch-lead {
          color: #B5D4F4;
          font-size: 15px;
          line-height: 1.5;
          max-width: 540px;
          margin: 0 auto;
        }
        .ch-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .ch-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(239,159,39,0.25);
          border-radius: 14px;
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .ch-card:hover {
          transform: translateY(-3px);
          border-color: ${GOLD};
          background: rgba(239,159,39,0.08);
        }
        .ch-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(239,159,39,0.12);
          border-radius: 50%;
        }
        .ch-text {
          flex: 1;
          min-width: 0;
        }
        .ch-name {
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .ch-handle {
          color: #DCE5F0;
          font-size: 12px;
          opacity: 0.8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ch-arrow {
          flex-shrink: 0;
          opacity: 0.6;
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .ch-card:hover .ch-arrow {
          opacity: 1;
          transform: translate(2px, -2px);
        }
        @media (max-width: 900px) {
          .ch-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 560px) {
          .ch-grid {
            grid-template-columns: 1fr;
          }
          .ch-title {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  )
}
