'use client';

import React, { useState, useEffect, useRef } from 'react';

/* ===================== БРЕНД ===================== */
const NAVY = '#0E1A2B', NAVY2 = '#14253B', GOLD = '#EF9F27', CREAM = '#FFF8EE';
const CARD = '#193049', GOLD_LIGHT = '#FAC775', TEXT_SOFT = '#CFE3FA', TEXT_DESC = '#E3EFFB';

/* ===================== ДАНІ ===================== */
const BROAD = ['тварини', 'їжа', 'одяг', 'меблі', 'транспорт', 'рослини', 'посуд', 'спортивні ігри'];
const NARROW = ['птахи', 'овочі', 'фрукти', 'риби', 'дикі тварини', 'дерева', 'квіти', 'професії', 'музичні інструменти', 'міста України'];
const LETTERS = ['П', 'К', 'М', 'С', 'Т', 'Б', 'В', 'Н', 'Р', 'Л', 'Д', 'Г', 'З'];

type Level = { label: string; pool: string[]; isLetter: boolean };
const LEVELS: Level[] = [
  { label: 'Легкий', pool: BROAD, isLetter: false },
  { label: 'Середній', pool: NARROW, isLetter: false },
  { label: 'Складний', pool: LETTERS, isLetter: true },
];
const DURATION = 60; // секунд

function pickPrompt(pool: string[], prev: string | null): string {
  if (pool.length === 1) return pool[0];
  let p = pool[Math.floor(Math.random() * pool.length)];
  while (p === prev) p = pool[Math.floor(Math.random() * pool.length)];
  return p;
}

type Phase = 'idle' | 'run' | 'done';

