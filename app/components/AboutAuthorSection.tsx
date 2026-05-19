'use client'

import Link from 'next/link'
import Image from 'next/image'

/**
 * AboutAuthorSection — секція "Про автора" Назара Колодія
 *
 * Структура:
 *  - Канонічна обгортка секції (gold border 1.5px, dark-blue gradient, 2 радіальні плями)
 *  - Лівий блок: кругле фото 180x180 з золотою рамкою (або monogram НК як fallback)
 *  - Правий блок: ім'я, роль, біо (2 параграфи), цитата (опційно), CTA
 *
 * Адаптивність:
 *  - Desktop: horizontal grid 180px + 1fr
 *  - Mobile (<700px): vertical stack, фото зверху
 *
 * Контент-плейсхолдери (замінити коли буде від Назара):
 *  - SRC фото: /images/nazar-kolodiy.jpg
 *  - BIO_P1, BIO_P2: текст біо
 *  - QUOTE: цитата автора (опційно — якщо null, блок не рендериться)
 *  - CTA_HREF: куди веде "Усі історії Назара"
 */

// ===== CONTENT (легко редагувати тут) =====
const AUTHOR = {
  name: 'Назар Колодій',
  role: 'Автор Балабонів',
  // Фото лежить у public/images/nazar-kolodiy.jpg
  photo: '/images/nazar-kolodiy.jpg' as string | null,

  // Біо — 2 параграфи
  bio: [
    'Назар Колодій — український письменник зі Львова. Народився і виріс серед людей, які памʼятали вечорниці, дідусеві оповідки на печі та запах свіжого хліба з дровʼяної печі. Саме ці образи стали серцем світу Балабонів.',
    'Балабонів написав для тих, хто хоче, щоб онуки знали, як ми колись жили — і сміялися разом з нами. Дід Панас, баба Ганя, онук Максим — справжні в кожному жесті, бо складені з родинних історій, сусідських розмов і сільських непорозумінь з новими технологіями. Це світ, де 5G ловлять на вишні, а мудрість живе у простих речах.',
  ],

  // Цитата автора
  quote: 'Я пишу для тих, хто памʼятає, як пахне дощ на солом\'яному даху.' as string | null,

  // CTA — куди веде кнопка
  cta: {
    label: 'Усі історії Назара',
    href: '/stories',
  },
}

export default function AboutAuthorSection() {
  return (
    <section className="about-author-section" aria-labelledby="about-author-title">
      <div className="radial-top-right" aria-hidden="true" />
      <div className="radial-bottom-left" aria-hidden="true" />

      <div className="header">
        <p className="kicker">Балабони</p>
        <h2 id="about-author-title" className="title">Про автора</h2>
      </div>

      <div className="layout">
        {/* PHOTO */}
        <div className="photo-block">
          <div className="photo-wrapper">
            {AUTHOR.photo ? (
              <Image
                src={AUTHOR.photo}
                alt={`Фото: ${AUTHOR.name}`}
                width={180}
                height={180}
                className="photo"
                priority={false}
              />
            ) : (
              <div className="monogram" aria-label={`Монограма ${AUTHOR.name}`}>
                <span>НК</span>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <h3 className="name">{AUTHOR.name}</h3>
          <p className="role">{AUTHOR.role}</p>

          <div className="bio">
            {AUTHOR.bio.map((paragraph, idx) => (
              <p key={idx} className="bio-paragraph">{paragraph}</p>
            ))}
          </div>

          {AUTHOR.quote && (
            <blockquote className="quote">
              «{AUTHOR.quote}»
            </blockquote>
          )}

          <div className="cta-block">
            <Link href={AUTHOR.cta.href} className="cta">
              {AUTHOR.cta.label} →
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .about-author-section {
          position: relative;
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          border: 1.5px solid #EF9F27;
          border-radius: 18px;
          padding: 56px 16px;
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
          margin-bottom: 36px;
          position: relative;
        }

        .kicker {
          font-size: 14px;
          color: #EF9F27;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 600;
        }

        .title {
          font-size: 32px;
          color: #FFFFFF;
          margin: 0;
          font-weight: 700;
          line-height: 1.2;
        }

        .layout {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 32px;
          align-items: start;
          max-width: 900px;
          margin: 0 auto;
          position: relative;
        }

        .photo-block {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .photo-wrapper {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          overflow: hidden;
          border: 3px solid #EF9F27;
          box-shadow: 0 4px 16px rgba(239, 159, 39, 0.25);
          background: linear-gradient(180deg, #2C1A02 0%, #4A2F0A 100%);
        }

        .photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .monogram {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .monogram span {
          font-size: 68px;
          color: #FAC775;
          font-weight: 600;
          letter-spacing: 4px;
        }

        .content {
          color: #FFFFFF;
        }

        .name {
          font-size: 28px;
          color: #FFFFFF;
          margin: 0 0 4px;
          font-weight: 700;
          line-height: 1.2;
        }

        .role {
          font-size: 15px;
          color: #EF9F27;
          margin: 0 0 20px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
        }

        .bio {
          margin-bottom: 16px;
        }

        .bio-paragraph {
          font-size: 16px;
          color: #DCE5F0;
          line-height: 1.7;
          margin: 0 0 12px;
        }

        .bio-paragraph:last-child {
          margin-bottom: 0;
        }

        .quote {
          border-left: 3px solid #EF9F27;
          padding: 10px 16px;
          margin: 20px 0;
          background: rgba(239, 159, 39, 0.06);
          font-size: 16px;
          color: #FFF8EA;
          line-height: 1.6;
          font-style: italic;
        }

        .cta-block {
          margin-top: 24px;
        }

        .cta {
          display: inline-block;
          background: #EF9F27;
          color: #FFFFFF !important;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          text-decoration: none;
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .cta:hover {
          background: #BA7517;
          transform: translateY(-1px);
        }

        .cta:active {
          background: #854F0B;
          transform: translateY(0);
        }

        /* Mobile */
        @media (max-width: 700px) {
          .about-author-section {
            padding: 40px 14px;
          }

          .layout {
            grid-template-columns: 1fr;
            gap: 24px;
            text-align: center;
          }

          .name,
          .role {
            text-align: center;
          }

          .bio-paragraph {
            text-align: left;
          }

          .quote {
            text-align: left;
          }

          .title {
            font-size: 26px;
          }

          .name {
            font-size: 24px;
          }
        }
      `}</style>
    </section>
  )
}
