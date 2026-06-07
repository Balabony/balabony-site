'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';

/* ===================== ЛОГІКА ===================== */
type Who = 'W' | 'B';
interface S { W: number[]; B: number[]; offW: number; offB: number; }
const physW = (i: number) => 24 - i;
const invW = (p: number) => 24 - p;
const physB = (i: number) => (i < 12 ? 12 - i : 36 - i);
const invB = (p: number) => (p <= 12 ? 12 - p : 36 - p);
const arrOf = (s: S, w: Who) => (w === 'W' ? s.W : s.B);
const offOf = (s: S, w: Who) => (w === 'W' ? s.offW : s.offB);
const physOf = (w: Who, i: number) => (w === 'W' ? physW(i) : physB(i));
const invOf = (w: Who, p: number) => (w === 'W' ? invW(p) : invB(p));
const opp = (w: Who): Who => (w === 'W' ? 'B' : 'W');
const clone = (s: S): S => ({ W: [...s.W], B: [...s.B], offW: s.offW, offB: s.offB });
function initState(): S { const W = new Array(24).fill(0), B = new Array(24).fill(0); W[0] = 15; B[0] = 15; return { W, B, offW: 0, offB: 0 }; }
function allHome(s: S, w: Who) { const a = arrOf(s, w); for (let i = 0; i < 18; i++) if (a[i] > 0) return false; return true; }
function oppBlocks(s: S, w: Who, j: number) { const o = opp(w); const p = physOf(w, j); const oi = invOf(o, p); if (oi < 0 || oi > 23) return false; return arrOf(s, o)[oi] > 0; }
function fullPrime(s: S, w: Who) {
  const o = opp(w); const a = arrOf(s, w); const blocked = new Set<number>();
  for (let i = 0; i < 24; i++) if (a[i] > 0) { const oi = invOf(o, physOf(w, i)); if (oi >= 0 && oi <= 23) blocked.add(oi); }
  for (let k = 0; k + 5 <= 23; k++) { let all = true; for (let t = 0; t < 6; t++) if (!blocked.has(k + t)) { all = false; break; } if (all) { const ob = arrOf(s, o); let ahead = offOf(s, o) > 0; for (let z = k + 6; z <= 23; z++) if (ob[z] > 0) { ahead = true; break; } if (!ahead) return true; } }
  return false;
}
function tryMove(s: S, w: Who, i: number, d: number, headUsed: boolean): S | null {
  const a = arrOf(s, w); if (a[i] <= 0) return null; if (i === 0 && headUsed) return null;
  const j = i + d;
  if (j < 24) { if (oppBlocks(s, w, j)) return null; const ns = clone(s); arrOf(ns, w)[i]--; arrOf(ns, w)[j]++; if (fullPrime(ns, w)) return null; return ns; }
  if (!allHome(s, w)) return null;
  const dist = 24 - i;
  if (d === dist) { const ns = clone(s); arrOf(ns, w)[i]--; if (w === 'W') ns.offW++; else ns.offB++; return ns; }
  if (d > dist) { for (let k = 18; k < i; k++) if (a[k] > 0) return null; const ns = clone(s); arrOf(ns, w)[i]--; if (w === 'W') ns.offW++; else ns.offB++; return ns; }
  return null;
}
function movesForDie(s: S, w: Who, d: number, headUsed: boolean) { const out: { i: number; ns: S }[] = []; const a = arrOf(s, w); for (let i = 0; i < 24; i++) if (a[i] > 0) { const ns = tryMove(s, w, i, d, headUsed); if (ns) out.push({ i, ns }); } return out; }
const won = (s: S): Who | null => (s.offW === 15 ? 'W' : s.offB === 15 ? 'B' : null);

