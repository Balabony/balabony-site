import Link from 'next/link'

/**
 * Рядок анонсів на головній (17.10.2026): Клуб, Календар 2027, Підтримати.
 * Більшість відвідувачів заходить через головну — тому сторінки, куди веде
 * реклама Ad Grants і де стаються змістовні конверсії, мають бути видні звідси.
 */
const NAVY_CARD = '#14253B'
const GOLD = '#EF9F27'
const GOLD_SOFT = '#FAC775'
const CREAM = '#FFF8EE'
const MUTED = '#B8C6D8'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

const ITEMS: { kicker: string; title: string; text: string; cta: string; href: string }[] = [
  {
    kicker: 'КЛУБ БАЛАБОНІВ',
    title: 'Читаєте чи пишете? Вступайте',
    text: 'Нові історії щотижня, перші новини конкурсів. Найактивнішим — календар 2027 у подарунок.',
    cta: 'Вступити безкоштовно',
    href: '/klub',
  },
  {
    kicker: 'КАЛЕНДАР 2027',
    title: 'Роздрукуйте безкоштовно',
    text: 'Український календар на 2027 рік на одному аркуші А4 і дитячий — PDF без реєстрації.',
    cta: 'Завантажити PDF',
    href: '/kalendar-2027',
  },
  {
    kicker: 'ПІДТРИМАТИ',
    title: 'Допоможіть читати безкоштовно',
    text: 'Пожертва ГО «Інститут громадянського суспільства» тримає доступ 1 ₴ для ВПО, ветеранів і людей з інвалідністю.',
    cta: 'Підтримати проєкт',
    href: '/support',
  },
]

export default function HomePromoRow() {
  return (
    <section aria-label="Клуб, календар і підтримка" style={{ maxWidth: 1100, margin: '0 auto', padding: '14px 20px 4px' }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {ITEMS.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              style={{
                display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box',
                border: '1px solid rgba(239,159,39,0.35)', borderRadius: 14, background: NAVY_CARD,
                padding: '16px 18px', textDecoration: 'none', color: CREAM,
              }}
            >
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: GOLD }}>{it.kicker}</span>
              <span style={{ fontFamily: SERIF, fontSize: 19, margin: '4px 0 6px' }}>{it.title}</span>
              <span style={{ fontFamily: FONT, fontSize: 14, lineHeight: 1.5, color: MUTED, flex: 1 }}>{it.text}</span>
              <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 700, color: GOLD_SOFT, marginTop: 10 }}>{it.cta} →</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
