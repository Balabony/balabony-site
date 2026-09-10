// FILE: app/poslugy/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Сторінка послуг з розробки сайтів. Свідомо НЕ виводиться в головне меню:
// на неї ведуть оголошення (OLX, Facebook) і пошук, а грантодавці, які дивляться
// balabony.com як культурний проєкт, не мають натикатися на неї в навігації.
// Інлайн-стилі, як у /pro-balabony.
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Розробка сайтів і вебдодатків — Львів | Balabony",
  description:
    "Створення сайтів під ключ: візитка, лендінг, інтернет-магазин, сайт громадської організації, портал з особистими кабінетами. Next.js, адмінка, доступність, PWA. Львів і вся Україна. Website development in Ukraine (EN).",
  alternates: { canonical: "https://balabony.com/poslugy" },
  openGraph: {
    title: "Розробка сайтів і вебдодатків — Львів",
    description:
      "Сайти під ключ на Next.js: адмінка, доступність, швидкість. Ціна після технічного завдання.",
    url: "https://balabony.com/poslugy",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
    // Зображення обов'язкове: LinkedIn і Facebook без нього відмовляються
    // будувати картку попереднього перегляду. У сторінковому openGraph воно
    // НЕ успадковується з app/layout.tsx — Next.js замінює блок цілком.
    images: [{ url: "https://balabony.com/og-image-v4.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Розробка сайтів і вебдодатків — Львів",
    description: "Сайти під ключ на Next.js: адмінка, доступність, швидкість. Ціна після технічного завдання.",
    images: ["https://balabony.com/og-image-v4.jpg"],
  },
};

const h2: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1c1917", margin: "0 0 10px" };
const section: React.CSSProperties = { marginTop: 28 };
const p: React.CSSProperties = { margin: "0 0 14px" };
const ul: React.CSSProperties = { margin: "0 0 6px", paddingLeft: 20 };
const li: React.CSSProperties = { margin: "0 0 6px" };
const tag: React.CSSProperties = { fontSize: 13, color: "#78716c", letterSpacing: "0.5px", margin: "0 0 16px" };
const langLink: React.CSSProperties = { color: "#B5710C", fontWeight: 700, textDecoration: "none", fontSize: 14 };
const cta: React.CSSProperties = {
  display: "inline-block", marginTop: 8, padding: "11px 20px",
  background: "#1c1917", color: "#f6f1e7", borderRadius: 10,
  textDecoration: "none", fontSize: 15, fontWeight: 700,
};
const th: React.CSSProperties = {
  textAlign: "left", padding: "10px 12px", fontSize: 13, fontWeight: 700,
  color: "#57534e", borderBottom: "2px solid #d6d3d1", whiteSpace: "nowrap",
};
const td: React.CSSProperties = {
  padding: "12px", fontSize: 15, borderBottom: "1px solid #e7e5e4", verticalAlign: "top",
};
const note: React.CSSProperties = {
  background: "#efe9dc", borderRadius: 12, padding: "16px 18px", margin: "18px 0 0", fontSize: 15,
};

export default function PoslugyPage() {
  return (
    <main style={{ background: "#161412", padding: "48px 16px calc(88px + env(safe-area-inset-bottom, 0px))" }}>
      <article
        style={{
          maxWidth: 768, margin: "0 auto", background: "#f6f1e7", color: "#292524",
          borderRadius: 16, padding: "clamp(28px, 5vw, 56px) clamp(20px, 4vw, 48px)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)", fontSize: 16, lineHeight: 1.65,
        }}
      >
        <div style={{ marginBottom: 18, fontSize: 14, color: "#78716c" }}>
          <a href="#uk" style={langLink}>Українською</a>
          <span style={{ margin: "0 8px" }}>·</span>
          <a href="#en" style={langLink}>English</a>
        </div>

        <section id="uk">
        <p style={tag}>Львів і вся Україна · Дистанційно · ФОП</p>

        <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, color: "#1c1917", margin: 0 }}>
          Розробка сайтів і вебдодатків
        </h1>

        <section style={section}>
          <p style={p}>
            Створюємо сайти під ключ: сайт-візитка, лендінг, інтернет-магазин, сайт компанії,
            сайт громадської організації, бібліотеки чи школи, каталог, портал з особистими
            кабінетами.
          </p>
          <p style={p}>
            Сучасні технології (Next.js), не конструктор і не шаблон WordPress. Сайт
            відкривається за секунду, коректно виглядає на телефоні, готовий до пошуку Google
            і доступний для людей з порушеннями зору.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Приклад роботи</h2>
          <p style={p}>
            <a href="https://balabony.com" style={{ color: "#B5710C", fontWeight: 700 }}>balabony.com</a>
            {" "}— платформа української прози: понад 900 творів, кабінети для авторів, вхід без
            паролів, платежі, розсилки, застосунок на телефон, адмінка на 23 розділи. Оцінка
            швидкості PageSpeed 91, доступність 100 зі 100.
          </p>
          <p style={{ margin: 0 }}>Ви зараз на цьому сайті — можете подивитися, як він працює.</p>
          <div style={note}>
            <strong>Скільки коштувала б така платформа</strong>
            <p style={{ margin: "8px 0 0" }}>
              Від 10 до 20 тисяч доларів і від пів року роботи. Це найдорожча категорія — сервіс
              з особистими кабінетами, платежами й розсилками. Сайт-візитка за 300 доларів
              і така платформа — різні задачі. Саме тому ціну називаємо після технічного
              завдання, а не з телефонної розмови.
            </p>
          </div>
        </section>

        <section style={section}>
          <h2 style={h2}>Що входить</h2>
          <ul style={ul}>
            <li style={li}>унікальний дизайн під вас, не готовий шаблон</li>
            <li style={li}>адаптив під телефон і планшет</li>
            <li style={li}>адмінка: тексти, новини й фото змінюєте самі</li>
            <li style={li}>SEO-налаштування, підключення Google Analytics</li>
            <li style={li}>форми зв&apos;язку, карта, соцмережі</li>
            <li style={li}>підключення онлайн-оплати для магазинів</li>
            <li style={li}>особисті кабінети, ролі, розсилки — для складніших проєктів</li>
            <li style={li}>допомога з доменом і хостингом</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>Що ви отримуєте на виході</h2>
          <ul style={ul}>
            <li style={li}>готовий сайт на вашому домені</li>
            <li style={li}>доступ до адмінки з вашим логіном і паролем</li>
            <li style={li}>вихідний код у вашому репозиторії</li>
            <li style={li}>акаунти хостингу й бази даних оформлені на вас</li>
            <li style={li}>коротка інструкція, як користуватися адмінкою</li>
            <li style={li}>навчання по відеозв&apos;язку: показуємо все на вашому сайті, поки не стане зрозуміло</li>
            <li style={li}>рахунок і акт виконаних робіт</li>
          </ul>
          <p style={{ margin: "10px 0 0" }}>
            Сайт ваш повністю. Ви не прив&apos;язані до нас: будь-який інший розробник зможе його
            підхопити.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Адмінка — що змінюєте самі, без програміста</h2>
          <ul style={ul}>
            <li style={li}>тексти на всіх сторінках</li>
            <li style={li}>новини, статті, оголошення: додати, змінити, зняти</li>
            <li style={li}>фото й галереї</li>
            <li style={li}>товари, ціни, наявність — для магазинів</li>
            <li style={li}>документи для завантаження</li>
            <li style={li}>контакти, години роботи</li>
            <li style={li}>заявки з форм: бачите список, з поштою й телефоном</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>Строки й ціни</h2>
          <p style={p}>Точну суму називаю після технічного завдання. Орієнтири:</p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={th}>Тип сайту</th>
                  <th style={th}>Строк</th>
                  <th style={th}>Орієнтовно</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={td}>Візитка, 3–5 сторінок</td>
                  <td style={td}>5–7 днів</td>
                  <td style={td}>250–350 $</td>
                </tr>
                <tr>
                  <td style={td}>Сайт організації з адмінкою</td>
                  <td style={td}>2–3 тижні</td>
                  <td style={td}>500–900 $</td>
                </tr>
                <tr>
                  <td style={td}>Інтернет-магазин з оплатою</td>
                  <td style={td}>4–6 тижнів</td>
                  <td style={td}>1200–2300 $</td>
                </tr>
                <tr>
                  <td style={td}>Сервіс із кабінетами й ролями</td>
                  <td style={td}>6–10 тижнів</td>
                  <td style={td}>від 3000 $</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={section}>
          <h2 style={h2}>Як працюємо</h2>
          <ol style={ul}>
            <li style={li}>Розмова — що потрібно і навіщо</li>
            <li style={li}>Технічне завдання складаємо разом, безкоштовно</li>
            <li style={li}>Фіксована ціна і строк після підписання ТЗ</li>
            <li style={li}>Аванс 50%, робота, проміжні результати</li>
            <li style={li}>Приймання, решта оплати, передача доступів</li>
          </ol>
          <p style={{ margin: "10px 0 0" }}>
            Два раунди правок входять у ціну. Роботи поза межами ТЗ — за окремою домовленістю.
            Оплата безготівкова на рахунок ФОП у гривні за курсом НБУ на день виставлення рахунку, з рахунком і актом.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Скільки коштує утримання на місяць</h2>
          <ul style={ul}>
            <li style={li}>домен: від 8 доларів на рік</li>
            <li style={li}>хостинг: близько 20 доларів на місяць</li>
            <li style={li}>пошта для розсилок: безкоштовно до 3000 листів на місяць</li>
          </ul>
          <p style={{ margin: "10px 0 0" }}>
            Разом близько 21 долара на місяць. Платите напряму постачальникам, на свої
            акаунти — ми в цих платежах участі не беремо. Точні цифри рахуємо в технічному
            завданні: вони залежать від того, чи потрібна сайту база даних і скільки
            відвідувачів очікується.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Гарантія і супровід</h2>
          <p style={p}>
            Гарантія 30 днів: якщо після передачі щось працює не так, як домовлялися в
            технічному завданні, виправляємо безкоштовно. Нові побажання поза межами ТЗ — за
            окремою домовленістю.
          </p>
          <p style={{ margin: 0 }}>
            Постійного супроводу не ведемо: сайт зроблений так, щоб ви керували ним самі через
            адмінку.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Застосунок для телефона</h2>
          <p style={{ margin: 0 }}>
            Робимо у форматі PWA: сайт встановлюється на телефон з іконкою і працює офлайн, без
            публікації в App Store і Google Play.
          </p>
        </section>

        <div style={note}>
          <strong>Написати нам</strong>
          <p style={{ margin: "8px 0 0" }}>
            Назар Колодій · Львів<br />
            <a href="mailto:nazar@balabony.com" style={{ color: "#B5710C", fontWeight: 700 }}>nazar@balabony.com</a>
          </p>
          <a href="mailto:nazar@balabony.com?subject=%D0%97%D0%B0%D0%BF%D0%B8%D1%82%20%D1%89%D0%BE%D0%B4%D0%BE%20%D1%81%D0%B0%D0%B9%D1%82%D1%83" style={cta}>
            Написати листа
          </a>
        </div>
        </section>

        {/* ───────────── ENGLISH ───────────── */}
        <section id="en" style={{ marginTop: 56, paddingTop: 32, borderTop: "2px solid #d6d3d1" }}>
          <p style={tag}>Lviv, Ukraine · Remote · Registered sole proprietor</p>

          <h2 style={{ fontSize: "clamp(24px, 4.5vw, 30px)", fontWeight: 700, color: "#1c1917", margin: "0 0 10px" }}>
            Websites and web applications
          </h2>

          <p style={p}>
            We build websites end to end: brochure sites, landing pages, online shops, company
            sites, sites for NGOs, libraries and schools, catalogues, and platforms with user
            accounts.
          </p>
          <p style={p}>
            Built on Next.js — not a website builder, not a WordPress template. Pages load in
            about a second, work properly on a phone, are ready for Google, and meet WCAG
            accessibility standards.
          </p>

          <section style={section}>
            <h2 style={h2}>Our work</h2>
            <p style={p}>
              <a href="https://balabony.com" style={{ color: "#B5710C", fontWeight: 700 }}>balabony.com</a>
              {" "}— a Ukrainian reading platform: over 900 works, dashboards for authors,
              passwordless sign-in, payments, mailings, an installable phone app, and an admin
              area with 23 sections. PageSpeed 91, accessibility 100 out of 100.
            </p>
            <div style={note}>
              <strong>What a platform like this costs</strong>
              <p style={{ margin: "8px 0 0" }}>
                From 10,000 to 20,000 USD and at least six months of work. This is the most
                expensive category — a service with user accounts, payments and mailings. A
                brochure site at 300 USD and a platform like this are different jobs, which is
                why we quote after the specification, not over the phone.
              </p>
            </div>
          </section>

          <section style={section}>
            <h2 style={h2}>What is included</h2>
            <ul style={ul}>
              <li style={li}>a design made for you, not a stock template</li>
              <li style={li}>responsive layout for phone and tablet</li>
              <li style={li}>an admin area: you edit text, news and photos yourself</li>
              <li style={li}>SEO setup and Google Analytics</li>
              <li style={li}>contact forms, map, social links</li>
              <li style={li}>online payments for shops</li>
              <li style={li}>user accounts, roles and mailings for larger projects</li>
              <li style={li}>help with the domain and hosting</li>
            </ul>
          </section>

          <section style={section}>
            <h2 style={h2}>What you get</h2>
            <ul style={ul}>
              <li style={li}>a finished site on your own domain</li>
              <li style={li}>admin access with your own login</li>
              <li style={li}>the source code in your repository</li>
              <li style={li}>hosting and database accounts registered in your name</li>
              <li style={li}>a short guide to the admin area</li>
              <li style={li}>a video call walkthrough on your own site, for as long as it takes</li>
              <li style={li}>an invoice and a completion certificate</li>
            </ul>
            <p style={{ margin: "10px 0 0" }}>
              The site is entirely yours. You are not tied to us — any other developer can pick
              it up.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2}>Timelines and prices</h2>
            <p style={p}>We quote exactly after the specification. As a guide:</p>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
                <thead>
                  <tr>
                    <th style={th}>Type of site</th>
                    <th style={th}>Time</th>
                    <th style={th}>Guide price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={td}>Brochure site, 3–5 pages</td>
                    <td style={td}>5–7 days</td>
                    <td style={td}>250–350 USD</td>
                  </tr>
                  <tr>
                    <td style={td}>Organisation site with admin area</td>
                    <td style={td}>2–3 weeks</td>
                    <td style={td}>500–900 USD</td>
                  </tr>
                  <tr>
                    <td style={td}>Online shop with payments</td>
                    <td style={td}>4–6 weeks</td>
                    <td style={td}>1200–2300 USD</td>
                  </tr>
                  <tr>
                    <td style={td}>Service with accounts and roles</td>
                    <td style={td}>6–10 weeks</td>
                    <td style={td}>from 3000 USD</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section style={section}>
            <h2 style={h2}>How we work</h2>
            <ol style={ul}>
              <li style={li}>A conversation — what you need and why</li>
              <li style={li}>We write the specification together, at no cost</li>
              <li style={li}>A fixed price and deadline once the specification is agreed</li>
              <li style={li}>50% up front, then the work, with progress shown as we go</li>
              <li style={li}>Handover, final payment, all access transferred</li>
            </ol>
            <p style={{ margin: "10px 0 0" }}>
              Two rounds of revisions are included. Anything outside the specification is agreed
              separately. Payment by bank transfer to a registered Ukrainian sole proprietor,
              with an invoice and a completion certificate.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2}>Running costs</h2>
            <ul style={ul}>
              <li style={li}>domain: from 8 USD a year</li>
              <li style={li}>hosting: around 20 USD a month</li>
              <li style={li}>transactional email: free up to 3000 messages a month</li>
            </ul>
            <p style={{ margin: "10px 0 0" }}>
              Around 21 USD a month in total, paid directly to the providers on your own
              accounts. Exact figures are set in the specification: they depend on whether the
              site needs a database and how much traffic you expect.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2}>Warranty and support</h2>
            <p style={p}>
              Thirty days warranty: anything that does not work as agreed in the specification is
              fixed at no charge. New requests beyond the specification are agreed separately.
            </p>
            <p style={{ margin: 0 }}>
              We do not offer ongoing maintenance contracts. The site is built so that you run it
              yourself through the admin area.
            </p>
          </section>

          <section style={section}>
            <h2 style={h2}>Phone app</h2>
            <p style={{ margin: 0 }}>
              We build it as a PWA: the site installs on a phone with its own icon and works
              offline, without publishing to the App Store or Google Play.
            </p>
          </section>

          <div style={note}>
            <strong>Get in touch</strong>
            <p style={{ margin: "8px 0 0" }}>
              Nazar Kolodiy · Lviv, Ukraine<br />
              <a href="mailto:nazar@balabony.com" style={{ color: "#B5710C", fontWeight: 700 }}>nazar@balabony.com</a>
            </p>
            <a href="mailto:nazar@balabony.com?subject=Website%20enquiry" style={cta}>
              Send an email
            </a>
          </div>
        </section>
      </article>
    </main>
  );
}
