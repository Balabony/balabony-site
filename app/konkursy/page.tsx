import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/app/components/Breadcrumbs'

// Перший сезон — один конкурс: серіальний «Це довга історія».
// Свідомо НЕ згадуємо: наклад газет як приз, гонорар за газетну публікацію,
// джерела переходів у кабінеті (ще не зроблено).

const GOLD = '#ef9f27'
const GOLD_SOFT = '#FAC775'
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'
const SOFT = '#dbe4f0'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', Georgia, serif"

// Три фірмові кольори — золотий, темно-синій, білий. Жодного стороннього.
//
// Світла картка на кремовому тлі, яку пробували раніше, серед темної сторінки
// читалась як чужа вставка, а золотий знак на ній майже зникав. Тому всі три
// конкурси тепер темні, а різняться силою й місцем золота, кольором заголовка
// та власним знаком. Яскравість дає підсвітка, а не інверсія.
const GOLD_DEEP = '#8a5a10'   // золото, читабельне як текст на світлому

type Scheme = {
  /** Тло картки. */
  bg: string
  /** Золото смуги, рамки й знака. */
  line: string
  /** Акцентний текст: суми, дати, підзаголовок. */
  soft: string
  edge: string
  /** Підсвітка: власне положення в кожного конкурсу. */
  glow: string
  title: string
  body: string
  quiet: string
  stripe: string
  /** Ярлик угорі: залитий золотом чи обведений. */
  badgeFilled: boolean
  /** Плашка призів: кремова робить її головним світлим плямом картки. */
  prizeCream: boolean
}

const SCHEMES = {
  serial: {
    bg: '#0f1e3a', line: '#ef9f27', soft: '#FAC775', edge: 'rgba(239,159,39,0.55)',
    glow: 'radial-gradient(120% 95% at 88% -12%, rgba(239,159,39,0.22) 0%, rgba(0,0,0,0) 60%)',
    title: '#f5f0e8', body: '#dbe4f0', quiet: '#8899bb', stripe: 'rgba(239,159,39,0.10)',
    badgeFilled: false, prizeCream: false,
  },
  oneDay: {
    bg: '#0a1628', line: '#ef9f27', soft: '#FAC775', edge: 'rgba(245,240,232,0.35)',
    glow: 'radial-gradient(115% 90% at 8% 108%, rgba(239,159,39,0.26) 0%, rgba(0,0,0,0) 62%)',
    title: '#ffffff', body: '#dbe4f0', quiet: '#8899bb', stripe: 'rgba(245,240,232,0.06)',
    badgeFilled: false, prizeCream: false,
  },
  humour: {
    bg: '#12233f', line: '#ef9f27', soft: '#FAC775', edge: 'rgba(239,159,39,0.8)',
    glow: 'radial-gradient(135% 105% at 50% -18%, rgba(239,159,39,0.34) 0%, rgba(0,0,0,0) 58%)',
    title: '#ffffff', body: '#e4ebf6', quiet: '#9fb0c9', stripe: 'rgba(239,159,39,0.12)',
    badgeFilled: true, prizeCream: true,
  },
  // «Розгін» — швидкий конкурс. Підсвітка б'є знизу справа, ніби розгін угору.
  sprint: {
    bg: '#0d2036', line: '#ef9f27', soft: '#FAC775', edge: 'rgba(239,159,39,0.62)',
    glow: 'radial-gradient(125% 100% at 92% 112%, rgba(239,159,39,0.30) 0%, rgba(0,0,0,0) 60%)',
    title: '#f5f0e8', body: '#dbe4f0', quiet: '#8899bb', stripe: 'rgba(239,159,39,0.13)',
    badgeFilled: true, prizeCream: false,
  },
} as const satisfies Record<string, Scheme>

type Accent = Scheme

export const metadata: Metadata = {
  title: 'Це довга історія — конкурс серіалів · Балабони',
  description:
    'Конкурс серіалів «Це довга історія» на Балабонах: десять серій за десять тижнів. Головна нагорода — 20 000 грн і багатоголосе озвучення.',
  alternates: { canonical: '/konkursy' },
  openGraph: {
    title: 'Це довга історія — конкурс серіалів · Балабони',
    description:
      'Десять тижнів, десять серій. Переможця обирають ті, хто дочитав. Нагороди — гроші, багатоголосе озвучення й газета.',
    url: 'https://balabony.com/konkursy',
    siteName: 'Balabony',
    locale: 'uk_UA',
    type: 'website',
  },
}

const HERO_NUMBERS: { value: string; label: string }[] = [
  { value: '20 000 ₴', label: 'головна нагорода' },
  { value: '10', label: 'тижнів і серій' },
  { value: '3', label: 'серіали озвучимо' },
]

const FACTS: { label: string; value: string }[] = [
  { label: 'Обсяг', value: '10 серій по 1500–1800 слів' },
  { label: 'Ритм', value: 'одна серія на тиждень, у свій день' },
  { label: 'Реєстрація кабінетів', value: 'з 20 серпня 2026' },
  { label: 'Заявки', value: '1–15 листопада 2026' },
  { label: 'Перші серії', value: '25 листопада — 1 грудня 2026' },
  { label: 'Підсумки', value: 'до 27 лютого 2027' },
]

