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
      aria-label="Безкоштовне ознайомлення"
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
            'linear-gradient(90deg, rgba(239,159,39,0.10), rgba(239,159,39,0.05))',
          border: '1px solid rgba(239,159,39,0.4)',
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
              color: 'var(--accent-gold)',
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

    </section>
  )
}
