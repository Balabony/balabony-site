import { dbQuery } from '@/lib/db'
import { normalizeEmail } from '@/lib/normalize-email'

/**
 * На яку адресу насправді заведено акаунт.
 *
 * Винесено з /api/auth/login 18.09.2026, бо тепер той самий вибір потрібен
 * і при вході кодом (/api/auth/verify): код перевіряється лише для тієї
 * адреси, на яку пішов лист.
 *
 *   1. є акаунт рівно з тим, що ввели — беремо його;
 *   2. немає, але є з нормалізованою адресою — беремо нормалізовану;
 *   3. немає жодного — канонічна форма.
 *
 * Якщо звірка з базою не вдалась, лишаємось на канонічній формі.
 */
export async function resolveLoginEmail(raw: string): Promise<string> {
  const canonical = normalizeEmail(raw)
  try {
    const res = await dbQuery(
      `select email
         from auth.users
        where lower(email) in ($1, $2)
        order by (lower(email) = $1) desc
        limit 1`,
      [raw, canonical],
    )
    const found = (res.rows[0]?.email ?? '').trim().toLowerCase()
    if (found !== '') return found
  } catch {
    // лишаємо canonical
  }
  return canonical
}

/** Лише внутрішні шляхи: «//host» і «https://host» — це чужий сайт. */
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//')) return null
  return value
}