const RULES: { title: string; text: string }[] = [
  {
    title: 'Ритм',
    text: 'Перші серії виходять протягом тижня 25 листопада — 1 грудня, від дня запуску платформи, щоб ваш текст одразу побачили читачі. День, у який вийшла ваша перша серія, лишається вашим на всі десять тижнів: почали в середу — виходите щосереди. Днів на тиждень сім, місць на кожен день два, розподіляємо в порядку прийому заявок. Пропустили тиждень без попередження — вибули. Можна здати кілька серій наперед, вони опублікуються за розкладом; один раз за конкурс можна перенести вихід на 48 годин, попередивши редакцію.',
  },
  {
    title: 'Гачок у кінці кожної серії',
    text: 'Серія не закінчується крапкою — вона закінчується причиною повернутися через тиждень. Питання без відповіді, поворот, репліка, після якої все виглядає інакше. Гачок — це не обірване речення й не штучна пауза, а подія або відкриття, яке змінює становище героя.',
  },
  {
    title: 'Фінал, якого ніхто не вгадав',
    text: 'Розв’язка не повинна читатися наперед. Перевірка проста: якщо уважний читач після третьої серії може переказати кінець — фінал слабкий. Несподіванка має бути чесною: усі підказки лежать у тексті, просто читач склав їх інакше.',
  },
]

const AVOID: string[] = [
  'назва серії, що викриває загадку',
  'передвісники: «я ще не знав, що…», «згодом зрозумів», «якби ж я тоді послухав»',
  'фінал, який пояснює прочитане замість того, щоб його перевернути',
  'розв’язка через випадковість або героя, що з’явився в останній серії',
]

const AWARDS: { name: string; prize: string; text: string; main?: boolean }[] = [
  {
    name: 'Історія сезону',
    prize: '20 000 ₴',
    main: true,
    text: 'Багатоголосе озвучення всього серіалу — кілька дикторів, ближче до аудіовистави, ніж до начитки. І місяць у газеті «Життя»: чотири номери з QR-кодом на вашу сторінку автора.',
  },
  {
    name: 'Вибір читачів',
    prize: '10 000 ₴',
    text: 'Багатоголосе озвучення серіалу. Визначається голосуванням читачів.',
  },
  {
    name: 'Нове ім’я',
    prize: 'озвучення',
    text: 'Багатоголосе озвучення серіалу. Для того, хто публікується вперше.',
  },
]

const SCORING: { weight: string; title: string; text: string }[] = [
  { weight: '55', title: 'Доходимість', text: 'середній відсоток читачів, які дочитали серію до кінця' },
  { weight: '25', title: 'Утримання', text: 'скільки з тих, хто прочитав першу серію, дійшли до десятої' },
  { weight: '20', title: 'Оцінка редакції', text: 'мова, композиція, характери, сила гачків і фіналу' },
]

const PROMO: { title: string; text: string }[] = [
  {
    title: 'Пишіть окремі історії між серіями',
    text: 'Коротка історія поза конкурсом виходить у звичайному потоці, приносить винагороду за прочитання — і наприкінці стоїть посилання на ваш серіал. Людина прочитала вас уперше, їй сподобалось, і поруч лежить ще десять серій. Найдієвіший спосіб, і він не коштує нічого, крім написаного тексту.',
  },
  {
    title: 'Розповідайте у своїх соцмережах',
    text: 'Найкраще працює не «прочитайте мій серіал», а сам гачок: одне речення з кінця свіжої серії й посилання. Постити варто в свій день, одразу після виходу. Під кожною серією є кнопка поширення з готовою карткою.',
  },
  {
    title: 'Покличте тих, хто вас уже читав',
    text: 'Якщо вас друкували в газетах, ці люди досі вас пам’ятають. Перша серія відкрита всім без передплати — її можна спокійно надсилати кому завгодно.',
  },
]

const DATES: [string, string][] = [
  ['Реєстрація кабінетів', 'з 20 серпня 2026'],
  ['Заявки', '1–15 листопада'],
  ['Оголошення учасників', '18 листопада'],
  ['Перші серії', '25 листопада — 1 грудня'],
  ['Різдвяна пауза', '24 грудня — 6 січня'],
  ['Останні серії', '10–16 лютого 2027'],
  ['Підсумки', 'до 27 лютого'],
  ['Виплати', 'до 7 березня'],
  ['Газетний місяць переможця', 'березень'],
]

const COMMON_RULES: string[] = [
  'Серія має вийти у свій день. Кожна серія проходить редактуру перед публікацією.',
  'Текст серіалу пише автор. Штучний інтелект для написання серій не використовується — ані повністю, ані частково; виявлення означає зняття з конкурсу. Перевірка правопису, друкарських помилок і добір синонімів порушенням не є.',
  'Обкладинку та ілюстрації до серіалу створювати за допомогою штучного інтелекту можна — на оцінювання це не впливає, просимо лише повідомити редакцію. Якщо зображення немає, його зробить редакція: надішліть текст.',
  'Накрутка прочитань, голосів чи реєстрацій — зняття з конкурсу без пояснень. Ми бачимо час на сторінці, швидкість гортання і звідки прийшов читач.',
  'Прочитанням вважається перегляд не менш як 70% тексту зареєстрованим читачем, не частіше разу на добу з одного акаунта. Перегляди з акаунта автора не враховуються.',
  'Участь у конкурсі не змінює умов авторського договору: додаткових прав ми не набуваємо, додаткової ексклюзивності не встановлюємо.',
  'Конкурсні твори беруть участь у звичайному розподілі авторської винагороди за прочитання — незалежно від місця в конкурсі.',
  'Balabony залишає за собою право не публікувати надісланий твір. Перелік підстав визначено пунктом 2.9 авторського договору. Конкретну підставу редакція не розкриває; рішення оскарженню не підлягає.',
  'Відмова означає, що твір не бере участі в конкурсі й не розміщується на платформі. Жодних прав на нього ми не набуваємо — автор вільно розпоряджається ним далі.',
  'Відмова в публікації не може ґрунтуватися на статі, віці, стані здоров’я, інвалідності, статусі ВПО чи ветерана, місці проживання, походженні, релігійних або політичних поглядах автора.',
  'Результати оголошуються публічно, з показниками. Автор може попросити не називати справжнє ім’я — тоді використовується псевдонім із кабінету.',
  'Оскарження результатів — протягом 10 днів після їх оголошення.',
  'Зміна умов — з повідомленням усіх учасників не пізніш як за 14 днів.',
]

