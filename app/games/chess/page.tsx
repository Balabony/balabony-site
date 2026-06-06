'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ===================== ШАХОВИЙ РУШІЙ (перевірено PERFT) ===================== */
// Дошка — масив[64], 0 = a8 … 63 = h1. Фігури: 'PNBRQK' білі, малі — чорні, '' порожньо.

type Sq = number;
type Castle = { wK: boolean; wQ: boolean; bK: boolean; bQ: boolean };
type GState = { board: string[]; turn: 'w' | 'b'; castle: Castle; ep: number | null };
type Move = { from: Sq; to: Sq; promo?: string; cap?: boolean; castle?: 'K' | 'Q'; epCap?: boolean; dbl?: boolean };

const START_BOARD = (): string[] => {
  const b = new Array(64).fill('');
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
  for (let i = 0; i < 8; i++) { b[i] = back[i]; b[8 + i] = 'p'; b[48 + i] = 'P'; b[56 + i] = back[i].toUpperCase(); }
  return b;
};
const startState = (): GState => ({ board: START_BOARD(), turn: 'w', castle: { wK: true, wQ: true, bK: true, bQ: true }, ep: null });

const isW = (p: string) => !!p && p === p.toUpperCase();
const colorOf = (p: string): 'w' | 'b' | null => (p ? (isW(p) ? 'w' : 'b') : null);
const rc = (i: number): [number, number] => [Math.floor(i / 8), i % 8];
const idx = (r: number, c: number) => r * 8 + c;
const onB = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;

const N_OFF = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const K_OFF = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
const B_DIR = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const R_DIR = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function attacked(board: string[], sq: number, by: 'w' | 'b'): boolean {
  const [r, c] = rc(sq);
  const prow = by === 'w' ? r + 1 : r - 1;
  for (const dc of [-1, 1]) { if (onB(prow, c + dc)) { const p = board[idx(prow, c + dc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'P') return true; } }
  for (const [dr, dc] of N_OFF) { const nr = r + dr, nc = c + dc; if (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'N') return true; } }
  for (const [dr, dc] of K_OFF) { const nr = r + dr, nc = c + dc; if (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p && colorOf(p) === by && p.toUpperCase() === 'K') return true; } }
  for (const [dr, dc] of B_DIR) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p) { if (colorOf(p) === by && (p.toUpperCase() === 'B' || p.toUpperCase() === 'Q')) return true; break; } nr += dr; nc += dc; } }
  for (const [dr, dc] of R_DIR) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const p = board[idx(nr, nc)]; if (p) { if (colorOf(p) === by && (p.toUpperCase() === 'R' || p.toUpperCase() === 'Q')) return true; break; } nr += dr; nc += dc; } }
  return false;
}
function kingSq(board: string[], color: 'w' | 'b') { const k = color === 'w' ? 'K' : 'k'; for (let i = 0; i < 64; i++) if (board[i] === k) return i; return -1; }

