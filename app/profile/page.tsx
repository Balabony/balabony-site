import { redirect } from 'next/navigation'
import MyLibrary from '@/app/components/MyLibrary'
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
      background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 100%)',
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        background: '#0D1B2A',
        border: '1px solid rgba(239,159,39,0.22)',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          marginBottom: '1.5rem',
          color: '#FFF8EE',
          fontFamily: "'Comfortaa', sans-serif",
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
              background: 'rgba(239,159,39,0.10)',
              border: '1px solid rgba(239,159,39,0.55)',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FAC775' }}>
              Кабінет автора →
            </div>
            <div style={{ fontSize: '0.92rem', color: '#C7BFB2', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Ваші твори, статистика прочитань, договір і реквізити для виплат.
            </div>
          </a>
        )}

        {/* Збережене й недочитане — те, по що читач найчастіше сюди й заходить. */}
        <MyLibrary />

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Email
          </div>
          <div style={{ fontSize: '1rem', color: '#FFF8EE', fontWeight: 500 }}>
            {user.email}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Підписка
          </div>
          {hasSubscription ? (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(125,219,160,0.12)',
              borderRadius: '8px',
              color: '#7ddba0',
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
              background: 'rgba(239,159,39,0.12)',
              borderRadius: '8px',
              color: '#FAC775',
            }}>
              Немає активної підписки.{' '}
              <a href="/" style={{ color: '#FAC775', textDecoration: 'underline' }}>
                Обрати план
              </a>
            </div>
          )}
        </div>

        {profile?.referral_code && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
              Реферальний код
            </div>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255,248,238,0.07)',
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
            <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
              Бонусні бали
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF8EE' }}>
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
              background: 'rgba(239,159,39,0.12)',
              color: '#FAC775',
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