// FILE: app/pro-balabony/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Двомовна сторінка «Про проєкт»: українською та англійською. Інлайн-стилі.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про проєкт — Balabony",
  description:
    "Balabony — український літературно-освітній простір для всіх: діти, підлітки й дорослі. Сьогодні читати, скоро — слухати. About the Balabony project (UA/EN).",
  alternates: { canonical: "https://balabony.com/pro-balabony" },
  openGraph: {
    title: "Про проєкт — Balabony",
    description:
      "Український літературно-освітній простір для всіх, хто любить рідну мову і живі історії.",
    url: "https://balabony.com/pro-balabony",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2Style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: "#1c1917",
  margin: "0 0 10px",
};
const subStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: "#1c1917",
  margin: "0 0 4px",
};
const sectionStyle: React.CSSProperties = { marginTop: 28 };
const pStyle: React.CSSProperties = { margin: "0 0 14px" };
const pLastStyle: React.CSSProperties = { margin: 0 };

const langLink: React.CSSProperties = {
  color: "#B5710C",
  fontWeight: 700,
  textDecoration: "none",
  fontSize: 14,
};

export default function ProBalabonyPage() {
  return (
    <main
      style={{
        background: "#161412",
        padding: "48px 16px calc(88px + env(safe-area-inset-bottom, 0px))",
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
        {/* перемикач мови */}
        <div style={{ marginBottom: 18, fontSize: 14, color: "#78716c" }}>
          <a href="#uk" style={langLink}>
            Українською
          </a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="#en" style={langLink}>
            English
          </a>
        </div>

        {/* ───────────── УКРАЇНСЬКОЮ ───────────── */}
        <section id="uk">
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 700,
              color: "#1c1917",
              margin: 0,
            }}
          >
            Про проєкт «Балабони»
          </h1>

          <section style={sectionStyle}>
            <p style={pLastStyle}>
              Balabony — український літературно-освітній простір для всіх, хто
              любить рідну мову і живі історії: для дітей, підлітків і дорослих.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Наші історії роблять три речі одночасно</h2>
            <p style={subStyle}>Об&apos;єднують</p>
            <p style={pStyle}>
              Допомагаємо російськомовним інтегруватися в українську культуру без
              тиску та повчань. Прагнемо об&apos;єднати усіх українців навколо
              спільної мови, пам&apos;яті та сміху.
            </p>
            <p style={subStyle}>Навчають</p>
            <p style={pStyle}>
              Жива мова, реальні діалекти, гумор і теплі діалоги — це навчання
              української природним шляхом, як ми всі колись чули вдома від
              бабусь і дідусів.
            </p>
            <p style={subStyle}>Зцілюють</p>
            <p style={pLastStyle}>
              Для тих, хто пережив війну, переселення чи довгу самотність —
              м&apos;який і безпечний спосіб зняти стрес і повернутися до себе
              через сміх, тепло знайомих слів і світлу пам&apos;ять про дім.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Що ми пропонуємо</h2>
            <p style={pLastStyle}>
              Ми віримо, що сильна культура тримає людей удома — і працюємо для
              того, щоб українці залишалися в Україні й будували її майбутнє.
              Сьогодні ми пропонуємо читати, а скоро — слухати: озвучка історій у
              роботі.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Особлива увага</h2>
            <p style={pStyle}>
              Ми працюємо для всіх, але особливо думаємо про тих, кому
              найскладніше: діти ВПО, захисники й їхні родини, люди з
              інвалідністю (доступ через текст) і пенсіонери.
            </p>
            <p style={pLastStyle}>
              Для пільгових категорій — ВПО, ветеранів (УБД) і людей з
              інвалідністю — повний доступ коштує символічну 1 грн на рік, із
              перевіркою статусу через державний застосунок «Дія».
            </p>
          </section>
        </section>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #d6ccb8",
            margin: "40px 0",
          }}
        />

        {/* ───────────── ENGLISH ───────────── */}
        <section id="en">
          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 36px)",
              fontWeight: 700,
              color: "#1c1917",
              margin: 0,
            }}
          >
            About Balabony
          </h1>

          <section style={sectionStyle}>
            <p style={pLastStyle}>
              Balabony is a Ukrainian literary-educational space for everyone who
              loves their language and living stories — for children, teens and
              adults.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Our stories do three things at once</h2>
            <p style={subStyle}>Unite</p>
            <p style={pStyle}>
              We help Russian-speakers move into Ukrainian culture without
              pressure or lecturing, bringing Ukrainians together around a shared
              language, memory and laughter.
            </p>
            <p style={subStyle}>Teach</p>
            <p style={pStyle}>
              Living language, real dialects, humour and warm dialogue — learning
              Ukrainian the natural way, the way we once heard it at home from our
              grandparents.
            </p>
            <p style={subStyle}>Heal</p>
            <p style={pLastStyle}>
              For those who lived through war, displacement or long loneliness — a
              gentle, safe way to ease stress and return to themselves through
              laughter, familiar words and bright memories of home.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>What we offer</h2>
            <p style={pLastStyle}>
              We believe a strong culture keeps people home — and we work so that
              Ukrainians stay in Ukraine and build its future. Today you can read;
              soon you will also listen — audio narration is in the works.
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>Special focus</h2>
            <p style={pStyle}>
              We work for everyone, but we think especially of those who find it
              hardest: displaced children, defenders and their families, people
              with disabilities (text access) and seniors.
            </p>
            <p style={pLastStyle}>
              For these groups — internally displaced people, veterans (UBD) and
              people with disabilities — full access costs a symbolic 1 UAH per
              year, with status verified through the state Diia service.
            </p>
          </section>
        </section>
      </article>
    </main>
  );
}
