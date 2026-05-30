import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import LogoutButton from '../profile/LogoutButton'

export const dynamic = 'force-dynamic'

type AuthorProfile = {
  user_id: string
  display_name: string
  email: string | null
  is_fop: boolean
  revenue_share: number
  payout_iban: string | null
  is_active: boolean
}

type StoryStat = {
  content_id: string
  title: string
  slug: string
  status: string
  is_free: boolean
  views_count: number
  reads_total: number
  reads_completed: number
  avg_read_percentage: number
}

type Balance = {
  total_accrued: number
  total_paid: number
  balance: number
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Чернетка',
  humanizing: 'Обробка',
  human_review: 'Перевірка',
  approved: 'Схвалено',
  published: 'Опубліковано',
}

function uah(n: number) {
  return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
}

export default async function AuthorDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Профіль автора (RLS: лише свій). Якщо профілю немає — користувач не автор.
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: AuthorProfile | null }

  if (!profile) {
    return (
      <main style={{ minHeight: '100vh', padding: '2rem 1rem', background: '#fef3c7' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', background: 'white', padding: '2.5rem', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem', color: '#1f2937' }}>Кабінет автора</h1>
          <p style={{ color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Ваш обліковий запис ще не підключено як авторський. Якщо ви подали заявку
            й очікуєте підтвердження — редакція активує доступ після підписання угоди.
          </p>
          <a href="/become-author" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: '#ef9f27', color: '#1f2937', borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
            Стати автором →
          </a>
        </div>
      </main>
    )
  }

  // Історії автора + перегляди/прочитання (RLS на content успадковується)
  const { data: stats } = await supabase
    .from('author_story_stats')
    .select('*')
    .eq('author_id', user.id)
    .order('views_count', { ascending: false }) as { data: StoryStat[] | null }

  const stories = stats || []

  // Баланс
  const { data: bal } = await supabase
    .from('author_balance')
    .select('total_accrued, total_paid, balance')
    .eq('author_id', user.id)
    .single() as { data: Balance | null }

  const balance: Balance = bal || { total_accrued: 0, total_paid: 0, balance: 0 }

  const totalViews = stories.reduce((s, x) => s + (x.views_count || 0), 0)
  const totalReads = stories.reduce((s, x) => s + (x.reads_total || 0), 0)
  const published = stories.filter(s => s.status === 'published').length

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 12, padding: '1.25rem 1.5rem',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flex: '1 1 160px',
  }
  const statNum: React.CSSProperties = { fontSize: '2rem', fontWeight: 700, color: '#1f2937', lineHeight: 1 }
  const statLabel: React.CSSProperties = { fontSize: '0.85rem', color: '#6b7280', marginTop: 6 }

  return (
    <main style={{ minHeight: '100vh', padding: '2rem 1rem', background: '#fef3c7' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Шапка */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', color: '#1f2937', margin: 0 }}>Кабінет автора</h1>
            <p style={{ color: '#6b7280', margin: '0.25rem 0 0' }}>{profile.display_name}</p>
          </div>
          <LogoutButton />
        </div>

        {/* Умови співпраці */}
        <div style={{ background: '#1f2937', color: 'white', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Ваші умови</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {profile.is_fop ? 'Автор-ФОП · 50%' : 'Без ФОП · 40%'}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, maxWidth: 420 }}>
            {profile.is_fop
              ? 'Половина доходу з ваших історій — ваша. Податки ви сплачуєте самостійно.'
              : '40% доходу з ваших історій — ваші. Податки сплачує платформа.'}
          </div>
        </div>

        {/* Зведення */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={card}><div style={statNum}>{published}</div><div style={statLabel}>опубліковано історій</div></div>
          <div style={card}><div style={statNum}>{totalViews}</div><div style={statLabel}>переглядів усього</div></div>
          <div style={card}><div style={statNum}>{totalReads}</div><div style={statLabel}>прочитань</div></div>
          <div style={{ ...card, background: '#065f46', color: 'white' }}>
            <div style={{ ...statNum, color: 'white' }}>{uah(balance.balance)} ₴</div>
            <div style={{ ...statLabel, color: 'rgba(255,255,255,0.8)' }}>баланс до виплати</div>
          </div>
        </div>

        {/* Деталі балансу */}
        <div style={{ background: 'white', borderRadius: 12, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div><div style={statLabel}>Нараховано всього</div><div style={{ fontWeight: 700, color: '#1f2937' }}>{uah(balance.total_accrued)} ₴</div></div>
          <div><div style={statLabel}>Виплачено</div><div style={{ fontWeight: 700, color: '#1f2937' }}>{uah(balance.total_paid)} ₴</div></div>
          <div><div style={statLabel}>До виплати</div><div style={{ fontWeight: 700, color: '#065f46' }}>{uah(balance.balance)} ₴</div></div>
        </div>

        {/* Список історій */}
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#1f2937' }}>
            Мої історії ({stories.length})
          </div>

          {stories.length === 0 ? (
            <div style={{ padding: '2rem 1.5rem', color: '#6b7280', textAlign: 'center' }}>
              Поки що до вашого профілю не прив&apos;язано жодної історії.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1.5rem' }}>Історія</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Статус</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Перегляди</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Прочитань</th>
                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'right' }}>Дочитування</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((s) => (
                    <tr key={s.content_id} style={{ borderTop: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem 1.5rem', color: '#1f2937', fontWeight: 500 }}>
                        {s.title}
                        {s.is_free && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: 999 }}>безкоштовна</span>}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6b7280' }}>{STATUS_LABEL[s.status] || s.status}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{s.views_count}</td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#1f2937' }}>{s.reads_total}</td>
                      <td style={{ padding: '0.75rem 1.5rem', textAlign: 'right', color: '#6b7280' }}>{s.avg_read_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '1rem', lineHeight: 1.5 }}>
          Нарахування з&apos;являються після оплат читачів за ваші історії. Виплати —
          за умовами угоди автора. Питання: <a href="/contact" style={{ color: '#b45309' }}>напишіть редакції</a>.
        </p>
      </div>
    </main>
  )
}
