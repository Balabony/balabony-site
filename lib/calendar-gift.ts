import { dbQuery } from '@/lib/db'
import { LEVELS, levelFromReads } from '@/lib/levels'

/**
 * Календар: ціна за рівнем читача і умова на подарунковий примірник.
 *
 * Одне джерело правди для сторінки продажу, роуту оплати, кабінету і
 * сторінки бонусів. Ціна ніколи не береться з клієнта: браузер лише
 * показує число, а суму для LiqPay рахує сервер цими ж функціями.
 */

export const CALENDAR = {
  /** Звичайна ціна. Найнижча можлива: продаємо як виробник, без посередників. */
  price: 550,
  /** Ціна для рівня «Знавець Балабонів». */
  priceExpert: 400,
  /** Скільки примірників віддаємо безкоштовно. */
  freeCount: 10,
  /** Скільки приведених із річною передплатою потрібно на подарунок. */
  needYearly: 2,
} as const

/** Ключ рівня, з якого діє знижка. Береться з LEVELS, щоб не розійтися. */
export const EXPERT_LEVEL = LEVELS[LEVELS.length - 1]

/** Скільки різних серій прочитав читач. Помилка — нуль, не виняток. */
export async function countEpisodeReads(userId: string): Promise<number> {
  try {
    const r = await dbQuery(
      `select count(*)::int as n from user_episode_reads where user_id = $1`,
      [userId],
    )
    return (r.rows[0] as { n: number } | undefined)?.n ?? 0
  } catch {
    return 0
  }
}

/** Чи має читач рівень «Знавець Балабонів». */
export async function isExpert(userId: string): Promise<boolean> {
  const reads = await countEpisodeReads(userId)
  return levelFromReads(reads).current.key === EXPERT_LEVEL.key
}

/**
 * Ціна календаря для конкретної людини.
 * userId = null (не увійшов) — звичайна ціна: рівень підтвердити нічим.
 */
export async function calendarPrice(userId: string | null): Promise<number> {
  if (!userId) return CALENDAR.price
  return (await isExpert(userId)) ? CALENDAR.priceExpert : CALENDAR.price
}

/**
 * Скільки приведених цією людиною читачів оформили РІЧНУ передплату.
 *
 * Річна — це і особиста (890 ₴), і сімейна (1 390 ₴): у базі обидві лягають
 * як plan='yearly', бо тариф визначається сумою платежу.
 *
 * З'єднання йде по users.id = app_subscriptions.user_id. Це правильно для
 * тих, хто платив УВІЙШОВШИ в акаунт. Оплата з-під гостя лягає на
 * ідентифікатор із cookie і сюди не потрапить — саме тому в
 * app/api/payment/create платник тепер визначається resolveReaderId().
 */
export async function countYearlyInvited(userId: string): Promise<number> {
  try {
    const r = await dbQuery(
      `select count(distinct u.id)::int as n
         from users u
         join app_subscriptions s on s.user_id = u.id
        where u.referred_by = $1
          and s.plan = 'yearly'
          and s.status = 'active'
          and s.expires_at > now()`,
      [userId],
    )
    return (r.rows[0] as { n: number } | undefined)?.n ?? 0
  } catch {
    return 0
  }
}
