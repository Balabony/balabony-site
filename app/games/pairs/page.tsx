'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ───────────────────────── Кольори бренду ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DARK = '#B5710C'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'
const TEXT_SOFT = '#B5D4F4'
const GREEN = '#2E8B57'

/* ───────────────────────── Картинки (перевірені) ───────────────────────── */
type ShapeKey = 'sun' | 'cat' | 'fish' | 'house' | 'tree' | 'flower' | 'heart' | 'bird'
const ALL_SHAPES: ShapeKey[] = ['sun', 'cat', 'fish', 'house', 'tree', 'flower', 'heart', 'bird']

function Shape({ kind, size = 48 }: { kind: ShapeKey; size?: number }) {
  const c = { width: size, height: size, viewBox: '0 0 100 100' } as const
  const a = { 'aria-hidden': true } as const
  switch (kind) {
    case 'sun':
      return (<svg {...c} {...a}>
        {[...Array(8)].map((_, i) => { const g = (i * Math.PI) / 4
          return <line key={i} x1={50 + Math.cos(g) * 30} y1={50 + Math.sin(g) * 30} x2={50 + Math.cos(g) * 44} y2={50 + Math.sin(g) * 44} stroke={GOLD} strokeWidth="6" strokeLinecap="round" /> })}
        <circle cx="50" cy="50" r="24" fill={GOLD} /></svg>)
    case 'cat':
      return (<svg {...c} {...a}>
        <polygon points="26,28 34,8 46,24" fill="#E8913F" /><polygon points="74,28 66,8 54,24" fill="#E8913F" />
        <circle cx="50" cy="56" r="32" fill="#E8913F" /><circle cx="40" cy="52" r="4.5" fill={NAVY} /><circle cx="60" cy="52" r="4.5" fill={NAVY} />
        <polygon points="46,62 54,62 50,68" fill="#B05B22" /></svg>)
    case 'fish':
      return (<svg {...c} {...a}>
        <ellipse cx="46" cy="50" rx="32" ry="20" fill="#3FA0C4" /><polygon points="74,50 94,36 94,64" fill="#2C7FA0" /><circle cx="34" cy="44" r="4" fill={NAVY} /></svg>)
    case 'house':
      return (<svg {...c} {...a}>
        <rect x="26" y="48" width="48" height="40" fill="#E8C57A" /><polygon points="20,48 50,18 80,48" fill="#C0563E" />
        <rect x="44" y="62" width="14" height="26" fill="#7A4A2A" /><rect x="32" y="56" width="10" height="10" fill={CREAM} /></svg>)
    case 'tree':
      return (<svg {...c} {...a}>
        <rect x="44" y="56" width="12" height="34" fill="#8A5A2A" /><circle cx="50" cy="40" r="26" fill="#3FA66A" />
        <circle cx="34" cy="50" r="16" fill="#4DBE7A" /><circle cx="66" cy="50" r="16" fill="#4DBE7A" /></svg>)
    case 'flower':
      return (<svg {...c} {...a}>
        <line x1="50" y1="50" x2="50" y2="92" stroke="#3FA66A" strokeWidth="6" strokeLinecap="round" />
        {[...Array(6)].map((_, i) => { const g = (i * Math.PI) / 3
          return <circle key={i} cx={50 + Math.cos(g) * 20} cy={42 + Math.sin(g) * 20} r="13" fill="#E86A92" /> })}
        <circle cx="50" cy="42" r="11" fill={GOLD} /></svg>)
    case 'heart':
      return (<svg {...c} {...a}><path d="M50 84 C18 60 14 36 30 26 C42 18 50 30 50 30 C50 30 58 18 70 26 C86 36 82 60 50 84 Z" fill="#E0484D" /></svg>)
    case 'bird':
      return (<svg {...c} {...a}>
        <circle cx="50" cy="52" r="28" fill="#3FA0C4" /><circle cx="58" cy="44" r="4" fill={NAVY} />
        <polygon points="76,48 92,52 76,56" fill={GOLD} /><path d="M30 52 Q44 70 58 56" fill="#2C7FA0" /></svg>)
  }
}

