'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';
const RED_SOFT = '#E8A0A0';

/* ===================== ЛОГІКА ===================== */
// генерує ряд довжини len без двох однакових цифр поспіль
function genSeq(len: number): number[] {
  const s: number[] = [];
  for (let i = 0; i < len; i++) {
    let d = Math.floor(Math.random() * 10);
    while (i > 0 && d === s[i - 1]) d = Math.floor(Math.random() * 10);
    s.push(d);
  }
  return s;
}
const isCorrect = (seq: number[], entry: number[]) =>
  entry.length === seq.length && entry.join(',') === [...seq].reverse().join(',');

type Prog = { length: number; trial: 1 | 2; best: number; done: boolean };
// крок стану після спроби (правила як у клінічному тесті: 2 ряди на довжину, стоп після 2 помилок)
function advance(p: Prog, correct: boolean): Prog {
  if (correct) return { length: p.length + 1, trial: 1, best: Math.max(p.best, p.length), done: false };
  if (p.trial === 1) return { length: p.length, trial: 2, best: p.best, done: false };
  return { length: p.length, trial: 2, best: p.best, done: true };
}

const START_LEN = 2;
type Level = { label: string; speed: number };
const LEVELS: Level[] = [{ label: 'Легкий', speed: 1100 }, { label: 'Середній', speed: 850 }, { label: 'Складний', speed: 600 }];
const GAP = 250; // пауза між цифрами, мс

type Phase = 'idle' | 'show' | 'input' | 'feedback' | 'done';