function pseudoMoves(state: GState): Move[] {
  const { board, turn, castle, ep } = state;
  const me = turn, opp: 'w' | 'b' = turn === 'w' ? 'b' : 'w';
  const moves: Move[] = [];
  const push = (from: number, to: number, extra: Partial<Move> = {}) => moves.push({ from, to, ...extra });
  for (let i = 0; i < 64; i++) {
    const p = board[i]; if (!p || colorOf(p) !== me) continue;
    const [r, c] = rc(i); const t = p.toUpperCase();
    if (t === 'P') {
      const dir = me === 'w' ? -1 : 1;
      const startRow = me === 'w' ? 6 : 1;
      const promoRow = me === 'w' ? 0 : 7;
      if (onB(r + dir, c) && board[idx(r + dir, c)] === '') {
        const one = idx(r + dir, c);
        if (r + dir === promoRow) { for (const pr of ['Q', 'R', 'B', 'N']) push(i, one, { promo: pr }); }
        else push(i, one);
        if (r === startRow && board[idx(r + 2 * dir, c)] === '') push(i, idx(r + 2 * dir, c), { dbl: true });
      }
      for (const dc of [-1, 1]) {
        const nr = r + dir, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc);
        if (board[to] !== '' && colorOf(board[to]) === opp) {
          if (nr === promoRow) { for (const pr of ['Q', 'R', 'B', 'N']) push(i, to, { promo: pr, cap: true }); }
          else push(i, to, { cap: true });
        } else if (ep !== null && to === ep) push(i, to, { epCap: true });
      }
    } else if (t === 'N') {
      for (const [dr, dc] of N_OFF) { const nr = r + dr, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc); if (board[to] === '' || colorOf(board[to]) === opp) push(i, to, { cap: board[to] !== '' }); }
    } else if (t === 'K') {
      for (const [dr, dc] of K_OFF) { const nr = r + dr, nc = c + dc; if (!onB(nr, nc)) continue; const to = idx(nr, nc); if (board[to] === '' || colorOf(board[to]) === opp) push(i, to, { cap: board[to] !== '' }); }
      const homeRow = me === 'w' ? 7 : 0;
      if (r === homeRow && c === 4) {
        const kSide = me === 'w' ? castle.wK : castle.bK;
        const qSide = me === 'w' ? castle.wQ : castle.bQ;
        if (kSide && board[idx(homeRow, 5)] === '' && board[idx(homeRow, 6)] === '' && !attacked(board, idx(homeRow, 4), opp) && !attacked(board, idx(homeRow, 5), opp) && !attacked(board, idx(homeRow, 6), opp)) push(i, idx(homeRow, 6), { castle: 'K' });
        if (qSide && board[idx(homeRow, 3)] === '' && board[idx(homeRow, 2)] === '' && board[idx(homeRow, 1)] === '' && !attacked(board, idx(homeRow, 4), opp) && !attacked(board, idx(homeRow, 3), opp) && !attacked(board, idx(homeRow, 2), opp)) push(i, idx(homeRow, 2), { castle: 'Q' });
      }
    } else {
      const dirs = t === 'B' ? B_DIR : t === 'R' ? R_DIR : [...B_DIR, ...R_DIR];
      for (const [dr, dc] of dirs) { let nr = r + dr, nc = c + dc; while (onB(nr, nc)) { const to = idx(nr, nc); if (board[to] === '') push(i, to); else { if (colorOf(board[to]) === opp) push(i, to, { cap: true }); break; } nr += dr; nc += dc; } }
    }
  }
  return moves;
}

function makeMove(state: GState, m: Move): GState {
  const board = state.board.slice();
  const castle = { ...state.castle };
  const me = state.turn, opp: 'w' | 'b' = me === 'w' ? 'b' : 'w';
  let ep: number | null = null;
  const p = board[m.from];
  board[m.from] = '';
  if (m.epCap) { const [tr, tc] = rc(m.to); const capRow = me === 'w' ? tr + 1 : tr - 1; board[idx(capRow, tc)] = ''; }
  if (m.promo) board[m.to] = me === 'w' ? m.promo : m.promo.toLowerCase();
  else board[m.to] = p;
  if (m.castle) { const [r] = rc(m.from); if (m.castle === 'K') { board[idx(r, 5)] = board[idx(r, 7)]; board[idx(r, 7)] = ''; } else { board[idx(r, 3)] = board[idx(r, 0)]; board[idx(r, 0)] = ''; } }
  if (m.dbl) { const [fr, fc] = rc(m.from); ep = idx(fr + (me === 'w' ? -1 : 1), fc); }
  if (p.toUpperCase() === 'K') { if (me === 'w') { castle.wK = false; castle.wQ = false; } else { castle.bK = false; castle.bQ = false; } }
  const corners: Record<number, keyof Castle> = { 56: 'wQ', 63: 'wK', 0: 'bQ', 7: 'bK' };
  if (corners[m.from]) castle[corners[m.from]] = false;
  if (corners[m.to]) castle[corners[m.to]] = false;
  return { board, turn: opp, castle, ep };
}

function legalMoves(state: GState): Move[] {
  const opp: 'w' | 'b' = state.turn === 'w' ? 'b' : 'w';
  const res: Move[] = [];
  for (const m of pseudoMoves(state)) {
    const ns = makeMove(state, m);
    if (!attacked(ns.board, kingSq(ns.board, state.turn), opp)) res.push(m);
  }
  return res;
}
const inCheck = (s: GState) => attacked(s.board, kingSq(s.board, s.turn), s.turn === 'w' ? 'b' : 'w');

