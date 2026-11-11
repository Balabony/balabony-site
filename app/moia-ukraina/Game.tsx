'use client'

// 11.11.2026: гра «Моя Україна на мапі» — демоверсія для проєкту «Моє місце: голоси молоді України» (ЛОГО «ІГС»).
// Три режими: вікторина (10 випадкових запитань із банку), «Моя мапа» (нитка від рідного міста до теперішнього, відстань),
// рейтинг шкіл (місто + номер школи + клас; жодних імен і персональних даних дітей). Рейтингу міст свідомо немає — щоб не стравлювати регіони.

import { useEffect, useMemo, useRef, useState } from 'react'
import UaMap from './UaMap'
import { REGIONS, type Region } from './ua-regions'
import { CITIES, QUESTIONS, TOT_NOTE, OBL, type City, type Q } from './data'

const NAVY = '#0E1A2B', NAVY2 = '#14253B', CARD = '#193049', GOLD = '#EF9F27', GOLD_L = '#FAC775', SOFT = '#CFE3FA'
const GREEN = '#36AB62', RED = '#E8434B', BLUE = '#5AA9FF'
const ROUND = 10, LIMIT = 20, SLOW = 40

const byName = new Map(CITIES.map((c) => [c.n, c]))
const sortedCities = [...CITIES].sort((a, b) => a.n.localeCompare(b.n, 'uk'))

function shuffle<T>(a: T[]): T[] {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
function km(a: City, b: City) {
  const R = 6371, t = Math.PI / 180
  const dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}

type Mode = 'home' | 'quiz' | 'done' | 'map' | 'rating' | 'suggest' | 'find' | 'oblasti' | 'daily'
type Item = { q: Q; opts: string[] }
type Row = { city: string; school: number; points: number; players: number }

const btn = (bg: string, fg = NAVY): React.CSSProperties => ({ background: bg, color: fg, border: 'none', borderRadius: 14, padding: '14px 20px', fontSize: 18, fontWeight: 800, cursor: 'pointer', minHeight: 52, fontFamily: 'inherit' })
const card: React.CSSProperties = { background: CARD, borderRadius: 20, padding: '22px 20px', border: '1px solid rgba(250,199,117,.25)' }
const sel: React.CSSProperties = { width: '100%', fontSize: 18, padding: '12px 14px', borderRadius: 12, border: `2px solid ${GOLD_L}`, background: NAVY2, color: '#fff', minHeight: 52, fontFamily: 'inherit' }

export default function Game() {
  const [mode, setMode] = useState<Mode>('home')
  const [items, setItems] = useState<Item[]>([])
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [right, setRight] = useState(0)
  const [streak, setStreak] = useState(0)
  const [results, setResults] = useState<{ city?: string; ok: boolean }[]>([])
  const [left, setLeft] = useState(LIMIT)
  const [noTimer, setNoTimer] = useState(false)
  // 11.11.2026: таймер лишається завжди (щоб не шукали відповіді в ШІ); «більше часу» — 40 с замість 20 для тих, кому треба.
  const lim = noTimer ? SLOW : LIMIT
  const head = useRef<HTMLHeadingElement>(null)

  useEffect(() => { head.current?.focus() }, [mode, i])

  function start() {
    const pool = shuffle(QUESTIONS).slice(0, ROUND)
    setItems(pool.map((q) => ({ q, opts: shuffle([...q.o]) })))
    setI(0); setPicked(null); setScore(0); setRight(0); setStreak(0); setResults([]); setLeft(lim); setMode('quiz')
  }

  // Таймер: 20 секунд на запитання. Можна вимкнути — для тих, кому потрібно більше часу (екранні читачі, дислексія).
  useEffect(() => {
    if (mode !== 'quiz' || picked !== null) return
    if (left <= 0) { setPicked(''); setStreak(0); setResults((r) => [...r, { city: items[i]?.q.city, ok: false }]); return }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [mode, picked, left])

  function answer(o: string) {
    if (picked !== null) return
    setPicked(o)
    const good = o === items[i].q.o[0]
    setResults((r) => [...r, { city: items[i].q.city, ok: good }])
    // серія: від 3 правильних поспіль — +50 за кожну наступну
    if (good) { const st = streak + 1; setStreak(st); setRight((x) => x + 1); setScore((s) => s + 100 + Math.round((left * 5 * LIMIT) / lim) + (st >= 3 ? 50 : 0)) }
    else setStreak(0)
  }
  function next() {
    if (i + 1 >= items.length) { setMode('done'); fetch('/api/moia-ukraina?played=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {}); return }
    setI(i + 1); setPicked(null); setLeft(lim)
  }

  return (
    <div style={{ background: `radial-gradient(1200px 500px at 85% -10%, rgba(0,87,183,.35), transparent 60%), radial-gradient(900px 400px at -10% 110%, rgba(255,215,0,.12), transparent 60%), ${NAVY}`, color: '#fff', minHeight: '100vh', padding: '0 0 60px' }}>
      <div aria-hidden="true" style={{ height: 10, background: 'linear-gradient(#0057B7 0 50%, #FFD700 50% 100%)' }} />
      <div style={{ padding: '24px 16px 0' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <nav aria-label="Навігація" style={{ marginBottom: 14, fontSize: 15 }}><a href="/" style={{ color: GOLD_L, textDecoration: 'none' }}>← Балабони</a> <span style={{ color: SOFT }}>·</span> <a href="/games" style={{ color: GOLD_L, textDecoration: 'none' }}>Ігри</a> <span style={{ color: SOFT }}>·</span> <a href="/skoromovky" style={{ color: GOLD_L, textDecoration: 'none' }}>Скоромовки</a></nav>
        <p style={{ margin: 0, color: GOLD_L, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><Flag />Моє місце · голоси молоді України</p>
        {mode === 'home' && <Home onQuiz={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} onSuggest={() => setMode('suggest')} onFind={() => setMode('find')} onOblasti={() => setMode('oblasti')} onDaily={() => setMode('daily')} noTimer={noTimer} setNoTimer={setNoTimer} head={head} />}
        {mode === 'quiz' && items[i] && (
          <QuizStep item={items[i]} n={i} picked={picked} left={left} lim={lim} score={score} streak={streak} onAnswer={answer} onNext={next} head={head} />
        )}
        {mode === 'done' && <Done score={score} right={right} results={results} onAgain={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} head={head} />}
        {mode === 'map' && <MyMap onBack={() => setMode('home')} head={head} />}
        {mode === 'find' && <Find onBack={() => setMode('home')} head={head} />}
        {mode === 'oblasti' && <Oblasti onBack={() => setMode('home')} head={head} />}
        {mode === 'daily' && <Daily onBack={() => setMode('home')} head={head} />}
        {mode === 'suggest' && <Suggest onBack={() => setMode('home')} head={head} />}
        {mode === 'rating' && <Rating onBack={() => setMode('home')} onQuiz={start} head={head} />}
        <p style={{ marginTop: 40, fontSize: 14, color: SOFT, opacity: 0.8, lineHeight: 1.5 }}>
          Демоверсія гри проєкту «Моє місце: голоси молоді України» · ЛОГО «Інститут громадянського суспільства» (Львів).
          Без реєстрації. Ми не збираємо імен і персональних даних дітей. Крим — це Україна.
          {' '}Гру створено власними силами організації. Сподіваємося на підтримку держави та грантодавців, щоб розвивати її далі.
        </p>
      </div>
      </div>
    </div>
  )
}

type HeadRef = React.RefObject<HTMLHeadingElement | null>
const H = ({ head, children }: { head: HeadRef; children: React.ReactNode }) => (
  <h1 ref={head} tabIndex={-1} style={{ fontSize: 'clamp(28px,5vw,42px)', lineHeight: 1.15, margin: '8px 0 14px', outline: 'none' }}>{children}</h1>
)

function Home({ onQuiz, onMap, onRating, onSuggest, onFind, onOblasti, onDaily, noTimer, setNoTimer, head }: { onQuiz: () => void; onMap: () => void; onRating: () => void; onSuggest: () => void; onFind: () => void; onOblasti: () => void; onDaily: () => void; noTimer: boolean; setNoTimer: (v: boolean) => void; head: HeadRef }) {
  const [stats, setStats] = useState<{ games: number; schools: number } | null>(null)
  useEffect(() => { fetch('/api/moia-ukraina?stats=1', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j?.ok) setStats(j.stats) }).catch(() => {}) }, [])
  return (
    <>
      <H head={head}>Моя Україна на мапі</H>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: SOFT, marginTop: 0 }}>
        Гра про міста України, їхню історію і пам’ять. Відповідай на запитання, позначай на мапі рідне місто і змагайся за свою школу.
        {' '}Понад {Math.floor(QUESTIONS.length / 10) * 10} запитань: історія, пам’ять, культура, природа, держава.
      </p>
      <div style={{ ...card, margin: '14px 0 0', borderColor: '#FFD700', background: 'linear-gradient(135deg, rgba(0,87,183,.35), rgba(255,215,0,.10))' }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: GOLD_L }}>Грай і перемагай</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginTop: 10 }}>
          <Prize icon="shirt" t="Футболки для класу" d="Три класи-переможці всеукраїнського етапу отримають футболки гри на весь клас." />
          <Prize icon="cert" t="Сертифікати" d="Іменні сертифікати учням і дипломи школам-учасницям — надішлемо поштою." />
          <Prize icon="star" t="Твоє запитання в грі" d="Найкращі запитання учнів додаємо в гру з іменем автора — уже зараз." />
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 14, color: SOFT }}>Всеукраїнський етап із призами для класів плануємо провести у 2027 році. Грай уже зараз і набирай бали для своєї школи.</p>
      </div>
      <Explorer />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
        <button style={{ ...btn('#FFD700'), boxShadow: '0 0 0 3px #0057B7 inset' }} onClick={onDaily}>Місто дня<span style={{ display: 'block', fontSize: '.8em', fontWeight: 600, opacity: .85 }}>нова загадка щодня</span></button>
        <button style={btn(GOLD)} onClick={onQuiz}>Почати вікторину<span style={{ display: 'block', fontSize: '.8em', fontWeight: 600, opacity: .85 }}>10 запитань</span></button>
        <button style={btn(GOLD_L)} onClick={onFind}>Знайди місто на мапі<span style={{ display: 'block', fontSize: '.8em', fontWeight: 600, opacity: .85 }}>5 раундів</span></button>
        <button style={btn(GOLD_L)} onClick={onOblasti}>Наклацай область<span style={{ display: 'block', fontSize: '.8em', fontWeight: 600, opacity: .85 }}>усі 25 на час</span></button>
        <button style={btn(GOLD_L)} onClick={onMap}>Моя мапа: звідки я і де я зараз</button>
        <button style={btn('#2A4566', '#fff')} onClick={onRating}>Рейтинг шкіл</button>
        <button style={btn('#2A4566', '#fff')} onClick={onSuggest}>Запропонуй запитання про своє місто</button>
      </div>
      <TopSchools onRating={onRating} />
      <Rules />
      {stats && stats.games > 0 && <p style={{ margin: '14px 0 0', fontSize: 17, color: SOFT }}>Зіграно ігор: <b style={{ color: GOLD_L }}>{stats.games}</b> · Шкіл у рейтингу: <b style={{ color: GOLD_L }}>{stats.schools}</b></p>}
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, fontSize: 17, color: SOFT, cursor: 'pointer' }}>
        <input type="checkbox" checked={noTimer} onChange={(e) => setNoTimer(e.target.checked)} style={{ width: 22, height: 22 }} />
        Більше часу на відповідь — 40 секунд замість 20
      </label>
    </>
  )
}

