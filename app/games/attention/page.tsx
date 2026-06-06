'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ───────────────────────── Кольори ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DARK = '#B5710C'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'
const TEXT_SOFT = '#B5D4F4'
const GREEN = '#2E8B57'
const RED_SOFT = '#E0484D'

/* ───────────────────────── Центральні картинки (16) ───────────────────────── */
type ShapeKey =
  | 'sun' | 'cat' | 'dog' | 'fish' | 'house' | 'tree' | 'flower' | 'heart'
  | 'bird' | 'apple' | 'butterfly' | 'mushroom' | 'balloon' | 'car' | 'duck' | 'ladybug'

const SHAPE_NAMES: Record<ShapeKey, string> = {
  sun: 'Сонечко', cat: 'Котик', dog: 'Песик', fish: 'Рибка', house: 'Будиночок',
  tree: 'Дерево', flower: 'Квітка', heart: 'Сердечко', bird: 'Пташка', apple: 'Яблучко',
  butterfly: 'Метелик', mushroom: 'Грибок', balloon: 'Кулька', car: 'Машинка',
  duck: 'Каченя', ladybug: 'Жучок',
}
const ALL_SHAPES = Object.keys(SHAPE_NAMES) as ShapeKey[]

function Shape({ kind, size = 120 }: { kind: ShapeKey; size?: number }) {
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
    case 'dog':
      return (<svg {...c} {...a}>
        <ellipse cx="28" cy="44" rx="9" ry="18" fill="#A9743E" /><ellipse cx="72" cy="44" rx="9" ry="18" fill="#A9743E" />
        <circle cx="50" cy="56" r="28" fill="#C68B4E" /><circle cx="40" cy="52" r="4.5" fill={NAVY} /><circle cx="60" cy="52" r="4.5" fill={NAVY} />
        <ellipse cx="50" cy="64" rx="6" ry="4.5" fill={NAVY} /></svg>)
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
    case 'apple':
      return (<svg {...c} {...a}>
        <path d="M50 32 C40 22 22 28 24 48 C26 70 42 84 50 84 C58 84 74 70 76 48 C78 28 60 22 50 32 Z" fill="#D8424A" />
        <rect x="48" y="20" width="4" height="14" rx="2" fill="#7A4A2A" /><path d="M52 26 Q66 18 66 30 Q56 32 52 26 Z" fill="#3FA66A" /></svg>)
    case 'butterfly':
      return (<svg {...c} {...a}>
        <ellipse cx="32" cy="38" rx="18" ry="16" fill="#E8913F" /><ellipse cx="68" cy="38" rx="18" ry="16" fill="#E8913F" />
        <ellipse cx="34" cy="64" rx="14" ry="12" fill="#3FA0C4" /><ellipse cx="66" cy="64" rx="14" ry="12" fill="#3FA0C4" />
        <rect x="47" y="30" width="6" height="44" rx="3" fill={NAVY} /></svg>)
    case 'mushroom':
      return (<svg {...c} {...a}>
        <rect x="42" y="52" width="16" height="34" rx="6" fill="#F0E2C8" /><path d="M18 54 A32 32 0 0 1 82 54 Z" fill="#C0563E" />
        <circle cx="38" cy="42" r="4" fill={CREAM} /><circle cx="58" cy="38" r="5" fill={CREAM} /><circle cx="66" cy="48" r="3.5" fill={CREAM} /></svg>)
    case 'balloon':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="40" rx="26" ry="30" fill="#E86A92" /><polygon points="46,68 54,68 50,76" fill="#C0506F" /><path d="M50 76 Q56 86 48 92" stroke="#7A6A48" strokeWidth="2" fill="none" /></svg>)
    case 'car':
      return (<svg {...c} {...a}>
        <path d="M16 60 L24 44 H64 L80 60 Z" fill="#D8424A" /><rect x="16" y="58" width="64" height="14" rx="4" fill="#B5363D" />
        <circle cx="32" cy="74" r="8" fill={NAVY} /><circle cx="66" cy="74" r="8" fill={NAVY} /><rect x="34" y="48" width="22" height="10" rx="2" fill="#9FC6E8" /></svg>)
    case 'duck':
      return (<svg {...c} {...a}>
        <circle cx="60" cy="38" r="15" fill={GOLD} /><ellipse cx="48" cy="62" rx="28" ry="20" fill={GOLD} />
        <circle cx="63" cy="34" r="3" fill={NAVY} /><polygon points="74,38 90,42 74,46" fill="#E8913F" /></svg>)
    case 'ladybug':
      return (<svg {...c} {...a}>
        <ellipse cx="50" cy="56" rx="26" ry="24" fill="#D8424A" /><circle cx="50" cy="34" r="11" fill={NAVY} /><line x1="50" y1="34" x2="50" y2="80" stroke={NAVY} strokeWidth="3" />
        <circle cx="40" cy="52" r="4" fill={NAVY} /><circle cx="60" cy="52" r="4" fill={NAVY} /><circle cx="42" cy="68" r="4" fill={NAVY} /><circle cx="58" cy="68" r="4" fill={NAVY} /></svg>)
  }
}

