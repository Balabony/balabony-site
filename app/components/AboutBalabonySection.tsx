'use client'

import Link from 'next/link'

/**
 * AboutBalabonySection — секція "Наша місія" Balabony
 *
 * Структура:
 *  - Канонічна обгортка секції (gold border 1.5px, dark-blue gradient, 2 радіальні плями)
 *  - Kicker "Наша місія" + опис
 *  - Рядок "Наші історії роблять три речі одночасно"
 *  - 3 картки: Об'єднують / Навчають / Лікують
 *  - Виділений блок: "сильна культура тримає людей удома" + аудіо тизер
 *  - 4 картки бенефіціарів (Діти ВПО / УБД / З інвалідністю / Звільнені) з SVG іконками
 *  - 1 CTA "Підтримати місію" → /support
 *  - Footer з лого ІГС (коло з "ЛОГО") + "Інститут громадянського суспільства"
 *
 * Адаптивність:
 *  - Desktop: 3 колонки функції, 4 колонки бенефіціари
 *  - Mobile (<700px): все вертикально
 */

// ===== CONTENT (легко редагувати тут) =====
const MISSION = {
  kicker: 'Наша місія',
  intro: 'Balabony — це український літературний простір для всіх, хто любить рідну мову і живі історії.',
  threeThingsLine: 'Наші історії роблять три речі одночасно:',

  functions: [
    {
      title: 'Обʼєднують',
      text: 'Допомагаємо російськомовним інтегруватися в українську культуру без тиску та повчань. Прагнемо обʼєднати усіх українців навколо спільної мови, памʼяті та сміху.',
    },
    {
      title: 'Навчають',
      text: 'Жива мова, реальні діалекти, гумор і теплі діалоги — це навчання української природним шляхом, як ми всі колись чули вдома від бабусь і дідусів.',
    },
    {
      title: 'Лікують',
      text: 'Для тих, хто пережив війну, переселення чи довгу самотність — мʼякий і безпечний спосіб зняти стрес і повернутися до себе через сміх, тепло знайомих слів і світлу памʼять про дім.',
    },
  ],

  highlight: 'Ми віримо, що **сильна культура тримає людей удома** — і працюємо для того, щоб українці залишалися в Україні й будували її майбутнє. Сьогодні ми пропонуємо читати, а скоро — слухати: озвучка історій у роботі.',

  beneficiariesKicker: 'Особлива увага',
  beneficiariesLine: 'Ми працюємо для всіх, але особливо думаємо про тих, кому найскладніше:',

  beneficiaries: [
    {
      title: 'Діти ВПО',
      subtitle: 'Залишили дім через війну',
      iconType: 'children' as const,
    },
    {
      title: 'УБД',
      subtitle: 'Захисники і родини',
      iconType: 'shield' as const,
    },
    {
      title: 'З інвалідністю',
      subtitle: 'Доступ через текст',
      iconType: 'accessibility' as const,
    },
    {
      title: 'Звільнені',
      subtitle: 'Деокуповані громади',
      iconType: 'homes' as const,
    },
  ],

  cta: {
    label: 'Підтримати місію',
    href: '/support',
  },

  partner: {
    logoLabel: 'ЛОГО',
    name: 'Інститут громадянського суспільства',
  },
}

// ===== SVG ICONS (бенефіціари) =====
function BeneficiaryIcon({ type }: { type: 'children' | 'shield' | 'accessibility' | 'homes' }) {
  const stroke = '#FFD888'
  switch (type) {
    case 'children':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="11" r="5" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M8 30c0-5 5-9 10-9s10 4 10 9" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="11" cy="9" r="2" fill="none" stroke={stroke} strokeWidth="1.5" />
        </svg>
      )
    case 'shield':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <path
            d="M18 4l-10 4v8c0 7 4.5 12 10 14 5.5-2 10-7 10-14V8l-10-4z"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M14 17l3 3 6-6"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'accessibility':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <circle cx="18" cy="8" r="3" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="14" cy="22" r="7" fill="none" stroke={stroke} strokeWidth="2" />
          <path
            d="M14 22l4-4M18 12v4M14 18h4"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 14h5l1 4"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'homes':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <path
            d="M5 28V14l13-9 13 9v14"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M13 28v-9h10v9" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M2 28h32" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
  }
}