function QuizStep({ item, n, picked, left, lim, score, streak, onAnswer, onNext, head }: { item: Item; n: number; picked: string | null; left: number; lim: number; score: number; streak: number; onAnswer: (o: string) => void; onNext: () => void; head: HeadRef }) {
  const { q, opts } = item
  const city = q.city ? byName.get(q.city) : undefined
  const ok = picked !== null && picked === q.o[0]
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <span style={{ background: '#2A4566', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 15 }}>{q.c}</span>
        {streak >= 2 && <span style={{ background: 'linear-gradient(90deg,#0057B7,#FFD700)', color: NAVY, borderRadius: 999, padding: '6px 14px', fontWeight: 900, fontSize: 15 }}>Серія ×{streak}{streak >= 3 ? ' · +50' : ''}</span>}
        <span style={{ fontSize: 17, color: SOFT }}>Запитання {n + 1} з {ROUND} · <b style={{ color: GOLD_L }}>{score} балів</b></span>
      </div>
      {(
        <div aria-hidden="true" style={{ height: 8, background: '#2A4566', borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(left / lim) * 100}%`, background: left > 6 ? GOLD : RED, transition: 'width 1s linear' }} />
        </div>
      )}
      <H head={head}><span style={{ fontSize: 'clamp(22px,3.6vw,30px)' }}>{q.q}</span></H>
      {picked === null && <p style={{ margin: '0 0 12px', color: SOFT, fontSize: 16 }}>Залишилось {left} с</p>}
      <div style={{ display: 'grid', gap: 10 }}>
        {opts.map((o) => {
          const isRight = o === q.o[0]
          let bg = NAVY2, border = '2px solid #2A4566'
          if (picked !== null && isRight) { bg = 'rgba(54,171,98,.25)'; border = `2px solid ${GREEN}` }
          else if (picked === o) { bg = 'rgba(232,67,75,.22)'; border = `2px solid ${RED}` }
          return (
            <button key={o} onClick={() => onAnswer(o)} disabled={picked !== null} aria-pressed={picked === o}
              style={{ textAlign: 'left', background: bg, border, color: '#fff', borderRadius: 14, padding: '14px 16px', fontSize: 19, cursor: picked === null ? 'pointer' : 'default', minHeight: 56, fontFamily: 'inherit' }}>
              {o}{picked !== null && isRight ? ' ✓' : ''}
            </button>
          )
        })}
      </div>
      <div aria-live="polite">
        {picked !== null && (
          <div style={{ ...card, marginTop: 16 }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: ok ? GREEN : picked === '' ? GOLD_L : RED }}>
              {ok ? 'Правильно!' : picked === '' ? `Час вийшов. Правильна відповідь: ${q.o[0]}` : `Правильна відповідь: ${q.o[0]}`}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 18, lineHeight: 1.5, color: SOFT }}>{q.w}</p>
            {city && (
              <div style={{ marginTop: 12 }}>
                <UaMap marks={[{ city, color: city.tot ? BLUE : GOLD_L }]} label={`Мапа: ${city.n}`} />
                {city.tot && <p style={{ margin: '8px 0 0', color: GOLD_L, fontWeight: 700 }}>{city.n}. {TOT_NOTE}</p>}
              </div>
            )}
            <button style={{ ...btn(GOLD), marginTop: 14, width: '100%' }} onClick={onNext}>{n + 1 >= ROUND ? 'Мій результат' : 'Далі'}</button>
          </div>
        )}
      </div>
    </>
  )
}

const CLASSES = ['5', '6', '7', '8', '9', '10', '11']

function Done({ score, right, results, onAgain, onMap, onRating, head }: { score: number; right: number; results: { city?: string; ok: boolean }[]; onAgain: () => void; onMap: () => void; onRating: () => void; head: HeadRef }) {
  const [city, setCity] = useState('')
  const [school, setSchool] = useState('')
  const [cls, setCls] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!city || !school || !cls) return
    setState('busy')
    try {
      const r = await fetch('/api/moia-ukraina', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city, school: Number(school), cls, score, right }) })
      setState(r.ok ? 'ok' : 'err')
    } catch { setState('err') }
  }
  return (
    <>
      <Confetti />
      <p style={{ margin: '10px 0 0', fontSize: 15, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: GOLD_L }}>Твоє звання</p>
      <H head={head}>{rank(right).t}</H>
      <p style={{ fontSize: 19, color: SOFT, marginTop: 0, lineHeight: 1.5 }}>{rank(right).d} Результат: <b style={{ color: GOLD_L }}>{score} балів</b>, правильних відповідей — <b style={{ color: GOLD_L }}>{right} з {ROUND}</b>.</p>
      <Discoveries results={results} />
      <form onSubmit={send} style={{ ...card, display: 'grid', gap: 12, marginTop: 10 }}>
        <p style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>Додай бали своїй школі</p>
        <p style={{ margin: 0, fontSize: 16, color: SOFT }}>Лише місто, номер школи й клас — без імен.</p>
        <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>Місто
          <select required value={city} onChange={(e) => setCity(e.target.value)} style={sel}>
            <option value="">Обери місто</option>
            {sortedCities.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
          </select>
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>Школа №
            <input required inputMode="numeric" pattern="[0-9]{1,3}" maxLength={3} value={school} onChange={(e) => setSchool(e.target.value.replace(/\D/g, ''))} style={sel} placeholder="43" />
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>Клас
            <select required value={cls} onChange={(e) => setCls(e.target.value)} style={sel}>
              <option value="">—</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <button type="submit" disabled={state === 'busy' || state === 'ok'} style={btn(GOLD)}>{state === 'ok' ? 'Бали зараховано!' : state === 'busy' ? 'Надсилаємо…' : 'Зарахувати бали школі'}</button>
        <p aria-live="polite" style={{ margin: 0, color: state === 'err' ? GOLD_L : SOFT, fontSize: 16 }}>
          {state === 'err' && 'Рейтинг тимчасово недоступний. Твій результат не втрачено — спробуй пізніше.'}
          {state === 'ok' && 'Дякуємо! Подивись, яке місце посідає твоя школа.'}
        </p>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
        <button style={btn(GOLD_L)} onClick={onAgain}>Грати ще раз</button>
        <button style={btn('#2A4566', '#fff')} onClick={onRating}>Рейтинг шкіл</button>
        <button style={btn('#2A4566', '#fff')} onClick={onMap}>Моя мапа</button>
      </div>
    </>
  )
}

function MyMap({ onBack, head }: { onBack: () => void; head: HeadRef }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const a = byName.get(from), b = byName.get(to)
  const d = a && b ? km(a, b) : null
  const marks = [a && { city: a, color: GOLD_L, label: `${a.n} · рідне` }, b && { city: b, color: BLUE, label: `${b.n} · зараз` }].filter(Boolean) as { city: City; color: string; label: string }[]
  return (
    <>
      <H head={head}>Моя мапа: звідки я і де я зараз</H>
      <p style={{ fontSize: 18, color: SOFT, marginTop: 0, lineHeight: 1.5 }}>Обери рідне місто і місто, де живеш зараз. Ми протягнемо між ними нитку й порахуємо відстань.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>Моє рідне місто
          <select value={from} onChange={(e) => setFrom(e.target.value)} style={sel}>
            <option value="">Обери місто</option>
            {sortedCities.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>Де я зараз
          <select value={to} onChange={(e) => setTo(e.target.value)} style={sel}>
            <option value="">Обери місто</option>
            {sortedCities.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
          </select>
        </label>
      </div>
      <div style={{ ...card, padding: 10, marginTop: 16 }}>
        <UaMap geo regions="names" marks={marks} thread={a && b && a !== b ? [a, b] : undefined} label={a && b ? `Нитка від міста ${a.n} до міста ${b.n}` : 'Мапа України'} />
      </div>
      <div aria-live="polite" style={{ marginTop: 14 }}>
        {d !== null && a && b && (
          <div style={card}>
            {a === b
              ? <p style={{ margin: 0, fontSize: 20 }}>Ти живеш у рідному місті — {a.n}. Розкажи про нього у творі «Історія мого міста»!</p>
              : <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Від міста {a.n} до міста {b.n} — <span style={{ color: GOLD_L }}>{d} км</span> напрямки</p>}
            {a.tot && <p style={{ margin: '10px 0 0', fontSize: 19, color: GOLD_L, fontWeight: 700 }}>{a.n}. {TOT_NOTE}</p>}
          </div>
        )}
      </div>
      <button style={{ ...btn('#2A4566', '#fff'), marginTop: 16 }} onClick={onBack}>← На початок</button>
    </>
  )
}

function Rating({ onBack, onQuiz, head }: { onBack: () => void; onQuiz: () => void; head: HeadRef }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    fetch('/api/moia-ukraina', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j?.ok) setRows(j.rows); else setErr(true) }).catch(() => setErr(true))
  }, [])
  return (
    <>
      <H head={head}>Рейтинг шкіл</H>
      <p style={{ fontSize: 18, color: SOFT, marginTop: 0 }}>Бали всіх учнів школи додаються. Грайте класом — і ваша школа підніметься вгору.</p>
      {!rows && !err && <p style={{ color: SOFT }}>Завантажуємо…</p>}
      {err && <p style={{ color: GOLD_L }}>Рейтинг запрацює незабаром. Поки що грай і запам’ятовуй свої бали!</p>}
      {rows && rows.length === 0 && <p style={{ color: SOFT }}>Поки що тут порожньо. Стань першим!</p>}
      {rows && rows.length > 0 && (
        <div style={{ display: 'grid', gap: 16 }}>
          <SchoolTable rows={rows} limit={50} />
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 16 }}>
        <button style={btn(GOLD)} onClick={onQuiz}>Грати за свою школу</button>
        <button style={btn('#2A4566', '#fff')} onClick={onBack}>← На початок</button>
      </div>
    </>
  )
}

const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label style={{ display: 'grid', gap: 6, fontSize: 17 }}>{t}{children}</label>

// 11.11.2026: діти пропонують власні запитання про свої міста. Ніщо не публікується без перевірки ментором і психологом.
function Suggest({ onBack, head }: { onBack: () => void; head: HeadRef }) {
  const [f, setF] = useState({ city: '', place: '', q: '', a: '', w1: '', w2: '', w3: '', why: '', sign: '' })
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'err'>('idle')
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  async function send(e: React.FormEvent) {
    e.preventDefault()
    setState('busy')
    try {
      const r = await fetch('/api/moia-ukraina?suggest=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
      setState(r.ok ? 'ok' : 'err')
    } catch { setState('err') }
  }
  const inp: React.CSSProperties = { ...sel, borderColor: '#2A4566' }
  if (state === 'ok') return (
    <>
      <H head={head}>Дякуємо! Запитання надіслано</H>
      <p style={{ fontSize: 19, color: SOFT, lineHeight: 1.5 }}>Ментори перевірять його, і незабаром його розгадуватимуть школярі з усієї України. Хочеш додати ще одне?</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
        <button style={btn(GOLD)} onClick={() => { setF({ ...f, q: '', a: '', w1: '', w2: '', w3: '', why: '' }); setState('idle') }}>Ще одне запитання</button>
        <button style={btn('#2A4566', '#fff')} onClick={onBack}>← На початок</button>
      </div>
    </>
  )
  return (
    <>
      <H head={head}>Запропонуй запитання про своє місто</H>
      <p style={{ fontSize: 18, color: SOFT, marginTop: 0, lineHeight: 1.5 }}>Що цікавого є у твоєму рідному місті чи селі? Склади запитання — його розгадуватимуть інші учні. Не пиши прізвищ, адрес і даних про рідних. Ми перевіримо запитання, перш ніж додати його в гру.</p>
      <form onSubmit={send} style={{ ...card, display: 'grid', gap: 12 }}>
        <L t="Моє місто">
          <select required value={f.city} onChange={set('city')} style={inp}>
            <option value="">Обери місто</option>
            {sortedCities.map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
            <option value="Інше">Іншого міста чи села немає в списку</option>
          </select>
        </L>
        {f.city === 'Інше' && <L t="Назва міста чи села"><input required maxLength={40} value={f.place} onChange={set('place')} style={inp} /></L>}
        <L t="Запитання"><textarea required maxLength={200} rows={2} value={f.q} onChange={set('q')} style={{ ...inp, minHeight: 70 }} placeholder="Наприклад: Як називається найстаріша вулиця мого міста?" /></L>
        <L t="Правильна відповідь"><input required maxLength={80} value={f.a} onChange={set('a')} style={inp} /></L>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <L t="Хибна відповідь 1"><input required maxLength={80} value={f.w1} onChange={set('w1')} style={inp} /></L>
          <L t="Хибна відповідь 2"><input required maxLength={80} value={f.w2} onChange={set('w2')} style={inp} /></L>
          <L t="Хибна відповідь 3"><input required maxLength={80} value={f.w3} onChange={set('w3')} style={inp} /></L>
        </div>
        <L t="Коротке пояснення (необов’язково)"><textarea maxLength={300} rows={2} value={f.why} onChange={set('why')} style={{ ...inp, minHeight: 70 }} /></L>
        <L t="Підпис: ім’я та вік або псевдонім"><input required maxLength={40} value={f.sign} onChange={set('sign')} style={inp} placeholder="Оля, 13 або Мандрівниця" /></L>
        <button type="submit" disabled={state === 'busy'} style={btn(GOLD)}>{state === 'busy' ? 'Надсилаємо…' : 'Надіслати запитання'}</button>
        <p aria-live="polite" style={{ margin: 0, color: GOLD_L }}>{state === 'err' && 'Не вдалося надіслати. Спробуй ще раз за хвилину.'}</p>
      </form>
      <button style={{ ...btn('#2A4566', '#fff'), marginTop: 16 }} onClick={onBack}>← На початок</button>
    </>
  )
}

// Прапор, що майорить — власний малюнок (SVG), без готових іконок.
function Flag() {
  return (
    <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M2 3 Q10 0 17 3 T32 3 V12 Q24 9 17 12 T2 12 Z" fill="#0057B7">
        <animate attributeName="d" dur="2.4s" repeatCount="indefinite" values="M2 3 Q10 0 17 3 T32 3 V12 Q24 9 17 12 T2 12 Z;M2 3 Q10 6 17 3 T32 3 V12 Q24 15 17 12 T2 12 Z;M2 3 Q10 0 17 3 T32 3 V12 Q24 9 17 12 T2 12 Z" />
      </path>
      <path d="M2 12 Q10 9 17 12 T32 12 V21 Q24 18 17 21 T2 21 Z" fill="#FFD700">
        <animate attributeName="d" dur="2.4s" repeatCount="indefinite" values="M2 12 Q10 9 17 12 T32 12 V21 Q24 18 17 21 T2 21 Z;M2 12 Q10 15 17 12 T32 12 V21 Q24 24 17 21 T2 21 Z;M2 12 Q10 9 17 12 T32 12 V21 Q24 18 17 21 T2 21 Z" />
      </path>
      <rect x="0" y="1" width="2" height="23" rx="1" fill="#FAC775" />
    </svg>
  )
}

// Звання за кількістю правильних відповідей.
function rank(right: number) {
  if (right >= 10) return { t: 'Посол памʼяті', d: 'Ідеально! Ти знаєш Україну від Ужгорода до Луганська і від Чернігова до Криму.' }
  if (right >= 8) return { t: 'Знавець України', d: 'Чудовий результат — ти справжній знавець рідної країни.' }
  if (right >= 6) return { t: 'Краєзнавець', d: 'Добре! Ще кілька ігор — і станеш знавцем України.' }
  if (right >= 3) return { t: 'Мандрівник', d: 'Гарний початок подорожі Україною. Грай ще — запитання щоразу інші.' }
  return { t: 'Відкривач', d: 'Кожна гра відкриває нові міста. Спробуй ще раз!' }
}

// Мапа відкриттів: міста з цієї гри — золоті (відгадав), блакитні (ще варто дізнатися).
function Discoveries({ results }: { results: { city?: string; ok: boolean }[] }) {
  const seen = new Map<string, boolean>()
  for (const r of results) if (r.city && byName.has(r.city)) seen.set(r.city, (seen.get(r.city) ?? false) || r.ok)
  if (!seen.size) return null
  const marks = [...seen.entries()].map(([n, ok]) => ({ city: byName.get(n)!, color: ok ? GOLD_L : BLUE, label: '' }))
  return (
    <div style={{ ...card, padding: 12, margin: '6px 0 16px' }}>
      <p style={{ margin: '4px 6px 8px', fontSize: 18, fontWeight: 800 }}>Твоя мапа відкриттів</p>
      <UaMap marks={marks} showAll={false} label={`Міста з цієї гри: ${[...seen.keys()].join(', ')}`} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 6px 0' }}>{[...seen.entries()].map(([n, ok]) => <span key={n} style={{ border: `2px solid ${ok ? GOLD_L : BLUE}`, color: ok ? GOLD_L : '#CFE3FA', borderRadius: 999, padding: '4px 12px', fontSize: 15, fontWeight: 700 }}>{n}{byName.get(n)?.tot ? ' · памʼятаємо' : ''}</span>)}</div>
      <p style={{ margin: '8px 6px 2px', fontSize: 15, color: SOFT }}><span style={{ color: GOLD_L, fontWeight: 800 }}>Золоті</span> — відгадані міста, <span style={{ color: BLUE, fontWeight: 800 }}>блакитні</span> — ті, про які варто дізнатися більше.</p>
    </div>
  )
}

// Конфеті кольорів прапора — лише CSS, вимикається для тих, хто обрав «менше руху».
function Confetti() {
  const bits = Array.from({ length: 36 }, (_, k) => k)
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 5 }}>
      <style>{`@keyframes mu-fall{0%{transform:translateY(-20px) rotate(0)}100%{transform:translateY(110vh) rotate(540deg)}}@media (prefers-reduced-motion: reduce){.mu-c{display:none}}`}</style>
      {bits.map((k) => (
        <span key={k} className="mu-c" style={{ position: 'absolute', left: `${(k * 97) % 100}%`, top: -20, width: 9, height: 14, borderRadius: 2, background: k % 2 ? '#FFD700' : '#0057B7', animation: `mu-fall ${2.2 + (k % 5) * 0.35}s ${(k % 9) * 0.12}s ease-in forwards` }} />
      ))}
    </div>
  )
}

// Дослідник мапи: торкнись крапки — побачиш місто, особливості області й цікавий факт.
const UA_FACTS = ['603 628 км² — найбільша країна, що повністю лежить у Європі', '24 області, Автономна Республіка Крим, Київ і Севастополь', 'Кордон із 7 державами', 'Говерла — 2061 м', 'Дніпро — найдовша річка в межах України', 'Береги Чорного й Азовського морів']
function Explorer() {
  const [c, setC] = useState<City | null>(null)
  const [reg, setReg] = useState<Region | null>(null)
  const info = c ? OBL[c.n] : undefined
  const rInfo = reg ? OBL[reg.c] : undefined
  const fact = c ? QUESTIONS.find((q) => q.city === c.n)?.w : undefined
  return (
    <div style={{ margin: '18px 0' }}>
      <div style={{ ...card, padding: 10 }}>
        <UaMap geo regions="zoom" onRegion={(r) => { setReg(r); setC(null) }} onPick={setC} active={c?.n} label="Інтерактивна мапа України: області, міста, річки, моря й гори. Оберіть область, щоб збільшити її, або місто, щоб дізнатися про нього." />
        <p style={{ margin: '6px 8px 4px', fontSize: 15, color: SOFT }}>Торкнись області — вона збільшиться з назвами міст. Торкнись крапки — дізнаєшся про місто. Зірка — столиця, трикутник — Говерла.</p>
      </div>
      <div aria-live="polite">
        {reg && !c && (
          <div style={{ ...card, marginTop: 12, borderColor: '#FFD700' }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{rInfo?.o ?? reg.n}</p>
            {reg.cities.some((n) => CITIES.find((x) => x.n === n)?.tot) && <p style={{ margin: '2px 0 8px', color: GOLD_L, fontWeight: 700 }}>{TOT_NOTE}</p>}
            {rInfo && <ul style={{ margin: '6px 0 10px', paddingLeft: 22, display: 'grid', gap: 4, fontSize: 18, lineHeight: 1.45 }}>{rInfo.f.map((x) => <li key={x}>{x}</li>)}</ul>}
            <p style={{ margin: '0 0 8px', color: SOFT, fontSize: 16 }}>Міста цієї області в грі — обери будь-яке:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {reg.cities.map((n) => { const x = CITIES.find((q) => q.n === n); return x ? <button key={n} type="button" onClick={() => setC(x)} style={{ background: 'rgba(0,87,183,.35)', color: '#fff', border: '1px solid rgba(255,215,0,.6)', borderRadius: 999, padding: '7px 14px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>{n}</button> : null })}
            </div>
          </div>
        )}
        {c && (
          <div style={{ ...card, marginTop: 12, borderColor: '#FFD700' }}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{c.n}</p>
            {info && <p style={{ margin: '2px 0 8px', color: GOLD_L, fontWeight: 700 }}>{info.o}</p>}
            {c.tot && <p style={{ margin: '0 0 8px', color: GOLD_L, fontWeight: 700 }}>{TOT_NOTE}</p>}
            {info && <ul style={{ margin: '0 0 6px', paddingLeft: 22, display: 'grid', gap: 4, fontSize: 18, lineHeight: 1.45 }}>{info.f.map((x) => <li key={x}>{x}</li>)}</ul>}
            {fact && <p style={{ margin: '6px 0 0', fontSize: 17, color: SOFT, lineHeight: 1.5 }}><b style={{ color: '#fff' }}>Чи знаєш ти?</b> {fact}</p>}
            {!info && !fact && <p style={{ margin: 0, color: SOFT }}>Знаєш щось цікаве про це місто? Запропонуй запитання — і його розгадуватимуть інші учні.</p>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {UA_FACTS.map((x) => <span key={x} style={{ background: 'rgba(0,87,183,.25)', border: '1px solid rgba(255,215,0,.45)', borderRadius: 999, padding: '6px 12px', fontSize: 15 }}>{x}</span>)}
      </div>
    </div>
  )
}

// Гра «Знайди місто на мапі»: 5 обласних центрів, торкнись місця на мапі без підказок-крапок.
function Find({ onBack, head }: { onBack: () => void; head: HeadRef }) {
  const pool = useMemo(() => shuffle(CITIES.filter((c) => c.obl)).slice(0, 5), [])
  const [k, setK] = useState(0)
  const [guess, setGuess] = useState<{ lat: number; lon: number } | null>(null)
  const [total, setTotal] = useState(0)
  const [log, setLog] = useState<number[]>([])
  const target = pool[k]
  const done = k >= pool.length
  function pick(lat: number, lon: number) {
    if (guess || done) return
    setGuess({ lat, lon })
    const d = km(target, { n: '', lat, lon })
    const pts = d <= 25 ? 100 : Math.max(0, Math.round(100 - (d - 25) / 4))
    setTotal((x) => x + pts); setLog((l) => [...l, d])
  }
  if (done) {
    const avg = Math.round(log.reduce((a, b) => a + b, 0) / log.length)
    return (
      <>
        <Confetti />
        <H head={head}>{total} балів із 500</H>
        <p style={{ fontSize: 19, color: SOFT, lineHeight: 1.5 }}>У середньому ти помилявся на <b style={{ color: GOLD_L }}>{avg} км</b>. {avg <= 50 ? 'Ти знаєш мапу України як справжній штурман!' : avg <= 150 ? 'Добре! Ще трохи — і знатимеш мапу напамʼять.' : 'Спробуй ще раз — річки й моря на мапі допоможуть зорієнтуватися.'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          <button style={btn(GOLD)} onClick={() => { setK(0); setGuess(null); setTotal(0); setLog([]) }}>Грати ще раз</button>
          <button style={btn('#2A4566', '#fff')} onClick={onBack}>← На початок</button>
        </div>
      </>
    )
  }
  const gc: City | null = guess ? { n: 'Твоя позначка', lat: guess.lat, lon: guess.lon } : null
  const d = guess ? log[log.length - 1] : 0
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8, color: SOFT, fontSize: 17 }}>
        <span>Раунд {k + 1} з {pool.length}</span><b style={{ color: GOLD_L }}>{total} балів</b>
      </div>
      <H head={head}>Де на мапі місто {target.n}?</H>
      <p style={{ margin: '0 0 12px', color: SOFT, fontSize: 17 }}>Торкнись мапи там, де, на твою думку, це місто. Чим ближче — тим більше балів.</p>
      <div style={{ ...card, padding: 10 }}>
        <UaMap geo regions="names" showAll={false} onMapClick={pick}
          marks={guess && gc ? [{ city: gc, color: BLUE, label: '' }, { city: target, color: '#FFD700' }] : []}
          thread={guess && gc ? [gc, target] : undefined} label={`Мапа для пошуку міста ${target.n}`} />
      </div>
      <div aria-live="polite">
        {guess && (
          <div style={{ ...card, marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 21, fontWeight: 800, color: d <= 25 ? GREEN : d <= 100 ? GOLD_L : '#fff' }}>{d <= 25 ? 'Влучно!' : `Ти помилився на ${d} км`}</p>
            {OBL[target.n] && <p style={{ margin: '6px 0 0', color: SOFT, fontSize: 17 }}>{target.n} — центр: {OBL[target.n].o}. {OBL[target.n].f[0]}.</p>}
            {target.tot && <p style={{ margin: '6px 0 0', color: GOLD_L, fontWeight: 700 }}>{TOT_NOTE}</p>}
            <button style={{ ...btn(GOLD), marginTop: 12, width: '100%' }} onClick={() => { setGuess(null); setK(k + 1) }}>{k + 1 >= pool.length ? 'Мій результат' : 'Далі'}</button>
          </div>
        )}
      </div>
      <button style={{ ...btn('#2A4566', '#fff'), marginTop: 16 }} onClick={onBack}>← На початок</button>
    </>
  )
}

// Призи — власні прості SVG-піктограми в кольорах прапора (без готових іконок).
function Prize({ icon, t, d }: { icon: 'shirt' | 'cert' | 'star'; t: string; d: string }) {
  const g = icon === 'shirt'
    ? <path d="M9 4 L4 7 L6 12 L9 11 V22 H21 V11 L24 12 L26 7 L21 4 Q15 8 9 4 Z" fill="#0057B7" stroke="#FFD700" strokeWidth="1.6" strokeLinejoin="round" />
    : icon === 'cert'
      ? <g><rect x="4" y="5" width="22" height="16" rx="2" fill="#0057B7" stroke="#FFD700" strokeWidth="1.6" /><path d="M8 10 H22 M8 14 H17" stroke="#FFD700" strokeWidth="1.6" strokeLinecap="round" /><circle cx="21" cy="21" r="4" fill="#FFD700" /></g>
      : <path d="M15 3 L18.5 10.5 L26.5 11.3 L20.5 16.7 L22.3 24.5 L15 20.5 L7.7 24.5 L9.5 16.7 L3.5 11.3 L11.5 10.5 Z" fill="#FFD700" stroke="#0057B7" strokeWidth="1.6" strokeLinejoin="round" />
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <svg width="40" height="40" viewBox="0 0 30 28" aria-hidden="true" style={{ flex: 'none' }}>{g}</svg>
      <div><div style={{ fontWeight: 800, fontSize: 18 }}>{t}</div><div style={{ color: SOFT, fontSize: 15, lineHeight: 1.45 }}>{d}</div></div>
    </div>
  )
}

// Правила гри й умови участі (11.11.2026).
function Rules() {
  const h: React.CSSProperties = { margin: '16px 0 6px', fontSize: 19 }
  const ul: React.CSSProperties = { margin: 0, paddingLeft: 22, display: 'grid', gap: 5, fontSize: 17, lineHeight: 1.5, color: '#E6EEF8' }
  return (
    <details style={{ ...card, marginTop: 16 }}>
      <summary style={{ cursor: 'pointer', fontSize: 19, fontWeight: 800, color: GOLD_L }}>Правила гри й умови участі</summary>
      <h2 style={h}>Хто може грати</h2>
      <ul style={ul}>
        <li>Учні 5–11 класів з усієї України і з-за кордону. Молодші — разом із дорослими.</li>
        <li>Гра безкоштовна й без реєстрації.</li>
      </ul>
      <h2 style={h}>Вікторина</h2>
      <ul style={ul}>
        <li>10 випадкових запитань із банку; щоразу набір інший.</li>
        <li>На відповідь — 20 секунд (у режимі «більше часу» — 40).</li>
        <li>Правильна відповідь — 100 балів, плюс бонус за швидкість до 100 балів.</li>
        <li>Серія: від трьох правильних відповідей поспіль — ще +50 за кожну.</li>
        <li>Звання наприкінці залежить від кількості правильних відповідей.</li>
      </ul>
      <h2 style={h}>Знайди місто на мапі</h2>
      <ul style={ul}>
        <li>5 раундів. Торкнись мапи там, де, на твою думку, назване місто.</li>
        <li>Помилка до 25 км — 100 балів; що далі, то менше балів.</li>
      </ul>
      <h2 style={h}>Рейтинг шкіл</h2>
      <ul style={ul}>
        <li>Після вікторини обери місто, номер школи й клас — бали додаються до рахунку школи.</li>
        <li>Рейтинг лише шкіл: ми не змагаємося містами чи регіонами.</li>
        <li>Чесна гра: явно неможливі чи підозрілі результати ми видаляємо.</li>
      </ul>
      <h2 style={h}>Запропонуй запитання про своє місто</h2>
      <ul style={ul}>
        <li>Запитання має бути твоїм власним і спиратися на правдиві факти.</li>
        <li>Не пиши прізвищ, адрес, номерів телефонів і жодних даних про рідних — особливо тих, хто на окупованих територіях чи в полоні.</li>
        <li>Кожне запитання перевіряють ментори й психолог; ми можемо його відредагувати або не опублікувати.</li>
        <li>Підпис — лише імʼя та вік або псевдонім. Запитання видалимо на прохання автора чи батьків.</li>
      </ul>
      <h2 style={h}>Всеукраїнський етап і призи</h2>
      <ul style={ul}>
        <li>Всеукраїнський етап для шкіл плануємо провести у 2027 році, якщо проєкт отримає фінансування. Строки й умови оголосимо окремо на цій сторінці.</li>
        <li>Призи лише негрошові: футболки гри для трьох класів-переможців, іменні сертифікати учням і дипломи школам.</li>
      </ul>
      <h2 style={h}>Дані</h2>
      <ul style={ul}>
        <li>Ми не збираємо імен і персональних даних дітей. Для рейтингу зберігаємо лише місто, номер школи, клас і бали.</li>
        <li>Організатор — Львівська обласна громадська організація «Інститут громадянського суспільства». Питання й прохання: mksbog@ukr.net.</li>
      </ul>
    </details>
  )
}

const games = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'гра' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'гри' : 'ігор')
const MEDAL = ['#FFD700', '#C9D3DE', '#D99A5B']

// Рейтингова таблиця шкіл: місце, школа, бали, кількість ігор.
function SchoolTable({ rows, limit }: { rows: Row[]; limit: number }) {
  const th: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase', color: GOLD_L, borderBottom: '2px solid #FFD700' }
  const td: React.CSSProperties = { padding: '11px 12px', borderBottom: '1px solid #2A4566', fontSize: 18 }
  return (
    <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
        <caption style={{ textAlign: 'left', padding: '14px 14px 6px', fontSize: 20, fontWeight: 800 }}>Рейтинг шкіл</caption>
        <thead><tr><th scope="col" style={{ ...th, width: 64 }}>Місце</th><th scope="col" style={th}>Школа</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Бали</th><th scope="col" style={{ ...th, textAlign: 'right' }}>Ігор</th></tr></thead>
        <tbody>
          {rows.slice(0, limit).map((r, k) => (
            <tr key={r.city + r.school} style={{ background: k < 3 ? 'rgba(255,215,0,.07)' : 'transparent' }}>
              <td style={td}>
                {k < 3
                  ? <span aria-label={`${k + 1} місце`} style={{ display: 'inline-grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: MEDAL[k], color: NAVY, fontWeight: 900 }}>{k + 1}</span>
                  : <span style={{ paddingLeft: 9, color: SOFT, fontWeight: 700 }}>{k + 1}</span>}
              </td>
              <td style={{ ...td, fontWeight: k < 3 ? 800 : 500 }}>{r.city}, школа №{r.school}{byName.get(r.city)?.tot ? <span style={{ color: GOLD_L, fontSize: 14 }}> · памʼятаємо</span> : null}</td>
              <td style={{ ...td, textAlign: 'right', color: GOLD_L, fontWeight: 800 }}>{r.points.toLocaleString('uk-UA')}</td>
              <td style={{ ...td, textAlign: 'right', color: SOFT }}>{r.players} <span style={{ fontSize: 14 }}>{games(r.players)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Топ-5 шкіл на головній сторінці гри.
function TopSchools({ onRating }: { onRating: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  useEffect(() => { fetch('/api/moia-ukraina', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j?.ok) setRows(j.rows) }).catch(() => {}) }, [])
  if (!rows) return null
  return (
    <div style={{ marginTop: 16 }}>
      {rows.length > 0
        ? <SchoolTable rows={rows} limit={5} />
        : <div style={{ ...card }}><p style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Рейтинг шкіл</p><p style={{ margin: '6px 0 0', color: SOFT, fontSize: 17 }}>Тут поки порожньо. Зіграй вікторину й зарахуй бали своїй школі — вона стане першою!</p></div>}
      {rows.length > 5 && <button style={{ ...btn('#2A4566', '#fff'), marginTop: 10 }} onClick={onRating}>Увесь рейтинг →</button>}
    </div>
  )
}

// ——— 11.11.2026: «Наклацай область» (ідея Seterra). Гра називає область — учень торкається її на мапі.
// 3 помилки на одній області — показуємо її й ідемо далі. Найкращий час зберігається лише в цьому браузері.
const regName = (r: Region) => (r.n === 'АР Крим' ? 'Автономна Республіка Крим' : `${r.n} область`)
const TARGETS = REGIONS.filter((r) => r.id !== 'UA-30' && r.id !== 'UA-40')
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
function store(key: string, v?: unknown) {
  try {
    if (v === undefined) { const x = localStorage.getItem(key); return x ? JSON.parse(x) : null }
    localStorage.setItem(key, JSON.stringify(v))
  } catch { /* приватний режим — просто не зберігаємо */ }
  return null
}

function Oblasti({ onBack, head }: { onBack: () => void; head: HeadRef }) {
  const [order, setOrder] = useState(() => shuffle(TARGETS))
  const [k, setK] = useState(0)
  const [fill, setFill] = useState<Record<string, string>>({})
  const [miss, setMiss] = useState(0)
  const [errs, setErrs] = useState(0)
  const [missed, setMissed] = useState(0)
  const [t0, setT0] = useState(() => Date.now())
  const [sec, setSec] = useState(0)
  const [msg, setMsg] = useState('')
  const [best, setBest] = useState<number | null>(null)
  const [isBest, setIsBest] = useState(false)
  const done = k >= order.length
  const target = order[k]
  useEffect(() => { setBest(store('mu_obl_best')) }, [])
  useEffect(() => {
    if (done) return
    const t = setInterval(() => setSec(Math.floor((Date.now() - t0) / 1000)), 500)
    return () => clearInterval(t)
  }, [done, t0])
  function finish(total: number, missedN: number) {
    fetch('/api/moia-ukraina?played=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
    if (missedN === 0 && (best === null || total < best)) { store('mu_obl_best', total); setBest(total); setIsBest(true) }
  }
  function pick(r: Region) {
    if (done || fill[r.id] === GREEN || fill[r.id] === GOLD) return
    if (r.id === target.id) {
      setFill((f) => ({ ...f, [r.id]: GREEN })); setMsg(`Так! ${regName(r)}.`)
      setMiss(0); const nk = k + 1; setK(nk)
      if (nk >= order.length) { const total = Math.floor((Date.now() - t0) / 1000); setSec(total); finish(total, missed) }
      return
    }
    setErrs((x) => x + 1)
    const m = miss + 1
    setFill((f) => ({ ...f, [r.id]: RED }))
    setTimeout(() => setFill((f) => { if (f[r.id] !== RED) return f; const n = { ...f }; delete n[r.id]; return n }), 600)
    if (m >= 3) {
      setFill((f) => ({ ...f, [target.id]: GOLD })); setMsg(`Це ${regName(r)}. А ${regName(target)} — тут, підсвічено жовтим.`)
      setMiss(0); setMissed((x) => x + 1); const nk = k + 1; setK(nk)
      if (nk >= order.length) { const total = Math.floor((Date.now() - t0) / 1000); setSec(total); finish(total, missed + 1) }
    } else { setMiss(m); setMsg(`Ні, це ${regName(r)}. Спробуй ще (${3 - m}).`) }
  }
  function again() { setOrder(shuffle(TARGETS)); setK(0); setFill({}); setMiss(0); setErrs(0); setMissed(0); setT0(Date.now()); setSec(0); setMsg(''); setIsBest(false) }
  const found = Object.fromEntries(Object.entries(fill).filter(([, c]) => c === GREEN || c === GOLD).map(([id]) => [id, TARGETS.find((x) => x.id === id)?.n ?? ''])) as Record<string, string>
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8, color: SOFT, fontSize: 17 }}>
        <span>{Math.min(k + 1, order.length)} з {order.length}</span>
        <b style={{ color: GOLD_L, fontVariantNumeric: 'tabular-nums' }}>{mmss(sec)}</b>
      </div>
      {!done ? <H head={head}>Де {regName(target)}?</H> : <H head={head}>{missed === 0 ? `Усі області за ${mmss(sec)}!` : `Готово: ${order.length - missed} з ${order.length}`}</H>}
      <div style={{ ...card, padding: 10 }}>
        <UaMap showAll={false} regionFill={fill} onRegionClick={done ? undefined : pick} regionLabel={found} label={done ? 'Мапа областей України' : `Знайди на мапі: ${regName(target)}`} />
      </div>
      <p aria-live="polite" style={{ minHeight: 26, margin: '10px 0 0', fontSize: 18, color: msg.startsWith('Так') ? GREEN : GOLD_L, fontWeight: 700 }}>{msg}</p>
      {done && (
        <>
          {done && miss === 0 && msg && null}
          <div style={{ ...card, marginTop: 8 }}>
            <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5 }}>Час: <b>{mmss(sec)}</b> · помилок: <b>{errs}</b>{missed ? <> · підказок: <b>{missed}</b></> : null}</p>
            {isBest && <p style={{ margin: '6px 0 0', color: GREEN, fontWeight: 800, fontSize: 19 }}>Новий рекорд!</p>}
            {!isBest && best !== null && <p style={{ margin: '6px 0 0', color: SOFT }}>Твій рекорд без підказок: {mmss(best)}</p>}
            <p style={{ margin: '6px 0 0', color: SOFT }}>{errs === 0 ? 'Жодної помилки — ти знаєш мапу України напамʼять!' : errs <= 5 ? 'Чудово! Ще одне коло — і буде без помилок.' : 'Зіграй ще раз — з кожним колом області запамʼятовуються краще.'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 12 }}>
            <button style={btn(GOLD)} onClick={again}>Грати ще раз</button>
            <button style={btn('#2A4566', '#fff')} onClick={onBack}>← На початок</button>
          </div>
        </>
      )}
      {!done && <button style={{ ...btn('#2A4566', '#fff'), marginTop: 16 }} onClick={onBack}>← На початок</button>}
    </>
  )
}

// ——— 11.11.2026: «Місто дня» (ідея Worldle). Одна загадка на день для всієї України, 6 спроб.
// Після кожної спроби — відстань і напрям. Після 3-ї — підказка: область. Серія днів — лише в цьому браузері.
const TRIES = 6
function kyivDay() {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }))
  return { n: Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000), s: `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}` }
}
// стабільне перемішування міст: однакове для всіх, повтор не раніше ніж через 69 днів
const DAILY = (() => {
  const a = [...CITIES].sort((x, y) => x.n.localeCompare(y.n, 'uk'))
  let seed = 20261111
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648 }
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
})()
const DIRS = ['північ', 'північний схід', 'схід', 'південний схід', 'південь', 'південний захід', 'захід', 'північний захід']
function bearing(a: City, b: City) {
  const dx = (b.lon - a.lon) * Math.cos(((a.lat + b.lat) / 2) * Math.PI / 180), dy = b.lat - a.lat
  return ((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360
}
const heat = (d: number) => (d === 0 ? GREEN : d <= 100 ? '#FFD700' : d <= 250 ? GOLD : d <= 450 ? '#E07A3F' : BLUE)
function Arrow({ deg, color }: { deg: number; color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" style={{ transform: `rotate(${deg}deg)`, flex: 'none' }}>
      <circle cx="15" cy="15" r="14" fill="rgba(255,255,255,.08)" stroke={color} strokeWidth="1.5" />
      <path d="M15 5 L21 16 L16.5 14.5 L16.5 24 L13.5 24 L13.5 14.5 L9 16 Z" fill={color} />
    </svg>
  )
}

function Daily({ onBack, head }: { onBack: () => void; head: HeadRef }) {
  const day = useMemo(kyivDay, [])
  const target = DAILY[((day.n % DAILY.length) + DAILY.length) % DAILY.length]
  const region = REGIONS.find((r) => r.id !== 'UA-30' && r.cities.includes(target.n))
  const [g, setG] = useState<string[]>([])
  const [choice, setChoice] = useState('')
  const [streak, setStreak] = useState(0)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    const s = store('mu_daily')
    if (s?.day === day.n && Array.isArray(s.g)) setG(s.g)
    const st = store('mu_daily_streak')
    if (st && (st.last === day.n || st.last === day.n - 1)) setStreak(st.n)
  }, [day.n])
  const won = g.includes(target.n)
  const over = won || g.length >= TRIES
  function guess() {
    if (over || !choice || g.includes(choice)) return
    const ng = [...g, choice]
    setG(ng); setChoice('')
    store('mu_daily', { day: day.n, g: ng })
    const fin = choice === target.n || ng.length >= TRIES
    if (fin) {
      fetch('/api/moia-ukraina?played=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).catch(() => {})
      if (choice === target.n) {
        const st = store('mu_daily_streak')
        const n = st && st.last === day.n - 1 ? st.n + 1 : st && st.last === day.n ? st.n : 1
        store('mu_daily_streak', { last: day.n, n }); setStreak(n)
      } else { store('mu_daily_streak', { last: -1, n: 0 }); setStreak(0) }
    }
  }
  const rows = g.map((n) => { const c = byName.get(n)!; const d = n === target.n ? 0 : km(c, target); return { c, d, b: bearing(c, target) } })
  async function share() {
    const path = rows.map((r) => (r.d === 0 ? 'вгадав(-ла)!' : `${r.d} км`)).join(' → ')
    const text = `Моя Україна на мапі · Місто дня ${day.s}\n${won ? `Спроб: ${g.length} з ${TRIES}` : 'Сьогодні не вгадав(-ла)'} · ${path}\nhttps://balabony.com/moia-ukraina`
    try {
      if (navigator.share) { await navigator.share({ text }); return }
      await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500)
    } catch { /* скасовано */ }
  }
  const fact = QUESTIONS.find((q) => q.city === target.n)?.w ?? OBL[target.n]?.f[0]
  const marks = rows.map((r) => ({ city: r.c, color: heat(r.d), label: r.d === 0 ? r.c.n : '' }))
  if (over && !won) marks.push({ city: target, color: GREEN, label: target.n })
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8, color: SOFT, fontSize: 17 }}>
        <span>Місто дня · {day.s}</span><b style={{ color: GOLD_L }}>Серія: {streak} {streak % 10 === 1 && streak % 100 !== 11 ? 'день' : [2, 3, 4].includes(streak % 10) && ![12, 13, 14].includes(streak % 100) ? 'дні' : 'днів'}</b>
      </div>
      <H head={head}>{won ? `Так! Це ${target.n}` : over ? `Це було місто ${target.n}` : 'Яке місто сьогодні загадано?'}</H>
      {!over && <p style={{ margin: '0 0 12px', color: SOFT, fontSize: 17, lineHeight: 1.5 }}>Обери місто — і гра підкаже, скільки кілометрів до загаданого і в який бік. У тебе {TRIES} спроб. Нове місто — щодня опівночі.</p>}
      <div style={{ ...card, padding: 10 }}>
        <UaMap geo showAll={false} marks={marks} label={`Мапа спроб: ${g.join(', ') || 'ще немає'}`} />
      </div>
      {!over && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginTop: 12 }}>
          <label style={{ position: 'absolute', left: -9999 }} htmlFor="mu-daily">Місто</label>
          <select id="mu-daily" style={sel} value={choice} onChange={(e) => setChoice(e.target.value)}>
            <option value="">Обери місто…</option>
            {sortedCities.filter((c) => !g.includes(c.n)).map((c) => <option key={c.n} value={c.n}>{c.n}</option>)}
          </select>
          <button style={{ ...btn(GOLD), opacity: choice ? 1 : 0.6 }} disabled={!choice} onClick={guess}>Перевірити</button>
        </div>
      )}
      <ol aria-live="polite" style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 8 }}>
        {rows.map((r, i) => (
          <li key={r.c.n} style={{ display: 'flex', alignItems: 'center', gap: 12, background: NAVY2, borderRadius: 12, padding: '10px 14px', borderLeft: `6px solid ${heat(r.d)}` }}>
            <span style={{ color: SOFT, width: 18 }}>{i + 1}</span>
            <b style={{ flex: 1, fontSize: 18 }}>{r.c.n}</b>
            {r.d === 0 ? <b style={{ color: GREEN, fontSize: 18 }}>Влучно!</b> : <>
              <span style={{ fontSize: 18, fontWeight: 800, color: heat(r.d), fontVariantNumeric: 'tabular-nums' }}>{r.d} км</span>
              <Arrow deg={r.b} color={heat(r.d)} /><span className="sr-only" style={{ position: 'absolute', left: -9999 }}>на {DIRS[Math.round(r.b / 45) % 8]}</span>
            </>}
          </li>
        ))}
      </ol>
      {!over && g.length >= 3 && region && <p style={{ margin: '12px 0 0', color: GOLD_L, fontWeight: 700, fontSize: 18 }}>Підказка: це місто в {region.n === 'АР Крим' ? 'Автономній Республіці Крим' : `${region.n.replace(/ка$/, 'кій')} області`}.</p>}
      {over && (
        <div style={{ ...card, marginTop: 12, borderColor: won ? GREEN : GOLD_L }}>
          {won && <p style={{ margin: 0, fontSize: 21, fontWeight: 800, color: GREEN }}>{g.length === 1 ? 'З першої спроби — неймовірно!' : `Вгадано з ${g.length}-ї спроби!`}</p>}
          {target.tot && <p style={{ margin: '6px 0 0', color: GOLD_L, fontWeight: 700 }}>{TOT_NOTE}</p>}
          {fact && <p style={{ margin: '8px 0 0', fontSize: 17, color: SOFT, lineHeight: 1.5 }}><b style={{ color: '#fff' }}>Чи знаєш ти?</b> {fact}</p>}
          <p style={{ margin: '10px 0 0', color: SOFT }}>Наступне місто — завтра. Не загуби серію!</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginTop: 12 }}>
            <button style={btn(GOLD)} onClick={share}>{copied ? 'Скопійовано!' : 'Поділитися результатом'}</button>
            <button style={btn('#2A4566', '#fff')} onClick={onBack}>← На початок</button>
          </div>
        </div>
      )}
      {!over && <button style={{ ...btn('#2A4566', '#fff'), marginTop: 16 }} onClick={onBack}>← На початок</button>}
    </>
  )
}
