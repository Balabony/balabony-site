import { redirect } from 'next/navigation'
import { getEditor } from '@/lib/editor-auth'

/**
 * Кабінет редактора — ЗАГОТОВКА.
 *
 * Зараз сторінка лише підтверджує, що сесія працює: показує, хто зайшов.
 * Перелік призначених робіт з'явиться тут наступним кроком (contest_assignments
 * уже створена, але призначень ще немає — їх ставить Богдан в адмінці).
 *
 * Прізвищ авторів на цій сторінці не буде НІКОЛИ: в умовах конкурсів
 * обіцяно, що редактор бачить номер і назву роботи.
 */

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const NAVY_DEEP = '#0a1628'
const NAVY = '#0f1e3a'

export default async function EditorHomePage() {
  const editor = await getEditor()
  if (!editor) redirect('/editor/login')

  return (
    <div style={{
      minHeight: '100vh', background: NAVY_DEEP,
      fontFamily: FONT, padding: '48px 16px',
    }}>
      <div style={{
        background: NAVY, borderRadius: 20, padding: '36px 32px',
        maxWidth: 620, margin: '0 auto',
        border: '1px solid rgba(239,159,39,0.25)',
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-gold)' }}>Balabony</div>
        <div style={{
          fontSize: 11, color: '#8899bb', letterSpacing: 2,
          textTransform: 'uppercase', marginBottom: 24,
        }}>
          Кабінет редактора
        </div>

        <p style={{ color: '#f5f0e8', fontSize: 17, marginBottom: 8 }}>
          Вітаємо, {editor.name}.
        </p>
        <p style={{ color: '#c8d4e8', lineHeight: 1.7, margin: 0 }}>
          Вхід працює. Перелік призначених вам робіт з’явиться тут,
          щойно роботи буде розподілено.
        </p>
      </div>
    </div>
  )
}
