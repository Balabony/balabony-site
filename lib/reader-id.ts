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
