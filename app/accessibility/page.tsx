'use client';

import { useState, useEffect, useRef } from 'react';
import DemoAudioPlayer from '../components/DemoAudioPlayer';

/**
 * Сторінка доступності /accessibility
 *
 * 17.09.2026: переписано під ПЛАТФОРМУ, а не під серіал «Балабони».
 * Прибрано заявку про відповідність WCAG 2.1 AAA — аудиту не було, і одна
 * знайдена невідповідність коштує дорожче, ніж уся сторінка дає; натомість
 * перелічено зроблене. Прибрано обіцянку «виправимо протягом 48 годин».
 * Аудіо подано як те, чого ще немає (запуск 23.11.2026), демоплеєр лишено
 * з підписом «не фінальний голос».
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
    document.documentElement.style.setProperty('--site-zoom', String(fontScale));
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
          --a11y-accent-on-surface: #a05f00;
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
          --a11y-accent-on-surface: #ef9f27;
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
          --a11y-accent-on-surface: #ffeb3b;
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
          --a11y-accent-on-surface: #7d5c00;
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
          padding: 56px 24px 24px;
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
          color: var(--a11y-accent-on-surface);
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
          color: var(--a11y-accent-on-surface);
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
          color: var(--a11y-accent-on-surface);
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
          margin-top: 0;
          text-align: center;
          color: var(--a11y-text-muted);
          font-size: 14px;
          line-height: 1.6;
        }
        .a11y-footer p { margin: 4px 0; }

        /* Адаптив: заголовки й email не вилазять за екран на мобільному */
        .a11y-hero h1,
        .a11y-section h2,
        .a11y-inclusion h2,
        .a11y-feedback h2 {
          overflow-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        .a11y-mail {
          max-width: 100%;
          box-sizing: border-box;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        @media (max-width: 600px) {
          .a11y-hero h1 { font-size: calc(32px * var(--a11y-fs)); }
          .a11y-section h2 { font-size: calc(24px * var(--a11y-fs)); }
          .a11y-inclusion h2 { font-size: calc(23px * var(--a11y-fs)); }
          .a11y-feedback h2 { font-size: calc(26px * var(--a11y-fs)); }
          .a11y-mail { font-size: 15px; padding: 14px 18px; }
        }
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
            <div className="a11y-eyebrow">✦ Доступність платформи Balabony</div>
            <h1 id="hero-heading">
              Слабкий зір, дислексія, вік — не причина<br />
              <span className="accent">не читати.</span>
            </h1>
            <p className="a11y-hero-lead">
              Balabony — це понад 990 історій, казок і серій від понад ста українських авторів.
              Ми робимо їх доступними для тих, кому звичайний сайт читати важко: людям зі слабким
              зором, із дислексією, старшим читачам, ветеранам і внутрішньо переміщеним особам.
            </p>
          </section>

          {/* ФУНКЦІЇ */}
          <section className="a11y-features" aria-label="Функції доступності">
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">A↕</div>
              <h3>Налаштування шрифту</h3>
              <p>Збільшуйте текст до 200%. Разом із розміром змінюється весь інтерфейс, а не лише абзац. Вибір зберігається у вашому браузері й діє при наступних відвідинах.</p>
            </article>
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">◐</div>
              <h3>Чотири теми</h3>
              <p>Звичайна, темна, високий контраст і окремий режим для дислексії — зі збільшеними міжлітерним і міжслівним інтервалами та вищим рядком.</p>
            </article>
            <article className="a11y-card">
              <div className="a11y-card-icon" aria-hidden="true">✎</div>
              <h3>Читалка під себе</h3>
              <p>У кожному творі можна вибрати шрифт, один із п&apos;яти розмірів і денний або нічний режим. Місце, де ви зупинилися, зберігається — сайт відкриє текст там, де ви його лишили.</p>
            </article>
          </section>

          {/* ПРИКЛАДИ ДІАЛОГІВ */}
          <section className="a11y-section" aria-labelledby="dialog-heading">
            <h2 id="dialog-heading">Як виглядає текст твору</h2>
            <p className="a11y-section-lead">
              На платформі два серіали й архів авторських творів. Ось як виглядає діалог
              у серії «Балабонів» — родинній комедії про життя села:
            </p>

            {/* ІЛЮСТРАЦІЯ ГЕРОЯ (додано) */}
            <figure style={{ margin: '14px 0 18px', textAlign: 'center' }}>
              <img
                src="/images/panas.webp"
                alt="Літній чоловік у вишиванці та безрукавці з книгою в руках, усміхнений, на тлі української хати з мальованими віконницями"
                loading="lazy"
                style={{ width: '100%', maxWidth: 360, height: 'auto', borderRadius: 14, border: '1px solid rgba(239,159,39,0.4)' }}
              />
              <figcaption style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                Дід Панас — герой серіалу «Балабони» (ілюстрація)
              </figcaption>
            </figure>

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

          {/* АУДІО — чесно про стан */}
          <section className="a11y-section" aria-labelledby="audio-heading">
            <h2 id="audio-heading">Аудіо: що є і чого ще немає</h2>
            <p className="a11y-section-lead">
              Зараз Balabony — це текст. Озвучення ми готуємо й запускаємо разом із платформою
              23 листопада 2026 року. Поки його немає, ми не пишемо, що воно є.
            </p>
            <p className="a11y-section-lead">
              До того часу тексти працюють із програмами екранного читання: JAWS, NVDA, VoiceOver
              і вбудованим озвученням Android та iOS.
            </p>

            <div style={{ margin: '20px 0 4px' }}>
              <DemoAudioPlayer
                src="/audio/balabony_seria1_demo.mp3"
                badge="Демо · не фінальний голос"
                caption="Так звучить пробне озвучення — голос ще змінюватиметься:"
                title="Демо озвучення серії Балабони"
              />
            </div>
          </section>

          {/* ІНКЛЮЗІЯ */}
          <section className="a11y-inclusion" aria-labelledby="ubd-heading">
            <div className="a11y-inclusion-mark" aria-hidden="true">❤</div>
            <div>
              <h2 id="ubd-heading">Для ветеранів, людей з інвалідністю та ВПО</h2>
              <p>
                Учасники бойових дій, люди з інвалідністю та внутрішньо переміщені особи
                отримують <strong>повний доступ до платформи за 1 гривню на рік</strong>.
              </p>
              <p>
                Статус підтверджується за кілька секунд через «Дію» — довідок надсилати не треба,
                документи ми не зберігаємо.
              </p>
              <a href="/peredplata" className="a11y-cta">
                Підтвердити статус через «Дію» →
              </a>
            </div>
          </section>

          {/* СТАНДАРТИ */}
          <section className="a11y-section" aria-labelledby="wcag-heading">
            <h2 id="wcag-heading">Стандарти доступності</h2>
            <div className="a11y-standards">
              <div className="a11y-standard">
                <h3>Що ми зробили</h3>
                <p>Семантична розмітка й ARIA-атрибути, навігація з клавіатури, видимий фокус,
                   посилання «Перейти до основного контенту», контрастні поєднання кольорів
                   у всіх чотирьох темах.</p>
              </div>
              <div className="a11y-standard">
                <h3>Скрінрідери</h3>
                <p>Сторінки перевіряємо з NVDA і VoiceOver. Кожне зображення має текстовий опис,
                   кнопки підписані словами, а не значками.</p>
              </div>
              <div className="a11y-standard">
                <h3>Зменшена анімація</h3>
                <p>Сайт поважає системне налаштування prefers-reduced-motion: якщо воно ввімкнене,
                   анімації вимикаються — для людей із вестибулярними розладами.</p>
              </div>
              <div className="a11y-standard">
                <h3>Налаштування лишаються у вас</h3>
                <p>Тема й розмір шрифту зберігаються локально у вашому браузері. На сервер вони
                   не передаються, реєстрація не потрібна.</p>
              </div>
            </div>
          </section>

          {/* ЗВОРОТНИЙ ЗВ'ЯЗОК */}
          <section className="a11y-feedback" aria-labelledby="feedback-heading">
            <h2 id="feedback-heading">Знайшли бар&apos;єр?</h2>
            <p>
              Доступність — це робота без кінця, і ми точно щось пропустили. Напишіть,
              що саме не працює, — відповімо і скажемо, коли виправимо.
            </p>
            <a href="mailto:nazar@balabony.com?subject=Доступність balabony.com — знайдено бар'єр" className="a11y-mail">
              nazar@balabony.com
            </a>
          </section>
        </main>

        <footer className="a11y-footer" role="contentinfo">
          <p>© 2026 Balabony — українські історії, казки й серіали</p>
          <p>Львівська обласна громадська організація «Інститут громадянського суспільства», м. Львів</p>
        </footer>
      </div>
    </>
  );
}
