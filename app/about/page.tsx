// FILE: app/about/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Інлайн-стилі (Tailwind у проєкті не застосовується): темна тема + кремова картка.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про автора — Balabony",
  description:
    "Богдан Хомин — засновник освітньо-літературної платформи Balabony. Місія платформи та лагідна українізація.",
  alternates: { canonical: "https://balabony.com/about" },
  openGraph: {
    title: "Про автора — Balabony",
    description:
      "Богдан Хомин — засновник освітньо-літературної платформи Balabony.",
    url: "https://balabony.com/about",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2Style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 12px",
};

const sectionStyle: React.CSSProperties = { marginTop: 32 };

const pStyle: React.CSSProperties = { margin: "0 0 14px" };
const pLastStyle: React.CSSProperties = { margin: 0 };

export default function AboutPage() {
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
          lineHeight: 1.65,
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
          Про автора
        </h1>

        <section style={sectionStyle}>
          <p style={pLastStyle}>
            Богдан Хомин — засновник освітньо-літературної платформи Balabony.
            На основі 23-річного досвіду у медіа він створив проєкт, що робить
            сучасну українську прозу доступною для широкого читача. У планах
            розвитку — аудіоформат і ШІ-тьюторинг для людей з обмеженим доступом
            до традиційного читання.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Місія</h2>
          <p style={pStyle}>
            Ми відновлюємо грамотність і повертаємо радість українського слова
            дітям, які постраждали від війни, — через літературу та живу
            українську історію.
          </p>
          <p style={pStyle}>
            Окрема частина нашої місії — лагідна українізація російськомовних
            громадян: без тиску й повчань, через щире зацікавлення, добру історію
            та задоволення від читання, ми допомагаємо їм природно повертатися до
            української мови та культури.
          </p>
          <p style={pStyle}>
            Через спільні історії, живу мову й теплий гумор ми об&apos;єднуємо
            українців навколо рідної культури, щоб вони залишалися в Україні й
            будували її майбутнє.
          </p>
          <p style={pLastStyle}>
            Безкоштовний інклюзивний доступ надається дітям ВПО, ветеранам (УБД),
            людям з інвалідністю й дітям зі звільнених громад.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Партнерська мережа</h2>
          <p style={pStyle}>
            Перевірка пільгових статусів (ВПО, ветеранів УБД, людей з
            інвалідністю) для надання безкоштовного доступу здійснюється через
            державний застосунок «Дія» (Міністерство цифрової трансформації
            України).
          </p>
          <p style={pLastStyle}>
            Розробка платформи — програмування, підготовку матеріалів та супутні
            послуги — реалізується за грантової підтримки Львівської обласної
            громадської організації «Інститут громадянського суспільства».
          </p>
        </section>
      </article>
    </main>
  );
}
