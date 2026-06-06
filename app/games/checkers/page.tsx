'use client'

import { useState, useEffect, useRef } from 'react'

/* ───────────────────────── Кольори бренду ───────────────────────── */
const NAVY = '#0E1A2B'
const NAVY2 = '#14253B'
const GOLD = '#EF9F27'
const GOLD_DARK = '#B5710C'
const GOLD_LIGHT = '#FAC775'
const CREAM = '#FFF8EE'
const TEXT_SOFT = '#B5D4F4'

/* клітини дошки */
const LIGHT_SQ = '#D7DAD8'
const DARK_SQ = '#1E3654'
const SEL_SQ = '#2E4E78'
const HINT = '#FAC775'

/* шашки (золоті — ваші, кремові — суперник) */
const W_GRAD = 'radial-gradient(circle at 36% 30%, #FBD78A, #E0960C)'
const W_EDGE = '#B5710C'
const B_GRAD = 'radial-gradient(circle at 36% 30%, #FFFDF7, #DDCEAE)'
const B_EDGE = '#8A7B5A'

/* ───────────────────────── Рушій (перевірено симуляцією) ───────────────────────── */
type Color = 'w' | 'b'
interface Piece { color: Color; king: boolean }
type Board = (Piece | null)[][]
interface Pos { r: number; c: number }
interface Move { path: Pos[]; captured: Pos[] }

const inside = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8
const opp = (col: Color): Color => (col === 'w' ? 'b' : 'w')
const cloneB = (b: Board): Board => b.map((row) => row.map((p) => (p ? { ...p } : null)))
const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]]

function initBoard(): Board {
  const b: Board = Array.from({ length: 8 }, () => Array(8).fill(null))
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2 === 1) {
      if (r < 3) b[r][c] = { color: 'b', king: false }
      else if (r > 4) b[r][c] = { color: 'w', king: false }
    }
  }
  return b
}

function captureSeqs(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (!piece) return []
  const results: Move[] = []
  function recurse(curR: number, curC: number, captured: Pos[], path: Pos[]) {
    let extended = false
    for (const [dr, dc] of DIRS) {
      if (piece!.king) {
        let nr = curR + dr, nc = curC + dc
        while (inside(nr, nc) && !board[nr][nc]) { nr += dr; nc += dc }
        if (inside(nr, nc) && board[nr][nc] && board[nr][nc]!.color === opp(piece!.color)
            && !captured.some((p) => p.r === nr && p.c === nc)) {
          let lr = nr + dr, lc = nc + dc
          while (inside(lr, lc) && (!board[lr][lc] || (lr === r && lc === c))) {
            extended = true
            recurse(lr, lc, [...captured, { r: nr, c: nc }], [...path, { r: lr, c: lc }])
            lr += dr; lc += dc
          }
        }
      } else {
        const mr = curR + dr, mc = curC + dc
        const lr = curR + 2 * dr, lc = curC + 2 * dc
        if (inside(lr, lc) && board[mr]?.[mc] && board[mr][mc]!.color === opp(piece!.color)
            && !captured.some((p) => p.r === mr && p.c === mc)
            && (!board[lr][lc] || (lr === r && lc === c))) {
          extended = true
          recurse(lr, lc, [...captured, { r: mr, c: mc }], [...path, { r: lr, c: lc }])
        }
      }
    }
    if (!extended && captured.length > 0) results.push({ path: [...path], captured: [...captured] })
  }
  recurse(r, c, [], [{ r, c }])
  return results
}

function quietMoves(board: Board, r: number, c: number): Move[] {
  const piece = board[r][c]
  if (!piece) return []
  const res: Move[] = []
  if (piece.king) {
    for (const [dr, dc] of DIRS) {
      let nr = r + dr, nc = c + dc
      while (inside(nr, nc) && !board[nr][nc]) { res.push({ path: [{ r, c }, { r: nr, c: nc }], captured: [] }); nr += dr; nc += dc }
    }
  } else {
    const fdr = piece.color === 'w' ? -1 : 1
    for (const dc of [-1, 1]) {
      const nr = r + fdr, nc = c + dc
      if (inside(nr, nc) && !board[nr][nc]) res.push({ path: [{ r, c }, { r: nr, c: nc }], captured: [] })
    }
  }
  return res
}

