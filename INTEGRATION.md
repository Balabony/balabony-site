# Інтеграція банерів — інструкція

Дата: 26.05.2026
Контекст: HANDOFF v45, варіанти 1+2+3 разом.

## Файли в комплекті

```
app/components/FreeBanner.tsx     ← Варіант 3 — тонкий банер під Hero
app/components/HowItWorks.tsx     ← Варіант 2 — блок «Як це працює»
app/components/FreeHero.tsx       ← Варіант 1 — Hero для /free (можна перевикористати)
app/free/page.tsx                 ← сама сторінка /free
```

---

## Крок 1. Скопіювати файли в репо

```
balabony/app/components/FreeBanner.tsx
balabony/app/components/HowItWorks.tsx
balabony/app/components/FreeHero.tsx
balabony/app/free/page.tsx
```

Жоден існуючий файл не перезаписується.

---

## Крок 2. Вставити на головну (`app/page.tsx`)

Потрібно додати **FreeBanner відразу під Hero**, а **HowItWorks між Hero-блоком і блоком серій**. Приблизно так:

```tsx
import FreeBanner from './components/FreeBanner'
import HowItWorks from './components/HowItWorks'
// ...решта імпортів

export default function HomePage() {
  return (
    <main>
      <HeroSection />          {/* існуючий Hero */}
      <FreeBanner />            {/* ← новий тонкий банер */}

      <HowItWorks />            {/* ← новий блок «Як це працює» (id="how-it-works") */}

      <ReaderSection />         {/* існуючі серії */}
      <PricingSection />        {/* існуючі тарифи */}
      {/* ...решта */}
    </main>
  )
}
```

`FreeBanner` має CTA `href="#how-it-works"` — клік плавно скролить до блоку нижче. `scrollMarginTop: 80` вже виставлений у HowItWorks — якщо у тебе sticky-хедер вищий за 80px, поміняй у `app/components/HowItWorks.tsx`.

---

## Крок 3. Додати посилання на /free в Header і Footer

В `app/components/Header.tsx` десь поряд з іншими лінками:

```tsx
<Link href="/free" style={{ color: '#f0a500', fontWeight: 600 }}>
  Безкоштовно
</Link>
```

В футері — той самий лінк у списку навігації.

---

## Крок 4. Google Ads — змінити URL оголошень

В кампанії `Balabony - Donations - UA` (`campaignId 23870703726`) поміняти Final URL з головної на:

```
https://balabony.com/free
```

— тільки **після того, як деплой пройшов** і сторінка реально відкривається.

---

## Що пам'ятати на майбутнє

1. **CTA на FreeHero (`app/free/page.tsx`)** зараз веде на `/` (бо paywall ще не зроблений). Коли backend paywall буде готовий — поміняти `ctaHref` на потрібний роут (`/stories`, `/reader` тощо):

   ```tsx
   <FreeHero ctaHref="/stories" />
   ```

2. **Анімації** на сторінці є три (float, pulseGlow, shimmer). Всі вони вимикаються через `prefers-reduced-motion: reduce` — користувачі, які поставили цю опцію в системі, не побачать руху. Це accessibility-стандарт, не чіпай.

3. **Фірмові SVG-значки** (домик, закладка, годинник) намальовані у стилі `HomeIcon` з `Breadcrumbs.tsx` — `strokeWidth: 1.4`, `strokeLinejoin/Linecap: round`, `fill: none`. Якщо хочеш замінити — тримайся цих параметрів.

4. **Цифри словами** — «вісім», «сім», «сім» — як домовлено в HANDOFF (примітка №4). Не міняти на 8/7/7.

5. **«ЗАХОДЬ БЕЗ ОПЛАТИ.»** в тонкому банері — uppercase + золотом, як на скріні «НОВІ НАДХОДЖЕННЯ».

6. **На мобільному** тонкий банер може почати тиснути CTA — у `FreeBanner.tsx` уже є `@media (max-width: 560px)`, що зменшує паддінги. Якщо все одно зашироко — додай `flex-wrap: wrap` на самий банер.

---

## Швидкий чек-лист перед коммітом

- [ ] `npm run build` пройшов без помилок
- [ ] `/` відкривається, FreeBanner і HowItWorks видно
- [ ] Клік «Деталі ↓» на FreeBanner скролить до HowItWorks
- [ ] `/free` відкривається, всі три картки і CTA є
- [ ] Лінк «Безкоштовно» з'явився в Header і Footer
- [ ] Анімації працюють (підсвітки пульсують, домик плаває)
- [ ] На мобілці (DevTools, ~375px) нічого не зламано
- [ ] OpenGraph: `view-source:balabony.com/free` містить `og:title` і `og:description`

---

## Що **НЕ** зроблено цією зміною (як і обіцяно в HANDOFF)

- ❌ Backend paywall (`/api/pick`, таблиця `user_free_picks`, cookie-based user_id) — окрема задача
- ❌ FAQ на `/pricing` (Варіант 4) — окрема задача
- ❌ Реальна реєстрація через email — окрема задача
- ❌ Conversion tracking для Google Ads — окрема задача
