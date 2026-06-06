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
const RED_SOFT = '#E0484D'

/* ───────────────────────── Палітра гри ───────────────────────── */
interface ColorDef { key: string; name: string; hex: string }
const COLORS: ColorDef[] = [
  { key: 'red',    name: 'ЧЕРВОНИЙ', hex: '#D8333B' },
  { key: 'blue',   name: 'СИНІЙ',    hex: '#2D6FCC' },
  { key: 'green',  name: 'ЗЕЛЕНИЙ',  hex: '#2E9B52' },
  { key: 'yellow', name: 'ЖОВТИЙ',   hex: '#C98A00' },
]

const LEVELS = {
  easy:   { n: 3, label: 'Легкий',   sub: '3 кольори' },
  medium: { n: 4, label: 'Середній', sub: '4 кольори' },
} as const
type Level = keyof typeof LEVELS

const PRAISE = ['Чудово!', 'Влучно!', 'Так і є!', 'Чітко!', 'Браво!']
type Phase = 'intro' | 'countdown' | 'question' | 'feedback'
const LS_KEY = 'balabony_colors_best'
const ROUNDS = 12

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

interface Round {
  wordColor: ColorDef   // якого кольору НАПИСАНО (правильна відповідь)
  wordText: ColorDef    // яке слово написане
  options: ColorDef[]
}

function makeRound(pool: ColorDef[], prevWordColorKey: string | null): Round {
  // колір тексту (правильна відповідь) — не такий, як минулого разу
  const colorPool = prevWordColorKey ? pool.filter((c) => c.key !== prevWordColorKey) : pool
  const wordColor = colorPool[Math.floor(Math.random() * colorPool.length)]
  // слово — інше за колір (щоб був конфлікт), із 70% імовірністю
  let wordText = wordColor
  if (Math.random() < 0.85) {
    const others = pool.filter((c) => c.key !== wordColor.key)
    wordText = others[Math.floor(Math.random() * others.length)]
  }
  return { wordColor, wordText, options: shuffle(pool) }
}