/* ───────────────────────── Рівні ───────────────────────── */
const LEVELS = {
  easy:   { pairs: 6, cols: 3, label: 'Легкий',   sub: '6 пар' },
  hard:   { pairs: 8, cols: 4, label: 'Складний', sub: '8 пар' },
} as const
type Level = keyof typeof LEVELS

interface Card { id: number; shape: ShapeKey; flipped: boolean; matched: boolean }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

function buildDeck(pairs: number): Card[] {
  const chosen = shuffle(ALL_SHAPES).slice(0, pairs)
  const doubled = shuffle([...chosen, ...chosen])
  return doubled.map((shape, id) => ({ id, shape, flipped: false, matched: false }))
}

type Phase = 'intro' | 'playing' | 'won'

export default function PairsGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [level, setLevel] = useState<Level>('easy')
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])  // id відкритих незіставлених (0..2)
  const [moves, setMoves] = useState(0)
  const [matched, setMatched] = useState(0)
  const [best, setBest] = useState<number | null>(null)

  const lock = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const cfg = LEVELS[level]
  const bestKey = (lv: Level) => `balabony_pairs_best_${lv}`

  useEffect(() => {
    try { const v = window.localStorage.getItem(bestKey(level)); setBest(v ? Number(v) : null) } catch { setBest(null) }
  }, [level])

  const begin = (lv: Level) => {
    clearTimers()
    lock.current = false
    setLevel(lv)
    setCards(buildDeck(LEVELS[lv].pairs))
    setFlipped([])
    setMoves(0)
    setMatched(0)
    setPhase('playing')
  }

  const handleFlip = (id: number) => {
    if (lock.current) return
    setCards((prev) => {
      const card = prev.find((c) => c.id === id)
      if (!card || card.flipped || card.matched) return prev
      return prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    })
    setFlipped((prev) => (prev.includes(id) || prev.length >= 2 ? prev : [...prev, id]))
  }

  // Перевірка пари, коли відкрито дві картки
  useEffect(() => {
    if (flipped.length !== 2) return
    lock.current = true
    setMoves((m) => m + 1)
    const [a, b] = flipped
    const ca = cards.find((c) => c.id === a)
    const cb = cards.find((c) => c.id === b)
    if (ca && cb && ca.shape === cb.shape) {
      // збіг
      timers.current.push(setTimeout(() => {
        setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, matched: true } : c)))
        setFlipped([])
        setMatched((m) => m + 1)
        lock.current = false
      }, 450))
    } else {
      // не збіг — закрити назад
      timers.current.push(setTimeout(() => {
        setCards((prev) => prev.map((c) => (c.id === a || c.id === b ? { ...c, flipped: false } : c)))
        setFlipped([])
        lock.current = false
      }, 850))
    }
  }, [flipped, cards])

  // Перемога
  useEffect(() => {
    if (phase === 'playing' && cfg.pairs > 0 && matched === cfg.pairs) {
      timers.current.push(setTimeout(() => {
        setBest((prevBest) => {
          const nb = prevBest === null || moves < prevBest ? moves : prevBest
          try { window.localStorage.setItem(bestKey(level), String(nb)) } catch {}
          return nb
        })
        setPhase('won')
      }, 350))
    }
  }, [matched, cfg.pairs, phase, moves, level])

  const reset = () => { clearTimers(); lock.current = false; setPhase('intro'); setFlipped([]) }

  const playing = phase === 'playing'

  return (
    <main lang="uk" style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% calc(120px + env(safe-area-inset-bottom, 0px))', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>
          Знайди пару
        </h1>

        {/* Плашка й опис — лише до початку гри */}
        {phase === 'intro' && (<>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>Тренує зорову пам’ять і увагу</div>
            <div style={{ fontSize: 14, color: '#D5E5F5', lineHeight: 1.45, marginTop: 4 }}>За мета-аналізом 31 дослідження (журнал PLOS ONE, 2017) когнітивні тренування покращують пам’ять у людей похилого віку</div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 16px' }}>
          Картки лежать сорочкою догори. Відкривайте по дві й шукайте однакові
          картинки. Знайдена пара лишається відкритою. Без поспіху й без таймера.
        </p>
        <p style={{ color: TEXT_SOFT, fontSize: 16.5, lineHeight: 1.6, margin: '0 0 26px' }}><b style={{ color: GOLD }}>Що це тренує.</b><br />Зорову пам’ять і увагу: треба
          запам’ятати, де яка картинка, і втримати це в голові. Приємно грати разом
          із дітьми чи онуками. <b style={{ color: GOLD }}>Користь дає регулярність.</b>
        </p>

        </>)}

        {/* ───────── Ігрове поле ───────── */}
        <section style={{ background: CREAM, borderRadius: 24, border: `2px solid ${GOLD_LIGHT}`, padding: '24px 18px', color: NAVY, boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
          {playing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380, margin: '0 auto 20px' }}>
              <Stat label="Пари" value={`${matched} / ${cfg.pairs}`} color={GREEN} />
              <Stat label="Ходи" value={`${moves}`} color={NAVY} />
              {best !== null && <Stat label="Найкраще" value={`${best}`} color={GOLD_DARK} />}
            </div>
          )}

          {/* INTRO */}
          {phase === 'intro' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
                <Shape kind="sun" size={44} /><Shape kind="heart" size={44} /><Shape kind="flower" size={44} />
              </div>
              <p style={{ fontSize: 17, lineHeight: 1.55, margin: '0 0 16px', color: '#4A4234' }}>
                Відкривайте картки по дві й шукайте однакові. Менше ходів — кращий результат.
              </p>
              {best !== null && <p style={{ fontSize: 15, color: GOLD_DARK, fontWeight: 700, margin: '0 0 16px' }}>Ваш рекорд ({LEVELS[level].label.toLowerCase()}): {best} ходів</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                {(['easy', 'hard'] as Level[]).map((lv) => (
                  <button key={lv} onClick={() => begin(lv)} style={{ ...btnPrimary, width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 20px' }}>
                    <span style={{ fontSize: 18 }}>{LEVELS[lv].label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>{LEVELS[lv].sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ПОЛЕ КАРТОК */}
          {playing && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cfg.cols}, 1fr)`, gap: 10, maxWidth: cfg.cols === 3 ? 320 : 360, margin: '0 auto' }}>
              {cards.map((card) => {
                const open = card.flipped || card.matched
                return (
                  <button
                    key={card.id}
                    onClick={() => handleFlip(card.id)}
                    disabled={open || lock.current}
                    aria-label={open ? card.shape : 'закрита картка'}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 14,
                      border: card.matched ? `3px solid ${GREEN}` : `2px solid ${GOLD_LIGHT}`,
                      background: card.matched ? '#E9F6EE' : open ? '#fff' : `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_LIGHT} 100%)`,
                      cursor: open ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, boxSizing: 'border-box', transition: 'background 0.15s',
                    }}
                  >
                    {open
                      ? <Shape kind={card.shape} size={cfg.cols === 3 ? 50 : 40} />
                      : <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.55)' }} />}
                  </button>
                )
              })}
            </div>
          )}

          {/* WON */}
          {phase === 'won' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <Shape kind="heart" size={46} /><Shape kind="sun" size={46} />
              </div>
              <p style={{ fontSize: 24, fontWeight: 700, color: GOLD_DARK, fontFamily: "'Lora', serif", margin: '0 0 6px' }}>Усі пари знайдено!</p>
              <p style={{ fontSize: 17, color: '#4A4234', lineHeight: 1.5, margin: '0 0 6px' }}>
                Ви впоралися за {moves} {moves % 10 === 1 && moves % 100 !== 11 ? 'хід' : (moves % 10 >= 2 && moves % 10 <= 4 && (moves % 100 < 10 || moves % 100 >= 20)) ? 'ходи' : 'ходів'}.
              </p>
              {best !== null && <p style={{ fontSize: 14, color: GOLD_DARK, fontWeight: 700, margin: '0 0 18px' }}>Найкраще ({cfg.label.toLowerCase()}): {best} ходів</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <button onClick={() => begin(level)} style={btnPrimary}>Грати знову</button>
                <button onClick={reset} style={btnGhost}>Змінити складність</button>
              </div>
            </div>
          )}
        </section>

        {playing && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={reset} style={btnGhostDark}>Завершити сеанс</button>
          </div>
        )}

        {/* ───────── Докладніше ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чим це корисно?</summary>
          <div style={detailsBody}>
            <p><b>Що тренує.</b><br />Зорову пам’ять і увагу: гра вимагає запам’ятовувати розташування картинок і втримувати цю інформацію в голові, поки шукаєш пари.</p>
            <p><b>На чому ґрунтується.</b><br />Мета-аналіз 31 рандомізованого дослідження, опублікований у міжнародному рецензованому журналі PLOS ONE у 2017 році (Chiu та колеги), показав, що когнітивні тренування дають помірний ефект на загальну розумову діяльність і значущий — на пам’ять у здорових літніх людей. Найбільший ефект мали ті, хто займався щонайменше 3 рази на тиждень упродовж 8 тижнів і більше.</p>
            <p className="bb-cream-note"><b>Чесно про користь.</b><br />Гра покращує саме <i>зорову пам’ять та увагу</i> — це підтверджено дослідженнями. Сприймайте її як корисну й приємну вправу, а не як ліки; вона не замінює лікування чи консультацію лікаря.</p>
            <p><b>Як грати найкраще.</b><br />Спокійно, без поспіху, можна разом із рідними. Користь дає регулярність — короткі заняття кілька разів на тиждень дають більше, ніж рідкі довгі.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому віку — і дітям, і дорослим, і людям похилого віку, і під час відновлення. Чудово підходить для спільної гри в родині, по черзі.</p>
            <p><b>Скільки за раз.</b><br />5–10 хвилин, у своєму темпі. Одна гра — 6 або 8 пар на вибір.</p>
            <p><b>Як часто.</b><br />3–5 разів на тиждень короткими сеансами; кілька тижнів поспіль дають помітніший результат.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» (6 пар). Що частіше граєте, то легше запам’ятовувати розташування.</p>
            <p><b>Чи це лікує?</b> Ні. Це тренувальна вправа для підтримки пам’яті, а не ліки й не заміна консультації лікаря.</p>
          </div>
        </details>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби звертайтеся до лікаря.
        </p>

        {/* ───────── Нижня навігація ───────── */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22 }}>
          <a href="/games" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Усі ігри</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        .bb-details p { margin: 0 0 16px; }
        .bb-details p:last-child { margin-bottom: 0; }
        .bb-details b { color: ${GOLD}; }
        .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
        .bb-cream-note b { color: ${GOLD_DARK}; }
      `}</style>
    </main>
  )
}

/* ───────────────────────── Аналітика ───────────────────────── */
function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, overflow: 'hidden', background: '#fff', border: `1px solid ${GOLD_LIGHT}`, borderRadius: 12, padding: '8px 6px', textAlign: 'center' }}>
      <div style={{ fontSize: 'clamp(10px, 3vw, 13px)', fontWeight: 700, color: '#5C5240', textTransform: 'uppercase', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ fontSize: 'clamp(18px, 5.5vw, 24px)', fontWeight: 700, color, marginTop: 2, fontFamily: "'Lora', serif", whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

/* ───────────────────────── Стилі ───────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: GOLD, color: NAVY, border: `2px solid ${GOLD_LIGHT}`, borderRadius: 24,
  padding: '14px 34px', fontSize: 19, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#7A6A48', border: '2px solid rgba(122,106,72,0.35)', borderRadius: 24,
  padding: '11px 24px', fontSize: 16, fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnGhostDark: React.CSSProperties = {
  background: 'transparent', color: TEXT_SOFT, border: '1px solid rgba(181,212,244,0.4)', borderRadius: 22,
  padding: '9px 22px', fontSize: 14, fontWeight: 600, fontFamily: "'Montserrat', sans-serif", cursor: 'pointer',
}
const navArrow: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15,
  textDecoration: 'none', fontFamily: "'Montserrat', sans-serif",
}
const detailsBox: React.CSSProperties = {
  marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden',
}
const summaryStyle: React.CSSProperties = {
  cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: "'Montserrat', sans-serif",
}
const detailsBody: React.CSSProperties = {
  padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT,
}