// ===== HIGHLIGHT TEXT PARSER (підтримує **жирний** як золотий) =====
function renderHighlight(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} style={{ color: '#FFD888', fontWeight: 600 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function AboutBalabonySection() {
  return (
    <section
      className="about-balabony-section"
      aria-labelledby="about-balabony-kicker"
    >
      <div className="radial-top-right" aria-hidden="true" />
      <div className="radial-bottom-left" aria-hidden="true" />

      {/* KICKER */}
      <div className="header">
        <p id="about-balabony-kicker" className="kicker">{MISSION.kicker}</p>
      </div>

      {/* INTRO */}
      <p className="intro">{MISSION.intro}</p>
      <p className="three-things">{MISSION.threeThingsLine}</p>

      {/* 3 FUNCTIONS */}
      <div className="functions-grid">
        {MISSION.functions.map((fn, i) => (
          <div key={i} className="function-card">
            <p className="function-title">{fn.title}</p>
            <p className="function-text">{fn.text}</p>
          </div>
        ))}
      </div>

      {/* HIGHLIGHT BLOCK */}
      <div className="highlight-block">
        <p className="highlight-text">{renderHighlight(MISSION.highlight)}</p>
      </div>

      {/* BENEFICIARIES */}
      <p className="beneficiaries-kicker">{MISSION.beneficiariesKicker}</p>
      <p className="beneficiaries-line">{MISSION.beneficiariesLine}</p>

      <div className="beneficiaries-grid">
        {MISSION.beneficiaries.map((b, i) => (
          <div key={i} className="beneficiary-card">
            <div className="beneficiary-icon">
              <BeneficiaryIcon type={b.iconType} />
            </div>
            <p className="beneficiary-title">{b.title}</p>
            <p className="beneficiary-subtitle">{b.subtitle}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="cta-block">
        <Link
          href={MISSION.cta.href}
          className="cta"
          style={{
            display: 'inline-block',
            background: '#EF9F27',
            color: '#FFFFFF',
            padding: '14px 28px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.15s ease',
          }}
        >
          {MISSION.cta.label} →
        </Link>
      </div>

      {/* PARTNER LOGO + NAME */}
      <div className="partner-block">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
          <circle cx="28" cy="28" r="26" fill="none" stroke="#EF9F27" strokeWidth="2" />
          <circle
            cx="28"
            cy="28"
            r="20"
            fill="none"
            stroke="#EF9F27"
            strokeWidth="1"
            opacity="0.6"
          />
          <text
            x="28"
            y="34"
            textAnchor="middle"
            fill="#EF9F27"
            style={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'serif',
              letterSpacing: '2px',
            }}
          >
            {MISSION.partner.logoLabel}
          </text>
        </svg>
        <p className="partner-name">{MISSION.partner.name}</p>
      </div>

      <style jsx>{`
        .about-balabony-section {
          position: relative;
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid #EF9F27;
          border-radius: 18px;
          padding: 56px 28px;
          margin: 0 0 56px;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .radial-top-right {
          position: absolute;
          top: -120px;
          right: -120px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(239, 159, 39, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .radial-bottom-left {
          position: absolute;
          bottom: -120px;
          left: -120px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(239, 159, 39, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .header {
          text-align: center;
          margin-bottom: 24px;
          position: relative;
        }

        .kicker {
          font-size: 18px;
          color: #EF9F27;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 600;
        }

        .intro {
          font-size: 18px;
          color: #DCE5F0;
          line-height: 1.6;
          margin: 0 auto 20px;
          max-width: 720px;
          text-align: center;
          position: relative;
        }

        .three-things {
          font-size: 17px;
          color: #FFD888;
          line-height: 1.5;
          margin: 0 auto 32px;
          max-width: 720px;
          text-align: center;
          position: relative;
          font-weight: 600;
        }

        .functions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 32px;
          position: relative;
        }

        .function-card {
          background: rgba(239, 159, 39, 0.06);
          border: 1px solid rgba(239, 159, 39, 0.3);
          border-radius: 12px;
          padding: 22px 18px;
        }

        .function-title {
          font-size: 15px;
          color: #EF9F27;
          margin: 0 0 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-align: center;
        }

        .function-text {
          font-size: 14px;
          color: #DCE5F0;
          line-height: 1.65;
          margin: 0;
        }

        .highlight-block {
          background: rgba(239, 159, 39, 0.08);
          border-left: 4px solid #EF9F27;
          padding: 18px 22px;
          margin: 0 0 32px;
          position: relative;
        }

        .highlight-text {
          font-size: 15px;
          color: #FFF8EA;
          line-height: 1.65;
          margin: 0;
        }

        .beneficiaries-kicker {
          font-size: 13px;
          color: #EF9F27;
          margin: 0 0 10px;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
          position: relative;
        }

        .beneficiaries-line {
          font-size: 14.5px;
          color: #B5D4F4;
          text-align: center;
          margin: 0 0 20px;
          line-height: 1.55;
          position: relative;
        }

        .beneficiaries-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
          position: relative;
        }

        .beneficiary-card {
          text-align: center;
          padding: 18px 12px;
          border: 1px solid rgba(239, 159, 39, 0.3);
          border-radius: 12px;
          background: rgba(14, 26, 43, 0.5);
        }

        .beneficiary-icon {
          margin-bottom: 10px;
          display: flex;
          justify-content: center;
        }

        .beneficiary-title {
          font-size: 14px;
          color: #FFFFFF;
          margin: 0 0 4px;
          font-weight: 600;
        }

        .beneficiary-subtitle {
          font-size: 12px;
          color: #B5D4F4;
          margin: 0;
          line-height: 1.4;
        }

        .cta-block {
          text-align: center;
          margin-bottom: 28px;
          position: relative;
        }

        .partner-block {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid rgba(239, 159, 39, 0.2);
          position: relative;
        }

        .partner-name {
          font-size: 16px;
          color: #FFF8EA;
          margin: 0;
          font-weight: 600;
        }

        /* MOBILE */
        @media (max-width: 700px) {
          .about-balabony-section {
            padding: 40px 16px;
          }

          .intro {
            font-size: 16px;
          }

          .three-things {
            font-size: 15px;
          }

          .functions-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .beneficiaries-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .highlight-text {
            font-size: 14px;
          }

          .partner-block {
            flex-direction: column;
            gap: 12px;
            text-align: center;
          }

          .partner-name {
            font-size: 15px;
            text-align: center;
          }
        }
      `}</style>
    </section>
  )
}
