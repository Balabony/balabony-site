'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Сторінка доступності /accessibility
 * Стек: Next.js App Router + власна дизайн-система balabony.com (Comfortaa/Lora/Montserrat)
 * Розташування: app/accessibility/page.tsx
 *
 * v3 — без TTS-озвучення. Залишено: налаштування шрифту, 4 теми, інклюзивні тексти.
 * TTS буде додано пізніше з власними клонованими голосами ElevenLabs.
 */

// ============================================================================
// ТИПИ
// ============================================================================
type A11yTheme = 'default' | 'dark' | 'high-contrast' | 'dyslexic';

interface A11ySettings {
  fontScale: number;
  theme: A11yTheme;
}

const DEFAULTS: A11ySettings = {
  fontScale: 1,
  theme: 'default',
};

const THEME_NAMES: Record<A11yTheme, string> = {
  'default': 'звичайна',
  'dark': 'темна',
  'high-contrast': 'високого контрасту',
  'dyslexic': 'для дислексії',
};

// ============================================================================
// КОМПОНЕНТ
// ============================================================================
export default function AccessibilityPage() {
  const [fontScale, setFontScale] = useState<number>(1);
  const [theme, setTheme] = useState<A11yTheme>('default');

  const liveRegionRef = useRef<HTMLDivElement>(null);

  // --- INIT ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('balabony_a11y');
      if (saved) {
        const s: A11ySettings = JSON.parse(saved);
        setFontScale(s.fontScale || 1);
        setTheme(s.theme || 'default');
      }
    } catch {}
  }, []);

  // --- APPLY ATTRS ---
  useEffect(() => {
    document.documentElement.setAttribute('data-a11y-theme', theme);
    document.documentElement.style.setProperty('--a11y-fs', String(fontScale));
  }, [theme, fontScale]);

  const save = (next: Partial<A11ySettings>) => {
    try {
      const settings: A11ySettings = { fontScale, theme, ...next };
      localStorage.setItem('balabony_a11y', JSON.stringify(settings));
    } catch {}
  };

  const announce = (msg: string) => {
    if (liveRegionRef.current) liveRegionRef.current.textContent = msg;
  };

  const incFont = () => {
    if (fontScale < 2) {
      const next = Math.min(2, fontScale + 0.25);
      setFontScale(next);
      save({ fontScale: next });
      announce(`Шрифт ${Math.round(next * 100)} відсотків`);
    }
  };

  const decFont = () => {
    if (fontScale > 1) {
      const next = Math.max(1, fontScale - 0.25);
      setFontScale(next);
      save({ fontScale: next });
      announce(`Шрифт ${Math.round(next * 100)} відсотків`);
    }
  };

  const applyTheme = (next: A11yTheme) => {
    setTheme(next);
    save({ theme: next });
    announce(`Тема: ${THEME_NAMES[next]}`);
  };

  const reset = () => {
    setFontScale(1);
    setTheme('default');
    save(DEFAULTS);
    announce('Налаштування скинуто');
  };

  return (
    <>
      <style jsx global>{`
        /* ====================================================== */
        /*  СТИЛІ /accessibility — узгоджені з balabony.com         */
        /* ====================================================== */

        html[data-a11y-theme="default"] .a11y-page {
          --a11y-bg: #f8fafc;
          --a11y-surface: #ffffff;
          --a11y-text: #1e293b;
          --a11y-text-muted: #64748b;
          --a11y-accent: #ef9f27;
          --a11y-accent-text: #1e293b;
          --a11y-border: #e2e8f0;
          --a11y-focus: #ef9f27;
        }
        html[data-a11y-theme="dark"] .a11y-page {
          --a11y-bg: #0f172a;
          --a11y-surface: rgba(255,255,255,0.04);
          --a11y-text: #f8fafc;
          --a11y-text-muted: #94a3b8;
          --a11y-accent: #ef9f27;
          --a11y-accent-text: #0f172a;
          --a11y-border: rgba(255,255,255,0.15);
          --a11y-focus: #ef9f27;
        }
        html[data-a11y-theme="high-contrast"] .a11y-page {
          --a11y-bg: #000000;
          --a11y-surface: #0a0a0a;
          --a11y-text: #ffffff;
          --a11y-text-muted: #ffeb3b;
          --a11y-accent: #ffeb3b;
          --a11y-accent-text: #000000;
          --a11y-border: #ffffff;
          --a11y-focus: #ffeb3b;
        }
        html[data-a11y-theme="dyslexic"] .a11y-page {
          --a11y-bg: #fdf6e3;
          --a11y-surface: #eee8d5;
          --a11y-text: #073642;
          --a11y-text-muted: #586e75;
          --a11y-accent: #b58900;
          --a11y-accent-text: #fdf6e3;
          --a11y-border: #93a1a1;
          --a11y-focus: #b58900;
        }
        html[data-a11y-theme="dyslexic"] .a11y-page,
        html[data-a11y-theme="dyslexic"] .a11y-page * {
          letter-spacing: 0.05em !important;
          word-spacing: 0.18em !important;
          line-height: 1.85 !important;
        }

        .a11y-page {
          --a11y-fs: 1;
          background: var(--a11y-bg);
          color: var(--a11y-text);
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: calc(16px * var(--a11y-fs));
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
        }

        .a11y-page h1, .a11y-page h2, .a11y-page h3 {
          font-family: 'Lora', Georgia, serif;
          color: var(--a11y-text);
          margin: 0;
        }

        .a11y-page :focus-visible {
          outline: 3px solid var(--a11y-focus);
          outline-offset: 3px;
          border-radius: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          .a11y-page *, .a11y-page *::before, .a11y-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        .a11y-skip {
          position: absolute;
          top: -100px;
          left: 0;
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          padding: 12px 24px;
          font-weight: 700;
          z-index: 999;
          transition: top 0.2s;
          text-decoration: none;
          font-family: 'Montserrat', sans-serif;
        }
        .a11y-skip:focus { top: 0; }

        .a11y-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
        }

        /* TOP BAR */
        .a11y-bar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--a11y-surface);
          border-bottom: 1px solid var(--a11y-border);
          padding: 14px 24px;
        }
        .a11y-bar-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }
        .a11y-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: var(--a11y-text);
        }
        .a11y-brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Comfortaa', sans-serif;
          font-weight: 700;
          font-size: 20px;
        }
        .a11y-brand-name {
          font-family: 'Comfortaa', sans-serif;
          font-weight: 700;
          font-size: calc(20px * var(--a11y-fs));
        }
        .a11y-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        .a11y-btn {
          background: var(--a11y-surface);
          color: var(--a11y-text);
          border: 1.5px solid var(--a11y-border);
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          transition: all 0.15s;
          cursor: pointer;
          line-height: 1;
        }
        .a11y-btn:hover:not(:disabled) {
          border-color: var(--a11y-accent);
        }
        .a11y-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .a11y-btn.is-active {
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          border-color: var(--a11y-accent);
        }
        .a11y-divider {
          width: 1px;
          height: 28px;
          background: var(--a11y-border);
          margin: 0 6px;
        }
        .a11y-scale-label {
          font-size: 13px;
          color: var(--a11y-text-muted);
          padding: 0 6px;
          min-width: 48px;
          text-align: center;
          font-variant-numeric: tabular-nums;
        }

        /* MAIN */
        .a11y-main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 24px;
        }

        /* HERO */
        .a11y-hero {
          text-align: center;
          margin-bottom: 80px;
        }
        .a11y-eyebrow {
          display: inline-block;
          padding: 8px 16px;
          margin-bottom: 24px;
          border: 1px solid var(--a11y-border);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          color: var(--a11y-text-muted);
        }
        .a11y-hero h1 {
          font-size: calc(56px * var(--a11y-fs));
          font-weight: 700;
          line-height: 1.1;
          margin-bottom: 24px;
          letter-spacing: -0.02em;
        }
        .a11y-hero h1 .accent {
          color: var(--a11y-accent);
        }
        .a11y-hero-lead {
          max-width: 720px;
          margin: 0 auto;
          font-size: calc(19px * var(--a11y-fs));
          color: var(--a11y-text-muted);
          line-height: 1.65;
        }

        /* FEATURE GRID */
        .a11y-features {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: 80px;
        }
        @media (min-width: 768px) {
          .a11y-features { grid-template-columns: repeat(3, 1fr); }
        }
        .a11y-card {
          padding: 32px;
          background: var(--a11y-surface);
          border: 1px solid var(--a11y-border);
          border-radius: 16px;
        }
        .a11y-card-icon {
          font-size: calc(48px * var(--a11y-fs));
          font-family: 'Lora', serif;
          font-weight: 700;
          color: var(--a11y-accent);
          margin-bottom: 16px;
          line-height: 1;
        }
        .a11y-card h3 {
          font-size: calc(22px * var(--a11y-fs));
          font-weight: 700;
          margin-bottom: 12px;
        }
        .a11y-card p {
          color: var(--a11y-text-muted);
          line-height: 1.65;
          margin: 0;
        }

        /* SECTION */
        .a11y-section {
          margin-bottom: 80px;
        }
        .a11y-section h2 {
          font-size: calc(38px * var(--a11y-fs));
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.01em;
        }
        .a11y-section-lead {
          font-size: calc(18px * var(--a11y-fs));
          color: var(--a11y-text-muted);
          line-height: 1.65;
          margin-bottom: 32px;
          max-width: 720px;
        }

        /* DIALOG SAMPLES (тільки тексти, без озвучки) */
        .a11y-dialog {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .a11y-row {
          padding: 22px 26px;
          background: var(--a11y-surface);
          border: 1px solid var(--a11y-border);
          border-left: 4px solid var(--a11y-accent);
          border-radius: 14px;
          transition: border-color 0.15s;
        }
        .a11y-row:hover {
          border-color: var(--a11y-accent);
        }
        .a11y-role {
          font-family: 'Lora', serif;
          font-weight: 700;
          font-size: calc(20px * var(--a11y-fs));
          color: var(--a11y-accent);
          margin-bottom: 8px;
        }
        .a11y-line {
          line-height: 1.65;
          margin: 0;
        }

        /* INCLUSION CARD */
        .a11y-inclusion {
          padding: 40px;
          background: var(--a11y-surface);
          border: 2px solid var(--a11y-accent);
          border-radius: 20px;
          margin-bottom: 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .a11y-inclusion {
            flex-direction: row;
            align-items: flex-start;
          }
        }
        .a11y-inclusion-mark {
          flex-shrink: 0;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        .a11y-inclusion h2 {
          font-size: calc(30px * var(--a11y-fs));
          margin-bottom: 14px;
        }
        .a11y-inclusion p {
          line-height: 1.65;
          margin-bottom: 14px;
          font-size: calc(17px * var(--a11y-fs));
        }
        .a11y-inclusion p:last-of-type {
          color: var(--a11y-text-muted);
        }
        .a11y-cta {
          display: inline-block;
          margin-top: 12px;
          padding: 14px 28px;
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          font-family: 'Montserrat', sans-serif;
          transition: transform 0.15s;
        }
        .a11y-cta:hover {
          transform: translateY(-2px);
        }

        /* STANDARDS */
        .a11y-standards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .a11y-standards { grid-template-columns: 1fr 1fr; }
        }
        .a11y-standard {
          padding: 24px;
          background: var(--a11y-surface);
          border: 1px solid var(--a11y-border);
          border-radius: 12px;
        }
        .a11y-standard h3 {
          font-size: calc(20px * var(--a11y-fs));
          font-weight: 700;
          margin-bottom: 10px;
        }
        .a11y-standard p {
          color: var(--a11y-text-muted);
          line-height: 1.65;
          margin: 0;
        }

        /* FEEDBACK */
        .a11y-feedback {
          text-align: center;
          padding: 56px 32px;
          background: var(--a11y-surface);
          border: 1px solid var(--a11y-border);
          border-radius: 20px;
        }
        .a11y-feedback h2 {
          font-size: calc(36px * var(--a11y-fs));
          margin-bottom: 16px;
        }
        .a11y-feedback p {
          max-width: 640px;
          margin: 0 auto 28px;
          font-size: calc(17px * var(--a11y-fs));
          color: var(--a11y-text-muted);
          line-height: 1.65;
        }
        .a11y-mail {
          display: inline-block;
          padding: 16px 32px;
          background: var(--a11y-accent);
          color: var(--a11y-accent-text);
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 18px;
          font-family: 'Montserrat', sans-serif;
          transition: transform 0.15s;
        }
        .a11y-mail:hover {
          transform: translateY(-2px);
        }

        /* FOOTER */
        .a11y-footer {
          border-top: 1px solid var(--a11y-border);
          background: var(--a11y-surface);
          padding: 32px 24px;
          margin-top: 80px;
          text-align: center;
          color: var(--a11y-text-muted);
          font-size: 14px;
          line-height: 1.6;
        }
        .a11y-footer p { margin: 4px 0; }
      `}</style>

      <div className="a11y-page">
        <a href="#a11y-main-content" className="a11y-skip">
          Перейти до основного контенту
        </a>

        <div
          ref={liveRegionRef}
          className="a11y-sr-only"
          aria-live="polite"
          aria-atomic="true"
        />

        {/* ===== ПАНЕЛЬ КЕРУВАННЯ ===== */}
        <header className="a11y-bar" role="banner">
          <div className="a11y-bar-inner">
            <a href="/" className="a11y-brand" aria-label="Балабони — головна">
              <div className="a11y-brand-mark" aria-hidden="true">Б</div>
              <span className="a11y-brand-name">Балабони</span>
            </a>

            <div className="a11y-controls" role="toolbar" aria-label="Налаштування доступності">
              <button onClick={decFont} disabled={fontScale <= 1}
                      className="a11y-btn" aria-label="Зменшити розмір шрифту">A−</button>
              <button onClick={incFont} disabled={fontScale >= 2}
                      className="a11y-btn" aria-label="Збільшити розмір шрифту">A+</button>
              <span className="a11y-scale-label" aria-live="polite" aria-atomic="true">
                {Math.round(fontScale * 100)}%
              </span>

              <div className="a11y-divider" />

              <button onClick={() => applyTheme('default')}
                      className={`a11y-btn ${theme === 'default' ? 'is-active' : ''}`}
                      aria-pressed={theme === 'default'}
                      aria-label="Звичайна тема">Звичайна</button>
              <button onClick={() => applyTheme('dark')}
                      className={`a11y-btn ${theme === 'dark' ? 'is-active' : ''}`}
                      aria-pressed={theme === 'dark'}
                      aria-label="Темна тема">Темна</button>
              <button onClick={() => applyTheme('high-contrast')}
                      className={`a11y-btn ${theme === 'high-contrast' ? 'is-active' : ''}`}
                      aria-pressed={theme === 'high-contrast'}
                      aria-label="Високий контраст">Контраст</button>
              <button onClick={() => applyTheme('dyslexic')}
                      className={`a11y-btn ${theme === 'dyslexic' ? 'is-active' : ''}`}
                      aria-pressed={theme === 'dyslexic'}
                      aria-label="Для дислексії">Дислексія</button>

              <div className="a11y-divider" />

              <button onClick={reset} className="a11y-btn" aria-label="Скинути налаштування">
                ↺ Скинути
              </button>
            </div>
          </div>
        </header>

        {/* ===== ОСНОВНИЙ КОНТЕНТ ===== */}
        <main id="a11y-main-content" className="a11y-main" role="main">

          {/* HERO */}
          <section className="a11y-hero" aria-labelledby="hero-heading">
            <div className="a11y-eyebrow">✦ Сторінка доступності проєкту «Балабони»</div>
            <h1 id="hero-heading">
              Українська мова — для кожного.<br />
              <span className="accent">Без бар&apos;єрів.</span>
            </h1>
            <p className="a11y-hero-lead">
              Серіал «Балабони» — це 60 коротких відеороликів про живу українську мову,
              доступних кожному: слабкозорим, людям зі слуховими порушеннями, з дислексією,
              учасникам бойових дій та людям з інвалідністю.
            </p>
          </section>

          {/* ФУНКЦІЇ */}
          <section className="a11y-features" aria-label="Функції доступності">
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">A↕</div>
              <h3>Налаштування шрифту</h3>
              <p>Збільшуйте текст до 200%. Шрифт залишається чітким, інтерфейс зручним. Налаштування зберігається між відвідуваннями.</p>
            </article>
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">◐</div>
              <h3>Контрастний режим</h3>
              <p>Чотири варіанти теми — звичайна, темна, високий контраст (WCAG AAA), окремий режим для людей з дислексією.</p>
            </article>
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">✎</div>
              <h3>Текстові субтитри</h3>
              <p>Усі діалоги серіалу публікуються повним текстом разом з відео. Для слабкочуючих, тих хто читає з вимкненим звуком, і для пошуку.</p>
            </article>
          </section>

          {/* ПРИКЛАДИ ДІАЛОГІВ */}
          <section className="a11y-section" aria-labelledby="dialog-heading">
            <h2 id="dialog-heading">Як виглядають субтитри</h2>
            <p className="a11y-section-lead">
              Кожен шорт серіалу «Балабони» супроводжується повним текстом діалогу.
              Ось приклад трьох реплік з пілотного шорту «Панасів вай-фай»:
            </p>

            <div className="a11y-dialog">
              <article className="a11y-row">
                <div className="a11y-role">Дід Панас</div>
                <p className="a11y-line">
                  Запишемо. Проєкт: Балабонський Вай-фай. Я вирахував, що якщо сигнал
                  пропустити через мідну котушку і заземлити на відро з солоною водою,
                  то радіус покриє навіть пасовище за річкою. Оце я вкляв!
                </p>
              </article>

              <article className="a11y-row">
                <div className="a11y-role">Баба Ганя</div>
                <p className="a11y-line">
                  Панасе! Ти б краще голову свою заземлив, поки з тієї вишні не гепнувся
                  прямо в корито до Борьки! Який там інтернет, ірод ти такий, у мене вареники
                  з вишнею вже стигнуть, пара йде, а в тебе — дріт у дупі!
                </p>
              </article>

              <article className="a11y-row">
                <div className="a11y-role">Микола-дільничний</div>
                <p className="a11y-line">
                  Панасе Петровичу, я повинен зафіксувати: ви знову встановлюєте
                  незареєстроване обладнання? Запишу: не зв&apos;язок.
                </p>
              </article>
            </div>
          </section>

          {/* ІНКЛЮЗІЯ */}
          <section className="a11y-inclusion" aria-labelledby="ubd-heading">
            <div className="a11y-inclusion-mark" aria-hidden="true">❤</div>
            <div>
              <h2 id="ubd-heading">Для учасників бойових дій і людей з інвалідністю</h2>
              <p>
                Учасники бойових дій (УБД) та люди з підтвердженою інвалідністю отримують{' '}
                <strong>довічний розширений доступ</strong> до всіх матеріалів платформи
                за символічну плату <strong>1 грн на рік</strong> — на знак вдячності і солідарності.
              </p>
              <p>
                Розширений доступ включає: усі 60 шортів у HD-якості, додаткові мовні
                картки, етимологічні довідки, повний архів сценаріїв, ранній доступ до нового матеріалу.
              </p>
              <a href="mailto:nazar@balabony.com?subject=Заявка на пільговий доступ (УБД/інвалідність)" className="a11y-cta">
                Подати заявку →
              </a>
            </div>
          </section>

          {/* СТАНДАРТИ */}
          <section className="a11y-section" aria-labelledby="wcag-heading">
            <h2 id="wcag-heading">Стандарти доступності</h2>
            <div className="a11y-standards">
              <div className="a11y-standard">
                <h3>WCAG 2.1 AAA</h3>
                <p>Платформа відповідає вимогам Web Content Accessibility Guidelines рівня AAA —
                   найвищого міжнародного стандарту доступності у режимі високого контрасту.</p>
              </div>
              <div className="a11y-standard">
                <h3>Семантичний HTML + ARIA</h3>
                <p>Кожен елемент позначено правильними ARIA-атрибутами для скрінрідерів
                   (JAWS, NVDA, VoiceOver). Навігація з клавіатури працює всюди.</p>
              </div>
              <div className="a11y-standard">
                <h3>Зменшена анімація</h3>
                <p>Платформа поважає системне налаштування prefers-reduced-motion —
                   для людей з вестибулярними розладами анімації автоматично вимикаються.</p>
              </div>
              <div className="a11y-standard">
                <h3>Збереження налаштувань</h3>
                <p>Вибір теми і розміру шрифту зберігається локально через localStorage.
                   Налаштування не передаються на сервер і не залежать від реєстрації.</p>
              </div>
            </div>
          </section>

          {/* ЗВОРОТНИЙ ЗВ'ЯЗОК */}
          <section className="a11y-feedback" aria-labelledby="feedback-heading">
            <h2 id="feedback-heading">Знайшли бар&apos;єр?</h2>
            <p>
              Доступність — це постійна робота. Якщо ви побачили щось, що працює не як треба,
              напишіть нам — виправимо протягом 48 годин.
            </p>
            <a href="mailto:nazar@balabony.com?subject=Доступність balabony.com — знайдено бар'єр" className="a11y-mail">
              nazar@balabony.com
            </a>
          </section>
        </main>

        <footer className="a11y-footer" role="contentinfo">
          <p>© 2026 «Балабони» — серіал коротких відеороликів про живу українську мову</p>
          <p>ФОП Хомин Б.І. · м. Львів · Реалізується за підтримки Мінкультури України</p>
        </footer>
      </div>
    </>
  );
}
