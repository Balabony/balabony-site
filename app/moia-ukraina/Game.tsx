'use client'

// 11.11.2026: гра «Моя Україна на мапі» — демоверсія для проєкту «Моє місце: голоси молоді України» (ЛОГО «ІГС»).
// Три режими: вікторина (10 випадкових запитань із банку), «Моя мапа» (нитка від рідного міста до теперішнього, відстань),
// рейтинг шкіл (місто + номер школи + клас; жодних імен і персональних даних дітей).

import { useEffect, useMemo, useRef, useState } from 'react'
import UaMap from './UaMap'
import { CITIES, QUESTIONS, TOT_NOTE, type City, type Q } from './data'

const NAVY = '#0E1A2B', NAVY2 = '#14253B', CARD = '#193049', GOLD = '#EF9F27', GOLD_L = '#FAC775', SOFT = '#CFE3FA'
const GREEN = '#36AB62', RED = '#E8434B', BLUE = '#5AA9FF'
const ROUND = 10, LIMIT = 20

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

type Mode = 'home' | 'quiz' | 'done' | 'map' | 'rating'
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
  const [left, setLeft] = useState(LIMIT)
  const [noTimer, setNoTimer] = useState(false)
  const head = useRef<HTMLHeadingElement>(null)

  useEffect(() => { head.current?.focus() }, [mode, i])

  function start() {
    const pool = shuffle(QUESTIONS).slice(0, ROUND)
    setItems(pool.map((q) => ({ q, opts: shuffle([...q.o]) })))
    setI(0); setPicked(null); setScore(0); setRight(0); setLeft(LIMIT); setMode('quiz')
  }

  // Таймер: 20 секунд на запитання. Можна вимкнути — для тих, кому потрібно більше часу (екранні читачі, дислексія).
  useEffect(() => {
    if (mode !== 'quiz' || picked !== null || noTimer) return
    if (left <= 0) { setPicked(''); return }
    const t = setTimeout(() => setLeft((x) => x - 1), 1000)
    return () => clearTimeout(t)
  }, [mode, picked, left, noTimer])

  function answer(o: string) {
    if (picked !== null) return
    setPicked(o)
    if (o === items[i].q.o[0]) { setRight((x) => x + 1); setScore((s) => s + 100 + (noTimer ? 0 : left * 5)) }
  }
  function next() {
    if (i + 1 >= items.length) { setMode('done'); return }
    setI(i + 1); setPicked(null); setLeft(LIMIT)
  }

  return (
    <div style={{ background: NAVY, color: '#fff', minHeight: '100vh', padding: '28px 16px 60px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ margin: 0, color: GOLD_L, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', fontSize: 14 }}>Моє місце · голоси молоді України</p>
        {mode === 'home' && <Home onQuiz={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} noTimer={noTimer} setNoTimer={setNoTimer} head={head} />}
        {mode === 'quiz' && items[i] && (
          <QuizStep item={items[i]} n={i} picked={picked} left={left} noTimer={noTimer} score={score} onAnswer={answer} onNext={next} head={head} />
        )}
        {mode === 'done' && <Done score={score} right={right} onAgain={start} onMap={() => setMode('map')} onRating={() => setMode('rating')} head={head} />}
        {mode === 'map' && <MyMap onBack={() => setMode('home')} head={head} />}
        {mode === 'rating' && <Rating onBack={() => setMode('home')} onQuiz={start} head={head} />}
        <p style={{ marginTop: 40, fontSize: 14, color: SOFT, opacity: 0.8, lineHeight: 1.5 }}>
          Демоверсія гри проєкту «Моє місце: голоси молоді України» · ЛОГО «Інститут громадянського суспільства» (Львів).
          Без реєстрації. Ми не збираємо імен і персональних даних дітей. Крим — це Україна.
        </p>
      </div>
    </div>
  )
}

type HeadRef = React.RefObject<HTMLHeadingElement | null>
const H = ({ head, children }: { head: HeadRef; children: React.ReactNode }) => (
  <h1 ref={head} tabIndex={-1} style={{ fontSize: 'clamp(28px,5vw,42px)', lineHeight: 1.15, margin: '8px 0 14px', outline: 'none' }}>{children}</h1>
)

function Home({ onQuiz, onMap, onRating, noTimer, setNoTimer, head }: { onQuiz: () => void; onMap: () => void; onRating: () => void; noTimer: boolean; setNoTimer: (v: boolean) => void; head: HeadRef }) {
  const demo = useMemo(() => [byName.get('Львів')!, byName.get('Маріуполь')!], [])
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
      </div>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, fontSize: 17, color: SOFT, cursor: 'pointer' }}>
        <input type="checkbox" checked={noTimer} onChange={(e) => setNoTimer(e.target.checked)} style={{ width: 22, height: 22 }} />
        Грати без таймера (більше часу на кожне запитання)
      </label>
    </>
  )
}

function QuizStep({ item, n, picked, left, noTimer, score, onAnswer, onNext, head }: { item: Item; n: number; picked: string | null; left: number; noTimer: boolean; score: number; onAnswer: (o: string) => void; onNext: () => void; head: HeadRef }) {
  const { q, opts } = item
  const city = q.city ? byName.get(q.city) : undefined
  const ok = picked !== null && picked === q.o[0]
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
        <span style={{ background: '#2A4566', borderRadius: 999, padding: '6px 14px', fontWeight: 700, fontSize: 15 }}>{q.c}</span>
        <span style={{ fontSize: 17, color: SOFT }}>Запитання {n + 1} з {ROUND} · <b style={{ color: GOLD_L }}>{score} балів</b></span>
      </div>
      {!noTimer && (
        <div aria-hidden="true" style={{ height: 8, background: '#2A4566', borderRadius: 99, marginTop: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(left / LIMIT) * 100}%`, background: left > 6 ? GOLD : RED, transition: 'width 1s linear' }} />
        </div>
      )}
      <H head={head}><span style={{ fontSize: 'clamp(22px,3.6vw,30px)' }}>{q.q}</span></H>
      {!noTimer && picked === null && <p style={{ margin: '0 0 12px', color: SOFT, fontSize: 16 }}>Залишилось {left} с</p>}
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

function Done({ score, right, onAgain, onMap, onRating, head }: { score: number; right: number; onAgain: () => void; onMap: () => void; onRating: () => void; head: HeadRef }) {
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
      <H head={head}>Твій результат: {score} балів</H>
      <p style={{ fontSize: 20, color: SOFT, marginTop: 0 }}>Правильних відповідей: <b style={{ color: GOLD_L }}>{right} з {ROUND}</b></p>
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
  const cities = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows ?? []) m.set(r.city, (m.get(r.city) ?? 0) + r.points)
    return [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 10)
  }, [rows])
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
          <div style={card}>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Міста</h2>
            <ol style={{ margin: 0, paddingLeft: 26, display: 'grid', gap: 6, fontSize: 18 }}>
              {cities.map(([c, p]) => <li key={c}>{c} — <b style={{ color: GOLD_L }}>{p}</b>{byName.get(c)?.tot ? <span style={{ color: SOFT, fontSize: 15 }}> · {TOT_NOTE}</span> : null}</li>)}
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
