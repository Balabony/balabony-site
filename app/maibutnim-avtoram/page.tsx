// 10.11.2026: сторінка для студентів і молодих авторів: перша публікація на Balabony
// та практика в редакції газет «Життя» (оформлює ТОВ «Кінокомпанія Життя»).
// Повний опис практики — на сайті ЛОГО «ІГС»: https://lvivdim.com/praktyka/
import type { Metadata } from 'next'
import ProtectedEmail from '@/app/components/ProtectedEmail'
import Breadcrumbs from '@/app/components/Breadcrumbs'

const GOLD = 'var(--accent-gold)'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', serif"
const TITLE = 'Майбутнім авторам і журналістам: практика й перша публікація — Balabony™'
const DESC = 'Практика для студентів-журналістів і філологів у редакції газет «Життя» у Львові та перша публікація ваших творів на платформі Balabony. Як подати заявку.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/maibutnim-avtoram' },
  openGraph: {
    type: 'website', url: 'https://balabony.com/maibutnim-avtoram', title: TITLE, description: DESC,
    images: [{ url: 'https://balabony.com/images/praktykantka-redaktsiia-zhyttia.jpg', width: 1000, height: 1333 }],
    locale: 'uk_UA', siteName: 'Balabony™',
  },
}

function Card({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? id + '-h' : undefined} style={{ background: '#0f1e3a', border: `1.5px solid ${GOLD}`, borderRadius: 16, padding: '26px 26px' }}>
      <h2 id={id ? id + '-h' : undefined} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontFamily: FONT, margin: '0 0 16px' }}>{title}</h2>
      {children}
    </section>
  )
}
function Item({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, marginTop: 5 }}><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#ef9f27" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{children}</span>
    </li>
  )
}
const P = { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, margin: '0 0 14px' } as const
const A = { color: GOLD, fontWeight: 700 } as const

export default function MaibutnimAvtoramPage() {
  return (
    <main style={{ background: '#0a1628', padding: '48px 20px 100px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Майбутнім авторам і журналістам' }]} />

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: GOLD, fontFamily: FONT, marginBottom: 12 }}>Для студентів і молодих авторів</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: '#f5f0e8', margin: '0 0 14px', lineHeight: 1.2 }}>Майбутнім авторам і журналістам</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, margin: 0 }}>
            Хочете писати для людей, а не «в шухляду»? Почніть з першої публікації на Balabony або пройдіть практику в редакції літературних газет «Життя», «Життя. Історії» та «Життєві історії», які читають по всій Україні.
          </p>
        </div>

        <figure style={{ margin: '0 0 32px' }}>
          <img src="/images/praktykantka-redaktsiia-zhyttia.jpg" alt="Практикантка в редакції читає свіжий номер газети «Життя»; на столі розкладені газети редакції" width={1000} height={1333} loading="eager" style={{ display: 'block', width: '100%', maxWidth: 460, height: 'auto', margin: '0 auto', borderRadius: 14 }} />
          <figcaption style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>Практика в редакції газети «Життя»</figcaption>
        </figure>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card id="praktyka" title="Практика в редакції «Життя»">
            <p style={P}>Студенти журналістики, філології та всі, хто хоче писати, проходять у нас практику щороку з 2020 року. Що ви робитимете:</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
              <Item>готуватимете до друку справжні історії читачів: редагування, коректура, заголовки;</Item>
              <Item>писатимете власні матеріали та інтерв’ю;</Item>
              <Item>побачите, як газету верстають і доставляють передплатникам через Укрпошту;</Item>
              <Item>працюватимете з Balabony: публікація творів, доступні формати, аудіоверсії.</Item>
            </ul>
            <p style={P}>Найкращі матеріали надрукуємо з вашим підписом. Практику офіційно оформлює <strong>ТОВ «Кінокомпанія Життя»</strong>: договір з університетом, щоденник практики, характеристика й відгук керівника.</p>
            <p style={{ ...P, margin: 0 }}>
              <strong>Як подати заявку.</strong> Напишіть на{' '}
              <ProtectedEmail user="hello" domain="olbo.com.ua" subject="Практика" style={{ color: GOLD, fontWeight: 700, textDecoration: 'underline' }} />{' '}
              з темою «Практика»: ім’я, де навчаєтеся (заклад, факультет, курс), коли потрібна практика, що вас цікавить, 1–2 посилання на ваші тексти. Відповімо протягом тижня. Докладніше — на{' '}
              <a href="https://lvivdim.com/praktyka/" style={A}>сторінці практики</a>.
            </p>
          </Card>

          <Card id="persha-publikatsiia" title="Перша публікація на Balabony">
            <p style={P}>Пишете оповідання, казки чи серіал? Редакція прочитає ваш твір і, якщо він підходить, опублікує на платформі, де його побачать читачі. Зараз платформа безкоштовна, виплат авторам поки немає: умови на сторінці «Стати автором».</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <Item><a href="/become-author" style={A}>Стати автором</a>: як подати першу історію.</Item>
              <Item><a href="/konkursy" style={A}>Літературні конкурси</a>: можна взяти участь без кабінету автора.</Item>
              <Item><a href="/pravopys/studentam" style={A}>Правопис для студентів</a>: правила, які варто знати кожному, хто пише.</Item>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  )
}