/* ===================== ШТУЧНИЙ ІНТЕЛЕКТ (мінімакс + альфа-бета) ===================== */
const VAL: Record<string, number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 20000 };
function evaluate(s: GState): number {
  let sc = 0;
  for (let i = 0; i < 64; i++) { const p = s.board[i]; if (!p) continue; const v = VAL[p.toUpperCase()]; sc += isW(p) ? v : -v; }
  return sc; // позитив — добре для білих
}
function search(s: GState, depth: number, alpha: number, beta: number): number {
  if (depth === 0) return evaluate(s);
  const moves = legalMoves(s);
  if (moves.length === 0) return inCheck(s) ? (s.turn === 'w' ? -100000 - depth : 100000 + depth) : 0;
  moves.sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0)); // спершу взяття
  if (s.turn === 'w') {
    let best = -Infinity;
    for (const m of moves) { best = Math.max(best, search(makeMove(s, m), depth - 1, alpha, beta)); alpha = Math.max(alpha, best); if (beta <= alpha) break; }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) { best = Math.min(best, search(makeMove(s, m), depth - 1, alpha, beta)); beta = Math.min(beta, best); if (beta <= alpha) break; }
    return best;
  }
}
function bestMove(s: GState, depth: number): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  moves.sort((a, b) => (b.cap ? 1 : 0) - (a.cap ? 1 : 0));
  let chosen = moves[0]; let bestScore = s.turn === 'w' ? -Infinity : Infinity;
  for (const m of moves) {
    const sc = search(makeMove(s, m), depth - 1, -Infinity, Infinity);
    if (s.turn === 'w' ? sc > bestScore : sc < bestScore) { bestScore = sc; chosen = m; }
  }
  return chosen;
}

