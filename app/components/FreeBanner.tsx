'use client'

/**
 * FreeBanner — тонкий банер під Hero.
 * Один рядок: домик (HomeIcon) + два речення + CTA «Деталі ↓».
 * CTA — якір на #how-it-works (блок «Як це працює» на тій же сторінці).
 * Коли /free буде задеплоєна — поміняти href на /free.
 */
export default function FreeBanner() {
  return (
    <section
      aria-label="Безкоштовний доступ"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        padding: '1rem 1.25rem',
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      <a
        href="#how-it-works"
        className="free-banner"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background:
            'linear-gradient(90deg, rgba(240,165,0,0.10), rgba(240,165,0,0.05))',
          border: '1px solid rgba(240,165,0,0.4)',
          borderRadius: 14,
          padding: '14px 18px',
          textDecoration: 'none',
          color: 'inherit',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Shimmer-блік */}
        <span className="free-banner__shimmer" aria-hidden="true" />

        {/* Домик (HomeIcon в стилі Breadcrumbs.tsx) */}
        <span className="free-banner__icon" aria-hidden="true">
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path d="M3 12l9-9 9 9" />
            <path d="M5 10v10h14V10" />
            <path d="M10 20v-6h4v6" />
          </svg>
        </span>

        <span
          className="free-banner__text"
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 13,
            lineHeight: 1.45,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <strong
            style={{
              color: '#f0a500',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Заходь без оплати.
          </strong>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>
            {' '}
            Вісім серій + сім історій + тиждень повного доступу.
          </span>
        </span>

        <span className="free-banner__cta">
          Деталі&nbsp;↓
        </span>
      </a>

      <style jsx>{`
        @keyframes free-banner-shimmer {
          0%,
          100% {
            left: -50%;
          }
          50% {
            left: 100%;
          }
        }
        @keyframes free-banner-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes free-banner-pulse {
          0%,
          100% {
            box-shadow: 0 0 14px rgba(240, 165, 0, 0.4);
          }
          50% {
            box-shadow: 0 0 22px rgba(240, 165, 0, 0.65);
          }
        }
        .free-banner__shimmer {
          position: absolute;
          top: 0;
          left: -50%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(240, 165, 0, 0.15),
            transparent
          );
          animation: free-banner-shimmer 4s ease-in-out infinite;
          pointer-events: none;
        }
        .free-banner__icon {
          flex-shrink: 0;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid rgba(240, 165, 0, 0.4);
          background: rgba(240, 165, 0, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f0a500;
          animation: free-banner-float 3.5s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        .free-banner__cta {
          flex-shrink: 0;
          background: linear-gradient(135deg, #f0a500, #ffb820);
          color: #1a1f2e;
          padding: 9px 20px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          animation: free-banner-pulse 2.5s ease-in-out infinite;
          position: relative;
          z-index: 1;
          letter-spacing: 0.02em;
        }
        @media (prefers-reduced-motion: reduce) {
          .free-banner__shimmer,
          .free-banner__icon,
          .free-banner__cta {
            animation: none;
          }
        }
        @media (max-width: 560px) {
          .free-banner {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
            padding: 12px 14px;
          }
          .free-banner__icon {
            width: 36px;
            height: 36px;
          }
          .free-banner__text {
            font-size: 12px;
            width: 100%;
          }
          .free-banner__cta {
            padding: 8px 14px;
            font-size: 12px;
            align-self: stretch;
            text-align: center;
          }
        }
      `}</style>
    </section>
  )
}
