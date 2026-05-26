'use client'

import Link from 'next/link'

/**
 * FreeHero — головний блок сторінки /free.
 * Eyebrow (uppercase з рамкою) → H1 з золотим акцентом → підзаголовок →
 * 3 фірмові картки → CTA з pulseGlow.
 *
 * Куди веде CTA:
 * - якщо paywall (backend) ще не зроблено — на головну (там FreeBanner + список серій)
 * - коли paywall готовий — поміняти ctaHref на конкретний роут (напр. /stories або /reader)
 */
export default function FreeHero({
  ctaHref = '/',
  ctaLabel = 'РОЗПОЧАТИ ЧИТАТИ →',
}: {
  ctaHref?: string
  ctaLabel?: string
}) {
  const cards = [
    {
      title: 'Вісім серій',
      sub: 'По дві перші з кожного сезону',
      svg: (
        <>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </>
      ),
    },
    {
      title: 'Сім історій',
      sub: 'На твій вибір з каталогу',
      svg: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    },
    {
      title: 'Сім днів',
      sub: 'Повного доступу без картки',
      svg: (
        <>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </>
      ),
    },
  ]

  return (
    <section
      aria-labelledby="free-hero-title"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        background: '#1a1f2e',
        borderRadius: 16,
        padding: '3rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        margin: '2rem auto',
        maxWidth: 1200,
      }}
    >
      <span className="fh__glow fh__glow--tl" aria-hidden="true" />
      <span className="fh__glow fh__glow--br" aria-hidden="true" />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="fh__eyebrow">ЗАХОДЬ ДО БАЛАБОНІВ</div>
        <h1
          id="free-hero-title"
          style={{
            fontSize: 40,
            margin: '1.5rem 0 0.75rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
            color: '#fff',
          }}
        >
          Спробуй <em style={{ color: '#f0a500', fontStyle: 'normal' }}>безкоштовно</em>
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.72)',
            margin: '0 auto',
            maxWidth: 480,
            lineHeight: 1.65,
          }}
        >
          Вісім серій + сім історій + тиждень повного доступу. Спробуй, перш ніж щось купувати.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: 14,
          margin: '2.25rem 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {cards.map((c) => (
          <div key={c.title} className="fh__card">
            <svg
              width={32}
              height={32}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ color: '#f0a500', marginBottom: 12 }}
              aria-hidden="true"
            >
              {c.svg}
            </svg>
            <h3 className="fh__card-title">{c.title}</h3>
            <p className="fh__card-sub">{c.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Link href={ctaHref} className="fh__cta">
          {ctaLabel}
        </Link>
        <p
          style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            margin: '14px 0 0',
            letterSpacing: '0.1em',
          }}
        >
          BALABONY.COM/FREE
        </p>
      </div>

      <style jsx>{`
        @keyframes fh-glow-a {
          0%,
          100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes fh-glow-b {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes fh-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes fh-pulse {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(240, 165, 0, 0.4);
          }
          50% {
            box-shadow: 0 0 36px rgba(240, 165, 0, 0.7);
          }
        }
        .fh__glow {
          position: absolute;
          width: 55%;
          height: 80%;
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(240, 165, 0, 0.22) 0%,
            transparent 60%
          );
        }
        .fh__glow--tl {
          top: -20%;
          left: -10%;
          animation: fh-glow-a 5s ease-in-out infinite;
        }
        .fh__glow--br {
          bottom: -20%;
          right: -10%;
          animation: fh-glow-b 5s ease-in-out infinite;
        }
        .fh__eyebrow {
          display: inline-block;
          background: transparent;
          color: #f0a500;
          padding: 8px 22px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: 1px solid #f0a500;
          animation: fh-float 4s ease-in-out infinite;
          text-transform: uppercase;
        }
        .fh__card {
          background: rgba(26, 31, 46, 0.5);
          border: 1px solid rgba(240, 165, 0, 0.5);
          border-radius: 14px;
          padding: 1.5rem 1rem;
          text-align: center;
        }
        .fh__card-title {
          font-size: 13px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #f0a500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .fh__card-sub {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
          line-height: 1.5;
        }
        .fh__cta,
        .fh__cta:link,
        .fh__cta:visited,
        .fh__cta:hover,
        .fh__cta:active {
          display: inline-block;
          background: linear-gradient(135deg, #f0a500, #ffb820) !important;
          color: #ffffff !important;
          padding: 14px 34px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          text-decoration: none !important;
          border: none;
          animation: fh-pulse 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .fh__glow,
          .fh__eyebrow,
          .fh__cta {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
