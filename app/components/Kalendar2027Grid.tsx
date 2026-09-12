import {
  YEAR, MONTHS, WEEKDAYS_SHORT, WEEKDAYS_FULL, monthWeeks, isWeekendColumn,
} from '@/lib/kalendar-2027-sitka'

/**
 * Сітка календаря 2027 у HTML.
 *
 * Свідомо не картинка: таблиця індексується, читається екранним читачем
 * і не тягне вагу. PDF лишається окремою кнопкою — він для друку,
 * а це для перегляду з телефона.
 *
 * ВАЖЛИВО про стилі. Тут єдиний <style> з класами, а не інлайнові
 * style={{…}} на кожній клітинці, як на решті сторінок сайту. Причина
 * рахована, не смакова: у сітці 427 клітинок, інлайнові стилі дали б
 * ~37 КБ HTML, і стільки ж удруге в RSC-навантаженні, бо Next віддає
 * і розмітку, і потік. З класами — 4 КБ. Сітка стоїть на чотирьох
 * сторінках, тож різниця помітна.
 *
 * Розмітка — справжні <table> з <caption>: для календаря це семантично
 * правильний елемент, і скринрідер оголошує місяць.
 */

const CSS = `
.k27{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem;margin:1.25rem 0 2rem}
.k27 table{background:#14253B;border:1px solid rgba(255,255,255,.08);border-radius:10px;
  border-collapse:separate;border-spacing:0;padding:.7rem .6rem .8rem;width:100%;
  font-size:.9rem;color:#FFF8EE}
.k27 caption{font-family:'Lora',Georgia,serif;color:#FAC775;font-size:1.02rem;
  text-align:left;padding:0 .2rem .5rem;caption-side:top}
.k27 th{font-weight:400;font-size:.76rem;padding:0 0 .3rem;text-align:center;color:#8CA0B8}
.k27 td{text-align:center;padding:.22rem 0;font-variant-numeric:tabular-nums;color:#FFF8EE}
.k27 .w{color:#FAC775}
.k27 .e{color:transparent}
`

export default function Kalendar2027Grid() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="k27">
        {MONTHS.map((name, mi) => (
          <table key={name}>
            <caption>{name} {YEAR}</caption>
            <thead>
              <tr>
                {WEEKDAYS_SHORT.map((d, i) => (
                  <th key={d} scope="col" abbr={WEEKDAYS_FULL[i]}
                      className={isWeekendColumn(i) ? 'w' : undefined}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthWeeks(YEAR, mi).map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, ci) => (
                    <td key={ci}
                        className={day === null ? 'e' : isWeekendColumn(ci) ? 'w' : undefined}>
                      {day ?? ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </>
  )
}
