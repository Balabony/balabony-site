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

type ActiveView = null | 'voice' | 'text' | 'memory' | 'leaderboard' | 'connections' | 'tictactoe' | 'chess' | 'checkers' | 'durak' | 'poker'
type ChessBoard = (string | null)[][]

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

// ─── Connections Data ─────────────────────────────────────────────────────────

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#f0a500'

const CONNECTIONS_PUZZLES = [
  { title: 'Рослини', categories: [
    { label: 'Квіти',  color: GOLD,      words: ['Соняшник', 'Троянда', 'Волошка'] },
    { label: 'Дерева', color: '#3b82f6', words: ['Дуб', 'Береза', 'Верба'] },
    { label: 'Фрукти', color: '#22c55e', words: ['Яблуко', 'Груша', 'Слива'] },
    { label: 'Ягоди',  color: '#a855f7', words: ['Калина', 'Вишня', 'Смородина'] },
  ]},
  { title: 'Тварини', categories: [
    { label: 'Птахи',   color: GOLD,      words: ['Лелека', 'Соловей', 'Ластівка'] },
    { label: 'Риби',    color: '#3b82f6', words: ['Карась', 'Щука', 'Окунь'] },
    { label: 'Домашні', color: '#22c55e', words: ['Корова', 'Кінь', 'Вівця'] },
    { label: 'Дикі',    color: '#a855f7', words: ['Вовк', 'Лисиця', 'Заєць'] },
  ]},
  { title: 'Їжа', categories: [
    { label: 'Супи',    color: GOLD,      words: ['Борщ', 'Капусняк', 'Юшка'] },
    { label: 'Страви',  color: '#3b82f6', words: ['Вареники', 'Голубці', 'Деруни'] },
    { label: 'Напої',   color: '#22c55e', words: ['Узвар', 'Кисіль', 'Квас'] },
    { label: 'Солодке', color: '#a855f7', words: ['Медівник', 'Пундик', 'Коржі'] },
  ]},
  { title: 'Міста України', categories: [
    { label: 'Захід',   color: GOLD,      words: ['Львів', 'Луцьк', 'Рівне'] },
    { label: 'Схід',    color: '#3b82f6', words: ['Харків', 'Дніпро', 'Запоріжжя'] },
    { label: 'Південь', color: '#22c55e', words: ['Одеса', 'Херсон', 'Миколаїв'] },
    { label: 'Північ',  color: '#a855f7', words: ['Київ', 'Чернігів', 'Житомир'] },
  ]},
  { title: 'Народні свята', categories: [
    { label: 'Зима',  color: GOLD,      words: ['Різдво', 'Маланка', 'Водохреще'] },
    { label: 'Весна', color: '#3b82f6', words: ['Великдень', 'Провідна', 'Юрія'] },
    { label: 'Літо',  color: '#22c55e', words: ['Купала', 'Петра', 'Спаса'] },
    { label: 'Осінь', color: '#a855f7', words: ['Покрова', 'Михайла', 'Катерини'] },
  ]},
]

// ─── Connections Game ─────────────────────────────────────────────────────────

function ConnectionsGame({ onBack }: { onBack: () => void }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [solved, setSolved] = useState<number[]>([])
  const [lives, setLives] = useState(3)
  const [shake, setShake] = useState(false)
  const [done, setDone] = useState(false)
  const [won, setWon] = useState(false)

  const puzzle = CONNECTIONS_PUZZLES[puzzleIdx]
  const allWords = puzzle.categories.flatMap(c => c.words)
  const [shuffled] = useState(() => [...allWords].sort(() => Math.random() - 0.5))

  const toggle = (word: string) => {
    if (done) return
    const cat = puzzle.categories.findIndex(c => c.words.includes(word))
    if (solved.includes(cat)) return
    setSelected(prev =>
      prev.includes(word) ? prev.filter(w => w !== word) : prev.length < 3 ? [...prev, word] : prev
    )
  }

  const check = () => {
    if (selected.length !== 3) return
    const catIdx = puzzle.categories.findIndex(c => c.words.every(w => selected.includes(w)) && c.words.length === 3)
    if (catIdx !== -1) {
      const next = [...solved, catIdx]
      setSolved(next)
      setSelected([])
      if (next.length === 4) { setDone(true); setWon(true) }
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setShake(true)
      setTimeout(() => setShake(false), 600)
      setSelected([])
      if (newLives === 0) { setDone(true); setWon(false) }
    }
  }

  const nextPuzzle = () => {
    setPuzzleIdx(i => (i + 1) % CONNECTIONS_PUZZLES.length)
    setSolved([]); setSelected([]); setLives(3); setDone(false); setWon(false)
  }

  const cardStyle = (word: string): React.CSSProperties => {
    const catIdx = puzzle.categories.findIndex(c => c.words.includes(word))
    const isSolved = solved.includes(catIdx)
    const isSelected = selected.includes(word)
    if (isSolved) return { background: puzzle.categories[catIdx].color, color: '#fff', border: `2px solid ${puzzle.categories[catIdx].color}`, opacity: 0.85 }
    if (isSelected) return { background: 'rgba(240,165,0,0.25)', color: '#f0a500', border: '2px solid #f0a500' }
    return { background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.12)' }
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899bb', fontSize: 14, marginBottom: 16, fontFamily: FONT }}>← Назад</button>
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8' }}>Зв&apos;язки · {puzzle.title}</div>
        <div style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>Знайдіть 4 групи по 3 слова</div>
        <div style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</div>
      </div>

      {done && (
        <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{won ? '🎉' : '😔'}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: won ? GOLD : '#ef4444', marginBottom: 16 }}>
            {won ? 'Чудово! Всі групи знайдено!' : 'Спроби вичерпано!'}
          </div>
          <button onClick={nextPuzzle} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginRight: 8 }}>Наступна головоломка</button>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Інші ігри</button>
        </div>
      )}

      {solved.map(ci => (
        <div key={ci} style={{ background: puzzle.categories[ci].color, borderRadius: 12, padding: '12px 16px', marginBottom: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>{puzzle.categories[ci].label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{puzzle.categories[ci].words.join(' · ')}</div>
        </div>
      ))}

      {!done && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14, animation: shake ? 'shake 0.4s' : undefined }}>
          {shuffled.filter(w => !solved.some(ci => puzzle.categories[ci].words.includes(w))).map(word => (
            <button key={word} onClick={() => toggle(word)}
              style={{ ...cardStyle(word), borderRadius: 12, padding: '14px 8px', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, textAlign: 'center', transition: 'all 0.15s', minHeight: 56 }}>
              {word}
            </button>
          ))}
        </div>
      )}

      {!done && (
        <button onClick={check} disabled={selected.length !== 3}
          style={{ width: '100%', background: selected.length === 3 ? GOLD : 'rgba(255,255,255,0.06)', color: selected.length === 3 ? '#fff' : '#556688', border: 'none', borderRadius: 12, padding: '14px', fontSize: 17, fontWeight: 700, cursor: selected.length === 3 ? 'pointer' : 'default', fontFamily: FONT, transition: 'all 0.2s' }}>
          {selected.length === 3 ? 'Перевірити' : `Оберіть ${3 - selected.length} ще`}
        </button>
      )}
    </div>
  )
}

