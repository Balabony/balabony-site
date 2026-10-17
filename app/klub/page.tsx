import type { Metadata } from 'next'
import KlubForm from './KlubForm'
import KlubIcon from './KlubIcon'
import { CONTESTS, prizeFund, isOpen } from '@/lib/contests'

// Статус конкурсів (прийом триває / скоро / завершено) оновлюється щогодини.
export const revalidate = 3600

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

const BENEFITS: { icon: 'lyst' | 'konkurs' | 'kalendar' | 'avtor' | 'znachok' | 'chytannia'; title: string; text: string }[] = [
  { icon: 'lyst', title: 'Нові історії щотижня', text: 'Лист клубу з найкращими новими історіями й серіями — обирати, що почитати ввечері, більше не доведеться.' },
  { icon: 'konkurs', title: 'Першими про конкурси', text: 'Умови нових літературних конкурсів, дедлайни й переможців ви дізнаєтеся раніше за всіх.' },
  { icon: 'kalendar', title: 'Календар 2027 у подарунок', text: 'Щороку в грудні найактивнішим членам клубу — і читачам, і авторам — даруємо друкований календар «Балабони».' },
  { icon: 'znachok', title: 'Значок члена клубу', text: 'Фірмовий значок Клубу Балабонів у вашому кабінеті на сайті — з відкриттям передплати наприкінці листопада 2026.' },
  { icon: 'chytannia', title: '3 закриті історії щомісяця', text: 'Члени клубу щомісяця читають безкоштовно три історії, доступні за передплатою, — з відкриттям передплати наприкінці листопада 2026.' },
  { icon: 'avtor', title: 'Для авторів', text: 'Анонси конкурсів із призами, нагоди опублікуватися й поради редакції — щоб ваші тексти знайшли своїх читачів.' },
]


const RULES: { t: string; items: string[] }[] = [
  { t: '1. Хто може вступити', items: [
    'Будь-хто, хто читає чи пише українською. Членство безкоштовне — потрібні лише ім\u2019я та пошта.',
    'Особам, молодшим за 14 років, — лише за згодою батьків.',
  ] },
  { t: '2. Що дає членство', items: [
    'Лист клубу з новими історіями й серіями — зазвичай раз на тиждень.',
    'Першими — умови нових конкурсів і їхні переможці.',
    'Значок члена клубу в кабінеті та три закриті історії щомісяця безкоштовно — з відкриттям передплати наприкінці листопада 2026.',
    'Щороку в грудні найактивнішим членам клубу — друкований календар «Балабони» у подарунок.',
  ] },
  { t: '3. Хто вважається активним', items: [
    'Читач: читає й дочитує історії, лишає відгуки авторам, розповідає про Балабони та історії в соцмережах.',
    'Автор: публікує твори на Балабонах, бере участь у конкурсах, розповідає про них у соцмережах.',
    'Найактивніших редакція обирає щороку в грудні й повідомляє листом. Адресу для доставки просимо лише в них; доставка Укрпоштою — за рахунок редакції.',
  ] },
  { t: '4. Обов\u2019язки члена клубу', items: [
    'Поважати інших читачів і авторів: відгуки — без образ, мови ворожнечі й переходу на особистості.',
    'Дописувати й розповідати історії — ті, що трапилися у вашому житті, або ті, про які ви чули.',
    'Не видавати чужі тексти за свої.',
    'Не створювати кілька акаунтів і не накручувати прочитання чи відгуки.',
    'Вказувати справжню пошту — на неї приходять листи клубу й повідомлення про подарунки.',
  ] },
  { t: '5. Коли членство припиняється', items: [
    'За вашим бажанням — кнопка «Відписатися» в будь-якому листі клубу.',
    'Рішенням редакції за образи, спам, плагіат чи накрутки — після попередження листом.',
  ] },
  { t: '6. Ваші дані', items: [
    'Ім\u2019я та пошту використовуємо лише для листів клубу й повідомлень про подарунки й не передаємо третім особам.',
    'Клуб веде ЛОГО «Інститут громадянського суспільства». Деталі — у Політиці конфіденційності.',
  ] },
  { t: '7. Зміни правил', items: [
    'Про зміни повідомляємо в листі клубу щонайменше за 14 днів.',
  ] },
]

