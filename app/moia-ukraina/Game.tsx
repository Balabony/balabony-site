'use client'

// 11.11.2026: гра «Моя Україна на мапі» — демоверсія для проєкту «Моє місце: голоси молоді України» (ЛОГО «ІГС»).
// Три режими: вікторина (10 випадкових запитань із банку), «Моя мапа» (нитка від рідного міста до теперішнього, відстань),
// рейтинг шкіл (місто + номер школи + клас; жодних імен і персональних даних дітей). Рейтингу міст свідомо немає — щоб не стравлювати регіони.

import { useEffect, useMemo, useRef, useState } from 'react'
import UaMap from './UaMap'
import { CITIES, QUESTIONS, TOT_NOTE, type City, type Q } from './data'

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

type Mode = 'home' | 'quiz' | 'done' | 'map' | 'rating' | 'suggest'
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
  // 11.11.2026: таймер лишається завжди (щоб не шукали відповіді в ШІ); «більше часу» — 40 с замість 20 для тих, кому треба.
  const lim = noTimer ? SLOW : LIMIT
  const head = useRef<HTMLHeadingElement>(null)

  useEffect(() => { head.current?.focus() }, [mode, i])

  function start() {
    const pool = shuffle(QUESTIONS).slice(0, ROUND)
    setItems(pool.map((q) => ({ q, opts: shuffle([...q.o]) })))
    setI(0); setPicked(null); setScore(0); setRight(0); setStreak(0); setResults([]); setLeft(lim); setMode('quiz')
  }

  // Таймер: 20 секунд на запитання. Можна вимкнути — для тих, кому потрібно більше часу (екранні читачі, дислексія).
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
    // серія: від 3 правильних поспіль — +50 за кожну наступну
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
        <p style={{ margin: 0, color: GOLD_L, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 14, display: 'flex', alignItems: 'center', gap: 10 }}><Flag />Моє місце · голоси молоді України</p>
        {mode === 'home' && <Home onQuiz={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} onSuggest={() => setMode('suggest')} noTimer={noTimer} setNoTimer={setNoTimer} head={head} />}
        {mode === 'quiz' && items[i] && (
          <QuizStep item={items[i]} n={i} picked={picked} left={left} lim={lim} score={score} streak={streak} onAnswer={answer} onNext={next} head={head} />
        )}
        {mode === 'done' && <Done score={score} right={right} results={results} onAgain={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} head={head} />}
        {mode === 'map' && <MyMap onBack={() => setMode('home')} head={head} />}
        {mode === 'suggest' && <Suggest onBack={() => setMode('home')} head={head} />}
        {mode === 'rating' && <Rating onBack={() => setMode('home')} onQuiz={start} head={head} />}
        <p style={{ marginTop: 40, fontSize: 14, color: SOFT, opacity: 0.8, lineHeight: 1.5 }}>
          Демоверсія гри проєкту «Моє місце: голоси молоді України» · ЛОГО «Інститут громадянського суспільства» (Львів).
          Без реєстрації. Ми не збираємо імен і персональних даних дітей. Крим — це Україна.
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

function Home({ onQuiz, onMap, onRating, onSuggest, noTimer, setNoTimer, head }: { onQuiz: () => void; onMap: () => void; onRating: () => void; onSuggest: () => void; noTimer: boolean; setNoTimer: (v: boolean) => void; head: HeadRef }) {
  const demo = useMemo(() => [byName.get('Львів')!, byName.get('Маріуполь')!], [])
  const [stats, setStats] = useState<{ games: number; schools: number } | null>(null)
  useEffect(() => { fetch('/api/moia-ukraina?stats=1', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j?.ok) setStats(j.stats) }).catch(() => {}) }, [])
  return (
    <>
      <H head={head}>Моя Україна на мапі</H>
      <p style={{ fontSize: 19, lineHeight: 1.55, color: SOFT, marginTop: 0 }}>
        Гра про міста України, їхню історію і пам’ять. Відповідай на запитання, позначай на мапі рідне місто і змагайся за свою школу.
        {' '}Понад {Math.floor(QUESTIONS.length / 10) * 10} запитань: історія, пам’ять, культура, природа, держава.
      </p>
      <div style={{ ...card, padding: 10, margin: '18px 0' }}>
        <UaMap marks={[{ city: demo[0], color: GOLD_L }, { city: demo[1], color: BLUE }]} thread={[demo[0], demo[1]]} label="Мапа України з ниткою від Львова до Маріуполя" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
        <button style={btn(GOLD)} onClick={onQuiz}>Почати вікторину · 10 запитань</button>
        <button style={btn(GOLD_L)} onClick={onMap}>Моя мапа: звідки я і де я зараз</button>
        <button style={btn('#2A4566', '#fff')} onClick={onRating}>Рейтинг шкіл</button>
        <button style={btn('#2A4566', '#fff')} onClick={onSuggest}>Запропонуй запитання про своє місто</button>
      </div>
      {stats && stats.games > 0 && <p style={{ margin: '14px 0 0', fontSize: 17, color: SOFT }}>Зіграно ігор: <b style={{ color: GOLD_L }}>{stats.games}</b> · Шкіл у рейтингу: <b style={{ color: GOLD_L }}>{stats.schools}</b></p>}
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, fontSize: 17, color: SOFT, cursor: 'pointer' }}>
        <input type="checkbox" checked={noTimer} onChange={(e) => setNoTimer(e.target.checked)} style={{ width: 22, height: 22 }} />
        Більше часу на відповідь — 40 секунд замість 20
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
        <span style={{ fontSize: 17, color: SOFT }}>Запитання {n + 1} з {ROUND} · <b style={{ color: GOLD_L }}>{score} балів</b></span>
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
      <p style={{ fontSize: 19, color: SOFT, marginTop: 0, lineHeight: 1.5 }}>{rank(right).d} Результат: <b style={{ color: GOLD_L }}>{score} балів</b>, правильних відповідей — <b style={{ color: GOLD_L }}>{right} з {ROUND}</b>.</p>
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
        <UaMap marks={marks} thread={a && b && a !== b ? [a, b] : undefined} label={a && b ? `Нитка від міста ${a.n} до міста ${b.n}` : 'Мапа України'} />
      </div>
      <div aria-live="polite" style={{ marginTop: 14 }}>
        {d !== null && a && b && (
          <div style={card}>
            {a === b
              ? <p style={{ margin: 0, fontSize: 20 }}>Ти живеш у рідному місті — {a.n}. Розкажи про нього у творі «Історія мого міста»!</p>
              : <p style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Від міста {a.n} до міста {b.n} — <span style={{ color: GOLD_L }}>{d} км</span> напрямки</p>}
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
          <div style={card}>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Школи</h2>
            <ol style={{ margin: 0, paddingLeft: 26, display: 'grid', gap: 6, fontSize: 18 }}>
              {rows.slice(0, 20).map((r) => <li key={r.city + r.school}>{r.city}, школа №{r.school} — <b style={{ color: GOLD_L }}>{r.points}</b> <span style={{ color: SOFT, fontSize: 15 }}>({r.players} {r.players % 10 === 1 && r.players % 100 !== 11 ? 'гра' : r.players % 10 >= 2 && r.players % 10 <= 4 && (r.players % 100 < 12 || r.players % 100 > 14) ? 'гри' : 'ігор'})</span></li>)}
            </ol>
          </div>
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
        <L t="Підпис: ім’я та вік або псевдонім"><input required maxLength={40} value={f.sign} onChange={set('sign')} style={inp} placeholder="Оля, 13 або Мандрівниця" /></L>
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
