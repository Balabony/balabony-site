// FILE: components/FooterLegalSection.tsx
// НЕ замінює ваш футер. Це ДОДАТКОВА секція з реквізитами ФОП + посиланнями,
// яку треба вставити у наявний components/Footer.tsx ПОРЯД з блоком «Про Балабонів».
// Імпорт у Footer:  import { FooterLegalSection } from "@/components/FooterLegalSection";
// і вставити <FooterLegalSection /> усередині футера.

import Link from "next/link";

export function FooterLegalSection() {
  return (
    <div className="grid gap-8 text-sm text-stone-300 md:grid-cols-3">
      {/* Блок «Реквізити» */}
      <div>
        <h3 className="mb-2 font-semibold text-stone-100">Реквізити</h3>
        <p className="leading-relaxed">
          Платежі обробляє
          <br />
          ФОП Хомин Ігор Іванович
          <br />
          РНОКПП: 2552710170
          <br />
          Адреса: Україна, 79069, м. Львів,
          <br />
          вул. Шевченка Т., буд. 338, кв. 143
          <br />
          Платник єдиного податку 2 групи
        </p>
      </div>

      {/* Блок «Звʼязок» */}
      <div>
        <h3 className="mb-2 font-semibold text-stone-100">Звʼязок</h3>
        <p className="leading-relaxed">
          Email:{" "}
          <a className="underline hover:text-white" href="mailto:nazar@balabony.com">
            nazar@balabony.com
          </a>
          <br />
          WhatsApp:{" "}
          <a className="underline hover:text-white" href="tel:+380505859141">
            +380 50 585 91 41
          </a>
        </p>
      </div>

      {/* Блок «Юридичні документи» */}
      <div>
        <h3 className="mb-2 font-semibold text-stone-100">Юридичні документи</h3>
        <ul className="space-y-1">
          <li><Link className="underline hover:text-white" href="/legal/offer">Публічна оферта</Link></li>
          <li><Link className="underline hover:text-white" href="/legal/privacy">Політика конфіденційності</Link></li>
          <li><Link className="underline hover:text-white" href="/legal/refund">Правила повернення коштів</Link></li>
          <li><Link className="underline hover:text-white" href="/contacts">Контакти</Link></li>
          <li><Link className="underline hover:text-white" href="/about">Про автора</Link></li>
        </ul>
      </div>
    </div>
  );
}

/*
================================================================================
SITEMAP — додати нові route'и у app/sitemap.ts (приклад). Якщо файлу нема — створіть.
================================================================================

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://balabony.com";
  const now = new Date();
  return [
    { url: `${base}/`,                 lastModified: now },
    { url: `${base}/about`,            lastModified: now },   // НОВЕ
    { url: `${base}/contacts`,         lastModified: now },   // НОВЕ
    { url: `${base}/legal/offer`,      lastModified: now },
    { url: `${base}/legal/privacy`,    lastModified: now },
    { url: `${base}/legal/refund`,     lastModified: now },   // НОВЕ
    // ...решта наявних сторінок
  ];
}

================================================================================
ПЕРЕВІРКА 404: на 404-сторінці (app/not-found.tsx) кнопки «Контакти» / «Про автора»
мають вести на <Link href="/contacts"> та <Link href="/about">, а не назад на 404.
================================================================================
*/