// ─── Два конкурси коротких історій ───
type ShortContest = {
  id: string
  accent: Accent
  /** Знак конкурсу: одна поділка зі зламом або три штрихи руху. */
  mark: 'break' | 'gust' | 'sprint'
  badge: string
  title: string
  lead: string
  about: string
  looking: string[]
  prize: string
  bonus: string
  dates: [string, string][]
  /** Необовʼязковий блок про оцінювання — там, де переможців рахують за цифрами. */
  scoring?: { weight: string; label: string; note: string }[]
  rules: string[]
}

// «Розгін» стоїть першим на сторінці: це найкоротша дистанція й найпростіший
// вхід. Автор, якого лякають десять серій, має побачити його раніше, ніж
// вирішить, що конкурси не для нього.
const ROZGHIN: ShortContest = {
  id: 'rozghin',
  accent: SCHEMES.sprint,
  mark: 'sprint',
  badge: 'Швидкий конкурс · три серії',
  title: '«Розгін»',
  lead: 'Три серії за десять днів',
  about:
    'Найкоротша дистанція на платформі — і найшвидша перевірка того, чи вмієте ви тримати читача. ' +
    'Три серії по 1500–1600 слів, десять днів від публікації першої. За цей час ви проживаєте весь ' +
    'цикл серіалу в мініатюрі: гачок, темп, фінал, реакція читача. Хто витримав три серії за десять ' +
    'днів, витримає й десять за десять тижнів. Брати «Розгін» одночасно з «Це довгою історією» ' +
    'можна, але зважте навантаження: це три серії за десять днів поверх щотижневої серії.',
  looking: [
    'гачок у кінці кожної серії — щоб читач повернувся завтра, а не колись',
    'три серії, які тримаються разом, а не три окремі історії',
    'героя, за яким хочеться йти далі',
    'фінал третьої серії, після якого хочеться четвертої',
  ],
  prize: 'Перше місце — 5 000 ₴, друге — 3 000 ₴, третє — 2 000 ₴',
  bonus:
    'Серіали, які читачі дочитують до кінця, ми продовжуємо — автор пише далі, і серії виходять ' +
    'на платформі. Рішення ухвалюється за реальними цифрами прочитань, а не на око; додаткових ' +
    'нагород за продовження немає. Прохід у «Це довгу історію» — у наступному циклі конкурсу.',
  dates: [
    ['Старт конкурсу', 'з дня запуску платформи, орієнтовно 25 листопада 2026'],
    ['Подання', 'у будь-який момент, дедлайну немає'],
    ['Дистанція', '10 днів від публікації першої серії'],
    ['Різдвяна пауза', 'старти не приймаємо з 20 грудня по 6 січня'],
    ['Останній старт', 'до 18 лютого 2027 — щоб устигнути завершити'],
    ['Підсумки', 'за роботами, завершеними до 28 лютого 2027'],
    ['Виплата призів', 'до 15 березня 2027'],
  ],
  scoring: [
    {
      weight: '50%',
      label: 'Доходимість',
      note: 'середній відсоток читачів, які дочитали серію до кінця. Не перегляди й не лайки — саме дочитування. Цей показник неможливо накрутити знайомими.',
    },
    {
      weight: '30%',
      label: 'Утримання між серіями',
      note: 'скільки читачів, які прочитали першу серію, дійшли до третьої. Це і є перевірка гачка: чи повернувся читач наступного дня.',
    },
    {
      weight: '20%',
      label: 'Оцінка редакції',
      note: 'мова, композиція, чи тримаються три серії разом як одна історія. Ставлять лише ті редактори, які самі в конкурсі не беруть участі.',
    },
  ],
  rules: [
    'Три серії по 1500–1600 слів кожна.',
    'Десять днів рахуються від дня публікації вашої першої серії на платформі й ідуть поспіль.',
    'На різдвяні свята конкурс паузиться: старти з 20 грудня по 6 січня не приймаються.',
    'Серії нові, повністю не публікувалися раніше.',
    'Кожна серія закінчується гачком — читач має захотіти наступну.',
    'Текст написаний автором; згенеровані ШІ твори не приймаються.',
    'Обкладинку та ілюстрації можна створити за допомогою ШІ — повідомте про це редакцію. Якщо зображення немає, його зробить редакція.',
    'Участь одночасно в кількох конкурсах Балабонів дозволена. Але один твір подається лише в один конкурс: той самий текст у двох конкурсах не приймається.',
    'Підписаний авторський договір і заповнені реквізити в кабінеті.',
  ],
}

