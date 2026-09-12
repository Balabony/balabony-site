import { MONTHS } from '@/lib/kalendar-2027-sitka'
import { LITERARY_DATES } from '@/lib/kalendar-2027'

/**
 * Літературні дати 2027 — 29 звірених днів народження і смерті
 * українських письменників.
 *
 * Стоїть лише на /kalendar-2027. На підсторінках свідомо немає: той
 * самий блок на чотирьох адресах — це рівно та причина, через яку
 * Google лишає в індексі одну сторінку з групи й називає решту копіями.
 *
 * Стилі — класами в одному <style>, з тієї самої причини, що й у сітці.
 */

const CSS = `
.ld27{margin:1.1rem 0 2rem}
.ld27 section{margin:0 0 1.15rem}
.ld27 h3{font-family:'Lora',Georgia,serif;color:#FAC775;font-weight:400;
  font-size:1.02rem;margin:0 0 .45rem;letter-spacing:.02em}
.ld27 ul{list-style:none;margin:0;padding:0}
.ld27 li{display:flex;gap:.7rem;padding:.4rem 0;border-top:1px solid rgba(255,255,255,.07)}
.ld27 .d{flex:0 0 2.1rem;text-align:right;color:#EF9F27;font-variant-numeric:tabular-nums;
  font-weight:600;line-height:1.5}
.ld27 .b{flex:1;min-width:0}
.ld27 .n{color:#FFF8EE}
.ld27 .t{color:#8CA0B8;font-size:.82rem;text-transform:uppercase;letter-spacing:.06em;
  margin-left:.45rem;white-space:nowrap}
.ld27 p{margin:.12rem 0 0;color:#B8C6D8;font-size:.92rem;line-height:1.55}
@media (min-width:640px){.ld27{columns:2;column-gap:2rem}
  .ld27 section{break-inside:avoid;display:inline-block;width:100%}}
`

export default function LiteraryDates2027() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ld27">
        {MONTHS.map((name, i) => {
          const days = LITERARY_DATES.filter(d => d.month === i + 1)
          if (!days.length) return null
          return (
            <section key={name}>
              <h3>{name}</h3>
              <ul>
                {days.map(d => (
                  <li key={`${d.month}-${d.day}-${d.who}-${d.what}`}>
                    <span className="d">{d.day}</span>
                    <span className="b">
                      <span className="n">{d.who}</span>
                      <span className="t">
                        {d.what === 'нар' ? 'народження' : 'пам’яті'}
                      </span>
                      <p>{d.note}</p>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}