// ─── Tic-Tac-Toe Game ─────────────────────────────────────────────────────────

function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [playerTurn, setPlayerTurn] = useState(true)
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'draw'>('playing')

  const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

  const checkWinner = (b: (string|null)[]) => {
    for (const [a,c,d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]
    return b.every(Boolean) ? 'draw' : null
  }

  const bestMove = (b: (string|null)[]): number => {
    for (const [a,c,d] of LINES) { const cells = [b[a],b[c],b[d]]; if (cells.filter(x=>x==='О').length===2 && cells.includes(null)) return [a,c,d][cells.indexOf(null)] }
    for (const [a,c,d] of LINES) { const cells = [b[a],b[c],b[d]]; if (cells.filter(x=>x==='Х').length===2 && cells.includes(null)) return [a,c,d][cells.indexOf(null)] }
    if (!b[4]) return 4
    for (const i of [0,2,6,8]) if (!b[i]) return i
    return b.findIndex(x => !x)
  }

  const handleClick = (idx: number) => {
    if (!playerTurn || board[idx] || status !== 'playing') return
    const next = [...board]; next[idx] = 'Х'
    const result = checkWinner(next)
    if (result) { setBoard(next); setStatus(result === 'draw' ? 'draw' : 'won'); return }
    setBoard(next); setPlayerTurn(false)
    setTimeout(() => {
      const ai = bestMove(next); const next2 = [...next]; next2[ai] = 'О'
      const r2 = checkWinner(next2)
      setBoard(next2)
      setStatus(r2 ? (r2 === 'draw' ? 'draw' : 'lost') : 'playing')
      setPlayerTurn(true)
    }, 400)
  }

  const reset = () => { setBoard(Array(9).fill(null)); setPlayerTurn(true); setStatus('playing') }
  const winLine = LINES.find(([a,c,d]) => board[a] && board[a]===board[c] && board[a]===board[d])
  const statusMsg = () => {
    if (status === 'won')  return { text: '🎉 Ви виграли!', color: '#22c55e' }
    if (status === 'lost') return { text: '😔 Комп\'ютер виграв!', color: '#ef4444' }
    if (status === 'draw') return { text: '🤝 Нічия!', color: GOLD }
    return { text: playerTurn ? 'Ваш хід (Х)' : 'Комп\'ютер думає...', color: '#8899bb' }
  }
  const msg = statusMsg()

  return (
    <div style={{ fontFamily: FONT, maxWidth: 340, margin: '0 auto' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899bb', fontSize: 14, marginBottom: 16, fontFamily: FONT }}>← Назад</button>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8', marginBottom: 6 }}>Хрестики-нулики</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: msg.color }}>{msg.text}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {board.map((cell, i) => {
          const isWin = winLine?.includes(i)
          return (
            <button key={i} onClick={() => handleClick(i)}
              style={{ height: 90, borderRadius: 14, border: isWin ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)', background: isWin ? 'rgba(240,165,0,0.15)' : cell ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', fontSize: 36, fontWeight: 900, color: cell === 'Х' ? GOLD : '#60a5fa', cursor: !cell && status === 'playing' && playerTurn ? 'pointer' : 'default', fontFamily: FONT, transition: 'all 0.15s' }}>
              {cell}
            </button>
          )
        })}
      </div>
      {status !== 'playing' && (
        <button onClick={reset} style={{ width: '100%', background: GOLD, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>Грати ще раз</button>
      )}
    </div>
  )
}

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
        if (c <= 1) { clearInterval(timerRef.current!); setPhase('hide'); setTimeout(() => setPhase('input'), 500); return 0 }
        return c - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  const checkAnswer = () => {
    const words = userInput.toLowerCase().split(/[\s,]+/).filter(Boolean)
    const correct = visibleWords.filter(w => words.some(u => w.toLowerCase().includes(u) || u.includes(w.toLowerCase())))
    setScore(correct.length); setPhase('result')
  }

  const restart = () => {
    const shuffled = [...MEMORY_WORDS].sort(() => Math.random() - 0.5).slice(0, 5)
    setVisibleWords(shuffled); setUserInput(''); setScore(0); setPhase('show')
  }

  return (
    <div>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>← Назад</button>
      <div style={{ fontSize: 18, color: '#f5f0e8', fontWeight: 600, marginBottom: 8, textAlign: 'center' }}>Тренування пам&apos;яті</div>
      <div style={{ fontSize: 13, color: '#8899bb', textAlign: 'center', marginBottom: 20 }}>Запам&apos;ятайте слова з казки і відтворіть їх</div>

      {phase === 'show' && (
        <>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#ef9f27' }}>{countdown}</div>
            <div style={{ fontSize: 13, color: '#8899bb' }}>секунд на запам&apos;ятовування</div>
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
          <div style={{ fontSize: 15, color: '#f5f0e8', marginBottom: 12 }}>Напишіть слова які запам&apos;ятали (через кому або пробіл):</div>
          <textarea value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Балабон, Ліс, ..."
            style={{ width: '100%', minHeight: 80, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 14, fontSize: 16, color: '#f5f0e8', fontFamily: "'Montserrat', sans-serif", resize: 'none', boxSizing: 'border-box' }} />
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
            {score === visibleWords.length ? 'Ідеальна пам\'ять!' : score >= 3 ? 'Добре! Тренуйтеся щодня!' : 'Спробуйте ще раз!'}
          </div>
          <button onClick={restart} style={{ background: '#ef9f27', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginRight: 10 }}>Ще раз</button>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', border: '0.5px solid rgba(255,255,255,0.18)', borderRadius: 12, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Інші ігри</button>
        </div>
      )}
    </div>
  )
}

// ─── Chess Helpers ────────────────────────────────────────────────────────────

const CHESS_INIT: ChessBoard = [
  ['bR','bN','bB','bQ','bK','bB','bN','bR'],
  ['bP','bP','bP','bP','bP','bP','bP','bP'],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null],
  ['wP','wP','wP','wP','wP','wP','wP','wP'],
  ['wR','wN','wB','wQ','wK','wB','wN','wR'],
]

const PIECE_GLYPH: Record<string, string> = {
  wK:'♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
  bK:'♚', bQ:'♛', bR:'♜', bB:'♝', bN:'♞', bP:'♟',
}

const PIECE_VAL: Record<string, number> = { P:1, N:3, B:3, R:5, Q:9, K:0 }

