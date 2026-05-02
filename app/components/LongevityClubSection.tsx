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

type ActiveView = null | 'voice' | 'text' | 'memory' | 'leaderboard' | 'flutter' | 'connections' | 'tictactoe'

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
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="1" y="3" width="11" height="13" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="6.5" y="13.5" textAnchor="middle" fill="#F5F3EE" fontSize="8" fontWeight="700">А</text>
        <rect x="14" y="3" width="11" height="13" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="19.5" y="13.5" textAnchor="middle" fill="#F5F3EE" fontSize="8" fontWeight="700">Б</text>
        <rect x="27" y="3" width="11" height="13" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="32.5" y="13.5" textAnchor="middle" fill="#F5F3EE" fontSize="8" fontWeight="700">В</text>
        <path d="M20 17 L20 22" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M17.5 20.5 L20 23 L22.5 20.5" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="25" width="34" height="12" rx="2" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="20" y="34" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="800">А · Б · В</text>
      </svg>
    ),
  },
  {
    id: 'memory',
    title: 'Знайди пару',
    desc: 'Знаходь пари однакових карток',
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="2" y="2" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/>
        <path d="M10.5 6 L11.8 9.6 L15.5 9.6 L12.5 11.8 L13.7 15.5 L10.5 13.1 L7.3 15.5 L8.5 11.8 L5.5 9.6 L9.2 9.6 Z" fill="#D4A017"/>
        <rect x="21" y="2" width="17" height="17" rx="3" fill="rgba(245,243,238,0.05)" stroke="rgba(245,243,238,0.25)" strokeWidth="1"/>
        <text x="29.5" y="14.5" textAnchor="middle" fill="#F5F3EE" fontSize="12" fontWeight="700">?</text>
        <rect x="2" y="21" width="17" height="17" rx="3" fill="rgba(245,243,238,0.05)" stroke="rgba(245,243,238,0.25)" strokeWidth="1"/>
        <text x="10.5" y="33.5" textAnchor="middle" fill="#F5F3EE" fontSize="12" fontWeight="700">?</text>
        <rect x="21" y="21" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/>
        <path d="M29.5 25 L30.8 28.6 L34.5 28.6 L31.5 30.8 L32.7 34.5 L29.5 32.1 L26.3 34.5 L27.5 30.8 L24.5 28.6 L28.2 28.6 Z" fill="#D4A017"/>
      </svg>
    ),
  },
  {
    id: 'wordle',
    title: 'Вгадай слово',
    desc: 'Вгадай українське слово за 6 спроб',
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="1" y="5" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="4" y="10.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">С</text>
        <rect x="9" y="5" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="12" y="10.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">Л</text>
        <rect x="17" y="5" width="6" height="7" rx="1" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
        <text x="20" y="10.5" textAnchor="middle" fill="#F5F3EE" fontSize="5.5">О</text>
        <rect x="25" y="5" width="6" height="7" rx="1" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
        <text x="28" y="10.5" textAnchor="middle" fill="#F5F3EE" fontSize="5.5">В</text>
        <rect x="33" y="5" width="6" height="7" rx="1" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
        <text x="36" y="10.5" textAnchor="middle" fill="#F5F3EE" fontSize="5.5">О</text>
        <rect x="1" y="14" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="4" y="19.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">С</text>
        <rect x="9" y="14" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="12" y="19.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">Л</text>
        <rect x="17" y="14" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="20" y="19.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">О</text>
        <rect x="25" y="14" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="28" y="19.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">В</text>
        <rect x="33" y="14" width="6" height="7" rx="1" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1"/>
        <text x="36" y="19.5" textAnchor="middle" fill="#D4A017" fontSize="5.5" fontWeight="700">О</text>
        <rect x="1" y="28" width="38" height="3" rx="1.5" fill="rgba(245,243,238,0.1)"/>
        <rect x="1" y="28" width="24" height="3" rx="1.5" fill="#D4A017" opacity="0.8"/>
      </svg>
    ),
  },
  {
    id: 'word-chain',
    title: 'Ланцюжок слів',
    desc: 'Утворюй слова з останньої літери попереднього',
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="1" y="13" width="16" height="14" rx="2" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="9" y="23" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">КІТ</text>
        <path d="M18 20 L22 20" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M20 17.5 L23 20 L20 22.5" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="23" y="13" width="16" height="14" rx="2" fill="rgba(245,243,238,0.07)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
        <text x="31" y="23" textAnchor="middle" fill="#F5F3EE" fontSize="8" fontWeight="700">ТУН</text>
        <text x="20" y="10" textAnchor="middle" fill="#D4A017" fontSize="7" opacity="0.7">Т</text>
      </svg>
    ),
  },
  {
    id: 'quiz',
    title: 'Вікторина знань',
    desc: '20 питань з культури та природи України',
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="15" r="12" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="20" y="21" textAnchor="middle" fill="#D4A017" fontSize="18" fontWeight="800">?</text>
        <rect x="1" y="30" width="17" height="8" rx="2" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
        <text x="9.5" y="36.5" textAnchor="middle" fill="#F5F3EE" fontSize="6">Так</text>
        <rect x="22" y="30" width="17" height="8" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="30.5" y="36.5" textAnchor="middle" fill="#D4A017" fontSize="6">Ні</text>
      </svg>
    ),
  },
  {
    id: 'anagram',
    title: 'Анаграми',
    desc: 'Склади правильне слово з переставлених літер',
    svg: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="1" y="3" width="11" height="12" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="6.5" y="12.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">А</text>
        <rect x="14" y="3" width="11" height="12" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="19.5" y="12.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">Н</text>
        <rect x="27" y="3" width="11" height="12" rx="2" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1"/>
        <text x="32.5" y="12.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">Г</text>
        <path d="M7 16 Q20 22 33 16" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/>
        <path d="M30.5 14.5 L33 16.5 L30.5 18.5" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="26" width="10" height="12" rx="2" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="8" y="35.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">Н</text>
        <rect x="15" y="26" width="10" height="12" rx="2" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="20" y="35.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">А</text>
        <rect x="27" y="26" width="10" height="12" rx="2" fill="rgba(212,160,23,0.25)" stroke="#D4A017" strokeWidth="1.2"/>
        <text x="32" y="35.5" textAnchor="middle" fill="#D4A017" fontSize="8" fontWeight="700">Г</text>
      </svg>
    ),
  },
]

