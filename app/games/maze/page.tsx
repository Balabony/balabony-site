'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';
const WALL = '#EF9F27', CELL = '#102742', CELL_PATH = 'rgba(239,159,39,0.16)';

/* ===================== ЛАБІРИНТ ===================== */
type Cell = { n: boolean; e: boolean; s: boolean; w: boolean };
type Dir = 'n' | 'e' | 's' | 'w';
const OPP: Record<Dir, Dir> = { n: 's', s: 'n', e: 'w', w: 'e' };

function genMaze(size: number): Cell[] {
  const cells: Cell[] = Array.from({ length: size * size }, () => ({ n: true, e: true, s: true, w: true }));
  const id = (r: number, c: number) => r * size + c;
  const seen = new Array(size * size).fill(false);
  const stack: number[] = [0];
  seen[0] = true;
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const r = Math.floor(cur / size), c = cur % size;
    const nb: [Dir, number][] = [];
    if (r > 0 && !seen[id(r - 1, c)]) nb.push(['n', id(r - 1, c)]);
    if (c < size - 1 && !seen[id(r, c + 1)]) nb.push(['e', id(r, c + 1)]);
    if (r < size - 1 && !seen[id(r + 1, c)]) nb.push(['s', id(r + 1, c)]);
    if (c > 0 && !seen[id(r, c - 1)]) nb.push(['w', id(r, c - 1)]);
    if (!nb.length) { stack.pop(); continue; }
    const [dir, next] = nb[Math.floor(Math.random() * nb.length)];
    cells[cur][dir] = false;
    cells[next][OPP[dir]] = false;
    seen[next] = true;
    stack.push(next);
  }
  return cells;
}

// найкоротший шлях (BFS) — у досконалому лабіринті він єдиний
function shortest(cells: Cell[], size: number): number {
  const id = (r: number, c: number) => r * size + c;
  const dist = new Array(size * size).fill(-1);
  const q = [0]; dist[0] = 0;
  while (q.length) {
    const cur = q.shift()!;
    const r = Math.floor(cur / size), c = cur % size;
    const moves: [Dir, number][] = [];
    if (!cells[cur].n) moves.push(['n', id(r - 1, c)]);
    if (!cells[cur].e) moves.push(['e', id(r, c + 1)]);
    if (!cells[cur].s) moves.push(['s', id(r + 1, c)]);
    if (!cells[cur].w) moves.push(['w', id(r, c - 1)]);
    for (const [, nx] of moves) if (dist[nx] < 0) { dist[nx] = dist[cur] + 1; q.push(nx); }
  }
  return dist[size * size - 1];
}

type Level = { label: string; size: number };
const LEVELS: Level[] = [{ label: 'Легкий', size: 7 }, { label: 'Середній', size: 9 }, { label: 'Складний', size: 11 }];