function legalMoves(board: Board, color: Color): Move[] {
  const caps: Move[] = [], quiets: Move[] = []
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (!p || p.color !== color) continue
    caps.push(...captureSeqs(board, r, c))
    quiets.push(...quietMoves(board, r, c))
  }
  return caps.length > 0 ? caps : quiets
}

function applyMove(board: Board, move: Move): Board {
  const nb = cloneB(board)
  const from = move.path[0], to = move.path[move.path.length - 1]
  const piece = nb[from.r][from.c]!
  nb[from.r][from.c] = null
  for (const cap of move.captured) nb[cap.r][cap.c] = null
  let king = piece.king
  if (!king && ((piece.color === 'w' && to.r === 0) || (piece.color === 'b' && to.r === 7))) king = true
  nb[to.r][to.c] = { color: piece.color, king }
  return nb
}

function countPieces(board: Board, color: Color): number {
  let n = 0
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c]?.color === color) n++
  return n
}

function gameWinner(board: Board, toMove: Color): Color | null {
  if (countPieces(board, 'w') === 0) return 'b'
  if (countPieces(board, 'b') === 0) return 'w'
  if (legalMoves(board, toMove).length === 0) return opp(toMove)
  return null
}

/* ───────────────────────── ШІ ───────────────────────── */
function evaluate(board: Board, me: Color): number {
  let s = 0
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (!p) continue
    let v = p.king ? 5 : 3
    // просування простих
    if (!p.king) v += (p.color === 'w' ? (7 - r) : r) * 0.12
    s += p.color === me ? v : -v
  }
  return s
}

function minimax(board: Board, depth: number, color: Color, me: Color, alpha: number, beta: number): number {
  const w = gameWinner(board, color)
  if (w) return w === me ? 9999 - (6 - depth) : -9999 + (6 - depth)
  if (depth === 0) return evaluate(board, me)
  const moves = legalMoves(board, color)
  if (color === me) {
    let best = -Infinity
    for (const m of moves) {
      best = Math.max(best, minimax(applyMove(board, m), depth - 1, opp(color), me, alpha, beta))
      alpha = Math.max(alpha, best)
      if (beta <= alpha) break
    }
    return best
  } else {
    let best = Infinity
    for (const m of moves) {
      best = Math.min(best, minimax(applyMove(board, m), depth - 1, opp(color), me, alpha, beta))
      beta = Math.min(beta, best)
      if (beta <= alpha) break
    }
    return best
  }
}

function chooseAIMove(board: Board, me: Color, level: 'easy' | 'normal' | 'hard'): Move | null {
  const moves = legalMoves(board, me)
  if (moves.length === 0) return null
  if (level === 'easy') {
    const caps = moves.filter((m) => m.captured.length > 0)
    const pool = caps.length > 0 ? caps : moves
    return pool[Math.floor(Math.random() * pool.length)]
  }
  const depth = level === 'hard' ? 8 : 5
  let best: Move | null = null, bestScore = -Infinity
  const shuffled = [...moves].sort(() => Math.random() - 0.5)
  for (const m of shuffled) {
    const sc = minimax(applyMove(board, m), depth - 1, opp(me), me, -Infinity, Infinity)
    if (sc > bestScore) { bestScore = sc; best = m }
  }
  return best
}

/* ───────────────────────── Компонент ───────────────────────── */
type Mode = 'ai' | 'duo'
type Phase = 'intro' | 'play' | 'over'
const LS_KEY = 'balabony_checkers_wins'

