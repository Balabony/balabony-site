import type { Metadata } from 'next'
import Link from 'next/link'
import Kalendar2027Grid from '../../components/Kalendar2027Grid'

const NAVY   = '#0E1A2B'
const GOLD   = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM  = '#FFF8EE'
const MUTED  = '#8CA0B8'
const LINE   = 'rgba(255,255,255,.08)'
const SERIF  = "'Lora', Georgia, serif"
const SANS   = "'Montserrat', Arial, sans-serif"

const TITLE = 'Дитячий календар 2027 роздрукувати — А4, безкоштовно'
const DESC  = 'Дитячий календар на 2027 рік українською з рудим кошеням: 12 місяців на аркуші А4, вихідні червоним. Скачати PDF безкоштовно й роздрукувати вдома.'
const PDF   = '/kalendar-2027/kalendar-2027-dytiachyi-a4.pdf'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/kalendar-2027/dytiachyi' },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: 'https://balabony.com/kalendar-2027/dytiachyi',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
    images: ['https://balabony.com/kalendar-2027/prev-dytiachyi.webp'],
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

export default function DytiachyiPage() {
  return (
    <main style={{ background: NAVY, minHeight: '100vh', padding: '40px 20px 88px', fontFamily: SANS, color: CREAM }}>
      <div style={{ maxWidth: 820, margin: '0 auto', lineHeight: 1.7 }}>

        <nav aria-label="Хлібні крихти" style={{ fontSize: '.85rem', color: MUTED, marginBottom: '1rem' }}>
          <Link href="/" style={{ color: MUTED }}>Головна</Link>
          {' → '}
          <Link href="/kalendar-2027" style={{ color: MUTED }}>Календар 2027</Link>
          {' → '}
          <span style={{ color: CREAM }}>Дитячий</span>
        </nav>

        <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(1.45rem,4.2vw,2rem)', color: GOLD_L, fontWeight: 400, margin: '0 0 .8rem' }}>
          Дитячий календар на 2027 рік роздрукувати
        </h1>

        <p style={{ fontSize: '1.05rem' }}>
          Календар для дитячої кімнати, кухні або холодильника: дванадцять місяців, вихідні виділені червоним, збоку — руде кошеня, яке дивиться просто на вас.
        </p>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/kalendar-2027/prev-dytiachyi.webp"
          alt="Дитячий календар на 2027 рік з рудим кошеням, формат А4"
          width={1200}
          height={848}
          fetchPriority="high"
          style={{ width: '100%', maxWidth: "100%", height: 'auto', borderRadius: 10, background: '#fff',
                   border: `1px solid ${LINE}`, display: 'block', margin: '1.2rem 0' }}
        />

        <a href={PDF} download style={dl}>Скачати PDF (А4)</a>
        <p style={{ color: MUTED, fontSize: '.88rem', margin: '0 0 .4rem' }}>
          Формат А4, альбомна орієнтація. 134 КБ.
        </p>

        <h2 style={h2}>Чому саме з котом</h2>
        <p>
          Кошеня тут не прикраса, а причина підійти. До календаря, який просто висить, дитина не підходить; до календаря з котом — підходить і рахує дні до дня народження.
        </p>
        <p>
          Червоні вихідні — перше, що дитина навчається читати в календарі: ось два дні, коли не треба в школу. Далі стають зрозумілі тижні, потім місяці.
        </p>

        <h2 style={h2}>Куди повісити</h2>
        <p>
          Формат альбомний, тому аркуш добре сідає на дверцята холодильника під магніт, на бічну стінку кухонної шафи або на пробкову дошку над письмовим столом. Біля кухні краще заламінувати або вкласти у файл — папір швидко береться плямами.
        </p>

        <h2 style={h2}>Цифри тут дрібніші</h2>
        <p>
          Половину аркуша займає кіт, тому сітка менша, ніж у макеті на одному аркуші. Для дитячої кімнати цього досить, але якщо календар потрібен для роботи або людині зі слабким зором — беріть варіант без картинки.
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