const FAQ: { q: string; a: string }[] = [
  { q: 'Скільки коштує членство?', a: 'Нічого. Клуб безкоштовний — і для читачів, і для авторів.' },
  { q: 'Як часто приходитимуть листи?', a: 'Зазвичай раз на тиждень. Відписатися можна будь-коли одним кліком у листі.' },
  { q: 'Хто вважається активним членом?', a: 'Той, хто читає й дочитує історії, лишає відгуки авторам, розповідає про Балабони та історії в соцмережах, бере участь у конкурсах. Саме їм щогрудня даруємо календарі.' },
  { q: 'Я пишу. Чи можна опублікуватися?', a: 'Так. Подайте заявку на сторінці «Стати автором» або візьміть участь у конкурсі — посилання нижче.' },
]


const MONTHS = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня']
function d(iso: string): string {
  const [y, m, dd] = iso.split('-').map(Number)
  return `${dd} ${MONTHS[m - 1]}${y !== 2026 ? ` ${y}` : ''}`
}
function contestStatus(c: (typeof CONTESTS)[number]): { label: string; color: string } {
  const today = new Date().toISOString().slice(0, 10)
  if (isOpen(c)) return { label: `Прийом до ${d(c.closesAt)}`, color: '#22c55e' }
  if (today < c.opensAt) return { label: `Прийом з ${d(c.opensAt)}`, color: '#FAC775' }
  if (c.stages.resultsAt && today <= c.stages.resultsAt) return { label: `Підсумки ${d(c.stages.resultsAt)}`, color: '#B8C6D8' }
  return { label: 'Завершено', color: '#8CA0B8' }
}

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
                <KlubIcon kind={b.icon} />
                <h3 style={{ margin: '.5rem 0 .4rem', fontSize: '1.12rem', color: GOLD_L }}>{b.title}</h3>
                <p style={{ margin: 0, color: MUTED, lineHeight: 1.6 }}>{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="konkursy" style={{ padding: '10px 20px 30px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <h2 style={h2}>Наші конкурси</h2>
          <p style={{ color: MUTED, margin: '-.4rem 0 1.1rem', lineHeight: 1.6 }}>
            Літературні конкурси Балабонів із грошовими призами. Члени клубу дізнаються про нові конкурси й переможців першими.
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {CONTESTS.map((c) => {
              const st = contestStatus(c)
              return (
                <li key={c.id}>
                  <a href={`/konkursy/${c.id}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box', background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.1rem 1.1rem 1.2rem', color: CREAM, textDecoration: 'none' }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: '.8rem', fontWeight: 700, color: st.color, border: `1px solid ${st.color}`, borderRadius: 999, padding: '.15rem .6rem' }}>{st.label}</span>
                    <strong style={{ fontFamily: SERIF, fontWeight: 400, fontSize: '1.2rem', margin: '.6rem 0 .3rem', color: GOLD_L }}>{c.name}</strong>
                    <span style={{ color: MUTED, lineHeight: 1.55, flex: 1 }}>{c.tagline}</span>
                    <span style={{ marginTop: '.7rem', fontWeight: 800, color: GOLD, fontSize: '1.05rem' }}>Призовий фонд {prizeFund(c)}</span>
                    <span style={{ marginTop: '.3rem', color: CREAM, fontSize: '.95rem' }}>Умови й подача →</span>
                  </a>
                </li>
              )
            })}
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
          <a href="/kalendar-2027" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Календар 2027 — PDF →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Роздрукуйте український календар на 2027 рік безкоштовно.</p>
          </a>
          <a href="/pilga" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Пільга 1 ₴ на рік →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Для ВПО, ветеранів і людей з інвалідністю — повний доступ за 1 ₴.</p>
          </a>
          <a href="/become-author" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem', color: CREAM, textDecoration: 'none' }}>
            <strong style={{ color: GOLD, fontSize: '1.1rem' }}>Стати автором →</strong>
            <p style={{ margin: '.4rem 0 0', color: MUTED }}>Публікуйте свої історії й знаходьте читачів.</p>
          </a>
        </div>
      </section>

      <section style={{ padding: '20px 20px 80px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h2 id="pravyla" style={h2}>Правила клубу</h2>
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: '1.2rem 1.3rem', marginBottom: '2rem' }}>
            {RULES.map((r) => (
              <div key={r.t} style={{ marginBottom: '1rem' }}>
                <h3 style={{ margin: '0 0 .4rem', fontSize: '1.05rem', color: GOLD_L }}>{r.t}</h3>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: MUTED, lineHeight: 1.65 }}>
                  {r.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>

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
            Balabony — проєкт ЛОГО «Інститут громадянського суспільства» (Львів).
          </p>
        </div>
      </section>
    </main>
  )
}
