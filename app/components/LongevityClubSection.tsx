'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuizItem {
  id: string
  question: string
  audioClip?: string
  options: string[]
  correctIdx: number
  hint?: string
}

type ActiveView = null | 'voice' | 'text' | 'memory' | 'leaderboard' | 'flutter'

// ─── Data ─────────────────────────────────────────────────────────────────────

const VOICE_QUIZ: QuizItem[] = [
  { id: 'q1', question: 'Хто розповідає цю історію?', audioClip: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/Audio/seria1.mp3.mp3', options: ['Дід Панас', 'Балабон', 'Зайченя Оксанка'], correctIdx: 0, hint: 'Голос мудрий і теплий' },
  { id: 'q2', question: 'Яка серія грала?', audioClip: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/Audio/seria1.mp3.mp3', options: ['Серія 1 · Балабони', 'Серія 2 · Темний ліс', 'Серія 3 · Замок тіней'], correctIdx: 0, hint: 'Це самий початок пригод' },
  { id: 'q3', question: 'Де відбуваються події?', audioClip: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/Audio/seria1.mp3.mp3', options: ['У місті', 'У темному лісі', 'На березі річки'], correctIdx: 1, hint: 'Чуєте звуки природи?' },
]

const TEXT_QUIZ: QuizItem[] = [
  { id: 't1', question: 'Хто головний герой серіалу «Балабони»?', options: ['Дід Панас', 'Балабон', 'Зайченя Оксанка'], correctIdx: 1 },
  { id: 't2', question: 'Що найбільше любить робити Балабон?', options: ['Спати цілий день', 'Співати і танцювати', 'Рибалити на озері'], correctIdx: 1 },
  { id: 't3', question: 'Скільки серій у першому сезоні?', options: ['10 серій', '15 серій', '20 серій'], correctIdx: 2 },
]

const MEMORY_WORDS = ['Балабон', 'Ліс', 'Панас', 'Казка', 'Зірка', 'Річка', 'Пісня', 'Серце']

const FLUTTER_GAMES = [
  {
    id: 'word-builder',
    title: 'Словесний конструктор',
    desc: 'Складай слова з літер великого слова',
    emoji: '🔤',
  },
  {
    id: 'memory',
    title: 'Знайди пару',
    desc: 'Знаходь пари однакових карток',
    emoji: '🃏',
  },
  {
    id: 'sudoku',
    title: 'Числові доріжки',
    desc: 'Логічна гра Судоку 4×4',
    emoji: '🔢',
  },
  {
    id: 'wordle',
    title: 'Вгадай слово',
    desc: 'Вгадай українське слово за 6 спроб',
    emoji: '💡',
  },
  {
    id: 'word-chain',
    title: 'Ланцюжок слів',
    desc: 'Утворюй слова з останньої літери попереднього',
    emoji: '🔗',
  },
  {
    id: 'quiz',
    title: 'Вікторина знань',
    desc: '20 питань з культури та природи України',
    emoji: '🇺🇦',
  },
  {
    id: 'anagram',
    title: 'Анаграми',
    desc: 'Склади правильне слово з переставлених літер',
    emoji: '✏️',
  },
]

// ─── Memory Game ──────────────────────────────────────────────────────────────

function MemoryGame({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = useState<'show' | 'hide' | 'input' | 'result'>('show')
  const [visibleWords, setVisibleWords] = useState<string[]>([])
  const [userInput, setUserInput] = useState('')
  const [score, setScore] = useState(0)
  const [countdown, setCountdown] = useState(5)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const shuffled = [...MEMORY_WORDS].sort(() => Math.random() - 0.5).slice(0, 5)
    setVisibleWords(shuffled)
  }, [])

  useEffect(() => {
    if (phase !== 'show') return
    setCountdown(5)
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!)
          setPhase('hide')
          setTimeout(() => setPhase('input'), 500)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const checkAnswer = () => {
    const words = userInput.toLowerCase().split(/[\s,]+/).filter(Boolean)
    const correct = visibleWords.filter(w => words.some(u => w.toLowerCase().includes(u) || u.includes(w.toLowerCase())))
    setScore(correct.length)
    setPhase('result')
  }

  const restart = () => {
    const shuffled = [...MEMORY_WORDS].sort(() => Math.random() - 0.5).slice(0, 5)
    setVisibleWords(shuffled)
    setUserInput('')
    setScore(0)
    setPhase('show')
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>
        ← Назад
      </button>
      <div style={{ fontSize: 18, color: '#f5f0e8', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Тренування пам'яті</div>
      <div style={{ fontSize: 13, color: '#8899bb', textAlign: 'center', marginBottom: 20 }}>Запам'ятайте слова з казки і відтворіть їх</div>

      {phase === 'show' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#ef9f27' }}>{countdown}</div>
            <div style={{ fontSize: 13, color: '#8899bb' }}>секунд на запам'ятовування</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
            {visibleWords.map(w => (
              <div key={w} style={{ background: 'rgba(239,159,39,0.15)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 12, padding: '10px 20px', fontSize: 18, fontWeight: 700, color: '#ef9f27' }}>{w}</div>
            ))}
          </div>
        </>
      )}

      {phase === 'hide' && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48 }}>🙈</div>
          <div style={{ fontSize: 16, color: '#f5f0e8', marginTop: 12 }}>А тепер запишіть!</div>
        </div>
      )}

      {phase === 'input' && (
        <>
          <div style={{ fontSize: 15, color: '#f5f0e8', marginBottom: 12 }}>Напишіть слова які запам'ятали (через кому або пробіл):</div>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="Балабон, Ліс, ..."
            style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, fontSize: 16, color: '#f5f0e8', fontFamily: "'Montserrat', sans-serif", resize: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={checkAnswer} disabled={!userInput.trim()}
            style={{ width: '100%', marginTop: 12, background: '#ef9f27', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 700, cursor: userInput.trim() ? 'pointer' : 'not-allowed', opacity: userInput.trim() ? 1 : 0.5 }}>
            Перевірити ✓
          </button>
        </>
      )}

      {phase === 'result' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>{score === visibleWords.length ? '★★★' : score >= 3 ? '★★' : '★'}</div>
          <div style={{ fontSize: 22, color: '#f5f0e8', fontWeight: 700, marginBottom: 8 }}>{score} з {visibleWords.length} слів!</div>
          <div style={{ fontSize: 14, color: '#8899bb', marginBottom: 8 }}>Правильні слова:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
            {visibleWords.map(w => (
              <div key={w} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22c55e', borderRadius: 10, padding: '6px 14px', fontSize: 14, color: '#86efac' }}>{w}</div>
            ))}
          </div>
          <div style={{ fontSize: 14, color: '#8899bb', marginBottom: 20 }}>
            {score === visibleWords.length ? 'Ідеальна пам\'ять! Профілактика деменції на відмінно!' : score >= 3 ? 'Добре! Тренуйтеся щодня — це корисно для мозку!' : 'Спробуйте ще раз — кожна спроба зміцнює нейронні зв\'язки!'}
          </div>
          <button onClick={restart} style={{ background: '#ef9f27', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginRight: 10 }}>Ще раз</button>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Інші ігри</button>
        </div>
      )}
    </div>
  )
}

// ─── Flutter Game Overlay ─────────────────────────────────────────────────────

function FlutterGameOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', flexDirection: 'column',
      background: '#000512',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: '#0f1e3a',
        borderBottom: '1px solid rgba(239,159,39,0.2)',
        flexShrink: 0,
      }}>
        <span style={{ color: '#ef9f27', fontWeight: 700, fontSize: 15, fontFamily: "'Montserrat', sans-serif" }}>
          🎮 Ігри для мозку · Балабон
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8, padding: '6px 14px', color: '#fff',
            fontSize: 14, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
          }}
        >
          ✕ Закрити
        </button>
      </div>

      {/* Flutter app iframe */}
      <iframe
        src="/games/"
        title="Ігри Балабон"
        allow="fullscreen"
        style={{ flex: 1, border: 'none', width: '100%' }}
      />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LongevityClubSection() {
  const [activeView, setActiveView] = useState<ActiveView>(null)
  const [quizType, setQuizType] = useState<'voice' | 'text'>('voice')
  const [quizIdx, setQuizIdx] = useState(0)
  const [answered, setAnswered] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [clipPlaying, setClipPlaying] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const quiz = quizType === 'voice' ? VOICE_QUIZ : TEXT_QUIZ
  const q = quiz[quizIdx]

  const playClip = () => {
    const audio = audioRef.current
    if (!audio || !q.audioClip) return
    audio.src = q.audioClip
    audio.currentTime = 0
    audio.play().catch(console.error)
    setClipPlaying(true)
    setTimeout(() => { audio.pause(); setClipPlaying(false) }, 5000)
  }

  const handleAnswer = (idx: number) => {
    if (answered !== null) return
    setAnswered(idx)
    const correct = idx === q.correctIdx
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
    setTimeout(() => {
      setFeedback(null)
      if (quizIdx < quiz.length - 1) { setQuizIdx(i => i + 1); setAnswered(null); setClipPlaying(false) }
      else { setDone(true) }
    }, 1400)
  }

  const resetGame = () => {
    setQuizIdx(0); setAnswered(null); setScore(0)
    setDone(false); setFeedback(null); setClipPlaying(false)
  }

  const btnStyle = (idx: number) => {
    if (answered === null) return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: '#f5f0e8' }
    if (idx === q.correctIdx) return { bg: 'rgba(34,197,94,0.2)', border: '#22c55e', color: '#86efac' }
    if (idx === answered) return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#fca5a5' }
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', color: '#556688' }
  }

  return (
    <section style={{ marginBottom: 56 }}>
      <audio ref={audioRef} />

      {/* Flutter fullscreen overlay */}
      {activeView === 'flutter' && (
        <FlutterGameOverlay onClose={() => setActiveView(null)} />
      )}

      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#ef9f27', display: 'block', marginBottom: 8 }}>
        Модуль 3
      </span>

      <div style={{ background: '#0f1e3a', borderRadius: 16, padding: '22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,159,39,0.1)', border: '0.5px solid rgba(239,159,39,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <path d="M13 23 Q9 23 8 19 Q6 18 6 15 Q5 13 7 11 Q7 8 10 7 Q11 5 13 5 Q15 5 16 7 Q19 8 19 11 Q21 13 20 15 Q20 18 18 19 Q17 23 13 23Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
              <path d="M10 11 Q13 9 16 11" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <path d="M10 14 Q13 12 16 14" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <path d="M15 6 L16 3 L17 6" stroke="#ef9f27" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, color: '#f5f0e8' }}>Клуб Довголіття</div>
        </div>

        <p style={{ fontSize: 16, color: '#8899bb', lineHeight: 1.7, marginBottom: 18 }}>
          Ігри для розуму після кожної серії. Профілактика деменції та Альцгеймера.
        </p>

        {/* ── Flutter Games Grid ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#ef9f27', marginBottom: 12 }}>
            🎮 Ігри для мозку
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {FLUTTER_GAMES.map(game => (
              <div
                key={game.id}
                onClick={() => setActiveView('flutter')}
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 12px', cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 32 }}>{game.emoji}</span>
                </div>
                <div style={{ fontSize: 15, color: '#f5f0e8', fontWeight: 500 }}>{game.title}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{game.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0 20px' }} />

        {/* ── Quick React Mini-Games ────────────────────────────────────────── */}
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8899bb', marginBottom: 12 }}>
          ⚡ Швидкі ігри прямо тут
        </div>

        {activeView === null && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                id: 'voice', label: 'Вгадай голос', desc: 'Слухай і вгадуй',
                svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M10 16 Q9 10 13 8 Q18 6 20 12 Q22 18 18 22 Q16 24 16 28" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="16" cy="30" r="2" fill="#ef9f27"/><path d="M24 10 Q28 16 24 22" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M27 7 Q33 16 27 25" stroke="#ef9f27" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.5"/></svg>
              },
              {
                id: 'text', label: 'Вікторина', desc: '3 питання',
                svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><text x="16" y="26" textAnchor="middle" style={{fontFamily:"'Lora',serif",fontSize:'28px',fill:'none',stroke:'#ef9f27',strokeWidth:'1.2'}}>?</text><circle cx="24" cy="8" r="3" fill="#ef9f27" opacity="0.6"/><circle cx="28" cy="14" r="2" fill="#ef9f27" opacity="0.4"/><circle cx="22" cy="15" r="1.5" fill="#ef9f27" opacity="0.3"/></svg>
              },
              {
                id: 'memory', label: 'Пам\'ять', desc: 'Запам\'ятай слова',
                svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><rect x="5" y="5" width="10" height="10" rx="3" stroke="#ef9f27" strokeWidth="1.5" fill="none"/><rect x="17" y="5" width="10" height="10" rx="3" stroke="#ef9f27" strokeWidth="1.5" fill="none"/><rect x="5" y="17" width="10" height="10" rx="3" stroke="#ef9f27" strokeWidth="1.5" fill="none"/><rect x="17" y="17" width="10" height="10" rx="3" stroke="#ef9f27" strokeWidth="1.5" fill="rgba(239,159,39,0.2)"/><line x1="15" y1="10" x2="17" y2="10" stroke="#ef9f27" strokeWidth="1" opacity="0.5"/><line x1="15" y1="22" x2="17" y2="22" stroke="#ef9f27" strokeWidth="1" opacity="0.5"/><line x1="10" y1="15" x2="10" y2="17" stroke="#ef9f27" strokeWidth="1" opacity="0.5"/><line x1="22" y1="15" x2="22" y2="17" stroke="#ef9f27" strokeWidth="1" opacity="0.5"/></svg>
              },
              {
                id: 'leaderboard', label: 'Рейтинг', desc: 'Незабаром',
                svg: <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M16 4 L18.5 11 L26 11 L20 16 L22.5 23 L16 19 L9.5 23 L12 16 L6 11 L13.5 11 Z" stroke="#ef9f27" strokeWidth="1.5" fill="none" strokeLinejoin="round"/></svg>
              },
            ].map(g => (
              <div key={g.id}
                onClick={() => {
                  if (g.id === 'voice') { setQuizType('voice'); setActiveView('voice') }
                  else if (g.id === 'text') { setQuizType('text'); setActiveView('text') }
                  else setActiveView(g.id as ActiveView)
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 12px', cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{g.svg}</div>
                <div style={{ fontSize: 15, color: '#f5f0e8', fontWeight: 500 }}>{g.label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4 }}>{g.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'memory' && <MemoryGame onBack={() => setActiveView(null)} />}

        {(activeView === 'voice' || activeView === 'text') && !done && (
          <div>
            <button onClick={() => { setActiveView(null); resetGame() }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>
              ← Назад
            </button>
            <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
              {quiz.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < quizIdx ? '#ef9f27' : i === quizIdx ? 'rgba(239,159,39,0.4)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            {activeView === 'voice' && q.audioClip && (
              <button onClick={playClip} disabled={clipPlaying}
                style={{ width: '100%', minHeight: 60, borderRadius: 12, background: clipPlaying ? 'rgba(239,159,39,0.2)' : 'rgba(239,159,39,0.1)', border: `0.5px solid ${clipPlaying ? '#ef9f27' : 'rgba(239,159,39,0.3)'}`, color: '#ef9f27', fontSize: 17, fontWeight: 500, cursor: clipPlaying ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
                ▶ {clipPlaying ? 'Слухаємо... (5 сек)' : 'Прослухати фрагмент'}
              </button>
            )}
            <div style={{ fontSize: 19, color: '#f5f0e8', fontWeight: 500, lineHeight: 1.6, marginBottom: 6 }}>{q.question}</div>
            {q.hint && <div style={{ fontSize: 13, color: '#556688', marginBottom: 16 }}>💡 {q.hint}</div>}
            {q.options.map((opt, i) => {
              const c = btnStyle(i)
              return (
                <button key={i} onClick={() => handleAnswer(i)} disabled={answered !== null}
                  style={{ width: '100%', minHeight: 58, background: c.bg, border: `0.5px solid ${c.border}`, borderRadius: 12, padding: '12px 18px', fontSize: 18, color: c.color, fontWeight: 500, cursor: answered !== null ? 'default' : 'pointer', textAlign: 'left', marginBottom: 10, transition: 'all 0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{String.fromCharCode(65 + i)}. {opt}</span>
                  {answered !== null && i === q.correctIdx && <span>✓</span>}
                  {answered === i && i !== q.correctIdx && <span>✗</span>}
                </button>
              )
            })}
            {feedback && (
              <div style={{ textAlign: 'center', padding: 12, fontSize: 16, fontWeight: 500, color: feedback === 'correct' ? '#86efac' : '#fca5a5', lineHeight: 1.5 }}>
                {feedback === 'correct'
                  ? <><div style={{fontSize:20}}>Правильно!</div><div style={{fontSize:13,color:'#ef9f27',marginTop:6}}>Ох і пам'ять у тебе, як у молодого козака!</div></>
                  : '✗ Не вірно — спробуй ще!'}
              </div>
            )}
          </div>
        )}

        {(activeView === 'voice' || activeView === 'text') && done && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <button onClick={() => { setActiveView(null); resetGame() }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>
              ← Назад
            </button>
            <div style={{ marginBottom: 12, display:'flex', justifyContent:'center' }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <path d="M24 6 L28 18 L40 18 L30 26 L34 38 L24 30 L14 38 L18 26 L8 18 L20 18 Z" stroke="#ef9f27" strokeWidth="2" fill="none" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, color: '#f5f0e8', fontWeight: 500, marginBottom: 8 }}>{score} з {quiz.length} правильно!</div>
            <div style={{ fontSize: 15, color: '#8899bb', marginBottom: 24 }}>
              {score === quiz.length ? 'Чудово! Ви уважний слухач!' : score >= Math.ceil(quiz.length / 2) ? 'Непогано! Спробуйте ще раз.' : 'Послухайте серію знову і спробуйте!'}
            </div>
            <button onClick={resetGame} style={{ background: '#ef9f27', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 17, fontWeight: 500, cursor: 'pointer', marginRight: 10 }}>Ще раз</button>
            <button onClick={() => { setActiveView(null); resetGame() }} style={{ background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '14px 28px', fontSize: 17, fontWeight: 500, cursor: 'pointer' }}>Інші ігри</button>
          </div>
        )}

        {activeView === 'leaderboard' && (
          <div>
            <button onClick={() => setActiveView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 20 }}>
              ← Назад
            </button>
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#8899bb', fontSize: 16 }}>
              <div style={{ marginBottom: 16, display:'flex', justifyContent:'center' }}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 6 L28 18 L40 18 L30 26 L34 38 L24 30 L14 38 L18 26 L8 18 L20 18 Z" stroke="#ef9f27" strokeWidth="2" fill="none" strokeLinejoin="round" opacity="0.4"/>
                </svg>
              </div>
              <div style={{ fontSize: 18, color: '#f5f0e8', marginBottom: 8 }}>Незабаром</div>
              <div style={{ fontSize: 14 }}>Рейтинг гравців у розробці</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
