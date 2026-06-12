'use client'

/**
 * StoryCardGold — картка історії у стилі «біле тло + золотий заголовок».
 *
 * Доступність:
 *  - тіло тексту використовує var(--text) і var(--base-font-size) →
 *    працює з eye-care режимом і регулюванням розміру шрифту з Header.
 *  - тло картки = var(--white) → у нічному/eye-care режимі стає темним,
 *    а не лишається білим (інакше золото-білий зламався б).
 *  - колір заголовка = var(--gold-heading) із запасним темним золотом #B5710C
 *    (проходить контраст на білому). За потреби перевизнач --gold-heading
 *    під нічну тему на світліше золото (#FAC775).
 *
 * Золото — ЛИШЕ для великого заголовка й тонких акцентів, не для тіла тексту.
 */

type StoryCardGoldProps = {
  kicker?: string            // надзаголовок (напр. «Історія дня»)
  title: string              // золотий заголовок
  children: React.ReactNode  // тіло історії
  note?: string              // кремовий блок-виділення (необов'язково)
  onRead?: () => void        // «Читати далі»
  onListen?: () => void      // «Слухати» (показується лише якщо передано)
}

export default function StoryCardGold({
  kicker,
  title,
  children,
  note,
  onRead,
  onListen,
}: StoryCardGoldProps) {
  return (
    <article
      style={{
        background: 'var(--white, #FFFFFF)',
        border: '0.5px solid rgba(14,26,43,0.12)',
        borderRadius: 12,
        padding: '32px 28px',
        maxWidth: 560,
        margin: '0 auto',
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontSize: 12,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: 'var(--gold-heading, #B5710C)',
            marginBottom: 10,
          }}
        >
          {kicker}
        </div>
      )}

      <h2
        style={{
          fontFamily: 'Lora, serif',
          fontSize: 'calc(var(--base-font-size, 16px) + 14px)',
          fontWeight: 600,
          lineHeight: 1.25,
          color: 'var(--gold-heading, #B5710C)',
          margin: '0 0 14px',
        }}
      >
        {title}
      </h2>

      <div
        style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 'var(--base-font-size, 16px)',
          lineHeight: 1.75,
          color: 'var(--text, #0E1A2B)',
        }}
      >
        {children}
      </div>

      {note && (
        <div
          style={{
            background: 'var(--cream, #FFF8EE)',
            borderLeft: '3px solid #EF9F27',
            padding: '12px 16px',
            margin: '18px 0 0',
          }}
        >
          <p
            style={{
              fontFamily: 'Montserrat, sans-serif',
              fontSize: 'calc(var(--base-font-size, 16px) - 1px)',
              lineHeight: 1.6,
              color: 'var(--text, #14253B)',
              margin: 0,
            }}
          >
            {note}
          </p>
        </div>
      )}

      {(onRead || onListen) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          {onRead && (
            <button
              onClick={onRead}
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15,
                background: '#0E1A2B',
                color: '#FFF8EE',
                border: 'none',
                borderRadius: 8,
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              Читати далі
            </button>
          )}
          {onListen && (
            <button
              onClick={onListen}
              style={{
                fontFamily: 'Montserrat, sans-serif',
                fontSize: 15,
                background: 'transparent',
                color: 'var(--gold-heading, #B5710C)',
                border: '1.5px solid var(--gold-heading, #B5710C)',
                borderRadius: 8,
                padding: '10px 18px',
                cursor: 'pointer',
              }}
            >
              Слухати
            </button>
          )}
        </div>
      )}
    </article>
  )
}
