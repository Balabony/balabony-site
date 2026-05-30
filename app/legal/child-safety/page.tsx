// FILE: app/legal/child-safety/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Інлайн-стилі (Tailwind у проєкті не застосовується): темна тема + кремова картка.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Політика захисту дітей — Balabony",
  description:
    "Як платформа Balabony убезпечує неповнолітніх користувачів: контент, дані, взаємодія, звернення.",
  alternates: { canonical: "https://balabony.com/legal/child-safety" },
  openGraph: {
    title: "Політика захисту дітей — Balabony",
    description:
      "Як платформа Balabony убезпечує неповнолітніх користувачів.",
    url: "https://balabony.com/legal/child-safety",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2Style: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 10px",
};

const sectionStyle: React.CSSProperties = { marginTop: 28 };
const pStyle: React.CSSProperties = { margin: 0 };

export default function ChildSafetyPage() {
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
          Політика захисту дітей
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: "#78716c" }}>
          Редакція від 30 травня 2026 року · Версія 1.0
        </p>
        <p style={{ marginTop: 16 }}>
          Balabony — освітньо-літературна платформа для дітей і родин. Безпека
          неповнолітніх користувачів є для нас пріоритетом. Ця політика описує,
          як ми її забезпечуємо.
        </p>

        <section style={sectionStyle}>
          <h2 style={h2Style}>1. Сфера дії</h2>
          <p style={pStyle}>
            Політика поширюється на всіх користувачів молодших 18 років, а також
            на дорослих, які користуються платформою від їхнього імені (батьків,
            опікунів, освітян).
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>2. Вік і батьківський супровід</h2>
          <p style={pStyle}>
            Контент платформи призначений для сімейного читання. Діти
            користуються платформою під наглядом батьків або опікунів.
            Реєстрація для повного доступу потребує лише адреси електронної
            пошти; неповнолітні реєструються за згодою та під контролем батьків.
            Ми не збираємо надлишкових персональних даних дитини.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>3. Безпечний контент</h2>
          <p style={pStyle}>
            Увесь літературний контент проходить редакційну перевірку перед
            публікацією. Заборонено матеріали сексуального, насильницького чи
            іншого шкідливого для дітей характеру. Історії, надіслані авторами,
            модеруються редакцією до оприлюднення.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>4. Взаємодія користувачів</h2>
          <p style={pStyle}>
            На платформі немає приватного листування між користувачами. Публічні
            коментарі та відгуки модеруються; заборонено публікувати особисті
            контактні дані. Контент, що порушує ці правила, видаляється.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>5. Персональні дані дітей</h2>
          <p style={pStyle}>
            Ми збираємо мінімум даних (адресу електронної пошти) і не продаємо та
            не передаємо їх третім особам у комерційних цілях. Обробка даних
            здійснюється згідно із Законом України «Про захист персональних
            даних». Батьки або опікуни можуть звернутися щодо доступу до даних
            дитини чи їх видалення.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>6. Реклама</h2>
          <p style={pStyle}>
            Ми не показуємо дітям таргетованої поведінкової реклами. Будь-яка
            некомерційна інформація відповідає віку аудиторії.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>7. Повідомлення про проблему</h2>
          <p style={pStyle}>
            Якщо ви помітили небезпечний контент або поведінку, напишіть на{" "}
            <a
              style={{ color: "#92400e", textDecoration: "underline" }}
              href="mailto:nazar@balabony.com"
            >
              nazar@balabony.com
            </a>
            . Ми розглядаємо такі звернення у пріоритетному порядку.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2 style={h2Style}>8. Відповідальність і перегляд</h2>
          <p style={pStyle}>
            За дотримання цієї політики відповідає редакція платформи. Ми
            переглядаємо політику щонайменше раз на рік та оновлюємо її у разі
            змін у роботі платформи чи законодавстві.
          </p>
        </section>
      </article>
    </main>
  );
}
