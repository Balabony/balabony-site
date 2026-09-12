import type { Metadata } from 'next'
import Link from 'next/link'
import Kalendar2027Grid from '../components/Kalendar2027Grid'
import LiteraryDates2027 from '../components/LiteraryDates2027'

/**
 * /kalendar-2027 — безкоштовні макети календаря на 2027 у PDF.
 *
 * Розведення з /kalendar (продаж А3 за 550 грн) за наміром пошуку:
 * тут «роздрукувати А4 безкоштовно», там «купити настінний планер».
 * Тому тут ніде немає слова «планер», а внизу стоїть перехід на продаж.
 *
 * Кнопки скачування — тільки на внутрішніх сторінках. З головної ведемо
 * «Докладніше»: три тижні на індексацію внутрішніх сторінок важливіші
 * за пару зекономлених кліків.
 *
 * Літературні дати стоять тільки тут — на підсторінках їх немає, щоб
 * чотири адреси не виглядали копіями одна одної.
 */

const NAVY   = '#0E1A2B'
const CARD   = '#14253B'
const GOLD   = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM  = '#FFF8EE'
const MUTED  = '#8CA0B8'
const LINE   = 'rgba(255,255,255,.08)'
const SERIF  = "'Lora', Georgia, serif"
const SANS   = "'Montserrat', Arial, sans-serif"

const TITLE = 'Календар 2027 роздрукувати українською — А4, безкоштовно'
const DESC  = 'Календар на 2027 рік українською: три макети А4 у PDF — альбомний, книжковий і дитячий. Скачати безкоштовно й роздрукувати вдома на звичайному принтері.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/kalendar-2027' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: 'https://balabony.com/kalendar-2027',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: ['https://balabony.com/kalendar-2027/prev-na-odnomu-arkushi.webp'],
  },
}

const LAYOUTS = [
  {
    href: '/kalendar-2027/na-odnomu-arkushi',
    img: '/kalendar-2027/thumb-na-odnomu-arkushi.webp',
    alt: 'Календар на 2027 рік на одному аркуші А4, альбомна орієнтація',
    name: 'На одному аркуші',
    text: 'Два макети без картинок — альбомний і книжковий. Найбільші цифри, скачуються окремо.',
    w: 480, h: 339,
  },
  {
    href: '/kalendar-2027/dytiachyi',
    img: '/kalendar-2027/thumb-dytiachyi.webp',
    alt: 'Дитячий календар на 2027 рік з рудим кошеням, формат А4',
    name: 'Дитячий, з котиком',
    text: 'Той самий рік, тільки з рудим кошеням збоку. Для дитячої кімнати або на холодильник.',
    w: 480, h: 339,
  },
]

const h2: React.CSSProperties = {
  fontFamily: SERIF, fontSize: '1.3rem', color: GOLD_L,
  fontWeight: 400, margin: '2.2rem 0 .7rem',
}

export default function Kalendar2027Page() {
  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '40px 20px 88px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 900, margin: '0 auto', lineHeight: 1.7 }}>

        <nav aria-label="Хлібні крихти" style={{ fontSize: '.85rem', color: MUTED, marginBottom: '1rem' }}>
          <Link href="/" style={{ color: MUTED }}>Головна</Link>
          {' → '}
          <span style={{ color: CREAM }}>Календар 2027</span>
        </nav>

        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.5rem,4.2vw,2.1rem)', color: GOLD_L, fontWeight: 400, margin: '0 0 .8rem' }}>
          Календар на 2027 рік українською — роздрукувати безкоштовно
        </h1>

        <p style={{ fontSize: '1.05rem' }}>
          Календар на 2027 рік українською — три готові макети на двох сторінках. Усі формат А4,
          файли PDF, друкуються на домашньому принтері без полів і без обрізання.
          Скачування без реєстрації.
        </p>

        <h2 style={h2}>Макети на вибір</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.1rem' }}>
          {LAYOUTS.map((l, idx) => (
            <article key={l.href} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '.85rem' }}>
              <Link href={l.href} style={{ display: 'block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={l.img}
                  alt={l.alt}
                  width={l.w}
                  height={l.h}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  style={{ width: '100%', height: 'auto', borderRadius: 8, background: '#fff', display: 'block' }}
                />
              </Link>
              <h3 style={{ fontFamily: SERIF, color: GOLD_L, fontWeight: 400, fontSize: '1.08rem', margin: '.7rem 0 .35rem' }}>
                {l.name}
              </h3>
              <p style={{ margin: '0 0 .7rem', fontSize: '.95rem' }}>{l.text}</p>
              <Link href={l.href} style={{ color: GOLD, fontWeight: 500 }}>Докладніше →</Link>
            </article>
          ))}
        </div>

        <h2 style={h2}>Як роздрукувати</h2>
        <p>
          Скачайте PDF і відкрийте його у звичайній переглядачці. У вікні друку
          виберіть <strong>А4</strong>, орієнтацію — ту, що зазначена на сторінці
          макета, і масштаб <strong>100% (Фактичний розмір)</strong>. Якщо
          поставити «Вмістити на сторінку», сітка зменшиться й з&apos;явиться біла рамка.
        </p>

        <h2 style={h2}>Що врахували в сітці</h2>
        <p>
          Тижні починаються з понеділка, як прийнято в Україні. Неділі виділені
          червоним, суботи — на світлій плашці, тому вихідні видно з першого
          погляду. Назви місяців і днів українською, без скорочень, які треба
          розгадувати.
        </p>
        <p>
          2027 рік починається в п&apos;ятницю й закінчується в п&apos;ятницю. Це рік
          невисокосний, 365 днів.
        </p>

        <h2 style={h2}>Календар 2027 повністю</h2>
        <Kalendar2027Grid />

        <h2 style={h2}>Літературний календар: дати українських письменників</h2>
        <p>
          Двадцять дев&apos;ять днів, які варто знати тому, хто читає українською:
          народження й відходи людей, чиї книжки склали нашу літературу. Кожну
          дату звірено за трьома незалежними джерелами й подано за новим стилем.
          Дні, щодо яких джерела не сходяться, до списку не потрапили.
        </p>
        <LiteraryDates2027 />

        <h2 style={h2}>Календар-планер 2027 на стіну</h2>
        <p>
          Календар-планувальник на 2027 рік — це вже не аркуш, а друковане
          видання: формат А3, 15 сторінок на пружині, поле для нотаток на кожен
          місяць, державні й церковні свята та дати українських письменників.{' '}
          <Link href="/kalendar" style={{ color: GOLD }}>Подивитися →</Link>
        </p>

        <p style={{ color: MUTED, fontSize: '.88rem', marginTop: '2.2rem' }}>
          Календарі безкоштовні для особистого користування. Перепродаж і
          розміщення файлів на інших сайтах заборонені.
        </p>
      </div>
    </main>
  )
}
