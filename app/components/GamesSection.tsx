'use client'

import { useTheme } from '../context/ThemeContext'

const GOLD = '#EF9F27'
const FONT = "'Montserrat', Arial, sans-serif"

interface Game {
  id: string
  title: string
  desc: string
  href: string
  available: boolean
  featured?: boolean
  isNew?: boolean
  Icon: () => React.ReactElement
}

function VoiceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  )
}
function QuizIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}
function MemoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}
function LinksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="2.5"/>
      <circle cx="18" cy="6" r="2.5"/>
      <circle cx="6" cy="18" r="2.5"/>
      <circle cx="18" cy="18" r="2.5"/>
      <line x1="8" y1="6" x2="16" y2="6"/>
      <line x1="6" y1="8" x2="6" y2="16"/>
      <line x1="18" y1="8" x2="18" y2="16"/>
      <line x1="8" y1="18" x2="16" y2="18"/>
    </svg>
  )
}
function TicTacIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round">
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="5" y1="5" x2="7" y2="7"/>
      <line x1="7" y1="5" x2="5" y2="7"/>
      <circle cx="12" cy="12" r="1.2"/>
    </svg>
  )
}
function ChessIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6c0-1 1-2 3-2s3 1 3 2"/>
      <path d="M9 6h6v3l-1 3h-4l-1-3z"/>
      <path d="M8 12h8l-1 5H9z"/>
      <rect x="7" y="17" width="10" height="3" rx="0.5"/>
    </svg>
  )
}
function CheckersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6">
      <circle cx="8" cy="14" r="3.5"/>
      <circle cx="14" cy="9" r="3.5"/>
      <circle cx="14" cy="9" r="1.5"/>
    </svg>
  )
}
function CardsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round">
      <rect x="4" y="3" width="11" height="15" rx="1.5" transform="rotate(-8 9.5 10.5)"/>
      <rect x="9" y="6" width="11" height="15" rx="1.5" transform="rotate(8 14.5 13.5)"/>
    </svg>
  )
}
function PokerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l3 5c2 1 3.5 2.5 3.5 5 0 2.2-1.8 4-4 4-1 0-1.8-.3-2.5-.8L12 18l-.5-1.8c-.7.5-1.5.8-2.5.8-2.2 0-4-1.8-4-4 0-2.5 1.5-4 3.5-5z"/>
      <path d="M11 16l1 4 1-4"/>
    </svg>
  )
}
function PuzzleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v4h-3a2 2 0 1 0 0 4h3v3h-3a2 2 0 1 1 0 4h3v3h-4v-3a2 2 0 1 0-4 0v3H7v-3a2 2 0 1 1 0-4H4v-3h3a2 2 0 1 0 0-4H4V7h3a2 2 0 1 0 0-4z"/>
    </svg>
  )
}
function LettersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="5" height="5" rx="1"/>
      <rect x="9.5" y="8" width="5" height="5" rx="1"/>
      <rect x="16" y="8" width="5" height="5" rx="1"/>
    </svg>
  )
}
function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l3-4 3 3 4-7 3 5 5-4"/>
      <line x1="3" y1="20" x2="21" y2="20"/>
    </svg>
  )
}
function SectionIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <line x1="6" y1="10" x2="6" y2="14"/>
      <line x1="8" y1="12" x2="4" y2="12"/>
      <circle cx="16" cy="12" r="1"/>
      <circle cx="19" cy="10" r="1"/>
    </svg>
  )
}

const GAMES: Game[] = [
  { id: 'voice',     title: 'Вгадай голос',    desc: 'Розпізнай оповідача за голосом', href: '#',                available: false, featured: true, isNew: true, Icon: VoiceIcon },
  { id: 'quiz',      title: 'Вікторина',       desc: 'Запитання про сюжети',           href: '#',                available: false, Icon: QuizIcon },
  { id: 'memory',    title: 'Знайди пару',     desc: 'Тренування пам\'яті',            href: '#',                available: false, Icon: MemoryIcon },
  { id: 'links',     title: 'Зв\'язки',        desc: 'Знайди спільне між словами',     href: '/longevity-club',  available: true,  Icon: LinksIcon },
  { id: 'tictac',    title: 'Хрестики-нулики', desc: 'Класична гра проти AI',          href: '#',                available: false, Icon: TicTacIcon },
  { id: 'chess',     title: 'Шахи',            desc: 'Грай з друзями онлайн',          href: '#',                available: false, Icon: ChessIcon },
  { id: 'checkers',  title: 'Шашки',           desc: 'Класична настільна гра',         href: '#',                available: false, Icon: CheckersIcon },
  { id: 'cards',     title: 'Карти «Дурень»',  desc: 'Народна гра в карти',            href: '#',                available: false, Icon: CardsIcon },
  { id: 'poker',     title: 'Покер',           desc: 'Класична версія',                href: '#',                available: false, Icon: PokerIcon },
  { id: 'puzzle',    title: 'Пазли',           desc: 'Збирай ілюстрації',              href: '#',                available: false, Icon: PuzzleIcon },
  { id: 'letters',   title: 'Склади слово',    desc: 'Складай слова',                  href: '#',                available: false, Icon: LettersIcon },
  { id: 'sound',     title: 'Звуки природи',   desc: 'Розпізнай за звуком',            href: '#',                available: false, Icon: SoundIcon },
]