// ─── Connections Data ─────────────────────────────────────────────────────────

const FONT = "'Montserrat', Arial, sans-serif"
const BG   = '#0f1b35'
const GOLD = '#f0a500'

const CONNECTIONS_PUZZLES = [
  {
    title: 'Рослини',
    categories: [
      { label: 'Квіти',  color: GOLD,      words: ['Соняшник', 'Троянда', 'Волошка'] },
      { label: 'Дерева', color: '#3b82f6', words: ['Дуб', 'Береза', 'Верба'] },
      { label: 'Фрукти', color: '#22c55e', words: ['Яблуко', 'Груша', 'Слива'] },
      { label: 'Ягоди',  color: '#a855f7', words: ['Калина', 'Вишня', 'Смородина'] },
    ],
  },
  {
    title: 'Тварини',
    categories: [
      { label: 'Птахи',    color: GOLD,      words: ['Лелека', 'Соловей', 'Ластівка'] },
      { label: 'Риби',     color: '#3b82f6', words: ['Карась', 'Щука', 'Окунь'] },
      { label: 'Домашні',  color: '#22c55e', words: ['Корова', 'Кінь', 'Вівця'] },
      { label: 'Дикі',     color: '#a855f7', words: ['Вовк', 'Лисиця', 'Заєць'] },
    ],
  },
  {
    title: 'Їжа',
    categories: [
      { label: 'Супи',     color: GOLD,      words: ['Борщ', 'Капусняк', 'Юшка'] },
      { label: 'Страви',   color: '#3b82f6', words: ['Вареники', 'Голубці', 'Деруни'] },
      { label: 'Напої',    color: '#22c55e', words: ['Узвар', 'Кисіль', 'Квас'] },
      { label: 'Солодке',  color: '#a855f7', words: ['Медівник', 'Пундик', 'Коржі'] },
    ],
  },
  {
    title: 'Міста України',
    categories: [
      { label: 'Захід',    color: GOLD,      words: ['Львів', 'Луцьк', 'Рівне'] },
      { label: 'Схід',     color: '#3b82f6', words: ['Харків', 'Дніпро', 'Запоріжжя'] },
      { label: 'Південь',  color: '#22c55e', words: ['Одеса', 'Херсон', 'Миколаїв'] },
      { label: 'Північ',   color: '#a855f7', words: ['Київ', 'Чернігів', 'Житомир'] },
    ],
  },
  {
    title: 'Народні свята',
    categories: [
      { label: 'Зима',     color: GOLD,      words: ['Різдво', 'Маланка', 'Водохреще'] },
      { label: 'Весна',    color: '#3b82f6', words: ['Великдень', 'Провідна', 'Юрія'] },
      { label: 'Літо',     color: '#22c55e', words: ['Купала', 'Петра', 'Спаса'] },
      { label: 'Осінь',    color: '#a855f7', words: ['Покрова', 'Михайла', 'Катерини'] },
    ],
  },
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
        <div style={{ fontSize: 20, fontWeight: 700, color: '#f5f0e8' }}>Зв'язки · {puzzle.title}</div>
        <div style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>Знайдіть 4 групи по 3 слова</div>
        <div style={{ fontSize: 13, color: '#8899bb', marginTop: 4 }}>{'❤️'.repeat(lives)}{'🖤'.repeat(3 - lives)}</div>
      </div>

      {done && (
        <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 12 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{won ? '🎉' : '😔'}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: won ? GOLD : '#ef4444', marginBottom: 16 }}>
            {won ? 'Чудово! Всі групи знайдено!' : 'Спроби вичерпано!'}
          </div>
          <button onClick={nextPuzzle} style={{ background: GOLD, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, marginRight: 8 }}>
            Наступна головоломка
          </button>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.08)', color: '#f5f0e8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
            Інші ігри
          </button>
        </div>
      )}

      {/* Solved categories */}
      {solved.map(ci => (
        <div key={ci} style={{ background: puzzle.categories[ci].color, borderRadius: 12, padding: '12px 16px', marginBottom: 8, textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>{puzzle.categories[ci].label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>{puzzle.categories[ci].words.join(' · ')}</div>
        </div>
      ))}

      {/* Word grid */}
      {!done && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14, transition: shake ? 'none' : undefined, animation: shake ? 'shake 0.4s' : undefined }}>
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
    // Win
    for (const [a,c,d] of LINES) {
      const cells = [b[a],b[c],b[d]]
      if (cells.filter(x=>x==='О').length===2 && cells.includes(null)) return [a,c,d][cells.indexOf(null)]
    }
    // Block
    for (const [a,c,d] of LINES) {
      const cells = [b[a],b[c],b[d]]
      if (cells.filter(x=>x==='Х').length===2 && cells.includes(null)) return [a,c,d][cells.indexOf(null)]
    }
    // Center
    if (!b[4]) return 4
    // Corner
    for (const i of [0,2,6,8]) if (!b[i]) return i
    // Any
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
              style={{
                height: 90, borderRadius: 14, border: isWin ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)',
                background: isWin ? 'rgba(240,165,0,0.15)' : cell ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                fontSize: 36, fontWeight: 900, color: cell === 'Х' ? GOLD : '#60a5fa',
                cursor: !cell && status === 'playing' && playerTurn ? 'pointer' : 'default',
                fontFamily: FONT, transition: 'all 0.15s',
              }}>
              {cell}
            </button>
          )
        })}
      </div>

      {status !== 'playing' && (
        <button onClick={reset} style={{ width: '100%', background: GOLD, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}>
          Грати ще раз
        </button>
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
                  {game.svg}
                </div>
                <div style={{ fontSize: 15, color: '#f5f0e8', fontWeight: 500, fontFamily: "'Lora', serif" }}>{game.title}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: "'Lora', serif" }}>{game.desc}</div>
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
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="13" y="4" width="14" height="20" rx="7" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/>
                    <path d="M20 15 L20 18" stroke="#F5F3EE" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M7 20 Q7 30 20 30 Q33 30 33 20" stroke="#D4A017" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    <line x1="20" y1="30" x2="20" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="14" y1="36" x2="26" y2="36" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
              },
              {
                id: 'text', label: 'Вікторина', desc: '3 питання',
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="17" r="13" fill="rgba(212,160,23,0.15)" stroke="#D4A017" strokeWidth="1.2"/>
                    <text x="20" y="24" textAnchor="middle" fill="#D4A017" fontSize="20" fontWeight="800">?</text>
                    <rect x="2" y="34" width="36" height="3" rx="1.5" fill="rgba(245,243,238,0.1)"/>
                    <rect x="2" y="34" width="22" height="3" rx="1.5" fill="#D4A017" opacity="0.8"/>
                  </svg>
                ),
              },
              {
                id: 'memory', label: 'Пам\'ять', desc: 'Запам\'ятай слова',
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="2" y="2" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/>
                    <text x="10.5" y="14.5" textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="700">А</text>
                    <rect x="21" y="2" width="17" height="17" rx="3" fill="rgba(212,160,23,0.2)" stroke="#D4A017" strokeWidth="1"/>
                    <text x="29.5" y="14.5" textAnchor="middle" fill="#D4A017" fontSize="10" fontWeight="700">А</text>
                    <rect x="2" y="21" width="17" height="17" rx="3" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
                    <text x="10.5" y="33.5" textAnchor="middle" fill="#F5F3EE" fontSize="10" fontWeight="700">Б</text>
                    <rect x="21" y="21" width="17" height="17" rx="3" fill="rgba(245,243,238,0.06)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
                    <text x="29.5" y="33.5" textAnchor="middle" fill="#F5F3EE" fontSize="12" fontWeight="700">?</text>
                  </svg>
                ),
              },
              {
                id: 'leaderboard', label: 'Рейтинг', desc: 'Незабаром',
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="13" y="16" width="14" height="22" rx="2" fill="#D4A017" opacity="0.9"/>
                    <rect x="2" y="22" width="11" height="16" rx="2" fill="rgba(245,243,238,0.25)" stroke="rgba(245,243,238,0.4)" strokeWidth="1"/>
                    <rect x="27" y="26" width="11" height="12" rx="2" fill="rgba(245,243,238,0.15)" stroke="rgba(245,243,238,0.3)" strokeWidth="1"/>
                    <text x="20" y="12" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="700">1</text>
                    <text x="7.5" y="20" textAnchor="middle" fill="#F5F3EE" fontSize="9">2</text>
                    <text x="32.5" y="24" textAnchor="middle" fill="#F5F3EE" fontSize="9">3</text>
                  </svg>
                ),
              },
              {
                id: 'connections', label: "Зв'язки", desc: '4 групи по 3 слова',
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="1" y="2" width="17" height="8" rx="2" fill="rgba(212,160,23,0.3)" stroke="#D4A017" strokeWidth="1"/>
                    <text x="9.5" y="9" textAnchor="middle" fill="#D4A017" fontSize="6" fontWeight="700">КВІТИ</text>
                    <rect x="22" y="2" width="17" height="8" rx="2" fill="rgba(59,130,246,0.3)" stroke="#3b82f6" strokeWidth="1"/>
                    <text x="30.5" y="9" textAnchor="middle" fill="#93c5fd" fontSize="6" fontWeight="700">ДЕРЕВА</text>
                    <rect x="1" y="16" width="17" height="8" rx="2" fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth="1"/>
                    <text x="9.5" y="23" textAnchor="middle" fill="#86efac" fontSize="6" fontWeight="700">ФРУКТИ</text>
                    <rect x="22" y="16" width="17" height="8" rx="2" fill="rgba(168,85,247,0.3)" stroke="#a855f7" strokeWidth="1"/>
                    <text x="30.5" y="23" textAnchor="middle" fill="#d8b4fe" fontSize="5.5" fontWeight="700">ЯГОДИ</text>
                    <rect x="5" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/>
                    <rect x="16" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/>
                    <rect x="27" y="30" width="9" height="7" rx="1.5" fill="rgba(245,243,238,0.08)" stroke="rgba(245,243,238,0.2)" strokeWidth="1"/>
                  </svg>
                ),
              },
              {
                id: 'tictactoe', label: 'Хрестики-нулики', desc: 'Проти комп\'ютера',
                svg: (
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <line x1="14" y1="2" x2="14" y2="38" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="26" y1="2" x2="26" y2="38" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="2" y1="14" x2="38" y2="14" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="2" y1="26" x2="38" y2="26" stroke="rgba(245,243,238,0.25)" strokeWidth="1.5" strokeLinecap="round"/>
                    <text x="7" y="12" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text>
                    <circle cx="32" cy="8" r="4" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                    <text x="7" y="24" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text>
                    <circle cx="20" cy="20" r="4" stroke="#60a5fa" strokeWidth="1.5" fill="none"/>
                    <text x="32" y="36" textAnchor="middle" fill="#D4A017" fontSize="9" fontWeight="900">Х</text>
                    <path d="M5 29 L12 36" stroke="#D4A017" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 29 L5 36" stroke="#D4A017" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ),
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
                <div style={{ fontSize: 15, color: '#f5f0e8', fontWeight: 500, fontFamily: "'Lora', serif" }}>{g.label}</div>
                <div style={{ fontSize: 12, color: '#8899bb', marginTop: 4, fontFamily: "'Lora', serif" }}>{g.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'memory' && <MemoryGame onBack={() => setActiveView(null)} />}
        {activeView === 'connections' && <ConnectionsGame onBack={() => setActiveView(null)} />}
        {activeView === 'tictactoe' && <TicTacToeGame onBack={() => setActiveView(null)} />}

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
