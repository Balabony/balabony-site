'use client'

/**
 * HowItWorks — блок на головній між Hero і блоком серій.
 * Якір id="how-it-works" — на нього скролить FreeBanner.
 * Три кроки в картках у стилі «Свіжих історій» з підсвітками що рухаються.
 */
export default function HowItWorks() {
  // Переписано 12.09.2026. Було: «по дві серії з сезону», «сім історій на
  // вибір» і «сім днів повного доступу». Перші дві цифри застаріли, третьої
  // не існувало ніколи — механіки пробного тижня в коді немає, і обіцянка
  // висіла порожньою.
  //
  // Цифри перевірені по коду: 6 сезонів «Балабонів» × (3 вітрини + 1 на
  // вибір) = 24. У «Тиші» FREE_EPISODES = 2 і вибору немає навмисно (18+),
  // тому вона названа окремо, а не додана до 24.
  //
  // Розрив рядка жорсткий, щоб три картки лишалися однакової висоти на
  // будь-якій ширині.
  const steps = [
    { num: '1. ЧИТАЙ',      text: 'Понад 900 історій\nбез реєстрації' },
    { num: '2. СПРОБУЙ',    text: '24 серії «Балабонів»\nі 2 серії «Тиші»' },
    { num: '3. ПІДПИШИСЬ',  text: 'Далі за передплатою\nпільга — 1 ₴ на рік' },
  ]

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        background: '#1a1f2e',
        borderRadius: 16,
        padding: '2rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        margin: '1rem auto 1.5rem',
        maxWidth: 1200,
        scrollMarginTop: 80,
      }}
    >
      {/* Дві радіальні підсвітки що рухаються одна назустріч одній */}
      <span className="hiw__glow hiw__glow--l" aria-hidden="true" />
      <span className="hiw__glow hiw__glow--r" aria-hidden="true" />

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="hiw__eyebrow">ЯК ЦЕ ПРАЦЮЄ</div>
        <h2
          id="how-it-works-title"
          className="hiw__title"
          style={{
            margin: '1.25rem 0 2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: '#fff',
          }}
        >
          Три кроки знайомства
        </h2>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {steps.map((s, i) => (
          <div key={s.num} className="hiw__step" style={{ animationDelay: `${i * 0.6}s` }}>
            <div className="hiw__num">{s.num}</div>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
                lineHeight: 1.6,
                // Перенос рядка в тексті кроку заданий вручну — щоб три
                // картки лишалися однакової висоти незалежно від ширини.
                whiteSpace: 'pre-line',
              }}
            >
              {s.text}
            </p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes hiw-glow-l {
          0%,
          100% {
            opacity: 0.55;
            transform: translateX(0);
          }
          50% {
            opacity: 1;
            transform: translateX(20px);
          }
        }
        @keyframes hiw-glow-r {
          0%,
          100% {
            opacity: 1;
            transform: translateX(0);
          }
          50% {
            opacity: 0.55;
            transform: translateX(-20px);
          }
        }
        @keyframes hiw-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        @keyframes hiw-step-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .hiw__glow {
          position: absolute;
          width: 45%;
          height: 90%;
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(240, 165, 0, 0.24) 0%,
            transparent 60%
          );
        }
        .hiw__glow--l {
          top: -30%;
          left: 10%;
          animation: hiw-glow-l 6s ease-in-out infinite;
        }
        .hiw__glow--r {
          bottom: -30%;
          right: 10%;
          animation: hiw-glow-r 6s ease-in-out infinite;
        }
        .hiw__eyebrow {
          display: inline-block;
          background: transparent;
          color: var(--accent-gold);
          padding: 8px 22px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: 1px solid var(--accent-gold);
          animation: hiw-float 4s ease-in-out infinite;
          text-transform: uppercase;
        }
        .hiw__step {
          background: rgba(26, 31, 46, 0.5);
          border: 1px solid rgba(240, 165, 0, 0.5);
          border-radius: 14px;
          padding: 1.75rem 1.25rem;
          text-align: center;
          animation: hiw-step-float 5s ease-in-out infinite;
        }
        .hiw__title { font-size: 30px; }
        @media (max-width: 560px) { .hiw__title { font-size: 22px !important; } }
        .hiw__num {
          display: inline-block;
          background: linear-gradient(135deg, var(--accent-gold), #ffb820);
          color: #1a1f2e;
          padding: 6px 18px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 16px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @media (prefers-reduced-motion: reduce) {
          .hiw__glow,
          .hiw__eyebrow,
          .hiw__step {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
