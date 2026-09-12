import type { Metadata } from 'next'
import Link from 'next/link'
import { POINTS } from '@/lib/points'
import { LEVELS } from '@/lib/levels'
import { REFERRAL_POINTS } from '@/lib/referral'
import { VOTE_COST } from '@/lib/voice-queue'
import { withPlural } from '@/lib/plural'
import { CALENDAR, EXPERT_LEVEL } from '@/lib/calendar-gift'

/**
 * /bonusy — бонусна програма.
 *
 * ГОЛОВНЕ ПРАВИЛО ЦІЄЇ СТОРІНКИ: тут написано ТІЛЬКИ те, що працює в коді
 * сьогодні. Попередній варіант сторінки не залили саме тому, що він описував
 * механіки, яких немає: витрачання балів на доступ (`gift_spend` оголошений
 * у lib/points.ts і не використовується), значки рівнів, «30 днів доступу за
 * приведеного», лічильник календарів. Обіцяти таке не можна — читач прийде
 * по обіцяне і не знайде.
 *
 * Якщо ці механіки з'являться в коді — тоді і тільки тоді дописувати сюди.
 *
 * Цифри тягнемо з тих самих модулів, що й решта сайту (POINTS, LEVELS,
 * REFERRAL_POINTS, CALENDAR), щоб сторінка не розійшлася з кодом після
 * першої ж правки ставок.
 */

const TITLE = 'Бонусна програма Балабонів — бали, рівні, подарунки'
const DESC  = 'Бали за читання, відгуки й запрошених читачів. Рівні читача, знижка на календар для «Знавця Балабонів» і подарунковий календар-планувальник на 2027 рік.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/bonusy' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: 'https://balabony.com/bonusy',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
  },
}

const NAVY   = '#0E1A2B'
const CARD   = '#14253B'
const GOLD   = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM  = '#FFF8EE'
const MUTED  = '#8CA0B8'
const LINE   = 'rgba(255,255,255,.08)'
const SERIF  = "'Lora', Georgia, serif"
const SANS   = "'Montserrat', Arial, sans-serif"

const h2: React.CSSProperties = {
  fontFamily: SERIF, fontSize: '1.32rem', color: GOLD_L,
  fontWeight: 400, margin: '2.2rem 0 .65rem',
}

const card: React.CSSProperties = {
  background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
  padding: '1rem 1.15rem', margin: '1rem 0',
}

export default function BonusyPage() {
  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '40px 20px 88px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 780, margin: '0 auto', lineHeight: 1.75 }}>

        <nav aria-label="Хлібні крихти" style={{ fontSize: '.85rem', color: MUTED, marginBottom: '1rem' }}>
          <Link href="/" style={{ color: MUTED }}>Головна</Link>
          {' → '}
          <span style={{ color: CREAM }}>Бонусна програма</span>
        </nav>

        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem,4.2vw,2.05rem)', color: GOLD_L, fontWeight: 400, margin: '0 0 .8rem' }}>
          Що Балабони дають за те, що ви тут
        </h1>

        <p style={{ fontSize: '1.05rem' }}>
          Замість того щоб платити за рекламу, ми дякуємо тим, хто читає сам і
          приводить читачів. Нижче — тільки те, що працює вже зараз: жодних
          обіцянок на майбутнє.
        </p>

        <h2 style={h2}>Бали</h2>
        <p>Нараховуються самі, нічого натискати не треба:</p>
        <div style={card}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            <li>прочитана серія — <b>{POINTS.read}</b></li>
            <li>читання кілька днів поспіль — <b>{POINTS.streak}</b></li>
            <li>відгук — <b>{POINTS.review}</b></li>
            <li>пройдене опитування — <b>{POINTS.survey}</b></li>
            <li>читач, який прийшов за вашим запрошенням — <b>{REFERRAL_POINTS.inviter}</b> вам і <b>{REFERRAL_POINTS.invited}</b> йому</li>
          </ul>
        </div>
        <p>
          Бали не згорають. За місяць зараховуємо не більш як 300 балів за
          читання і не більш як п&apos;ять відгуків — щоб ніхто не гортав каталог
          заради цифри.
        </p>

        <h2 style={h2}>Куди витратити бали</h2>
        <p>
          Наразі одне застосування, і воно справжнє:{' '}
          <Link href="/cherga" style={{ color: GOLD }}>черга на озвучення</Link>.
          Один голос коштує {VOTE_COST}&nbsp;балів.
          Читачі вирішують, які історії ми озвучимо першими, коли з&apos;являться
          кошти на запис.
        </p>

        <h2 style={h2}>Рівні</h2>
        <p>
          Рівень рахується з кількості <b>різних</b> прочитаних серій.
          Перечитане вдруге не додає нічого.
        </p>
        <div style={card}>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {LEVELS.map(l => (
              <li key={l.key}>
                {l.title}
                {l.min > 0
                  ? ` — від ${withPlural(l.min, 'серії', 'серій', 'серій')}`
                  : ' — на початку'}
              </li>
            ))}
          </ul>
        </div>
        <p style={{ color: MUTED, fontSize: '.95rem' }}>
          На платформі зараз понад дві сотні серій, тож усі рівні досяжні.
        </p>

        <h2 style={h2}>Знижка на друкований календар</h2>
        <p>
          Читачі рівня «{EXPERT_LEVEL.title}» купують наш настінний
          календар-планувальник на 2027 рік за <b>{CALENDAR.priceExpert} грн</b>{' '}
          замість {CALENDAR.price}. Знижка застосовується сама, коли ви увійшли
          в акаунт — просити нічого не треба.{' '}
          <Link href="/kalendar" style={{ color: GOLD }}>Подивитися календар →</Link>
        </p>

        <h2 style={h2}>Календар у подарунок</h2>
        <p>
          {CALENDAR.freeCount} примірників ми віддаємо безкоштовно тим, хто
          приводить на платформу читачів.
        </p>
        <div style={card}>
          <p style={{ margin: 0 }}>
            <b>Умова одна:</b> {CALENDAR.needYearly} приведені вами читачі
            оформили річну передплату — особисту або сімейну. Доставку
            оплачуємо ми.
          </p>
        </div>
        <p>
          Свій прогрес ви бачите в{' '}
          <Link href="/profile" style={{ color: GOLD }}>кабінеті</Link>: там
          написано, скільки приведених уже оформили річну передплату. Коли умову
          виконано, ми напишемо вам і попросимо адресу.
        </p>
        <p style={{ color: MUTED, fontSize: '.95rem' }}>
          Річна передплата, а не місячна, тому що подарунок вартістю в половину
          річної передплати має спиратися на щось співмірне. Місячну можна
          скасувати наступного тижня.
        </p>

        <h2 style={h2}>Як запросити читача</h2>
        <p>
          У{' '}
          <Link href="/profile" style={{ color: GOLD }}>кабінеті</Link> є ваше
          особисте посилання. Людина, яка перейшла за ним і зареєструвалася,
          закріплюється за вами. Посилання діє 90 днів від переходу — читач
          часто повертається не одразу.
        </p>
        <p style={{ color: MUTED, fontSize: '.95rem' }}>
          Власний код не зараховується, і закріплення відбувається один раз —
          це щоб бали не накручували самі собі.
        </p>

        <p style={{ color: MUTED, fontSize: '.88rem', marginTop: '2.4rem' }}>
          Умови можуть змінюватися. Уже нараховані бали й уже закріплені читачі
          при цьому не зникають.
        </p>
      </div>
    </main>
  )
}
