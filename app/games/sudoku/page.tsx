'use client';

import React, { useState, useEffect } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';
const RED_SOFT = '#E8736F';

/* ===================== ЛОГІКА ===================== */
const rc = (r: number, c: number) => r * 9 + c;
function valid(g: number[], pos: number, val: number): boolean {
  const r = (pos / 9) | 0, c = pos % 9;
  for (let i = 0; i < 9; i++) { if (g[rc(r, i)] === val) return false; if (g[rc(i, c)] === val) return false; }
  const br = ((r / 3) | 0) * 3, bc = ((c / 3) | 0) * 3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (g[rc(br + i, bc + j)] === val) return false;
  return true;
}
function shuffle<T>(a: T[]): T[] { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function fillSolved(g: number[], pos = 0): boolean {
  if (pos === 81) return true;
  if (g[pos] !== 0) return fillSolved(g, pos + 1);
  for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) { if (valid(g, pos, v)) { g[pos] = v; if (fillSolved(g, pos + 1)) return true; g[pos] = 0; } }
  return false;
}
function countSolutions(g: number[], limit = 2): number {
  let pos = -1; for (let i = 0; i < 81; i++) if (g[i] === 0) { pos = i; break; }
  if (pos === -1) return 1;
  let total = 0;
  for (let v = 1; v <= 9; v++) { if (valid(g, pos, v)) { g[pos] = v; total += countSolutions(g, limit); g[pos] = 0; if (total >= limit) break; } }
  return total;
}
function makePuzzle(level: number): { puzzle: number[]; solution: number[] } {
  const target = [38, 30, 24][level];
  const solution = new Array(81).fill(0); fillSolved(solution);
  const puzzle = [...solution];
  let clues = 81;
  for (const pos of shuffle([...Array(81).keys()])) {
    if (clues <= target) break;
    const bak = puzzle[pos]; if (bak === 0) continue;
    puzzle[pos] = 0;
    if (countSolutions([...puzzle], 2) !== 1) puzzle[pos] = bak; else clues--;
  }
  return { puzzle, solution };
}
// конфлікти: для кожної заповненої клітини — чи дублюється в рядку/стовпці/квадраті
function conflicts(cells: number[]): boolean[] {
  const bad = new Array(81).fill(false);
  const dup = (idxs: number[]) => { const seen: Record<number, number[]> = {}; for (const i of idxs) { const v = cells[i]; if (v) (seen[v] = seen[v] || []).push(i); } for (const v in seen) if (seen[v].length > 1) seen[v].forEach((i) => bad[i] = true); };
  for (let r = 0; r < 9; r++) dup([...Array(9).keys()].map((c) => rc(r, c)));
  for (let c = 0; c < 9; c++) dup([...Array(9).keys()].map((r) => rc(r, c)));
  for (let b = 0; b < 9; b++) { const br = ((b / 3) | 0) * 3, bc = (b % 3) * 3; const idxs = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) idxs.push(rc(br + i, bc + j)); dup(idxs); }
  return bad;
}

const LEVELS = ['Легкий', 'Середній', 'Складний'];
type Phase = 'idle' | 'play' | 'win';

