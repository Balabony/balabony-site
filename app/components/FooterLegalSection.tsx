// components/FooterLegalSection.tsx
// Юридична секція футера (реквізити ФОП + контакти + документи).
// Інлайн-стилі під спільну тему футера. Серверний компонент — контент видно без JS.
import Link from "next/link";

const headingStyle: React.CSSProperties = {
  color: "var(--accent-gold)",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  margin: "0 0 10px",
};

const linkStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.8)",
  textDecoration: "none",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  whiteSpace: "nowrap",
};

const sep = (
  <span style={{ color: "rgba(255,255,255,0.3)", margin: "0 6px" }}>·</span>
);

export function FooterLegalSection() {
  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        paddingTop: 22,
        marginTop: 4,
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 28,
          fontSize: 13,
          lineHeight: 1.65,
          color: "rgba(255,255,255,0.6)",
        }}
      >
        {/* Реквізити */}
        <div>
          <h4 style={headingStyle}>Реквізити</h4>
          <p style={{ margin: 0 }}>
            Платежі обробляє ФОП Хомин Ігор Іванович
            <br />
            РНОКПП 2552710170
            <br />
            79069, м. Львів, вул. Шевченка Т., 338, кв. 143
            <br />
            Платник єдиного податку, 2 група
          </p>
        </div>

        {/* Зв'язок */}
        <div>
          <h4 style={headingStyle}>Зв&apos;язок</h4>
          <p style={{ margin: 0 }}>
            Email:{" "}
            <a style={linkStyle} href="mailto:nazar@balabony.com">
              nazar@balabony.com
            </a>
            <br />
            WhatsApp:{" "}
            <a style={linkStyle} href="tel:+380505859141">
              +380 50 585 91 41
            </a>
          </p>
        </div>

        {/* Документи */}
        <div>
          <h4 style={headingStyle}>Документи</h4>
          <p style={{ margin: 0 }}>
            <Link style={linkStyle} href="/legal/offer">
              Публічна оферта
            </Link>
            {sep}
            <Link style={linkStyle} href="/legal/privacy">
              Політика конфіденційності
            </Link>
            {sep}
            <Link style={linkStyle} href="/legal/refund">
              Правила повернення коштів
            </Link>
            {sep}
            <Link style={linkStyle} href="/contacts">
              Контакти
            </Link>
            {sep}
            <Link style={linkStyle} href="/about">
              Про автора
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