/* ===================== ВІЗУАЛ ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', GREY = '#C9CDCB', CREAM = '#FFF8EE', BLUE = '#B5D4F4';
const LIGHTSQ = '#E6C98C', DARKSQ = '#B5803A', GRID = 'rgba(20,37,59,0.22)', LBL_LIGHT = '#7a5a1e', LBL_DARK = '#FBEFD6';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', GOLD_BRIGHT = '#FFD78A', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';
const FILES = 'abcdefgh';
const pieceSrc = (p: string) => `/chess/${isW(p) ? 'w' : 'b'}${p.toUpperCase()}.svg`;
const fmtTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

type Mode = 'ai' | 'two';

export default function ChessPage() {
  const [state, setState] = useState<GState>(startState);
  const [mode, setMode] = useState<Mode>('ai');
  const [level, setLevel] = useState<number>(2); // 1,2,3 -> глибина 2,3,4
  const [sel, setSel] = useState<number | null>(null);
  const [legal, setLegal] = useState<Move[]>([]);
  const [last, setLast] = useState<{ from: number; to: number } | null>(null);
  const [promo, setPromo] = useState<{ from: number; to: number } | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [thinking, setThinking] = useState(false);
  const [clock, setClock] = useState({ w: 0, b: 0 });
  const [flip, setFlip] = useState(false);

  const allLegal = useCallback((s: GState) => legalMoves(s), []);
  const depth = level === 1 ? 2 : level === 3 ? 4 : 3;

  // годинник-секундомір: рахує час того, чий хід
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setClock((c) => ({ ...c, [state.turn]: c[state.turn] + 1 })), 1000);
    return () => clearInterval(id);
  }, [state.turn, result]);

  // перевірка кінця гри
  const checkEnd = useCallback((s: GState) => {
    const moves = legalMoves(s);
    if (moves.length === 0) {
      if (inCheck(s)) setResult(s.turn === 'w' ? 'Мат. Перемогли чорні.' : 'Мат. Перемогли білі.');
      else setResult('Пат — нічия.');
      return true;
    }
    return false;
  }, []);

  const applyMove = useCallback((s: GState, m: Move) => {
    const ns = makeMove(s, m);
    setState(ns); setLast({ from: m.from, to: m.to }); setSel(null); setLegal([]);
    checkEnd(ns);
    return ns;
  }, [checkEnd]);

  // хід комп'ютера
  useEffect(() => {
    if (mode !== 'ai' || result || state.turn !== 'b') return;
    setThinking(true);
    const id = setTimeout(() => {
      const m = bestMove(state, depth);
      if (m) applyMove(state, m);
      setThinking(false);
    }, 120);
    return () => clearTimeout(id);
  }, [state, mode, result, depth, applyMove]);

  const onSquare = (i: number) => {
    if (result || promo) return;
    if (mode === 'ai' && state.turn === 'b') return; // хід комп'ютера
    const p = state.board[i];
    if (sel === null) {
      if (p && colorOf(p) === state.turn) { setSel(i); setLegal(allLegal(state).filter((m) => m.from === i)); }
      return;
    }
    if (i === sel) { setSel(null); setLegal([]); return; }
    const cand = legal.filter((m) => m.to === i);
    if (cand.length === 0) {
      if (p && colorOf(p) === state.turn) { setSel(i); setLegal(allLegal(state).filter((m) => m.from === i)); }
      else { setSel(null); setLegal([]); }
      return;
    }
    if (cand.some((m) => m.promo)) { setPromo({ from: sel, to: i }); return; }
    applyMove(state, cand[0]);
  };

  const choosePromo = (pr: string) => {
    if (!promo) return;
    const m = allLegal(state).find((x) => x.from === promo.from && x.to === promo.to && x.promo === pr);
    if (m) applyMove(state, m);
    setPromo(null);
  };

  const newGame = () => { setState(startState()); setSel(null); setLegal([]); setLast(null); setResult(null); setClock({ w: 0, b: 0 }); setPromo(null); };

  const checkSq = inCheck(state) ? kingSq(state.board, state.turn) : -1;
  const order = flip ? [...Array(64).keys()].reverse() : [...Array(64).keys()];
  const status = result ? result
    : thinking ? 'Комп’ютер думає…'
      : `Хід: ${state.turn === 'w' ? 'білі' : 'чорні'}${inCheck(state) ? ' — шах!' : ''}`;

  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: 'min(92vw, 560px)' };
  const btn: React.CSSProperties = { flex: '1 1 0', minWidth: 0, fontFamily: 'Montserrat, sans-serif', fontSize: 14, padding: '9px 6px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: CARD, color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', boxShadow: '0 0 12px rgba(239,159,39,0.12)' };
  const btnActive: React.CSSProperties = { ...btn, background: GOLD, color: NAVY, borderColor: GOLD, boxShadow: '0 0 18px rgba(239,159,39,0.4)' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '8px 6px', borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)', boxShadow: active ? '0 0 18px rgba(239,159,39,0.4)' : '0 0 10px rgba(239,159,39,0.1)' });

  return (
    <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 5% 32px', fontFamily: 'Montserrat, sans-serif' }}>
      <h1 style={{ fontFamily: 'Lora, serif', fontSize: 34, margin: '0 0 6px', color: GOLD_LIGHT }}>Шахи</h1>
      <p style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 20px', maxWidth: 620, color: TEXT_DESC }}>
        Грайте проти комп’ютера (три рівні) або вдвох на одному пристрої. Спокійно, без поспіху — тренування планування й передбачення ходів.
      </p>

      <div style={ROW}>
        <button style={mode === 'ai' ? btnActive : btn} onClick={() => { setMode('ai'); newGame(); }}>Комп’ютер</button>
        <button style={mode === 'two' ? btnActive : btn} onClick={() => { setMode('two'); newGame(); }}>Удвох</button>
      </div>

      {mode === 'ai' && (
        <>
          <div style={{ fontSize: 15, fontWeight: 600, color: TEXT_SOFT, margin: '0 0 6px' }}>Рівень:</div>
          <div style={ROW}>
            {[1, 2, 3].map((l) => (
              <button key={l} style={level === l ? btnActive : btn} onClick={() => setLevel(l)}>{l === 1 ? 'Легкий' : l === 2 ? 'Середній' : 'Складний'}</button>
            ))}
          </div>
        </>
      )}

      {/* годинник */}
      <div style={{ ...ROW, marginBottom: 14 }}>
        <div style={plaque(state.turn === 'b' && !result)}>Чорні&nbsp;&nbsp;{fmtTime(clock.b)}</div>
        <div style={plaque(state.turn === 'w' && !result)}>Білі&nbsp;&nbsp;{fmtTime(clock.w)}</div>
      </div>

      <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 14px', color: inCheck(state) && !result ? GOLD_BRIGHT : TEXT_DESC }}>{status}</p>

      {/* дошка */}
      <div style={{ width: 'min(92vw, 560px)', height: 'min(92vw, 560px)', aspectRatio: '1 / 1', border: '3px solid #B5710C', borderRadius: 8, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)', boxShadow: '0 0 32px rgba(239,159,39,0.22), 0 8px 24px rgba(0,0,0,0.35)' }}>
        {order.map((i) => {
          const [r, c] = rc(i);
          const lightSq = (r + c) % 2 === 0;
          const bg = lightSq ? LIGHTSQ : DARKSQ;
          const p = state.board[i];
          const isSel = sel === i;
          const isTarget = legal.some((m) => m.to === i);
          const isLast = last && (last.from === i || last.to === i);
          const isChk = i === checkSq;
          return (
            <div key={i} onClick={() => onSquare(i)} style={{ position: 'relative', minWidth: 0, minHeight: 0, background: bg, boxShadow: `inset 0 0 0 0.5px ${GRID}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (mode === 'ai' && state.turn === 'b') || result ? 'default' : 'pointer' }}>
              {isLast && <div style={{ position: 'absolute', inset: 0, background: 'rgba(181,113,12,0.35)' }} />}
              {isSel && <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,26,43,0.30)' }} />}
              {isChk && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, rgba(226,75,74,0.75) 30%, transparent 70%)' }} />}
              {p && <img src={pieceSrc(p)} alt="" draggable={false} style={{ width: '86%', height: '86%', position: 'relative', userSelect: 'none' }} />}
              {isTarget && !p && <div style={{ position: 'absolute', width: '32%', height: '32%', borderRadius: '50%', background: 'rgba(14,26,43,0.35)' }} />}
              {isTarget && p && <div style={{ position: 'absolute', inset: 0, border: '4px solid rgba(14,26,43,0.5)', borderRadius: 4 }} />}
              {/* координати: цифри лишаються в кутку клітинки, літери — окремим рядком під дошкою */}
              {c === (flip ? 7 : 0) && <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 11, lineHeight: 1, fontWeight: 700, pointerEvents: 'none', color: lightSq ? LBL_LIGHT : LBL_DARK }}>{8 - r}</span>}
            </div>
          );
        })}
      </div>

      {/* літери a–h під дошкою */}
      <div style={{ display: 'flex', width: 'min(92vw, 560px)', marginTop: 4 }}>
        {(flip ? [...FILES].reverse() : [...FILES]).map((f) => (
          <div key={f} style={{ flex: '1 1 0', textAlign: 'center', fontSize: 13, fontWeight: 700, color: TEXT_SOFT }}>{f}</div>
        ))}
      </div>

      <div style={{ ...ROW, marginTop: 18, marginBottom: 0 }}>
        <button style={btn} onClick={newGame}>Нова гра</button>
        <button style={btn} onClick={() => setFlip((f) => !f)}>Перевернути</button>
      </div>

      {/* вибір фігури при перетворенні пішака */}
      {promo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: CREAM, borderRadius: 16, padding: 24, textAlign: 'center', maxWidth: 360 }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 22, margin: '0 0 16px', color: NAVY }}>Оберіть фігуру</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {['Q', 'R', 'B', 'N'].map((pr) => (
                <button key={pr} onClick={() => choosePromo(pr)} style={{ width: 64, height: 64, background: GOLD, border: `2px solid ${NAVY2}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={`/chess/${state.turn}${pr}.svg`} alt={pr} style={{ width: '80%', height: '80%' }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* модальний результат */}
      {result && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '32px 36px', textAlign: 'center', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 28, margin: '0 0 8px', color: NAVY }}>Гру завершено</p>
            <p style={{ fontSize: 20, margin: '0 0 22px', color: NAVY2 }}>{result}</p>
            <button style={{ ...btnActive, fontSize: 19, padding: '14px 28px' }} onClick={newGame}>Реванш</button>
          </div>
        </div>
      )}
    </div>
  );
}