export default function FluencyPage() {
  const [li, setLi] = useState(0);
  const lvl = LEVELS[li];
  const [phase, setPhase] = useState<Phase>('idle');
  const [prompt, setPrompt] = useState<string>('');
  const [count, setCount] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [best, setBest] = useState<[number, number, number]>([0, 0, 0]);
  const deadline = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = () => { if (tick.current) { clearInterval(tick.current); tick.current = null; } };
  useEffect(() => () => stopTick(), []);

  const finish = () => {
    stopTick();
    setBest((b) => { const nb = [...b] as [number, number, number]; if (count > nb[li]) nb[li] = count; return nb; });
    setPhase('done');
  };

  const start = () => {
    stopTick();
    setPrompt(pickPrompt(lvl.pool, prompt || null));
    setCount(0);
    setLeft(DURATION);
    deadline.current = Date.now() + DURATION * 1000;
    setPhase('run');
  };

  // таймер
  useEffect(() => {
    if (phase !== 'run') return;
    tick.current = setInterval(() => {
      const rem = Math.max(0, Math.round((deadline.current - Date.now()) / 1000));
      setLeft(rem);
      if (rem <= 0) finish();
    }, 250);
    return stopTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const add = () => { if (phase === 'run') setCount((c) => c + 1); };
  const sub = () => { if (phase === 'run') setCount((c) => Math.max(0, c - 1)); };

  const promptText = lvl.isLetter ? <>Слова на літеру <b style={{ color: GOLD_LIGHT }}>«{prompt}»</b></> : <>Категорія: <b style={{ color: GOLD_LIGHT }}>{prompt}</b></>;

  /* ---- стилі ---- */
  const wrap: React.CSSProperties = { background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY2} 50%, ${NAVY} 100%)`, color: TEXT_DESC, padding: '28px 5% 36px', fontFamily: 'Montserrat, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center' };
  const inner: React.CSSProperties = { width: '100%', maxWidth: 480 };
  const ROW: React.CSSProperties = { display: 'flex', gap: 8, marginBottom: 12, width: '100%' };
  const plaque = (active: boolean): React.CSSProperties => ({ flex: '1 1 0', minWidth: 0, padding: '9px 6px', borderRadius: 10, fontSize: 15, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? GOLD : CARD, color: active ? NAVY : GOLD_LIGHT, border: active ? `1.5px solid ${GOLD}` : '1.5px solid rgba(250,199,117,0.3)', boxShadow: active ? '0 0 18px rgba(239,159,39,0.4)' : '0 0 10px rgba(239,159,39,0.1)' });
  const bigBtn: React.CSSProperties = { fontSize: 19, fontWeight: 700, padding: '14px 30px', borderRadius: 12, border: 'none', background: GOLD, color: NAVY, cursor: 'pointer' };
  const detailsBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 16, overflow: 'hidden' };
  const summaryStyle: React.CSSProperties = { cursor: 'pointer', padding: '16px 20px', fontSize: 17, fontWeight: 700, color: GOLD, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.3 };
  const detailsBody: React.CSSProperties = { padding: '0 20px 18px', fontSize: 15.5, lineHeight: 1.65, color: TEXT_SOFT };
  const navArrow: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, fontSize: 15, textDecoration: 'none' };

  const lowTime = left <= 10;

  return (
    <main lang="uk" style={wrap}>
      <div style={inner}>
        <style>{`
          .bb-tap { transition: transform .08s, background .12s; }
          .bb-tap:active { transform: scale(0.97); background: #1f3b59; }
          details > summary { list-style: none; }
          details > summary::-webkit-details-marker { display: none; }
          .bb-details p { margin: 0 0 14px; }
          .bb-details p:last-child { margin-bottom: 0; }
          .bb-details b { color: ${GOLD}; line-height: 1.3; }
          .bb-cream-note { background: #FFF3DF; border-radius: 12px; padding: 14px 16px; color: ${NAVY}; }
          .bb-cream-note b { color: #B5710C; }
        `}</style>

        <nav style={{ marginBottom: 14, fontSize: 13 }}><a href="/games" style={{ color: GOLD, textDecoration: 'none' }}>← Ігри</a></nav>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 600, color: GOLD_LIGHT, margin: '0 0 8px', textShadow: '0 0 22px rgba(239,159,39,0.45)' }}>Назви якнайбільше</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, color: TEXT_SOFT, margin: '0 0 18px' }}>
          За 60 секунд називайте <b style={{ color: GOLD_LIGHT }}>вголос</b> якнайбільше слів на задану тему або літеру — і натискайте «+1» за кожне. Тренує словесну побіжність.
        </p>

        <div style={ROW}>
          {LEVELS.map((l, i) => <button key={l.label} style={plaque(i === li)} onClick={() => { if (phase !== 'run') setLi(i); }}>{l.label}</button>)}
        </div>

        {/* екран */}
        {phase === 'idle' && (
          <div style={{ background: CARD, borderRadius: 16, border: '1.5px solid rgba(250,199,117,0.25)', padding: '24px 18px', textAlign: 'center', boxShadow: '0 0 24px rgba(239,159,39,0.12)' }}>
            <p style={{ fontSize: 16, color: TEXT_SOFT, margin: '0 0 8px', lineHeight: 1.5 }}>
              {li === 2 ? 'Вам випаде літера. Називайте вголос слова, що з неї починаються.' : 'Вам випаде тема. Називайте вголос слова з цієї теми.'}
            </p>
            <p style={{ fontSize: 14, color: 'rgba(207,227,250,0.7)', margin: '0 0 18px' }}>Рахуємо самі — натискайте «+1» за кожне сказане слово.</p>
            <button style={bigBtn} onClick={start}>Почати</button>
          </div>
        )}

        {phase === 'run' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: TEXT_DESC }}>{promptText}</div>
              <div style={{ fontFamily: 'Lora, serif', fontSize: 26, fontWeight: 700, color: lowTime ? '#E8A0A0' : GOLD_LIGHT, minWidth: 56, textAlign: 'right' }}>{left} с</div>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ height: '100%', width: `${(left / DURATION) * 100}%`, background: lowTime ? '#E8A0A0' : GOLD, transition: 'width .25s linear' }} />
            </div>
            <button className="bb-tap" onClick={add} style={{ width: '100%', height: 150, borderRadius: 18, border: `2px solid ${GOLD}`, background: CARD, color: GOLD_LIGHT, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(239,159,39,0.18)' }}>
              <span style={{ fontFamily: 'Lora, serif', fontSize: 64, fontWeight: 700, lineHeight: 1 }}>{count}</span>
              <span style={{ fontSize: 15, marginTop: 6, color: TEXT_SOFT }}>натисніть за кожне слово</span>
            </button>
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={sub} style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700 }}>−1</button>
              <button onClick={finish} style={{ flex: '1 1 0', padding: '10px 18px', borderRadius: 10, border: '1.5px solid rgba(250,199,117,0.35)', background: 'transparent', color: GOLD_LIGHT, cursor: 'pointer', fontWeight: 700 }}>Завершити раніше</button>
            </div>
          </>
        )}

        {/* обґрунтування */}
        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Чи це справді працює? — докладно</summary>
          <div style={detailsBody}>
            <p><b>Що це за вправа.</b><br />Це <b>тест на словесну побіжність</b>: за хвилину треба назвати якнайбільше слів на тему (наприклад, «тварини») або на певну літеру. Він показує, наскільки швидко мозок знаходить і добуває потрібні слова.</p>
            <p><b>Звідки вона.</b><br />Класичний тест словесної побіжності — COWAT (США, Артур Бентон, 1967): назвати слова на літеру за хвилину. Поряд застосовують «категорійний» варіант (тварини, продукти тощо). Сьогодні обидва входять до стандартних наборів для оцінки памʼяті й мислення у всьому світі.</p>
            <p><b>Що він показує.</b><br />«На літеру» більше навантажує самоконтроль і пошук (лобові частки), а «за категорією» — словниковий запас і звʼязки між поняттями. Категорійна побіжність (особливо «тварини») — один із чутливих ранніх показників, бо при хворобі Альцгеймера руйнуються саме звʼязки між словами й поняттями.</p>
            <p><b>Як це влаштовано тут.</b><br />Як у справжньому тесті — одна хвилина, слова <b>вголос</b>. Рахуєте самі: натискаєте «+1» за кожне сказане слово (правопис ми не перевіряємо — важлива швидкість пригадування).</p>
            <p className="bb-cream-note"><b>Чесні межі.</b><br />Це <i>вимірювальний</i> тест, а не доказ, що така вправа запобігає деменції. Тренування покращує насамперед саме пригадування слів; широкого перенесення на все мислення чи профілактики хвороб переконливо не доведено. Це проста корисна вправа, <b>не медичний тренажер</b> і не заміна обстеження.</p>
            <p><b>Підсумок.</b><br />Приємний спосіб тримати мову й памʼять у тонусі. Гарантій немає; користь дає регулярність, а не одна спроба.</p>
          </div>
        </details>

        <details style={detailsBox} className="bb-details">
          <summary style={summaryStyle}>Кому, скільки, як часто</summary>
          <div style={detailsBody}>
            <p><b>Кому підійде.</b><br />Будь-якому дорослому. Особливо приємно грати з рідними по черзі — хто назве більше. Підходить і для відновлення мовлення після стресу чи хвороби.</p>
            <p><b>Кому бути обережним.</b><br />Вправа спокійна. Якщо втомилися — просто завершіть. Гра не призначена для діагностики чи самолікування.</p>
            <p><b>Скільки за раз.</b><br />Кілька раундів по хвилині — цілком досить. Не перетворюйте на марафон.</p>
            <p><b>Як часто.</b><br />Користь дає регулярність — розумний орієнтир 3–5 разів на тиждень короткими сеансами.</p>
            <p><b>Якщо складно.</b><br />Почніть із «Легкого» (широкі теми). Допомагає подумки йти групами: свійські тварини, потім дикі, потім птахи. Паузи — це нормально.</p>
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
            <p style={{ fontFamily: 'Lora, serif', fontSize: 30, margin: '0 0 8px', color: '#B5710C' }}>Ваш результат</p>
            <p style={{ fontSize: 19, margin: '0 0 6px', color: NAVY2 }}>Ви назвали <b>{count}</b> {pluralWords(count)}</p>
            <p style={{ fontSize: 15, margin: '0 0 20px', color: '#5a534c' }}>
              {best[li] > count ? `Ваш найкращий результат: ${best[li]}. Спробуйте побити!` : 'Гарно! Наступного разу спробуйте назвати ще більше.'}
            </p>
            <button style={bigBtn} onClick={start}>Ще раз</button>
          </div>
        </div>
      )}
    </main>
  );
}

function pluralWords(n: number) {
  const a = Math.abs(n) % 100, b = n % 10;
  if (a > 10 && a < 20) return 'слів';
  if (b === 1) return 'слово';
  if (b >= 2 && b <= 4) return 'слова';
  return 'слів';
}