export default function CheckersGamePage() {
  const [phase, setPhase] = useState<Phase>('intro')
  const [mode, setMode] = useState<Mode>('ai')
  const [level, setLevel] = useState<'easy' | 'normal' | 'hard'>('easy')
  const [board, setBoard] = useState<Board>(() => initBoard())
  const [turn, setTurn] = useState<Color>('w')
  const [selected, setSelected] = useState<Pos | null>(null)
  const [result, setResult] = useState<Color | 'draw' | null>(null)
  const [msc, setMsc] = useState(0)
  const [wins, setWins] = useState(0)
  const [thinking, setThinking] = useState(false)

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  useEffect(() => {
    try { const v = window.localStorage.getItem(LS_KEY); if (v) setWins(Number(v)) } catch {}
  }, [])

  const prevPhaseRef = useRef(phase)
  useEffect(() => {
    if (prevPhaseRef.current === 'intro' && phase !== 'intro') { if (typeof window !== 'undefined') window.scrollTo({ top: 0 }) }
    prevPhaseRef.current = phase
  }, [phase])

  // гравець у режимі ai — білі (низ)
  const humanColor: Color = 'w'
  const moves = phase === 'play' && !result ? legalMoves(board, turn) : []
  const mustCapture = moves.some((m) => m.captured.length > 0)

  const begin = (m: Mode, lv: 'easy' | 'normal' | 'hard') => {
    clearTimers()
    setMode(m); setLevel(lv)
    setBoard(initBoard()); setTurn('w'); setSelected(null); setResult(null); setMsc(0); setThinking(false)
    setPhase('play')
  }

  const DRAW_LIMIT = 40 // півходів без взяття → нічия

  // Надійне визначення кінця партії: стежить за дошкою після кожного ходу.
  useEffect(() => {
    if (phase !== 'play' || result) return
    const w = gameWinner(board, turn)
    if (w) {
      setResult(w)
      setPhase('over')
      setThinking(false)
      if (mode === 'ai' && w === humanColor) {
        setWins((prev) => { const nv = prev + 1; try { window.localStorage.setItem(LS_KEY, String(nv)) } catch {} ; return nv })
      }
    } else if (msc >= DRAW_LIMIT) {
      setResult('draw')
      setPhase('over')
      setThinking(false)
    }
  }, [board, turn, phase, result, msc, mode])

  // Хід ШІ
  useEffect(() => {
    if (phase !== 'play' || result) return
    if (mode === 'ai' && turn !== humanColor) {
      setThinking(true)
      const t = setTimeout(() => {
        const mv = chooseAIMove(board, turn, level)
        setThinking(false)
        if (!mv) return // кінець зловить ефект завершення
        const nb = applyMove(board, mv)
        const nmsc = mv.captured.length > 0 ? 0 : msc + 1
        setBoard(nb); setMsc(nmsc); setTurn(opp(turn))
      }, 500)
      timers.current.push(t)
      return () => clearTimeout(t)
    }
  }, [turn, phase, mode, result, board, level, msc])

  const onCellTap = (r: number, c: number) => {
    if (phase !== 'play' || result || thinking) return
    if (mode === 'ai' && turn !== humanColor) return
    const piece = board[r][c]
    // обрати свою шашку
    if (piece && piece.color === turn) {
      const hasMove = moves.some((m) => m.path[0].r === r && m.path[0].c === c)
      if (hasMove) setSelected({ r, c })
      return
    }
    // тап по клітині-цілі
    if (selected) {
      const mv = moves.find((m) => m.path[0].r === selected.r && m.path[0].c === selected.c
        && m.path[m.path.length - 1].r === r && m.path[m.path.length - 1].c === c)
      if (mv) {
        const nb = applyMove(board, mv)
        const nmsc = mv.captured.length > 0 ? 0 : msc + 1
        setBoard(nb); setMsc(nmsc); setSelected(null); setTurn(opp(turn))
      }
    }
  }

  const reset = () => { clearTimers(); setPhase('intro'); setSelected(null); setResult(null) }

  // цілі для підсвічування
  const targets = selected
    ? moves.filter((m) => m.path[0].r === selected.r && m.path[0].c === selected.c).map((m) => m.path[m.path.length - 1])
    : []
  const isTarget = (r: number, c: number) => targets.some((t) => t.r === r && t.c === c)

  const turnLabel = mode === 'ai'
    ? (turn === humanColor ? 'Ваш хід' : 'Хід комп’ютера')
    : (turn === 'w' ? 'Ходять світлі' : 'Ходять темні')

  return (
    <main lang="uk" style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, padding: '32px 5% calc(88px + env(safe-area-inset-bottom, 0px))', fontFamily: "'Montserrat', sans-serif", color: '#fff' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {phase === 'intro' && (<>
          <nav style={{ marginBottom: 18, fontSize: 13, letterSpacing: 0.5 }}>
            <a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Усі ігри</a>
          </nav>
          <h1 style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 'clamp(30px, 6vw, 44px)', margin: '0 0 10px', lineHeight: 1.15, color: GOLD }}>Шашки</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.4)', borderRadius: 14, padding: '12px 16px', margin: '4px 0 22px' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M12 2 L20 5 V11 C20 16 16.5 20 12 22 C7.5 20 4 16 4 11 V5 Z" /><path d="M9 12 l2 2 l4 -4" />
            </svg>
            <div>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#fff', lineHeight: 1.35 }}>Тренує мислення, увагу й планування</div>
              <div style={{ fontSize: 14, color: '#D5E5F5', lineHeight: 1.45, marginTop: 4 }}>Настільні стратегічні ігри за спостережними даними пов’язані з нижчим ризиком зниження пам’яті в старшому віці</div>
            </div>
          </div>
          <p style={{ color: TEXT_SOFT, fontSize: 17, lineHeight: 1.55, margin: '0 0 22px' }}>
            Класичні шашки. Б’ємо по діагоналі, взяття обов’язкове, дамка ходить на будь-яку відстань. Без поспіху.
          </p>
          {wins > 0 && <p style={{ fontSize: 15, color: GOLD_DARK, fontWeight: 700, margin: '0 0 16px' }}>Перемог над комп’ютером: {wins}</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', maxWidth: 320, margin: '0 auto' }}>
            <button onClick={() => begin('ai', 'easy')} style={{ ...btnPrimary, width: '100%' }}>Проти комп’ютера · легко</button>
            <button onClick={() => begin('ai', 'normal')} style={{ ...btnPrimary, width: '100%' }}>Проти комп’ютера · звичайно</button>
            <button onClick={() => begin('ai', 'hard')} style={{ ...btnPrimary, width: '100%' }}>Проти комп’ютера · важко</button>
            <button onClick={() => begin('duo', 'easy')} style={{ ...btnGhost, width: '100%' }}>Удвох на пристрої</button>
          </div>
        </>)}

        {phase !== 'intro' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: GOLD_LIGHT }}>
                {result ? 'Партію завершено' : (thinking ? 'Комп’ютер думає…' : turnLabel)}
              </span>
              <span style={{ fontSize: 13, color: TEXT_SOFT, whiteSpace: 'nowrap' }}>● {countPieces(board, 'w')} : {countPieces(board, 'b')} ○</span>
            </div>

            <div style={{ width: '100%', maxWidth: 420, margin: '0 auto', aspectRatio: '1 / 1', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', borderRadius: 12, overflow: 'hidden', border: '5px solid #B5710C', boxShadow: '0 0 32px rgba(239,159,39,0.3), 0 16px 40px rgba(0,0,0,0.35)' }}>
              {board.map((row, r) => row.map((piece, c) => {
                const dark = (r + c) % 2 === 1
                const sel = selected && selected.r === r && selected.c === c
                const tgt = isTarget(r, c)
                return (
                  <div key={`${r}-${c}`} onClick={() => onCellTap(r, c)}
                    style={{ background: sel ? SEL_SQ : dark ? DARK_SQ : LIGHT_SQ, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: dark ? 'pointer' : 'default', position: 'relative' }}>
                    {tgt && <span style={{ position: 'absolute', width: '38%', height: '38%', borderRadius: '50%', background: HINT, boxShadow: '0 0 10px rgba(250,199,117,0.9)' }} />}
                    {piece && (
                      <span style={{ width: '82%', height: '82%', borderRadius: '50%', background: piece.color === 'w' ? W_GRAD : B_GRAD, border: `2.5px solid ${piece.color === 'w' ? W_EDGE : B_EDGE}`, boxShadow: sel ? '0 0 0 3px #B5D4F4, 0 0 16px rgba(181,212,244,0.9)' : '0 3px 6px rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {piece.king && (
                          <svg width="50%" height="50%" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 L4 9 L9 13 L12 6 L15 13 L20 9 L20 18 Z" fill={piece.color === 'w' ? '#14253B' : '#E0960C'} /></svg>
                        )}
                      </span>
                    )}
                  </div>
                )
              }))}
            </div>

            {mustCapture && !result && !thinking && (mode === 'duo' || turn === humanColor) && (
              <p style={{ textAlign: 'center', color: GOLD_LIGHT, fontSize: 14, marginTop: 10 }}>Є обов’язкове взяття — треба бити.</p>
            )}

            {result ? (
              <div style={{ textAlign: 'center', marginTop: 20, background: 'rgba(239,159,39,0.1)', border: '2px solid rgba(239,159,39,0.5)', borderRadius: 16, padding: '20px 18px' }}>
                <div style={{ fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 26, color: GOLD_LIGHT, lineHeight: 1.2 }}>
                  {result === 'draw'
                    ? 'Нічия'
                    : mode === 'ai'
                      ? (result === humanColor ? 'Ви перемогли!' : 'Ви програли')
                      : (result === 'w' ? 'Перемогли світлі' : 'Перемогли темні')}
                </div>
                <div style={{ fontSize: 16, color: TEXT_SOFT, marginTop: 8, lineHeight: 1.45 }}>
                  {result === 'draw'
                    ? 'Сили рівні — нічия.'
                    : mode === 'ai'
                      ? (result === humanColor ? 'Гарна гра! Зіграємо реванш?' : 'Переміг комп’ютер. Спробуєте реванш?')
                      : 'Зіграєте реванш?'}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
                  <button onClick={() => begin(mode, level)} style={btnPrimary}>Реванш</button>
                  <button onClick={reset} style={btnGhost}>Інший режим</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 18 }}>
                <button onClick={reset} style={btnGhostDark}>Завершити партію</button>
              </div>
            )}
          </>
        )}

        {phase === 'intro' && (
          <details style={detailsBox} className="bb-details">
            <summary style={summaryStyle}>Як грати й чим корисно</summary>
            <div style={detailsBody}>
              <p><b>Правила коротко.</b><br />Світлі починають. Прості шашки ходять по діагоналі вперед на одну клітину. Б’ють — перестрибуючи сусідню ворожу (вперед або назад). Взяття обов’язкове; якщо можна бити далі тією ж шашкою — біймо ланцюгом.</p>
              <p><b>Дамка.</b><br />Проста, що дійшла до останнього ряду, стає дамкою — ходить і б’є по діагоналі на будь-яку відстань.</p>
              <p><b>Чим корисно.</b><br />Шашки тренують планування, увагу та передбачення на кілька ходів уперед. Стратегічні настільні ігри за спостережними дослідженнями пов’язані з кращим збереженням когніції в старшому віці.</p>
              <p><b>Чи це лікує?</b><br />Ні. Це гра й корисна вправа для мислення, а не ліки й не заміна консультації лікаря.</p>
            </div>
          </details>
        )}

        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
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
      `}</style>
    </main>
  )
}

/* ───────────────────────── Стилі ───────────────────────── */
const btnPrimary: React.CSSProperties = {
  background: GOLD, color: NAVY, border: `2px solid ${GOLD_LIGHT}`, borderRadius: 24,
  padding: '13px 26px', fontSize: 17, fontWeight: 700, fontFamily: "'Montserrat', sans-serif",
  cursor: 'pointer', maxWidth: '100%', boxSizing: 'border-box',
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: '#C7D8EC', border: '2px solid rgba(181,212,244,0.4)', borderRadius: 24,
  padding: '12px 24px', fontSize: 16, fontWeight: 600, fontFamily: "'Montserrat', sans-serif",
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
  marginTop: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden',
}
const summaryStyle: React.CSSProperties = {
  cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: "'Montserrat', sans-serif",
}
const detailsBody: React.CSSProperties = {
  padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT,
}
