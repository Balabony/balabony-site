import type { Metadata } from 'next'

/**
 * Як підписати авторський договір.
 *
 * ЧОМУ ЦЯ СТОРІНКА З'ЯВИЛАСЯ. Станом на 13.09.2026 з 24 договорів
 * підписаний був ОДИН. Автор, який єдиний написав про це, описав так:
 * «Дія в ноутбуці приймала мій підпис, але далі нічого і нікуди не
 * посилалось». Він мав рацію — і портал Дії, і czo.gov.ua лише
 * створюють файл підпису. Забрати його й донести до нас має сама людина.
 * Стара інструкція про це не казала, тому автори підписували й чекали.
 *
 * Через це тут ГОЛОВНЕ — не перелік порталів, а третій крок. Він
 * винесений окремим блоком, а не пунктом у списку.
 *
 * Шрифт великий навмисно: більшість авторів платформи — люди старшого
 * віку, і найстаршому з тих, хто вже впав на цій інструкції, 70 років.
 */

export const metadata: Metadata = {
  title: 'Як підписати договір · Балабони',
  description:
    'Покрокова інструкція, як підписати авторський договір Балабонів кваліфікованим електронним підписом через Дію, ЦЗО або застосунок банку.',
}

const INK = '#16202e'
const MUTED = '#4a5a72'
const LINE = '#d8dee8'
const GOLD = '#b26f00'
const SANS = "'Montserrat', Arial, sans-serif"

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 26 }}>
      <div style={{
        flex: '0 0 auto', width: 38, height: 38, borderRadius: 19,
        background: '#f3f5f9', border: `1px solid ${LINE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, fontWeight: 700, color: INK,
      }}>
        {n}
      </div>
      <div style={{ minWidth: 0 }}>
        <h2 style={{ fontSize: 19, margin: '6px 0 8px', fontWeight: 700 }}>{title}</h2>
        <div style={{ fontSize: 17, lineHeight: 1.75, color: MUTED }}>{children}</div>
      </div>
    </div>
  )
}

export default function HowToSignPage() {
  return (
    <main style={{ background: '#ffffff', color: INK, minHeight: '60vh', padding: '28px 18px 72px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', fontFamily: SANS }}>

        <a href="/author/dashboard" style={{
          display: 'inline-block', fontSize: 15, color: '#2c3a52', textDecoration: 'none',
          border: `1px solid ${LINE}`, borderRadius: 8, padding: '9px 16px', marginBottom: 24,
        }}>
          ← Кабінет
        </a>

        <h1 style={{ fontSize: 28, margin: '0 0 10px', fontWeight: 700, lineHeight: 1.3 }}>
          Як підписати авторський договір
        </h1>

        <p style={{ fontSize: 17.5, lineHeight: 1.75, color: MUTED, margin: '0 0 26px' }}>
          Договір підписують кваліфікованим електронним підписом (КЕП). Ключ
          лишається у вас — ми його не бачимо й ніколи не просимо.
        </p>

        <div style={{
          background: '#fff8ec', border: '1px solid #f0d9a8', borderRadius: 12,
          padding: '16px 18px', marginBottom: 30,
        }}>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.75 }}>
            <b>Найважливіше.</b> Ні Дія, ні czo.gov.ua нічого нам не надсилають.
            Вони лише створюють файл підпису. Після підписання цей файл треба
            зберегти на свій комп’ютер і завантажити в кабінеті — інакше договір
            лишиться непідписаним, хоч на екрані й буде написано «Документ підписано».
          </p>
        </div>

        <Step n={1} title="Збережіть договір у PDF">
          Відкрийте свій договір у кабінеті й натисніть «Зберегти як PDF»
          (або Ctrl+P → «Зберегти як PDF»). Отриманий файл і буде тим документом,
          який ви підписуєте.
        </Step>

        <Step n={2} title="Підпишіть файл">
          <p style={{ margin: '0 0 10px' }}>Підходить будь-який із трьох способів:</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: 22 }}>
            <li style={{ marginBottom: 6 }}>
              <b>Через Дію.</b> Відкрийте{' '}
              <a href="https://ca.diia.gov.ua/sign" target="_blank" rel="noopener noreferrer"
                 style={{ color: GOLD, fontWeight: 700 }}>ca.diia.gov.ua/sign</a>,
              оберіть «Дія.Підпис», додайте свій PDF і підтвердіть підпис
              у застосунку Дія на телефоні.
            </li>
            <li style={{ marginBottom: 6 }}>
              <b>Ключем із файлу або токена.</b>{' '}
              <a href="https://czo.gov.ua/sign" target="_blank" rel="noopener noreferrer"
                 style={{ color: GOLD, fontWeight: 700 }}>czo.gov.ua/sign</a>.
            </li>
            <li>
              <b>У застосунку свого банку</b>, якщо він видає КЕП.
            </li>
          </ul>
        </Step>

        <Step n={3} title="Заберіть файл із підписом — це той крок, який усі пропускають">
          <p style={{ margin: '0 0 10px' }}>
            Коли з’явиться напис «Документ підписано», на сторінці буде кнопка
            <b> «Завантажити файл з підписом»</b>. Натисніть її і збережіть файл.
          </p>
          <p style={{ margin: 0 }}>
            Файл має розширення <b>.p7s</b> (іноді .asice або підписаний PDF).
            Якщо ви його не завантажили — підпису у вас на руках немає, і
            надіслати нам нічого.
          </p>
        </Step>

        <Step n={4} title="Завантажте файл у кабінеті">
          Поверніться до{' '}
          <a href="/author/dashboard" style={{ color: GOLD, fontWeight: 700 }}>кабінету</a>,
          знайдіть свій договір, натисніть «Підписати КЕП», оберіть збережений
          файл і натисніть «Надіслати підпис». Після цього договір одразу стане
          підписаним — ви побачите це на екрані.
        </Step>

        <div style={{
          marginTop: 34, paddingTop: 18, borderTop: `1px solid ${LINE}`,
          fontSize: 16.5, lineHeight: 1.75, color: MUTED,
        }}>
          <p style={{ margin: '0 0 10px' }}>
            <b style={{ color: INK }}>Якщо щось не виходить</b> — напишіть на{' '}
            <a href="mailto:nazar@balabony.com" style={{ color: GOLD, fontWeight: 700 }}>
              nazar@balabony.com
            </a>{' '}
            і додайте файл підпису до листа. Оформимо самі.
          </p>
          <p style={{ margin: 0 }}>
            Підписання нічого не коштує. Термінових строків теж немає — договір
            чекає стільки, скільки потрібно.
          </p>
        </div>
      </div>
    </main>
  )
}