export default function GamesSection() {
  const { colors } = useTheme()
  const availableCount = GAMES.filter(g => g.available).length
  const upcomingCount  = GAMES.length - availableCount

  return (
    <section id="games" style={{ background: 'linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%)', padding: '40px 20px', marginTop: 24, borderRadius: 16 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: `${GOLD}1A`, border: `1px solid ${GOLD}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SectionIcon />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: 'uppercase', fontFamily: FONT, lineHeight: 1 }}>Розваги</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#FFFFFF', fontFamily: FONT, lineHeight: 1.2 }}>Ігри Балабонів</div>
          </div>
        </div>

        {/* Grid */}
        <div className="games-grid">
          {GAMES.map(g => {
            const { Icon } = g
            const Tag = g.available ? 'a' : 'div'
            const props = g.available ? { href: g.href } : {}
            return (
              <Tag
                key={g.id}
                {...props}
                className={`game-card${g.featured ? ' is-featured' : ''}${!g.available ? ' is-soon' : ''}`}
              >
                {g.isNew && <span className="game-badge">NEW</span>}
                {!g.available && !g.isNew && <span className="game-badge game-badge-soon">СКОРО</span>}
                <div className="game-icon-wrap"><Icon /></div>
                <div className="game-title">{g.title}</div>
                <div className="game-desc">{g.desc}</div>
              </Tag>
            )
          })}
        </div>

        {/* Status footer */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#B5D4F4', fontFamily: FONT }}>
            <span className="status-dot" />
            {availableCount} {availableCount === 1 ? 'гра доступна' : 'гри доступні'} · {upcomingCount} у розробці
          </span>
        </div>

      </div>

      <style jsx>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,159,39,0.4), 0 8px 24px rgba(239,159,39,0.25); }
          50%      { box-shadow: 0 0 0 8px rgba(239,159,39,0), 0 12px 32px rgba(239,159,39,0.45); }
        }
        @keyframes statusBlink {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .games-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media (max-width: 900px) {
          .games-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .games-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .game-card {
          display: block;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(239,159,39,0.25);
          border-radius: 12px;
          padding: 14px 12px;
          min-height: 138px;
          position: relative;
          text-decoration: none;
          transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        }
        .game-card.is-soon { cursor: default; opacity: 0.85; }
        .game-card:hover {
          transform: translateY(-4px);
          border-color: ${GOLD};
          background: rgba(239,159,39,0.08);
        }
        .game-card.is-featured {
          background: linear-gradient(180deg, rgba(239,159,39,0.18), rgba(239,159,39,0.06));
          border: 1.5px solid ${GOLD};
          animation: pulseGlow 2.8s ease-in-out infinite;
        }
        .game-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: ${GOLD};
          color: #0E1A2B;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 8px;
          letter-spacing: 0.5px;
          font-family: ${FONT};
        }
        .game-badge-soon {
          background: rgba(255,255,255,0.1);
          color: #B5D4F4;
          border: 1px solid rgba(255,255,255,0.18);
        }
        .game-icon-wrap {
          width: 36px;
          height: 36px;
          background: rgba(239,159,39,0.1);
          border: 1px solid rgba(239,159,39,0.3);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }
        .game-card.is-featured .game-icon-wrap {
          background: rgba(239,159,39,0.2);
          border-color: ${GOLD};
        }
        .game-title {
          font-size: 15px;
          font-weight: 700;
          color: #FFFFFF;
          line-height: 1.25;
          margin-bottom: 4px;
          font-family: ${FONT};
        }
        .game-desc {
          font-size: 12px;
          color: #B5D4F4;
          line-height: 1.4;
          font-family: ${FONT};
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: statusBlink 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
