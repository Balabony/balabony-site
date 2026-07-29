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
          <h2 className="mb-3 text-xl font-semibold text-stone-900">Як нараховується винагорода автору</h2>
          <p>
            Винагорода авторові нараховується <strong>виключно за фактичні
            прочитання його власних творів</strong> на платформі, а не від факту
            оформлення передплати як такої. Кошти, сплачені читачем, розподіляються
            між авторами пропорційно до того, чиї саме твори цей читач прочитав, —
            тобто авторові надходить частка лише тоді й лише в обсязі, у якому
            читали саме його твори.
          </p>
          <p>
            Конкретні умови, ставки та порядок виплат визначаються індивідуальним
            ліцензійним договором між автором і отримувачем платежів і залежать від
            обраної автором моделі співпраці (зокрема наявності в автора статусу ФОП).
            Поштучна купівля окремого твору зараховується авторові цього твору.
          </p>
          <p>
            За доступ, наданий на пільгових або безоплатних умовах (зокрема
            пільговий доступ для відповідних категорій користувачів та безкоштовні
            прочитання), <strong>винагорода авторові не нараховується</strong>,
            оскільки такий доступ не формує доходу платформи.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold text-stone-900">Ставки винагороди</h2>
          <p className="mb-5">
            Ставки єдині для всіх авторів платформи й не є предметом окремих домовленостей.
            Ми публікуємо їх відкрито, щоб кожен автор бачив однакові умови.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[#e3dac6] bg-[#fffdf7] px-5 py-4">
              <p className="text-2xl font-bold text-[#7a4a06]">50%</p>
              <p className="mt-1 font-semibold text-stone-900">Автор — ФОП</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Половина доходу з ваших історій. Податки ви сплачуєте самостійно.
              </p>
            </div>

            <div className="rounded-xl border border-[#e3dac6] bg-[#fffdf7] px-5 py-4">
              <p className="text-2xl font-bold text-[#7a4a06]">40%</p>
              <p className="mt-1 font-semibold text-stone-900">Автор — фізична особа</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Сорок відсотків на руки. Податок на доходи фізичних осіб і військовий
                збір платформа сплачує понад цю суму власним коштом.
              </p>
            </div>
          </div>

          <h3 className="mb-2 mt-8 font-semibold text-stone-900">Як рахується сума</h3>
          <div className="rounded-xl border border-[#e3dac6] bg-[#fffdf7] px-5 py-4 text-sm leading-relaxed text-stone-700">
            Винагорода за період = (прочитання і прослуховування ваших творів ÷ усі
            прочитання і прослуховування на платформі) × дохід від передплати × ваша ставка.
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Дохід від передплати рахується після комісій платіжних систем і магазинів
            застосунків, тому сума в гривнях щомісяця різна. Внутрішні витрати платформи —
            утримання сайту, оплата праці, створення аудіо — з бази розрахунку не
            вираховуються.
          </p>

          <h3 className="mb-2 mt-8 font-semibold text-stone-900">Що зараховується</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-stone-700">
            <li>Прочитання — перегляд щонайменше 70% тексту, не частіше разу на добу від одного читача.</li>
            <li>Прослуховування — відтворення щонайменше 70% тривалості аудіо, за тим самим правилом.</li>
            <li>Про зміну цих правил ми повідомляємо авторів щонайменше за 30 днів.</li>
          </ul>

          <h3 className="mb-2 mt-8 font-semibold text-stone-900">Коли виплати</h3>
          <p className="text-sm leading-relaxed text-stone-700">
            Раз на місяць, за підсумком календарного місяця, протягом пʼяти днів, на рахунок,
            зазначений у кабінеті автора. Баланс нарахувань видно в кабінеті постійно.
            На початковому етапі роботи платформи суми можуть бути незначними.
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
