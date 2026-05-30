// FILE: app/contacts/page.tsx
// Серверний компонент (без "use client") — контент видно без JS і без авторизації.
// Стиль: темна тема + кремовий контентний блок, як на /legal/offer і /legal/privacy.
// Якщо у вас є готовий wrapper для legal-сторінок — обгорніть контент у нього і приберіть локальні класи.

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

export default function ContactsPage() {
  return (
    <main className="min-h-screen bg-[#161412] px-4 py-12 md:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl bg-[#f6f1e7] px-6 py-10 text-stone-800 shadow-xl md:px-12 md:py-14">
        <h1 className="text-3xl font-bold text-stone-900 md:text-4xl">Контакти</h1>
        <p className="mt-3 text-lg text-stone-600">
          Платіжні питання, технічна підтримка, співпраця, авторські запити —
          пишіть на email або у WhatsApp.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Звʼязатися з нами</h2>
          <ul className="space-y-2">
            <li>
              <strong>Email:</strong>{" "}
              <a className="text-amber-800 underline hover:text-amber-900" href="mailto:nazar@balabony.com">
                nazar@balabony.com
              </a>
            </li>
            <li>
              <strong>WhatsApp / Telegram:</strong>{" "}
              <a className="text-amber-800 underline hover:text-amber-900" href="tel:+380505859141">
                +380 50 585 91 41
              </a>
            </li>
            <li>
              <strong>Час відповіді:</strong> зазвичай протягом 1–2 робочих днів.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            Реквізити отримувача платежів
          </h2>
          <p className="mb-2">Платежі на платформі обробляє:</p>
          <ul className="space-y-1">
            <li><strong>ФОП Хомин Ігор Іванович</strong></li>
            <li><strong>РНОКПП:</strong> 2552710170</li>
            <li><strong>Адреса:</strong> Україна, 79069, м. Львів, вул. Шевченка Т., буд. 338, кв. 143</li>
            <li><strong>Система оподаткування:</strong> платник єдиного податку 2 групи</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">
            Партнер з освітньої та благодійної діяльності
          </h2>
          <p className="mb-2">
            Інклюзивна частина платформи (безкоштовний доступ для дітей ВПО,
            ветеранів УБД, людей з інвалідністю) реалізується у партнерстві з:
          </p>
          <ul className="space-y-1">
            <li><strong>Львівська обласна громадська організація «Інститут громадянського суспільства»</strong></li>
            <li><strong>ЄДРПОУ:</strong> 33951844</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Юридичні документи</h2>
          <ul className="space-y-1">
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/offer">Публічна оферта</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/privacy">Політика конфіденційності</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/refund">Правила повернення коштів</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/author-contract">Договір з автором</Link></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
