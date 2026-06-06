'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ───────────────────────── Кольори бренду ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'
const TEXT_SOFT = '#B5D4F4'
const GREEN = '#3FA66A'
const RED_SOFT = '#E0484D'

/* ───────────────────────── Картинки (прості, теплі) ───────────────────────── */
type ShapeKey =
  | 'sun' | 'flower' | 'cat' | 'fish' | 'house' | 'tree'
  | 'star' | 'butterfly' | 'mushroom' | 'heart' | 'bird' | 'ball'

const SHAPE_NAMES: Record<ShapeKey, string> = {
  sun: 'Сонечко',
  flower: 'Квітка',
  cat: 'Котик',
  fish: 'Рибка',
  house: 'Будиночок',
  tree: 'Дерево',
  star: 'Зірочка',
  butterfly: 'Метелик',
  mushroom: 'Грибок',
  heart: 'Сердечко',
  bird: 'Пташка',
  ball: 'М’ячик',
}

const ALL_SHAPES = Object.keys(SHAPE_NAMES) as ShapeKey[]

function Shape({ kind, size = 150 }: { kind: ShapeKey; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 100 100' } as const
  switch (kind) {
    case 'sun':
      return (
        <svg {...common} aria-hidden="true">
          {[...Array(8)].map((_, i) => {
            const a = (i * Math.PI) / 4
            return (
              <line key={i} x1={50 + Math.cos(a) * 30} y1={50 + Math.sin(a) * 30}
                x2={50 + Math.cos(a) * 44} y2={50 + Math.sin(a) * 44}
                stroke={GOLD} strokeWidth="6" strokeLinecap="round" />
            )
          })}
          <circle cx="50" cy="50" r="24" fill={GOLD} />
        </svg>
      )
    case 'flower':
      return (
        <svg {...common} aria-hidden="true">
          <line x1="50" y1="50" x2="50" y2="92" stroke="#3FA66A" strokeWidth="6" strokeLinecap="round" />
          {[...Array(6)].map((_, i) => {
            const a = (i * Math.PI) / 3
            return <circle key={i} cx={50 + Math.cos(a) * 20} cy={42 + Math.sin(a) * 20} r="13" fill="#E86A92" />
          })}
          <circle cx="50" cy="42" r="11" fill={GOLD} />
        </svg>
      )
    case 'cat':
      return (
        <svg {...common} aria-hidden="true">
          <polygon points="26,28 34,8 46,24" fill="#E8913F" />
          <polygon points="74,28 66,8 54,24" fill="#E8913F" />
          <circle cx="50" cy="56" r="32" fill="#E8913F" />
          <circle cx="40" cy="52" r="4.5" fill={NAVY} />
          <circle cx="60" cy="52" r="4.5" fill={NAVY} />
          <polygon points="46,62 54,62 50,68" fill="#B05B22" />
          <line x1="50" y1="68" x2="50" y2="74" stroke="#B05B22" strokeWidth="3" />
        </svg>
      )
    case 'fish':
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="46" cy="50" rx="32" ry="20" fill="#3FA0C4" />
          <polygon points="74,50 94,36 94,64" fill="#2C7FA0" />
          <circle cx="34" cy="44" r="4" fill={NAVY} />
        </svg>
      )
    case 'house':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="26" y="48" width="48" height="40" fill="#E8C57A" />
          <polygon points="20,48 50,18 80,48" fill="#C0563E" />
          <rect x="44" y="62" width="14" height="26" fill="#7A4A2A" />
          <rect x="32" y="56" width="10" height="10" fill={CREAM} />
        </svg>
      )
    case 'tree':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="44" y="56" width="12" height="34" fill="#8A5A2A" />
          <circle cx="50" cy="40" r="26" fill="#3FA66A" />
          <circle cx="34" cy="50" r="16" fill="#4DBE7A" />
          <circle cx="66" cy="50" r="16" fill="#4DBE7A" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common} aria-hidden="true">
          <polygon points="50,10 61,38 92,40 67,58 76,88 50,70 24,88 33,58 8,40 39,38" fill={GOLD} />
        </svg>
      )
    case 'butterfly':
      return (
        <svg {...common} aria-hidden="true">
          <ellipse cx="32" cy="38" rx="18" ry="16" fill="#E8913F" />
          <ellipse cx="68" cy="38" rx="18" ry="16" fill="#E8913F" />
          <ellipse cx="34" cy="64" rx="14" ry="12" fill="#3FA0C4" />
          <ellipse cx="66" cy="64" rx="14" ry="12" fill="#3FA0C4" />
          <rect x="47" y="30" width="6" height="44" rx="3" fill={NAVY} />
        </svg>
      )
    case 'mushroom':
      return (
        <svg {...common} aria-hidden="true">
          <rect x="42" y="52" width="16" height="34" rx="6" fill="#F0E2C8" />
          <path d="M18 54 A32 32 0 0 1 82 54 Z" fill="#C0563E" />
          <circle cx="38" cy="42" r="4" fill={CREAM} />
          <circle cx="58" cy="38" r="5" fill={CREAM} />
          <circle cx="66" cy="48" r="3.5" fill={CREAM} />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common} aria-hidden="true">
          <path d="M50 84 C18 60 14 36 30 26 C42 18 50 30 50 30 C50 30 58 18 70 26 C86 36 82 60 50 84 Z" fill="#E0484D" />
        </svg>
      )
    case 'bird':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="50" cy="52" r="28" fill="#3FA0C4" />
          <circle cx="58" cy="44" r="4" fill={NAVY} />
          <polygon points="76,48 92,52 76,56" fill={GOLD} />
          <path d="M30 52 Q44 70 58 56" fill="#2C7FA0" />
        </svg>
      )
    case 'ball':
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="50" cy="50" r="34" fill={GOLD} />
          <path d="M16 50 H84 M50 16 V84" stroke={NAVY} strokeWidth="4" />
          <circle cx="50" cy="50" r="34" fill="none" stroke={NAVY} strokeWidth="3" />
        </svg>
      )
  }
}

