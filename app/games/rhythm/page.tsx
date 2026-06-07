'use client';

import React, { useState, useEffect, useRef } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';
const RED_SOFT = '#E8A0A0', GREEN_SOFT = '#7FD18B';

/* ===================== ЛОГІКА ===================== */
type Kind = 'L' | 'R' | 'STOP';
type G = { kind: Kind | null; answered: boolean; lives: number; correct: number; streak: number; interval: number; over: boolean; last: 'ok' | 'bad' | 'miss' | null };

const START_LIVES = 3, FLOOR = 480, STEP = 70, SPEEDUP_EVERY = 5;
const opp = (k: Kind) => (k === 'L' ? 'R' : 'L');

function applyCorrect(s: G): G {
  const streak = s.streak + 1;
  const interval = streak % SPEEDUP_EVERY === 0 ? Math.max(FLOOR, s.interval - STEP) : s.interval;
  return { ...s, correct: s.correct + 1, streak, interval, answered: true, last: 'ok' };
}
function applyError(s: G): G {
  const lives = s.lives - 1;
  return { ...s, lives, streak: 0, answered: true, last: 'bad', over: lives <= 0 };
}
function onPress(s: G, dir: 'L' | 'R'): G {
  if (s.over || s.answered || s.kind == null) return s;
  if (s.kind === 'STOP') return applyError(s);
  return dir === opp(s.kind) ? applyCorrect(s) : applyError(s);
}
function onBeat(s: G, nk: Kind): G {
  let st = s;
  if (s.kind != null && !s.answered) {
    if (s.kind === 'STOP') st = applyCorrect(s);
    else { const lives = s.lives - 1; st = { ...s, lives, streak: 0, answered: true, last: 'miss', over: lives <= 0 }; }
  }
  if (st.over) return st;
  return { ...st, kind: nk, answered: false };
}
function genKind(prev: Kind | null, stopProb: number): Kind {
  if (stopProb > 0 && prev !== 'STOP' && prev != null && Math.random() < stopProb) return 'STOP';
  return Math.random() < 0.5 ? 'L' : 'R';
}

type Level = { label: string; start: number; stopProb: number };
const LEVELS: Level[] = [
  { label: 'Легкий', start: 1300, stopProb: 0 },
  { label: 'Середній', start: 1050, stopProb: 0.22 },
  { label: 'Складний', start: 850, stopProb: 0.3 },
];
type Phase = 'idle' | 'count' | 'run' | 'done';

