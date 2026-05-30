// FILE: app/contacts/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Інлайн-стилі (Tailwind у проєкті не застосовується): темна тема + кремова картка.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Контакти — Balabony",
  description:
    "Контактні дані ФОП Хомин Ігор Іванович — отримувача платежів платформи Balabony",
  alternates: { canonical: "https://balabony.com/contacts" },
  openGraph: {
    title: "Контакти — Balabony",
    description:
      "Контактні дані ФОП Хомин Ігор Іванович — отримувача платежів платформи Balabony",
    url: "https://balabony.com/contacts",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2Style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 12px",
};

const sectionStyle: React.CSSProperties = { marginTop: 32 };

const ulStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.7,
};

const linkStyle: React.CSSProperties = {
  color: "#92400e",
  textDecoration: "underline",
};

export default function ContactsPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#161412",
        padding: "48px 16px",
      }}
    >
      <article
        style={{
          maxWidth: 768,
          margin: "0 auto",
          background: "#f6f1e7",
          color: "#292524",
          borderRadius: 16,
          padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          fontSize: 16,
          lineHeight: 1.6,
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 700,
            color: "#1c1917",
            margin: 0,
          }}
        >
          Контакти
        </h1>
        <p style={{ marginTop: 12, fontSize: 18, color: "#57534e" }}>
          Платіжні питання, технічна підтримка, співпраця, авторські запити —
          пишіть на email або у WhatsApp.
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Зв&apos;язатися з нами</h2>
          <ul style={ulStyle}>
            <li>
              <strong>Email:</strong>{" "}
              <a style={linkStyle} href="mailto:nazar@balabony.com">
                nazar@balabony.com
              </a>
            </li>
            <li>
              <strong>WhatsApp / Telegram:</strong>{" "}
              <a style={linkStyle} href="tel:+380505859141">
                +380 50 585 91 41
              </a>
            </li>
            <li>
              <strong>Час відповіді:</strong> зазвичай протягом 1–2 робочих днів.
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Реквізити отримувача платежів</h2>
          <p style={{ margin: "0 0 8px" }}>Платежі на платформі обробляє:</p>
          <ul style={ulStyle}>
            <li>
              <strong>ФОП Хомин Ігор Іванович</strong>
            </li>
            <li>
              <strong>РНОКПП:</strong> 2552710170
            </li>
            <li>
              <strong>Адреса:</strong> Україна, 79069, м. Львів, вул. Шевченка Т.,
              буд. 338, кв. 143
            </li>
            <li>
              <strong>Система оподаткування:</strong> платник єдиного податку 2
              групи
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Партнер з освітньої та благодійної діяльності</h2>
          <p style={{ margin: "0 0 8px" }}>
            Інклюзивна частина платформи (безкоштовний доступ для дітей ВПО,
            ветеранів УБД, людей з інвалідністю) реалізується у партнерстві з:
          </p>
          <ul style={ulStyle}>
            <li>
              <strong>
                Львівська обласна громадська організація «Інститут громадянського
                суспільства»
              </strong>
            </li>
            <li>
              <strong>ЄДРПОУ:</strong> 33951844
            </li>
          </ul>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Юридичні документи</h2>
          <ul style={ulStyle}>
            <li>
              <Link style={linkStyle} href="/legal/offer">
                Публічна оферта
              </Link>
            </li>
            <li>
              <Link style={linkStyle} href="/legal/privacy">
                Політика конфіденційності
              </Link>
            </li>
            <li>
              <Link style={linkStyle} href="/legal/refund">
                Правила повернення коштів
              </Link>
            </li>
            <li>
              <Link style={linkStyle} href="/legal/author-contract">
                Договір з автором
              </Link>
            </li>
          </ul>
        </section>
      </article>
    </main>
  );
}