/* ===================== ШІ ===================== */
function evalState(s: S, w: Who, full: boolean): number {
  const a = arrOf(s, w); let progress = offOf(s, w) * 24; let head = a[0];
  for (let i = 0; i < 24; i++) progress += a[i] * i;
  if (!full) return offOf(s, w) * 120 + progress;
  // блокування: скільки пунктів суперника попереду його заднього перекрито
  const o = opp(w); const ob = arrOf(s, o); let rear = 24; for (let i = 0; i < 24; i++) if (ob[i] > 0) { rear = i; break; }
  const myBlockedOpp = new Set<number>(); for (let i = 0; i < 24; i++) if (a[i] > 0) { const oi = invOf(o, physOf(w, i)); if (oi > rear) myBlockedOpp.add(oi); }
  return offOf(s, w) * 120 + progress + myBlockedOpp.size * 2 - head * 1.5;
}
// найкраща послідовність ходів за хід (рекурсія з відсіканням)
function bestSequence(s: S, w: Who, dice: number[], level: number): { seq: { i: number; d: number }[]; state: S } {
  const full = level >= 2;
  let best = { seq: [] as { i: number; d: number }[], state: s, used: -1, score: -1e9 };
  const search = (st: S, remaining: number[], headUsed: boolean, seq: { i: number; d: number }[]) => {
    const usedCount = seq.length;
    const sc = evalState(st, w, full);
    if (usedCount > best.used || (usedCount === best.used && sc > best.score)) best = { seq: [...seq], state: st, used: usedCount, score: sc };
    if (remaining.length === 0) return;
    const tried = new Set<number>();
    for (let di = 0; di < remaining.length; di++) {
      const d = remaining[di]; if (tried.has(d)) continue; tried.add(d);
      let opts = movesForDie(st, w, d, headUsed).map((m) => ({ ...m, d, sc: 0 }));
      if (opts.length === 0) continue;
      opts = opts.map((o) => ({ ...o, sc: evalState(o.ns, w, full) })).sort((a, b) => b.sc - a.sc);
      const keep = opts.slice(0, full ? 6 : 1); // Середній — жадібний (1), Складний — пошук (6)
      const rem2 = [...remaining]; rem2.splice(di, 1);
      for (const o of keep) { search(o.ns, rem2, headUsed || o.i === 0, [...seq, { i: o.i, d }]); }
    }
  };
  if (level === 0) {
    // легкий: випадкові легальні
    let st = s, headUsed = false; const seq: { i: number; d: number }[] = []; const rem = [...dice];
    let guard = 0;
    while (rem.length && guard++ < 30) {
      const uniq = [...new Set(rem)]; let opts: { i: number; d: number; ns: S }[] = [];
      for (const d of uniq) for (const m of movesForDie(st, w, d, headUsed)) opts.push({ i: m.i, d, ns: m.ns });
      if (!opts.length) break; const p = opts[Math.floor(Math.random() * opts.length)];
      st = p.ns; if (p.i === 0) headUsed = true; rem.splice(rem.indexOf(p.d), 1); seq.push({ i: p.i, d: p.d });
    }
    return { seq, state: st };
  }
  search(s, dice, false, []);
  return { seq: best.seq, state: best.state };
}

const LEVELS = ['Легкий', 'Середній', 'Складний'];
type Phase = 'idle' | 'play' | 'over';

/* екранна розкладка пунктів */
const TOP = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
const BOTTOM = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

