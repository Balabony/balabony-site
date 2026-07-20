'use client'

/**
 * FAQ — блок «Питання та відповіді».
 * Стиль як HowItWorks: темно-синій фон, золоті pills, картки з рамкою.
 * 12 питань-відповідей з HANDOFF v45 у одну колонку.
 * Розміщується на /pricing і /free.
 */

const ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: 'Що я отримаю безкоштовно?',
    a: 'По дві серії з кожного сезону Балабонів — без реєстрації. Сім будь-яких історій на твій вибір. Сім днів повного доступу до всього, крім закритих серій.',
  },
  {
    q: 'Чи потрібна реєстрація?',
    a: 'Ні. По дві серії з кожного сезону і сім будь-яких інших історій працюють одразу. Тиждень повного доступу — після короткої реєстрації (тільки email, без картки).',
  },
  {
    q: 'Що таке Балабони?',
    a: (
      <>
        Це текстові кумедні історії українською про життя у вигаданому і незвичайному селі Балабони. Серіали з продовженням, в одному сезоні — двадцять серій.{' '}
        <em style={{ fontStyle: 'italic', opacity: 0.85 }}>
          Невдовзі усі серії будуть в аудіоформаті.
        </em>{' '}
        Усе для людей, які люблять живу українську мову.
      </>
    ),
  },
  {
    q: 'Скільки коштує підписка?',
    a: 'Для себе: 129 ₴/міс або 890 ₴/рік (вигідніше на 42%). Для родини: 199 ₴/міс або 1 390 ₴/рік на чотирьох. Пільговий тариф — 1 ₴/рік для УБД, ВПО та людей з інвалідністю (валідація через Дію).',
  },
  {
    q: 'А якщо ціна не підходить?',
    a: (
      <>
        Напиши редакції на{' '}
        <a
          href="mailto:nazar@balabony.com"
          className="faq__email"
          style={{
            color: 'var(--accent-gold)',
            textDecoration: 'underline',
            textDecorationStyle: 'dashed',
            textUnderlineOffset: 3,
          }}
        >
          nazar@balabony.com
        </a>{' '}
        власну ціну, яку ти готовий платити — ми розглянемо можливість додаткової знижки для тебе. Балабони мають бути доступні кожному.
      </>
    ),
  },
  {
    q: 'Що буде, коли закінчиться сім днів?',
    a: 'Нічого. Картка не була прив\u2019язана — ніхто нічого не спише. Захочеш далі — підпишешся. Не захочеш — лишиться доступ до двох серій будь-якого сезону і обраних семи історій назавжди.',
  },
  {
    q: 'Чи можна не платити одразу всю суму?',
    a: 'Так. Оплата частинами через ПриватБанк або Ощадбанк — три-шість місяців без комісії. Доступно для річних пакетів.',
  },
  {
    q: 'Що таке «закриті серії»?',
    a: 'Три ексклюзивні серії або історії письменників щомісяця, доступні тільки власникам річної підписки. Бонус за вибір довгого пакета — і для індивідуального, і для сімейного плану.',
  },
  {
    q: 'Як працює пільговий тариф?',
    a: 'Якщо ти УБД, ВПО або людина з інвалідністю — отримуєш повний доступ за одну гривню на рік. Підтвердження через сервіс Дія.',
  },
  {
    q: 'Можна подарувати підписку?',
    a: 'Так. Електронна вітальна картка приходить на пошту в день, який обереш. Доступно на 3, 6 або 12 місяців, включно з сімейним пакетом.',
  },
  {
    q: 'Як можна допомогти Балабонам?',
    a: 'Допоможи поширити наші історії або серії у соціальних мережах, розкажи про нас своїм друзям або надішли благодійний внесок.',
  },
  {
    q: 'Як стати вашим автором?',
    a: 'Зайди на сторінку «Стати автором», заповни форму. Якщо твоя історія сподобається редакції — опублікуємо. Гонорар нараховується за прочитання твоїх творів, згідно з умовами договору автора.',
  },
]

export default function FAQ() {
  return (
    <section
      id="faq"
      className="faq-shell"
      aria-labelledby="faq-title"
      style={{
        fontFamily: 'Montserrat, sans-serif',
        background: '#1a1f2e',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        margin: '0 auto 0.75rem',
        maxWidth: 920,
        scrollMarginTop: 80,
      }}
    >
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="faq__eyebrow">ПИТАННЯ ТА ВІДПОВІДІ</div>
        <h2
          id="faq-title"
          className="faq__title"
          style={{
            margin: '1.25rem 0 2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            color: '#fff',
          }}
        >
          Часті питання
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {ITEMS.map((item, i) => (
          <div key={i} className="faq__card">
            <div className="faq__q">{item.q}</div>
            <p className="faq__a">{item.a}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes faq-glow-a {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 0.9;
          }
        }
        @keyframes faq-glow-b {
          0%,
          100% {
            opacity: 0.9;
          }
          50% {
            opacity: 0.55;
          }
        }
        @keyframes faq-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .faq__glow {
          position: absolute;
          width: 50%;
          height: 70%;
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(240, 165, 0, 0.18) 0%,
            transparent 60%
          );
        }
        .faq__glow--tl {
          top: -15%;
          left: -5%;
          animation: faq-glow-a 6s ease-in-out infinite;
        }
        .faq__glow--br {
          bottom: -15%;
          right: -5%;
          animation: faq-glow-b 6s ease-in-out infinite;
        }
        .faq__eyebrow {
          display: inline-block;
          background: transparent;
          color: var(--accent-gold);
          padding: 8px 22px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          border: 1px solid var(--accent-gold);
          animation: faq-float 4s ease-in-out infinite;
          text-transform: uppercase;
        }
        .faq-shell {
          padding: 2rem 22px 1rem;
        }
        @media (max-width: 720px) {
          .faq-shell {
            padding: 2rem 14px 1rem;
          }
        }
        .faq__title {
          font-size: 30px;
        }
        .faq__card {
          background: rgba(26, 31, 46, 0.5);
          border: 1px solid rgba(240, 165, 0, 0.5);
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
        }
        .faq__q {
          color: var(--accent-gold);
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 8px;
          line-height: 1.35;
        }
        .faq__a {
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }
        @media (max-width: 560px) {
          .faq__title {
            font-size: 22px !important;
          }
          .faq__card {
            padding: 1rem 1.25rem;
          }
          .faq__q {
            font-size: 15px;
          }
          .faq__a {
            font-size: 13px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .faq__glow,
          .faq__eyebrow {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
