// FILE: app/about/page.tsx
// Серверний компонент. Закриває 404 на /about (кнопка на 404-екрані має вести сюди).

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Про автора — Balabony",
  description:
    "Богдан Хомин — засновник освітньо-літературної платформи Balabony, директор ТОВ «Кінокомпанія Життя», автор українськомовних історій.",
  alternates: { canonical: "https://balabony.com/about" },
  openGraph: {
    title: "Про автора — Balabony",
    description:
      "Богдан Хомин — засновник освітньо-літературної платформи Balabony, автор українськомовних історій.",
    url: "https://balabony.com/about",
    siteName: "Balabony",
    locale: "uk_UA",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#161412] px-4 py-12 md:py-16">
      <article className="mx-auto max-w-3xl rounded-2xl bg-[#f6f1e7] px-6 py-10 text-stone-800 shadow-xl md:px-12 md:py-14">
        <h1 className="text-3xl font-bold text-stone-900 md:text-4xl">Про автора</h1>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Богдан Хомин</h2>
          <p>
            Богдан Хомин — засновник освітньо-літературної платформи Balabony,
            директор ТОВ «Кінокомпанія Життя» (з 2011 року), автор серії історій
            українською мовою.
          </p>
          <p className="mt-3">
            9 років очолює медіа-проєкт, який видає чотири українськомовні газети
            загальним накладом 1,56 млн примірників на рік через Укрпошту. На
            основі цього досвіду створив Balabony — платформу, що поєднує сучасну
            українську прозу з аудіо-форматом і AI-тьюторингом для людей з
            обмеженим доступом до традиційного читання.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Місія Balabony</h2>
          <p>
            Платформа Balabony побудована на ідеї відновлення грамотності і
            повернення радості українського слова через літературу, аудіо та
            технології штучного інтелекту. Безкоштовний інклюзивний доступ
            надається дітям ВПО, ветеранам УБД, людям з інвалідністю, дітям зі
            звільнених громад — у партнерстві з Львівською обласною ГО «Інститут
            громадянського суспільства».
          </p>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Партнерська мережа</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>Львівська ОГО «Інститут громадянського суспільства» (ЄДРПОУ 33951844) — інклюзивна частина платформи</li>
            <li>Veteran Hub — ветеранська підтримка та реабілітація</li>
            <li>ICS Львів — інституційна підтримка</li>
            <li>Фонди ветеранської реабілітації</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Контакти автора</h2>
          <ul className="space-y-1">
            <li><strong>Email:</strong> nazar@balabony.com</li>
            <li><strong>Платформа:</strong> balabony.com</li>
          </ul>
        </section>
      </article>
    </main>
  );
}
