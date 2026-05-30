// FILE: app/legal/author-contract/page.tsx
// Серверний компонент. Публічна сторінка-пояснення (без оприлюднення самого договору й персональних даних).
// Стиль як на інших /legal сторінках (темна тема + кремовий блок).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Договір з автором — Balabony",
  description:
    "Контент платформи Balabony використовується на законних підставах — на основі ліцензійного договору з автором творів.",
  alternates: { canonical: "https://balabony.com/legal/author-contract" },
  openGraph: {
    title: "Договір з автором — Balabony",
    description:
      "Контент платформи Balabony використовується на законних підставах — на основі ліцензійного договору з автором творів.",
    url: "https://balabony.com/legal/author-contract",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

export default function AuthorContractPage() {
  return (
    <main className="min-h-screen bg-[#161412] px-4 py-12 md:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl bg-[#f6f1e7] px-6 py-10 text-stone-800 shadow-xl md:px-12 md:py-14">
        <h1 className="text-3xl font-bold text-stone-900 md:text-4xl">Договір з автором</h1>
        <p className="mt-2 text-sm text-stone-500">Редакція від 29 травня 2026 року · Версія 1.0</p>

        <p className="mt-6">
          Увесь літературний та аудіоконтент, доступ до якого надається на
          платформі balabony.com (тексти, оповідання, серії історій українською
          мовою та їхні аудіоверсії), використовується на законних підставах.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Правова підстава використання</h2>
          <p>
            Право на відтворення, розповсюдження та надання платного й
            безоплатного доступу до творів отримане отримувачем платежів —
            <strong> ФОП Хомин Ігор Іванович</strong> — на підставі укладеного
            ліцензійного договору з автором творів. Договір передбачає надання
            ліцензії на використання творів у межах діяльності платформи
            balabony.com, із зазначенням авторства та дотриманням особистих
            немайнових прав автора.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Авторські права</h2>
          <p>
            Особисті немайнові права на твори належать їхньому автору. Майнові
            права використовуються платформою в обсязі, визначеному ліцензійним
            договором, відповідно до Закону України «Про авторське право і
            суміжні права». Будь-яке копіювання, відтворення чи розповсюдження
            творів третіми особами без дозволу правовласника заборонене.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Запити щодо прав</h2>
          <p>
            З питань авторських прав, ліцензування або використання контенту
            звертайтеся на{" "}
            <a className="text-amber-800 underline hover:text-amber-900" href="mailto:nazar@balabony.com">
              nazar@balabony.com
            </a>
            . Документи, що підтверджують правомірність використання творів,
            надаються на запит уповноважених осіб та платіжних партнерів.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Повʼязані документи</h2>
          <ul className="space-y-1">
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/offer">Публічна оферта</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/privacy">Політика конфіденційності</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/legal/refund">Правила повернення коштів</Link></li>
            <li><Link className="text-amber-800 underline hover:text-amber-900" href="/contacts">Контакти</Link></li>
          </ul>
        </section>
      </article>
    </main>
  );
}
