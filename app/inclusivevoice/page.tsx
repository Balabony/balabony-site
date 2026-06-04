'use client'

import { useState } from 'react'

type Lang = 'en' | 'uk'

const C = {
  en: {
    nav: 'Balabony',
    kicker: 'A Balabony accessibility engine',
    title: 'InclusiveVoice',
    subtitle: 'A voice-first path into reading and storytelling — for people for whom the keyboard is a barrier.',
    loopTitle: 'A complete voice loop',
    loop: [
      { icon: 'mic', h: 'Speak', p: 'Tell a story, a memory, or a folk tale aloud. No typing required.' },
      { icon: 'pen', h: 'Transcribe & edit', p: 'Speech becomes text; an editor reviews and refines it.' },
      { icon: 'sound', h: 'Listen', p: 'Published as text and as audio — narrated in the consented voices of our own authors.' },
    ],
    whoTitle: 'Built for those too often left out',
    who: 'Older adults (60+), veterans, internally displaced people, and people with disabilities — anyone for whom typing stands between them and authorship.',
    goalsTitle: 'Why it matters',
    goals: [
      { h: 'Inclusion', p: 'Free, barrier-free access, aligned with WCAG accessibility standards.' },
      { h: 'Sustainable storytelling', p: 'Lowering the effort needed to create new stories.' },
      { h: 'Voice-first audiences', p: 'Reaching people for whom voice, not text, is the natural way in.' },
    ],
    statusTitle: 'Where it stands today',
    status: 'The engine already works in Ukrainian, with accurate transcription. The underlying speech models also support Spanish, so the same tool extends naturally to Spanish-speaking communities.',
    basqueTitle: 'A note on Basque (Euskara)',
    basque: 'Today\u2019s leading speech engines do not yet support Basque — neither recognition nor synthesis. We see this not as a limitation, but as exactly where partnership matters most: a shared interest in giving a minority language the same voice-first accessibility that larger languages already enjoy.',
    cta: 'Live demo available on request —',
    email: 'nazar@balabony.com',
  },
  uk: {
    nav: 'Балабони',
    kicker: 'Інструмент доступності Balabony',
    title: 'InclusiveVoice',
    subtitle: 'Голос як шлях до читання й історій — для тих, кому клавіатура є бар\u2019єром.',
    loopTitle: 'Повне голосове коло',
    loop: [
      { icon: 'mic', h: 'Говоріть', p: 'Розкажіть історію, спогад чи казку вголос. Друкувати не треба.' },
      { icon: 'pen', h: 'Розшифровка й редагування', p: 'Мовлення стає текстом; редактор його вичитує й доопрацьовує.' },
      { icon: 'sound', h: 'Слухайте', p: 'Публікація як текст і як аудіо — озвучене голосами наших авторів за їхньою згодою.' },
    ],
    whoTitle: 'Для тих, кого надто часто лишають осторонь',
    who: 'Літні люди (60+), ветерани, внутрішньо переміщені особи та люди з інвалідністю — усі, для кого друк стоїть між ними й можливістю творити.',
    goalsTitle: 'Чому це важливо',
    goals: [
      { h: 'Інклюзія', p: 'Безкоштовний доступ без бар\u2019єрів, за стандартами доступності WCAG.' },
      { h: 'Сталий контент', p: 'Менше зусиль, щоб створювати нові історії.' },
      { h: 'Аудиторія голосу', p: 'Ті, для кого природний вхід — голос, а не текст.' },
    ],
    statusTitle: 'Де ми зараз',
    status: 'Рушій уже працює українською з точною розшифровкою. Мовні моделі також підтримують іспанську — тож той самий інструмент природно поширюється на іспаномовні спільноти.',
    basqueTitle: 'Про баскську (Euskara)',
    basque: 'Сьогоднішні провідні мовні рушії баскську ще не підтримують — ні розпізнавання, ні синтез. Ми бачимо в цьому не обмеження, а простір для співпраці: спільний інтерес дати мові меншини ту саму голосову доступність, яку вже мають великі мови.',
    cta: 'Живе демо — за запитом:',
    email: 'nazar@balabony.com',
  },
} as const

function Icon({ name, size = 30 }: { name: string; size?: number }) {
  const common = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.6,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
  if (name === 'mic') {
    return (
      <svg {...common}>
        <rect x="9" y="2" width="6" height="11" rx="3" />
        <path d="M5 10a7 7 0 0 0 14 0" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <line x1="8" y1="21" x2="16" y2="21" />
      </svg>
    )
  }
  if (name === 'pen') {
    return (
      <svg {...common}>
        <path d="M12 19l7-7a2.1 2.1 0 0 0-3-3l-7 7-1 4z" />
        <line x1="3" y1="21" x2="14" y2="21" />
      </svg>
    )
  }
  if (name === 'link') {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" />
      </svg>
    )
  }
  // sound
  return (
    <svg {...common}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8 8 0 0 1 0 12" />
    </svg>
  )
}