/* ───────────────────────── Допоміжне ───────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickOptions(target: ShapeKey): ShapeKey[] {
  const others = shuffle(ALL_SHAPES.filter((s) => s !== target)).slice(0, 3)
  return shuffle([target, ...others])
}

const PRAISE = ['Чудово!', 'Влучно!', 'Так і є!', 'Чітко!', 'Браво!']

type Phase = 'intro' | 'countdown' | 'flash' | 'gap' | 'answer' | 'feedback'

const START_MS = 800
const DEMO_MS = 1500
const MIN_MS = 140
const MAX_MS = 1100
const LS_KEY = 'balabony_flash_best'

/* ───────────────────────── Компонент ───────────────────────── */
export default function FlashGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [isDemo, setIsDemo] = useState(false)
  const [flashMs, setFlashMs] = useState(START_MS)
  const [target, setTarget] = useState<ShapeKey>('sun')
  const [options, setOptions] = useState<ShapeKey[]>([])
  const [count, setCount] = useState(3)
  const [picked, setPicked] = useState<ShapeKey | null>(null)
  const [correct, setCorrect] = useState(false)
  const [streak, setStreak] = useState(0)
  const [right, setRight] = useState(0)
  const [total, setTotal] = useState(0)
  const [best, setBest] = useState<number | null>(null)
  const [praise, setPraise] = useState('')

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  /* завантажити найкращий результат */
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(LS_KEY)
      if (v) setBest(Number(v))
    } catch {}
  }, [])

  const startRound = useCallback((demo: boolean) => {
    clearTimers()
    const t = ALL_SHAPES[Math.floor(Math.random() * ALL_SHAPES.length)]
    setTarget(t)
    setOptions(pickOptions(t))
    setPicked(null)
    setIsDemo(demo)
    setCount(3)
    setPhase('countdown')
  }, [])

  /* відлік 3-2-1 → показ */
  useEffect(() => {
    if (phase !== 'countdown') return
    clearTimers()
    let c = 3
    setCount(3)
    const tick = () => {
      c -= 1
      if (c > 0) {
        setCount(c)
        timers.current.push(setTimeout(tick, 750))
      } else {
        setPhase('flash')
      }
    }
    timers.current.push(setTimeout(tick, 750))
  }, [phase])

  /* показ картинки → пауза → відповідь */
  useEffect(() => {
    if (phase !== 'flash') return
    clearTimers()
    const dur = isDemo ? DEMO_MS : flashMs
    timers.current.push(setTimeout(() => setPhase('gap'), dur))
  }, [phase, isDemo, flashMs])

  useEffect(() => {
    if (phase !== 'gap') return
    clearTimers()
    timers.current.push(setTimeout(() => setPhase('answer'), 280))
  }, [phase])

  const answer = (key: ShapeKey) => {
    const ok = key === target
    setPicked(key)
    setCorrect(ok)
    setPraise(ok ? PRAISE[Math.floor(Math.random() * PRAISE.length)] : '')
    setPhase('feedback')

    if (isDemo) return // демо не впливає на лічильники й складність

    setTotal((n) => n + 1)
    if (ok) {
      setRight((n) => n + 1)
      const newStreak = streak + 1
      setStreak(newStreak)
      // зберегти найкращий час, на якому впізнали
      if (best === null || flashMs < best) {
        setBest(flashMs)
        try { window.localStorage.setItem(LS_KEY, String(flashMs)) } catch {}
      }
      // що 2 правильні поспіль — трохи коротший показ
      if (newStreak % 2 === 0) {
        setFlashMs((ms) => Math.max(MIN_MS, ms - 70))
      }
    } else {
      setStreak(0)
      setFlashMs((ms) => Math.min(MAX_MS, ms + 120))
    }
  }

  const next = () => {
    if (isDemo) {
      setIsDemo(false)
      setPhase('intro')
    } else {
      startRound(false)
    }
  }

  const reset = () => {
    clearTimers()
    setPhase('intro')
    setIsDemo(false)
    setFlashMs(START_MS)
    setStreak(0)
    setRight(0)
    setTotal(0)
    setPicked(null)
  }

  const playing = phase !== 'intro'

  return (
    <main
      style={{
        minHeight: '100vh',
        background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`,
        padding: '32px 5% 64px',
        fontFamily: "'Montserrat', sans-serif",
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Хлібна крихта */}
        <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
          <a href="/" style={{ color: GOLD, textDecoration: 'none' }}>Головна</a>
          <span style={{ color: 'rgba(255,255,255,0.35)', margin: '0 8px' }}>·</span>
          <span style={{ color: TEXT_SOFT }}>Ігри для мозку</span>
        </nav>

        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontWeight: 500,
            fontSize: 'clamp(30px, 6vw, 44px)',
            margin: '0 0 10px',
            lineHeight: 1.15,
          }}
        >
          Що промайнуло?
        </h1>

        {/* Плашка наукової основи */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(239,159,39,0.08)',
            border: '1px solid rgba(239,159,39,0.4)',
            borderRadius: 14,
            padding: '12px 16px',
            margin: '4px 0 22px',
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ flexShrink: 0 }}>
            <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" />
            <path d="M9 12 l2 2 l4 -4" />
          </svg>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>
              Ґрунтується на методиці, яку у США досліджують понад 25 років
            </div>
            <div style={{ fontSize: 13, color: TEXT_SOFT, lineHeight: 1.4, marginTop: 3 }}>
              Клінічне дослідження ACTIVE за підтримки Національних інститутів здоров’я
              США (NIH) · 20-річні результати опубліковано у 2026 році
            </div>
          </div>
        </div>

        <p style={{ color: TEXT_SOFT, fontSize: 18, lineHeight: 1.55, margin: '0 0 26px' }}>
          Проста вправа для уваги та швидкості мозку. Картинка з’явиться на коротку
          мить — а ви впізнаєте, що це було. Грайте спокійно, у своєму темпі: тут
          немає поспіху й немає програшу.
        </p>

        {/* ───────── Ігрове поле ───────── */}
        <section
          style={{
            background: CREAM,
            borderRadius: 24,
            border: `2px solid ${GOLD_LIGHT}`,
            padding: '28px 22px',
            color: NAVY,
            boxShadow: '0 18px 40px rgba(0,0,0,0.28)',
          }}
        >
          {/* Лічильники */}
          {playing && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 18,
                marginBottom: 18,
                fontSize: 15,
                fontWeight: 600,
                color: '#5C5240',
              }}
            >
              <span>Правильних: {right}{total > 0 ? ` / ${total}` : ''}</span>
              <span>Показ: {(flashMs / 1000).toFixed(1).replace('.', ',')} c</span>
              {best !== null && (
                <span style={{ color: GOLD }}>
                  Найкращий: {(best / 1000).toFixed(1).replace('.', ',')} c
                </span>
              )}
            </div>
          )}

          {/* Сцена */}
          <div
            style={{
              minHeight: 230,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            {/* INTRO */}
            {phase === 'intro' && (
              <div style={{ width: '100%' }}>
                <div style={{ marginBottom: 22 }}>
                  <Shape kind="butterfly" size={120} />
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.6, margin: '0 0 22px', color: '#4A4234' }}>
                  Як грати: дивіться на крапку в центрі → з’явиться картинка на мить →
                  оберіть із чотирьох варіантів, що промайнуло. Час на відповідь
                  необмежений.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                  <button onClick={() => startRound(false)} style={btnPrimary}>
                    Почати
                  </button>
                  <button onClick={() => startRound(true)} style={btnGhost}>
                    Спершу пробний раунд
                  </button>
                </div>
              </div>
            )}

            {/* COUNTDOWN */}
            {phase === 'countdown' && (
              <div>
                <p style={{ fontSize: 17, color: '#6A5F48', margin: '0 0 14px' }}>
                  {isDemo ? 'Пробний раунд. Дивіться на крапку…' : 'Дивіться на крапку…'}
                </p>
                <div
                  style={{
                    fontFamily: "'Lora', serif",
                    fontSize: 72,
                    fontWeight: 600,
                    color: GOLD,
                    lineHeight: 1,
                  }}
                >
                  {count}
                </div>
                <div
                  aria-hidden="true"
                  style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY, margin: '18px auto 0' }}
                />
              </div>
            )}

            {/* FLASH */}
            {phase === 'flash' && (
              <div className="bb-flash-in">
                <Shape kind={target} size={160} />
              </div>
            )}

            {/* GAP — порожньо (картинка зникла) */}
            {phase === 'gap' && (
              <div aria-hidden="true" style={{ width: 14, height: 14, borderRadius: '50%', background: NAVY }} />
            )}

            {/* ANSWER */}
            {(phase === 'answer' || phase === 'feedback') && (
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 19, fontWeight: 600, margin: '0 0 16px', color: NAVY }}>
                  Що промайнуло?
                </p>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  {options.map((opt) => {
                    const isPicked = picked === opt
                    const isTarget = opt === target
                    let bg = '#fff'
                    let border = `2px solid ${GOLD_LIGHT}`
                    if (phase === 'feedback') {
                      if (isTarget) border = `3px solid ${GREEN}`
                      if (isPicked && !isTarget) {
                        bg = '#FBE9E9'
                        border = `3px solid ${RED_SOFT}`
                      }
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => phase === 'answer' && answer(opt)}
                        disabled={phase === 'feedback'}
                        style={{
                          background: bg,
                          border,
                          borderRadius: 16,
                          padding: '14px 10px',
                          fontSize: 20,
                          fontWeight: 600,
                          fontFamily: "'Montserrat', sans-serif",
                          color: NAVY,
                          cursor: phase === 'answer' ? 'pointer' : 'default',
                          minHeight: 64,
                          transition: 'transform 0.1s',
                        }}
                      >
                        {SHAPE_NAMES[opt]}
                      </button>
                    )
                  })}
                </div>

                {/* FEEDBACK */}
                {phase === 'feedback' && (
                  <div aria-live="polite" style={{ marginTop: 20 }}>
                    {correct ? (
                      <p style={{ fontSize: 20, fontWeight: 700, color: GREEN, margin: '0 0 16px' }}>
                        {praise} Це {SHAPE_NAMES[target].toLowerCase()}.
                      </p>
                    ) : (
                      <p style={{ fontSize: 18, fontWeight: 600, color: '#4A4234', margin: '0 0 16px' }}>
                        Це {SHAPE_NAMES[target].toLowerCase()}. Нічого, пробуймо далі.
                      </p>
                    )}
                    <button onClick={next} style={btnPrimary}>
                      {isDemo ? 'Тепер по-справжньому' : 'Далі'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {playing && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button onClick={reset} style={btnGhostDark}>
              Завершити сеанс
            </button>
          </div>
        )}

        {/* ───────── Докладніше ───────── */}
        <details style={detailsBox}>
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за методика.</b> В основі — тренування «швидкості обробки»
              (speed of processing) з елементом розділеної уваги: треба швидко
              помітити й розпізнати зорову інформацію, що з’являється на короткий час.
              Методику розробили ще у 1990-х (тест Useful Field of View).</p>
            <p><b>На чому ґрунтується.</b> Дані взяті з дослідження ACTIVE —
              найбільшого у США дослідження різних типів когнітивного тренування в
              дорослих. Воно стартувало у 1998–1999 роках, охопило 2 802 особи віком
              від 65 років; учасників випадково розподілили на групи: тренування
              пам’яті, мислення, швидкості обробки або контрольну групу. Кожна група
              мала до 10 занять по 60–75 хвилин протягом 5–6 тижнів, частина — повторні
              («бустерні») сесії. Результати опубліковано у лютому 2026 року в журналі
              «Alzheimer’s &amp; Dementia: Translational Research &amp; Clinical
              Interventions».</p>
            <p><b>Що саме виявили.</b> Через 20 років у групи, яка тренувала швидкість
              і мала повторні сесії, виявили на 25% менше діагнозів деменції, ніж у
              контрольній — це був єдиний тип тренування з таким тривалим ефектом. На
              10-му році ця ж група мала на 29% нижчу захворюваність. Раніші
              результати показували також менше труднощів у повсякденних справах і
              менше ДТП.</p>
            <p><b>Чому це працює.</b> Дослідники вважають, що тренування швидкості було
              особливо дієвим саме тому, що воно адаптивне — складність підлаштовувалася
              під рівень кожної людини. Тому й тут показ коротшає поступово, під ваш темп.</p>
            <p><b>Що кажуть учені.</b> Один із керівників дослідження, професор Майкл
              Марсіске (Університет Флориди), визнав, що тривалість ефекту здивувала
              навіть команду. За його словами, 20-річні дані переконливо свідчать, що
              когнітивне тренування не шкодить і може давати суттєву користь.</p>
            <p style={{ background: '#FFF3DF', borderRadius: 12, padding: '12px 14px' }}>
              <b>Чесні межі.</b> Ефект був лише у тих, хто тренувався <i>і</i> ходив на
              повторні сесії — отже, працює регулярність, а не одна спроба. Діагнози
              рахували за медичними записами (наближена оцінка). Це <i>зв’язок</i>,
              а не обіцянка результату для конкретної людини. Одна зі співавторок
              пов’язана з компанією, що продає комерційну версію тренажера (кажемо це
              для прозорості). Наша гра — <b>не сертифікований медичний тренажер</b>, а
              проста вправа за тим самим принципом, і вона не замінює лікування чи
              реабілітацію.</p>
            <p><b>Підсумок.</b> Доказів достатньо, щоб спробувати — вправа безпечна й
              приємна. Але користь дає регулярність, а не разова гра. Сприймайте це як
              корисну звичку, а не ліки.</p>
          </div>
        </details>

        {/* ───────── FAQ ───────── */}
        <details style={detailsBox}>
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b> Практично будь-якому дорослому, хто хоче тренувати
              увагу та швидкість сприйняття — і у зрілому віці, і під час відновлення
              після стресу чи травми. Вікового обмеження зверху немає. Можна грати разом
              із рідними.</p>
            <p><b>Кому варто бути обережним або спершу порадитися з лікарем:</b> якщо
              була фотосенситивна епілепсія чи реакції на миготливі зображення; у гострий
              період після струсу/травми голови, при сильному головному болі чи
              запамороченні; якщо раптові появи на екрані викликають тривогу — тоді просто
              зупиніться. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки грати за раз.</b> Орієнтовно 5–10 хвилин, не до втоми. Щойно
              відчули, що увага «попливла», — завершуйте. Коротко, але якісно краще, ніж
              довго через силу.</p>
            <p><b>Як часто.</b> Користь дає регулярність. Розумний орієнтир — 3–5 разів
              на тиждень короткими сеансами. Кілька тижнів поспіль дадуть більше, ніж
              марафон за один день.</p>
            <p><b>Коли краще.</b> Коли ви бадьорі й спокійні, наприклад удень. Не варто
              грати геть втомленим або перед сном.</p>
            <p><b>Чи це лікує?</b> Ні. Це тренувальна вправа для підтримки когнітивних
              функцій, а не ліки й не заміна реабілітації чи консультації лікаря.</p>
          </div>
        </details>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби
          звертайтеся до лікаря.
        </p>
      </div>

      <style>{`
        .bb-flash-in { animation: bbFlashIn 0.18s ease-out; }
        @keyframes bbFlashIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </main>
  )
}

/* ───────────────────────── Стилі кнопок/секцій ───────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: GOLD,
  color: NAVY,
  border: `2px solid ${GOLD_LIGHT}`,
  borderRadius: 24,
  padding: '14px 34px',
  fontSize: 19,
  fontWeight: 700,
  fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: '#7A6A48',
  border: '2px solid rgba(122,106,72,0.35)',
  borderRadius: 24,
  padding: '11px 24px',
  fontSize: 16,
  fontWeight: 600,
  fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer',
}

const btnGhostDark: React.CSSProperties = {
  background: 'transparent',
  color: TEXT_SOFT,
  border: '1px solid rgba(181,212,244,0.4)',
  borderRadius: 22,
  padding: '9px 22px',
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer',
}

const detailsBox: React.CSSProperties = {
  marginTop: 16,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(239,159,39,0.3)',
  borderRadius: 16,
  overflow: 'hidden',
}

const summaryStyle: React.CSSProperties = {
  cursor: 'pointer',
  padding: '16px 20px',
  fontSize: 17,
  fontWeight: 700,
  color: GOLD,
  fontFamily: "'Montserrat', sans-serif",
}

const detailsBody: React.CSSProperties = {
  padding: '0 20px 18px',
  fontSize: 15.5,
  lineHeight: 1.65,
  color: TEXT_SOFT,
}