function chessRawMoves(board: ChessBoard, r: number, c: number): [number,number][] {
  const piece = board[r][c]; if (!piece) return []
  const col = piece[0], type = piece[1]
  const enemy = col === 'w' ? 'b' : 'w'
  const moves: [number,number][] = []
  const ok = (nr: number, nc: number) => nr >= 0 && nr < 8 && nc >= 0 && nc < 8
  const empty = (nr: number, nc: number) => ok(nr,nc) && !board[nr][nc]
  const foe = (nr: number, nc: number) => ok(nr,nc) && !!board[nr][nc]?.startsWith(enemy)
  const free = (nr: number, nc: number) => empty(nr,nc) || foe(nr,nc)
  const slide = (dr: number, dc: number) => {
    let nr = r+dr, nc = c+dc
    while (ok(nr,nc)) { if (!board[nr][nc]) { moves.push([nr,nc]); nr+=dr; nc+=dc } else { if (foe(nr,nc)) moves.push([nr,nc]); break } }
  }
  if (type==='P') {
    const d = col==='w'?-1:1, sr = col==='w'?6:1
    if (empty(r+d,c)) { moves.push([r+d,c]); if (r===sr && empty(r+2*d,c)) moves.push([r+2*d,c]) }
    if (foe(r+d,c-1)) moves.push([r+d,c-1])
    if (foe(r+d,c+1)) moves.push([r+d,c+1])
  } else if (type==='N') {
    for (const [dr,dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) if (free(r+dr,c+dc)) moves.push([r+dr,c+dc])
  } else if (type==='B') { slide(-1,-1); slide(-1,1); slide(1,-1); slide(1,1)
  } else if (type==='R') { slide(-1,0); slide(1,0); slide(0,-1); slide(0,1)
  } else if (type==='Q') { slide(-1,-1);slide(-1,1);slide(1,-1);slide(1,1);slide(-1,0);slide(1,0);slide(0,-1);slide(0,1)
  } else if (type==='K') {
    for (const [dr,dc] of [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) if (free(r+dr,c+dc)) moves.push([r+dr,c+dc])
  }
  return moves
}

function applyChessMove(board: ChessBoard, from: [number,number], to: [number,number]): ChessBoard {
  const nb = board.map(row => [...row]) as ChessBoard
  const p = nb[from[0]][from[1]]
  nb[to[0]][to[1]] = p; nb[from[0]][from[1]] = null
  if (p === 'wP' && to[0] === 0) nb[to[0]][to[1]] = 'wQ'
  if (p === 'bP' && to[0] === 7) nb[to[0]][to[1]] = 'bQ'
  return nb
}

function isInCheck(board: ChessBoard, color: string): boolean {
  let kr = -1, kc = -1
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===`${color}K`) { kr=r; kc=c }
  if (kr===-1) return true
  const enemy = color==='w'?'b':'w'
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c]?.startsWith(enemy)) {
      if (chessRawMoves(board,r,c).some(([mr,mc])=>mr===kr&&mc===kc)) return true
    }
  }
  return false
}

function getLegal(board: ChessBoard, color: string): {from:[number,number], to:[number,number]}[] {
  const result: {from:[number,number], to:[number,number]}[] = []
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    if (board[r][c]?.startsWith(color)) {
      for (const to of chessRawMoves(board,r,c)) {
        const nb = applyChessMove(board,[r,c],to)
        if (!isInCheck(nb,color)) result.push({from:[r,c],to})
      }
    }
  }
  return result
}

function evalChess(board: ChessBoard): number {
  let s = 0
  for (let r=0;r<8;r++) for (let c=0;c<8;c++) {
    const p = board[r][c]; if (!p) continue
    const v = PIECE_VAL[p[1]] ?? 0
    s += p[0]==='w' ? v : -v
  }
  return s
}

function chessMinimax(board: ChessBoard, depth: number, maximizing: boolean): number {
  if (depth===0) return evalChess(board)
  const col = maximizing?'w':'b'
  const moves = getLegal(board,col)
  if (!moves.length) return maximizing ? -999 : 999
  let best = maximizing ? -Infinity : Infinity
  for (const m of moves.slice(0, 10)) {
    const v = chessMinimax(applyChessMove(board,m.from,m.to), depth-1, !maximizing)
    best = maximizing ? Math.max(best,v) : Math.min(best,v)
  }
  return best
}

function chessAI(board: ChessBoard, level: number): {from:[number,number], to:[number,number]} | null {
  const moves = getLegal(board,'b')
  if (!moves.length) return null
  if (level===0) return moves[Math.floor(Math.random()*moves.length)]
  let best = moves[0], bestScore = Infinity
  for (const m of moves) {
    const nb = applyChessMove(board,m.from,m.to)
    const score = level===1 ? evalChess(nb) : chessMinimax(nb,1,true)
    if (score < bestScore) { bestScore=score; best=m }
  }
  return best
}

// ─── Chess Game ───────────────────────────────────────────────────────────────

function ChessGame({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<ChessBoard>(() => CHESS_INIT.map(r=>[...r]))
  const [sel, setSel] = useState<[number,number]|null>(null)
  const [validMoves, setValidMoves] = useState<[number,number][]>([])
  const [playerTurn, setPlayerTurn] = useState(true)
  const [status, setStatus] = useState<'playing'|'won'|'lost'|'draw'>('playing')
  const [level, setLevel] = useState<number|null>(null)
  const [thinking, setThinking] = useState(false)

  const handleSquare = (r: number, c: number) => {
    if (!playerTurn || status!=='playing' || level===null || thinking) return
    const piece = board[r][c]
    if (sel) {
      const hit = validMoves.find(([mr,mc])=>mr===r&&mc===c)
      if (hit) {
        const nb = applyChessMove(board, sel, [r,c])
        setBoard(nb); setSel(null); setValidMoves([]); setPlayerTurn(false)
        setTimeout(() => doAI(nb, level), 200)
      } else if (piece?.startsWith('w')) {
        setSel([r,c])
        setValidMoves(getLegal(board,'w').filter(m=>m.from[0]===r&&m.from[1]===c).map(m=>m.to))
      } else { setSel(null); setValidMoves([]) }
    } else if (piece?.startsWith('w')) {
      setSel([r,c])
      setValidMoves(getLegal(board,'w').filter(m=>m.from[0]===r&&m.from[1]===c).map(m=>m.to))
    }
  }

  const doAI = (b: ChessBoard, lv: number) => {
    setThinking(true)
    setTimeout(() => {
      const move = chessAI(b, lv)
      if (!move) { setStatus('draw'); setThinking(false); return }
      const nb = applyChessMove(b, move.from, move.to)
      setBoard(nb)
      const pm = getLegal(nb,'w')
      if (!pm.length) setStatus(isInCheck(nb,'w') ? 'lost' : 'draw')
      setPlayerTurn(true); setThinking(false)
    }, 50)
  }

  const reset = () => { setBoard(CHESS_INIT.map(r=>[...r])); setSel(null); setValidMoves([]); setPlayerTurn(true); setStatus('playing'); setLevel(null) }

  if (level===null) return (
    <div style={{ fontFamily:FONT }}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#8899bb',fontSize:14,marginBottom:16,fontFamily:FONT}}>← Назад</button>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:20,fontWeight:700,color:'#f5f0e8',marginBottom:6}}>Шахи ♔</div>
        <div style={{fontSize:13,color:'#8899bb',marginBottom:20}}>Оберіть рівень складності</div>
        {[{l:0,label:'🌱 Початківець'},{l:1,label:'⚔️  Середній'},{l:2,label:'🏆 Майстер'}].map(({l,label})=>(
          <button key={l} onClick={()=>setLevel(l)} style={{display:'block',width:'100%',background:l===1?GOLD:'rgba(255,255,255,0.08)',color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT,marginBottom:10}}>{label}</button>
        ))}
      </div>
    </div>
  )

  const statusText = status==='won'?'🎉 Ви виграли!':status==='lost'?'😔 Ви програли!':status==='draw'?'🤝 Нічия!':thinking?'Комп\'ютер думає...':playerTurn?'Ваш хід (білі ♔)':'...'

  return (
    <div style={{fontFamily:FONT}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#8899bb',fontSize:14,marginBottom:6,fontFamily:FONT}}>← Назад</button>
      <div style={{textAlign:'center',fontSize:13,fontWeight:600,color:status!=='playing'?GOLD:'#8899bb',marginBottom:8}}>{statusText}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:1,borderRadius:8,overflow:'hidden',maxWidth:320,margin:'0 auto',marginBottom:10}}>
        {board.map((row,r)=>row.map((piece,c)=>{
          const light=(r+c)%2===0
          const isSel=sel?.[0]===r&&sel?.[1]===c
          const isValid=validMoves.some(([mr,mc])=>mr===r&&mc===c)
          return (
            <div key={`${r}${c}`} onClick={()=>handleSquare(r,c)}
              style={{aspectRatio:'1',background:isSel?'rgba(240,165,0,0.55)':isValid?'rgba(34,197,94,0.5)':light?'#f0d9b5':'#b58863',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:status==='playing'&&playerTurn&&!thinking?'pointer':'default',userSelect:'none',position:'relative'}}>
              {piece ? PIECE_GLYPH[piece] ?? piece : isValid&&!board[r][c]?<div style={{width:10,height:10,borderRadius:'50%',background:'rgba(0,0,0,0.25)'}}/>:''}
            </div>
          )
        }))}
      </div>
      {status!=='playing' && <button onClick={reset} style={{width:'100%',background:GOLD,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT}}>Нова гра</button>}
    </div>
  )
}

