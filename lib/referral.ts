import { cookies } from 'next/headers'
import { dbQuery } from '@/lib/db'
import { awardPoints, POINTS } from '@/lib/points'

/**
 * Реферальна механіка: хто кого привів.
 *
 * До 09.09.2026 код лише показувався в кабінеті. Ніде не приймався `?ref=`,
 * ніде не зберігався зв'язок, ніхто нічого не отримував — тобто механіки не
 * було зовсім, був напис на екрані.
 *
 * Як працює тепер:
 *   1. Людина відкриває balabony.com/?ref=AB1134E4 — код лягає в cookie на 90
 *      днів (див. /api/referral/capture). 90 днів, бо читач часто повертається
 *      не одразу: прочитав з телефона, зареєструвався за тиждень.
 *   2. При вході (auth/callback) код зчитується і, якщо це перший вхід цієї
 *      людини, записується в users.referred_by.
 *   3. Обом нараховуються бали.
 *
 * Захист від накрутки:
 *   — власний код не приймається (сам себе не приведеш);
 *   — прив'язка одноразова: якщо referred_by вже стоїть, нічого не міняємо;
 *   — бали ідемпотентні за (user, kind, ref), тож повторний вхід не додасть.
 */

export const REF_COOKIE = 'balabony_ref'
const REF_MAX_AGE = 60 * 60 * 24 * 90 // 90 днів

/** Скільки балів за приведеного читача — і йому за прихід. */
export const REFERRAL_POINTS = {
  inviter: 50,
  invited: 25,
} as const

/** Код завжди у верхньому регістрі, лише цифри й латинські літери. */
export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)
}

export async function readRefCookie(): Promise<string | null> {
  try {
    const store = await cookies()
    const raw = store.get(REF_COOKIE)?.value
    if (!raw) return null
    const code = normalizeCode(raw)
    return code.length >= 4 ? code : null
  } catch {
    return null
  }
}

export const REF_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: REF_MAX_AGE,
  secure: process.env.NODE_ENV === 'production',
}

/**
 * Прив'язати нового читача до того, хто його привів.
 *
 * Викликається після успішного входу. Мовчазна: якщо щось не так — код
 * невідомий, людина вже прив'язана, або це власний код — просто нічого не
 * робимо. Вхід ламати не можна в жодному разі.
 */
/**
 * Гарантувати рядок у `users` для цього акаунта.
 *
 * Тригер `on_auth_user_created` створює такий рядок при реєстрації, але
 * акаунти, заведені ДО появи тригера, його не мають: 09.09.2026 знайшовся
 * акаунт від 23 квітня без рядка. Для нього мовчки не працювало нічого —
 * ні реферальний код, ні підписка, ні прив'язка, бо всі запити починаються
 * з `select ... from users`.
 *
 * Тому при кожному вході дописуємо рядок, якщо його бракує. Це дешево
 * (один запит) і знімає цілий клас мовчазних збоїв.
 */
export async function ensureUserRow(userId: string, email: string | null): Promise<void> {
  try {
    await dbQuery(
      `insert into users (id, email, referral_code)
       values ($1, $2, upper(substr(md5($1::text || 'balabony'), 1, 8)))
       on conflict (id) do nothing`,
      [userId, email ?? ''],
    )
  } catch {
    // мовчазно: вхід важливіший за рядок у таблиці
  }
}

export async function bindReferralIfAny(userId: string): Promise<void> {
  try {
    const code = await readRefCookie()
    if (!code) return

    // Уже прив'язаний? Тоді нічого не міняємо — прив'язка одноразова.
    const me = await dbQuery(
      `select referred_by, referral_code from users where id = $1 limit 1`,
      [userId],
    )
    const mine = me.rows[0] as { referred_by: string | null; referral_code: string | null } | undefined
    if (!mine || mine.referred_by) return

    // Власний код не рахуємо.
    if (mine.referral_code && normalizeCode(mine.referral_code) === code) return

    const found = await dbQuery(
      `select id from users where upper(referral_code) = $1 limit 1`,
      [code],
    )
    const inviter = (found.rows[0] as { id: string } | undefined)?.id
    if (!inviter || inviter === userId) return

    await dbQuery(
      `update users set referred_by = $2, referred_at = now()
        where id = $1 and referred_by is null`,
      [userId, inviter],
    )

    // Бали обом. ref робить нарахування унікальним: повторний вхід не додасть.
    await awardPoints(inviter, 'referral', `invited:${userId}`, REFERRAL_POINTS.inviter)
    await awardPoints(userId, 'referral', `joined:${inviter}`, REFERRAL_POINTS.invited)
  } catch {
    // мовчазно: реферал — приємний бонус, а не критичний шлях входу
  }
}

/** Скільки людей прийшло за кодом цього читача. */
export async function countInvited(userId: string): Promise<number> {
  try {
    const r = await dbQuery(
      `select count(*)::int as n from users where referred_by = $1`,
      [userId],
    )
    return (r.rows[0] as { n: number } | undefined)?.n ?? 0
  } catch {
    return 0
  }
}

/** Використовується у профілі, щоб не збирати посилання руками. */
export function inviteLink(code: string): string {
  return `https://balabony.com/?ref=${encodeURIComponent(code)}`
}

export { POINTS }
