'use client'

import ProtectedEmail from '@/app/components/ProtectedEmail'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import NarrationOrderForm from '@/app/components/NarrationOrderForm'

const GOLD = 'var(--accent-gold)'
const FONT = "'Montserrat', Arial, sans-serif"
const SERIF = "'Lora', serif"

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0f1e3a', border: `1.5px solid ${GOLD}`,
      borderRadius: 16, padding: '28px 28px',
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 16 }}>
      {children}
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <span style={{ color: GOLD, fontWeight: 700, fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65 }}>{children}</span>
    </li>
  )
}

function StepItem({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
      <span style={{
        width: 28, height: 28, borderRadius: '50%', background: GOLD, color: '#fff',
        fontFamily: FONT, fontWeight: 700, fontSize: 13, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{num}</span>
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, paddingTop: 4 }}>{children}</span>
    </li>
  )
}

export default function BecomeAuthorPage() {
  return (
    <main style={{ background: '#0a1628', padding: '48px 20px 100px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Хлібні крихти замість окремого логотипу */}
        <Breadcrumbs items={[{ label: 'Стати автором' }]} />

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 12 }}>
            Для авторів
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: '#f5f0e8', margin: '0 0 12px', lineHeight: 1.2 }}>
            Стань автором Balabony
          </h1>
          <p style={{ fontSize: 20, fontFamily: SERIF, fontStyle: 'italic', color: GOLD, marginBottom: 20 }}>
            Пишеш? Ми чекаємо на тебе.
          </p>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, maxWidth: 580 }}>
            Balabony — українська платформа коротких історій і серіалів для всієї родини. Ми шукаємо авторів, які хочуть ділитись своїми історіями і заробляти на цьому. Писати може будь-хто — головне оригінальність, цікавий сюжет і жива мова без штучного інтелекту.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Як це працює */}
          <SectionCard>
            <SectionTitle>Як це працює</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <StepItem num={1}>
                Ти надсилаєш історію через кабінет. Ми розглядаємо її і, якщо публікуємо, вона починає працювати.
              </StepItem>
              <StepItem num={2}>
                Винагорода нараховується за прочитання — коли читач прочитав щонайменше 70% тексту. Один читач, один твір, не частіше разу на добу.
              </StepItem>
              <StepItem num={3}>
                Дохід від передплати щомісяця розподіляється між усіма авторами пропорційно до прочитань їхніх творів. Твоя частка — 50% або 40%, залежно від статусу.
              </StepItem>
              <StepItem num={4}>
                Жодних авансів: платимо за те, що людей справді читали, а не за факт публікації.
              </StepItem>
            </ul>
          </SectionCard>

          {/* Умови співпраці */}
          <SectionCard>
            <SectionTitle>Умови співпраці</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 8 }}>Для авторів-ФОП</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: SERIF, marginBottom: 6 }}>50%</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  доходу від твоїх історій — твої.<br />
                  Ти самостійно сплачуєш податки.
                </div>
              </div>
              <div style={{ background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.3)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: GOLD, fontFamily: FONT, marginBottom: 8 }}>Для інших авторів</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: GOLD, fontFamily: SERIF, marginBottom: 6 }}>40%</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
                  доходу від твоїх історій — твої, на руки.<br />
                  ПДФО і військовий збір платформа сплачує понад цю суму.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Угоду підписуємо електронно — через Дію або кваліфікованим електронним підписом (файловий ключ чи токен). Обидва способи запускаємо; поки що підписуємо паперово.
            </div>
          </SectionCard>

          {/* Кабінет автора */}
          <SectionCard>
            <SectionTitle>Кабінет автора</SectionTitle>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.65, marginTop: 0, marginBottom: 16 }}>
              Кабінет відкривається одразу після реєстрації — у ньому ти заповнюєш реквізити й
              підписуєш угоду. Після підписання там з&apos;являється усе про твої історії:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <CheckItem>Історії та їхній статус: на розгляді, опубліковано, не опубліковано</CheckItem>
              <CheckItem>Прочитання по кожній історії окремо — скільки людей дочитало текст до кінця, а не просто відкрило</CheckItem>
              <CheckItem>Баланс: нараховано, виплачено, до виплати — цифри оновлюються постійно, не раз на місяць</CheckItem>
              <CheckItem>Перелік творів, охоплених угодою — це Додаток № 1, його можна будь-коли завантажити у PDF</CheckItem>
              <CheckItem>Реквізити й ставка: статус ФОП або фізособи, IBAN, псевдонім; ставка перераховується автоматично, коли змінюєш статус</CheckItem>
              <CheckItem>Підписані угоди з датою підпису</CheckItem>
            </ul>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginTop: 16, marginBottom: 0 }}>
              Там же — коротке опитування: що незручно, чого не хватає, що додати. Ми його читаємо.
            </p>
          </SectionCard>

          {/* Що ми шукаємо */}
          <SectionCard>
            <SectionTitle>Що ми шукаємо</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <CheckItem>Короткі історії до 10 хвилин читання</CheckItem>
              <CheckItem>Серіали з продовженням — до 1400 слів кожна серія</CheckItem>
              <CheckItem>Будь-який жанр: драма, гумор, казка, детектив, романтика, трилер, пригоди, фантастика, містика, історична проза, сімейна історія, бойовик</CheckItem>
              <CheckItem>Українська мова</CheckItem>
              <CheckItem>Оригінальний контент — без плагіату і без використання ШІ</CheckItem>
              <CheckItem>Кожна історія перевіряється на ШІ-генерацію перед публікацією</CheckItem>
            </ul>
          </SectionCard>

          {/* Особистий кабінет */}
          <SectionCard>
            <SectionTitle>Особистий кабінет автора</SectionTitle>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 16 }}>
              Після підписання угоди ти отримуєш доступ до особистого кабінету де бачиш:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <CheckItem>Кількість переглядів кожної історії</CheckItem>
              <CheckItem>Відгуки читачів</CheckItem>
              <CheckItem>Нарахування коштів у реальному часі</CheckItem>
            </ul>
          </SectionCard>

          {/* Як подати заявку */}
          <SectionCard>
            <SectionTitle>Як подати заявку</SectionTitle>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
              <StepItem num={1}>
                Напиши нам на{' '}
                <ProtectedEmail
                  user="nazar"
                  domain="balabony.com"
                  subject="Заявка автора"
                  style={{ color: GOLD, fontWeight: 600, textDecoration: 'underline' }}
                />
              </StepItem>
              <StepItem num={2}>
                Вкажи своє реальне ім'я та прізвище, номер телефону і email — актуальні контакти обов'язкові
              </StepItem>
              <StepItem num={3}>
                Прикріпи одну пробну історію
              </StepItem>
            </ul>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
              Ми відповімо протягом 5 робочих днів.
            </p>
            <a
              href="/contact"
              style={{
                display: 'inline-block', padding: '14px 32px',
                background: GOLD, color: '#fff', borderRadius: 12,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                fontFamily: FONT,
              }}
            >
              Написати нам →
            </a>
          </SectionCard>

          {/* Замовити озвучення */}
          <NarrationOrderForm />

        </div>
      </div>
    </main>
  )
}