export default function DigitsPage() {
  const [li, setLi] = useState(0);
  const speed = LEVELS[li].speed;
  const [phase, setPhase] = useState<Phase>('idle');
  const [seq, setSeq] = useState<number[]>([]);
  const [flash, setFlash] = useState<number | null>(null);
  const [entry, setEntry] = useState<number[]>([]);
  const [prog, setProg] = useState<Prog>({ length: START_LEN, trial: 1, best: 0, done: false });
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const startGame = () => {
    clearTimers();
    setProg({ length: START_LEN, trial: 1, best: 0, done: false });
    setSeq(genSeq(START_LEN)); setEntry([]); setFlash(null); setFeedback(null); setPhase('show');
  };

  // показ ряду по одній цифрі
  useEffect(() => {
    if (phase !== 'show') return;
    clearTimers();
    let i = 0;
    const step = () => {
      if (i >= seq.length) { setFlash(null); setPhase('input'); return; }
      setFlash(seq[i]);
      timers.current.push(setTimeout(() => {
        setFlash(null);
        i++;
        timers.current.push(setTimeout(step, GAP));
      }, speed));
    };
    timers.current.push(setTimeout(step, 450));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, seq]);

  const evaluate = useCallback((ent: number[]) => {
    const ok = isCorrect(seq, ent);
    setFeedback(ok ? 'correct' : 'wrong');
    setPhase('feedback');
    timers.current.push(setTimeout(() => {
      setFeedback(null);
      const np = advance(prog, ok);
      setProg(np);
      if (np.done) { setPhase('done'); return; }
      setSeq(genSeq(np.length)); setEntry([]); setFlash(null); setPhase('show');
    }, 1000));
  }, [seq, prog]);

  const tapDigit = (d: number) => {
    if (phase !== 'input') return;
    const ent = [...entry, d];
    setEntry(ent);
    if (ent.length === seq.length) timers.current.push(setTimeout(() => evaluate(ent), 150));
  };
  const backspace = () => { if (phase === 'input') setEntry((e) => e.slice(0, -1)); };

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 5% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 480 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)', boxShadow: active ? '0 0 18px rgba(239,159,39,0.4)' : '0 0 10px rgba(239,159,39,0.1)' });
  const padBtn: React.CSSProperties = { aspectRatio: '1 / 1', borderRadius: 14, border: '1.5px solid rgba(250,199,117,0.4)', background: CARD, color: GOLD_LIGHT, fontSize: 26, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(239,159,39,0.12)' };
  const bigBtn: React.CSSProperties = { fontSize: 19, fontWeight: 700, padding: '14px 30px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif' };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

  const trialNote = prog.trial === 2 ? ' · друга спроба' : '';

  return (
    <main lang="uk" style={wrap}>
      <div style={inner}>
        <style>{`
          @keyframes bbPop { 0% { transform: scale(0.6); opacity: 0; } 40% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          .bb-flash { animation: bbPop 0.22s ease-out; }
          .bb-pad { transition: transform .1s, border-color .12s, background .12s; }
          .bb-pad:hover { border-color: rgba(250,199,117,0.9); }
          .bb-pad:active { background: #1f3b59; transform: scale(0.94); }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          .bb-details p { margin: 0 0 14px; }
          .bb-details p:last-child { margin-bottom: 0; }
          .bb-details b { color: ${GOLD}; }
          .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
          .bb-cream-note b { color: #B5710C; }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Цифри навпаки</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          Запамʼятайте ряд цифр, а тоді введіть його <b style={{ color: GOLD_LIGHT }}>у зворотному порядку</b>. З кожним правильним кроком ряд довшає. Тренує робочу памʼять.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l.label} style={plaque(i === li)} onClick={() => setLi(i)}>{l.label}</button>)}
        </div>

        {phase !== 'idle' && (
          <div style={{ fontSize: 15, fontWeight: 700, color: TEXT_DESC, margin: '4px 0 10px' }}>
            Довжина ряду: {prog.length}<span style={{ color: TEXT_SOFT, fontWeight: 400 }}> · найкраще: {prog.best || '—'}{trialNote}</span>
          </div>
        )}

        {/* екран гри */}
        <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', minHeight: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '22px 16px', textAlign: 'center', boxShadow: '0 0 24px rgba(239,159,39,0.12)' }}>
          {phase === 'idle' && (
            <>
              <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 16px', lineHeight: 1.5 }}>Цифри зʼявлятимуться по одній. Запамʼятайте їх — і введіть навпаки.</p>
              <button style={bigBtn} onClick={startGame}>Почати</button>
            </>
          )}

          {phase === 'show' && (
            <div className={flash !== null ? 'bb-flash' : undefined} key={`${flash}-${seq.length}`} style={{ fontFamily: 'Lora, serif', fontSize: 72, fontWeight: 700, color: GOLD_LIGHT, lineHeight: 1, minHeight: 80, display: 'flex', alignItems: 'center' }}>
              {flash !== null ? flash : ''}
            </div>
          )}

          {phase === 'input' && (
            <>
              <p style={{ fontSize: 15, color: TEXT_SOFT, margin: '0 0 12px' }}>Введіть навпаки:</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', minHeight: 44 }}>
                {Array.from({ length: seq.length }).map((_, k) => (
                  <div key={k} style={{ width: 34, height: 44, borderRadius: 8, border: `2px solid ${entry[k] !== undefined ? GOLD : 'rgba(250,199,117,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: GOLD_LIGHT, background: NAVY2 }}>
                    {entry[k] !== undefined ? entry[k] : ''}
                  </div>
                ))}
              </div>
            </>
          )}

          {phase === 'feedback' && (
            <div style={{ fontFamily: 'Lora, serif', fontSize: 30, fontWeight: 700, color: feedback === 'correct' ? GOLD_LIGHT : RED_SOFT }}>
              {feedback === 'correct' ? 'Правильно!' : 'Не точно'}
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 15, fontWeight: 400, color: TEXT_SOFT, marginTop: 8 }}>
                Правильна відповідь: {[...seq].reverse().join(' ')}
              </div>
            </div>
          )}
        </div>

        {/* цифрова клавіатура */}
        {phase === 'input' && (
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
              <button key={d} className="bb-pad" style={padBtn} onClick={() => tapDigit(d)}>{d}</button>
            ))}
            <button className="bb-pad" style={{ ...padBtn, fontSize: 18 }} onClick={backspace} aria-label="Стерти">⌫</button>
            <button key={0} className="bb-pad" style={padBtn} onClick={() => tapDigit(0)}>0</button>
            <div />
          </div>
        )}

        {phase !== 'idle' && phase !== 'done' && (
          <div style={{ marginTop: 14 }}>
            <button style={{ fontSize: 14, padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: CARD, color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700 }} onClick={() => { clearTimers(); setPhase('idle'); }}>Завершити</button>
          </div>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за вправа.</b><br />«Цифри навпаки» — це класичний тест на <b>робочу памʼять</b>: треба не просто запамʼятати ряд, а втримати його в голові й «перевернути». Саме перевертання вмикає робочу памʼять, а не лише короткочасне запамʼятовування.</p>
            <p><b>Звідки вона.</b><br />Це підтест «цифровий ряд» зі шкал Векслера (США): прямий ряд увійшов до тесту Векслера-Беллв’ю ще 1939 року, зворотний варіант психологи застосовують від початку XX століття. Сьогодні зворотний ряд входить до шкали памʼяті Векслера й застосовується в клінічній практиці у всьому світі.</p>
            <p><b>Що він показує.</b><br />Прямий ряд міряє радше увагу й короткочасну памʼять, а <b>зворотний</b> — робочу памʼять (здатність утримувати інформацію й одночасно нею оперувати). Зазвичай зворотний ряд коротший за прямий — саме тому він складніший.</p>
            <p><b>Як це влаштовано тут.</b><br />Як у клінічному тесті: на кожну довжину дається дві спроби, а ряд довшає лише після правильної відповіді. Це чесний спосіб виміряти ваш «обсяг» робочої памʼяті.</p>
            <p className="bb-cream-note"><b>Чесні межі.</b><br />Це <i>вимірювальний</i> тест, а не доказ, що такі вправи запобігають деменції. Регулярне тренування покращує насамперед саме цю навичку; широкого перенесення на всі сфери мислення чи профілактики хвороб переконливо не доведено. Це проста корисна вправа, <b>не медичний тренажер</b> і не заміна лікування чи обстеження.</p>
            <p><b>Підсумок.</b><br />Безпечний і приємний спосіб тримати робочу памʼять у тонусі. Гарантій немає; користь дає регулярність, а не одна спроба.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому дорослому, хто хоче тренувати памʼять і зосередженість. Добре заходить у зрілому віці; можна змагатися з рідними — хто втримає довший ряд.</p>
            <p><b>Кому бути обережним.</b><br />Вправа спокійна. Якщо відчуваєте втому чи роздратування — просто завершіть сеанс. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки за раз.</b><br />Орієнтовно 5–10 хвилин, не до втоми. Кілька раундів — і досить.</p>
            <p><b>Як часто.</b><br />Користь дає регулярність — розумний орієнтир 3–5 разів на тиждень короткими сеансами.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» рівня (цифри показуються довше). Допомагає проговорювати ряд подумки. Помилки — це нормально: саме невеликий виклик і тренує мозок.</p>
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
          <div style={{ background: CREAM, borderRadius: 18, padding: '30px 34px', textAlign: 'center', maxWidth: 420, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <p style={{ fontFamily: 'Lora, serif', fontSize: 30, margin: '0 0 10px', color: '#B5710C' }}>Ваш результат</p>
            <p style={{ fontSize: 19, margin: '0 0 6px', color: NAVY2 }}>
              {prog.best > 0 ? <>Ви втримали <b>{prog.best}</b> {plural(prog.best)} у зворотному порядку</> : 'Цього разу не вдалося — спробуйте ще раз, спокійно'}
            </p>
            <p style={{ fontSize: 15, margin: '0 0 20px', color: '#5a534c' }}>Тренуйтеся потроху — результат зростатиме.</p>
            <button style={bigBtn} onClick={startGame}>Ще раз</button>
          </div>
        </div>
      )}
    </main>
  );
}

function plural(n: number) {
  const a = Math.abs(n) % 100, b = n % 10;
  if (a > 10 && a < 20) return 'цифр';
  if (b === 1) return 'цифру';
  if (b >= 2 && b <= 4) return 'цифри';
  return 'цифр';
}
