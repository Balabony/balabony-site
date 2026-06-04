'use client'

import { useState } from 'react'

type Lang = 'en' | 'uk'

const C = {
  en: {
    nav: 'Balabony',
    switch: 'УК',
    kicker: 'A Balabony accessibility engine',
    title: 'InclusiveVoice',
    subtitle: 'A voice-first path into reading and storytelling — for people for whom the keyboard is a barrier.',
    loopTitle: 'A complete voice loop',
    loop: [
      { icon: '🎙', h: 'Speak', p: 'Tell a story, a memory, or a folk tale aloud. No typing required.' },
      { icon: '✍', h: 'Transcribe & edit', p: 'Speech becomes text; an editor reviews and refines it.' },
      { icon: '🔊', h: 'Listen', p: 'Published as text and as audio — narrated in the consented voices of our own authors.' },
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
    switch: 'EN',
    kicker: 'Інструмент доступності Balabony',
    title: 'InclusiveVoice',
    subtitle: 'Голос як шлях до читання й історій — для тих, кому клавіатура є бар\u2019єром.',
    loopTitle: 'Повне голосове коло',
    loop: [
      { icon: '🎙', h: 'Говоріть', p: 'Розкажіть історію, спогад чи казку вголос. Друкувати не треба.' },
      { icon: '✍', h: 'Розшифровка й редагування', p: 'Мовлення стає текстом; редактор його вичитує й доопрацьовує.' },
      { icon: '🔊', h: 'Слухайте', p: 'Публікація як текст і як аудіо — озвучене голосами наших авторів за їхньою згодою.' },
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
        .iv-switch {
          background: transparent; color: var(--iv-ink);
          border: 1px solid rgba(244,241,234,0.25);
          border-radius: 999px; padding: 7px 16px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all .2s ease; font-family: inherit;
        }
        .iv-switch:hover { border-color: var(--iv-gold); color: var(--iv-gold); }

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
        .iv-step .ic { font-size: 30px; display: block; margin-bottom: 14px; }
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
        <button className="iv-switch" onClick={() => setLang(lang === 'en' ? 'uk' : 'en')}>
          {t.switch}
        </button>
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
                <span className="ic">{s.icon}</span>
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
          <a href="https://www.balabony.com">balabony.com</a>
          <span>·</span>
          <span>{t.cta} <a href={`mailto:${t.email}`}>{t.email}</a></span>
        </footer>
      </div>
    </main>
  )
}