export default function SudokuPage() {
  const [li, setLi] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [given, setGiven] = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [cells, setCells] = useState<number[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);

  const newGame = (level: number) => {
    setBusy(true); setPhase('play'); setSel(null); setChecking(false);
    // дати браузеру намалювати «Генерую…»
    setTimeout(() => {
      const { puzzle, solution } = makePuzzle(level);
      setGiven(puzzle); setSolution(solution); setCells([...puzzle]); setBusy(false);
    }, 20);
  };

  const setCell = (v: number) => {
    if (sel == null || given[sel] !== 0 || phase !== 'play') return;
    setCells((cs) => { const n = [...cs]; n[sel] = n[sel] === v ? 0 : v; return n; });
    setChecking(false);
  };
  const erase = () => { if (sel == null || given[sel] !== 0) return; setCells((cs) => { const n = [...cs]; n[sel] = 0; return n; }); };
  const hint = () => {
    if (phase !== 'play' || busy) return;
    let target = sel != null && cells[sel] === 0 ? sel : -1;
    if (target === -1) { const empties = cells.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0); if (!empties.length) return; target = empties[Math.floor(Math.random() * empties.length)]; }
    setCells((cs) => { const n = [...cs]; n[target] = solution[target]; return n; });
    setGiven((g) => { const n = [...g]; n[target] = solution[target]; return n; }); // підказка фіксується
  };

  // перемога
  useEffect(() => {
    if (phase === 'play' && cells.length === 81 && cells.every((v, i) => v === solution[i])) setPhase('win');
  }, [cells, solution, phase]);

  const bad = phase === 'play' ? conflicts(cells) : new Array(81).fill(false);
  const selVal = sel != null ? cells[sel] : 0;
  const filled = cells.filter((v) => v !== 0).length;

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 4% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 460 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)' });
  const bigBtn: React.CSSProperties = { fontSize: 18, fontWeight: 700, padding: '12px 26px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const ghost: React.CSSProperties = { flex: '1 1 0', fontSize: 14, fontWeight: 700, padding: '11px 8px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.4)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer' };
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
          .bb-cell { transition: background .12s; }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Судоку</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Заповніть поле так, щоб у кожному рядку, стовпці та квадраті 3×3 були всі цифри від 1 до 9 без повторів. Логічна гра — мова не потрібна.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l} style={plaque(i === li)} onClick={() => { setLi(i); newGame(i); }}>{l}</button>)}
        </div>

        {phase === 'idle' && (
          <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', padding: '26px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 16px' }}>Оберіть рівень складності — і почнемо.</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Почати</button>
          </div>
        )}

        {phase !== 'idle' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: TEXT_SOFT, marginBottom: 8 }}>
              <span>Заповнено: {filled} / 81</span>
              <span>{LEVELS[li]}</span>
            </div>

            {busy ? (
              <div style={{ width: 'min(92vw, 56vh, 460px)', aspectRatio: '1/1', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD_LIGHT, fontSize: 18, background: CARD, borderRadius: 10 }}>Генерую…</div>
            ) : (
              <div style={{ width: 'min(92vw, 56vh, 460px)', aspectRatio: '1/1', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', background: GOLD, border: `2.5px solid ${GOLD}`, borderRadius: 6, overflow: 'hidden' }}>
                {cells.map((v, i) => {
                  const r = (i / 9) | 0, c = i % 9;
                  const isGiven = given[i] !== 0;
                  const isSel = sel === i;
                  const sameVal = selVal !== 0 && v === selVal;
                  const peer = sel != null && (((sel / 9) | 0) === r || sel % 9 === c || (((((sel / 9) | 0) / 3) | 0) === ((r / 3) | 0) && (((sel % 9) / 3) | 0) === ((c / 3) | 0)));
                  let bg = NAVY2;
                  if (peer) bg = '#1d3552';
                  if (sameVal) bg = '#274a6e';
                  if (isSel) bg = '#33597e';
                  const showWrong = (checking && v !== 0 && v !== solution[i]) || bad[i];
                  return (
                    <div key={i} className="bb-cell" onClick={() => setSel(i)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      background: bg,
                      borderRight: `${c % 3 === 2 && c !== 8 ? 2.5 : 1}px solid ${c % 3 === 2 && c !== 8 ? GOLD : 'rgba(250,199,117,0.18)'}`,
                      borderBottom: `${r % 3 === 2 && r !== 8 ? 2.5 : 1}px solid ${r % 3 === 2 && r !== 8 ? GOLD : 'rgba(250,199,117,0.18)'}`,
                      fontFamily: "'Lora', serif", fontSize: 'clamp(16px, 5vw, 26px)', fontWeight: isGiven ? 700 : 600,
                      color: showWrong ? RED_SOFT : isGiven ? CREAM : GOLD_LIGHT,
                    }}>{v !== 0 ? v : ''}</div>
                  );
                })}
              </div>
            )}

            {/* цифрова панель */}
            {!busy && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7, marginTop: 14, maxWidth: 'min(92vw, 56vh, 460px)', marginLeft: 'auto', marginRight: 'auto' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <button key={n} onClick={() => setCell(n)} style={{ height: 50, borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.4)', background: CARD, color: GOLD_LIGHT, fontSize: 22, fontWeight: 700, fontFamily: "'Lora', serif", cursor: 'pointer' }}>{n}</button>
                ))}
                <button onClick={erase} aria-label="Стерти" style={{ height: 50, borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.4)', background: CARD, color: GOLD_LIGHT, fontSize: 18, cursor: 'pointer' }}>⌫</button>
              </div>
            )}

            {!busy && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12, maxWidth: 'min(92vw, 56vh, 460px)', marginLeft: 'auto', marginRight: 'auto' }}>
                <button style={ghost} onClick={hint}>Підказка</button>
                <button style={ghost} onClick={() => { setChecking(true); setTimeout(() => setChecking(false), 2500); }}>Перевірити</button>
                <button style={ghost} onClick={() => newGame(li)}>Нова гра</button>
              </div>
            )}
          </>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чим корисна ця гра</summary>
          <div style={detailsBody}>
            <p><b>Що це.</b><br />Судоку — логічна головоломка з цифрами. Цифри тут — просто значки, рахувати нічого не треба: усе вирішує логіка. Тому гра не потребує знання мови — зручно для всіх.</p>
            <p><b>Чим корисна.</b><br />Судоку тренує логіку, увагу й зосередженість: ви крок за кроком виключаєте неможливі варіанти й шукаєте єдиний правильний. Спокійне заняття, у яке приємно зануритися.</p>
            <p className="bb-cream-note"><b>Чесно.</b><br />Ми не наводимо медичних досліджень саме про судоку, тому не обіцяємо жодної користі для здоровʼя. Це гра для задоволення й тренування мислення, <b>а не лікування</b> чи профілактика хвороб.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Як грати</summary>
          <div style={detailsBody}>
            <p><b>Мета.</b><br />Заповнити всі клітинки так, щоб у кожному рядку, кожному стовпці й кожному квадраті 3×3 були цифри від 1 до 9 — кожна рівно один раз.</p>
            <p><b>Як ставити цифри.</b><br />Торкніться клітинки, тоді цифри внизу. Повторний дотик тієї ж цифри або «⌫» — стерти. Початкові цифри змінити не можна.</p>
            <p><b>Підказки.</b><br />«Підказка» відкриває одну правильну клітинку. «Перевірити» на кілька секунд підсвічує червоним помилкові цифри. Однакові цифри й конфлікти підсвічуються самі.</p>
            <p><b>Рівні.</b><br />Що складніший рівень — то менше відкритих цифр на старті. У кожної головоломки лише один розвʼязок — вгадувати не доведеться.</p>
          </div>
        </details>

        <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 26, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 20 }}>
          <a href="/games" style={navArrow}><span style={{ fontSize: 22, lineHeight: 1 }}>←</span><span>Усі ігри</span></a>
          <a href="/" style={{ ...navArrow, textAlign: 'right' }}><span>Головна</span><span style={{ fontSize: 22, lineHeight: 1 }}>→</span></a>
        </nav>
      </div>

      {phase === 'win' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '26px 30px', textAlign: 'center', maxWidth: 340, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 30, margin: '0 0 8px', lineHeight: 1.2, color: '#B5710C' }}>Розвʼязано!</p>
            <p style={{ fontSize: 16, margin: '0 0 20px', lineHeight: 1.4, color: NAVY2 }}>Чудова робота. Спробуєте складніший рівень?</p>
            <button style={bigBtn} onClick={() => newGame(li)}>Нова гра</button>
          </div>
        </div>
      )}
    </main>
  );
}
