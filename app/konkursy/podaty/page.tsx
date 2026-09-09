import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import ContestSubmitForm from '@/app/components/ContestSubmitForm'

/**
 * Подача твору на конкурс.
 *
 * Окрема сторінка, а не пункт у формі «Написати редакції»: та форма — лист із
 * стелею 8000 символів, куди не вміщається навіть одна серія серіалу.
 */

export const metadata: Metadata = {
  title: 'Подати твір на конкурс · Балабони',
  description: 'Порядок надсилання конкурсних творів на Балабонах: вхід у кабінет, вибір конкурсу, файли серій, підтвердження на пошту.',
  alternates: { canonical: '/konkursy/podaty' },
}

const GOLD = '#ef9f27'
const CREAM = '#f5f0e8'
const MUTED = '#8899bb'
const TEXT = '#dbe4f0'
const SERIF = "'Lora', Georgia, serif"

const STEPS: { title: string; text: string }[] = [
  {
    title: 'Увійдіть у кабінет',
    text: 'Заявку приймаємо від автора, який увійшов: так ми точно знаємо, хто подав, і надсилаємо підтвердження на вашу пошту. Вхід без пароля — за посиланням із листа.',
  },
  {
    title: 'Виберіть конкурс',
    text: 'Подаватися можна на кілька конкурсів одразу, але кожен твір — лише на один із них. Той самий текст у двох конкурсах не приймається.',
  },
  {
    title: 'Опишіть твір',
    text: 'Назва, анотація на 2–4 речення й жанр. Анотацію читач побачить у списку — це те, через що він вирішує відкривати чи ні.',
  },
  {
    title: 'Прикріпіть файли',
    text: 'Кожна серія — окремим файлом, .docx або .txt. Порядок серій береться з порядку файлів у переліку, тож називайте їх числами: 1, 2, 3. У серіалі «Це довга історія» серії можна досилати по черзі, у міру написання. У «П’яти вечорах» правила вимагають усі п’ять одразу.',
  },
  {
    title: 'Перевірте, що ми показали',
    text: 'Після надсилання ви побачите перелік прийнятих серій із кількістю слів у кожній. Якщо якийсь файл не вкладається в межі конкурсу, заявка не зберігається зовсім — ми назвемо файл і кількість слів у ньому, щоб було що виправляти.',
  },
  {
    title: 'Чекайте на лист',
    text: 'Підтвердження приходить одразу, з переліком того, що ми отримали. Якщо його немає за п’ять хвилин — гляньте теку «Спам», а тоді пишіть нам. Редакція відповідає протягом десяти днів.',
  },
]

export default function Page() {
  return (
    <main style={{ background: '#0a1628', minHeight: '100vh', padding: '1.5rem 1rem 4rem' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Breadcrumbs items={[{ label: 'Конкурси', href: '/konkursy' }, { label: 'Подати твір' }]} />

        <h1 style={{ fontFamily: SERIF, fontSize: '2rem', color: CREAM, margin: '1rem 0 0.5rem' }}>
          Подати твір на конкурс
        </h1>
        <p style={{ color: TEXT, lineHeight: 1.75, marginBottom: '2rem' }}>
          Умови, нагороди й дати кожного конкурсу — на{' '}
          <Link href="/konkursy" style={{ color: GOLD }}>сторінці конкурсів</Link>.
          Тут сама подача.
        </p>

        <ContestSubmitForm />

        <h2 style={{ fontFamily: SERIF, fontSize: '1.4rem', color: GOLD, margin: '2.5rem 0 1rem' }}>
          Порядок надсилання
        </h2>
        <ol style={{ paddingLeft: 0, listStyle: 'none', margin: 0 }}>
          {STEPS.map((s, i) => (
            <li key={s.title} style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
              <span style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                border: `1px solid ${GOLD}`, color: GOLD, fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </span>
              <span>
                <strong style={{ color: CREAM, display: 'block', marginBottom: 4 }}>{s.title}</strong>
                <span style={{ color: TEXT, lineHeight: 1.7, fontSize: '0.95rem' }}>{s.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <p style={{
          color: TEXT, lineHeight: 1.7, fontSize: '0.92rem', marginTop: '2rem',
          padding: '14px 16px', borderRadius: 10,
          background: 'rgba(239,159,39,0.08)', border: '1px solid rgba(239,159,39,0.3)',
        }}>
          <strong style={{ color: CREAM }}>Якщо щось не працює</strong> — надішліть файли на{' '}
          <a href="mailto:nazar@balabony.com" style={{ color: GOLD }}>nazar@balabony.com</a>.
          Заявку приймемо, підтвердження надішлемо руками. Жоден твір не загубиться через нашу форму.
        </p>

        <p style={{ color: MUTED, fontSize: '0.85rem', marginTop: '1.5rem', lineHeight: 1.7 }}>
          Форматування з Word (жирний, курсив) у художньому тексті не зберігається — абзаци сайт
          малює сам. Якщо виділення несе зміст, напишіть про це редакції окремо.
        </p>
      </div>
    </main>
  )
}
