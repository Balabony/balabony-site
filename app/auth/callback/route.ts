import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { mergeAnonInto } from '@/lib/reader-id'
import { bindReferralIfAny } from '@/lib/referral'

// =============================================================================
// ПОВЕРНЕННЯ ПІСЛЯ ВХОДУ ЗА ПОСИЛАННЯМ
//
// Було: після входу всіх без винятку вело на /profile — сторінку читача.
// Одноразове посилання з адмінки несло ?next=/author/dashboard і працювало,
// але щойно воно протермінувалось і автор заходив через /login, він потрапляв
// у профіль читача, кабінету не знаходив і вважав, що не ввійшов. Саме про це
// писали автори в перші дні.
//
// Стало: якщо ?next заданий явно — поважаємо його. Якщо ні — дивимось, чи є в
// людини активний профіль автора, і ведемо в кабінет. Читача це не зачіпає.
// =============================================================================

/** Пускаємо лише внутрішні шляхи: «//host» та «https://host» — це чужий сайт. */
function safeNext(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const explicitNext = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (explicitNext) {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await mergeAnonInto(user.id)
            await bindReferralIfAny(user.id)
          }
        } catch {
          // не критично — вхід важливіший
        }
        return NextResponse.redirect(`${origin}${explicitNext}`)
      }

      // Куди вести за замовчуванням: автора — у кабінет, решту — у профіль.
      let destination = '/profile'
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Історія, накопичена до входу, і прив'язка до того, хто привів.
          // Обидві операції мовчазні: вхід не має ламатися через них.
          await mergeAnonInto(user.id)
          await bindReferralIfAny(user.id)

          const res = await dbQuery(
            `select 1
               from author_profiles
              where user_id = $1::uuid
                and is_active
              limit 1`,
            [user.id],
          )
          if (res.rows.length > 0) destination = '/author/dashboard'
        }
      } catch {
        // Не змогли перевірити — ведемо у профіль, як раніше. Вхід не ламаємо.
      }

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
