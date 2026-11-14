// components/FooterLegalSection.tsx
// Юридична секція футера (реквізити ФОП + контакти).
// Інлайн-стилі під спільну тему футера. Серверний компонент — контент видно без JS.

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
        {/* 14.11.2026: блок «Реквізити ФОП» прибрано, поки платформа безкоштовна й платежів немає.
            Повернути перед запуском передплати (ФОП Хомин Ігор Іванович, РНОКПП 2552710170, м. Львів, платник єдиного податку 2 група). */}

        {/* Зв'язок */}
        <div>
          <h3 style={headingStyle}>Зв&apos;язок</h3>
          <p style={{ margin: 0 }}>
            Email:{" "}
            <a style={linkStyle} href="mailto:nazar@balabony.com">
              nazar@balabony.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