/* периферійна ціль — зірочка */
function PeriStar({ size = 34, dim = false }: { size?: number; dim?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ opacity: dim ? 0.78 : 1 }}>
      <polygon points="50,8 61,38 93,38 67,58 77,90 50,70 23,90 33,58 7,38 39,38" fill={GOLD} stroke={GOLD_DARK} strokeWidth="3" />
    </svg>
  )
}

/* ───────────────────────── Напрямки ───────────────────────── */
type DirKey = 'NW' | 'N' | 'NE' | 'W' | 'E' | 'SW' | 'S' | 'SE'
interface Dir { dx: number; dy: number; arrow: string; cell: number; name: string }
const DIRS: Record<DirKey, Dir> = {
  NW: { dx: -0.7, dy: -0.7, arrow: '↖', cell: 0, name: 'ліворуч-угору' },
  N:  { dx: 0,    dy: -1,   arrow: '↑', cell: 1, name: 'угору' },
  NE: { dx: 0.7,  dy: -0.7, arrow: '↗', cell: 2, name: 'праворуч-угору' },
  W:  { dx: -1,   dy: 0,    arrow: '←', cell: 3, name: 'ліворуч' },
  E:  { dx: 1,    dy: 0,    arrow: '→', cell: 5, name: 'праворуч' },
  SW: { dx: -0.7, dy: 0.7,  arrow: '↙', cell: 6, name: 'ліворуч-униз' },
  S:  { dx: 0,    dy: 1,    arrow: '↓', cell: 7, name: 'униз' },
  SE: { dx: 0.7,  dy: 0.7,  arrow: '↘', cell: 8, name: 'праворуч-униз' },
}
const DIRS_4: DirKey[] = ['N', 'E', 'S', 'W']
const DIRS_8: DirKey[] = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE']
const CELL_TO_DIR: Record<number, DirKey> = {}
;(Object.keys(DIRS) as DirKey[]).forEach((k) => { CELL_TO_DIR[DIRS[k].cell] = k })

