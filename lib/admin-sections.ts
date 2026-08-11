// =============================================================================
// РОЗДІЛИ АДМІНКИ — ЄДИНЕ ДЖЕРЕЛО ПРАВДИ
//
// Досі перелік розділів жив у двох місцях: у шапці (AdminHeader) і на головній
// (/admin). Через це шапка відставала: у ній було одинадцять пунктів, а всього
// розділів двадцять три. Тепер список один, а обидві сторінки читають його
// звідси.
//
// Додаєте новий розділ — вписуєте ЛИШЕ сюди. Якщо він має бути ще й окремою
// кнопкою в шапці, поставте quick: true (таких небагато, бо місця в рядку
// обмаль). Решта завжди доступна в шапці через кнопку «Ще».
// =============================================================================

export type AdminItem = {
  href: string
  label: string
  note: string
  /** Показувати окремою кнопкою в шапці, а не лише у списку «Ще». */
  quick?: boolean
  /** Коротша назва для кнопки в шапці, якщо повна задовга. */
  short?: string
}

export type AdminGroup = {
  title: string
  items: AdminItem[]
}

export const ADMIN_GROUPS: AdminGroup[] = [
  {
    title: 'Контент',
    items: [
      { href: '/admin/content/stories', label: 'Історії',        note: 'Усі тексти: пошук, редагування, статуси', quick: true },
      { href: '/admin/stories',         label: 'Редактор серій', note: 'Написання й правка серій «Балабонів»',    quick: true },
      { href: '/admin/series-list',     label: 'Список серій',   note: 'Перелік із перевіркою канону',            quick: true },
      { href: '/admin/stories1',        label: 'Авторські',      note: 'Твори авторів' },
      { href: '/admin/na-redakturi',    label: 'На редактурі',   note: 'Черга текстів у роботі' },
      { href: '/admin/editorial',       label: 'Редакція',       note: 'Редакційний розділ' },
      { href: '/admin/cover-position',  label: 'Кадр обкладинки', note: 'Підгонка фото в картці, щоб не зрізало обличчя', quick: true, short: 'Кадр' },
      { href: '/admin/rozklad',         label: 'Розклад публікацій', note: 'Вівторок і пʼятниця о 18:00 — що на які дати призначено', quick: true, short: 'Розклад' },
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
      { href: '/admin/authors',         label: 'Заведення авторів',            note: 'Кабінет автора і запис згоди',   quick: true, short: 'Автори' },
      { href: '/admin/author-accounts', label: 'Кабінети авторів',             note: 'Хто заходив, реквізити, договори', quick: true, short: 'Кабінети' },
      { href: '/admin/link-authors',    label: 'Привʼязка авторів',            note: 'Архівні твори → профіль автора', quick: true, short: 'Привʼязка' },
      { href: '/admin/sync-works',      label: 'Перелік творів за договорами', note: 'Додаток № 1. Чернетки не бере',  quick: true, short: 'Перелік творів' },
      { href: '/admin/author-messages', label: 'Звернення авторів',            note: 'Листи з кабінетів авторів', quick: true, short: 'Звернення' },
      { href: '/admin/editors',         label: 'Редактори',                    note: 'Доступи редакційної команди' },
    ],
  },
  {
    title: 'Перевірка й аналітика',
    items: [
      { href: '/admin/review',             label: 'AI-Перегляд',        note: 'Розбір тексту по одному' },
      { href: '/admin/batch-review',       label: 'Пакетний перегляд',  note: 'Те саме гуртом' },
      { href: '/admin/protagonist-report', label: 'Хто головний герой', note: 'Класифікація серій для обкладинок' },
      { href: '/admin/reviews',            label: 'Відгуки',            note: 'Відгуки читачів' },
      { href: '/admin/analytics',          label: 'Аналітика',          note: 'Перегляди, сесії, доходимість', quick: true },
      { href: '/admin/kanaly',             label: 'Канали приходу',     note: 'Газета і пошта: приходи, дочитування, підписки за тиждень', quick: true, short: 'Канали' },
      { href: '/admin/chytach',            label: 'Шлях читача',        note: 'Що робить читач після першої серії — воронка, жанри, профілі', quick: true, short: 'Читач' },
      { href: '/admin/qr',                 label: 'QR-посилання',       note: 'Куди веде код у газеті. Міняти в неділю ввечері', quick: true, short: 'QR' },
    ],
  },
  {
    title: 'Читачі',
    items: [
      { href: '/admin/benefits',    label: 'Пільгові статуси', note: 'Ручні заявки на пільгу — те, що Дія не валідує', quick: true, short: 'Пільги' },
      { href: '/admin/pidpysnyky',  label: 'Підписники',       note: 'База пошт із блоку під історіями, вивантаження CSV', quick: true, short: 'Підписники' },
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

/** Плаский список усіх розділів — для пошуку за адресою. */
export const ADMIN_ITEMS: AdminItem[] = ADMIN_GROUPS.flatMap(g => g.items)

/** Ті, що виносяться окремими кнопками в шапку. */
export const ADMIN_QUICK: AdminItem[] = ADMIN_ITEMS.filter(i => i.quick)