export default function MazePage() {
  const [li, setLi] = useState(0);
  const size = LEVELS[li].size;
  const [cells, setCells] = useState<Cell[]>(() => genMaze(LEVELS[0].size));
  const [pos, setPos] = useState(0);
  const [moves, setMoves] = useState(0);
  const [opt, setOpt] = useState(8);
  const [path, setPath] = useState<Set<number>>(() => new Set([0]));
  const [solved, setSolved] = useState(false);
  const [memory, setMemory] = useState(false); // режим «по пам'яті»
  const [peek, setPeek] = useState(true);       // чи показані стіни
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const newMaze = useCallback((sz: number, mem: boolean) => {
    const c = genMaze(sz);
    setCells(c); setOpt(shortest(c, sz)); setPos(0); setMoves(0); setPath(new Set([0])); setSolved(false);
    setPeek(true);
    if (peekTimer.current) clearTimeout(peekTimer.current);
    if (mem) peekTimer.current = setTimeout(() => setPeek(false), 4000); // 4 с роздивитися, далі — по пам'яті
  }, []);

  // зміна рівня / режиму -> новий лабіринт
  useEffect(() => { newMaze(size, memory); /* eslint-disable-next-line */ }, [li, memory]);
  useEffect(() => () => { if (peekTimer.current) clearTimeout(peekTimer.current); }, []);

  const move = useCallback((dir: Dir) => {
    if (solved) return;
    setPos((p) => {
      if (cells[p][dir]) return p; // стіна
      const r = Math.floor(p / size), c = p % size;
      const np = dir === 'n' ? p - size : dir === 's' ? p + size : dir === 'e' ? p + 1 : p - 1;
      if (dir === 'n' && r === 0) return p;
      if (dir === 's' && r === size - 1) return p;
      if (dir === 'e' && c === size - 1) return p;
      if (dir === 'w' && c === 0) return p;
      setMoves((m) => m + 1);
      setPath((s) => { const ns = new Set(s); ns.add(np); return ns; });
      if (np === size * size - 1) setSolved(true);
      return np;
    });
  }, [cells, size, solved]);

  // керування з клавіатури
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === 'ArrowUp') { e.preventDefault(); move('n'); }
      else if (k === 'ArrowDown') { e.preventDefault(); move('s'); }
      else if (k === 'ArrowLeft') { e.preventDefault(); move('w'); }
      else if (k === 'ArrowRight') { e.preventDefault(); move('e'); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [move]);

  const doPeek = () => {
    setPeek(true);
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeek(false), 1500);
  };

  const showWalls = !memory || peek;
  const goal = size * size - 1;

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 5% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 480 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)', boxShadow: active ? '0 0 18px rgba(239,159,39,0.4)' : '0 0 10px rgba(239,159,39,0.1)' });
  const dpadBtn: React.CSSProperties = { width: 64, height: 64, borderRadius: 14, border: `1.5px solid rgba(250,199,117,0.4)`, background: CARD, color: GOLD_LIGHT, fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(239,159,39,0.14)' };
  const linkBtn: React.CSSProperties = { flex: '1 1 0', fontSize: 14, padding: '11px 6px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: CARD, color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif' };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

  return (
    <main lang="uk" style={wrap}>
      <div style={inner}>
        <style>{`
          @keyframes bbPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.13); } }
          .bb-player { animation: bbPulse 1.5s ease-in-out infinite; }
          .bb-goal { animation: bbPulse 2.3s ease-in-out infinite; filter: drop-shadow(0 0 5px rgba(239,159,39,0.85)); }
          .bb-dpad { transition: transform .1s, background .12s, border-color .12s; }
          .bb-dpad:hover { border-color: rgba(250,199,117,0.9); }
          .bb-dpad:active { background: #1f3b59; transform: scale(0.93); }
          .bb-mz-btn { transition: transform .1s, border-color .12s; }
          .bb-mz-btn:hover { border-color: rgba(250,199,117,0.85); }
          .bb-mz-btn:active { transform: translateY(1px); }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          .bb-details p { margin: 0 0 14px; }
          .bb-details p:last-child { margin-bottom: 0; }
          .bb-details b { color: ${GOLD}; }
          .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
          .bb-cream-note b { color: #B5710C; }
        `}</style>
        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Лабіринт</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Доведіть кружечок до прапорця стрілками. Тренує просторове мислення й уявну «карту» місцевості. Грайте у своєму темпі.
        </p>

        {/* рівні */}
        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l.label} style={plaque(i === li)} onClick={() => setLi(i)}>{l.label}</button>)}
        </div>
        {/* режим */}
        <div style={ROW}>
          <button style={plaque(!memory)} onClick={() => setMemory(false)}>Стіни видно</button>
          <button style={plaque(memory)} onClick={() => setMemory(true)}>По пам’яті</button>
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_DESC, margin: '4px 0 10px' }}>
          Кроків: {moves}{solved ? '' : <span style={{ color: TEXT_SOFT, fontWeight: 400 }}> · найкоротший шлях: {opt}</span>}
        </div>

        {/* лабіринт */}
        <div style={{ position: 'relative', width: 'min(92vw, 420px)', aspectRatio: '1 / 1', margin: '0 auto', border: `3px solid ${WALL}`, borderRadius: 6, overflow: 'hidden', display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)`, background: CELL, boxShadow: '0 0 28px rgba(239,159,39,0.2)' }}>
          {cells.map((cell, i) => {
            const onPath = path.has(i);
            const w = (on: boolean) => (showWalls && on ? `3px solid ${WALL}` : '3px solid transparent');
            return (
              <div key={i} style={{ position: 'relative', borderTop: w(cell.n), borderRight: w(cell.e), borderBottom: w(cell.s), borderLeft: w(cell.w), background: onPath ? CELL_PATH : 'transparent', boxShadow: onPath ? 'inset 0 0 9px rgba(239,159,39,0.22)' : undefined, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i === goal && (
                  <svg viewBox="0 0 24 24" className="bb-goal" aria-hidden style={{ width: '66%', height: '66%' }}>
                    <rect x="6" y="3.5" width="2" height="17" rx="1" fill={GOLD} />
                    <circle cx="7" cy="3.5" r="1.7" fill={GOLD} />
                    <path d="M8 4.5 L19.5 8 L8 11.5 Z" fill={GOLD} stroke={CREAM} strokeWidth="0.9" strokeLinejoin="round" />
                  </svg>
                )}
                {i === pos && <div className="bb-player" style={{ position: 'absolute', width: '58%', height: '58%', borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD})`, boxShadow: '0 0 16px rgba(239,159,39,0.85)', border: `2px solid ${CREAM}` }} />}
              </div>
            );
          })}
        </div>

        {/* керування — хрестовина */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '18px 0 6px' }}>
          <button aria-label="Вгору" className="bb-dpad" style={dpadBtn} onClick={() => move('n')}>↑</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button aria-label="Ліворуч" className="bb-dpad" style={dpadBtn} onClick={() => move('w')}>←</button>
            <button aria-label="Униз" className="bb-dpad" style={dpadBtn} onClick={() => move('s')}>↓</button>
            <button aria-label="Праворуч" className="bb-dpad" style={dpadBtn} onClick={() => move('e')}>→</button>
          </div>
        </div>

        <div style={{ ...ROW, marginTop: 10 }}>
          <button style={linkBtn} onClick={() => newMaze(size, memory)}>Новий лабіринт</button>
          {memory && <button style={linkBtn} onClick={doPeek}>Згадати стіни</button>}
        </div>

        {/* обґрунтування — як в інших іграх */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за вправа.</b><br />Лабіринт тренує просторову орієнтацію: прокласти маршрут і втримати «карту» в голові. Режим «по пам’яті» додатково тренує уявну карту.</p>
            <p><b>Чому це важливо для мозку.</b><br />За орієнтацію відповідають гіпокамп і енторинальна кора (їхні «нейрони місця і решітки» відзначені Нобелівською премією з медицини 2014 року — Велика Британія та Норвегія). Енторинальна кора уражається однією з перших при Альцгеймері, тому проблеми з орієнтацією часто зʼявляються раніше за проблеми з памʼяттю.</p>
            <p><b>Орієнтація як ранній сигнал.</b><br />Sea Hero Quest — мобільна гра-навігація, створена у Великій Британії (UCL та Університет Східної Англії з Alzheimer’s Research UK), понад 4 млн гравців зі світу. У дослідженні 2019 року люди з геном ризику Альцгеймера (APOE-ε4) орієнтувалися гірше — ще не маючи жодних проблем із памʼяттю.</p>
            <p><b>Навігація змінює мозок.</b><br />Дослідження UCL (Велика Британія, 2000 рік): у лондонських таксистів, які вивчили все місто, задня частина гіпокампа була більшою — і тим більшою, чим довший стаж. Повторне дослідження 2011 року показало, що вона зростала вже після навчання. Тобто практика орієнтування фізично впливає на мозок.</p>
            <p className="bb-cream-note"><b>Чесні межі.</b><br />Sea Hero Quest — про <i>раннє виявлення</i> ризику, а не доказ, що лабіринти <i>запобігають</i> деменції. Таксисти — це здорові люди й досвід, а не профілактика хвороби. Великого клінічного випробування, яке б довело, що лабіринти знижують ризик деменції, поки немає. Це проста корисна вправа, <b>не медичний тренажер</b> і не заміна лікування.</p>
            <p><b>Підсумок.</b><br />Тренувати орієнтацію безпечно й приємно. Гарантій немає; користь дає регулярність, а не одна спроба.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому дорослому, хто хоче тренувати орієнтацію та планування маршруту — і в зрілому віці, і просто для задоволення. Можна проходити разом з онуками.</p>
            <p><b>Кому бути обережним.</b><br />Вправа спокійна й безпечна. Якщо зосередження втомлює або зʼявляється запаморочення — просто зробіть паузу. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки за раз.</b><br />Орієнтовно 5–10 хвилин, не до втоми. Кілька лабіринтів — і досить.</p>
            <p><b>Як часто.</b><br />Користь дає регулярність — розумний орієнтир 3–5 разів на тиждень короткими сеансами.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» рівня в режимі «Стіни видно». Помилки й глухі кути — це нормально: саме невеликий виклик і тренує мозок.</p>
            <p><b>Чи це лікує.</b><br />Ні. Це тренувальна вправа для підтримки когнітивних функцій, а не ліки й не заміна консультації лікаря.</p>
          </div>
        </details>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 22, lineHeight: 1.5 }}>
          Матеріал має інформаційний характер і не є медичною консультацією. За потреби звертайтеся до лікаря.
        </p>

        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
          <a href="/games" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Усі ігри</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      {/* результат */}
      {solved && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '30px 34px', textAlign: 'center', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 30, margin: '0 0 10px', color: '#B5710C' }}>Лабіринт пройдено!</p>
            <p style={{ fontSize: 18, margin: '0 0 6px', color: NAVY2 }}>Ваших кроків: <b>{moves}</b></p>
            <p style={{ fontSize: 15, margin: '0 0 20px', color: '#5a534c' }}>{moves === opt ? 'Це найкоротший шлях — ідеально!' : `Найкоротший шлях: ${opt}`}</p>
            <button style={{ fontSize: 19, fontWeight: 700, padding: '14px 30px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' }} onClick={() => newMaze(size, memory)}>Ще лабіринт</button>
          </div>
        </div>
      )}
    </main>
  );
}
