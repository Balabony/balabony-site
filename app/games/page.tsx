import React from 'react'

export const metadata = {
  title: 'Ігри для мозку — Balabony',
  description: 'Безкоштовні вправи для пам’яті, уваги та мислення. Для будь-якого віку.',
}

/* ───────────────────────── Кольори бренду ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const CARD = '#193049'
const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const GOLD_BRIGHT = '#FFD78A'
const TEXT_SOFT = '#CFE3FA'
const TEXT_DESC = '#E3EFFB'

/* ───────────────────────── Символи ───────────────────────── */
function Icon({ kind }: { kind: string }) {
  const p = { width: 40, height: 40, viewBox: '0 0 48 48', 'aria-hidden': true } as const
  switch (kind) {
    case 'flash':
      return (<svg {...p}><circle cx="24" cy="24" r="9" fill="none" stroke={GOLD_LIGHT} strokeWidth="3.2" /><circle cx="24" cy="24" r="3.2" fill={GOLD_LIGHT} /><g stroke={GOLD_BRIGHT} strokeWidth="3.2" strokeLinecap="round"><line x1="24" y1="3" x2="24" y2="11" /><line x1="24" y1="37" x2="24" y2="45" /><line x1="3" y1="24" x2="11" y2="24" /><line x1="37" y1="24" x2="45" y2="24" /></g></svg>)
    case 'attention':
      return (<svg {...p}><circle cx="24" cy="24" r="18" fill="none" stroke={GOLD_LIGHT} strokeWidth="3.2" /><circle cx="24" cy="24" r="9" fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.6" /><circle cx="24" cy="24" r="3.6" fill={GOLD_LIGHT} /><circle cx="41" cy="8" r="4.5" fill={GOLD_BRIGHT} /></svg>)
    case 'order':
      return (<svg {...p}><g fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8"><rect x="7" y="7" width="11" height="11" rx="2" /><rect x="30" y="7" width="11" height="11" rx="2" /><rect x="7" y="30" width="11" height="11" rx="2" /><rect x="30" y="30" width="11" height="11" rx="2" /></g><path d="M12 12 L36 12 L36 36 L12 36" fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.8" strokeLinecap="round" strokeDasharray="1 5.5" /></svg>)
    case 'colors':
      return (<svg {...p}><circle cx="19" cy="18" r="11.5" fill="#E8434B" /><circle cx="30" cy="20" r="11.5" fill="#3D7FDC" opacity="0.92" /><circle cx="24" cy="30" r="11.5" fill="#36AB62" opacity="0.92" /></svg>)
    case 'pairs':
      return (<svg {...p}><rect x="6" y="11" width="16" height="21" rx="3" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" /><rect x="26" y="17" width="16" height="21" rx="3" fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.8" /><path d="M10 21 l3 3 l5 -6" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M30 27 l3 3 l5 -6" fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)
    case 'checkers':
      return (<svg {...p}><circle cx="17" cy="29" r="11" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" /><circle cx="30" cy="19" r="11" fill={GOLD_LIGHT} stroke={GOLD} strokeWidth="1.5" /><path d="M24 20 l2.5 2 l3.5 -4 l3.5 4 l2.5 -2 v4 h-12 z" fill="#14253B" /></svg>)
    case 'chess': return (<svg {...p}><g fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round"><path d="M24 6 v6 M21 9 h6"/><path d="M24 14 c-5 0 -8 4 -8 8 l2 12 h12 l2 -12 c0 -4 -3 -8 -8 -8 z"/><path d="M14 38 h20 v4 h-20 z"/></g></svg>)
    case 'maze':
      return (<svg {...p}><rect x="7" y="7" width="34" height="34" rx="4" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" /><g fill="none" stroke={GOLD_BRIGHT} strokeWidth="2.6" strokeLinecap="round"><path d="M7 18 h12 M19 7 v12 M19 30 h10 M29 18 v18 M29 24 h8" /></g><circle cx="13" cy="13" r="2.6" fill={GOLD_LIGHT} /></svg>)
    case 'digits':
      return (<svg {...p}><g fill="none" stroke={GOLD_LIGHT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 24 a16 16 0 1 0 5 -11.6 L8 17" /><polyline points="8,7 8,17 18,17" /></g></svg>)
    case 'fluency':
      return (<svg {...p}><path d="M9 10 h30 a4 4 0 0 1 4 4 v16 a4 4 0 0 1 -4 4 h-17 l-9 8 v-8 h-4 a4 4 0 0 1 -4 -4 v-16 a4 4 0 0 1 4 -4 z" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" strokeLinejoin="round" /><circle cx="17" cy="22" r="2.4" fill={GOLD_BRIGHT} /><circle cx="24" cy="22" r="2.4" fill={GOLD_BRIGHT} /><circle cx="31" cy="22" r="2.4" fill={GOLD_BRIGHT} /></svg>)
    case 'rhythm':
      return (<svg {...p}><g fill="none" stroke={GOLD_LIGHT} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 24 H9 M13 20 l-4 4 l4 4" /><path d="M31 24 H39 M35 20 l4 4 l-4 4" /></g><circle cx="24" cy="24" r="6" fill={GOLD_BRIGHT} /></svg>)
    case 'domino':
      return (<svg {...p}><rect x="11" y="6" width="26" height="36" rx="5" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.8" /><line x1="11" y1="24" x2="37" y2="24" stroke={GOLD_LIGHT} strokeWidth="2.4" /><g fill={GOLD_BRIGHT}><circle cx="19" cy="14" r="2.5" /><circle cx="29" cy="14" r="2.5" /><circle cx="24" cy="33" r="2.7" /></g></svg>)
    case 'sudoku':
      return (<svg {...p}><rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke={GOLD_LIGHT} strokeWidth="2.6" /><g stroke={GOLD_LIGHT} strokeWidth="1.4" opacity="0.6"><line x1="18.7" y1="8" x2="18.7" y2="40" /><line x1="29.3" y1="8" x2="29.3" y2="40" /><line x1="8" y1="18.7" x2="40" y2="18.7" /><line x1="8" y1="29.3" x2="40" y2="29.3" /></g><g fill={GOLD_BRIGHT} fontFamily="Georgia, serif"><text x="11" y="17" fontSize="9" fontWeight="700">5</text><text x="32.5" y="27.5" fontSize="9" fontWeight="700">3</text><text x="21.5" y="38" fontSize="9" fontWeight="700">7</text></g></svg>)
    case 'narde':
      return (<svg {...p}><path d="M9 9 H22 L15.5 27 Z" fill={GOLD_LIGHT} /><path d="M39 39 H26 L32.5 21 Z" fill={GOLD} opacity="0.55" /><circle cx="32" cy="13" r="5.5" fill={GOLD_BRIGHT} stroke={GOLD_LIGHT} strokeWidth="1.5" /></svg>)
    default:
      return null
  }
}

interface Game { href: string; kind: string; title: string; desc: string }

const EVIDENCE: Game[] = [
  { href: '/games/flash', kind: 'flash', title: 'Що промайнуло?', desc: 'Тренує швидкість сприйняття. Єдиний тип вправ, доказово пов’язаний із нижчим ризиком деменції.' },
  { href: '/games/attention', kind: 'attention', title: 'Подвійна увага', desc: 'Вчить утримувати увагу на двох речах одразу — найближча до вправи з відомого дослідження про деменцію.' },
]
const USEFUL: Game[] = [
  { href: '/games/maze', kind: 'maze', title: 'Лабіринт', desc: 'Тренує просторове мислення й уявну «карту» місцевості. Орієнтація в просторі першою слабшає з віком.' },
  { href: '/games/memory-order', kind: 'order', title: 'Запам’ятай порядок', desc: 'Тренує робочу пам’ять. Кілька коротких занять на тиждень дають помітний результат.' },
  { href: '/games/digits', kind: 'digits', title: 'Цифри навпаки', desc: 'Запамʼятайте ряд цифр і введіть його у зворотному порядку — класичний тест Векслера на робочу памʼять.' },
  { href: '/games/fluency', kind: 'fluency', title: 'Назви якнайбільше', desc: 'Називайте вголос якнайбільше слів на тему чи літеру за хвилину. Словесна побіжність — чутливий показник стану мозку.' },
  { href: '/games/rhythm', kind: 'rhythm', title: 'Ритм і вибір', desc: 'Тримайте ритм і тисніть у бік, протилежний до стрілки (на «стоп» — стримайтесь). Подвійна задача тренує увагу й самоконтроль.' },
  { href: '/games/colors', kind: 'colors', title: 'Який колір?', desc: 'Тренує самоконтроль і увагу: назви колір літер, а не читай слово. Спокійна вправа на зосередженість.' },
  { href: '/games/pairs', kind: 'pairs', title: 'Знайди пару', desc: 'Тренує зорову пам’ять. Приємно грати разом із дітьми чи онуками.' },
  { href: '/games/chess', kind: 'chess', title: 'Шахи', desc: 'Класичні шахи — проти машини (три рівні) або вдвох. Тренують планування й передбачення ходів.' },
  { href: '/games/checkers', kind: 'checkers', title: 'Шашки', desc: 'Класичні шашки — проти комп’ютера (три рівні) або вдвох. Тренують планування й передбачення ходів.' },
  { href: '/games/domino', kind: 'domino', title: 'Доміно', desc: 'Класичне «центрове» доміно проти комп’ютера — три рівні. Підрахунок очок і планування ходів; приємна гра для будь-якого віку.' },
  { href: '/games/sudoku', kind: 'sudoku', title: 'Судоку', desc: 'Класична логічна головоломка з цифрами — три рівні, у кожної єдиний розвʼязок. Мова не потрібна. Тренує логіку й зосередженість.' },
  { href: '/games/narde', kind: 'narde', title: 'Довгі нарди', desc: 'Класичні довгі нарди проти комп’ютера — три рівні. Проведіть 15 шашок додому й винесіть першими. Підрахунок ходів і планування.' },
]

function GameCard({ game, evidence }: { game: Game; evidence: boolean }) {
  return (
    <a href={game.href} className="bb-game-card" style={{
      display: 'flex', alignItems: 'stretch', textDecoration: 'none',
      background: CARD,
      border: evidence ? `2px solid rgba(239,159,39,0.65)` : `1.5px solid rgba(250,199,117,0.3)`,
      borderRadius: 18, marginBottom: 14, overflow: 'hidden',
      boxShadow: evidence ? '0 0 26px rgba(239,159,39,0.22)' : '0 0 18px rgba(239,159,39,0.12)',
    }}>
      <span aria-hidden="true" style={{ flexShrink: 0, width: 5, background: evidence ? GOLD : 'rgba(239,159,39,0.45)' }} />
      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0, padding: 16 }}>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontFamily: "'Lora', serif", fontSize: 21, fontWeight: 700, color: GOLD_LIGHT, lineHeight: 1.2 }}>{game.title}</span>
          <span style={{ display: 'block', fontSize: 15, lineHeight: 1.5, color: TEXT_DESC, marginTop: 4 }}>{game.desc}</span>
        </span>
        <span aria-hidden="true" style={{ flexShrink: 0, color: GOLD_LIGHT, fontSize: 24, lineHeight: 1.2 }}>→</span>
      </span>
    </a>
  )
}

export default function GamesPage() {
  return (
    <main lang="uk" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% calc(88px + env(safe-area-inset-bottom, 0px))', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>← Головна</a>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: 36, fontWeight: 600, color: GOLD_LIGHT, lineHeight: 1.12, margin: '0 0 10px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>
          Ігри для мозку
        </h1>
        <p style={{ fontSize: 16.5, lineHeight: 1.6, color: TEXT_SOFT, margin: '0 0 26px' }}>
          Безкоштовні вправи для пам’яті, уваги та мислення. Для будь-якого віку —
          грайте у своєму темпі, без поспіху й таймера.
        </p>

        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD_LIGHT, margin: '0 0 12px 2px', textShadow: '0 0 12px rgba(239,159,39,0.4)' }}>
          Науково підтверджені
        </div>
        {EVIDENCE.map((g) => <GameCard key={g.href} game={g} evidence />)}

        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: GOLD_LIGHT, margin: '20px 0 12px 2px', textShadow: '0 0 12px rgba(239,159,39,0.4)' }}>
          Корисні вправи
        </div>
        {USEFUL.map((g) => <GameCard key={g.href} game={g} evidence={false} />)}

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби звертайтеся до лікаря.
        </p>
      </div>

      <style>{`
        .bb-game-card { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; }
        .bb-game-card:hover { transform: translateY(-2px); border-color: rgba(250,199,117,0.85) !important; box-shadow: 0 0 30px rgba(239,159,39,0.32) !important; }
        .bb-game-card:active { transform: translateY(0); }
      `}</style>
    </main>
  )
}
