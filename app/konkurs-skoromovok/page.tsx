// 01.11.2026: сторінка дитячого конкурсу «Скоромовка Балабонів» — умови, форма подання, положення, FAQ.
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { C, SERIF, SANS, Card, Label, H1, Lead, Crumbs, FaqLd, IconTip } from '../pravopys/ui'
import { KIDS_CONTEST as K, AGE_GROUPS, MAX_PER_CHILD } from '@/lib/kids-contest'
import Form from './Form'

const TITLE = 'Конкурс скоромовок для дітей 2026 — «Скоромовка Балабонів»'
const DESC = 'Всеукраїнський дитячий конкурс скоромовок для учнів 1–11 класів: придумай власну скоромовку українською і вигравай книжки українських письменників. Цифрові дипломи й сертифікати. Прийом з 10 листопада до 4 грудня 2026.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: 'https://balabony.com' + K.path },
  openGraph: { title: TITLE, description: DESC, url: 'https://balabony.com' + K.path, type: 'website' },
}

const FAQ = [
  { q: 'Хто може взяти участь у конкурсі скоромовок?', a: 'Діти й учні 1–11 класів з України та з-за кордону. Роботу подає дорослий: один із батьків, законний представник або вчитель.' },
  { q: 'Якою має бути скоромовка?', a: 'Власна, ще ніде не опублікована, українською мовою, від 1 до 4 рядків. Від одного учасника — до 3 скоромовок.' },
  { q: 'Що отримають переможці?', a: 'Книжку українського письменника, цифровий диплом, а скоромовку озвучимо й опублікуємо на Балабонах з ім’ям автора. Усі учасники отримають цифровий сертифікат.' },
  { q: 'Чи може вчитель подати роботи всього класу?', a: 'Так. Вчитель отримує цифровий сертифікат за підготовку учасників, а клас, який подасть найбільше робіт, — набір книжок для шкільної бібліотеки.' },
  { q: 'Чи обов’язкова реєстрація?', a: 'Так. Подати скоромовку можна лише після реєстрації на Балабонах. Реєструється дорослий — один із батьків, законний представник або вчитель. Це безкоштовно і займає хвилину: через пошту або Google.' },
  { q: 'Чи публікуєте прізвище дитини?', a: 'Ні. Публікуємо лише ім’я, вік і місто дитини.' },
]

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.BORDER}`, borderLeft: `6px solid ${C.GOLD}`, borderRadius: 14, padding: '12px 16px' }}>
      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase', color: C.MUTED }}>{k}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.NAVY }}>{v}</div>
    </div>
  )
}

const H2 = ({ children, id }: { children: ReactNode; id?: string }) => <h2 id={id} style={{ fontFamily: SERIF, fontSize: 28, color: C.NAVY, margin: '0 0 12px', lineHeight: 1.25 }}>{children}</h2>

export default function Page() {
  const eventLd = {
    '@context': 'https://schema.org', '@type': 'Event', name: 'Всеукраїнський дитячий конкурс скоромовок «Скоромовка Балабонів» 2026',
    description: DESC, startDate: '2026-11-10', endDate: '2026-12-15', eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode', location: { '@type': 'VirtualLocation', url: 'https://balabony.com' + K.path },
    organizer: { '@type': 'Organization', name: 'Балабони', url: 'https://balabony.com' }, inLanguage: 'uk', isAccessibleForFree: true,
  }
  return (
    <main style={{ background: C.NAVY, minHeight: '100vh', padding: '40px 16px 96px', fontFamily: SANS, color: C.TEXT, fontSize: 20, lineHeight: 1.65 }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <a href="/" style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: C.GOLD, textDecoration: 'none' }}>Балабони</a>
        <Crumbs items={[{ name: 'Балабони', href: '/' }, { name: 'Конкурси', href: '/konkursy' }, { name: 'Конкурс скоромовок для дітей', href: K.path }]} />
        <div style={{ height: 18 }} />

        <Card>
          <Label>Дитячий конкурс · 1–11 клас</Label>
          <H1>Конкурс скоромовок для дітей 2026 — «Скоромовка Балабонів»</H1>
          <Lead>Придумай <b style={{ color: C.NAVY }}>власну скоромовку українською</b> і вигравай <b style={{ color: C.NAVY }}>книжки українських письменників</b>. Всеукраїнський дитячий конкурс скоромовок для учнів 1–11 класів і всієї родини.</Lead>
          <p style={{ margin: '0 0 18px' }}>Прийом робіт — з {K.startText} до {K.endText}. Напиши скоромовку з 1–4 рядків, яка «заплітає язика», і подай її через форму нижче. <b style={{ color: C.NAVY }}>Обов’язкова умова — реєстрація на Балабонах</b>: безкоштовно, за хвилину, через пошту або Google. Зверніться до батьків або педагогів — вони допоможуть. Переможців оголосимо {K.resultsText} — до Різдва. Найкращі скоромовки озвучимо й опублікуємо на Балабонах з ім’ям автора.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <Fact k="Прийом робіт" v={`${K.startText} – 4 грудня`} />
            <Fact k="Голосування" v="5–11 грудня" />
            <Fact k="Переможці" v="15 грудня" />
            <Fact k="Нагороди" v="Книжки й цифрові дипломи" />
            <Fact k="Участь" v="Обов’язкова реєстрація" />
          </div>
          <p style={{ margin: '18px 0 0' }}><a href="#forma" style={{ display: 'inline-block', background: C.GOLD, color: C.NAVY, fontWeight: 800, padding: '12px 22px', borderRadius: 999, textDecoration: 'none', fontSize: 18 }}>Подати скоромовку →</a></p>
        </Card>

        <Card>
          <H2>Вікові групи</H2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>{AGE_GROUPS.map((g) => <li key={g.id} style={{ margin: '4px 0' }}><b style={{ color: C.NAVY }}>{g.label}</b></li>)}</ul>
          <div style={{ background: C.GOLD_BG, border: `2px dashed ${C.GOLD}`, borderRadius: 16, padding: '14px 18px', margin: '18px 0 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <IconTip />
            <div>Як придумати скоромовку: візьми 2–3 схожі звуки (<b style={{ color: C.NAVY }}>р–л, ш–с, ж–з</b>) і склади з ними смішну історію. Перевір: якщо швидко вимовити тричі поспіль важко — вийшло!</div>
          </div>
        </Card>

        <Card id="forma">
          <H2>Подати скоромовку на конкурс</H2>
          <Form />
        </Card>

        <Card>
          <H2>Педагогам і керівникам шкіл</H2>
          <p style={{ margin: '0 0 10px' }}><b style={{ color: C.NAVY }}>Запрошуємо до співпраці педагогів і керівників шкіл.</b> Конкурс скоромовок можна провести як урок розвитку мовлення або позакласний захід — достатньо 15 хвилин.</p>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li>вчитель може подати роботи всього класу — по одній формі на кожну скоромовку;</li>
            <li>вчитель отримує <b style={{ color: C.NAVY }}>цифровий сертифікат за підготовку учасників</b>;</li>
            <li>клас, який подасть найбільше робіт, — <b style={{ color: C.NAVY }}>набір книжок для шкільної бібліотеки</b>.</li>
          </ul>
          <p style={{ margin: '12px 0 0' }}>Питання й співпраця: <a href="mailto:nazar@balabony.com" style={{ color: C.NAVY, fontWeight: 700 }}>nazar@balabony.com</a></p>
        </Card>

        <Card id="polozhennia">
          <H2>Положення конкурсу «Скоромовка Балабонів» 2026</H2>
          <ol style={{ margin: 0, paddingLeft: 24 }}>
            <li><b>Організатор</b> — українська літературна платформа «Балабони» (balabony.com).</li>
            <li><b>Мета</b> — розвиток мовлення, словникового запасу й любові до української мови через гру зі звуками й словами.</li>
            <li><b>Учасники</b> — діти й учні 1–11 класів з України та з-за кордону. Вікові групи: 1–4 клас, 5–7 клас, 8–11 клас, «Родинна скоромовка».</li>
            <li><b>Завдання</b> — власна, ще ніде не опублікована скоромовка українською мовою, 1–4 рядки. Від одного учасника — до {MAX_PER_CHILD} скоромовок.</li>
            <li><b>Подання</b> — лише після обов’язкової реєстрації на Балабонах, через форму на цій сторінці. Подає один із батьків, законний представник або вчитель (за згоди батьків). Публікуємо лише ім’я, вік і місто дитини; прізвище не публікуємо.</li>
            <li><b>Строки</b> — прийом робіт: {K.startText} – {K.endText}; глядацьке голосування: {K.voteText}; оголошення переможців: {K.resultsText}.</li>
            <li><b>Журі</b> — три редактори Балабонів. Критерії: оригінальність; звукова гра («заплітає язика»); грамотність; дотепність і зміст. Окремо — «Приз глядацьких симпатій» за голосами зареєстрованих читачів; накручені голоси не зараховуються.</li>
            <li><b>Нагороди</b> — переможці кожної вікової групи отримують книжку українського письменника і цифровий диплом, а скоромовку озвучуємо й публікуємо в розділі «Скоромовки» з ім’ям автора. Усі учасники отримують цифровий сертифікат з номером, який можна перевірити на сайті. Вчитель отримує цифровий сертифікат за підготовку учасників. Клас із найбільшою кількістю робіт, що відповідають умовам, — набір книжок для шкільної бібліотеки. Книжки надсилаємо Укрпоштою по Україні.</li>
            <li><b>Авторські права</b> — авторство залишається за дитиною. Подаючи роботу, законний представник надає Балабонам безоплатний дозвіл на публікацію та озвучення скоромовки на платформі із зазначенням автора.</li>
            <li><b>Контакт</b> — <a href="mailto:nazar@balabony.com" style={{ color: C.NAVY }}>nazar@balabony.com</a>.</li>
          </ol>
        </Card>

        <Card>
          <H2>Питання й відповіді</H2>
          {FAQ.map((f) => (
            <div key={f.q} style={{ margin: '0 0 14px' }}>
              <h3 style={{ fontSize: 20, color: C.NAVY, margin: '0 0 4px' }}>{f.q}</h3>
              <p style={{ margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </Card>

        <Card>
          <H2>Читайте й тренуйтеся</H2>
          <ul style={{ margin: 0, paddingLeft: 22 }}>
            <li><a href="/skoromovky" style={{ color: C.NAVY, fontWeight: 700 }}>Скоромовки українською для дітей</a> — для натхнення й розминки</li>
            <li><a href="/pravopys/uchnyam" style={{ color: C.NAVY, fontWeight: 700 }}>Правопис для учнів 5–9 класу</a> — щоб скоромовка була без помилок</li>
            <li><a href="/zahadky" style={{ color: C.NAVY, fontWeight: 700 }}>Загадки з відповідями</a></li>
            <li><a href="/konkursy" style={{ color: C.NAVY, fontWeight: 700 }}>Усі конкурси Балабонів</a></li>
          </ul>
        </Card>

        <FaqLd faq={FAQ} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
      </div>
    </main>
  )
}
