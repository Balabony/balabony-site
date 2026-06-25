'use client';

import React, { useState, useEffect, useRef } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';

/* ===================== ЛОГІКА ===================== */
type Tile = [number, number];
type Oriented = { a: number; b: number };
type Who = 'player' | 'ai';

const fullSet = (): Tile[] => { const s: Tile[] = []; for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) s.push([a, b]); return s; };
const pip = (t: Tile) => t[0] + t[1];
const handSum = (h: Tile[]) => h.reduce((s, t) => s + pip(t), 0);
const tileEq = (x: Tile, y: Tile) => x[0] === y[0] && x[1] === y[1];
const tkey = (t: Tile) => `${t[0]}-${t[1]}`;
function shuffle<T>(a: T[]): T[] { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function deal() { const d = shuffle(fullSet()); return { player: d.slice(0, 7), ai: d.slice(7, 14), boneyard: d.slice(14) }; }
function findOpener(player: Tile[], ai: Tile[]): { tile: Tile; holder: Who } {
  for (let d = 6; d >= 0; d--) { if (player.some((t) => t[0] === d && t[1] === d)) return { tile: [d, d], holder: 'player' }; if (ai.some((t) => t[0] === d && t[1] === d)) return { tile: [d, d], holder: 'ai' }; }
  let best: Tile = player[0] || ai[0], holder: Who = player.length ? 'player' : 'ai', key = -1;
  for (const t of player) { const k = pip(t) * 10 + Math.max(t[0], t[1]); if (k > key) { key = k; best = t; holder = 'player'; } }
  for (const t of ai) { const k = pip(t) * 10 + Math.max(t[0], t[1]); if (k > key) { key = k; best = t; holder = 'ai'; } }
  return { tile: best, holder };
}
const ends = (c: Oriented[]): [number, number] | null => (c.length ? [c[0].a, c[c.length - 1].b] : null);
type Move = { tile: Tile; side: 'L' | 'R' };
function legalMoves(hand: Tile[], L: number, R: number): Move[] { const m: Move[] = []; for (const t of hand) { if (t[0] === L || t[1] === L) m.push({ tile: t, side: 'L' }); if (t[0] === R || t[1] === R) m.push({ tile: t, side: 'R' }); } return m; }
function place(chain: Oriented[], tile: Tile, side: 'L' | 'R'): Oriented[] {
  const c = chain.map((o) => ({ ...o }));
  if (c.length === 0) { c.push({ a: tile[0], b: tile[1] }); return c; }
  if (side === 'L') { const L = c[0].a; const other = tile[0] === L ? tile[1] : tile[0]; c.unshift({ a: other, b: L }); }
  else { const R = c[c.length - 1].b; const other = tile[0] === R ? tile[1] : tile[0]; c.push({ a: R, b: other }); }
  return c;
}
function removeTile(hand: Tile[], tile: Tile): Tile[] { const i = hand.findIndex((t) => tileEq(t, tile)); const h = [...hand]; if (i >= 0) h.splice(i, 1); return h; }
function chooseAI(hand: Tile[], L: number, R: number, level: number): Move | null {
  const mv = legalMoves(hand, L, R);
  if (mv.length === 0) return null;
  if (level === 0) return mv[Math.floor(Math.random() * mv.length)];
  if (level === 1) { let best = mv[0]; for (const m of mv) if (pip(m.tile) > pip(best.tile)) best = m; return best; }
  // складний: скинути важку + зберегти власну мобільність
  let best = mv[0], bestScore = -1;
  for (const m of mv) {
    const rest = removeTile(hand, m.tile);
    // обчислимо нові кінці
    let nL = L, nR = R;
    if (m.side === 'L') { nL = m.tile[0] === L ? m.tile[1] : m.tile[0]; } else { nR = m.tile[0] === R ? m.tile[1] : m.tile[0]; }
    const mobility = rest.filter((t) => t[0] === nL || t[1] === nL || t[0] === nR || t[1] === nR).length;
    const score = pip(m.tile) + mobility * 1.5;
    if (score > bestScore) { bestScore = score; best = m; }
  }
  return best;
}

type Phase = 'idle' | 'play' | 'over';
interface State { player: Tile[]; ai: Tile[]; boneyard: Tile[]; chain: Oriented[]; turn: Who; passes: number; phase: Phase; winner: Who | 'draw' | null; reason: string; msg: string; }

const LEVELS = ['Легкий', 'Середній', 'Складний'];

/* ===================== КІСТКА ===================== */
function pipPos(n: number): [number, number][] {
  const l = 26, c = 50, r = 74, t = 26, m = 50, b = 74;
  switch (n) {
    case 1: return [[c, m]];
    case 2: return [[l, t], [r, b]];
    case 3: return [[l, t], [c, m], [r, b]];
    case 4: return [[l, t], [r, t], [l, b], [r, b]];
    case 5: return [[l, t], [r, t], [c, m], [l, b], [r, b]];
    case 6: return [[l, t], [r, t], [l, m], [r, m], [l, b], [r, b]];
    default: return [];
  }
}
function Half({ n, size }: { n: number; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      {pipPos(n).map(([x, y], i) => <circle key={i} cx={x} cy={y} r={10} fill={NAVY} />)}
    </svg>
  );
}
function DominoTile({ a, b, size = 34, faceDown = false }: { a?: number; b?: number; size?: number; faceDown?: boolean }) {
  if (faceDown) return <div style={{ width: size * 2 + 4, height: size + 6, borderRadius: 6, background: NAVY2, border: `1.5px solid rgba(250,199,117,0.45)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} /></div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: CREAM, borderRadius: 6, padding: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
      <Half n={a!} size={size} />
      <div style={{ width: 2, height: size * 0.78, background: 'rgba(14,26,43,0.35)', margin: '0 2px', borderRadius: 2 }} />
      <Half n={b!} size={size} />
    </div>
  );
}

export default function DominoPage() {
  const [li, setLi] = useState(0);
  const [st, setSt] = useState<State>({ player: [], ai: [], boneyard: [], chain: [], turn: 'player', passes: 0, phase: 'idle', winner: null, reason: '', msg: '' });
  const [pending, setPending] = useState<Tile | null>(null); // кістка, що грається на обидва кінці
  const chainRef = useRef<HTMLDivElement | null>(null);
  const lastSide = useRef<'L' | 'R'>('R');
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stRef = useRef(st);
  stRef.current = st;

  useEffect(() => () => { if (aiTimer.current) clearTimeout(aiTimer.current); }, []);

  // прокрутка ланцюга до останнього ходу
  useEffect(() => {
    const el = chainRef.current; if (!el) return;
    el.scrollLeft = lastSide.current === 'L' ? 0 : el.scrollWidth;
  }, [st.chain]);

  const newGame = (level: number) => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    setPending(null);
    const { player, ai, boneyard } = deal();
    const op = findOpener(player, ai);
    const chain = place([], op.tile, 'L');
    const p2 = op.holder === 'player' ? removeTile(player, op.tile) : player;
    const a2 = op.holder === 'ai' ? removeTile(ai, op.tile) : ai;
    lastSide.current = 'R';
    setSt({ player: p2, ai: a2, boneyard, chain, turn: op.holder === 'player' ? 'ai' : 'player', passes: 0, phase: 'play', winner: null, reason: '', msg: `Перша кістка — ${op.tile[0]}-${op.tile[1]} (${op.holder === 'player' ? 'ваша' : 'компʼютера'})` });
  };

  const finish = (s: State, winner: Who | 'draw', reason: string): State => ({ ...s, phase: 'over', winner, reason, turn: s.turn });

  // хід гравця
  const playerPlace = (tile: Tile, side: 'L' | 'R') => {
    setPending(null);
    setSt((s) => {
      if (s.phase !== 'play' || s.turn !== 'player') return s;
      lastSide.current = side;
      const chain = place(s.chain, tile, side);
      const player = removeTile(s.player, tile);
      if (player.length === 0) return finish({ ...s, player, chain }, 'player', 'доміно');
      return { ...s, player, chain, turn: 'ai', passes: 0, msg: '' };
    });
  };
  const tapPlayerTile = (tile: Tile) => {
    const e = ends(st.chain); if (!e || st.turn !== 'player' || st.phase !== 'play') return;
    const [L, R] = e;
    const canL = tile[0] === L || tile[1] === L;
    const canR = tile[0] === R || tile[1] === R;
    if (canL && canR && L !== R) { setPending(tile); return; }
    if (canL) playerPlace(tile, 'L'); else if (canR) playerPlace(tile, 'R');
  };
  const playerDraw = () => {
    setSt((s) => {
      if (s.phase !== 'play' || s.turn !== 'player') return s;
      const e = ends(s.chain)!; let [L, R] = e;
      let player = [...s.player], boneyard = [...s.boneyard];
      while (legalMoves(player, L, R).length === 0 && boneyard.length > 0) { player.push(boneyard.shift()!); }
      if (legalMoves(player, L, R).length === 0) { // пас
        const passes = s.passes + 1;
        if (passes >= 2) { const ps = handSum(player), as = handSum(s.ai); return finish({ ...s, player, boneyard }, ps < as ? 'player' : as < ps ? 'ai' : 'draw', 'риба'); }
        return { ...s, player, boneyard, turn: 'ai', passes, msg: 'Ви пасуєте' };
      }
      return { ...s, player, boneyard, msg: 'Ви взяли з базару' };
    });
  };

  // хід компʼютера
  useEffect(() => {
    if (st.phase !== 'play' || st.turn !== 'ai') return;
    aiTimer.current = setTimeout(() => {
      setSt((s) => {
        if (s.phase !== 'play' || s.turn !== 'ai') return s;
        const e = ends(s.chain)!; const [L, R] = e;
        let ai = [...s.ai], boneyard = [...s.boneyard], drew = false;
        while (legalMoves(ai, L, R).length === 0 && boneyard.length > 0) { ai.push(boneyard.shift()!); drew = true; }
        const mv = chooseAI(ai, L, R, li);
        if (!mv) { // пас
          const passes = s.passes + 1;
          if (passes >= 2) { const ps = handSum(s.player), as = handSum(ai); return finish({ ...s, ai, boneyard }, ps < as ? 'player' : as < ps ? 'ai' : 'draw', 'риба'); }
          return { ...s, ai, boneyard, turn: 'player', passes, msg: 'Компʼютер пасує' };
        }
        lastSide.current = mv.side;
        const chain = place(s.chain, mv.tile, mv.side);
        ai = removeTile(ai, mv.tile);
        if (ai.length === 0) return finish({ ...s, ai, boneyard, chain }, 'ai', 'доміно');
        return { ...s, ai, boneyard, chain, turn: 'player', passes: 0, msg: drew ? 'Компʼютер брав з базару' : '' };
      });
    }, 850);
    return () => { if (aiTimer.current) clearTimeout(aiTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.turn, st.phase, st.chain]);

  const e = ends(st.chain);
  const playerCanMove = e ? legalMoves(st.player, e[0], e[1]).length > 0 : false;
  const playableSet = new Set<string>();
  if (e && st.turn === 'player' && st.phase === 'play') for (const m of legalMoves(st.player, e[0], e[1])) playableSet.add(tkey(m.tile));

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 4% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 560 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)' });
  const bigBtn: React.CSSProperties = { fontSize: 18, fontWeight: 700, padding: '12px 26px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const ghost: React.CSSProperties = { fontSize: 14, fontWeight: 700, padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.4)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer', whiteSpace: 'nowrap' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

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
          .bb-scroll::-webkit-scrollbar { height: 6px; }
          .bb-scroll::-webkit-scrollbar-thumb { background: rgba(250,199,117,0.4); border-radius: 3px; }
          .bb-pl { cursor: pointer; transition: transform .1s; }
          .bb-pl:hover { transform: translateY(-4px); }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Доміно</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Класичне «центрове» доміно проти компʼютера. Прикладайте кістки до кінців ланцюга; немає ходу — берете з базару.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l} style={plaque(i === li)} onClick={() => { setLi(i); newGame(i); }}>{l}</button>)}
        </div>

        {st.phase === 'idle' && (
          <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', padding: '26px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 16px' }}>Оберіть рівень — і гра почнеться. Перший хід робить той, у кого найбільший дубль.</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Почати</button>
          </div>
        )}

        {st.phase !== 'idle' && (
          <>
            {/* компʼютер */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: TEXT_DESC }}>Компʼютер: {st.ai.length} кіст.</span>
              <span style={{ fontSize: 14, color: TEXT_SOFT }}>Базар: {st.boneyard.length}</span>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14, opacity: 0.9 }}>
              {st.ai.map((_, i) => <DominoTile key={i} faceDown size={20} />)}
            </div>

            {/* ланцюг */}
            <div ref={chainRef} className="bb-scroll" style={{ display: 'flex', gap: 4, alignItems: 'center', overflowX: 'auto', padding: '14px 8px', background: 'rgba(0,0,0,0.18)', borderRadius: 12, minHeight: 64, marginBottom: 6 }}>
              {st.chain.map((o, i) => <div key={i} style={{ flex: '0 0 auto' }}><DominoTile a={o.a} b={o.b} size={26} /></div>)}
            </div>
            <div style={{ fontSize: 13.5, color: GOLD_LIGHT, minHeight: 20, marginBottom: 10, textAlign: 'center' }}>
              {st.phase === 'play' ? (st.turn === 'player' ? (playerCanMove ? 'Ваш хід — оберіть кістку' : (st.boneyard.length ? 'Немає ходу — візьміть з базару' : 'Немає ходу — пас')) : 'Хід компʼютера…') : ''}
              {st.msg ? ` · ${st.msg}` : ''}
            </div>

            {/* вибір кінця для кістки, що пасує на обидва */}
            {pending && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 14, color: TEXT_SOFT }}>Куди прикласти кістку?</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
                  <button style={ghost} onClick={() => playerPlace(pending, 'L')}>◀ Ліворуч</button>
                  <button style={ghost} onClick={() => playerPlace(pending, 'R')}>Праворуч ▶</button>
                  <button style={{ ...ghost, borderColor: 'rgba(255,255,255,0.25)', color: TEXT_SOFT }} onClick={() => setPending(null)}>Скасувати</button>
                </div>
              </div>
            )}

            {/* рука гравця */}
            <div className="bb-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 4px', minHeight: 52 }}>
              {st.player.map((t) => {
                const playable = playableSet.has(tkey(t));
                return (
                  <div key={tkey(t)} className={playable ? 'bb-pl' : undefined} onClick={() => playable && tapPlayerTile(t)} style={{ flex: '0 0 auto', borderRadius: 8, padding: 2, border: playable ? `2px solid ${GOLD}` : '2px solid transparent', boxShadow: playable ? '0 0 14px rgba(239,159,39,0.6)' : 'none', opacity: (st.turn === 'player' || st.phase === 'over') ? 1 : 0.85 }}>
                    <DominoTile a={t[0]} b={t[1]} size={32} />
                  </div>
                );
              })}
            </div>

            {/* дії */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              {st.phase === 'play' && st.turn === 'player' && !playerCanMove && (
                <button style={bigBtn} onClick={playerDraw}>{st.boneyard.length ? `Взяти з базару (${st.boneyard.length})` : 'Пас'}</button>
              )}
              <button style={ghost} onClick={() => newGame(li)}>Нова гра</button>
            </div>
          </>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чим корисна ця гра</summary>
          <div style={detailsBody}>
            <p><b>Що це.</b><br />Класичне доміно — гра, знайома кільком поколінням. Тут ви граєте проти компʼютера на трьох рівнях складності.</p>
            <p><b>Чим корисна.</b><br />Доміно — це постійний усний підрахунок очок, планування ходів наперед і увага до того, які числа вже зіграно й які лишилися. Тобто легке, ненапружливе тренування лічби, уваги та памʼяті — і просто приємне проведення часу.</p>
            <p className="bb-cream-note"><b>Чесно.</b><br />Ми не знаємо наукових досліджень саме про доміно, тому не даємо жодних обіцянок щодо здоровʼя. Це гра для задоволення й легкої розумової вправи, <b>а не лікування</b> чи профілактика якихось хвороб. Найбільше доміно дає тоді, коли грати наживо з рідними — тут же ви граєте проти компʼютера.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Як грати · правила</summary>
          <div style={detailsBody}>
            <p><b>Набір.</b><br />28 кісток (від 0-0 до 6-6). Вам і компʼютеру роздається по 7, решта 14 — у «базарі».</p>
            <p><b>Перший хід.</b><br />Починає той, у кого найбільший дубль (6-6, 5-5 …). Перша кістка викладається автоматично.</p>
            <p><b>Хід.</b><br />Прикладайте кістку до будь-якого з двох кінців ланцюга — число має збігатися. Кістки, якими можна походити, підсвічуються золотим. Якщо кістка підходить до обох кінців — оберете куди.</p>
            <p><b>Немає ходу.</b><br />Беріть з базару, доки не зможете походити. Базар порожній і ходу немає — пас.</p>
            <p><b>Кінець.</b><br />Хто перший виклав усі кістки — переміг («доміно»). Якщо обидва спасували («риба») — виграє той, у кого менша сума очок на руках.</p>
          </div>
        </details>

        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
          <a href="/games" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Усі ігри</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      {/* результат */}
      {st.phase === 'over' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '24px 26px', textAlign: 'center', maxWidth: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 28, margin: '0 0 6px', lineHeight: 1.2, color: '#B5710C' }}>
              {st.winner === 'player' ? 'Ви виграли!' : st.winner === 'ai' ? 'Ви програли' : 'Нічия'}
            </p>
            <p style={{ fontSize: 15, margin: '0 0 6px', lineHeight: 1.35, color: NAVY2 }}>
              {st.reason === 'доміно' ? (st.winner === 'player' ? 'Ви виклали всі кістки.' : 'Компʼютер виклав усі кістки.') : 'Гру заблоковано («риба»).'}
            </p>
            <p style={{ fontSize: 14, margin: '0 0 18px', lineHeight: 1.35, color: '#5a534c' }}>На руках лишилось — у вас: {handSum(st.player)}, у компʼютера: {handSum(st.ai)}.</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Реванш</button>
          </div>
        </div>
      )}
    </main>
  );
}
