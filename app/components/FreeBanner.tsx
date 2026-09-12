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
        // Було 1200 — під один короткий рядок це давало порожню стрічку
        // на пів екрана, і банер читався як смуга, а не як акцент.
        maxWidth: 560,
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
          // Біла плашка (рішення Богдана 12.09.2026). Золотий текст на білому
          // дає контраст близько 2:1 і не читається — те саме вже виявилося в
          // читалці, де на світлому аркуші золото довелося міняти на темніше.
          // Тому золото тут працює на рамці, іконці й підкладці слова
          // «БЕЗКОШТОВНО», а сам текст — темно-синій.
          background: '#ffffff',
          // Рамки навмисно немає: така сама золота рамка стоїть на картках
          // вище й на конкурсах нижче, і банер зливався з ними. Акцент
          // тримає ліва смуга — той самий прийом, що в блоках на сторінці
          // твору, тож сайт лишається одноманітним.
          borderLeft: '6px solid #ef9f27',
          borderRadius: '0 14px 14px 0',
          padding: '14px 18px',
          textDecoration: 'none',
          color: '#0f1e3a',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
            fontSize: 13.5,
            lineHeight: 1.5,
            position: 'relative',
            zIndex: 1,
          }}
        >
          <span style={{ display: 'block', color: '#0f1e3a', fontSize: 15, fontWeight: 700 }}>
            Понад 900 історій і 24 серії
          </span>
          {/* Темніший відтінок золота, ніж скрізь на сайті. Фірмовий #ef9f27
              на білому дає контраст близько 2:1 — те саме вже виявилося в
              читалці, де на світлому аркуші довелося взяти #8a5200. */}
          <span style={{ display: 'block', color: '#8a5200', fontSize: 14, fontWeight: 800, marginTop: 4 }}>
            БЕЗКОШТОВНО. БЕЗ РЕЄСТРАЦІЇ.
          </span>
        </span>

        {/* Темно-синя, а не золота: на білому тлі золота кнопка читалася гірше
            за текст, і золото сперечалося саме з собою — смуга, іконка й кнопка
            одного кольору. Тепер золото в одному місці. */}
        <span
          className="free-banner__cta"
          style={{ background: '#0f1e3a', color: '#ffffff' }}
        >
          Читати&nbsp;→
        </span>
      </a>

    </section>
  )
}