/* ───────────────────────── Рівні ───────────────────────── */
type Level = 'easy' | 'medium' | 'hard'
interface LevelCfg { dirs: DirKey[]; startMs: number; radius: number; label: string; sub: string }
const LEVELS: Record<Level, LevelCfg> = {
  easy:   { dirs: DIRS_4, startMs: 1000, radius: 36, label: 'Легкий',   sub: '4 напрямки, повільніше' },
  medium: { dirs: DIRS_4, startMs: 800,  radius: 42, label: 'Середній', sub: '4 напрямки, швидше' },
  hard:   { dirs: DIRS_8, startMs: 800,  radius: 45, label: 'Складний', sub: '8 напрямків' },
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const PRAISE = ['Чудово!', 'Влучно!', 'Так і є!', 'Чітко!', 'Браво!']
type Phase = 'intro' | 'countdown' | 'flash' | 'gap' | 'answerCenter' | 'answerDir' | 'feedback'

const MIN_MS = 160
const MAX_MS = 1200
const LS_KEY = 'balabony_attention_best'

/* ───────────────────────── Компонент ───────────────────────── */
export default function AttentionGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [isDemo, setIsDemo] = useState(false)
  const [level, setLevel] = useState<Level>('easy')
  const [flashMs, setFlashMs] = useState(LEVELS.easy.startMs)
  const [target, setTarget] = useState<ShapeKey>('sun')
  const [options, setOptions] = useState<ShapeKey[]>([])
  const [dir, setDir] = useState<DirKey>('N')
  const [count, setCount] = useState(3)
  const [centerPick, setCenterPick] = useState<ShapeKey | null>(null)
  const [dirPick, setDirPick] = useState<DirKey | null>(null)
  const [streak, setStreak] = useState(0)
  const [right, setRight] = useState(0)
  const [total, setTotal] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [praise, setPraise] = useState('')

  const lastTarget = useRef<ShapeKey | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    try { const v = window.localStorage.getItem(LS_KEY); if (v) setBest(Number(v)) } catch {}
  }, [])

  // Прокрутити вгору при старті гри (щоб ігрове поле було зверху, без порожнечі)
  const prevPhaseRef = useRef(phase)
  useEffect(() => {
    if (prevPhaseRef.current === 'intro' && phase !== 'intro') {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
    }
    prevPhaseRef.current = phase
  }, [phase])
  const cfg = LEVELS[level]

  const startRound = useCallback((demo: boolean, lvl: Level) => {
    clearTimers()
    const c = LEVELS[lvl]
    // центр (не повторювати минулий)
    const pool = ALL_SHAPES.filter((s) => s !== lastTarget.current)
    const t = pool[Math.floor(Math.random() * pool.length)]
    lastTarget.current = t
    const others = shuffle(ALL_SHAPES.filter((s) => s !== t)).slice(0, 3)
    setTarget(t)
    setOptions(shuffle([t, ...others]))
    // напрямок
    setDir(c.dirs[Math.floor(Math.random() * c.dirs.length)])
    setCenterPick(null)
    setDirPick(null)
    setIsDemo(demo)
    setCount(3)
    setPhase('countdown')
  }, [])

  const begin = (lvl: Level, demo: boolean) => {
    setLevel(lvl)
    if (!demo) setFlashMs(LEVELS[lvl].startMs)
    startRound(demo, lvl)
  }

  useEffect(() => {
    if (phase !== 'countdown') return
    clearTimers()
    let cc = 3; setCount(3)
    const tick = () => {
      cc -= 1
      if (cc > 0) { setCount(cc); timers.current.push(setTimeout(tick, 750)) }
      else setPhase('flash')
    }
    timers.current.push(setTimeout(tick, 750))
  }, [phase])

  useEffect(() => {
    if (phase !== 'flash') return
    clearTimers()
    const dur = isDemo ? 1600 : flashMs
    timers.current.push(setTimeout(() => setPhase('gap'), dur))
  }, [phase, isDemo, flashMs])

  useEffect(() => {
    if (phase !== 'gap') return
    clearTimers()
    timers.current.push(setTimeout(() => setPhase('answerCenter'), 280))
  }, [phase])

  const pickCenter = (k: ShapeKey) => {
    setCenterPick(k)
    setPhase('answerDir')
  }

  const pickDir = (d: DirKey) => {
    setDirPick(d)
    const bothOk = centerPick === target && d === dir
    setPraise(bothOk ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '')
    setPhase('feedback')
    if (isDemo) return
    setTotal((n) => n + 1)
    if (bothOk) {
      setRight((n) => n + 1)
      const ns = streak + 1
      setStreak(ns)
      if (best === null || flashMs < best) {
        setBest(flashMs)
        try { window.localStorage.setItem(LS_KEY, String(flashMs)) } catch {}
      }
      if (ns % 2 === 0) setFlashMs((ms) => Math.max(MIN_MS, ms - 70))
    } else {
      setStreak(0)
      setFlashMs((ms) => Math.min(MAX_MS, ms + 120))
    }
  }

  const next = () => {
    if (isDemo) { setIsDemo(false); setPhase('intro') }
    else startRound(false, level)
  }

  const reset = () => {
    clearTimers()
    lastTarget.current = null
    setPhase('intro'); setIsDemo(false); setStreak(0); setRight(0); setTotal(0)
    setCenterPick(null); setDirPick(null)
  }

  const playing = phase !== 'intro'
  const sec = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} c`
  const centerOk = centerPick === target
  const dirOk = dirPick === dir
  const bothOk = centerOk && dirOk

  return (
    <main lang="uk" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% calc(88px + env(safe-area-inset-bottom, 0px))', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {phase === 'intro' && (<>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>
          Подвійна увага
        </h1>

        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>В основі — наукова вправа з дослідження у США, пов’язана з нижчим ризиком деменції</div>
            <div style={{ fontSize: 14, color: '#D5E5F5', lineHeight: 1.45, marginTop: 4 }}>Це «гра на розділену увагу» з дослідження ACTIVE (Національні інститути здоров’я США, NIH): треба бачити центр і водночас помічати, що майнуло скраю.</div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 16px' }}>
          У центрі промайне картинка, а скраю — зірочка. Треба впізнати картинку
          <b style={{ color: '#fff' }}> і</b> помітити, з якого боку з’явилася зірочка. Спокійно, у своєму темпі.
        </p>
        <p style={{ color: TEXT_SOFT, fontSize: 16.5, lineHeight: 1.6, margin: '0 0 26px' }}><b style={{ color: GOLD }}>Чому саме так.</b><br />Дивитися в центр і водночас помічати
          щось скраю — це і є «розділена увага». Саме її тренування у дослідженні
          виявилося найкориснішим. Користь дає <b style={{ color: GOLD }}>регулярність</b>, а не один раз.
        </p>

        </>)}

        {/* ───────── Ігрове поле ───────── */}
        <section style={{ background: CREAM, borderRadius: 24, border: `2px solid ${GOLD_LIGHT}`, padding: '28px 22px', color: NAVY, boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
          {playing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380, margin: '0 auto 22px' }}>
              <Stat label="Правильних" value={total > 0 ? `${right} / ${total}` : '0'} color={GREEN} />
              <Stat label="Показ" value={sec(flashMs)} color={NAVY} />
              {best !== null && <Stat label="Найкращий" value={sec(best)} color={GOLD_DARK} />}
            </div>
          )}

          <div style={{ minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {/* INTRO — вибір складності */}
            {phase === 'intro' && (
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '0 auto 18px', maxWidth: 360, textAlign: 'left' }}>
                  <div style={{ flexShrink: 0 }}><Shape kind="butterfly" size={56} /></div>
                  <p style={{ fontSize: 16, lineHeight: 1.5, margin: 0, color: '#4A4234' }}>
                    Оберіть складність — її завжди можна змінити. Час на відповідь необмежений.
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  {(['easy', 'medium', 'hard'] as Level[]).map((lv) => (
                    <button key={lv} onClick={() => begin(lv, false)} style={{ ...btnPrimary, width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 20px' }}>
                      <span style={{ fontSize: 18 }}>{LEVELS[lv].label}</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>{LEVELS[lv].sub}</span>
                    </button>
                  ))}
                  <button onClick={() => begin('easy', true)} style={{ ...btnGhost, marginTop: 4 }}>Спершу пробний раунд</button>
                </div>
              </div>
            )}

            {/* COUNTDOWN */}
            {phase === 'countdown' && (
              <div>
                <p style={{ fontSize: 17, color: '#6A5F48', margin: '0 0 14px' }}>{isDemo ? 'Пробний раунд. Дивіться в центр…' : 'Дивіться в центр…'}</p>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 72, fontWeight: 700, color: GOLD_DARK, lineHeight: 1 }}>{count}</div>
                <div aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY, margin: '18px auto 0' }} />
              </div>
            )}

            {/* FLASH — центр + периферія */}
            {phase === 'flash' && (
              <div className="bb-flash-in" style={{ position: 'relative', width: '100%', maxWidth: 360, height: 230, margin: '0 auto' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}>
                  <Shape kind={target} size={120} />
                </div>
                <div style={{ position: 'absolute', left: `${50 + DIRS[dir].dx * cfg.radius}%`, top: `${50 + DIRS[dir].dy * cfg.radius}%`, transform: 'translate(-50%,-50%)' }}>
                  <PeriStar size={34} dim={level === 'hard'} />
                </div>
              </div>
            )}

            {/* GAP */}
            {phase === 'gap' && <div aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY }} />}

            {/* ANSWER CENTER */}
            {phase === 'answerCenter' && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: GOLD_DARK, fontFamily: "'Lora', serif" }}>Що було в центрі?</p>
                <p style={{ fontSize: 14, color: '#7A6A48', margin: '0 0 16px' }}>Крок 1 із 2</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
                  {options.map((opt) => (
                    <button key={opt} onClick={() => pickCenter(opt)} className="bb-opt"
                      style={{ background: '#fff', border: `2px solid ${GOLD_LIGHT}`, borderRadius: 16, padding: '14px 10px', fontSize: 'clamp(13px,3.6vw,16px)', fontWeight: 600, fontFamily: "'Montserrat', sans-serif", color: NAVY, cursor: 'pointer', minHeight: 62, minWidth: 0, lineHeight: 1.25, boxSizing: 'border-box' }}>
                      {SHAPE_NAMES[opt]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ANSWER DIR */}
            {phase === 'answerDir' && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px', color: GOLD_DARK, fontFamily: "'Lora', serif" }}>Де майнула зірочка?</p>
                <p style={{ fontSize: 14, color: '#7A6A48', margin: '0 0 16px' }}>Крок 2 із 2 — оберіть напрямок</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 260, margin: '0 auto' }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => {
                    if (cell === 4) return <div key={cell} aria-hidden="true" style={{ width: 12, height: 12, borderRadius: '50%', background: '#D8C9A8', margin: 'auto' }} />
                    const dk = CELL_TO_DIR[cell]
                    const active = cfg.dirs.includes(dk)
                    if (!active) return <div key={cell} aria-hidden="true" />
                    return (
                      <button key={cell} onClick={() => pickDir(dk)} aria-label={DIRS[dk].name}
                        style={{ background: '#fff', border: `2px solid ${GOLD_LIGHT}`, borderRadius: 14, padding: 0, height: 60, fontSize: 28, fontWeight: 700, color: GOLD_DARK, cursor: 'pointer', boxSizing: 'border-box' }}>
                        {DIRS[dk].arrow}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* FEEDBACK */}
            {phase === 'feedback' && (
              <div aria-live="polite" style={{ width: '100%' }}>
                {bothOk ? (
                  <p style={{ fontSize: 21, fontWeight: 700, color: GREEN, margin: '0 0 12px' }}>{praise}</p>
                ) : (
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#4A4234', margin: '0 0 12px' }}>Майже! Ось як було:</p>
                )}
                <div style={{ fontSize: 16, lineHeight: 1.7, color: NAVY, margin: '0 0 18px' }}>
                  <div>Центр: <b style={{ color: centerOk ? GREEN : RED_SOFT }}>{SHAPE_NAMES[target].toLowerCase()}</b>{!centerOk && centerPick && <span style={{ color: '#9A8C6E' }}> (ви обрали {SHAPE_NAMES[centerPick].toLowerCase()})</span>}</div>
                  <div>Зірочка: <b style={{ color: dirOk ? GREEN : RED_SOFT }}>{DIRS[dir].name}</b> {DIRS[dir].arrow}</div>
                </div>
                <button onClick={next} style={btnNext}>{isDemo ? 'Почати гру →' : 'Далі →'}</button>
              </div>
            )}
          </div>
        </section>

        {playing && phase !== 'feedback' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={reset} style={btnGhostDark}>Завершити сеанс</button>
          </div>
        )}

        {/* ───────── Докладніше ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за вправа.</b><br />«Подвійна увага» тренує розділену увагу й швидкість сприйняття: треба впізнати об’єкт у центрі й одночасно помітити, де з’явився об’єкт скраю. Саме така «гра на розділену увагу» (на основі тесту Useful Field of View, розробленого ще у 1990-х) використовувалася в дослідженні ACTIVE.</p>
            <p><b>На чому ґрунтується.</b><br />ACTIVE — найбільше у США дослідження різних видів когнітивного тренування. Воно стартувало у 1998–1999 роках, охопило 2 802 особи віком від 65 років; учасників випадково розподілили на групи: тренування пам’яті, мислення, швидкості з розділеною увагою або контрольну групу. Кожна група мала до 10 занять по 60–75 хвилин протягом 5–6 тижнів, частина — повторні («бустерні») сесії. Результати опубліковано у лютому 2026 року в журналі «Alzheimer’s &amp; Dementia: Translational Research &amp; Clinical Interventions».</p>
            <p><b>Що саме виявили.</b><br />Через 20 років у групи, яка тренувала швидкість із розділеною увагою й мала повторні сесії, виявили на чверть (на 25%) менше діагнозів деменції, ніж у контрольній — це був єдиний тип тренування з таким тривалим ефектом. На 10-му році ця ж група мала на 29% нижчу захворюваність. Раніші результати показували також менше труднощів у повсякденних справах і менше дорожніх пригод.</p>
            <p><b>Чому це працює.</b><br />Дослідники вважають, що вправа була особливо дієвою, бо вона адаптивна (підлаштовується під рівень людини), показує інформацію дуже коротко й тренує автоматичну навичку, а не завчені факти. Тому й тут показ коротшає поступово, під ваш темп.</p>
            <p><b>Що кажуть учені.</b><br />Один із керівників дослідження, професор Майкл Марсіске (Університет Флориди), наголошує: навіть короткий курс тренування дав користь, що трималася два десятиліття — і саме тривалість ефекту здивувала дослідницьку команду.</p>
            <p><b>Що дає регулярне тренування — простими словами.</b><br />Мозок звикає швидше «схоплювати» і центр, і те, що скраю. На практиці це означає швидшу реакцію, легкість у повсякденних справах, упевненіше відчуття за кермом і в людних місцях — а в дослідженні ця користь трималася роками.</p>
            <p className="bb-cream-note"><b>Чесні межі.</b><br />Користь була лише в тих, хто тренувався <i>регулярно</i> й повертався до вправ — отже, працює регулярність, а не одна спроба. Діагнози рахували за медичними записами (наближена оцінка). Це <i>зв’язок</i>, виявлений у дослідженні, а не обіцянка результату для конкретної людини. Наша гра — <b>не сертифікований медичний тренажер</b>, а проста вправа за тим самим принципом, і вона не замінює лікування чи реабілітацію.</p>
            <p><b>Підсумок.</b><br />Доказів достатньо, щоб спробувати — вправа безпечна й приємна. Але користь дає регулярність, а не разова гра. Сприймайте це як корисну звичку, а не ліки.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Практично будь-якому дорослому, хто хоче тренувати увагу та швидкість сприйняття — і у зрілому віці, і під час відновлення після стресу чи травми. Вікового обмеження зверху немає. Можна грати разом із рідними.</p>
            <p><b>Кому варто бути обережним або спершу порадитися з лікарем:</b> якщо була фотосенситивна епілепсія чи реакції на миготливі зображення; у гострий період після струсу/травми голови, при сильному головному болі чи запамороченні; якщо раптові появи на екрані викликають тривогу — тоді просто зупиніться. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки грати за раз.</b><br />Орієнтовно 5–10 хвилин, не до втоми. Щойно відчули, що увага «попливла», — завершуйте. Коротко, але якісно краще, ніж довго через силу.</p>
            <p><b>Як часто.</b><br />Користь дає регулярність. Розумний орієнтир — 3–5 разів на тиждень короткими сеансами. Кілька тижнів поспіль дадуть більше, ніж марафон за один день.</p>
            <p><b>Якщо складно.</b><br />Це нормально — почніть із «Легкого» рівня. Подвійна увага складніша за просте впізнавання, тож не засмучуйтеся помилкам: саме невеликий виклик і тренує мозок.</p>
            <p><b>Чи це лікує?</b><br />Ні. Це тренувальна вправа для підтримки когнітивних функцій, а не ліки й не заміна реабілітації чи консультації лікаря.</p>
          </div>
        </details>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби звертайтеся до лікаря.
        </p>

        {/* ───────── Нижня навігація ───────── */}
        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 28, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22 }}>
          <a href="/games/flash" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Що промайнуло?</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .bb-flash-in { animation: bbFlashIn 0.18s ease-out; }
        @keyframes bbFlashIn { from { opacity: 0; } to { opacity: 1; } }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        .bb-details p { margin: 0 0 16px; }
        .bb-details p:last-child { margin-bottom: 0; }
        .bb-details b { color: ${GOLD}; }
        .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
        .bb-cream-note b { color: ${GOLD_DARK}; }
        .bb-opt { hyphens: auto; -webkit-hyphens: auto; overflow-wrap: normal; }
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
const btnNext: React.CSSProperties = { ...btnPrimary, padding: '15px 30px', whiteSpace: 'normal' }
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
