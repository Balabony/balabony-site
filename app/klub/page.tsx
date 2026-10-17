import type { Metadata } from 'next'
import KlubForm from './KlubForm'

/**
 * /klub — Клуб Балабонів (17.10.2026).
 * Мета для реклами Google Ad Grants: змістовна конверсія «вступ до клубу» (klub).
 * ПЕРЕВАГИ ПИСАТИ ЛИШЕ РЕАЛЬНІ. Подарунок календарів 2027 активним членам —
 * рішення Богдана 17.10.2026. Нових обіцянок без його згоди не додавати.
 */

const NAVY = '#0E1A2B'
const CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_L = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#B8C6D8'
const LINE = 'rgba(255,255,255,.1)'
const SERIF = "'Lora', Georgia, serif"
const SANS = "'Montserrat', Arial, sans-serif"

const TITLE = 'Клуб Балабонів — спільнота читачів і авторів української прози'
const DESC = 'Безкоштовний клуб для тих, хто читає й пише українською: нові історії щотижня, перші новини конкурсів, а найактивнішим членам — подарунковий календар 2027.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com/klub' },
  openGraph: { title: TITLE, description: DESC, url: 'https://balabony.com/klub', siteName: 'Balabony', locale: 'uk_UA', type: 'website', images: ['https://balabony.com/klub/balabon-klub.webp'] },
}

const BENEFITS: { icon: string; title: string; text: string }[] = [
  { icon: '📖', title: 'Нові історії щотижня', text: 'Лист клубу з найкращими новими історіями й серіями — обирати, що почитати ввечері, більше не доведеться.' },
  { icon: '🏆', title: 'Першими про конкурси', text: 'Умови нових літературних конкурсів, дедлайни й переможців ви дізнаєтеся раніше за всіх.' },
  { icon: '🎁', title: 'Календар 2027 у подарунок', text: 'Найактивнішим членам клубу — і читачам, і авторам — даруємо друкований календар «Балабони» на 2027 рік.' },
  { icon: '✍️', title: 'Для авторів', text: 'Анонси конкурсів із призами, нагоди опублікуватися й поради редакції — щоб ваші тексти знайшли своїх читачів.' },
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Скільки коштує членство?', a: 'Нічого. Клуб безкоштовний — і для читачів, і для авторів.' },
  { q: 'Як часто приходитимуть листи?', a: 'Зазвичай раз на тиждень. Відписатися можна будь-коли одним кліком у листі.' },
  { q: 'Хто вважається активним членом?', a: 'Той, хто читає й дочитує історії, лишає відгуки авторам, бере участь у конкурсах. Саме їм ми даруємо календарі.' },
  { q: 'Я пишу. Чи можна опублікуватися?', a: 'Так. Подайте заявку на сторінці «Стати автором» або візьміть участь у конкурсі — посилання нижче.' },
]

const h2: React.CSSProperties = { fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(1.4rem, 3.2vw, 1.9rem)', color: GOLD_L, margin: '0 0 1rem' }

export default function KlubPage() {
  return (
    <main style={{ background: NAVY, minHeight: '100vh', color: CREAM, fontFamily: SANS }}>
      <section style={{ padding: '56px 20px 40px', background: `radial-gradient(ellipse at 70% 0%, rgba(239,159,39,.18), transparent 60%), ${NAVY}` }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: '2.2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'start' }}>
          <div>
            <p style={{ margin: 0, color: GOLD, fontWeight: 700, letterSpacing: '.08em', fontSize: '.9rem' }}>БЕЗКОШТОВНО · ДЛЯ ЧИТАЧІВ І АВТОРІВ</p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 'clamp(2rem, 5vw, 3.1rem)', lineHeight: 1.15, margin: '.7rem 0 1rem' }}>
              Клуб Балабонів
            </h1>
            <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: CREAM, margin: '0 0 1rem', maxWidth: '34ch' }}>
              Спільнота тих, хто читає й пише українською. Сучасні історії з життя від понад сотні українських авторів — щотижня у вашій пошті.
            </p>
            <p style={{ color: MUTED, lineHeight: 1.6, margin: 0, maxWidth: '40ch' }}>
              Найактивнішим членам клубу даруємо друкований календар «Балабони» на 2027 рік.
            </p>
            <img
              src="/klub/balabon-klub-600.webp"
              srcSet="/klub/balabon-klub-600.webp 600w, /klub/balabon-klub.webp 1200w"
              sizes="(max-width: 700px) 90vw, 420px"
              width={600} height={600}
              alt="Балабон — усміхнений золотий дзвоник із планшетом, навколо українські літери. Клуб Балабонів: читаємо українське"
              style={{ display: 'block', width: '100%', maxWidth: 420, height: 'auto', borderRadius: 18, marginTop: '1.4rem', border: `1px solid ${LINE}` }}
            />
          </div>
          <div id="vstup" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 16, padding: '1.5rem 1.3rem' }}>
            <h2 style={{ ...h2, fontSize: '1.4rem', margin: '0 0 1rem' }}>Вступити до клубу</h2>
            <KlubForm />
          </div>
        </div>
      </section>

      <section style={{ padding: '40px 20px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <h2 style={h2}>Що дає членство</h2>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))' }}>
            {BENEFITS.map((b) => (
              <li key={b.title} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem 1.1rem' }}>
                <div aria-hidden="true" style={{ fontSize: '1.8rem' }}>{b.icon}</div>
                <h3 style={{ margin: '.5rem 0 .4rem', fontSize: '1.12rem', color: GOLD_L }}>{b.title}</h3>
                <p style={{ margin: 0, color: MUTED, lineHeight: 1.6 }}>{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section style={{ padding: '20px 20px 40px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <a href="/stories" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Почитати зараз →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Життєві історії, сімейні, про кохання, смішні — майже тисяча творів українською.</p>
          </a>
          <a href="/konkursy" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Літературні конкурси →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Конкурси для авторів із грошовими призами та публікацією.</p>
          </a>
          <a href="/become-author" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Стати автором →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Публікуйте свої історії й знаходьте читачів.</p>
          </a>
        </div>
      </section>

      <section style={{ padding: '20px 20px 80px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 style={h2}>Питання й відповіді</h2>
          {FAQ.map((f) => (
            <details key={f.q} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '.7rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1.05rem' }}>{f.q}</summary>
              <p style={{ margin: '.6rem 0 0', color: MUTED, lineHeight: 1.6 }}>{f.a}</p>
            </details>
          ))}
          <p style={{ marginTop: '1.6rem', textAlign: 'center' }}>
            <a href="#vstup" style={{ display: 'inline-block', background: GOLD, color: '#2a1a02', fontWeight: 800, textDecoration: 'none', padding: '.9rem 1.6rem', borderRadius: 10, fontSize: '1.1rem' }}>
              Вступити до клубу
            </a>
          </p>
          <p style={{ color: MUTED, fontSize: '.9rem', textAlign: 'center', marginTop: '1.4rem' }}>
            Balabony — проєкт ГО «Інститут громадянського суспільства» (Львів).
          </p>
        </div>
      </section>
    </main>
  )
}