export default function NardePage() {
  const [li, setLi] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [s, setS] = useState<S>(initState());
  const [dice, setDice] = useState<number[]>([]);          // невикористані кубики
  const [rolled, setRolled] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<Who>('W');              // W = гравець
  const [headUsed, setHeadUsed] = useState(false);
  const [sel, setSel] = useState<number | null>(null);     // вибраний пункт-джерело (фізичний)
  const [msg, setMsg] = useState('');
  const [needRoll, setNeedRoll] = useState(false);
  const sRef = useRef(s); sRef.current = s;
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current); }, []);

  const newGame = (level: number) => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    const ns = initState();
    setS(ns); setPhase('play'); setSel(null); setHeadUsed(false); setMsg('');
    setTurn('W'); setRolled(null); setDice([]); setNeedRoll(true);
  };
  function rollDice(): [number, number] { return [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; }

  const rollForPlayer = () => {
    const d = rollDice(); const dl = d[0] === d[1] ? [d[0], d[0], d[0], d[0]] : [d[0], d[1]];
    setRolled(d); setDice(dl); setNeedRoll(false); setHeadUsed(false); setSel(null); setMsg('');
    if (!playerHasMove(sRef.current, dl, false)) { setMsg('Немає ходу — пропуск'); aiTimer.current = setTimeout(() => endPlayerTurn(sRef.current), 1100); }
  };

  // легальні ходи гравця з поточними кубиками
  const playerHasMove = useCallback((st: S, dl: number[], hu: boolean) => {
    for (const d of new Set(dl)) if (movesForDie(st, 'W', d, hu).length > 0) return true; return false;
  }, []);

  // призначення для вибраного джерела
  const destsFor = (p: number): { kind: 'point' | 'off'; point?: number; die: number }[] => {
    const i = invW(p); const res: { kind: 'point' | 'off'; point?: number; die: number }[] = [];
    for (const d of new Set(dice)) { const ns = tryMove(s, 'W', i, d, headUsed); if (!ns) continue; const j = i + d; if (j < 24) res.push({ kind: 'point', point: physW(j), die: d }); else res.push({ kind: 'off', die: d }); }
    return res;
  };

  const endPlayerTurn = (st: S) => {
    setSel(null);
    if (won(st)) { setPhase('over'); return; }
    // хід компʼютера
    setTurn('B'); setMsg('Хід компʼютера…');
    const d = rollDice(); setRolled(d);
    aiTimer.current = setTimeout(() => runAI(st, d), 700);
  };

  const playerMove = (p: number, dest: { kind: 'point' | 'off'; point?: number; die: number }) => {
    const i = invW(p); const ns = tryMove(s, 'W', i, dest.die, headUsed); if (!ns) return;
    const hu = headUsed || i === 0;
    const dl = [...dice]; dl.splice(dl.indexOf(dest.die), 1);
    setS(ns); setHeadUsed(hu); setDice(dl); setSel(null);
    if (won(ns)) { setPhase('over'); return; }
    if (!playerHasMove(ns, dl, hu) || dl.length === 0) endPlayerTurn(ns);
  };

  const playerPass = () => { endPlayerTurn(s); };

  const runAI = (st: S, d: [number, number]) => {
    const diceList = d[0] === d[1] ? [d[0], d[0], d[0], d[0]] : [d[0], d[1]];
    const { state } = bestSequence(st, 'B', diceList, li);
    setS(state);
    if (won(state)) { setPhase('over'); setMsg(''); return; }
    // назад до гравця — кидає кубики сам
    setTurn('W'); setHeadUsed(false); setSel(null); setRolled(null); setDice([]); setNeedRoll(true); setMsg('');
  };

  // підрахунок для відображення
  const whiteAt = (p: number) => s.W[invW(p)];
  const blackAt = (p: number) => { const bi = invB(p); return bi >= 0 && bi <= 23 ? s.B[bi] : 0; };
  const movableSources = new Set<number>();
  if (phase === 'play' && turn === 'W') for (let p = 1; p <= 24; p++) if (whiteAt(p) > 0) { const i = invW(p); for (const d of new Set(dice)) if (tryMove(s, 'W', i, d, headUsed)) { movableSources.add(p); break; } }
  const dests = sel != null ? destsFor(sel) : [];
  const destPoints = new Set(dests.filter((x) => x.kind === 'point').map((x) => x.point!));
  const canBearOff = dests.some((x) => x.kind === 'off');

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '24px 3% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 560 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)' });
  const bigBtn: React.CSSProperties = { fontSize: 18, fontWeight: 700, padding: '12px 26px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const ghost: React.CSSProperties = { fontSize: 14, fontWeight: 700, padding: '10px 16px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.4)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

  const Cell = ({ p, top }: { p: number; top: boolean }) => {
    const wc = whiteAt(p), bc = blackAt(p);
    const isSrc = movableSources.has(p), isSel = sel === p, isDest = destPoints.has(p);
    const color = wc > 0 ? CREAM : bc > 0 ? NAVY2 : null;
    const cnt = wc > 0 ? wc : bc;
    const onTap = () => {
      if (phase !== 'play' || turn !== 'W') return;
      if (isDest && sel != null) { const dd = dests.find((x) => x.kind === 'point' && x.point === p); if (dd) playerMove(sel, dd); return; }
      if (isSrc) setSel(isSel ? null : p);
    };
    const discs = Math.min(cnt, 5);
    return (
      <div onClick={onTap} className={isDest ? 'bb-dest' : isSel ? 'bb-srcsel' : isSrc ? 'bb-srcavail' : undefined} style={{ flex: '1 1 0', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: top ? 'flex-start' : 'flex-end', gap: 2, padding: '4px 0', cursor: (isSrc || isDest) ? 'pointer' : 'default', background: isSel ? 'rgba(239,159,39,0.28)' : isDest ? 'rgba(127,209,139,0.18)' : isSrc ? 'rgba(239,159,39,0.14)' : 'transparent', borderRadius: 6, position: 'relative', border: isDest ? `1.5px dashed #7FD18B` : isSrc ? `1.5px solid rgba(239,159,39,0.8)` : '1.5px solid transparent' }}>
        <span style={{ position: 'absolute', [top ? 'bottom' : 'top']: 1, fontSize: 8, color: 'rgba(207,227,250,0.4)' } as React.CSSProperties}>{p}</span>
        {color && Array.from({ length: discs }).map((_, k) => (
          <div key={k} className={isSrc && k === discs - 1 ? 'bb-topglow' : undefined} style={{ width: 'min(6.2vw,22px)', height: 'min(6.2vw,22px)', borderRadius: '50%', background: color, border: wc > 0 ? `1.5px solid #cdb68a` : `1.5px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
            {k === discs - 1 && cnt > 5 && <span style={{ fontSize: 10, fontWeight: 700, color: wc > 0 ? NAVY : GOLD_LIGHT }}>{cnt}</span>}
          </div>
        ))}
        {isDest && <div style={{ width: 'min(6vw,20px)', height: 'min(6vw,20px)', borderRadius: '50%', border: `2.5px solid #7FD18B`, background: 'rgba(127,209,139,0.3)', flex: '0 0 auto' }} />}
      </div>
    );
  };

  const Die = ({ v, dim }: { v: number; dim?: boolean }) => (
    <div className="bb-die" style={{ width: 34, height: 34, borderRadius: 7, background: dim ? 'rgba(255,248,238,0.3)' : CREAM, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', padding: 4, boxSizing: 'border-box' }}>
      {Array.from({ length: 9 }).map((_, k) => { const r = (k / 3) | 0, c = k % 3; const on = (v === 1 && k === 4) || (v === 2 && (k === 0 || k === 8)) || (v === 3 && (k === 0 || k === 4 || k === 8)) || (v === 4 && (r !== 1 && c !== 1)) || (v === 5 && ((r !== 1 && c !== 1) || k === 4)) || (v === 6 && c !== 1); return <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && <span style={{ width: 6, height: 6, borderRadius: '50%', background: NAVY }} />}</div>; })}
    </div>
  );

  return (
    <main lang="uk" style={wrap}>
      <div style={inner}>
        <style>{`
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          .bb-details p { margin: 0 0 14px; }
          .bb-details p:last-child { margin-bottom: 0; }
          .bb-details b { color: ${GOLD}; line-height: 1.3; }
          .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
          .bb-cream-note b { color: #B5710C; }
          @keyframes bbSrc { 0%,100% { background: rgba(239,159,39,0.16); box-shadow: inset 0 0 4px rgba(239,159,39,0.2); } 50% { background: rgba(239,159,39,0.3); box-shadow: inset 0 0 16px rgba(239,159,39,0.5); } }
          .bb-srcsel { animation: bbSrc 1.4s ease-in-out infinite; }
          @keyframes bbAvail { 0%,100% { box-shadow: inset 0 0 6px rgba(239,159,39,0.3); } 50% { box-shadow: inset 0 0 13px rgba(239,159,39,0.6); } }
          .bb-srcavail { animation: bbAvail 1.7s ease-in-out infinite; }
          @keyframes bbDest { 0%,100% { box-shadow: 0 0 6px rgba(127,209,139,0.35); } 50% { box-shadow: 0 0 18px rgba(127,209,139,0.8); } }
          .bb-dest { animation: bbDest 1.1s ease-in-out infinite; }
          @keyframes bbTop { 0%,100% { box-shadow: 0 0 6px rgba(239,159,39,0.6); } 50% { box-shadow: 0 0 16px rgba(239,159,39,1); } }
          .bb-topglow { animation: bbTop 1.3s ease-in-out infinite; }
          @keyframes bbDie { 0% { transform: scale(0.6); opacity: 0.3; } 60% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
          .bb-die { animation: bbDie .3s ease-out; }
          @keyframes bbAvail { 0%,100% { border-color: rgba(239,159,39,0.55); } 50% { border-color: rgba(239,159,39,1); } }
          .bb-srcavail { animation: bbAvail 1.5s ease-in-out infinite; }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Довгі нарди</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Класичні довгі нарди проти компʼютера. Ведіть усі 15 шашок до свого дому й винесіть їх першими. Без биття: на пункт суперника стати не можна.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l} style={plaque(i === li)} onClick={() => { setLi(i); newGame(i); }}>{l}</button>)}
        </div>

        {phase === 'idle' && (
          <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', padding: '26px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 16px' }}>Ви граєте світлими. Оберіть рівень — і киньте кубики.</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Почати</button>
          </div>
        )}

        {phase !== 'idle' && (
          <>
            {/* винесено + кубики */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: TEXT_SOFT }}>
              <span>Винесено — ви: <b style={{ color: GOLD_LIGHT }}>{s.offW}</b> / 15 · компʼютер: <b style={{ color: GOLD_LIGHT }}>{s.offB}</b> / 15</span>
            </div>

            {/* дошка */}
            <div style={{ background: '#0c1622', borderRadius: 12, border: `2px solid ${GOLD}`, padding: 6, boxShadow: '0 0 26px rgba(239,159,39,0.25)' }}>
              <div style={{ display: 'flex', height: 'min(34vw,150px)' }}>{TOP.map((p) => <Cell key={p} p={p} top />)}</div>
              <div style={{ height: 2, background: 'rgba(250,199,117,0.25)', margin: '2px 0' }} />
              <div style={{ display: 'flex', height: 'min(34vw,150px)' }}>{BOTTOM.map((p) => <Cell key={p} p={p} top={false} />)}</div>
            </div>

            {/* панель ходу */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', minHeight: 44 }}>
                {turn === 'W' && needRoll && phase === 'play'
                  ? <button style={bigBtn} onClick={rollForPlayer}>Кинути кубики</button>
                  : rolled && <><Die key={'d1-' + rolled.join('-')} v={rolled[0]} dim={!dice.includes(rolled[0]) && turn === 'W'} /><Die key={'d2-' + rolled.join('-')} v={rolled[1]} dim={!dice.includes(rolled[1]) && turn === 'W'} /></>}
                {turn === 'W' && !needRoll && dice.length > 0 && rolled && rolled[0] === rolled[1] && <span style={{ fontSize: 13, color: GOLD_LIGHT }}>дубль ×{dice.length}</span>}
              </div>
              <div style={{ fontSize: 14, color: GOLD_LIGHT, fontWeight: 700, flex: '1 1 auto', textAlign: 'center', minWidth: 120 }}>
                {phase === 'over' ? '' : turn === 'W' ? (needRoll ? 'Ваш хід — киньте кубики' : (msg || (movableSources.size ? 'Ваш хід' : 'Немає ходу'))) : (msg || 'Хід компʼютера…')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {phase === 'play' && turn === 'W' && !needRoll && canBearOff && sel != null && <button style={bigBtn} onClick={() => { const d = dests.find((x) => x.kind === 'off'); if (d) playerMove(sel, d); }}>Винести</button>}
                {phase === 'play' && turn === 'W' && !needRoll && !msg && movableSources.size === 0 && <button style={bigBtn} onClick={playerPass}>Пропустити</button>}
                <button style={ghost} onClick={() => newGame(li)}>Нова</button>
              </div>
            </div>
            {phase === 'play' && turn === 'W' && needRoll && <p style={{ fontSize: 13, color: TEXT_SOFT, marginTop: 8, textAlign: 'center' }}>Натисніть «Кинути кубики», щоб зробити хід.</p>}
            {phase === 'play' && turn === 'W' && !needRoll && sel != null && <p style={{ fontSize: 13, color: TEXT_SOFT, marginTop: 8, textAlign: 'center' }}>Тепер торкніться <b style={{ color: '#7FD18B' }}>зеленого</b> пункту, або «Винести».</p>}
            {phase === 'play' && turn === 'W' && !needRoll && sel == null && movableSources.size > 0 && <p style={{ fontSize: 13, color: TEXT_SOFT, marginTop: 8, textAlign: 'center' }}>Торкніться шашки <b style={{ color: GOLD_LIGHT }}>у золотій рамці</b>, далі — зеленого пункту.</p>}
          </>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чим корисна ця гра</summary>
          <div style={detailsBody}>
            <p><b>Що це.</b><br />Довгі нарди — класична гра на двох, дуже популярна в Україні. Тут ви граєте проти компʼютера на трьох рівнях.</p>
            <p><b>Чим корисна.</b><br />Нарди — це підрахунок ходів наперед, оцінка варіантів і рішення під випадковість кубиків: легке тренування лічби, планування й уваги. І просто приємна, азартна гра.</p>
            <p><b>Цікавий факт.</b><br />Нарди — наочний приклад «рішень в умовах невизначеності»: ви поєднуєте ймовірність (що може випасти) з ризиком (де лишити шашку). Саме таке прийняття рішень — окрема когнітивна навичка, яку вивчають, зокрема, у дослідженнях старіння мозку. Але важливо: це не означає, що гра щось «лікує» (див. нижче).</p>
            <p className="bb-cream-note"><b>Чесно.</b><br />Якісних наукових досліджень саме про нарди й користь для здоровʼя ми не знайшли, тож жодних обіцянок не даємо. Це гра для задоволення й тренування мислення, <b>а не лікування</b> чи профілактика хвороб. Найбільше нарди дають, коли грати наживо з рідними.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Як грати · правила</summary>
          <div style={detailsBody}>
            <p><b>Мета.</b><br />Провести всі 15 шашок до свого дому й винести їх із дошки першим.</p>
            <p><b>Хід.</b><br />Киньте два кубики й перемістіть шашки на стільки пунктів, скільки випало. Дубль — чотири ходи. З «голови» (стартового пункту) можна знімати лише одну шашку за хід.</p>
            <p><b>Без биття.</b><br />На пункт, де стоїть хоча б одна шашка суперника, стати не можна. Своїх шашок на пункті може бути скільки завгодно.</p>
            <p><b>Як ходити.</b><br />Торкніться своєї шашки (підсвічені золотим) — зеленим покажуться пункти, куди можна піти. Торкніться пункту, щоб перемістити.</p>
            <p><b>Винесення.</b><br />Коли всі 15 шашок удома — починайте виносити. Кнопка «Винести» зʼявляється, коли це дозволено.</p>
          </div>
        </details>

        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
          <a href="/games" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Усі ігри</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      {phase === 'over' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '26px 30px', textAlign: 'center', maxWidth: 340, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 30, margin: '0 0 8px', lineHeight: 1.2, color: '#B5710C' }}>{s.offW === 15 ? 'Ви виграли!' : 'Ви програли'}</p>
            <p style={{ fontSize: 15, margin: '0 0 20px', lineHeight: 1.4, color: NAVY2 }}>Винесено — ви: {s.offW}, компʼютер: {s.offB}.</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Реванш</button>
          </div>
        </div>
      )}
    </main>
  );
}
