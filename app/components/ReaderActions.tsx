import type { ReactNode } from 'react'

/**
 * Панель дій під текстом серії.
 *
 * НАВІЩО, рішення Богдана 16.09.2026. Під текстом стояло п'ять окремих
 * обведених елементів підряд — «стежити», «відгук», зміст сезону,
 * «зберегти», «поділитись» — і всі золоті. Золото на сайті означає дію,
 * тож коли ним пофарбовано все, воно перестає щось означати: читач не
 * бачить, що з цього головне, і найчастіше не робить нічого.
 *
 * Тепер золото лишається за єдиною дією, що веде ДАЛІ (наступна серія в
 * EpisodeNav), а всі прохання ДО читача зібрані сюди, в одну тиху коробку
 * з однаковими кнопками. Золотим усередині панелі стає лише те, що вже
 * зроблено: «ви стежите», «збережено», «відгук враховано».
 *
 * Серверний компонент: сам нічого не робить, лише розкладає готові кнопки
 * по сітці. Логіка й стани лишаються в самих кнопках, їх не чіпали.
 * Вигляд задає app/globals.css (класи .ra-*) — інакше довелося б правити
 * інлайн-стилі в чотирьох файлах, які використовуються ще й на інших
 * сторінках, де їхній нинішній вигляд правильний.
 */

export default function ReaderActions({
  follow,
  bookmark,
  review,
  share,
  legend = 'Щоб не загубити',
}: {
  /** «Стежити за серіалом» — на всю ширину, головна дія панелі. */
  follow?: ReactNode
  bookmark?: ReactNode
  review?: ReactNode
  share?: ReactNode
  legend?: string
}) {
  if (!follow && !bookmark && !review && !share) return null

  return (
    <section className="ra" aria-label="Дії з серією">
      <div className="ra-legend">{legend}</div>

      <div className="ra-grid">
        {follow && <div className="ra-wide">{follow}</div>}
        {bookmark && <div className="ra-cell">{bookmark}</div>}
        {review && <div className="ra-cell">{review}</div>}
      </div>

      {share && <div className="ra-share">{share}</div>}
    </section>
  )
}
