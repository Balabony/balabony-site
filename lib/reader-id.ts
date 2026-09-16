import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getOrCreateAnonUserId, getAnonUserId } from '@/lib/anon-user'

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

  // Прочитання з article_reads. САМЕ З ЦІЄЇ таблиці рахуються дочитування
  // в конкурсах і винагорода авторам за договором, п. 1.5 — тому без цього
  // перенесення читач, який дочитав серії гостем і аж потім зареєструвався,
  // не приносив авторові нічого. Половина конкурсної оцінки складається
  // саме з цих чисел.
  //
  // Ключ таблиці — (user_id, content_id, read_date), тож `on conflict do
  // nothing` коректно відсіює день, який на акаунті вже зарахований.
  try {
    await dbQuery(
      `insert into article_reads
         (user_id, content_id, read_date, article_slug, article_title,
          completed, read_percentage, time_spent_seconds, read_at)
       select $1, content_id, read_date, article_slug, article_title,
              completed, read_percentage, time_spent_seconds, read_at
         from article_reads where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch (e) {
    console.error('[mergeAnonInto] article_reads', (e as Error)?.message)
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

  // Джерело переходу (перший дотик). Додано 16.09.2026.
  //
  // Раніше сюди не потрапляло, і це робило атрибуцію сліпою. Механіка була
  // така: user_acquisition пишеться ЗАВЖДИ на анонімний id (getOrCreateAnonUserId
  // у /api/analytics/track), а прочитання після входу копіюються на id акаунта.
  // Тобто той самий читач існував під двома ідентифікаторами: під акаунтом —
  // прочитання без джерела, під cookie — джерело без прочитань.
  //
  // Вимір 16.09.2026: зі 124 читачів першої серії «Балабонів» джерело вдалося
  // визначити лише для 18. При цьому в user_acquisition було 1377 записів на
  // 263 читачів — дані були, просто не зчіплювалися.
  //
  // on conflict do nothing зберігає перший дотик: якщо на акаунті запис уже є
  // (людина входила з іншого пристрою), він має перевагу — саме він раніший.
  try {
    await dbQuery(
      `insert into user_acquisition
         (user_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
          referrer, landing_path)
       select $1, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
              referrer, landing_path
         from user_acquisition where user_id = $2
       on conflict do nothing`,
      [userId, anon],
    )
  } catch (e) {
    console.error('[mergeAnonInto] user_acquisition', (e as Error)?.message)
  }
}

/**
 * Хто читає — БЕЗ створення cookie.
 *
 * Те саме правило, що в resolveReaderId (спершу акаунт, потім cookie), але
 * придатне для рендерингу сторінки: нічого не записує.
 *
 * НАВІЩО ЦЕ З'ЯВИЛОСЯ 13.09.2026. Сторінки серій брали читача через
 * getAnonUserId() — тобто ЛИШЕ з cookie balabony_uid. Підписка ж, куплена
 * через LiqPay, лягає на id акаунта: вебхук бере його з номера замовлення.
 * Тому людина, яка увійшла і заплатила, відкривала серію й бачила замок:
 * сторінка шукала її підписку за cookie, а та лежала під акаунтом.
 *
 * Так само ламався груповий доступ: місце видається на акаунт учасника.
 *
 * Чому не resolveReaderId: він падає на getOrCreateAnonUserId(), який пише
 * cookie, а Next.js забороняє це під час рендерингу сторінки — саме через
 * це сторінка колись віддавала 500 кожному, хто заходив уперше.
 *
 * Повертає null, якщо людина не увійшла і cookie ще немає. Для такого читача
 * ані підписки, ані вибору бути не може, тож null тут безпечний.
 */
export async function readerIdForRender(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase.auth.getUser()
    if (data?.user?.id) return data.user.id
  } catch {
    /* немає сесії — читаємо cookie нижче */
  }
  return getAnonUserId()
}