export default function RhythmPage() {
  const [li, setLi] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [g, setG] = useState<G>({ kind: null, answered: true, lives: START_LIVES, correct: 0, streak: 0, interval: LEVELS[0].start, over: false, last: null });
  const [pulse, setPulse] = useState(0);
  const [countVal, setCountVal] = useState(3);
  const [best, setBest] = useState<[number, number, number]>([0, 0, 0]);
  const gRef = useRef(g);
  const stopProbRef = useRef(0);
  const beatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => { if (beatTimer.current) clearTimeout(beatTimer.current); if (cdTimer.current) clearTimeout(cdTimer.current); beatTimer.current = null; cdTimer.current = null; };
  useEffect(() => () => clearTimers(), []);

  const endGame = (s: G) => {
    clearTimers();
    setBest((b) => { const nb = [...b] as [number, number, number]; if (s.correct > nb[li]) nb[li] = s.correct; return nb; });
    setPhase('done');
  };

  const scheduleBeat = () => { beatTimer.current = setTimeout(tick, gRef.current.interval); };
  const tick = () => {
    const nk = genKind(gRef.current.kind, stopProbRef.current);
    const next = onBeat(gRef.current, nk);
    gRef.current = next; setG(next);
    if (next.over) { endGame(next); return; }
    setPulse((p) => p + 1);
    scheduleBeat();
  };

  const press = (dir: 'L' | 'R') => {
    if (phase !== 'run') return;
    const next = onPress(gRef.current, dir);
    if (next === gRef.current) return;
    gRef.current = next; setG(next);
    if (next.over) endGame(next);
  };

  const start = () => {
    clearTimers();
    stopProbRef.current = LEVELS[li].stopProb;
    const initG: G = { kind: null, answered: true, lives: START_LIVES, correct: 0, streak: 0, interval: LEVELS[li].start, over: false, last: null };
    gRef.current = initG; setG(initG);
    setPhase('count'); setCountVal(3);
    const stepCd = (n: number) => { setCountVal(n); cdTimer.current = setTimeout(() => { if (n > 1) stepCd(n - 1); else { setPhase('run'); tick(); } }, 750); };
    stepCd(3);
  };

  const chooseLevel = (i: number) => { clearTimers(); setLi(i); setPhase('idle'); const ng: G = { kind: null, answered: true, lives: START_LIVES, correct: 0, streak: 0, interval: LEVELS[i].start, over: false, last: null }; gRef.current = ng; setG(ng); };

  // клавіатура
  useEffect(() => {
    if (phase !== 'run') return;
    const h = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') press('L'); else if (e.key === 'ArrowRight') press('R'); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const ringColor = g.kind === 'STOP' ? RED_SOFT : g.last === 'ok' ? GREEN_SOFT : (g.last === 'bad' || g.last === 'miss') ? RED_SOFT : GOLD;
  const hasStops = LEVELS[li].stopProb > 0;

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 5% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 480 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)', boxShadow: active ? '0 0 18px rgba(239,159,39,0.4)' : '0 0 10px rgba(239,159,39,0.1)' });
  const bigBtn: React.CSSProperties = { fontSize: 19, fontWeight: 700, padding: '14px 30px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const arrowBtn: React.CSSProperties = { flex: '1 1 0', height: 92, borderRadius: 16, border: `2px solid ${GOLD}`, background: CARD, color: GOLD_LIGHT, fontSize: 44, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(239,159,39,0.14)' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

  return (
    <main lang="uk" style={wrap}>
      <div style={inner}>
        <style>{`
          @keyframes bbBeat { 0% { transform: scale(1); } 30% { transform: scale(1.12); } 100% { transform: scale(1); } }
          .bb-ring { animation: bbBeat 0.3s ease-out; }
          .bb-ab { transition: transform .08s, background .12s, border-color .12s; }
          .bb-ab:active { transform: scale(0.96); background: #20405f; }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          .bb-details p { margin: 0 0 14px; }
          .bb-details p:last-child { margin-bottom: 0; }
          .bb-details b { color: ${GOLD}; line-height: 1.3; }
          .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
          .bb-cream-note b { color: #B5710C; }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Ритм і вибір</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Тримайте ритм і водночас гасіть автоматизм: на кожен удар тисніть у бік, <b style={{ color: GOLD_LIGHT }}>протилежний</b> до стрілки. Дві справи воднораз — рух і самоконтроль.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l.label} style={plaque(i === li)} onClick={() => chooseLevel(i)}>{l.label}</button>)}
        </div>

        {phase !== 'idle' && phase !== 'done' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 22, letterSpacing: 3 }}>
              {Array.from({ length: START_LIVES }).map((_, i) => <span key={i} style={{ color: i < g.lives ? GOLD : 'rgba(255,255,255,0.18)' }}>●</span>)}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_DESC }}>Правильно: {g.correct}</div>
          </div>
        )}

        {(phase === 'run' || phase === 'count') && (
          <p style={{ fontSize: 13.5, color: GOLD_LIGHT, textAlign: 'center', margin: '0 0 10px', fontWeight: 700 }}>
            Тисни НАВПАКИ{hasStops ? ' · червоне коло — не тискай' : ''}
          </p>
        )}

        {/* екран */}
        <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', boxShadow: '0 0 24px rgba(239,159,39,0.12)' }}>
          {phase === 'idle' && (
            <div>
              <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 12px', lineHeight: 1.5 }}>
                Правило просте, але хитре: тисніть у <b style={{ color: GOLD_LIGHT }}>протилежний</b> бік. Бачите <b style={{ color: GOLD_LIGHT }}>←</b> — тисніть <b style={{ color: GOLD_LIGHT }}>→</b>; бачите <b style={{ color: GOLD_LIGHT }}>→</b> — тисніть <b style={{ color: GOLD_LIGHT }}>←</b>.
              </p>
              <p style={{ fontSize: 14, color: 'rgba(207,227,250,0.75)', margin: '0 0 18px', lineHeight: 1.5 }}>На «Середньому» й «Складному» інколи блимає <b style={{ color: RED_SOFT }}>червоне коло</b> — тоді не тискайте взагалі. Усе — вчасно, у такт пульсу.</p>
              <button style={bigBtn} onClick={start}>Почати</button>
            </div>
          )}
          {phase === 'count' && (
            <div key={countVal} className="bb-ring" style={{ fontFamily: 'Lora, serif', fontSize: 70, fontWeight: 700, color: GOLD_LIGHT }}>{countVal}</div>
          )}
          {phase === 'run' && (
            <div key={pulse} className="bb-ring" style={{ width: 130, height: 130, borderRadius: '50%', border: `5px solid ${ringColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${ringColor}66`, background: g.kind === 'STOP' ? 'rgba(232,160,160,0.12)' : 'transparent', transition: 'border-color .12s' }}>
              {g.kind === 'STOP'
                ? <span style={{ fontSize: 30, fontWeight: 700, color: RED_SOFT, letterSpacing: 1 }}>СТОП</span>
                : <span style={{ fontSize: 70, fontWeight: 700, color: GOLD_LIGHT, lineHeight: 1 }}>{g.kind === 'L' ? '←' : g.kind === 'R' ? '→' : ''}</span>}
            </div>
          )}
        </div>

        {(phase === 'run' || phase === 'count') && (
          <>
            <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
              <button className="bb-ab" style={arrowBtn} onClick={() => press('L')} aria-label="Ліворуч">←</button>
              <button className="bb-ab" style={arrowBtn} onClick={() => press('R')} aria-label="Праворуч">→</button>
            </div>
            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button onClick={() => endGame(gRef.current)} style={{ fontSize: 14, padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700 }}>Завершити</button>
            </div>
          </>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за вправа.</b><br />Ви робите <b>дві справи воднораз</b>: тримаєте ритм (рухова частина) і на кожен удар гасите автоматичний порив — тиснете у <b>протилежний</b> бік від стрілки, а на «стоп»-сигнал стримуєтесь. Це навантажує гальмування й переключення — серцевину виконавчих функцій (робота лобових часток).</p>
            <p><b>Чому це важливо.</b><br />Здатність робити дві речі разом з віком слабшає. Її погіршення (наприклад, людина зупиняється, коли під час ходьби починає говорити) повʼязують із підвищеним ризиком зниження памʼяті й падінь.</p>
            <p><b>Що показали дослідження.</b><br />Десятки рандомізованих досліджень із різних країн (Азія, Європа, Північна Америка), зведених у метааналізах 2024–2025 років, виявили користь подвійних задач для виконавчих функцій, ходи й рівноваги. Наприклад, корейське дослідження 2022 року (58 літніх людей із падіннями в анамнезі): 6 тижнів тренувань подвійних задач покращили рівновагу й виконавчі функції більше, ніж звичайні вправи на рівновагу.</p>
            <p><b>Як це влаштовано тут.</b><br />Пульс задає темп; на кожен удар треба вчасно дати правильну відповідь за правилом «навпаки». З успіхами темп пришвидшується. Ми вимірюємо «встигли / ні», без мілісекундної точності — щоб працювало надійно на телефоні.</p>
            <p className="bb-cream-note"><b>Чесні межі.</b><br />Найсильніші докази — для <i>рухових</i> подвійних задач (хода, рівновага). Наша «пальцева» версія тренує радше гальмування й переключення уваги, а не ходу. До того ж сила ефекту в різних дослідженнях різниться, а вплив саме на профілактику падінь поки контроверсійний — потрібні більші й триваліші роботи. Це <b>не заміна</b> фізичних вправ на рівновагу й не лікування. Якщо є проблеми з рівновагою чи падіннями — тренуйтеся рухово під наглядом фахівця.</p>
            <p><b>Підсумок.</b><br />Корисний і бадьорий спосіб тренувати «двозадачність» і самоконтроль. Гарантій немає; користь дає регулярність, а не одна спроба.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому дорослому для тренування уваги, самоконтролю й швидкості реакції. Можна змагатися з рідними — хто протримається довше.</p>
            <p><b>Кому бути обережним.</b><br />Якщо швидкий темп дратує або втомлює — знизьте рівень чи завершіть. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки за раз.</b><br />Кілька підходів по кілька хвилин — досить. Не до втоми.</p>
            <p><b>Як часто.</b><br />Користь дає регулярність — розумний орієнтир 3–5 разів на тиждень короткими сеансами.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» — там повільніший темп і без «стопів». Спершу плутати боки — нормально: саме це й тренує мозок.</p>
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
      {phase === 'done' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(14,26,43,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: CREAM, borderRadius: 18, padding: '24px 26px', textAlign: 'center', maxWidth: 360, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 26, margin: '0 0 6px', lineHeight: 1.2, color: '#B5710C' }}>Ваш результат</p>
            <p style={{ fontSize: 18, margin: '0 0 6px', lineHeight: 1.3, color: NAVY2 }}>Правильних відповідей: <b>{g.correct}</b></p>
            <p style={{ fontSize: 14.5, margin: '0 0 18px', lineHeight: 1.4, color: '#5a534c' }}>
              {best[li] > g.correct ? `Ваш найкращий результат: ${best[li]}. Спробуйте побити!` : 'Гарно! Наступного разу — ще більше.'}
            </p>
            <button style={{ ...bigBtn, padding: '12px 26px', fontSize: 18 }} onClick={start}>Ще раз</button>
          </div>
        </div>
      )}
    </main>
  );
}
