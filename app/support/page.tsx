'use client';

import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * Сторінка підтримки /support — v3
 * Розташування: app/support/page.tsx
 *
 * Зміни v3 vs v2:
 *  - Назва ГО в UA: «ЛОГО „Інститут громадянського суспільства"» (коротка)
 *  - Темний фон як на головній сайту (#0f172a) у дефолтній темі
 *  - Збільшений базовий розмір шрифту (17-18px)
 *  - QR-код для швидкого переказу (на UA для UAH; для EN/DE для USD/EUR)
 *  - В EN/DE прибрано переклад назви ГО в дужках, залишена тільки транслітерація
 */

// ============================================================================
// ТИПИ І КОНСТАНТИ
// ============================================================================
type Lang = 'ua' | 'en' | 'de';
type Theme = 'default' | 'dark' | 'high-contrast' | 'dyslexic';
type Currency = 'UAH' | 'USD' | 'EUR';

interface AccountInfo {
  currency: Currency;
  iban: string;
  type: string;
  symbol: string;
}

interface SupportSettings {
  fontScale: number;
  theme: Theme;
  lang: Lang;
}

const ACCOUNTS: AccountInfo[] = [
  { currency: 'UAH', iban: 'UA213052990000026004011046438', type: 'Поточний', symbol: '₴' },
  { currency: 'USD', iban: 'UA103052990000026035031007697', type: 'Розподільчий', symbol: '$' },
  { currency: 'EUR', iban: 'UA663052990000026039031009657', type: 'Розподільчий', symbol: '€' },
];

const ORG_NAME_UA = 'ЛОГО „Інститут громадянського суспільства"';
const ORG_NAME_UA_FULL = 'ГО «Львівська обласна громадська організація „Інститут громадянського суспільства"»';
const ORG_NAME_TRANS = 'Lvivska Oblasna Hromadska Orhanizatsiya "Instytut Hromadyanskoho Suspilstva"';
const EDRPOU = '33951844';
const BANK = 'АТ КБ «ПриватБанк»';
const BANK_EN = 'JSC CB "PrivatBank", Ukraine';
const BANK_CODE = '305299';
const BRANCH_ADDR_EN = '25-Ye Hetman Mazepa St., Lviv 79059, Ukraine';
const SWIFT = 'PBANUA2X';
const PURPOSE_UA = 'Благодійний внесок на статутну діяльність ЛОГО „Інститут громадянського суспільства". Без ПДВ.';
const PURPOSE_EN = 'Charitable contribution to support the statutory activities of Instytut Hromadyanskoho Suspilstva — accessibility and inclusion development.';
const CONTACT_EMAIL = 'nazar@balabony.com';

const DEFAULTS: SupportSettings = {
  fontScale: 1,
  theme: 'default',
  lang: 'ua',
};

// ============================================================================
// ГЕНЕРАЦІЯ QR-РЯДКА
// ============================================================================
/**
 * EPC QR Code (SEPA) — формат European Payments Council для миттєвих переказів.
 * Працює у всіх банківських додатках Європи. Українські банки (Приват, Моно)
 * також сканують і автоматично заповнюють реквізити.
 *
 * Документація: https://en.wikipedia.org/wiki/EPC_QR_code
 */
function buildEpcQr(opts: {
  beneficiary: string;
  iban: string;
  amount?: number;
  currency?: string;
  purpose: string;
}): string {
  const { beneficiary, iban, amount, currency = 'EUR', purpose } = opts;
  const lines = [
    'BCD',                      // Service tag
    '002',                      // Version
    '1',                        // Character set: 1 = UTF-8
    'SCT',                      // Identification: SEPA Credit Transfer
    SWIFT,                      // BIC (SWIFT)
    beneficiary.slice(0, 70),   // Name (max 70 chars)
    iban,                       // IBAN
    amount ? `${currency}${amount.toFixed(2)}` : '',  // Amount (optional)
    '',                         // Purpose code (empty)
    '',                         // Remittance reference (empty)
    purpose.slice(0, 140),      // Remittance info (max 140 chars)
  ];
  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================
export default function SupportPage() {
  const [fontScale, setFontScale] = useState<number>(1);
  const [theme, setTheme] = useState<Theme>('default');
  const [lang, setLang] = useState<Lang>('ua');
  const [activeCurrency, setActiveCurrency] = useState<Currency>('UAH');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  const liveRegionRef = useRef<HTMLDivElement>(null);

  const activeAccount = ACCOUNTS.find(a => a.currency === activeCurrency)!;

  // INIT
  useEffect(() => {
    try {
      // Priority: URL parameter ?lang=en/de > localStorage > default 'ua'
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      let initialLang: Lang = 'ua';

      if (urlLang === 'en' || urlLang === 'de' || urlLang === 'ua') {
        initialLang = urlLang as Lang;
      }

      const saved = localStorage.getItem('balabony_support');
      if (saved) {
        const s: SupportSettings = JSON.parse(saved);
        setFontScale(s.fontScale || 1);
        setTheme(s.theme || 'default');
        // URL param has priority over saved lang
        setLang(urlLang ? initialLang : (s.lang || 'ua'));
      } else {
        setLang(initialLang);
      }
    } catch {}
  }, []);

  // APPLY ATTRS
  useEffect(() => {
    document.documentElement.setAttribute('data-support-theme', theme);
    document.documentElement.style.setProperty('--support-fs', String(fontScale));
  }, [theme, fontScale]);

  const save = (next: Partial<SupportSettings>) => {
    try {
      const settings: SupportSettings = { fontScale, theme, lang, ...next };
      localStorage.setItem('balabony_support', JSON.stringify(settings));
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
    }
  };

  const decFont = () => {
    if (fontScale > 1) {
      const next = Math.max(1, fontScale - 0.25);
      setFontScale(next);
      save({ fontScale: next });
    }
  };

  const applyTheme = (next: Theme) => { setTheme(next); save({ theme: next }); };
  const applyLang = (next: Lang) => {
    setLang(next); save({ lang: next });
    announce(next === 'en' ? 'English' : next === 'de' ? 'Deutsch' : 'Українська');
  };
  const reset = () => {
    setFontScale(1); setTheme('default');
    save({ fontScale: 1, theme: 'default' });
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.warn('Не вдалось скопіювати');
    }
  };

  // i18n
  const T = {
    ua: { reset: 'Скинути', skip: 'Перейти до основного контенту' },
    en: { reset: 'Reset', skip: 'Skip to main content' },
    de: { reset: 'Zurücksetzen', skip: 'Zum Hauptinhalt springen' },
  }[lang];

  const themeNamesByLang = {
    ua: { default: 'Звичайна', dark: 'Темна', 'high-contrast': 'Контраст', dyslexic: 'Дислексія' },
    en: { default: 'Default', dark: 'Dark', 'high-contrast': 'High Contrast', dyslexic: 'Dyslexia' },
    de: { default: 'Standard', dark: 'Dunkel', 'high-contrast': 'Hoher Kontrast', dyslexic: 'Legasthenie' },
  };

  // Full bank details for copying
  const fullDetailsByLang = {
    ua: `Отримувач: ${ORG_NAME_UA_FULL}
ЄДРПОУ: ${EDRPOU}
IBAN: ${activeAccount.iban}
Банк: ${BANK} (МФО ${BANK_CODE})
SWIFT: ${SWIFT}
Призначення: ${PURPOSE_UA}`,
    en: `Beneficiary: ${ORG_NAME_TRANS}
USREOU: ${EDRPOU}
IBAN: ${activeAccount.iban}
Bank: ${BANK_EN}
SWIFT: ${SWIFT}
Branch: ${BRANCH_ADDR_EN}
Payment purpose: ${PURPOSE_EN}`,
    de: `Begünstigter: ${ORG_NAME_TRANS}
EDRPOU: ${EDRPOU}
IBAN: ${activeAccount.iban}
Bank: ${BANK_EN}
SWIFT: ${SWIFT}
Filiale: ${BRANCH_ADDR_EN}
Verwendungszweck: ${PURPOSE_EN}`,
  };

  // QR-code string
  const qrString = buildEpcQr({
    beneficiary: ORG_NAME_TRANS,
    iban: activeAccount.iban,
    amount: selectedAmount || (customAmount ? parseFloat(customAmount) : undefined),
    currency: activeAccount.currency,
    purpose: lang === 'ua' ? PURPOSE_UA : PURPOSE_EN,
  });

  return (
    <>
      <style jsx global>{`
        /* ====================================================== */
        /*  THEMES (default = dark like main site)                  */
        /* ====================================================== */

        /* DEFAULT — темний як на головній сайту */
        html[data-support-theme="default"] .support-page {
          --sup-bg: #0f172a;
          --sup-bg-2: #131c33;
          --sup-surface: rgba(255,255,255,0.05);
          --sup-surface-2: rgba(255,255,255,0.08);
          --sup-text: #f1f5f9;
          --sup-text-muted: #94a3b8;
          --sup-accent: #ef9f27;
          --sup-accent-dark: #d18a1f;
          --sup-accent-text: #0f172a;
          --sup-border: rgba(255,255,255,0.12);
          --sup-success: #10b981;
          --sup-warn-bg: rgba(255, 193, 7, 0.08);
          --sup-warn-border: rgba(255, 193, 7, 0.4);
          --sup-warn-text: #ffd54f;
          --sup-focus: #ef9f27;
        }
        /* DARK — ще темніший */
        html[data-support-theme="dark"] .support-page {
          --sup-bg: #000000;
          --sup-bg-2: #0a0a0a;
          --sup-surface: rgba(255,255,255,0.04);
          --sup-surface-2: rgba(255,255,255,0.07);
          --sup-text: #f8fafc;
          --sup-text-muted: #cbd5e1;
          --sup-accent: #ef9f27;
          --sup-accent-dark: #d18a1f;
          --sup-accent-text: #000000;
          --sup-border: rgba(255,255,255,0.15);
          --sup-success: #10b981;
          --sup-warn-bg: rgba(255, 193, 7, 0.08);
          --sup-warn-border: rgba(255, 193, 7, 0.4);
          --sup-warn-text: #ffd54f;
          --sup-focus: #ef9f27;
        }
        html[data-support-theme="high-contrast"] .support-page {
          --sup-bg: #000000;
          --sup-bg-2: #0a0a0a;
          --sup-surface: #0a0a0a;
          --sup-surface-2: #1a1a1a;
          --sup-text: #ffffff;
          --sup-text-muted: #ffeb3b;
          --sup-accent: #ffeb3b;
          --sup-accent-dark: #fff176;
          --sup-accent-text: #000000;
          --sup-border: #ffffff;
          --sup-success: #00ff00;
          --sup-warn-bg: #1a1a00;
          --sup-warn-border: #ffeb3b;
          --sup-warn-text: #ffeb3b;
          --sup-focus: #ffeb3b;
        }
        html[data-support-theme="dyslexic"] .support-page {
          --sup-bg: #fdf6e3;
          --sup-bg-2: #f7f0d8;
          --sup-surface: #eee8d5;
          --sup-surface-2: #e4dec3;
          --sup-text: #073642;
          --sup-text-muted: #586e75;
          --sup-accent: #b58900;
          --sup-accent-dark: #93701c;
          --sup-accent-text: #fdf6e3;
          --sup-border: #93a1a1;
          --sup-success: #859900;
          --sup-warn-bg: #fdf6e3;
          --sup-warn-border: #cb4b16;
          --sup-warn-text: #cb4b16;
          --sup-focus: #b58900;
        }
        html[data-support-theme="dyslexic"] .support-page,
        html[data-support-theme="dyslexic"] .support-page * {
          letter-spacing: 0.05em !important;
          word-spacing: 0.18em !important;
          line-height: 1.85 !important;
        }

        /* BASE */
        .support-page {
          --support-fs: 1;
          background: var(--sup-bg);
          color: var(--sup-text);
          font-family: 'Montserrat', system-ui, sans-serif;
          font-size: calc(18px * var(--support-fs));
          min-height: 100vh;
          transition: background 0.3s, color 0.3s;
        }
        .support-page h1, .support-page h2, .support-page h3 {
          font-family: 'Lora', Georgia, serif;
          color: var(--sup-text);
          margin: 0;
        }
        .support-page :focus-visible {
          outline: 3px solid var(--sup-focus);
          outline-offset: 3px;
          border-radius: 6px;
        }
        @media (prefers-reduced-motion: reduce) {
          .support-page *, .support-page *::before, .support-page *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* SKIP & SR */
        .sup-skip {
          position: absolute;
          top: -100px; left: 0;
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          padding: 14px 26px;
          font-weight: 700; font-size: 15px;
          z-index: 999;
          transition: top 0.2s;
          text-decoration: none;
        }
        .sup-skip:focus { top: 0; }
        .sup-sr-only {
          position: absolute;
          width: 1px; height: 1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
        }

        /* TOOLBAR */
        .sup-toolbar {
          position: sticky; top: 0; z-index: 50;
          background: var(--sup-bg-2);
          border-bottom: 1px solid var(--sup-border);
          padding: 14px 22px;
          backdrop-filter: blur(8px);
        }
        .sup-toolbar-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; flex-wrap: wrap;
          align-items: center; justify-content: space-between;
          gap: 14px;
        }
        .sup-brand {
          display: flex; align-items: center; gap: 12px;
          text-decoration: none; color: var(--sup-text);
        }
        .sup-brand-mark {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Comfortaa', sans-serif;
          font-weight: 700; font-size: 20px;
        }
        .sup-brand-name {
          font-family: 'Comfortaa', sans-serif;
          font-weight: 700;
          font-size: calc(20px * var(--support-fs));
        }
        .sup-toolbar-groups {
          display: flex; flex-wrap: wrap; align-items: center; gap: 4px;
        }
        .sup-toolbar-group {
          display: flex; align-items: center; gap: 4px;
        }
        .sup-toolbar-divider {
          width: 1px; height: 28px;
          background: var(--sup-border);
          margin: 0 6px;
        }
        .sup-tb-btn {
          background: var(--sup-surface);
          color: var(--sup-text);
          border: 1.5px solid var(--sup-border);
          padding: 8px 14px;
          border-radius: 8px;
          font-weight: 600; font-size: 14px;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          line-height: 1;
        }
        .sup-tb-btn:hover:not(:disabled) {
          border-color: var(--sup-accent);
          background: var(--sup-surface-2);
        }
        .sup-tb-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .sup-tb-btn.is-active {
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          border-color: var(--sup-accent);
        }
        .sup-scale-label {
          font-size: 13px;
          color: var(--sup-text-muted);
          padding: 0 6px;
          min-width: 48px; text-align: center;
          font-variant-numeric: tabular-nums;
        }

        /* HERO */
        .sup-hero {
          max-width: 900px; margin: 0 auto;
          padding: 70px 24px 48px;
          text-align: center;
        }
        .sup-hero-mark {
          display: inline-flex;
          align-items: center; justify-content: center;
          width: 72px; height: 72px;
          background: rgba(239, 68, 68, 0.15);
          border-radius: 50%;
          margin-bottom: 24px;
          font-size: 32px;
        }
        .sup-hero h1 {
          font-size: calc(44px * var(--support-fs));
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 22px;
        }
        .sup-hero h1 .accent { color: var(--sup-accent); }
        .sup-hero-lead {
          font-size: calc(19px * var(--support-fs));
          color: var(--sup-text-muted);
          line-height: 1.7;
          max-width: 720px; margin: 0 auto;
        }
        .sup-hero-lead strong { color: var(--sup-text); }

        .sup-container {
          max-width: 900px; margin: 0 auto;
          padding: 0 24px;
        }

        /* WARN */
        .sup-warn {
          padding: 24px 28px;
          background: var(--sup-warn-bg);
          border: 1.5px solid var(--sup-warn-border);
          border-radius: 14px;
          margin-bottom: 44px;
          display: flex; gap: 18px;
          align-items: flex-start;
        }
        .sup-warn-icon {
          flex-shrink: 0; font-size: 30px; line-height: 1;
        }
        .sup-warn-content { flex: 1; }
        .sup-warn-title {
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--sup-warn-text);
          font-size: calc(17px * var(--support-fs));
        }
        .sup-warn-text {
          color: var(--sup-warn-text);
          line-height: 1.65;
          font-size: calc(15px * var(--support-fs));
          margin: 0;
        }

        /* MISSION */
        .sup-mission {
          padding: 32px;
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-left: 4px solid var(--sup-accent);
          border-radius: 14px;
          margin-bottom: 52px;
        }
        .sup-mission h2 {
          font-size: calc(26px * var(--support-fs));
          font-weight: 700;
          margin-bottom: 18px;
        }
        .sup-mission ul {
          margin: 0;
          padding: 0 0 0 24px;
          color: var(--sup-text-muted);
          line-height: 1.75;
        }
        .sup-mission li {
          margin-bottom: 10px;
          font-size: calc(16px * var(--support-fs));
        }
        .sup-mission li strong { color: var(--sup-text); }

        /* SECTION */
        .sup-section { margin-bottom: 52px; }
        .sup-section h2 {
          font-size: calc(30px * var(--support-fs));
          font-weight: 700;
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .sup-section-lead {
          font-size: calc(16px * var(--support-fs));
          color: var(--sup-text-muted);
          line-height: 1.65;
          margin-bottom: 26px;
        }
        .sup-section-lead p { margin: 0 0 12px 0; }
        .sup-section-lead p:last-child { margin-bottom: 0; }

        /* TABS */
        .sup-tabs {
          display: flex; gap: 8px;
          margin-bottom: 22px;
          flex-wrap: wrap;
        }
        .sup-tab {
          padding: 12px 20px;
          background: var(--sup-surface);
          color: var(--sup-text);
          border: 1.5px solid var(--sup-border);
          border-radius: 10px;
          font-weight: 600; font-size: 15px;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          display: flex; align-items: center; gap: 8px;
        }
        .sup-tab:hover { border-color: var(--sup-accent); }
        .sup-tab.is-active {
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          border-color: var(--sup-accent);
        }

        /* DETAILS */
        .sup-details {
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        .sup-row {
          display: flex; flex-direction: column;
          gap: 6px;
          padding: 18px 24px;
          border-bottom: 1px solid var(--sup-border);
        }
        .sup-row:last-child { border-bottom: 0; }
        @media (min-width: 640px) {
          .sup-row { flex-direction: row; align-items: center; gap: 18px; }
        }
        .sup-row-label {
          font-size: 13px;
          color: var(--sup-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          flex-shrink: 0;
          min-width: 140px;
        }
        .sup-row-value {
          flex: 1;
          font-size: calc(15px * var(--support-fs));
          word-break: break-all;
          line-height: 1.5;
        }
        .sup-row-value.is-mono {
          font-family: ui-monospace, 'SF Mono', Consolas, monospace;
          font-weight: 600;
        }
        .sup-copy-btn {
          background: transparent;
          color: var(--sup-accent);
          border: 1.5px solid var(--sup-accent);
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px; font-weight: 600;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .sup-copy-btn:hover {
          background: var(--sup-accent);
          color: var(--sup-accent-text);
        }
        .sup-copy-btn.is-copied {
          background: var(--sup-success);
          color: white;
          border-color: var(--sup-success);
        }
        .sup-copy-all {
          margin-top: 10px;
          padding: 15px 26px;
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          border: 0;
          border-radius: 11px;
          font-size: calc(16px * var(--support-fs));
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
          width: 100%;
        }
        .sup-copy-all:hover { background: var(--sup-accent-dark); }
        .sup-copy-all.is-copied {
          background: var(--sup-success);
          color: white;
        }

        /* QR */
        .sup-qr-section {
          margin-top: 30px;
          padding: 28px;
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-radius: 14px;
        }
        .sup-qr-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          align-items: center;
        }
        @media (min-width: 640px) {
          .sup-qr-grid { grid-template-columns: auto 1fr; }
        }
        .sup-qr-box {
          background: white;
          padding: 18px;
          border-radius: 12px;
          width: 232px; height: 232px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto;
        }
        .sup-qr-text h3 {
          font-size: calc(22px * var(--support-fs));
          font-weight: 700;
          margin-bottom: 10px;
        }
        .sup-qr-text p {
          color: var(--sup-text-muted);
          line-height: 1.65;
          font-size: calc(15px * var(--support-fs));
          margin: 0 0 10px 0;
        }
        .sup-qr-amount {
          display: inline-block;
          margin-top: 6px;
          padding: 6px 14px;
          background: rgba(239, 159, 39, 0.15);
          border: 1.5px solid var(--sup-accent);
          border-radius: 8px;
          font-weight: 700;
          color: var(--sup-accent);
          font-size: 15px;
        }

        /* BANK ACTION BUTTONS (UA) */
        .sup-bank-actions {
          margin-top: 30px;
          padding: 28px;
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-radius: 14px;
        }
        .sup-bank-actions-title {
          font-size: calc(22px * var(--support-fs));
          font-weight: 700;
          margin-bottom: 10px;
        }
        .sup-bank-actions-lead {
          color: var(--sup-text-muted);
          line-height: 1.65;
          font-size: calc(15px * var(--support-fs));
          margin: 0 0 20px 0;
        }
        .sup-bank-actions-lead strong { color: var(--sup-accent); }
        .sup-bank-actions-note {
          color: var(--sup-text-muted);
          line-height: 1.6;
          font-size: calc(13px * var(--support-fs));
          margin: 16px 0 0 0;
        }
        .sup-bank-buttons {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .sup-bank-btn {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 22px;
          background: var(--sup-bg-2);
          border: 2px solid var(--sup-border);
          border-radius: 12px;
          text-decoration: none;
          color: var(--sup-text);
          transition: all 0.2s;
          cursor: pointer;
        }
        .sup-bank-btn:hover {
          border-color: var(--sup-accent);
          transform: translateY(-2px);
          background: var(--sup-surface-2);
        }
        .sup-bank-privat:hover { border-color: #007a3d; }
        .sup-bank-mono:hover { border-color: #000000; }
        .sup-bank-btn-icon {
          font-size: 30px;
          line-height: 1;
          flex-shrink: 0;
        }
        .sup-bank-btn-text {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
        }
        .sup-bank-btn-text strong {
          font-size: calc(16px * var(--support-fs));
          font-weight: 700;
          color: var(--sup-text);
        }
        .sup-bank-btn-text span {
          font-size: 13px;
          color: var(--sup-accent);
          font-weight: 600;
        }

        /* AMOUNTS */
        .sup-amounts {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        @media (min-width: 640px) {
          .sup-amounts { grid-template-columns: repeat(4, 1fr); }
        }
        .sup-amount {
          padding: 18px 12px;
          background: var(--sup-surface);
          border: 1.5px solid var(--sup-border);
          border-radius: 12px;
          font-family: 'Lora', serif;
          font-weight: 700;
          font-size: calc(22px * var(--support-fs));
          color: var(--sup-text);
          cursor: pointer;
          transition: all 0.15s;
          text-align: center;
        }
        .sup-amount:hover {
          border-color: var(--sup-accent);
          transform: translateY(-2px);
        }
        .sup-amount.is-selected {
          background: var(--sup-accent);
          color: var(--sup-accent-text);
          border-color: var(--sup-accent);
        }
        .sup-amount-note {
          font-size: 13px;
          color: var(--sup-text-muted);
          font-family: 'Montserrat', sans-serif;
          font-weight: 500;
          display: block;
          margin-top: 6px;
        }
        .sup-amount.is-selected .sup-amount-note {
          color: var(--sup-accent-text);
          opacity: 0.85;
        }

        .sup-custom {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          padding: 20px 24px;
          background: var(--sup-surface);
          border: 1.5px dashed var(--sup-border);
          border-radius: 12px;
          margin-bottom: 14px;
        }
        .sup-custom-label {
          font-weight: 700;
          font-size: calc(16px * var(--support-fs));
          color: var(--sup-text);
        }
        .sup-custom-input {
          flex: 1;
          min-width: 120px;
          padding: 11px 16px;
          font-family: 'Montserrat', sans-serif;
          font-size: 17px;
          font-weight: 600;
          background: var(--sup-bg-2);
          color: var(--sup-text);
          border: 1.5px solid var(--sup-border);
          border-radius: 8px;
        }
        .sup-custom-input:focus {
          border-color: var(--sup-accent);
        }
        .sup-custom-currency {
          font-weight: 700;
          font-size: 18px;
          color: var(--sup-accent);
          margin-left: -8px;
        }

        /* FAQ */
        .sup-faq-item {
          padding: 22px 26px;
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-radius: 11px;
          margin-bottom: 12px;
        }
        .sup-faq-item h3 {
          font-size: calc(17px * var(--support-fs));
          font-weight: 700;
          margin-bottom: 12px;
        }
        .sup-faq-item p {
          color: var(--sup-text-muted);
          line-height: 1.7;
          margin: 0 0 10px 0;
          font-size: calc(15px * var(--support-fs));
        }
        .sup-faq-item p:last-child { margin-bottom: 0; }
        .sup-faq-item ol, .sup-faq-item ul {
          margin: 10px 0;
          padding-left: 24px;
          color: var(--sup-text-muted);
          line-height: 1.7;
          font-size: calc(15px * var(--support-fs));
        }
        .sup-faq-item li { margin-bottom: 8px; }
        .sup-faq-item strong { color: var(--sup-text); }

        /* INTL APPEAL */
        .sup-intl {
          padding: 36px;
          background: var(--sup-surface);
          border: 1.5px solid var(--sup-accent);
          border-radius: 16px;
          margin-bottom: 52px;
        }
        .sup-intl h2 {
          font-size: calc(28px * var(--support-fs));
          margin-bottom: 8px;
        }
        .sup-intl-sub {
          font-style: italic;
          color: var(--sup-text-muted);
          margin-bottom: 24px;
          font-size: calc(16px * var(--support-fs));
        }
        .sup-intl h3 {
          font-size: calc(20px * var(--support-fs));
          font-weight: 700;
          margin-top: 28px;
          margin-bottom: 12px;
        }
        .sup-intl p {
          color: var(--sup-text);
          line-height: 1.7;
          margin: 0 0 14px 0;
          font-size: calc(16px * var(--support-fs));
        }
        .sup-intl ul {
          margin: 0 0 14px 0;
          padding-left: 24px;
          color: var(--sup-text);
          line-height: 1.75;
          font-size: calc(15px * var(--support-fs));
        }
        .sup-intl li { margin-bottom: 8px; }
        .sup-intl li strong { color: var(--sup-text); }
        .sup-intl-bank {
          background: var(--sup-bg-2);
          border: 1px solid var(--sup-border);
          border-radius: 10px;
          padding: 20px 24px;
          margin-top: 14px;
          font-family: ui-monospace, 'SF Mono', Consolas, monospace;
          font-size: calc(14px * var(--support-fs));
          line-height: 1.75;
        }
        .sup-intl-bank strong {
          font-family: 'Montserrat', sans-serif;
          color: var(--sup-text-muted);
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: inline-block;
          min-width: 110px;
        }
        .sup-intl-qr {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }
        .sup-intl-qr-box {
          background: white;
          padding: 14px;
          border-radius: 10px;
          flex-shrink: 0;
        }
        .sup-intl-qr-text {
          flex: 1;
          min-width: 200px;
        }
        .sup-intl-qr-text p {
          margin: 0;
          font-size: calc(14px * var(--support-fs));
        }
        .sup-intl-signature {
          margin-top: 26px;
          padding-top: 22px;
          border-top: 1px solid var(--sup-border);
          font-style: italic;
          color: var(--sup-text-muted);
          line-height: 1.75;
          font-size: calc(14px * var(--support-fs));
        }

        /* BACK */
        .sup-back {
          padding: 36px;
          background: var(--sup-surface);
          border: 1px solid var(--sup-border);
          border-radius: 14px;
          text-align: center;
          margin-bottom: 60px;
        }
        .sup-back a {
          display: inline-block;
          padding: 12px 28px;
          background: var(--sup-text);
          color: var(--sup-bg);
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: calc(15px * var(--support-fs));
        }

        /* TOAST */
        .sup-toast {
          position: fixed;
          bottom: 28px; left: 50%;
          transform: translateX(-50%);
          background: var(--sup-success);
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          z-index: 100;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
      `}</style>

      <div className="support-page">
        <a href="#sup-main" className="sup-skip">{T.skip}</a>
        <div ref={liveRegionRef} className="sup-sr-only" aria-live="polite" aria-atomic="true" />

        {/* TOOLBAR */}
        <header className="sup-toolbar" role="banner">
          <div className="sup-toolbar-inner">
            <a href="/" className="sup-brand" aria-label="Балабони">
              <div className="sup-brand-mark" aria-hidden="true">Б</div>
              <span className="sup-brand-name">Балабони</span>
            </a>

            <div className="sup-toolbar-groups" role="toolbar" aria-label="Accessibility & language controls">
              <div className="sup-toolbar-group">
                <button onClick={() => applyLang('ua')} className={`sup-tb-btn ${lang === 'ua' ? 'is-active' : ''}`}
                        aria-pressed={lang === 'ua'} aria-label="Українська">UA</button>
                <button onClick={() => applyLang('en')} className={`sup-tb-btn ${lang === 'en' ? 'is-active' : ''}`}
                        aria-pressed={lang === 'en'} aria-label="English">EN</button>
                <button onClick={() => applyLang('de')} className={`sup-tb-btn ${lang === 'de' ? 'is-active' : ''}`}
                        aria-pressed={lang === 'de'} aria-label="Deutsch">DE</button>
              </div>
              <div className="sup-toolbar-divider" />
              <div className="sup-toolbar-group">
                <button onClick={decFont} disabled={fontScale <= 1} className="sup-tb-btn" aria-label="Decrease font size">A−</button>
                <button onClick={incFont} disabled={fontScale >= 2} className="sup-tb-btn" aria-label="Increase font size">A+</button>
                <span className="sup-scale-label">{Math.round(fontScale * 100)}%</span>
              </div>
              <div className="sup-toolbar-divider" />
              <div className="sup-toolbar-group">
                <button onClick={() => applyTheme('default')} className={`sup-tb-btn ${theme === 'default' ? 'is-active' : ''}`}
                        aria-pressed={theme === 'default'}>{themeNamesByLang[lang].default}</button>
                <button onClick={() => applyTheme('dark')} className={`sup-tb-btn ${theme === 'dark' ? 'is-active' : ''}`}
                        aria-pressed={theme === 'dark'}>{themeNamesByLang[lang].dark}</button>
                <button onClick={() => applyTheme('high-contrast')} className={`sup-tb-btn ${theme === 'high-contrast' ? 'is-active' : ''}`}
                        aria-pressed={theme === 'high-contrast'}>{themeNamesByLang[lang]['high-contrast']}</button>
                <button onClick={() => applyTheme('dyslexic')} className={`sup-tb-btn ${theme === 'dyslexic' ? 'is-active' : ''}`}
                        aria-pressed={theme === 'dyslexic'}>{themeNamesByLang[lang].dyslexic}</button>
              </div>
              <div className="sup-toolbar-divider" />
              <button onClick={reset} className="sup-tb-btn" aria-label={T.reset}>↺ {T.reset}</button>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        {lang === 'ua' && <UkrainianContent
          activeCurrency={activeCurrency}
          setActiveCurrency={setActiveCurrency}
          activeAccount={activeAccount}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
          selectedAmount={selectedAmount}
          setSelectedAmount={setSelectedAmount}
          customAmount={customAmount}
          setCustomAmount={setCustomAmount}
          fullDetails={fullDetailsByLang.ua}
          qrString={qrString}
        />}

        {lang === 'en' && <EnglishAppeal
          activeAccount={activeAccount}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
          fullDetails={fullDetailsByLang.en}
          qrString={qrString}
        />}

        {lang === 'de' && <GermanAppeal
          activeAccount={activeAccount}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
          fullDetails={fullDetailsByLang.de}
          qrString={qrString}
        />}

        {copiedField && (
          <div className="sup-toast" role="status" aria-live="polite">
            ✓ {lang === 'en' ? 'Copied' : lang === 'de' ? 'Kopiert' : 'Скопійовано'}
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// UKRAINIAN
// ============================================================================
function UkrainianContent({
  activeCurrency, setActiveCurrency, activeAccount,
  copiedField, copyToClipboard,
  selectedAmount, setSelectedAmount,
  customAmount, setCustomAmount,
  fullDetails, qrString,
}: {
  activeCurrency: Currency;
  setActiveCurrency: (c: Currency) => void;
  activeAccount: AccountInfo;
  copiedField: string | null;
  copyToClipboard: (text: string, key: string) => void;
  selectedAmount: number | null;
  setSelectedAmount: (n: number | null) => void;
  customAmount: string;
  setCustomAmount: (s: string) => void;
  fullDetails: string;
  qrString: string;
}) {
  const showAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : null);

  return (
    <>
      <section className="sup-hero" aria-labelledby="hero-ua">
        <div className="sup-hero-mark" aria-hidden="true">❤</div>
        <h1 id="hero-ua">
          Підтримайте <span className="accent">інклюзивність</span><br />
          проєкту «Балабони»
        </h1>
        <p className="sup-hero-lead">
          Серіал «Балабони» — це проєкт про живу українську мову, який ми створюємо разом
          із <strong>пільговим доступом для учасників бойових дій (УБД) та людей
          з інвалідністю</strong>. Ваш благодійний внесок на ЛОГО «Інститут громадянського
          суспільства» допомагає підтримувати цей пільговий модуль і розвивати функції
          доступності платформи.
        </p>
      </section>

      <main id="sup-main" className="sup-container">

        {/* WARNING */}
        <div className="sup-warn" role="status">
          <div className="sup-warn-icon" aria-hidden="true">🚧</div>
          <div className="sup-warn-content">
            <div className="sup-warn-title">Платформа на стадії активної розробки</div>
            <p className="sup-warn-text">
              balabony.com зараз перебуває у фазі програмування і вдосконалення. Можливі тимчасові
              перебої з доступом до контенту, недостатня швидкість завантаження, незавершені функції.
              Ми перепрошуємо за можливі незручності та працюємо над покращенням сервісу щодня.
              Якщо ви знайшли помилку — напишіть нам на <strong>{CONTACT_EMAIL}</strong>.
            </p>
          </div>
        </div>

        {/* MISSION */}
        <section className="sup-mission" aria-labelledby="mission-ua">
          <h2 id="mission-ua">На що підуть кошти</h2>
          <ul>
            <li><strong>Пільговий доступ для УБД та людей з інвалідністю</strong> — підтримка модуля «1 грн на рік», який дає повний доступ до платформи учасникам бойових дій і людям з підтвердженою інвалідністю</li>
            <li><strong>Розширений модуль доступності</strong> — підтримка скрінрідерів (JAWS, NVDA, VoiceOver), голосовий пошук, додаткові шрифти для дислексії</li>
            <li><strong>Якісна україномовна ШІ-озвучка субтитрів</strong> — клоновані голоси персонажів через ElevenLabs Pro для аудіодоступу слабкозорих</li>
            <li><strong>Пілотний жестомовний переклад</strong> — за умови залучення партнерів з Українського товариства глухих (УТОГ)</li>
            <li><strong>Розвиток платформи balabony.com</strong> — підтримка серверів, домен, оплата SaaS-сервісів, доопрацювання інтерфейсу</li>
          </ul>
        </section>

        {/* BANK DETAILS */}
        <section className="sup-section" aria-labelledby="bank-ua">
          <h2 id="bank-ua">Реквізити для переказу</h2>
          <div className="sup-section-lead">
            <p>Виберіть валюту. Натисніть «Копіювати» біля будь-якого поля, або скористайтеся QR-кодом
            для миттєвого переказу через банківський додаток.</p>
          </div>

          <div className="sup-tabs" role="tablist" aria-label="Виберіть валюту">
            {ACCOUNTS.map(a => (
              <button key={a.currency} role="tab" aria-selected={activeCurrency === a.currency}
                      className={`sup-tab ${activeCurrency === a.currency ? 'is-active' : ''}`}
                      onClick={() => setActiveCurrency(a.currency)}>
                <span aria-hidden="true">{a.symbol}</span>
                <span>{a.currency}</span>
              </button>
            ))}
          </div>

          <div className="sup-details">
            <DetailRow label="Отримувач" value={ORG_NAME_UA_FULL} fieldKey="org-ua" copied={copiedField} onCopy={copyToClipboard} />
            <DetailRow label="ЄДРПОУ" value={EDRPOU} fieldKey="edrpou-ua" copied={copiedField} onCopy={copyToClipboard} mono />
            <DetailRow label="IBAN" value={activeAccount.iban} fieldKey="iban-ua" copied={copiedField} onCopy={copyToClipboard} mono />
            <DetailRow label="Валюта" value={`${activeAccount.currency} (${activeAccount.type})`} fieldKey="cur-ua" copied={copiedField} onCopy={copyToClipboard} />
            <DetailRow label="Банк" value={`${BANK} (МФО ${BANK_CODE})`} fieldKey="bank-ua" copied={copiedField} onCopy={copyToClipboard} />
            <DetailRow label="SWIFT" value={SWIFT} fieldKey="swift-ua" copied={copiedField} onCopy={copyToClipboard} mono />
            <DetailRow label="Призначення" value={PURPOSE_UA} fieldKey="purpose-ua" copied={copiedField} onCopy={copyToClipboard} />
          </div>

          <button className={`sup-copy-all ${copiedField === 'all-ua' ? 'is-copied' : ''}`}
                  onClick={() => copyToClipboard(fullDetails, 'all-ua')}>
            {copiedField === 'all-ua' ? '✓ Усі реквізити скопійовано!' : '📋 Копіювати всі реквізити одним блоком'}
          </button>

          {/* BANK BUTTONS — quick action */}
          <div className="sup-bank-actions" aria-labelledby="bank-actions-ua">
            <h3 id="bank-actions-ua" className="sup-bank-actions-title">💳 Швидко перейти до оплати</h3>
            <p className="sup-bank-actions-lead">
              Натисніть кнопку свого банку — IBAN автоматично скопіюється до буфера обміну.
              У банківському додатку зайдіть у «Платіж за реквізитами» і вставте IBAN з буфера.
              {showAmount && <strong> Сума: {showAmount} {activeAccount.symbol}.</strong>}
            </p>
            <div className="sup-bank-buttons">
              <a
                href="https://next.privat24.ua/payments"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => copyToClipboard(activeAccount.iban, 'iban-privat')}
                className="sup-bank-btn sup-bank-privat"
              >
                <span className="sup-bank-btn-icon" aria-hidden="true">🏦</span>
                <span className="sup-bank-btn-text">
                  <strong>Відкрити Privat24</strong>
                  <span>IBAN скопійовано →</span>
                </span>
              </a>
            </div>
            <p className="sup-bank-actions-note">
              💡 Підказка: у банку оберіть «Переказ за реквізитами» або «Платіж за IBAN»,
              вставте IBAN з буфера, введіть суму і призначення «Благодійний внесок».
              Якщо у вас Monobank або інший банк — просто скопіюйте IBAN із реквізитів вище
              і вставте у вашому банківському додатку.
            </p>
          </div>
        </section>

        {/* AMOUNTS */}
        {activeCurrency === 'UAH' && (
          <section className="sup-section" aria-labelledby="amounts-ua">
            <h2 id="amounts-ua">Орієнтовні суми</h2>
            <p className="sup-section-lead">Виберіть зручну для вас суму, або введіть свою.</p>

            <div className="sup-amounts">
              <button className={`sup-amount ${selectedAmount === 100 ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedAmount(100); setCustomAmount(''); }}>
                100 ₴<span className="sup-amount-note">символічна підтримка</span>
              </button>
              <button className={`sup-amount ${selectedAmount === 500 ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedAmount(500); setCustomAmount(''); }}>
                500 ₴<span className="sup-amount-note">1 година роботи</span>
              </button>
              <button className={`sup-amount ${selectedAmount === 1500 ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedAmount(1500); setCustomAmount(''); }}>
                1 500 ₴<span className="sup-amount-note">пільговий доступ</span>
              </button>
              <button className={`sup-amount ${selectedAmount === 5000 ? 'is-selected' : ''}`}
                      onClick={() => { setSelectedAmount(5000); setCustomAmount(''); }}>
                5 000 ₴<span className="sup-amount-note">розвиток платформи</span>
              </button>
            </div>

            <div className="sup-custom">
              <label className="sup-custom-label" htmlFor="custom-amount-input">Інша сума:</label>
              <input id="custom-amount-input" type="number" inputMode="numeric" min="1"
                     placeholder="введіть суму"
                     value={customAmount}
                     onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
                     className="sup-custom-input" aria-label="Інша сума переказу" />
              <span className="sup-custom-currency">₴</span>
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="sup-section" aria-labelledby="faq-ua">
          <h2 id="faq-ua">Часті питання</h2>

          <div className="sup-faq-item">
            <h3>На кого спрямовані донати?</h3>
            <p>Платформа balabony.com — це україномовний серіал «Балабони», доступний у двох режимах:</p>
            <ol>
              <li><strong>Звичайний доступ</strong> — для всіх користувачів за стандартним тарифом платформи</li>
              <li><strong>Пільговий доступ за 1 грн/рік</strong> — для учасників бойових дій (УБД) та людей з підтвердженою інвалідністю</li>
            </ol>
            <p>Зібрані благодійні внески на ЛОГО «Інститут громадянського суспільства» спрямовуються
            на підтримку пільгового модуля для УБД та людей з інвалідністю, а також на розвиток
            функцій доступності платформи (аудіодоступ, скрінрідери, жестомовний переклад).</p>
          </div>

          <div className="sup-faq-item">
            <h3>Чи отримаю я документи про благодійний внесок?</h3>
            <p>Так. Якщо ви хочете отримати лист-подяку або документ про благодійний внесок
            (для пом'якшення податкової бази для юридичних осіб) — напишіть на пошту
            <strong> {CONTACT_EMAIL}</strong> після переказу, вказавши дату і суму.</p>
          </div>

          <div className="sup-faq-item">
            <h3>Чи можна донатити з-за кордону?</h3>
            <p>Так. У ЛОГО є USD і EUR рахунки в ПриватБанку. SWIFT-код: <strong>{SWIFT}</strong>.
            Для міжнародних переказів — оберіть валюту USD або EUR на вкладці вище.
            Окреме звернення англійською/німецькою — натисніть EN / DE вгорі сторінки.</p>
          </div>

          <div className="sup-faq-item">
            <h3>Куди писати з питаннями?</h3>
            <p>Email для зв'язку — <strong>{CONTACT_EMAIL}</strong>. Відповідаємо протягом 48 годин.</p>
          </div>
        </section>

        <section className="sup-back">
          <a href="/">← Повернутись на головну</a>
        </section>
      </main>
    </>
  );
}

// ============================================================================
// ENGLISH
// ============================================================================
function EnglishAppeal({ activeAccount, copiedField, copyToClipboard, fullDetails, qrString }: {
  activeAccount: AccountInfo;
  copiedField: string | null;
  copyToClipboard: (text: string, key: string) => void;
  fullDetails: string;
  qrString: string;
}) {
  return (
    <main id="sup-main" className="sup-container" style={{ paddingTop: 56 }}>

      <div className="sup-warn" role="status">
        <div className="sup-warn-icon" aria-hidden="true">🚧</div>
        <div className="sup-warn-content">
          <div className="sup-warn-title">Platform under active development</div>
          <p className="sup-warn-text">
            balabony.com is currently in active programming and refinement phase. Temporary content
            access issues, slower loading, or unfinished features are possible. We apologise for any
            inconvenience and work to improve the service every day. If you find a bug, please email
            <strong> {CONTACT_EMAIL}</strong>.
          </p>
        </div>
      </div>

      <section className="sup-intl" aria-labelledby="intl-en">
        <h2 id="intl-en">Support Ukrainian-Language Accessible Audio Content</h2>
        <div className="sup-intl-sub">International Donations &amp; Grant Partnerships</div>

        <p>
          The <strong>balabony.com</strong> platform is an independent Ukrainian cultural initiative
          that develops <strong>accessible audio content</strong> — audio narrations of <strong>stories
          and fairy tales by Ukrainian writers</strong>. The platform is designed to make Ukrainian
          literature available to a broad audience, including people with visual impairments, combat
          veterans, people with disabilities, and the Ukrainian-speaking diaspora worldwide.
        </p>

        <p>
          The platform is operated by an editorial team based in Lviv, Ukraine, in cooperation with
          the Lviv-based public organisation <strong>{ORG_NAME_TRANS}</strong>, registered in Ukraine,
          USREOU code <strong>{EDRPOU}</strong>. This NGO provides the legal and financial framework
          for charitable activities supporting the platform.
        </p>

        <p>The project is currently in active development. All funds raised through international donations are directed exclusively to:</p>
        <ul>
          <li><strong>Inclusion of users with disabilities and combat veterans (UBD)</strong> — supporting the platform's preferential-access module, which provides full content access for 1 UAH per year to people with confirmed disability status and military veterans of the Russian-Ukrainian war</li>
          <li><strong>Accessibility features development</strong> — screen-reader compatibility, high-contrast and dyslexia-friendly modes, audio narration of text content with cloned voices of professional readers</li>
          <li><strong>Platform engineering and infrastructure</strong> — programming, server hosting, domain maintenance, third-party SaaS services required for the technical operation of the inclusive audio module</li>
        </ul>

        <h3>Grant Partnerships</h3>
        <p><strong>We are open to formal grant partnerships.</strong> If your organisation supports inclusion, accessibility, audiobook production, or Ukrainian-language cultural projects, we would be honoured to develop tailored grant applications in alignment with your priorities.</p>
        <p>We are particularly interested in funding for <strong>producing English and German translations of selected Ukrainian-language works, with audio narration</strong>, in order to make them accessible to people with disabilities in English- and German-speaking countries, including the Ukrainian diaspora in the European Union, the United Kingdom, North America, and Australia.</p>
        <p>We commit to preparing grant applications fully in accordance with your formal requirements, including reporting standards, audit procedures, and impact metrics. For any inquiries regarding grant opportunities or partnership proposals, please contact: <strong>{CONTACT_EMAIL}</strong>.</p>

        <h3>Bank Details for International Transfers (SWIFT)</h3>
        <div className="sup-intl-bank">
          <p style={{margin: '0 0 6px 0'}}><strong>Beneficiary:</strong> {ORG_NAME_TRANS}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>USREOU:</strong> {EDRPOU}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>Bank:</strong> {BANK_EN}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>SWIFT/BIC:</strong> {SWIFT}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>Branch:</strong> {BRANCH_ADDR_EN}</p>
          <p style={{margin: '4px 0'}}><strong>{activeAccount.currency} IBAN:</strong> {activeAccount.iban}</p>
          <p style={{margin: '4px 0'}}><strong>Purpose:</strong> {PURPOSE_EN}</p>
        </div>

        <button className={`sup-copy-all ${copiedField === 'all-en' ? 'is-copied' : ''}`}
                onClick={() => copyToClipboard(fullDetails, 'all-en')}
                style={{ marginTop: 16 }}>
          {copiedField === 'all-en' ? '✓ All details copied!' : '📋 Copy all bank details'}
        </button>

        {/* QR */}
        <h3>📱 Quick payment via QR code</h3>
        <div className="sup-intl-qr">
          <div className="sup-intl-qr-box">
            <QRCodeSVG value={qrString} size={180} level="M" />
          </div>
          <div className="sup-intl-qr-text">
            <p>This QR code follows the European SEPA standard (EPC QR). Most European banking apps
            (Revolut, N26, Sparkasse, Postbank, etc.) can scan it and prefill the transfer details
            automatically. Select your currency (USD/EUR) above before scanning.</p>
          </div>
        </div>

        <h3>Patreon (in preparation)</h3>
        <p>A regular-support channel via Patreon is currently being set up and will be announced
        shortly. If you would like to receive a notification when it launches, please send us a
        short message at <strong>{CONTACT_EMAIL}</strong> and we will add you to the announcement list.</p>

        <h3>Documentation upon Request</h3>
        <p>Upon request, we provide:</p>
        <ul>
          <li>A formal acknowledgement letter of your charitable contribution</li>
          <li>A statement of intended use of funds</li>
          <li>Quarterly reports on the use of received donations</li>
          <li>Copies of the NGO's statutory documents and registration certificates</li>
        </ul>
        <p>For any of the above, please contact <strong>{CONTACT_EMAIL}</strong>.</p>

        <p style={{marginTop: 26}}>Thank you for considering supporting Ukrainian-language accessible
        audio content. Every contribution helps build a more inclusive Ukrainian cultural space.</p>

        <div className="sup-intl-signature">
          On behalf of the project team and<br />
          <strong>{ORG_NAME_TRANS}</strong><br />
          Lviv, Ukraine
        </div>
      </section>

      <section className="sup-back">
        <a href="/">← Back to home</a>
      </section>
    </main>
  );
}

// ============================================================================
// GERMAN
// ============================================================================
function GermanAppeal({ activeAccount, copiedField, copyToClipboard, fullDetails, qrString }: {
  activeAccount: AccountInfo;
  copiedField: string | null;
  copyToClipboard: (text: string, key: string) => void;
  fullDetails: string;
  qrString: string;
}) {
  return (
    <main id="sup-main" className="sup-container" style={{ paddingTop: 56 }}>

      <div className="sup-warn" role="status">
        <div className="sup-warn-icon" aria-hidden="true">🚧</div>
        <div className="sup-warn-content">
          <div className="sup-warn-title">Plattform in aktiver Entwicklung</div>
          <p className="sup-warn-text">
            balabony.com befindet sich derzeit in der Phase aktiver Programmierung und Verbesserung.
            Temporäre Inhalts-Zugriffsprobleme, langsamere Ladezeiten oder unfertige Funktionen sind
            möglich. Wir entschuldigen uns für etwaige Unannehmlichkeiten und arbeiten täglich an
            der Verbesserung. Wenn Sie einen Fehler finden, senden Sie bitte eine E-Mail an
            <strong> {CONTACT_EMAIL}</strong>.
          </p>
        </div>
      </div>

      <section className="sup-intl" aria-labelledby="intl-de">
        <h2 id="intl-de">Unterstützung für ukrainischsprachige barrierefreie Audioinhalte</h2>
        <div className="sup-intl-sub">Internationale Spenden und Förderpartnerschaften</div>

        <p>
          Die Plattform <strong>balabony.com</strong> ist eine unabhängige ukrainische
          Kulturinitiative, die <strong>barrierefreie Audioinhalte</strong> entwickelt —
          Audionarrationen von <strong>Geschichten und Märchen ukrainischer Autoren</strong>.
          Die Plattform soll ukrainische Literatur einem breiten Publikum zugänglich machen,
          einschließlich Menschen mit Sehbehinderungen, Kriegsveteranen, Menschen mit Behinderungen
          sowie der ukrainischsprachigen Diaspora weltweit.
        </p>

        <p>
          Die Plattform wird von einem in Lwiw, Ukraine, ansässigen Redaktionsteam betrieben,
          in Zusammenarbeit mit der gemeinnützigen Organisation in Lwiw <strong>{ORG_NAME_TRANS}</strong>,
          in der Ukraine registriert, EDRPOU-Code <strong>{EDRPOU}</strong>. Diese NRO stellt
          den rechtlichen und finanziellen Rahmen für wohltätige Aktivitäten zur Unterstützung
          der Plattform bereit.
        </p>

        <p>Das Projekt befindet sich derzeit in aktiver Entwicklung. Alle durch internationale Spenden gesammelten Mittel werden ausschließlich verwendet für:</p>
        <ul>
          <li><strong>Inklusion von Menschen mit Behinderungen und Kriegsveteranen (UBD)</strong> — Unterstützung des Vorzugszugangs-Moduls der Plattform, das Menschen mit anerkanntem Behindertenstatus sowie Veteranen des russisch-ukrainischen Krieges vollen Zugang zu Inhalten für 1 UAH pro Jahr ermöglicht</li>
          <li><strong>Entwicklung von Barrierefreiheitsfunktionen</strong> — Kompatibilität mit Bildschirmlesern, Modi mit hohem Kontrast und für Menschen mit Legasthenie, Audionarration von Textinhalten mit geklonten Stimmen professioneller Sprecher</li>
          <li><strong>Plattform-Entwicklung und Infrastruktur</strong> — Programmierung, Server-Hosting, Domain-Pflege, Drittanbieter-SaaS-Dienste, die für den technischen Betrieb des inklusiven Audio-Moduls erforderlich sind</li>
        </ul>

        <h3>Förderpartnerschaften</h3>
        <p><strong>Wir sind offen für formelle Förderpartnerschaften.</strong> Wenn Ihre Organisation Inklusion, Barrierefreiheit, Hörbuchproduktion oder ukrainischsprachige Kulturprojekte unterstützt, würden wir uns freuen, maßgeschneiderte Förderanträge in Übereinstimmung mit Ihren Prioritäten zu entwickeln.</p>
        <p>Wir interessieren uns besonders für Förderung zur <strong>Erstellung englischer und deutscher Übersetzungen ausgewählter ukrainischsprachiger Werke, mit Audionarration</strong>, um sie Menschen mit Behinderungen in englisch- und deutschsprachigen Ländern zugänglich zu machen, einschließlich der ukrainischen Diaspora in der Europäischen Union, dem Vereinigten Königreich, Nordamerika und Australien.</p>
        <p>Wir verpflichten uns, Förderanträge vollständig gemäß Ihren formellen Anforderungen zu erstellen, einschließlich Berichtsstandards, Prüfungsverfahren und Wirkungsindikatoren. Für Anfragen zu Fördermöglichkeiten oder Partnerschaftsvorschlägen wenden Sie sich bitte an: <strong>{CONTACT_EMAIL}</strong>.</p>

        <h3>Bankverbindung für internationale Überweisungen (SWIFT)</h3>
        <div className="sup-intl-bank">
          <p style={{margin: '0 0 6px 0'}}><strong>Begünstigter:</strong> {ORG_NAME_TRANS}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>EDRPOU:</strong> {EDRPOU}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>Bank:</strong> {BANK_EN}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>SWIFT/BIC:</strong> {SWIFT}</p>
          <p style={{margin: '0 0 4px 0'}}><strong>Filiale:</strong> {BRANCH_ADDR_EN}</p>
          <p style={{margin: '4px 0'}}><strong>{activeAccount.currency} IBAN:</strong> {activeAccount.iban}</p>
          <p style={{margin: '4px 0'}}><strong>Zweck:</strong> {PURPOSE_EN}</p>
        </div>

        <button className={`sup-copy-all ${copiedField === 'all-de' ? 'is-copied' : ''}`}
                onClick={() => copyToClipboard(fullDetails, 'all-de')}
                style={{ marginTop: 16 }}>
          {copiedField === 'all-de' ? '✓ Alle Daten kopiert!' : '📋 Alle Bankdaten kopieren'}
        </button>

        {/* QR */}
        <h3>📱 Schnelle Zahlung per QR-Code</h3>
        <div className="sup-intl-qr">
          <div className="sup-intl-qr-box">
            <QRCodeSVG value={qrString} size={180} level="M" />
          </div>
          <div className="sup-intl-qr-text">
            <p>Dieser QR-Code folgt dem europäischen SEPA-Standard (EPC QR). Die meisten europäischen
            Banking-Apps (Sparkasse, Postbank, Volksbanken, N26 usw.) können ihn scannen und die
            Überweisungsdaten automatisch ausfüllen. Wählen Sie oben Ihre Währung (USD/EUR), bevor
            Sie scannen.</p>
          </div>
        </div>

        <h3>Patreon (in Vorbereitung)</h3>
        <p>Ein Kanal für regelmäßige Unterstützung über Patreon wird derzeit eingerichtet und in
        Kürze angekündigt. Wenn Sie eine Benachrichtigung erhalten möchten, sobald er verfügbar ist,
        senden Sie uns bitte eine kurze Nachricht an <strong>{CONTACT_EMAIL}</strong>, und wir werden
        Sie zur Ankündigungsliste hinzufügen.</p>

        <h3>Dokumentation auf Anfrage</h3>
        <p>Auf Anfrage stellen wir bereit:</p>
        <ul>
          <li>Eine formelle Bestätigung Ihres wohltätigen Beitrags</li>
          <li>Eine Erklärung über die beabsichtigte Verwendung der Mittel</li>
          <li>Vierteljährliche Berichte über die Verwendung erhaltener Spenden</li>
          <li>Kopien der Satzungsdokumente und Registrierungsbescheinigungen der NRO</li>
        </ul>
        <p>Für alle oben genannten Dokumente wenden Sie sich bitte an <strong>{CONTACT_EMAIL}</strong>.</p>

        <p style={{marginTop: 26}}>Vielen Dank, dass Sie die Unterstützung ukrainischsprachiger
        barrierefreier Audioinhalte in Betracht ziehen. Jeder Beitrag hilft beim Aufbau eines
        inklusiveren ukrainischen Kulturraums.</p>

        <div className="sup-intl-signature">
          Im Namen des Projektteams und<br />
          <strong>{ORG_NAME_TRANS}</strong><br />
          Lwiw, Ukraine
        </div>
      </section>

      <section className="sup-back">
        <a href="/">← Zurück zur Startseite</a>
      </section>
    </main>
  );
}

// ============================================================================
function DetailRow({ label, value, fieldKey, copied, onCopy, mono }: {
  label: string;
  value: string;
  fieldKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  mono?: boolean;
}) {
  const isCopied = copied === fieldKey;
  return (
    <div className="sup-row">
      <div className="sup-row-label">{label}</div>
      <div className={`sup-row-value ${mono ? 'is-mono' : ''}`}>{value}</div>
      <button className={`sup-copy-btn ${isCopied ? 'is-copied' : ''}`}
              onClick={() => onCopy(value, fieldKey)}
              aria-label={`Копіювати ${label}`}>
        {isCopied ? '✓ Скопійовано' : 'Копіювати'}
      </button>
    </div>
  );
}
