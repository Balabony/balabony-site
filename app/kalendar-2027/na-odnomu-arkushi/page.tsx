import type { Metadata } from 'next'
import Link from 'next/link'
import Kalendar2027Grid from '../../components/Kalendar2027Grid'

/**
 * Два безкартинкові макети на одній сторінці — горизонтальний і
 * вертикальний. Окремої адреси під вертикальний немає навмисно: за
 * «вертикальний календар» майже не шукають, а друга майже однакова
 * сторінка тільки розмивала б вагу першої. Скачуються вони при цьому
 * нарізно, кожен своєю кнопкою.
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

const TITLE = 'Календар 2027 на одному аркуші А4 — роздрукувати'
const DESC  = 'Календар на 2027 рік українською на одному аркуші А4: два макети — альбомний і книжковий, 12 місяців, вихідні червоним. Скачати PDF безкоштовно.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/kalendar-2027/na-odnomu-arkushi' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: 'https://balabony.com/kalendar-2027/na-odnomu-arkushi',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: ['https://balabony.com/kalendar-2027/prev-na-odnomu-arkushi.webp'],
  },
}

const h2: React.CSSProperties = {
  fontFamily: SERIF, fontSize: '1.28rem', color: GOLD_L,
  fontWeight: 400, margin: '2.1rem 0 .6rem',
}

const dl: React.CSSProperties = {
  display: 'inline-block', background: GOLD, color: '#2a1a02',
  borderRadius: 8, padding: '.75rem 1.6rem', fontSize: '1.05rem',
  fontWeight: 600, textDecoration: 'none', margin: '.4rem 0 .5rem',
}

const box: React.CSSProperties = {
  background: CARD, border: `1px solid ${LINE}`, borderRadius: 12,
  padding: '1rem 1.1rem 1.2rem', margin: '1.1rem 0',
}

export default function NaOdnomuArkushiPage() {
  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '40px 20px 88px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto', lineHeight: 1.7 }}>

        <nav aria-label="Хлібні крихти" style={{ fontSize: '.85rem', color: MUTED, marginBottom: '1rem' }}>
          <Link href="/" style={{ color: MUTED }}>Головна</Link>
          {' → '}
          <Link href="/kalendar-2027" style={{ color: MUTED }}>Календар 2027</Link>
          {' → '}
          <span style={{ color: CREAM }}>На одному аркуші</span>
        </nav>

        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.45rem,4.2vw,2rem)', color: GOLD_L, fontWeight: 400, margin: '0 0 .8rem' }}>
          Календар на 2027 рік на одному аркуші А4
        </h1>

        <p style={{ fontSize: '1.05rem' }}>
          Увесь 2027 рік на одному аркуші, без жодної картинки: дванадцять
          місяців, тижні починаються з понеділка, неділі червоні. Два макети —
          альбомний і книжковий. Скачуються окремо, беріть той, що пасує
          вашому місцю.
        </p>

        {/* ── Альбомний ─────────────────────────────────────── */}
        <div style={box}>
          <h2 style={{ ...h2, margin: '0 0 .6rem' }}>Альбомний — лежачий аркуш</h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kalendar-2027/prev-na-odnomu-arkushi.webp"
            alt="Календар на 2027 рік на одному аркуші А4, альбомна орієнтація"
            width={1200}
            height={848}
            fetchPriority="high"
            style={{ width: '100%', height: 'auto', borderRadius: 8, background: '#fff', display: 'block', margin: '0 0 1rem' }}
          />

          <p style={{ margin: '0 0 .6rem' }}>
            Дванадцять місяців у чотири колонки. Цифри тут найбільші з усіх
            наших макетів — аркуш читається з двох-трьох метрів, тому його вішають
            не лише над столом, а й на стіну кабінету, у майстерні чи в класі.
          </p>

          <a href="/kalendar-2027/kalendar-2027-na-odnomu-arkushi-a4.pdf" download style={dl}>
            Скачати PDF — альбомний
          </a>
          <p style={{ color: MUTED, fontSize: '.88rem', margin: 0 }}>
            А4, альбомна орієнтація. 42 КБ.
          </p>
        </div>

        {/* ── Книжковий ─────────────────────────────────────── */}
        <div style={box}>
          <h2 style={{ ...h2, margin: '0 0 .6rem' }}>Книжковий — стоячий аркуш</h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kalendar-2027/prev-vertykalnyi.webp"
            alt="Календар на 2027 рік на аркуші А4 книжкової орієнтації"
            width={880}
            height={1245}
            loading="lazy"
            style={{ width: '100%', maxWidth: 460, height: 'auto', borderRadius: 8, background: '#fff', display: 'block', margin: '0 0 1rem' }}
          />

          <p style={{ margin: '0 0 .6rem' }}>
            Той самий рік у три колонки. Є місця, куди альбомний аркуш просто
            не стає: простінок між вікнами, бічна стінка стелажа, дверцята
            вузької шафи, дошка оголошень у під&apos;їзді. Це також природний
            формат для офісного принтера: друкується без перемикання орієнтації.
          </p>

          <a href="/kalendar-2027/kalendar-2027-vertykalnyi-a4.pdf" download style={dl}>
            Скачати PDF — книжковий
          </a>
          <p style={{ color: MUTED, fontSize: '.88rem', margin: 0 }}>
            А4, книжкова орієнтація. 38 КБ.
          </p>
        </div>

        <h2 style={h2}>Який із двох брати</h2>
        <p>
          Вибирайте за формою місця, а не за розміром шрифту: різниця в цифрах
          між ними невелика — 14,9 проти 13,8 пункта. Якщо стіна широка, беріть
          альбомний; якщо місце вузьке — книжковий.
        </p>

        <h2 style={h2}>Друк і збільшення</h2>
        <p>
          Обидва файли зроблені в InDesign і лишилися векторними: у них не
          картинка з цифрами, а самі цифри. Тому той самий аркуш можна
          надрукувати на А3 — краї лишаться різкими, без сходинок. І віддати
          в друкарню, якщо схочете тираж на щільному папері.
        </p>
        <p>
          У вікні друку виберіть <strong>А4</strong>, потрібну орієнтацію й
          масштаб <strong>100% (Фактичний розмір)</strong>. Якщо поставити
          «Вмістити на сторінку», сітка зменшиться й з&apos;явиться біла рамка.
        </p>

        <h2 style={h2}>Календар 2027 повністю</h2>
        <Kalendar2027Grid />

        <p style={{ marginTop: '1.6rem' }}>
          <Link href="/kalendar-2027" style={{ color: GOLD }}>Ще макети календаря 2027 і літературні дати →</Link>
          <span style={{ color: MUTED }}>{'  ·  '}</span>
          <Link href="/kalendar" style={{ color: GOLD }}>Настінний календар-планер А3 →</Link>
        </p>

        <p style={{ color: MUTED, fontSize: '.88rem', marginTop: '1.8rem' }}>
          Календарі безкоштовні для особистого користування. Перепродаж і
          розміщення файлів на інших сайтах заборонені.
        </p>
      </div>
    </main>
  )
}