// ─── Checkers Game ────────────────────────────────────────────────────────────

function CheckersGame({ onBack }: { onBack: () => void }) {
  type CP = 0|1|2|3|4
  const init = (): CP[][] => {
    const b: CP[][] = Array(8).fill(null).map(()=>Array(8).fill(0))
    for (let r=0;r<3;r++) for (let c=0;c<8;c++) if((r+c)%2===1) b[r][c]=2
    for (let r=5;r<8;r++) for (let c=0;c<8;c++) if((r+c)%2===1) b[r][c]=1
    return b
  }
  const [board, setBoard] = useState<CP[][]>(init)
  const [sel, setSel] = useState<[number,number]|null>(null)
  const [moves, setMoves] = useState<[number,number][]>([])
  const [playerTurn, setPlayerTurn] = useState(true)
  const [status, setStatus] = useState<'playing'|'won'|'lost'>('playing')

  const isP = (p: CP) => p===1||p===3
  const isA = (p: CP) => p===2||p===4

  const getMoves = (b: CP[][], r: number, c: number): [number,number][] => {
    const p = b[r][c]; if (!p) return []
    const dirs: [number,number][] = []
    if (isP(p)) dirs.push([-1,-1],[-1,1])
    if (isA(p)||p===3) dirs.push([1,-1],[1,1])
    if (p===4) { dirs.length=0; dirs.push([-1,-1],[-1,1],[1,-1],[1,1]) }
    const res: [number,number][] = []
    for (const [dr,dc] of dirs) {
      const nr=r+dr, nc=c+dc
      if (nr<0||nr>7||nc<0||nc>7) continue
      if (b[nr][nc]===0) res.push([nr,nc])
      else {
        const opp = isP(p) ? isA : isP
        if (opp(b[nr][nc])) { const jr=nr+dr,jc=nc+dc; if (jr>=0&&jr<8&&jc>=0&&jc<8&&b[jr][jc]===0) res.push([jr,jc]) }
      }
    }
    return res
  }

  const applyMove = (b: CP[][], from: [number,number], to: [number,number]): CP[][] => {
    const nb = b.map(r=>[...r]) as CP[][]
    const p = nb[from[0]][from[1]]
    nb[to[0]][to[1]] = p; nb[from[0]][from[1]] = 0
    if (Math.abs(to[0]-from[0])===2) nb[from[0]+(to[0]-from[0])/2][from[1]+(to[1]-from[1])/2] = 0
    if (p===1&&to[0]===0) nb[to[0]][to[1]] = 3
    if (p===2&&to[0]===7) nb[to[0]][to[1]] = 4
    return nb
  }

  const doAI = (b: CP[][]) => {
    const all: {from:[number,number],to:[number,number]}[] = []
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (isA(b[r][c] as CP)) getMoves(b,r,c).forEach(to=>all.push({from:[r,c],to}))
    if (!all.length) { setStatus('won'); return }
    const caps = all.filter(m=>Math.abs(m.to[0]-m.from[0])===2)
    const pool = caps.length ? caps : all
    const m = pool[Math.floor(Math.random()*pool.length)]
    const nb = applyMove(b, m.from, m.to)
    setBoard(nb)
    const pm: [number,number][] = []
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (isP(nb[r][c] as CP)) pm.push(...getMoves(nb,r,c))
    if (!pm.length) setStatus('lost')
    setPlayerTurn(true)
  }

  const handleClick = (r: number, c: number) => {
    if (!playerTurn || status!=='playing') return
    const p = board[r][c] as CP
    if (sel) {
      const hit = moves.find(([mr,mc])=>mr===r&&mc===c)
      if (hit) {
        const nb = applyMove(board, sel, hit)
        setBoard(nb); setSel(null); setMoves([]); setPlayerTurn(false)
        const am: [number,number][] = []; for (let rr=0;rr<8;rr++) for (let cc=0;cc<8;cc++) if (isA(nb[rr][cc] as CP)) am.push(...getMoves(nb,rr,cc))
        if (!am.length) { setStatus('won'); return }
        setTimeout(()=>doAI(nb), 500)
      } else if (isP(p)) { setSel([r,c]); setMoves(getMoves(board,r,c))
      } else { setSel(null); setMoves([]) }
    } else if (isP(p)) { setSel([r,c]); setMoves(getMoves(board,r,c)) }
  }

  const reset = () => { setBoard(init()); setSel(null); setMoves([]); setPlayerTurn(true); setStatus('playing') }

  return (
    <div style={{fontFamily:FONT}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#8899bb',fontSize:14,marginBottom:6,fontFamily:FONT}}>← Назад</button>
      <div style={{textAlign:'center',fontSize:13,fontWeight:600,color:status!=='playing'?GOLD:'#8899bb',marginBottom:8}}>
        {status==='won'?'🎉 Ви виграли!':status==='lost'?'😔 Ви програли!':playerTurn?'Ваш хід (червоні)':'Комп\'ютер думає...'}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(8,1fr)',gap:1,borderRadius:8,overflow:'hidden',maxWidth:320,margin:'0 auto',marginBottom:10}}>
        {board.map((row,r)=>row.map((cell,c)=>{
          const dark=(r+c)%2===1
          const isSel=sel?.[0]===r&&sel?.[1]===c
          const isValid=moves.some(([mr,mc])=>mr===r&&mc===c)
          return (
            <div key={`${r}${c}`} onClick={()=>handleClick(r,c)}
              style={{aspectRatio:'1',background:isSel?'rgba(240,165,0,0.5)':isValid?'rgba(34,197,94,0.4)':dark?'#769656':'#eeeed2',display:'flex',alignItems:'center',justifyContent:'center',cursor:dark&&playerTurn&&status==='playing'?'pointer':'default'}}>
              {cell===1&&<div style={{width:'72%',aspectRatio:'1',borderRadius:'50%',background:'#dc2626',border:'2px solid #991b1b',boxSizing:'border-box'}}/>}
              {cell===2&&<div style={{width:'72%',aspectRatio:'1',borderRadius:'50%',background:'#334155',border:'2px solid #0f172a',boxSizing:'border-box'}}/>}
              {cell===3&&<div style={{width:'72%',aspectRatio:'1',borderRadius:'50%',background:'#dc2626',border:'3px solid '+GOLD,boxSizing:'border-box'}}/>}
              {cell===4&&<div style={{width:'72%',aspectRatio:'1',borderRadius:'50%',background:'#334155',border:'3px solid '+GOLD,boxSizing:'border-box'}}/>}
            </div>
          )
        }))}
      </div>
      {status!=='playing'&&<button onClick={reset} style={{width:'100%',background:GOLD,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT}}>Нова гра</button>}
    </div>
  )
}

// ─── Durak Game ───────────────────────────────────────────────────────────────

function DurakGame({ onBack }: { onBack: () => void }) {
  const SUITS = ['♠','♥','♦','♣']
  const RANKS = ['6','7','8','9','10','Д','К','Т','А']
  const RV: Record<string,number> = {'6':6,'7':7,'8':8,'9':9,'10':10,'Д':11,'К':12,'Т':13,'А':14}

  interface DCard { suit: string; rank: string; id: number }

  const shuffle = (): DCard[] => {
    const d: DCard[] = []; let id=0
    for (const s of SUITS) for (const r of RANKS) d.push({suit:s,rank:r,id:id++})
    return d.sort(()=>Math.random()-0.5)
  }

  const beats = (atk: DCard, def: DCard, trump: string) =>
    def.suit===atk.suit ? RV[def.rank]>RV[atk.rank] : def.suit===trump&&atk.suit!==trump

  const refill = (ph: DCard[], ah: DCard[], dk: DCard[]): [DCard[], DCard[], DCard[]] => {
    const np=[...ph],na=[...ah],nd=[...dk]
    while (np.length<6&&nd.length>0) np.push(nd.shift()!)
    while (na.length<6&&nd.length>0) na.push(nd.shift()!)
    return [np,na,nd]
  }

  type DPhase = 'player-atk'|'ai-def'|'ai-atk'|'player-def'|'won'|'lost'

  const [deck, setDeck] = useState<DCard[]>([])
  const [trump, setTrump] = useState('')
  const [playerHand, setPlayerHand] = useState<DCard[]>([])
  const [aiHand, setAiHand] = useState<DCard[]>([])
  const [atkCard, setAtkCard] = useState<DCard|null>(null)
  const [defCard, setDefCard] = useState<DCard|null>(null)
  const [phase, setPhase] = useState<DPhase>('player-atk')
  const [msg, setMsg] = useState('Ваш хід — оберіть карту для атаки')
  const [started, setStarted] = useState(false)

  const startGame = () => {
    const d = shuffle()
    const tr = d[d.length-1].suit
    const ph = d.splice(0,6), ah = d.splice(0,6)
    setDeck(d); setTrump(tr); setPlayerHand(ph); setAiHand(ah)
    setAtkCard(null); setDefCard(null); setPhase('player-atk')
    setMsg('Ваш хід — оберіть карту для атаки'); setStarted(true)
  }

  useEffect(()=>{ startGame() }, [])

  const cardColor = (s: string) => (s==='♥'||s==='♦')?'#ef4444':'#f5f0e8'
  const isOver = phase==='won'||phase==='lost'

  const playerAttack = (card: DCard) => {
    if (phase!=='player-atk') return
    const ph = playerHand.filter(c=>c.id!==card.id)
    const ah = aiHand, dk = deck
    setPlayerHand(ph); setAtkCard(card); setDefCard(null)
    setPhase('ai-def'); setMsg('Комп\'ютер відбивається...')
    setTimeout(()=>{
      const def = ah.find(c=>beats(card,c,tr))
      const tr = trump
      if (def) {
        const nah = ah.filter(c=>c.id!==def.id)
        setAiHand(nah); setDefCard(def)
        if (nah.length===0&&dk.length===0) { setPhase('lost'); setMsg('Комп\'ютер переміг — у нього більше немає карт!'); return }
        setMsg('Захищено! Тепер атакує комп\'ютер.'); setPhase('ai-atk')
        setTimeout(()=>doAIAttack(ph,nah,dk,tr), 1000)
      } else {
        const nah = [...ah, card]
        const [np,na,nd] = refill(ph,nah,[...dk])
        setPlayerHand(np); setAiHand(na); setDeck(nd); setAtkCard(null)
        if (na.length===0&&nd.length===0) { setPhase('won'); setMsg('🎉 Ви виграли! Комп\'ютер — дурак!'); return }
        setPhase('player-atk'); setMsg('Комп\'ютер взяв карту. Ваша черга атакувати.')
      }
    }, 700)
  }

  const doAIAttack = (ph: DCard[], ah: DCard[], dk: DCard[], tr: string) => {
    if (!ah.length) { const [np,na,nd]=refill(ph,ah,[...dk]); setPlayerHand(np);setAiHand(na);setDeck(nd); setPhase('player-atk');setMsg('Ваша черга атакувати'); return }
    const sorted = [...ah].sort((a,b)=>{
      if (a.suit===tr&&b.suit!==tr) return 1
      if (b.suit===tr&&a.suit!==tr) return -1
      return RV[a.rank]-RV[b.rank]
    })
    const card = sorted[0]
    const nah = ah.filter(c=>c.id!==card.id)
    setAiHand(nah); setAtkCard(card); setDefCard(null)
    setPhase('player-def'); setMsg(`Комп'ютер атакує ${card.rank}${card.suit} — відбийтесь або візьміть`)
  }

  const playerDefend = (card: DCard) => {
    if (phase!=='player-def'||!atkCard) return
    if (!beats(atkCard,card,trump)) { setMsg('Ця карта не б\'є! Оберіть іншу або натисніть «Взяти».'); return }
    const ph = playerHand.filter(c=>c.id!==card.id)
    if (ph.length===0&&deck.length===0) { setPlayerHand(ph); setPhase('won'); setMsg('🎉 Ви виграли!'); return }
    const [np,na,nd] = refill(ph,aiHand,[...deck])
    setPlayerHand(np); setAiHand(na); setDeck(nd); setAtkCard(null); setDefCard(card)
    if (na.length===0&&nd.length===0) { setPhase('won'); setMsg('🎉 Ви виграли! Комп\'ютер — дурак!'); return }
    const tr = trump
    setPhase('player-atk'); setMsg('Ви відбились! Тепер атакуйте.')
    void tr
  }

  const playerTake = () => {
    if (phase!=='player-def'||!atkCard) return
    const ph = [...playerHand, atkCard]
    const [np,na,nd] = refill(ph,aiHand,[...deck])
    setPlayerHand(np); setAiHand(na); setDeck(nd); setAtkCard(null)
    if (na.length===0&&nd.length===0) { setPhase('won'); setMsg('🎉 Ви виграли! Комп\'ютер — дурак!'); return }
    const tr = trump
    setPhase('player-atk'); setMsg('Ви взяли карту. Тепер атакуйте.')
    void tr
  }

  const CardEl = ({card, onClick, selected, faceDown}: {card?: DCard, onClick?:()=>void, selected?:boolean, faceDown?:boolean}) => (
    faceDown
      ? <div style={{width:40,height:56,borderRadius:8,background:'#1e3a5f',border:'1px solid rgba(255,255,255,0.15)',flexShrink:0}}/>
      : card ? <div onClick={onClick} style={{background:selected?'rgba(240,165,0,0.25)':'rgba(255,255,255,0.1)',border:`1.5px solid ${selected?GOLD:card.suit===trump?'#ef9f27':'rgba(255,255,255,0.2)'}`,borderRadius:8,padding:'6px 8px',cursor:onClick?'pointer':'default',textAlign:'center',minWidth:40,flexShrink:0,fontFamily:FONT}}>
        <div style={{fontSize:12,fontWeight:700,color:cardColor(card.suit)}}>{card.rank}</div>
        <div style={{fontSize:14,color:cardColor(card.suit)}}>{card.suit}</div>
      </div> : null
  )

  if (!started) return <div style={{color:'#f5f0e8',textAlign:'center',padding:20,fontFamily:FONT}}>Завантаження...</div>

  return (
    <div style={{fontFamily:FONT}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#8899bb',fontSize:14,marginBottom:8,fontFamily:FONT}}>← Назад</button>
      <div style={{textAlign:'center',fontSize:16,fontWeight:700,color:'#f5f0e8',marginBottom:2}}>Дурак 🃏</div>
      <div style={{textAlign:'center',fontSize:12,color:'#8899bb',marginBottom:10}}>Козир: <span style={{color:cardColor(trump),fontWeight:700}}>{trump}</span> · Колода: {deck.length}</div>

      <div style={{marginBottom:8}}>
        <div style={{fontSize:11,color:'#8899bb',marginBottom:4,textAlign:'center'}}>Комп&apos;ютер ({aiHand.length})</div>
        <div style={{display:'flex',gap:4,justifyContent:'center',flexWrap:'wrap'}}>
          {aiHand.map((_,i)=><CardEl key={i} faceDown/>)}
        </div>
      </div>

      <div style={{minHeight:80,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:'10px 12px',marginBottom:8,display:'flex',gap:16,justifyContent:'center',alignItems:'center'}}>
        {atkCard ? (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:10,color:'#8899bb',marginBottom:4}}>Атака</div>
            <CardEl card={atkCard}/>
            {defCard&&<><div style={{fontSize:10,color:'#8899bb',marginTop:4,marginBottom:4}}>Захист</div><CardEl card={defCard}/></>}
          </div>
        ) : <div style={{color:'#556688',fontSize:13}}>Стіл порожній</div>}
      </div>

      <div style={{textAlign:'center',fontSize:13,color:isOver?GOLD:'#f5f0e8',fontWeight:600,marginBottom:8,padding:'8px',background:'rgba(255,255,255,0.04)',borderRadius:8}}>{msg}</div>

      <div style={{marginBottom:8}}>
        <div style={{fontSize:11,color:'#8899bb',marginBottom:4}}>Ваші карти ({playerHand.length})</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {playerHand.map(card=>(
            <CardEl key={card.id} card={card}
              onClick={()=>{ if(phase==='player-atk') playerAttack(card); else if(phase==='player-def') playerDefend(card) }}
            />
          ))}
        </div>
      </div>

      {phase==='player-def'&&(
        <button onClick={playerTake} style={{width:'100%',background:'rgba(239,68,68,0.2)',color:'#fca5a5',border:'1px solid rgba(239,68,68,0.4)',borderRadius:12,padding:'12px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:FONT,marginBottom:8}}>
          Взяти карту
        </button>
      )}
      {isOver&&(
        <button onClick={startGame} style={{width:'100%',background:GOLD,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT}}>
          Нова гра
        </button>
      )}
    </div>
  )
}

// ─── Poker Game ───────────────────────────────────────────────────────────────

function PokerGame({ onBack }: { onBack: () => void }) {
  const SUITS = ['♠','♥','♦','♣']
  const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A']
  const RV: Record<string,number> = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14}

  interface PCard { suit: string; rank: string; id: number }

  const shuffle = (): PCard[] => {
    const d: PCard[] = []; let id=0
    for (const s of SUITS) for (const r of RANKS) d.push({suit:s,rank:r,id:id++})
    return d.sort(()=>Math.random()-0.5)
  }

  const evalHand = (cards: PCard[]): {score:number, name:string} => {
    const vals = cards.map(c=>RV[c.rank]).sort((a,b)=>b-a)
    const suits = cards.map(c=>c.suit)
    const vc: Record<number,number> = {}
    for (const v of vals) vc[v]=(vc[v]||0)+1
    const counts = Object.values(vc).sort((a,b)=>b-a)
    const isFlush = suits.every(s=>s===suits[0])
    const isStraight = vals[0]-vals[4]===4&&counts[0]===1
    const isWheel = vals[0]===14&&vals[1]===5&&vals[2]===4&&vals[3]===3&&vals[4]===2
    const straight = isStraight||isWheel
    if (isFlush&&straight&&vals[0]===14&&!isWheel) return {score:9,name:'Роял-флеш 👑'}
    if (isFlush&&straight) return {score:8,name:'Стрит-флеш'}
    if (counts[0]===4) return {score:7,name:'Каре'}
    if (counts[0]===3&&counts[1]===2) return {score:6,name:'Фул-хаус'}
    if (isFlush) return {score:5,name:'Флеш'}
    if (straight) return {score:4,name:'Стрит'}
    if (counts[0]===3) return {score:3,name:'Трійка'}
    if (counts[0]===2&&counts[1]===2) return {score:2,name:'Дві пари'}
    if (counts[0]===2) return {score:1,name:'Пара'}
    return {score:0,name:`Старша: ${cards.sort((a,b)=>RV[b.rank]-RV[a.rank])[0].rank}`}
  }

  const [deck, setDeck] = useState<PCard[]>([])
  const [playerHand, setPlayerHand] = useState<PCard[]>([])
  const [aiHand, setAiHand] = useState<PCard[]>([])
  const [discarded, setDiscarded] = useState<Set<number>>(new Set())
  const [phase, setPhase] = useState<'discard'|'result'>('discard')
  const [chips, setChips] = useState(100)
  const [bet] = useState(10)
  const [result, setResult] = useState<{ph:string,ah:string,winner:'player'|'ai'|'tie'}|null>(null)

  const deal = () => {
    const d = shuffle()
    setDeck(d.slice(10)); setPlayerHand(d.slice(0,5)); setAiHand(d.slice(5,10))
    setDiscarded(new Set()); setPhase('discard'); setResult(null)
  }

  useEffect(()=>{ deal() }, [])

  const toggleDiscard = (id: number) => {
    if (phase!=='discard') return
    setDiscarded(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n })
  }

  const drawCards = () => {
    if (phase!=='discard') return
    const d = [...deck]
    const ph = playerHand.map(c=>discarded.has(c.id)?(d.shift()??c):c)
    // AI keeps pairs and high cards, discards rest
    const vc: Record<string,number> = {}; for (const c of aiHand) vc[c.rank]=(vc[c.rank]||0)+1
    const ah = aiHand.map(c=>vc[c.rank]===1&&RV[c.rank]<10?(d.shift()??c):c)
    const pr = evalHand(ph), ar = evalHand(ah)
    const winner = pr.score>ar.score?'player':pr.score<ar.score?'ai':'tie'
    setPlayerHand(ph); setAiHand(ah); setDeck(d)
    setResult({ph:pr.name, ah:ar.name, winner})
    if (winner==='player') setChips(c=>c+bet)
    else if (winner==='ai') setChips(c=>Math.max(0,c-bet))
    setPhase('result')
  }

  const cardColor = (s: string) => (s==='♥'||s==='♦')?'#ef4444':'#f5f0e8'

  const CardEl = ({card, selected, onClick, back}: {card?: PCard, selected?: boolean, onClick?:()=>void, back?:boolean}) => (
    back
      ? <div style={{width:44,height:64,borderRadius:10,background:'#1e3a5f',border:'1px solid rgba(255,255,255,0.15)',flexShrink:0}}/>
      : card
        ? <div onClick={onClick} style={{background:selected?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.1)',border:`2px solid ${selected?'#ef4444':'rgba(255,255,255,0.2)'}`,borderRadius:10,padding:'8px 10px',cursor:onClick?'pointer':'default',textAlign:'center',minWidth:44,transform:selected?'translateY(8px)':'none',transition:'all 0.15s',fontFamily:FONT,flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:700,color:cardColor(card.suit)}}>{card.rank}</div>
            <div style={{fontSize:16,color:cardColor(card.suit)}}>{card.suit}</div>
          </div>
        : null
  )

  return (
    <div style={{fontFamily:FONT}}>
      <button onClick={onBack} style={{background:'none',border:'none',cursor:'pointer',color:'#8899bb',fontSize:14,marginBottom:8,fontFamily:FONT}}>← Назад</button>
      <div style={{textAlign:'center',marginBottom:10}}>
        <div style={{fontSize:20,fontWeight:700,color:'#f5f0e8',marginBottom:2}}>Покер 🂡</div>
        <div style={{fontSize:13,color:'#8899bb'}}>Фішки: <span style={{color:GOLD,fontWeight:700}}>{chips}</span> · Ставка: {bet}</div>
      </div>

      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:'#8899bb',marginBottom:6,textAlign:'center'}}>
          Комп&apos;ютер{result?` — ${result.ah}`:''}
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          {phase==='result' ? aiHand.map(c=><CardEl key={c.id} card={c}/>) : aiHand.map((_,i)=><CardEl key={i} back/>)}
        </div>
      </div>

      {result&&(
        <div style={{textAlign:'center',padding:'12px',background:'rgba(255,255,255,0.04)',borderRadius:12,marginBottom:10}}>
          <div style={{fontSize:24,marginBottom:4}}>{result.winner==='player'?'🎉':result.winner==='tie'?'🤝':'😔'}</div>
          <div style={{fontSize:16,fontWeight:700,color:result.winner==='player'?'#22c55e':result.winner==='tie'?GOLD:'#ef4444'}}>
            {result.winner==='player'?`Ви виграли! +${bet} фішок`:result.winner==='tie'?'Нічия!':'Комп\'ютер виграв'}
          </div>
          <div style={{fontSize:12,color:'#8899bb',marginTop:4}}>Ваша рука: {result.ph} · Комп&apos;ютер: {result.ah}</div>
        </div>
      )}

      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:'#8899bb',marginBottom:6,textAlign:'center'}}>
          {phase==='discard'?'Клікніть карти для скиду, потім «Замінити»':`Ваша рука — ${result?.ph}`}
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center'}}>
          {playerHand.map(c=><CardEl key={c.id} card={c} selected={discarded.has(c.id)} onClick={phase==='discard'?()=>toggleDiscard(c.id):undefined}/>)}
        </div>
      </div>

      {phase==='discard'&&(
        <button onClick={drawCards} style={{width:'100%',background:GOLD,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT,marginBottom:8}}>
          {discarded.size?`Замінити ${discarded.size} карт`:'Залишити всі карти'}
        </button>
      )}
      {phase==='result'&&(
        <button onClick={deal} style={{width:'100%',background:GOLD,color:'#fff',border:'none',borderRadius:12,padding:'14px',fontSize:16,fontWeight:700,cursor:'pointer',fontFamily:FONT}}>
          Нова роздача
        </button>
      )}
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
    audio.src = q.audioClip; audio.currentTime = 0
    audio.play().catch(console.error); setClipPlaying(true)
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

  const resetGame = () => { setQuizIdx(0); setAnswered(null); setScore(0); setDone(false); setFeedback(null); setClipPlaying(false) }

  const btnStyle = (idx: number) => {
    if (answered === null) return { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', color: '#f5f0e8' }
    if (idx === q.correctIdx) return { bg: 'rgba(34,197,94,0.2)', border: '#22c55e', color: '#86efac' }
    if (idx === answered) return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', color: '#fca5a5' }
    return { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.06)', color: '#556688' }
  }

  const GAME_GRID = [
    { id: 'voice', label: 'Вгадай голос', desc: 'Слухай і вгадуй', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="13" y="4" width="14" height="20" rx="7" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/><path d="M20 15 L20 18" stroke="#F5F3EE" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 20 Q7 30 20 30 Q33 30 33 20" stroke="#D4A017" strokeWidth="1.5" fill="none" strokeLinecap="round"/><line x1="20" y1="30" x2="20" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="36" x2="26" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id: 'text', label: 'Вікторина', desc: '3 питання', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="17" r="13" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/><text x="20" y="24" textAnchor="middle" fill="#D4A017" fontSize="20" fontWeight="800">?</text><rect x="2" y="34" width="36" height="3" rx="1.5" fill="rgba(245,243,238,0.1)"/><rect x="2" y="34" width="22" height="3" rx="1.5" fill="#D4A017" opacity="0.8"/></svg> },
    { id: 'memory', label: 'Пам\'ять', desc: 'Запам\'ятай слова', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="2" y="2" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/><text x="10.5" y="14.5" textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="700">А</text><rect x="21" y="2" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/><text x="29.5" y="14.5" textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="700">А</text><rect x="2" y="21" width="17" height="17" rx="3" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/><text x="10.5" y="33.5" textAnchor="middle" fill="#F5F3EE" fontSize="10" fontWeight="700">Б</text><rect x="21" y="21" width="17" height="17" rx="3" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/><text x="29.5" y="33.5" textAnchor="middle" fill="#F5F3EE" fontSize="12" fontWeight="700">?</text></svg> },
    { id: 'connections', label: "Зв'язки", desc: '4 групи слів', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="1" y="2" width="17" height="8" rx="2" fill="rgba(212,160,23,0.3)" stroke="#D4A017" strokeWidth="1"/><text x="9.5" y="9" textAnchor="middle" fill="#D4A017" fontSize="6" fontWeight="700">КВІТИ</text><rect x="22" y="2" width="17" height="8" rx="2" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1"/><text x="30.5" y="9" textAnchor="middle" fill="#93c5fd" fontSize="6" fontWeight="700">ДЕРЕВА</text><rect x="1" y="16" width="17" height="8" rx="2" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="1"/><text x="9.5" y="23" textAnchor="middle" fill="#86efac" fontSize="6" fontWeight="700">ФРУКТИ</text><rect x="22" y="16" width="17" height="8" rx="2" fill="rgba(168,85,247,0.3)" stroke="#a855f7" strokeWidth="1"/><text x="30.5" y="23" textAnchor="middle" fill="#d8b4fe" fontSize="5.5" fontWeight="700">ЯГОДИ</text><rect x="5" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/><rect x="16" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/><rect x="27" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/></svg> },
    { id: 'tictactoe', label: 'Хрестики-нулики', desc: 'Проти комп\'ютера', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><line x1="14" y1="2" x2="14" y2="38" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/><line x1="26" y1="2" x2="26" y2="38" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="14" x2="38" y2="14" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="26" x2="38" y2="26" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/><text x="7" y="12" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text><circle cx="32" cy="8" r="4" stroke="#60a5fa" strokeWidth="1.5" fill="none"/><text x="7" y="24" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text><circle cx="20" cy="20" r="4" stroke="#60a5fa" strokeWidth="1.5" fill="none"/><text x="32" y="36" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text></svg> },
    { id: 'chess', label: 'Шахи', desc: '3 рівні складності', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><text x="20" y="28" textAnchor="middle" fill="#D4A017" fontSize="28">♔</text></svg> },
    { id: 'checkers', label: 'Шашки', desc: 'Класичні шашки', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="13" cy="15" r="8" fill="rgba(220,38,38,0.8)" stroke="#991b1b" strokeWidth="1.5"/><circle cx="27" cy="25" r="8" fill="rgba(30,41,59,0.9)" stroke="#0f172a" strokeWidth="1.5"/><circle cx="27" cy="25" r="4" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/></svg> },
    { id: 'durak', label: 'Дурак', desc: 'Карткова гра', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="4" y="6" width="20" height="28" rx="3" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/><text x="14" y="26" textAnchor="middle" fill="#ef4444" fontSize="16" fontWeight="700">♥</text><rect x="16" y="10" width="20" height="28" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><text x="26" y="30" textAnchor="middle" fill="#f5f0e8" fontSize="16" fontWeight="700">♠</text></svg> },
    { id: 'poker', label: 'Покер', desc: 'П\'ять карт', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="2" y="8" width="14" height="20" rx="2" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/><text x="9" y="22" textAnchor="middle" fill="#ef4444" fontSize="12">♦</text><rect x="10" y="10" width="14" height="20" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><text x="17" y="24" textAnchor="middle" fill="#f5f0e8" fontSize="12">♣</text><rect x="18" y="8" width="14" height="20" rx="2" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/><text x="25" y="22" textAnchor="middle" fill="#ef4444" fontSize="12">♥</text><rect x="26" y="10" width="14" height="20" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/><text x="33" y="24" textAnchor="middle" fill="#f5f0e8" fontSize="12">♠</text></svg> },
    { id: 'leaderboard', label: 'Рейтинг', desc: 'Незабаром', svg: <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="13" y="16" width="14" height="22" rx="2" fill="#D4A017" opacity="0.9"/><rect x="2" y="22" width="11" height="16" rx="2" fill="rgba(245,243,238,0.25)" stroke="rgba(245,243,238,0.4)" strokeWidth="1"/><rect x="27" y="26" width="11" height="12" rx="2" fill="rgba(245,243,238,0.15)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/><text x="20" y="12" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="700">1</text><text x="7.5" y="20" textAnchor="middle" fill="#F5F3EE" fontSize="9">2</text><text x="32.5" y="24" textAnchor="middle" fill="#F5F3EE" fontSize="9">3</text></svg> },
  ]

  return (
    <section style={{ marginBottom: 56 }}>
      <audio ref={audioRef} />

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

        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#ef9f27', marginBottom: 12 }}>
          🎮 Ігри для мозку
        </div>

        {activeView === null && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {GAME_GRID.map(g => (
              <div key={g.id}
                onClick={() => {
                  if (g.id === 'voice') { setQuizType('voice'); setActiveView('voice') }
                  else if (g.id === 'text') { setQuizType('text'); setActiveView('text') }
                  else setActiveView(g.id as ActiveView)
                }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '18px 12px', cursor: 'pointer', textAlign: 'center' }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{g.svg}</div>
                <div style={{ fontSize: 15, color: '#f5f0e8', fontWeight: 500, fontFamily: "'Lora', serif" }}>{g.label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: "'Lora', serif" }}>{g.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'memory'      && <MemoryGame      onBack={() => setActiveView(null)} />}
        {activeView === 'connections' && <ConnectionsGame onBack={() => setActiveView(null)} />}
        {activeView === 'tictactoe'   && <TicTacToeGame   onBack={() => setActiveView(null)} />}
        {activeView === 'chess'       && <ChessGame        onBack={() => setActiveView(null)} />}
        {activeView === 'checkers'    && <CheckersGame     onBack={() => setActiveView(null)} />}
        {activeView === 'durak'       && <DurakGame        onBack={() => setActiveView(null)} />}
        {activeView === 'poker'       && <PokerGame        onBack={() => setActiveView(null)} />}

        {(activeView === 'voice' || activeView === 'text') && !done && (
          <div>
            <button onClick={() => { setActiveView(null); resetGame() }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>← Назад</button>
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
                  ? <><div style={{fontSize:20}}>Правильно!</div><div style={{fontSize:13,color:'#ef9f27',marginTop:6}}>Ох і пам&apos;ять у тебе, як у молодого козака!</div></>
                  : '✗ Не вірно — спробуй ще!'}
              </div>
            )}
          </div>
        )}

        {(activeView === 'voice' || activeView === 'text') && done && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <button onClick={() => { setActiveView(null); resetGame() }} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 18 }}>← Назад</button>
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
            <button onClick={() => setActiveView(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#8899bb', fontSize: 14, marginBottom: 20 }}>← Назад</button>
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#8899bb', fontSize: 16 }}>
              <div style={{ fontSize: 18, color: '#f5f0e8', marginBottom: 8 }}>Незабаром</div>
              <div style={{ fontSize: 14 }}>Рейтинг гравців у розробці</div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
