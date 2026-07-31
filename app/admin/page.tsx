// =============================================================================
// АДМІНКА — ГОЛОВНА
//
// Досі /admin просто редиректив на /admin/login, тому посилання «← В адмінку»
// з усіх сторінок вело на екран входу. І з двадцяти з гаком розділів у меню
// вміщалось десять — решта жила лише прямими адресами.
//
// Тут — повний перелік. Доступ уже перекритий у proxy.ts: неавторизованого
// на /admin не пустить, тому сторінку видно тільки після входу.
//
// Додаючи новий розділ, вписуйте його сюди, а не тільки в AdminHeader:
// у шапці місця обмаль, а тут воно є.
// =============================================================================

const GOLD = '#ef9f27'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#b9c6db'
const FONT = "'Montserrat', Arial, sans-serif"
const LINE = 'rgba(143,163,196,0.22)'

type Item = { href: string; label: string; note: string }
type Group = { title: string; items: Item[] }

const GROUPS: Group[] = [
  {
    title: 'Контент',
    items: [
      { href: '/admin/content/stories', label: 'Історії',        note: 'Усі тексти: пошук, редагування, статуси' },
      { href: '/admin/stories',         label: 'Редактор серій', note: 'Написання й правка серій «Балабонів»' },
      { href: '/admin/series-list',     label: 'Список серій',   note: 'Перелік із перевіркою канону' },
      { href: '/admin/stories1',        label: 'Авторські',      note: 'Твори авторів' },
      { href: '/admin/na-redakturi',    label: 'На редактурі',   note: 'Черга текстів у роботі' },
      { href: '/admin/editorial',       label: 'Редакція',       note: 'Редакційний розділ' },
    ],
  },
  {
    title: 'Тиша',
    items: [
      { href: '/admin/tysha',        label: 'Серії «Тиші»',      note: 'Майстерня серіалу' },
      { href: '/admin/tysha-covers', label: 'Обкладинки «Тиші»', note: 'Генерація обкладинок' },
    ],
  },
  {
    title: 'Автори й договори',
    items: [
      { href: '/admin/authors',      label: 'Заведення авторів',            note: 'Кабінет автора і запис згоди' },
      { href: '/admin/link-authors', label: 'Привʼязка авторів',            note: 'Архівні твори → профіль автора' },
      { href: '/admin/sync-works',   label: 'Перелік творів за договорами', note: 'Додаток № 1. Чернетки не бере' },
      { href: '/admin/editors',      label: 'Редактори',                    note: 'Доступи редакційної команди' },
    ],
  },
  {
    title: 'Перевірка й аналітика',
    items: [
      { href: '/admin/review',             label: 'AI-Перегляд',        note: 'Розбір тексту по одному' },
      { href: '/admin/batch-review',       label: 'Пакетний перегляд',  note: 'Те саме гуртом' },
      { href: '/admin/protagonist-report', label: 'Хто головний герой', note: 'Класифікація серій для обкладинок' },
      { href: '/admin/reviews',            label: 'Відгуки',            note: 'Відгуки читачів' },
      { href: '/admin/analytics',          label: 'Аналітика',          note: 'Перегляди, сесії, доходимість' },
    ],
  },
  {
    title: 'Читачі',
    items: [
      { href: '/admin/benefits', label: 'Пільгові статуси', note: 'Ручні заявки на пільгу — те, що Дія не валідує' },
    ],
  },
  {
    title: 'Довідники та інструменти',
    items: [
      { href: '/admin/spelling',        label: 'Довідник правопису',   note: 'Статті правопису, чернетка → звірено' },
      { href: '/admin/import-archive',  label: 'Імпорт архіву',        note: 'Завантаження текстів зі Сторріса' },
      { href: '/admin/import-balabony', label: 'Імпорт Балабонів',     note: 'Завантаження серій' },
      { href: '/admin/panas-poses',     label: 'Пози Панаса',          note: 'Генератор ілюстрацій' },
      { href: '/admin/ganya-poses',     label: 'Пози баби Гані',       note: 'Генератор ілюстрацій' },
      { href: '/admin/stt-test',        label: 'Розпізнавання голосу', note: 'Перевірка Deepgram' },
    ],
  },
]

const cardStyle: React.CSSProperties = {
  display: 'block',
  background: NAVY,
  border: `1px solid ${LINE}`,
  borderRadius: 14,
  padding: '15px 17px',
  textDecoration: 'none',
}

export default function AdminHomePage() {
  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '28px 20px 90px' }}>

        <h1 style={{ color: GOLD, fontSize: 26, margin: 0 }}>Адмінка</h1>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.6, marginTop: 10, marginBottom: 4 }}>
          Усі розділи. У верхньому меню вміщається лише частина.
        </p>

        {GROUPS.map((g) => (
          <section key={g.title} style={{ marginTop: 30 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 1.4,
              textTransform: 'uppercase', color: GOLD, marginBottom: 12,
            }}>
              {g.title}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: 12,
            }}>
              {g.items.map((it) => (
                <a key={it.href} href={it.href} style={cardStyle}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: CREAM }}>
                    {it.label}
                  </div>
                  <div style={{ fontSize: 12.5, color: MUTED, marginTop: 5, lineHeight: 1.5 }}>
                    {it.note}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(185,198,219,0.5)', marginTop: 7, fontFamily: 'monospace' }}>
                    {it.href}
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}

      </div>
    </main>
  )
}
