import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import LogoutButton from './LogoutButton'
import { dbQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const hasSubscription = profile?.subscription_until && new Date(profile.subscription_until) > new Date()

  // Чи має ця людина кабінет автора. Раніше сюди потрапляли й автори — і не
  // мали звідси жодного шляху до своїх творів, бо кабінет живе за іншою
  // адресою. Тепер, якщо профіль автора є, показуємо перехід у кабінет.
  let isAuthor = false
  try {
    const res = await dbQuery(
      `select 1
         from author_profiles
        where user_id = $1::uuid
          and is_active
        limit 1`,
      [user.id],
    )
    isAuthor = res.rows.length > 0
  } catch {
    // Не змогли перевірити — просто не показуємо блок.
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '2rem 1rem',
      background: '#fef3c7',
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        background: 'white',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          marginBottom: '1.5rem',
          color: '#1f2937',
        }}>
          Мій профіль
        </h1>

        {isAuthor && (
          <a
            href="/author/dashboard"
            style={{
              display: 'block',
              marginBottom: '1.75rem',
              padding: '1rem 1.15rem',
              background: '#fff7e6',
              border: '2px solid #ef9f27',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#92400e' }}>
              Кабінет автора →
            </div>
            <div style={{ fontSize: '0.92rem', color: '#7c4a12', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Ваші твори, статистика прочитань, договір і реквізити для виплат.
            </div>
          </a>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Email
          </div>
          <div style={{ fontSize: '1rem', color: '#1f2937', fontWeight: 500 }}>
            {user.email}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
            Підписка
          </div>
          {hasSubscription ? (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#d1fae5',
              borderRadius: '8px',
              color: '#065f46',
            }}>
              <strong>Активна:</strong> {profile.subscription_tier || 'базова'}
              <br />
              <span style={{ fontSize: '0.9rem' }}>
                до {new Date(profile.subscription_until).toLocaleDateString('uk-UA')}
              </span>
            </div>
          ) : (
            <div style={{
              padding: '0.75rem 1rem',
              background: '#fef3c7',
              borderRadius: '8px',
              color: '#92400e',
            }}>
              Немає активної підписки.{' '}
              <a href="/" style={{ color: '#b45309', textDecoration: 'underline' }}>
                Обрати план
              </a>
            </div>
          )}
        </div>

        {profile?.referral_code && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Реферальний код
            </div>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              display: 'inline-block',
            }}>
              {profile.referral_code}
            </div>
          </div>
        )}

        {profile?.bonus_points > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
              Бонусні бали
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937' }}>
              {profile.bonus_points}
            </div>
          </div>
        )}

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <a
            href="/moi-avtory"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              background: '#fef3c7',
              color: '#92400e',
              textDecoration: 'none',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            Мої автори →
          </a>
          <div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  )
}