import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getOrCreateAnonUserId } from '@/lib/anon-user'

/**
 * Хто зараз читає: акаунт, якщо людина увійшла, інакше анонімний cookie.
 *
 * Навіщо. Прочитання, бали, серія днів і відгуки писалися на `balabony_uid` —
 * cookie, що живе рік. Для гостя це правильно, для зареєстрованого — ні:
 * він заходив із телефона замість ноутбука і бачив нуль прочитань та рівень
 * «Початківець» заново. Станом на 09.09.2026 у базі не було ЖОДНОГО рядка,
 * прив'язаного до акаунта: 320 прочитань і 546 нарахувань сиділи на 196 і 281
 * анонімних ідентифікаторах.
 *
 * Той самий код уже стояв окремо в закладках і прогресі читання. Тут він
 * зведений в одне місце, щоб правило не розійшлося між роутами.
 *
 * Заднім числом перенести не можна: зв'язку між cookie й акаунтом ніде не
 * збережено. Тому історія переїжджає в момент входу — див. mergeAnonInto().
 */
export async function resolveReaderId(): Promise<string> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user?.id) return data.user.id
  } catch {
    // не увійшов або сесія протухла — працюємо як з гостем
  }
  return getOrCreateAnonUserId()
}

/**
 * Анонімний id із cookie БЕЗ створення нового.
 *
 * Потрібен при вході: якщо cookie немає, переносити нічого, і створювати
 * порожній ідентифікатор лише заради перевірки не варто.
 */
export async function peekAnonId(): Promise<string | null> {
  try {
    const store = await cookies()
    const raw = store.get('balabony_uid')?.value
    return raw && raw.length === 36 ? raw : null
  } catch {
    return null
  }
}

/**
 * Перенести історію з анонімного cookie на акаунт при вході.
 *
 * Тільки ДОДАВАННЯМ: рядки копіюються, старі не видаляються. Якщо людина
 * потім вийде і читатиме гостем, вона нічого не втратить, а дублікати
 * відсіються унікальними ключами.
 *
 * Переносимо і `user_free_picks` з `referral_bonuses` — разом із переходом
 * /api/pick на цей же ідентифікатор. Порядок важливий: спершу копіюємо
 * витрачені безкоштовні твори на акаунт, і лише тому перемикання не роздає
 * їх наново. Побічний виграш: очищення cookie більше не обнуляє ліміт
 * залогіненому читачеві.
 */
export async function mergeAnonInto(userId: string): Promise<void> {
  const anon = await peekAnonId()
  if (!anon || anon === userId) return

  const { dbQuery } = await import('@/lib/db')

  try {
    await dbQuery(
      `insert into user_episode_reads (user_id, episode_slug)
       select $1, episode_slug from user_episode_reads where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch {
    // не вдалося — не страшно, історія лишиться на cookie
  }

  try {
    await dbQuery(
      `insert into point_events (user_id, kind, ref, points)
       select $1, kind, ref, points from point_events where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch {
    // те саме: бали не критичний шлях
  }

  // Витрачені безкоштовні твори. Помилку тут ковтати НЕ можна мовчки:
  // якщо не перенести, читач отримає ліміт наново. Тому лише логуємо.
  try {
    await dbQuery(
      `insert into user_free_picks (user_id, content_type, season, content_id)
       select $1, content_type, season, content_id
         from user_free_picks where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch (e) {
    console.error('[mergeAnonInto] free_picks', (e as Error)?.message)
  }

  try {
    await dbQuery(
      `insert into referral_bonuses (user_id, story_id, season, channel)
       select $1, story_id, season, channel
         from referral_bonuses where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch (e) {
    console.error('[mergeAnonInto] referral_bonuses', (e as Error)?.message)
  }
}