const SHORT_CONTESTS: ShortContest[] = [
  {
    id: 'odyn-den',
    accent: SCHEMES.oneDay,
    mark: 'break',
    badge: 'Коротка проза · один день',
    title: '«Один день, який усе змінив»',
    lead: 'Коротка проза до 1500 слів',
    about:
      'Історія про день, після якого життя героя пішло інакше. Дія вміщається переважно в один день. ' +
      'Не мемуари й не роздуми — саме історія: герой, подія, зміна. Тон вільний: може бути світло, ' +
      'може боляче. Головне, щоб читач упізнав себе.',
    looking: [
      'живого героя, а не функцію',
      'конкретність: місце, час, деталь, яку видно',
      'зміну, що справді сталася, а не була пояснена автором',
      'фінал, якого не було видно з середини тексту',
    ],
    prize: 'Перше місце — 3 000 ₴, друге — 2 000 ₴, третє — 1 000 ₴',
    bonus:
      'Історії трьох переможців виходять у газеті «Життя» — з QR-кодом на сторінку автора. ' +
      'Газетні читачі знаходять вас і приходять читати далі на платформу.',
    dates: [
      ['Прийом робіт', '1 листопада — 15 грудня 2026'],
      ['Публікація історій', '15 грудня 2026 — 15 січня 2027'],
      ['Результати', 'до 31 січня 2027'],
      ['Виплата призів', 'до 15 лютого 2027'],
    ],
    rules: [
      'Один автор — одна історія на конкурс.',
      'Історія нова, ніде раніше не публікувалася.',
      'Обсяг до 1500 слів. Довші тексти знімаються.',
      'Текст написаний автором; згенеровані ШІ твори не приймаються.',
      'Обкладинку та ілюстрації можна створити за допомогою ШІ — повідомте про це редакцію. Якщо зображення немає, його зробить редакція.',
      'Оцінює редакція; доходимість враховується як додатковий показник.',
      'Участь одночасно в кількох конкурсах Балабонів дозволена. Але один твір подається лише в один конкурс: той самий текст у двох конкурсах не приймається.',
      'Підписаний авторський договір і заповнені реквізити в кабінеті.',
    ],
  },
  {
    id: 'z-viterczem',
    accent: SCHEMES.humour,
    mark: 'gust',
    badge: 'Гумористична історія',
    title: '«З вітерцем»',
    lead: 'Гумористична історія до 1500 слів',
    about:
      'Смішна історія з життя: непорозуміння, безглузда ситуація, сільська чи міська пригода, ' +
      'родинний випадок, який досі згадують за столом. Гумор добрий, не злий: сміємося разом ' +
      'із героєм, а не з нього. Без принижень за ознакою статі, віку, походження чи стану здоровʼя.',
    looking: [
      'ситуацію, яку смішно переказувати вголос',
      'живі діалоги — у гуморі вони роблять половину роботи',
      'темп: короткі речення, швидку розвʼязку',
      'фінал-несподіванку, а не пояснення жарту',
    ],
    prize: 'Перше місце — 3 000 ₴, друге — 2 000 ₴, третє — 1 000 ₴',
    bonus:
      'Історії трьох переможців виходять у газеті «Життя» — з QR-кодом на сторінку автора. ' +
      'Газетні читачі знаходять вас і приходять читати далі на платформу.',
    dates: [
      ['Прийом робіт', '1 листопада — 15 грудня 2026'],
      ['Публікація історій', '15 грудня 2026 — 15 січня 2027'],
      ['Результати', 'до 31 січня 2027'],
      ['Виплата призів', 'до 15 лютого 2027'],
    ],
    rules: [
      'Один автор — одна історія на конкурс.',
      'Історія нова, ніде раніше не публікувалася.',
      'Обсяг до 1500 слів.',
      'Без позначки 18+.',
      'Текст написаний автором; згенеровані ШІ твори не приймаються.',
      'Обкладинку та ілюстрації можна створити за допомогою ШІ — повідомте про це редакцію. Якщо зображення немає, його зробить редакція.',
      'Участь одночасно в кількох конкурсах Балабонів дозволена. Але один твір подається лише в один конкурс: той самий текст у двох конкурсах не приймається.',
      'Підписаний авторський договір і заповнені реквізити в кабінеті.',
    ],
  },
]

const P: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.75, margin: '0 0 12px', color: SOFT }

function Section({
  num,
  title,
  gold = false,
  children,
}: {
  num: string
  title: string
  gold?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        background: gold ? 'rgba(239,159,39,0.07)' : NAVY,
        border: gold ? '1px solid rgba(239,159,39,0.45)' : '1px solid rgba(143,163,196,0.18)',
        borderRadius: 16,
        padding: '26px 24px',
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span
          style={{
            flex: 'none',
            width: 34,
            height: 34,
            borderRadius: 9,
            background: GOLD,
            color: NAVY_DEEP,
            fontSize: 15,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT,
          }}
        >
          {num}
        </span>
        <h2 style={{ fontFamily: SERIF, fontSize: 25, margin: 0, color: CREAM, lineHeight: 1.25, fontWeight: 700 }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

/** Знак конкурсу. Малий, поруч із ярликом — не ілюстрація, а мітка. */
function Mark({ kind, color }: { kind: 'break' | 'gust' | 'weeks' | 'sprint'; color: string }) {
  if (kind === 'sprint') {
    // Розгін: три штрихи, кожен довший і яскравіший за попередній.
    return (
      <span aria-hidden style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 14 }}>
        {[8, 14, 22].map((w, i) => (
          <span key={i} style={{ width: w, height: 2.5, background: color, borderRadius: 1, opacity: 0.45 + i * 0.28 }} />
        ))}
      </span>
    )
  }

  if (kind === 'weeks') {
    // Десять поділок — рівно стільки, скільки тижнів у дистанції.
    return (
      <span aria-hidden style={{ display: 'inline-flex', gap: 3, alignItems: 'flex-end', height: 14 }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ width: 2, height: 6 + (i % 3) * 4, background: color, borderRadius: 1, opacity: 0.55 + i * 0.045 }} />
        ))}
      </span>
    )
  }

  if (kind === 'break') {
    // Один день: те, що було, обрив, і те, що стало.
    return (
      <span aria-hidden style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 14 }}>
        <span style={{ width: 16, height: 2, background: color, borderRadius: 1, opacity: 0.5 }} />
        <span style={{ width: 2, height: 12, background: color, borderRadius: 1 }} />
        <span style={{ width: 16, height: 2, background: color, borderRadius: 1, opacity: 0.5 }} />
      </span>
    )
  }

  // Порив вітру — три похилі штрихи.
  return (
    <span aria-hidden style={{ display: 'inline-flex', gap: 4, alignItems: 'center', height: 14 }}>
      {[14, 20, 11].map((w, i) => (
        <span key={i} style={{ width: w, height: 2.5, background: color, borderRadius: 1, transform: 'skewX(-28deg)', opacity: 1 - i * 0.12 }} />
      ))}
    </span>
  )
}

