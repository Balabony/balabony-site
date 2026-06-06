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

/* ───────────────────────── Налаштування ───────────────────────── */
const GRID = 9                 // 3×3 клітинки
const START_LEN = 2            // стартова довжина послідовності
const FLASH_MS = 650           // скільки горить кожна клітинка
const GAP_MS = 250             // пауза між підсвічуваннями
const LS_KEY = 'balabony_order_best'

const PRAISE = ['Чудово!', 'Влучно!', 'Так тримати!', 'Чітко!', 'Браво!']

type Phase = 'intro' | 'showing' | 'input' | 'feedback' | 'over'

function randSeq(len: number, prev: number[]): number[] {
  // нова послідовність; уникаємо точного повтору двох однакових поспіль у кінці
  const s: number[] = []
  for (let i = 0; i < len; i++) {
    let n = Math.floor(Math.random() * GRID)
    while (i > 0 && n === s[i - 1]) n = Math.floor(Math.random() * GRID)
    s.push(n)
  }
  return s
}

export default function MemoryOrderPage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [isDemo, setIsDemo] = useState(false)
  const [seq, setSeq] = useState<number[]>([])
  const [lit, setLit] = useState<number | null>(null)   // яка клітинка зараз горить
  const [inputIdx, setInputIdx] = useState(0)            // скільки вже введено
  const [wrongCell, setWrongCell] = useState<number | null>(null)
  const [level, setLevel] = useState(START_LEN)          // поточна довжина
  const [right, setRight] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [praise, setPraise] = useState('')
  const [correctRound, setCorrectRound] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    try { const v = window.localStorage.getItem(LS_KEY); if (v) setBest(Number(v)) } catch {}
  }, [])

  const startRound = useCallback((len: number, demo: boolean) => {
    clearTimers()
    const s = randSeq(len, seq)
    setSeq(s)
    setInputIdx(0)
    setWrongCell(null)
    setLit(null)
    setIsDemo(demo)
    setPhase('showing')
  }, [seq])

  const begin = (demo: boolean) => {
    setLevel(START_LEN)
    if (!demo) setRight(0)
    startRound(START_LEN, demo)
  }

  // Програвання послідовності
  useEffect(() => {
    if (phase !== 'showing') return
    clearTimers()
    let i = 0
    const step = () => {
      if (i >= seq.length) {
        setLit(null)
        timers.current.push(setTimeout(() => setPhase('input'), 300))
        return
      }
      setLit(seq[i])
      timers.current.push(setTimeout(() => {
        setLit(null)
        i += 1
        timers.current.push(setTimeout(step, GAP_MS))
      }, FLASH_MS))
    }
    // невелика затримка перед стартом показу
    timers.current.push(setTimeout(step, 500))
  }, [phase, seq])

  const tapCell = (cell: number) => {
    if (phase !== 'input') return
    if (cell === seq[inputIdx]) {
      const ni = inputIdx + 1
      setInputIdx(ni)
      // коротке підсвічування правильного дотику
      setLit(cell)
      setTimeout(() => setLit(null), 160)
      if (ni >= seq.length) {
        // раунд пройдено
        setCorrectRound(true)
        setPraise(PRAISE[Math.floor(Math.random() * PRAISE.length)])
        setPhase('feedback')
        if (!isDemo) {
          setRight((n) => n + 1)
          if (best === null || seq.length > best) {
            setBest(seq.length)
            try { window.localStorage.setItem(LS_KEY, String(seq.length)) } catch {}
          }
        }
      }
    } else {
      // помилка
      setWrongCell(cell)
      setCorrectRound(false)
      setPhase(isDemo ? 'feedback' : 'over')
    }
  }

  const nextRound = () => {
    if (isDemo) { setIsDemo(false); setPhase('intro'); return }
    const nl = level + 1
    setLevel(nl)
    startRound(nl, false)
  }

  const reset = () => {
    clearTimers()
    setPhase('intro'); setIsDemo(false); setLevel(START_LEN); setRight(0)
    setSeq([]); setInputIdx(0); setWrongCell(null); setLit(null)
  }

  const playing = phase !== 'intro' && phase !== 'over'

  return (
    <main lang="uk" style={{ minHeight: '100vh', background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% 64px', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>
          Запам’ятай порядок
        </h1>

        {/* Плашка наукової основи */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>Тренує робочу пам’ять — за даними досліджень, найдієвіший вид когнітивних вправ</div>
            <div style={{ fontSize: 14, color: '#D5E5F5', lineHeight: 1.45, marginTop: 4 }}>Підтверджено рандомізованими дослідженнями (Інститут IfADo, Німеччина, 2018; Китай, 2019) та оглядом 97 випробувань</div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 16px' }}>
          Клітинки спалахуватимуть по черзі — запам’ятайте порядок і повторіть його,
          торкаючись клітинок. Що далі — то довша послідовність. Без поспіху.
        </p>
        <p style={{ color: TEXT_SOFT, fontSize: 16.5, lineHeight: 1.6, margin: '0 0 26px' }}>
          <b style={{ color: GOLD }}>Що це тренує.</b> «Робочу пам’ять» — здатність
          утримувати в голові інформацію й користуватися нею. Вона потрібна щодня:
          запам’ятати список покупок, номер, послідовність дій. <b style={{ color: GOLD }}>Користь дає регулярність.</b>
        </p>

        {/* ───────── Ігрове поле ───────── */}
        <section style={{ background: CREAM, borderRadius: 24, border: `2px solid ${GOLD_LIGHT}`, padding: '28px 22px', color: NAVY, boxShadow: '0 18px 40px rgba(0,0,0,0.28)' }}>
          {playing && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 380, margin: '0 auto 22px' }}>
              <Stat label="Пройдено" value={`${right}`} color={GREEN} />
              <Stat label="Довжина" value={`${seq.length}`} color={NAVY} />
              {best !== null && <Stat label="Найкраще" value={`${best}`} color={GOLD_DARK} />}
            </div>
          )}

          {/* Підказка над полем — лише під час гри */}
          {(phase === 'showing' || phase === 'input') && (
            <p style={{ textAlign: 'center', fontSize: 21, fontWeight: 700, fontFamily: "'Lora', serif", color: GOLD_DARK, margin: '0 0 14px' }}>
              {phase === 'showing' ? (isDemo ? 'Пробний раунд. Запам’ятовуйте…' : 'Запам’ятовуйте…') : 'Тепер повторіть порядок'}
            </p>
          )}

          {/* Сітка 3×3 */}
          {(phase === 'showing' || phase === 'input' || phase === 'feedback' || phase === 'over') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, maxWidth: 300, margin: '0 auto' }}>
              {Array.from({ length: GRID }).map((_, cell) => {
                const isLit = lit === cell
                const isWrong = wrongCell === cell
                const tappable = phase === 'input'
                return (
                  <button
                    key={cell}
                    onClick={() => tapCell(cell)}
                    disabled={!tappable}
                    aria-label={`клітинка ${cell + 1}`}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 16,
                      border: `2px solid ${GOLD_LIGHT}`,
                      background: isWrong ? RED_SOFT : isLit ? GOLD : '#fff',
                      cursor: tappable ? 'pointer' : 'default',
                      transition: 'background 0.12s',
                      boxSizing: 'border-box',
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* INTRO */}
          {phase === 'intro' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <p style={{ fontSize: 17, lineHeight: 1.55, margin: '0 0 18px', color: '#4A4234' }}>
                Дивіться, які клітинки спалахують, і повторіть той самий порядок.
                Час на повторення необмежений.
              </p>
              {best !== null && <p style={{ fontSize: 15, color: GOLD_DARK, fontWeight: 700, margin: '0 0 16px' }}>Ваш рекорд довжини: {best}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <button onClick={() => begin(false)} style={btnPrimary}>Почати</button>
                <button onClick={() => begin(true)} style={btnGhost}>Спершу пробний раунд</button>
              </div>
            </div>
          )}

          {/* FEEDBACK (раунд пройдено) */}
          {phase === 'feedback' && (
            <div aria-live="polite" style={{ textAlign: 'center', marginTop: 18 }}>
              {correctRound ? (
                <p style={{ fontSize: 20, fontWeight: 700, color: GREEN, margin: '0 0 14px' }}>{praise} Усе правильно.</p>
              ) : (
                <p style={{ fontSize: 17, fontWeight: 600, color: '#4A4234', margin: '0 0 14px' }}>Це був пробний раунд — далі буде легше.</p>
              )}
              <button onClick={nextRound} style={btnNext}>{isDemo ? 'Почати гру →' : 'Далі — довша послідовність →'}</button>
            </div>
          )}

          {/* OVER (помилка у справжній грі) */}
          {phase === 'over' && (
            <div style={{ textAlign: 'center', marginTop: 18 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: GOLD_DARK, fontFamily: "'Lora', serif", margin: '0 0 6px' }}>
                Дійшли до довжини {seq.length}
              </p>
              <p style={{ fontSize: 16, color: '#4A4234', lineHeight: 1.5, margin: '0 0 8px' }}>
                {seq.length >= 6 ? 'Чудовий результат! Це справді багато.'
                  : seq.length >= 4 ? 'Гарно! Робоча пам’ять любить повторення — спробуйте ще.'
                  : 'Гарний початок. Що частіше граєте, то легше стає.'}
              </p>
              {best !== null && <p style={{ fontSize: 14, color: GOLD_DARK, fontWeight: 700, margin: '0 0 16px' }}>Рекорд: {best}</p>}
              <button onClick={() => begin(false)} style={btnPrimary}>Грати знову</button>
            </div>
          )}
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
            <p><b>Що тренує.</b> Робочу пам’ять — здатність короткочасно утримувати інформацію й діяти з нею (наприклад, тримати в голові послідовність кроків). Це одна з ключових опор мислення в будь-якому віці.</p>
            <p><b>На чому ґрунтується.</b> У великому огляді 97 рандомізованих досліджень (2017) саме тренування робочої пам’яті дали найбільший ефект серед когнітивних вправ. Конкретні приклади: у <b>Німеччині</b> (Інститут досліджень умов праці й людських факторів, IfADo, Дортмунд, 2018) чотиримісячне тренування покращило робочу пам’ять у 141 літньої людини (середній вік 70 років); у <b>Китаї</b> (2019) рандомізоване дослідження показало покращення робочої пам’яті в літніх із легкими когнітивними порушеннями, з переносом на виконавчі функції.</p>
            <p className="bb-cream-note"><b>Чесно про користь.</b> Ця гра покращує саме <i>робочу пам’ять</i>, а також пов’язані з нею <i>увагу та виконавчі функції</i> (планування дій, самоконтроль) — це підтверджено дослідженнями. Але, на відміну від тренування швидкості сприйняття, тут <b>немає доказів впливу на ризик деменції</b>. Сприймайте її як корисну вправу для пам’яті, а не як ліки; вона не замінює лікування чи консультацію лікаря.</p>
            <p><b>Як грати найкраще.</b> Користь дає регулярність — короткі заняття кілька разів на тиждень дають більше, ніж рідкі довгі. Грайте спокійно; помилка — не поразка, а сигнал, що мозок працював на межі своїх можливостей, і саме так він тренується.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b> Будь-якому дорослому, хто хоче тренувати пам’ять і увагу — і у зрілому віці, і під час відновлення. Можна грати разом із рідними, по черзі.</p>
            <p><b>Скільки за раз.</b> 5–10 хвилин, не до втоми. Щойно стало важко зосередитися — завершуйте.</p>
            <p><b>Як часто.</b> 3–5 разів на тиждень короткими сеансами. Кілька тижнів поспіль дають помітніший результат.</p>
            <p><b>Якщо складно.</b> Це нормально: послідовність росте поступово, і навіть короткі ланцюжки — корисне тренування. Не засмучуйтеся помилкам.</p>
            <p><b>Чи це лікує?</b> Ні. Це тренувальна вправа для підтримки когнітивних функцій, а не ліки й не заміна консультації лікаря.</p>
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
    <div style={{ flex: '1 1 calc(50% - 4px)', minWidth: 0, background: '#fff', border: `1px solid ${GOLD_LIGHT}`, borderRadius: 12, padding: '8px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#5C5240', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, marginTop: 2, fontFamily: "'Lora', serif", whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}

/* ───────────────────────── Стилі ───────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: GOLD, color: NAVY, border: `2px solid ${GOLD_LIGHT}`, borderRadius: 24,
  padding: '14px 34px', fontSize: 19, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnNext: React.CSSProperties = { ...btnPrimary, padding: '15px 28px', fontSize: 18, whiteSpace: 'normal' }
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
