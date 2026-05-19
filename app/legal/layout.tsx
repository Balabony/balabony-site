import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="legal-root">
      <div className="legal-shell">
        <Link href="/" className="legal-back">← На головну</Link>

        <div className="legal-disclaimer">
          <strong>⚠️ Чернетка документа.</strong> Цей текст є попередньою версією, яка потребує юридичної перевірки перед остаточним затвердженням. Реквізити ФОП будуть додані після державної реєстрації.
        </div>

        <article className="legal-content">
          {children}
        </article>

        <div className="legal-bottom-nav">
          <Link href="/legal/terms"           className="legal-bottom-link">Угода користувача</Link>
          <Link href="/legal/privacy"         className="legal-bottom-link">Політика конфіденційності</Link>
          <Link href="/legal/offer"           className="legal-bottom-link">Публічна оферта</Link>
          <Link href="/legal/cookies"         className="legal-bottom-link">Політика Cookies</Link>
          <Link href="/legal/author-contract" className="legal-bottom-link">Договір з автором</Link>
        </div>

        <p className="legal-footer-note">
          Усі документи редаговано: травень 2026. © 2026 Balabony®. Питання — <a href="mailto:nazar@balabony.com">nazar@balabony.com</a>
        </p>
      </div>

      <style>{`
        .legal-root {
          min-height: 100vh;
          background: linear-gradient(180deg, #0E1A2B 0%, #14253B 50%, #0E1A2B 100%);
          padding: 48px 20px 80px;
          font-family: 'Montserrat', Arial, sans-serif;
        }
        .legal-shell {
          max-width: 820px;
          margin: 0 auto;
          background: #FFF8EA;
          border: 1.5px solid #EF9F27;
          border-radius: 18px;
          padding: 48px 56px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4);
        }
        .legal-back {
          display: inline-block;
          color: #BA7517;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 18px;
          transition: color 0.2s, transform 0.2s;
        }
        .legal-back:hover {
          color: #EF9F27;
          transform: translateX(-3px);
        }
        .legal-disclaimer {
          background: rgba(239, 159, 39, 0.12);
          border: 1.5px solid rgba(239, 159, 39, 0.5);
          border-radius: 10px;
          padding: 14px 18px;
          margin-bottom: 30px;
          font-size: 14px;
          line-height: 1.5;
          color: #4A2F0A;
        }
        .legal-disclaimer strong { color: #2C1A02; }

        .legal-content {
          color: #2C2C2A;
          font-size: 16px;
          line-height: 1.75;
        }
        .legal-content :global(h1) {
          font-family: 'Lora', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: #2C1A02;
          margin: 0 0 8px;
          line-height: 1.2;
        }
        .legal-content :global(.legal-meta) {
          font-size: 13px;
          color: #888780;
          margin-bottom: 32px;
          font-style: italic;
        }
        .legal-content :global(h2) {
          font-family: 'Lora', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: #BA7517;
          margin: 32px 0 12px;
          padding-bottom: 6px;
          border-bottom: 1.5px solid rgba(186, 117, 23, 0.3);
        }
        .legal-content :global(h3) {
          font-size: 18px;
          font-weight: 700;
          color: #2C1A02;
          margin: 22px 0 8px;
        }
        .legal-content :global(p) {
          margin: 0 0 14px;
        }
        .legal-content :global(ul), .legal-content :global(ol) {
          margin: 0 0 14px;
          padding-left: 24px;
        }
        .legal-content :global(li) {
          margin: 6px 0;
        }
        .legal-content :global(strong) {
          color: #BA7517;
          font-weight: 700;
        }
        .legal-content :global(a) {
          color: #BA7517;
          text-decoration: underline;
          transition: color 0.2s;
        }
        .legal-content :global(a:hover) {
          color: #EF9F27;
        }
        .legal-content :global(.placeholder) {
          background: rgba(239, 159, 39, 0.18);
          border: 1px dashed #EF9F27;
          border-radius: 4px;
          padding: 1px 6px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          color: #4A2F0A;
        }

        .legal-bottom-nav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 48px 0 22px;
          padding-top: 28px;
          border-top: 1px solid rgba(186, 117, 23, 0.25);
        }
        .legal-bottom-link {
          padding: 8px 14px;
          background: rgba(239, 159, 39, 0.12);
          border: 1px solid rgba(239, 159, 39, 0.4);
          border-radius: 8px;
          color: #BA7517;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.2s, transform 0.2s;
        }
        .legal-bottom-link:hover {
          background: #EF9F27;
          color: #FFFFFF;
          transform: translateY(-2px);
        }
        .legal-footer-note {
          font-size: 13px;
          color: #888780;
          text-align: center;
          margin: 0;
        }
        .legal-footer-note a { color: #BA7517; }

        @media (max-width: 640px) {
          .legal-shell { padding: 32px 24px; }
          .legal-content :global(h1) { font-size: 26px; }
          .legal-content :global(h2) { font-size: 19px; }
        }
      `}</style>
    </div>
  )
}