function ShortContestCard({ c }: { c: ShortContest }) {
  const A = c.accent

  const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.75, color: A.body, margin: '0 0 12px' }
  const head: React.CSSProperties = { fontFamily: SERIF, fontSize: 18, color: A.title, margin: '22px 0 10px', fontWeight: 700 }

  return (
    <section
      id={c.id}
      style={{
        position: 'relative',
        background: `${A.glow}, ${A.bg}`,
        border: `1px solid ${A.edge}`,
        borderRadius: 16,
        padding: '32px 22px 26px',
        marginBottom: 18,
        scrollMarginTop: 90,
        overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
      }}
    >
      {/* Золота смуга — спільний знак усіх конкурсів. */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 5,
          background: `linear-gradient(90deg, ${A.line} 0%, ${A.line} 58%, rgba(0,0,0,0) 100%)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <span
          style={{
            fontSize: 11, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase',
            color: A.badgeFilled ? '#0a1628' : A.line,
            background: A.badgeFilled ? A.line : 'rgba(239,159,39,0.12)',
            border: `1px solid ${A.badgeFilled ? A.line : A.edge}`,
            borderRadius: 6, padding: '5px 11px',
          }}
        >
          {c.badge}
        </span>
        <Mark kind={c.mark} color={A.line} />
      </div>

      <h2 style={{ fontFamily: SERIF, fontSize: 27, margin: '0 0 4px', color: A.title, lineHeight: 1.22, fontWeight: 700 }}>
        {c.title}
      </h2>
      <div style={{ fontSize: 14.5, color: A.soft, fontWeight: 700, marginBottom: 16 }}>{c.lead}</div>

      <p style={para}>{c.about}</p>

      <h3 style={head}>Що шукаємо</h3>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: A.body }}>
        {c.looking.map(x => <li key={x} style={{ marginBottom: 6 }}>{x}</li>)}
      </ul>

      {/* Призи — головне в картці, тому окремою плашкою. */}
      <div
        style={{
          marginTop: 22,
          padding: '16px 18px',
          borderRadius: 12,
          background: A.prizeCream ? CREAM : 'rgba(239,159,39,0.10)',
          border: `1px solid ${A.prizeCream ? 'rgba(239,159,39,0.9)' : A.edge}`,
        }}
      >
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
          color: A.prizeCream ? GOLD_DEEP : A.soft, marginBottom: 8,
        }}>
          Призи
        </div>
        <div style={{
          fontFamily: SERIF, fontSize: 20, fontWeight: 700, lineHeight: 1.4,
          color: A.prizeCream ? NAVY_DEEP : A.title,
        }}>
          {c.prize}
        </div>
        <p style={{
          fontSize: 14.5, lineHeight: 1.7, margin: '9px 0 0',
          color: A.prizeCream ? '#1c2a42' : A.quiet,
          fontWeight: A.prizeCream ? 500 : 400,
        }}>
          {c.bonus}
        </p>
      </div>

      <h3 style={head}>Строки</h3>
      {c.dates.map(([k, v], i) => (
        <div
          key={k}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
            padding: '11px 14px',
            borderRadius: 9,
            background: i % 2 === 0 ? A.stripe : 'transparent',
            borderLeft: i % 2 === 0 ? `2px solid ${A.edge}` : '2px solid transparent',
          }}
        >
          <span style={{ fontSize: 15, color: A.body }}>{k}</span>
          <span style={{ fontSize: 15, color: A.soft, fontWeight: 700 }}>{v}</span>
        </div>
      ))}

      {c.scoring && (
        <>
          <h3 style={head}>Як визначаємо переможців</h3>
          <p style={{ ...para, marginBottom: 14 }}>
            Не голосуванням і не лайками. Три показники, кожен зі своєю вагою:
          </p>
          {c.scoring.map(x => (
            <div
              key={x.label}
              style={{
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                padding: '13px 15px',
                marginBottom: 8,
                borderRadius: 10,
                background: A.stripe,
                borderLeft: `2px solid ${A.edge}`,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 800, color: A.line, minWidth: 46, fontFamily: SERIF }}>
                {x.weight}
              </span>
              <span>
                <strong style={{ fontSize: 15.5, color: A.title, display: 'block', marginBottom: 3 }}>
                  {x.label}
                </strong>
                <span style={{ fontSize: 14.5, lineHeight: 1.7, color: A.body }}>{x.note}</span>
              </span>
            </div>
          ))}
          <p style={{ ...para, fontSize: 14.5, color: A.quiet, marginTop: 12 }}>
            При однаковій сумі балів перемагає той, у кого вища доходимість третьої серії — хто
            дотягнув читача до самого кінця.
          </p>
        </>
      )}

      <h3 style={head}>Умови участі</h3>
      <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: A.body }}>
        {c.rules.map(r => <li key={r} style={{ marginBottom: 6 }}>{r}</li>)}
      </ul>
    </section>
  )
}

/** Три плитки вгорі: одразу видно, який конкурс про що і скільки коштує. */
function ContestPicker() {
  const tiles = [
    { href: '#dovha-istoriya', accent: SCHEMES.serial, mark: 'weeks' as const, name: 'Це довга історія',           what: 'Серіал · 10 серій',    when: 'Заявки 1–15 листопада', prize: '20 000 ₴', main: true  },
    { href: '#rozghin',        accent: SCHEMES.sprint, mark: 'sprint' as const, name: 'Розгін',                   what: 'Три серії за 10 днів', when: 'Без дедлайну',          prize: '5 000 ₴',  main: false },
    { href: '#odyn-den',       accent: SCHEMES.oneDay, mark: 'break' as const, name: 'Один день, який усе змінив', what: 'Одна історія',         when: 'Прийом до 15 грудня',   prize: '3 000 ₴',  main: false },
    { href: '#z-viterczem',    accent: SCHEMES.humour, mark: 'gust'  as const, name: 'З вітерцем',                 what: 'Одна історія · гумор', when: 'Прийом до 15 грудня',   prize: '3 000 ₴',  main: false },
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 12,
        margin: '0 0 26px',
      }}
    >
      {tiles.map(t => (
        <a
          key={t.href}
          href={t.href}
          style={{
            display: 'block',
            textDecoration: 'none',
            position: 'relative',
            background: `${t.accent.glow}, ${t.accent.bg}`,
            border: `1px solid ${t.accent.edge}`,
            borderRadius: 13,
            padding: '16px 16px 15px',
            overflow: 'hidden',
            boxShadow: t.main
              ? '0 12px 30px rgba(239,159,39,0.16)'
              : '0 10px 26px rgba(0,0,0,0.28)',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: t.main ? 4 : 3,
              background: `linear-gradient(90deg, ${t.accent.line} 0%, rgba(0,0,0,0) 100%)`,
            }}
          />
          <Mark kind={t.mark} color={t.accent.line} />
          <div style={{ fontFamily: SERIF, fontSize: 17.5, fontWeight: 700, color: t.accent.title, margin: '10px 0 3px', lineHeight: 1.25 }}>
            {t.name}
          </div>
          <div style={{ fontSize: 13, color: t.accent.quiet }}>{t.what}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: t.accent.body }}>{t.when}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: t.accent.line }}>{t.prize}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

export default function KonkursyPage() {
  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 20px calc(88px + env(safe-area-inset-bottom, 0px))' }}>

        <Breadcrumbs items={[{ label: 'Конкурси' }]} />

        {/* Три конкурси поруч: видно різницю до того, як читати умови. */}
        <div style={{ marginTop: 18 }}>
          <ContestPicker />
        </div>

        {/* ─── Головний конкурс ─── */}
        <div
          id="dovha-istoriya"
          style={{
            position: 'relative',
            background: `radial-gradient(120% 90% at 85% -15%, ${SCHEMES.serial.glow} 0%, rgba(0,0,0,0) 60%), ${NAVY}`,
            border: `1px solid ${SCHEMES.serial.edge}`,
            borderRadius: 18,
            padding: '34px 26px 28px',
            marginBottom: 26,
            overflow: 'hidden',
            scrollMarginTop: 90,
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 5,
              background: `linear-gradient(90deg, ${GOLD} 0%, ${GOLD} 60%, rgba(0,0,0,0) 100%)`,
            }}
          />
          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: GOLD,
              background: 'rgba(239,159,39,0.14)',
              border: `1px solid rgba(239,159,39,0.5)`,
              borderRadius: 6,
              padding: '6px 12px',
            }}
          >
            Конкурс серіалів · Сезон 1
          </span>
          <span style={{ display: 'inline-flex', marginLeft: 12, verticalAlign: 'middle' }}>
            <Mark kind="weeks" color={GOLD} />
          </span>

          <h1
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(34px, 6.5vw, 54px)',
              fontWeight: 700,
              margin: '18px 0 0',
              lineHeight: 1.08,
              color: CREAM,
            }}
          >
            Це довга <span style={{ color: GOLD }}>історія</span>
          </h1>

          <div style={{ width: 82, height: 4, background: GOLD, borderRadius: 2, margin: '16px 0 18px' }} />

          <p style={{ fontSize: 18, color: SOFT, lineHeight: 1.65, margin: 0, maxWidth: 640 }}>
            Розкажіть її за десять тижнів. Десять серій, одна історія, яку читач
            чекає щотижня. Переможця обирає не журі — його обирають ті, хто дочитав.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            {HERO_NUMBERS.map(n => (
              <div
                key={n.label}
                style={{
                  background: NAVY_DEEP,
                  borderLeft: `3px solid ${GOLD}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontFamily: SERIF, fontSize: 27, color: GOLD_SOFT, lineHeight: 1.1 }}>{n.value}</div>
                <div style={{ fontSize: 12.5, color: MUTED, marginTop: 5 }}>{n.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
            <Link
              href="/become-author"
              style={{
                background: GOLD,
                color: NAVY_DEEP,
                fontSize: 15,
                fontWeight: 700,
                borderRadius: 11,
                padding: '13px 26px',
                textDecoration: 'none',
              }}
            >
              Стати автором →
            </Link>
            <Link
              href="/author/dashboard"
              style={{
                color: CREAM,
                fontSize: 15,
                fontWeight: 700,
                border: '1px solid rgba(143,163,196,0.4)',
                borderRadius: 11,
                padding: '13px 26px',
                textDecoration: 'none',
              }}
            >
              Мій кабінет
            </Link>
          </div>
        </div>

        {/* ─── Коротко ─── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 12,
            marginBottom: 26,
          }}
        >
          {FACTS.map(f => (
            <div
              key={f.label}
              style={{
                background: NAVY,
                border: '1px solid rgba(143,163,196,0.18)',
                borderRadius: 12,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: GOLD }}>
                {f.label}
              </div>
              <div style={{ fontSize: 15, color: CREAM, marginTop: 6, lineHeight: 1.45 }}>{f.value}</div>
            </div>
          ))}
        </div>

        <Section num="1" title="Що пишемо">
          <p style={P}>
            Серіал із десяти серій. Кожна — 1500–1800 слів, самостійна за подією, але пов’язана
            наскрізним сюжетом і героями.
          </p>
          <p style={{ ...P, margin: 0 }}>
            Жанр вільний. Мова українська, оригінал, не переклад. Текст написаний автором — твори,
            згенеровані штучним інтелектом, не приймаються. Обкладинку та ілюстрації створювати
            за допомогою штучного інтелекту можна: заборона стосується лише тексту.
          </p>
        </Section>

        <Section num="2" title="Три правила серіалу">
          {RULES.map((r, i) => (
            <div
              key={r.title}
              style={{
                marginBottom: i === RULES.length - 1 ? 0 : 18,
                paddingLeft: 16,
                borderLeft: `3px solid ${GOLD}`,
              }}
            >
              <div style={{ fontSize: 17, color: GOLD_SOFT, fontWeight: 700, marginBottom: 7 }}>{r.title}</div>
              <p style={{ ...P, margin: 0 }}>{r.text}</p>
            </div>
          ))}
        </Section>

        <Section num="3" title="Чого уникати у фіналі">
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {AVOID.map(a => (
              <li
                key={a}
                style={{
                  fontSize: 15.5,
                  lineHeight: 1.7,
                  color: SOFT,
                  marginBottom: 10,
                  paddingLeft: 22,
                  position: 'relative',
                }}
              >
                <span style={{ position: 'absolute', left: 0, top: 0, color: GOLD, fontWeight: 800 }}>×</span>
                {a}
              </li>
            ))}
          </ul>
        </Section>

        <Section num="4" title="Нагороди" gold>
          {AWARDS.map(a => (
            <div
              key={a.name}
              style={{
                background: a.main ? 'rgba(239,159,39,0.13)' : NAVY,
                border: a.main ? `2px solid ${GOLD}` : '1px solid rgba(143,163,196,0.2)',
                borderRadius: 13,
                padding: '18px 20px',
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: SERIF, fontSize: 21, color: CREAM, fontWeight: 700 }}>{a.name}</span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: a.main ? NAVY_DEEP : GOLD,
                    background: a.main ? GOLD : 'rgba(239,159,39,0.14)',
                    border: `1px solid ${GOLD}`,
                    borderRadius: 20,
                    padding: '4px 14px',
                  }}
                >
                  {a.prize}
                </span>
              </div>
              <p style={{ ...P, margin: '10px 0 0' }}>{a.text}</p>
            </div>
          ))}
          <p style={{ ...P, margin: '4px 0 0', color: MUTED }}>
            Кожна нагорода лишається біля вашого імені назавжди — у профілі, на картках усіх ваших
            творів і в газеті, з роком: «Історія сезону · 2026». Один автор може взяти дві нагороди.
          </p>
        </Section>

        <Section num="5" title="Як визначаємо переможця">
          <p style={P}>Не за лайками й не за кліками.</p>
          {SCORING.map(s => (
            <div
              key={s.title}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                background: NAVY_DEEP,
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  flex: 'none',
                  fontFamily: SERIF,
                  fontSize: 28,
                  color: GOLD,
                  minWidth: 62,
                  lineHeight: 1,
                }}
              >
                {s.weight}<span style={{ fontSize: 15 }}>%</span>
              </span>
              <span style={{ fontSize: 15.5, lineHeight: 1.6, color: SOFT }}>
                <strong style={{ color: CREAM }}>{s.title}</strong> — {s.text}
              </span>
            </div>
          ))}
          <p style={{ ...P, margin: '14px 0 0', color: MUTED }}>
            Голоси читачів рахуються окремо: вони визначають «Вибір читачів» і розсуджують тих, кого
            розділяє менше двох балів. Голосування відкривається з шостого тижня. Перша п’ятірка видно
            на головній сторінці весь конкурс, місця рухаються щодня.
          </p>
        </Section>

        <Section num="6" title="Як привести читача">
          <p style={P}>
            Платформа показує ваш серіал усім, хто заходить: перша п’ятірка на головній, анонси в
            розсилці, місце в рубриці. Це робиться без вашої участі. Але найкращі результати будуть у
            того, хто приведе своїх людей. Нічого з написаного нижче ми не вимагаємо — це просто те,
            що працює.
          </p>
          {PROMO.map(x => (
            <div key={x.title} style={{ marginTop: 16, paddingLeft: 16, borderLeft: `3px solid ${GOLD}` }}>
              <div style={{ fontSize: 17, color: GOLD_SOFT, fontWeight: 700, marginBottom: 6 }}>{x.title}</div>
              <p style={{ ...P, margin: 0 }}>{x.text}</p>
            </div>
          ))}
          <div
            style={{
              marginTop: 20,
              padding: '16px 18px',
              background: 'rgba(239,159,39,0.12)',
              border: `1px solid rgba(239,159,39,0.4)`,
              borderRadius: 12,
            }}
          >
            <p style={{ ...P, margin: 0 }}>
              Нас цікавить не кількість відкриттів, а частка дочитувань. Якщо покликати сто знайомих,
              які відкриють сторінку з ввічливості й закриють на другому абзаці, ваш показник{' '}
              <strong style={{ color: GOLD_SOFT }}>упаде</strong>, а не зросте. Кличте не всіх, а тих,
              хто справді читає: десять уважних читачів корисніші за сотню тих, хто зайшов вас
              підтримати.
            </p>
          </div>
        </Section>

        <Section num="7" title="Що таке сезон">
          <p style={P}>
            Конкурс не одноразовий. «Це довга історія» проходить двічі на рік — узимку й навесні. Кожен раунд
            і є сезон: десять тижнів публікацій, далі підсумки, виплати, озвучення переможців і
            газетний місяць. Поки триває ця робота, готується наступний набір.
          </p>
          <p style={P}>
            Не потрапили цього разу або не встигли з текстом — наступні заявки за кілька місяців. Той
            самий серіал подавати вдруге не можна, новий — скільки завгодно.
          </p>
          <p style={{ ...P, margin: 0, color: MUTED }}>
            Нагороди підписуються сезоном і роком. Вони не знецінюються з часом і не зникають, коли
            приходять нові переможці. Автор, який виграв, може подаватись і далі.
          </p>
        </Section>

        <Section num="8" title="Хто може брати участь">
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15.5, lineHeight: 1.85, color: SOFT }}>
            <li>будь-який автор із підписаним авторським договором і заповненими реквізитами в кабінеті;</li>
            <li>твір має бути ваш і ніде раніше не публікований;</li>
            <li>заявки подаються лише через Особистий кабінет;</li>
            <li>участь одночасно в кількох конкурсах Балабонів дозволена, але один твір подається лише в один конкурс.</li>
          </ul>
          <p style={{ ...P, margin: '12px 0 0' }}>
            Редактори платформи мають право подаватись нарівні з усіма — вони такі самі автори. Але
            оцінку редакції виставляють лише ті, хто в конкурсі не бере участі: учасник не оцінює ні
            власний твір, ні чужі.
          </p>
        </Section>

        <Section num="9" title="Як подати" gold>
          <p style={P}>
            <strong style={{ color: GOLD_SOFT }}>З 20 серпня</strong> відкрито реєстрацію кабінетів.
            Заходьте, підписуйте договір, заповнюйте реквізити — щоб у листопаді не робити це поспіхом.
          </p>
          <p style={P}>
            <strong style={{ color: GOLD_SOFT }}>З 1 до 15 листопада</strong> подача заявки через
            Особистий кабінет: синопсис на одну сторінку і повний текст першої серії.
          </p>
          <p style={{ ...P, margin: '0 0 18px' }}>
            Учасників оголошуємо 18 листопада, кожного повідомляємо особисто.
          </p>
          <Link
            href="/become-author"
            style={{
              display: 'inline-block',
              background: GOLD,
              color: NAVY_DEEP,
              fontSize: 15,
              fontWeight: 700,
              borderRadius: 11,
              padding: '13px 26px',
              textDecoration: 'none',
            }}
          >
            Стати автором →
          </Link>
        </Section>

        <Section num="10" title="Дати першого сезону">
          {DATES.map(([k, v], i) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
                padding: '11px 14px',
                borderRadius: 9,
                background: i % 2 === 0 ? NAVY_DEEP : 'transparent',
              }}
            >
              <span style={{ fontSize: 15, color: SOFT }}>{k}</span>
              <span style={{ fontSize: 15, color: GOLD_SOFT, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <p style={{ ...P, margin: '14px 0 0', color: MUTED }}>
            П’ять серій до паузи, п’ять після. Наступний сезон — заявки з 1 квітня 2027.
          </p>
        </Section>

        <Section num="11" title="Правила конкурсу">
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.8, color: SOFT }}>
            {COMMON_RULES.map(r => (
              <li key={r} style={{ marginBottom: 9 }}>{r}</li>
            ))}
          </ul>
          <p style={{ ...P, margin: '14px 0 0', color: MUTED }}>
            Права на твір переходять платформі з моменту публікації, на три роки, як в авторському
            договорі. Серіал лишається на платформі й далі приносить винагороду за прочитання.
          </p>
        </Section>

        {/* «Розгін» одразу після головного конкурсу: легший вхід для тих,
            кого десять серій лякають. */}
        <div style={{ marginTop: 40 }}>
          <ShortContestCard c={ROZGHIN} />
        </div>

        {/* ─── Ще два конкурси коротких історій ─── */}

        <div style={{ margin: '40px 0 18px' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 28, color: CREAM, margin: '0 0 8px', fontWeight: 700 }}>
            Ще два конкурси
          </h2>
          <p style={{ ...P, color: MUTED, margin: 0 }}>
            Якщо серіал — це не ваше, є два конкурси на одну коротку історію.
            Умови авторського договору для них ті самі; правила конкурсу з розділу 11 діють і тут.
          </p>
        </div>

        {SHORT_CONTESTS.map(c => <ShortContestCard key={c.id} c={c} />)}

        {/* Кінець сторінки має вести до дії, а не в порожнечу. */}
        <div
          style={{
            position: 'relative',
            marginTop: 30,
            padding: '30px 22px 28px',
            borderRadius: 16,
            overflow: 'hidden',
            background: `radial-gradient(120% 100% at 50% -20%, rgba(239,159,39,0.20) 0%, rgba(0,0,0,0) 62%), ${NAVY}`,
            border: `1px solid rgba(239,159,39,0.45)`,
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 4,
              background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${GOLD} 50%, rgba(0,0,0,0) 100%)`,
            }}
          />

          <h2 style={{ fontFamily: SERIF, fontSize: 26, color: CREAM, margin: '0 0 10px', fontWeight: 700, lineHeight: 1.25 }}>
            Щоб узяти участь, потрібен кабінет автора
          </h2>
          <p style={{ ...P, color: SOFT, margin: '0 auto 20px', maxWidth: 560 }}>
            У ньому підписують договір, вписують реквізити для виплат і бачать,
            скільки людей прочитало вашу історію. Реєстрація відкривається 20 серпня 2026.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/become-author"
              style={{
                display: 'inline-block', textDecoration: 'none',
                background: GOLD, color: NAVY_DEEP,
                fontSize: 15, fontWeight: 800, letterSpacing: 0.3,
                padding: '13px 24px', borderRadius: 10,
              }}
            >
              Стати автором
            </Link>
            <Link
              href="/contacts"
              style={{
                display: 'inline-block', textDecoration: 'none',
                background: 'transparent', color: CREAM,
                border: `1px solid rgba(245,240,232,0.35)`,
                fontSize: 15, fontWeight: 700,
                padding: '13px 24px', borderRadius: 10,
              }}
            >
              Запитати редакцію
            </Link>
          </div>
        </div>

      </div>
    </main>
  )
}