export default function InclusiveVoicePage() {
  const [lang, setLang] = useState<Lang>('en')
  const t = C[lang]

  return (
    <main className="iv-root">
      <style>{`
        .iv-root {
          --iv-dark: #0f172a;
          --iv-card: #0f1e3a;
          --iv-gold: #ef9f27;
          --iv-ink: #f4f1ea;
          --iv-muted: #9fb0c8;
          min-height: 100vh;
          background:
            radial-gradient(1200px 600px at 75% -10%, rgba(239,159,39,0.10), transparent 60%),
            linear-gradient(160deg, #0E1A2B 0%, #14253B 100%);
          color: var(--iv-ink);
          font-family: 'Montserrat', system-ui, sans-serif;
          padding: 0 0 80px;
        }
        .iv-wrap { max-width: 920px; margin: 0 auto; padding: 0 24px; }
        .iv-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 0; max-width: 920px; margin: 0 auto;
        }
        .iv-brand {
          font-family: 'Comfortaa', 'Montserrat', sans-serif;
          font-weight: 700; font-size: 20px; letter-spacing: .5px;
          color: var(--iv-ink);
        }
        .iv-brand b { color: var(--iv-gold); }
        .iv-langs {
          display: inline-flex; align-items: center; gap: 4px;
          border: 1px solid rgba(244,241,234,0.20);
          border-radius: 999px; padding: 5px 10px;
        }
        .iv-lang {
          background: transparent; border: none; cursor: pointer;
          font-family: inherit; font-size: 13px; font-weight: 700; letter-spacing: .5px;
          color: var(--iv-muted); padding: 3px 8px; border-radius: 999px;
          transition: color .2s ease;
        }
        .iv-lang:hover { color: var(--iv-ink); }
        .iv-lang.on { color: var(--iv-gold); }
        .iv-langsep { color: rgba(244,241,234,0.25); font-size: 13px; }

        .iv-hero { padding: 48px 0 24px; }
        .iv-kicker {
          color: var(--iv-gold); font-size: 13px; font-weight: 600;
          letter-spacing: 2.5px; text-transform: uppercase; margin: 0 0 14px;
        }
        .iv-title {
          font-family: 'Lora', Georgia, serif; font-weight: 600;
          font-size: clamp(40px, 8vw, 68px); line-height: 1.04; margin: 0 0 18px;
          letter-spacing: -1px;
        }
        .iv-sub {
          font-size: clamp(17px, 2.4vw, 21px); line-height: 1.55;
          color: var(--iv-muted); max-width: 640px; margin: 0;
        }

        .iv-section { margin-top: 56px; }
        .iv-h2 {
          font-family: 'Lora', Georgia, serif; font-weight: 600;
          font-size: 26px; margin: 0 0 22px; color: var(--iv-ink);
        }
        .iv-h2::after {
          content: ''; display: block; width: 46px; height: 3px;
          background: var(--iv-gold); border-radius: 2px; margin-top: 12px;
        }

        .iv-loop { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); }
        .iv-step {
          background: var(--iv-card); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px; padding: 24px; position: relative;
          transition: transform .2s ease, border-color .2s ease;
        }
        .iv-step:hover { transform: translateY(-4px); border-color: rgba(239,159,39,0.4); }
        .iv-step .ic { display: block; margin-bottom: 14px; color: var(--iv-gold); line-height: 0; }
        .iv-step h3 { font-size: 17px; margin: 0 0 8px; color: var(--iv-gold); }
        .iv-step p { margin: 0; font-size: 14.5px; line-height: 1.55; color: var(--iv-muted); }

        .iv-who {
          font-size: 18px; line-height: 1.65; color: var(--iv-ink);
          max-width: 720px; margin: 0;
        }

        .iv-goals { display: grid; gap: 16px; grid-template-columns: repeat(3, 1fr); }
        .iv-goal {
          border-left: 3px solid var(--iv-gold); padding: 6px 0 6px 18px;
        }
        .iv-goal h3 { font-size: 16px; margin: 0 0 7px; color: var(--iv-ink); }
        .iv-goal p { margin: 0; font-size: 14px; line-height: 1.55; color: var(--iv-muted); }

        .iv-status {
          font-size: 17px; line-height: 1.65; color: var(--iv-ink);
          max-width: 720px; margin: 0;
        }

        .iv-basque {
          margin-top: 56px;
          background: linear-gradient(135deg, rgba(239,159,39,0.10), rgba(239,159,39,0.02));
          border: 1px solid rgba(239,159,39,0.30);
          border-radius: 18px; padding: 30px 32px;
        }
        .iv-basque h3 {
          font-family: 'Lora', Georgia, serif; font-size: 20px;
          margin: 0 0 12px; color: var(--iv-gold);
        }
        .iv-basque p { margin: 0; font-size: 16px; line-height: 1.65; color: var(--iv-ink); }

        .iv-foot {
          margin-top: 64px; padding-top: 26px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-wrap: wrap; gap: 8px 18px; align-items: center;
          font-size: 14px; color: var(--iv-muted);
        }
        .iv-foot a { color: var(--iv-gold); text-decoration: none; }
        .iv-foot a:hover { text-decoration: underline; }
        .iv-foot-link {
          flex-basis: 100%; display: inline-flex; align-items: center; gap: 7px;
          margin-top: 6px; font-weight: 600;
        }
        .iv-foot-link svg { flex: none; }

        .iv-reveal { opacity: 0; transform: translateY(14px); animation: ivUp .6s ease forwards; }
        @keyframes ivUp { to { opacity: 1; transform: none; } }

        @media (max-width: 680px) {
          .iv-loop, .iv-goals { grid-template-columns: 1fr; }
        }
        @media (prefers-reduced-motion: reduce) {
          .iv-reveal { animation: none; opacity: 1; transform: none; }
          .iv-step:hover { transform: none; }
        }
      `}</style>

      <header className="iv-bar">
        <span className="iv-brand">Balabony · <b>InclusiveVoice</b></span>
        <div className="iv-langs" role="group" aria-label="Language">
          <button
            className={`iv-lang ${lang === 'uk' ? 'on' : ''}`}
            onClick={() => setLang('uk')}
            aria-pressed={lang === 'uk'}
          >УК</button>
          <span className="iv-langsep">|</span>
          <button
            className={`iv-lang ${lang === 'en' ? 'on' : ''}`}
            onClick={() => setLang('en')}
            aria-pressed={lang === 'en'}
          >EN</button>
        </div>
      </header>

      <div className="iv-wrap">
        <section className="iv-hero iv-reveal" style={{ animationDelay: '.05s' }}>
          <p className="iv-kicker">{t.kicker}</p>
          <h1 className="iv-title">{t.title}</h1>
          <p className="iv-sub">{t.subtitle}</p>
        </section>

        <section className="iv-section iv-reveal" style={{ animationDelay: '.15s' }}>
          <h2 className="iv-h2">{t.loopTitle}</h2>
          <div className="iv-loop">
            {t.loop.map((s, i) => (
              <div className="iv-step" key={i}>
                <span className="ic"><Icon name={s.icon} /></span>
                <h3>{s.h}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iv-section iv-reveal" style={{ animationDelay: '.25s' }}>
          <h2 className="iv-h2">{t.whoTitle}</h2>
          <p className="iv-who">{t.who}</p>
        </section>

        <section className="iv-section iv-reveal" style={{ animationDelay: '.3s' }}>
          <h2 className="iv-h2">{t.goalsTitle}</h2>
          <div className="iv-goals">
            {t.goals.map((g, i) => (
              <div className="iv-goal" key={i}>
                <h3>{g.h}</h3>
                <p>{g.p}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="iv-section iv-reveal" style={{ animationDelay: '.35s' }}>
          <h2 className="iv-h2">{t.statusTitle}</h2>
          <p className="iv-status">{t.status}</p>
        </section>

        <section className="iv-basque iv-reveal" style={{ animationDelay: '.4s' }}>
          <h3>{t.basqueTitle}</h3>
          <p>{t.basque}</p>
        </section>

        <footer className="iv-foot">
          <span>© {new Date().getFullYear()} Balabony</span>
          <span>·</span>
          <a href="https://balabony.com">balabony.com</a>
          <span>·</span>
          <span>{t.cta} <a href={`mailto:${t.email}`}>{t.email}</a></span>
          <a
            className="iv-foot-link"
            href="https://balabony.com/inclusivevoice"
            aria-label="InclusiveVoice — balabony.com/inclusivevoice"
          >
            <Icon name="link" size={16} />
            <span>balabony.com/inclusivevoice</span>
          </a>
        </footer>
      </div>
    </main>
  )
}
