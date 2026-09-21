// FILE: app/about/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Інлайн-стилі (Tailwind у проєкті не застосовується): темна тема + кремова картка.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про автора — Balabony",
  description:
    "Богдан Хомин — засновник літературної платформи Balabony. Місія платформи й пільговий доступ для ВПО, ветеранів і людей з інвалідністю.",
  alternates: { canonical: "https://balabony.com/about" },
  openGraph: {
    title: "Про автора — Balabony",
    description:
      "Богдан Хомин — засновник літературної платформи Balabony.",
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
            Богдан Хомин — засновник літературної платформи Balabony, видавець
            із 2003 року, член НСЖУ. Balabony — це українські серіали, авторські
            історії й казки для дітей, підлітків і дорослих. У планах —
            аудіоверсії творів і ШІ-тьютор для дітей, яким важко читати
            самостійно.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Місія</h2>
          <p style={pStyle}>
            Повертаємо дітям, які постраждали від війни, радість читання
            українською й допомагаємо відновити грамотність — через добрі
            історії та живу мову.
          </p>
          <p style={pStyle}>
            Тим, хто переходить з російської на українську, пропонуємо легкий
            шлях: без тиску й повчань — через цікаву історію й задоволення від
            читання.
          </p>
          <p style={pLastStyle}>
            Через спільні історії, живу мову й теплий гумор об&apos;єднуємо
            українців навколо рідної культури, де б вони не були.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>Пільговий доступ</h2>
          <p style={pStyle}>
            ВПО, ветерани (УБД) і люди з інвалідністю отримують повний доступ до
            всіх творів за 1 ₴ на рік. Статус ВПО та УБД підтверджується через
            застосунок «Дія». Людям з інвалідністю достатньо подати довідку або
            посвідчення — заявку розглядає редакція.
          </p>
          <p style={pLastStyle}>
            Пільгову програму (доступ, підготовку й адаптацію матеріалів)
            реалізує ЛОГО «Інститут громадянського суспільства» (Львів, з 2005
            року) за рахунок грантів і пожертв.
          </p>
        </section>
      </article>
    </main>
  );
}
