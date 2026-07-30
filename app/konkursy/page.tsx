import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/app/components/Breadcrumbs'

// Перший сезон — один конкурс: серіальний «Далі буде».
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

export const metadata: Metadata = {
  title: 'Далі буде — конкурс серіалів · Балабони',
  description:
    'Конкурс серіалів «Далі буде» на Балабонах: десять серій за десять тижнів. Головна нагорода — 20 000 грн, багатоголосе озвучення та місяць у газеті «Життя».',
  alternates: { canonical: '/konkursy' },
  openGraph: {
    title: 'Далі буде — конкурс серіалів · Балабони',
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
  { label: 'Перші серії', value: '19–25 листопада 2026' },
  { label: 'Підсумки', value: 'до 20 лютого 2027' },
]

const RULES: { title: string; text: string }[] = [
  {
    title: 'Ритм',
    text: 'Перші серії виходять протягом тижня 19–25 листопада. День, у який вийшла ваша перша серія, лишається вашим на всі десять тижнів: почали в середу — виходите щосереди. Днів на тиждень сім, місць на кожен день два, розподіляємо в порядку прийому заявок. Пропустили тиждень без попередження — вибули. Можна здати кілька серій наперед, вони опублікуються за розкладом; один раз за конкурс можна перенести вихід на 48 годин, попередивши редакцію.',
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
  ['Перші серії', '19–25 листопада'],
  ['Різдвяна пауза', '24 грудня — 6 січня'],
  ['Останні серії', '4–10 лютого 2027'],
  ['Підсумки', 'до 20 лютого'],
  ['Виплати', 'до 28 лютого'],
  ['Газетний місяць переможця', 'березень'],
]

const COMMON_RULES: string[] = [
  'Серія має вийти у свій день. Кожна серія проходить редактуру перед публікацією.',
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

export default function KonkursyPage() {
  return (
    <main style={{ background: NAVY_DEEP, color: CREAM, fontFamily: FONT }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '36px 20px 96px' }}>

        <Breadcrumbs items={[{ label: 'Конкурси' }]} />

        {/* ─── Перший екран ─── */}
        <div
          style={{
            background: NAVY,
            border: `1px solid rgba(239,159,39,0.4)`,
            borderRadius: 18,
            padding: '34px 26px 28px',
            marginTop: 18,
            marginBottom: 26,
          }}
        >
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
            Далі <span style={{ color: GOLD }}>буде</span>
          </h1>

          <div style={{ width: 82, height: 4, background: GOLD, borderRadius: 2, margin: '16px 0 18px' }} />

          <p style={{ fontSize: 18, color: SOFT, lineHeight: 1.65, margin: 0, maxWidth: 640 }}>
            Десять тижнів. Десять серій. Одна історія, яку читач чекає щотижня.
            Переможця обирає не журі — його обирають ті, хто дочитав.
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
            згенеровані штучним інтелектом, не приймаються.
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
            Конкурс не одноразовий. «Далі буде» проходить двічі на рік — узимку й навесні. Кожен раунд
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
            <li>заявки подаються лише через Особистий кабінет.</li>
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

      </div>
    </main>
  )
}
