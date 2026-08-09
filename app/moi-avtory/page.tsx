import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import Breadcrumbs from '@/app/components/Breadcrumbs'
import { ThemeProvider } from '@/app/context/ThemeContext'
import { authorSlug } from '@/lib/author-slug'

/**
 * «Мої автори»: за ким стежить читач.
 *
 * Сторінка приватна — тут видно лише власні підписки, тому force-dynamic
 * і жодного кешу: інакше перший відвідувач визначив би вміст для решти.
 *
 * Профілі тягнемо service role, бо RLS на author_profiles відкриває
 * читачеві не все, а показати треба ім'я й фото автора, за яким він
 * сам же й стежить.
 */

export const dynamic = 'force-dynamic'

const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

export const metadata: Metadata = {
  title: 'Мої автори — Балабони',
  robots: { index: false, follow: false },
}

interface FollowRow {
  author_user_id: string
  created_at: string
}

interface ProfileRow {
  user_id: string
  display_name: string | null
  pen_name: string | null
  bio: string | null
  avatar_url: string | null
}

function nameOf(p: ProfileRow): string {
  return p.pen_name?.trim() || p.display_name?.trim() || 'Автор'
}

export default async function MyAuthorsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: follows } = await supabase
    .from('author_follows')
    .select('author_user_id, created_at')
    .eq('follower_id', user.id)
    .order('created_at', { ascending: false })

  const rows = (follows ?? []) as FollowRow[]
  const ids = rows.map((r) => r.author_user_id)

  let profiles: ProfileRow[] = []
  if (ids.length > 0) {
    const admin = getSupabaseAdmin()
    const { data } = await admin
      .from('author_profiles')
      .select('user_id, display_name, pen_name, bio, avatar_url')
      .in('user_id', ids)
      .eq('is_active', true)
    profiles = (data ?? []) as ProfileRow[]
  }

  // Порядок беремо з підписок, а не з бази профілів: найновіші зверху,
  // як людина їх і додавала.
  const byId = new Map(profiles.map((p) => [p.user_id, p]))
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((p): p is ProfileRow => Boolean(p))

  return (
    <ThemeProvider>
      <Header />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px', minHeight: '60vh' }}>
        <Breadcrumbs items={[{ label: 'Мої автори' }]} />

        <h1
          style={{
            fontFamily: '"Comfortaa", sans-serif',
            fontSize: 32,
            margin: '0 0 8px',
            color: 'var(--accent-gold)',
          }}
        >
          Мої автори
        </h1>

        <p style={{ fontFamily: FONT, fontSize: 15, color: '#94a3b8', margin: '0 0 28px' }}>
          Автори, за якими ви стежите.
        </p>

        {ordered.length === 0 ? (
          <div style={{ fontFamily: FONT, fontSize: 16, color: '#cbd5e1', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 16px' }}>
              Ви поки що ні за ким не стежите.
            </p>
            <p style={{ margin: 0 }}>
              Відкрийте{' '}
              <Link href="/avtory" style={{ color: GOLD, textDecoration: 'underline' }}>
                список авторів
              </Link>{' '}
              і натисніть «Стежити» на сторінці того, чиї історії вам до душі.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}
          >
            {ordered.map((p) => {
              const name = nameOf(p)
              return (
                <Link
                  key={p.user_id}
                  href={`/avtor/${authorSlug(name)}`}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid rgba(239,159,39,0.25)',
                    textDecoration: 'none',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  {p.avatar_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.avatar_url}
                      alt={name}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(239,159,39,0.5)',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'rgba(239,159,39,0.15)',
                        flexShrink: 0,
                      }}
                      aria-hidden
                    />
                  )}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FONT,
                        fontSize: 16,
                        fontWeight: 600,
                        color: GOLD,
                        marginBottom: 4,
                      }}
                    >
                      {name}
                    </div>
                    {p.bio?.trim() && (
                      <div
                        style={{
                          fontFamily: FONT,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: '#94a3b8',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.bio}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </ThemeProvider>
  )
}