export default function ColorsGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [isDemo, setIsDemo] = useState(false)
  const [level, setLevel] = useState<Level>('easy')
  const [round, setRound] = useState<Round | null>(null)
  const [count, setCount] = useState(3)
  const [picked, setPicked] = useState<ColorDef | null>(null)
  const [idx, setIdx] = useState(0)
  const [right, setRight] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [praise, setPraise] = useState('')

  const prevColor = useRef<string | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    try { const v = window.localStorage.getItem(LS_KEY); if (v) setBest(Number(v)) } catch {}
  }, [])

  const pool = COLORS.slice(0, LEVELS[level].n)

  const newRound = useCallback((lvl: Level, demo: boolean) => {
    const p = COLORS.slice(0, LEVELS[lvl].n)
    const r = makeRound(p, prevColor.current)
    prevColor.current = r.wordColor.key
    setRound(r)
    setPicked(null)
    setIsDemo(demo)
    setCount(3)
    setPhase('countdown')
  }, [])

  const begin = (lvl: Level, demo: boolean) => {
    setLevel(lvl)
    prevColor.current = null
    if (!demo) { setIdx(0); setRight(0) }
    newRound(lvl, demo)
  }

  // Відлік 3-2-1
  useEffect(() => {
    if (phase !== 'countdown') return
    clearTimers()
    let cc = 3; setCount(3)
    const tick = () => {
      cc -= 1
      if (cc > 0) { setCount(cc); timers.current.push(setTimeout(tick, 650)) }
      else setPhase('question')
    }
    timers.current.push(setTimeout(tick, 650))
  }, [phase])

  const answer = (c: ColorDef) => {
    if (!round) return
    setPicked(c)
    const ok = c.key === round.wordColor.key
    setPraise(ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '')
    setPhase('feedback')
    if (isDemo) return
    if (ok) {
      const nr = right + 1
      setRight(nr)
      if (best === null || nr > best) {
        setBest(nr)
        try { window.localStorage.setItem(LS_KEY, String(nr)) } catch {}
      }
    }
  }

  const next = () => {
    if (isDemo) { setIsDemo(false); setPhase('intro'); return }
    if (idx + 1 >= ROUNDS) {
      // завершено коло — підсумок через intro (рекорд уже збережено за найкращим right)
      setPhase('intro')
      return
    }
    setIdx((n) => n + 1)
    newRound(level, false)
  }

  const reset = () => {
    clearTimers()
    prevColor.current = null
    setPhase('intro'); setIsDemo(false); setIdx(0); setRight(0); setPicked(null)
  }

  // Прокрутити вгору при старті гри (щоб ігрове поле було зверху, без порожнечі)
  const prevPhaseRef = useRef(phase)
  useEffect(() => {
    if (prevPhaseRef.current === 'intro' && phase !== 'intro') {
      if (typeof window !== 'undefined') window.scrollTo({ top: 0 })
    }
    prevPhaseRef.current = phase
  }, [phase])
  const playing = phase !== 'intro'
  const correct = picked !== null && round !== null && picked.key === round.wordColor.key

  return (
    <main lang="uk" style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% calc(88px + env(safe-area-inset-bottom, 0px))', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {phase === 'intro' && (<>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>
          Який колір?
        </h1>

        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>Тренує гальмівний контроль — уміння не піддаватися звичній реакції й робити те, що потрібно зараз</div>
            <div style={{ fontSize: 14, color: '#D5E5F5', lineHeight: 1.45, marginTop: 4 }}>Рандомізовані дослідження (зокрема Канада, 2019) показали, що така вправа покращує цю здатність у людей похилого віку</div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 16px' }}>
          З’явиться слово — назва кольору, але написане <b style={{ color: '#fff' }}>іншим</b> кольором.
          Ваше завдання — назвати <b style={{ color: '#fff' }}>колір літер</b>, а не прочитати слово. Без поспіху.
        </p>
        <p style={{ color: TEXT_SOFT, fontSize: 16.5, lineHeight: 1.6, margin: '0 0 26px' }}><b style={{ color: GOLD }}>Що це тренує.</b><br />Здатність гальмувати автоматичну
          звичку (читати слово) і робити те, що потрібно зараз. Це «гальмівний контроль» —
          опора уваги та самовладання. <b style={{ color: GOLD }}>Користь дає регулярність.</b>
        </p>
        </>)}

        {/* ───────── Ігрове поле ───────── */}
        <section style={{ background: CREAM, borderRadius: 24, border: `2px solid ${GOLD_LIGHT}`, padding: '28px 22px', color: NAVY, boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
          {playing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380, margin: '0 auto 22px' }}>
              <Stat label="Питання" value={`${Math.min(idx + 1, ROUNDS)} / ${ROUNDS}`} color={NAVY} />
              <Stat label="Правильних" value={`${right}`} color={GREEN} />
              {best !== null && <Stat label="Найкраще" value={`${best}`} color={GOLD_DARK} />}
            </div>
          )}

          <div style={{ minHeight: 190, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            {/* INTRO */}
            {phase === 'intro' && (
              <div style={{ width: '100%' }}>
                {/* міні-приклад */}
                <div style={{ marginBottom: 14, fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 34 }}>
                  <span style={{ color: COLORS[1].hex }}>{COLORS[0].name}</span>
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.5, margin: '0 0 6px', color: '#4A4234' }}>
                  Тут правильна відповідь — <b>СИНІЙ</b> (бо літери сині), а не «червоний».
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.5, margin: '0 0 16px', color: '#6A5F48' }}>
                  Оберіть складність. Час на відповідь необмежений.
                </p>
                {best !== null && <p style={{ fontSize: 15, color: GOLD_DARK, fontWeight: 700, margin: '0 0 14px' }}>Ваш рекорд: {best} правильних</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  {(['easy', 'medium'] as Level[]).map((lv) => (
                    <button key={lv} onClick={() => begin(lv, false)} style={{ ...btnPrimary, width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 20px' }}>
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
                <p style={{ fontSize: 17, color: '#6A5F48', margin: '0 0 14px' }}>{isDemo ? 'Пробний раунд. Готуйтеся…' : 'Готуйтеся…'}</p>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 72, fontWeight: 700, color: GOLD_DARK, lineHeight: 1 }}>{count}</div>
              </div>
            )}

            {/* QUESTION / FEEDBACK */}
            {(phase === 'question' || phase === 'feedback') && round && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 15, color: '#7A6A48', margin: '0 0 6px' }}>Якого кольору літери?</p>
                <div className="bb-word-in" style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 'clamp(28px, 9.5vw, 46px)', color: round.wordColor.hex, margin: '0 0 14px', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
                  {round.wordText.name}
                </div>

                <div style={{ display: 'grid', gap: 8, maxWidth: 340, margin: '0 auto' }}>
                  {round.options.map((c) => {
                    const isPicked = picked?.key === c.key
                    const isCorrect = c.key === round.wordColor.key
                    let border = `2px solid ${GOLD_LIGHT}`
                    let bg = '#fff'
                    if (phase === 'feedback') {
                      if (isCorrect) border = `3px solid ${GREEN}`
                      if (isPicked && !isCorrect) { border = `3px solid ${RED_SOFT}`; bg = '#FBE9E9' }
                    }
                    return (
                      <button key={c.key} onClick={() => phase === 'question' && answer(c)} disabled={phase === 'feedback'}
                        style={{ background: bg, border, borderRadius: 16, padding: '12px 18px', minHeight: 50, cursor: phase === 'question' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 12, boxSizing: 'border-box' }}>
                        <span style={{ width: 20, height: 20, borderRadius: '50%', background: c.hex, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                        <span style={{ fontSize: 18, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap' }}>{c.name}</span>
                      </button>
                    )
                  })}
                </div>

                {phase === 'feedback' && (
                  <div aria-live="polite" style={{ marginTop: 18 }}>
                    {correct ? (
                      <p style={{ fontSize: 20, fontWeight: 700, color: GREEN, margin: '0 0 12px' }}>{praise}</p>
                    ) : (
                      <p style={{ fontSize: 17, fontWeight: 600, color: '#4A4234', margin: '0 0 12px' }}>
                        Літери були <b style={{ color: round.wordColor.hex }}>{round.wordColor.name.toLowerCase()}</b> кольору.
                      </p>
                    )}
                    <button onClick={next} style={btnNext}>
                      {idx + 1 >= ROUNDS ? 'Завершити →' : 'Далі →'}
                    </button>
                  </div>
                )}
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
          <summary style={summaryStyle}>Чим це корисно?</summary>
          <div style={detailsBody}>
            <p><b>Що тренує.</b><br />Гальмівний контроль — здатність притлумити автоматичну, звичну реакцію (прочитати слово) і виконати потрібну дію (назвати колір). Це одна з основ уваги, зосередженості й самовладання.</p>
            <p><b>Звідки ця вправа.</b><br />Її придумав психолог Джон Рідлі Струп ще у 1935 році (звідси й назва — «тест Струпа»). Суть проста, але хитра: коли назву кольору написано іншим кольором, мозок за звичкою прагне <i>прочитати</i> слово — і доводиться зусиллям волі назвати саме колір літер. Уміння притлумити таку автоматичну реакцію й називають гальмівним контролем.</p>
            <p><b>Що показують дослідження.</b><br />Тренування таких завдань покращує цю здатність у людей похилого віку: наприклад, у Канаді (2019) комп’ютерне тренування значуще покращило показники в дорослих 65–85 років, а огляди досліджень підтверджують вплив подібних вправ на виконавчі функції (увагу, самоконтроль, перемикання).</p>
            <p className="bb-cream-note"><b>Чесно про користь.</b><br />Гра покращує саме <i>гальмівний контроль та увагу</i> — це підтверджено дослідженнями. Сприймайте її як корисну вправу для уваги, а не як ліки; вона не замінює лікування чи консультацію лікаря.</p>
            <p><b>Як грати найкраще.</b><br />Користь дає регулярність — короткі заняття кілька разів на тиждень. Спершу мозок «спотикається» об звичку читати — це нормально й саме в цьому сенс вправи.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому дорослому, хто хоче тренувати увагу й самоконтроль — і у зрілому віці, і під час відновлення. Потрібне розрізнення кольорів; якщо є дальтонізм, гра може бути незручною (орієнтуйтеся й на кружечок-підказку біля назви).</p>
            <p><b>Скільки за раз.</b><br />5–10 хвилин, не до втоми. Одне коло — 12 запитань.</p>
            <p><b>Як часто.</b><br />3–5 разів на тиждень короткими сеансами; кілька тижнів поспіль дають помітніший результат.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» (3 кольори). Плутати слово й колір на початку — звична річ, з практикою стає легше.</p>
            <p><b>Чи це лікує?</b> Ні. Це тренувальна вправа для підтримки уваги, а не ліки й не заміна консультації лікаря.</p>
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
        .bb-word-in { animation: bbWordIn 0.22s ease-out; }
        @keyframes bbWordIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
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
