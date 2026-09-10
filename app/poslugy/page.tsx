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
    "Створення сайтів під ключ: візитка, лендінг, інтернет-магазин, сайт громадської організації, портал з особистими кабінетами. Next.js, адмінка, доступність, PWA. Львів і вся Україна.",
  alternates: { canonical: "https://balabony.com/poslugy" },
  openGraph: {
    title: "Розробка сайтів і вебдодатків — Львів",
    description:
      "Сайти під ключ на Next.js: адмінка, доступність, швидкість. Ціна після технічного завдання.",
    url: "https://balabony.com/poslugy",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

const h2: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1c1917", margin: "0 0 10px" };
const section: React.CSSProperties = { marginTop: 28 };
const p: React.CSSProperties = { margin: "0 0 14px" };
const ul: React.CSSProperties = { margin: "0 0 6px", paddingLeft: 20 };
const li: React.CSSProperties = { margin: "0 0 6px" };
const tag: React.CSSProperties = { fontSize: 13, color: "#78716c", letterSpacing: "0.5px", margin: "0 0 16px" };
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
        <p style={tag}>Львів і вся Україна · Дистанційно · ФОП</p>

        <h1 style={{ fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 700, color: "#1c1917", margin: 0 }}>
          Розробка сайтів і вебдодатків
        </h1>

        <section style={section}>
          <p style={p}>
            Створюю сайти під ключ: сайт-візитка, лендінг, інтернет-магазин, сайт компанії,
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
              з особистими кабінетами, платежами й розсилками. Сайт-візитка за 12 тисяч гривень
              і така платформа — різні задачі. Саме тому ціну я називаю після технічного
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
            <li style={li}>навчання по відеозв&apos;язку: показую все на вашому сайті, поки не стане зрозуміло</li>
            <li style={li}>рахунок і акт виконаних робіт</li>
          </ul>
          <p style={{ margin: "10px 0 0" }}>
            Сайт ваш повністю. Ви не прив&apos;язані до мене: будь-який інший розробник зможе його
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
                  <td style={td}>12–18 тис. грн</td>
                </tr>
                <tr>
                  <td style={td}>Сайт організації з адмінкою</td>
                  <td style={td}>2–3 тижні</td>
                  <td style={td}>25–45 тис. грн</td>
                </tr>
                <tr>
                  <td style={td}>Інтернет-магазин з оплатою</td>
                  <td style={td}>4–6 тижнів</td>
                  <td style={td}>60–120 тис. грн</td>
                </tr>
                <tr>
                  <td style={td}>Сервіс із кабінетами й ролями</td>
                  <td style={td}>6–10 тижнів</td>
                  <td style={td}>від 150 тис. грн</td>
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
            Оплата безготівкова на рахунок ФОП, з рахунком і актом.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Скільки коштує утримання на місяць</h2>
          <ul style={ul}>
            <li style={li}>домен: від 400 грн на рік — це близько 35 грн на місяць</li>
            <li style={li}>хостинг: близько 20 доларів на місяць</li>
            <li style={li}>пошта для розсилок: безкоштовно до 3000 листів на місяць</li>
          </ul>
          <p style={{ margin: "10px 0 0" }}>
            Разом приблизно 850–900 грн на місяць. Платите напряму постачальникам, на свої
            акаунти — я в цих платежах не беру участі. Точні цифри рахуємо в технічному
            завданні: вони залежать від того, чи потрібна сайту база даних і скільки
            відвідувачів очікується.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Гарантія і супровід</h2>
          <p style={p}>
            Гарантія 30 днів: якщо після передачі щось працює не так, як домовлялися в
            технічному завданні, виправляю безкоштовно. Нові побажання поза межами ТЗ — за
            окремою домовленістю.
          </p>
          <p style={{ margin: 0 }}>
            Постійного супроводу не веду: сайт зроблений так, щоб ви керували ним самі через
            адмінку.
          </p>
        </section>

        <section style={section}>
          <h2 style={h2}>Застосунок для телефона</h2>
          <p style={{ margin: 0 }}>
            Роблю у форматі PWA: сайт встановлюється на телефон з іконкою і працює офлайн, без
            публікації в App Store і Google Play.
          </p>
        </section>

        <div style={note}>
          <strong>Написати або зателефонувати</strong>
          <p style={{ margin: "8px 0 0" }}>
            Богдан Хомин · Львів<br />
            <a href="tel:+380505859141" style={{ color: "#B5710C", fontWeight: 700 }}>+380 50 585 9141</a>
            <br />
            <a href="mailto:nazar@balabony.com" style={{ color: "#B5710C", fontWeight: 700 }}>nazar@balabony.com</a>
          </p>
          <a href="mailto:nazar@balabony.com?subject=%D0%97%D0%B0%D0%BF%D0%B8%D1%82%20%D1%89%D0%BE%D0%B4%D0%BE%20%D1%81%D0%B0%D0%B9%D1%82%D1%83" style={cta}>
            Написати листа
          </a>
        </div>
      </article>
    </main>
  );
}
