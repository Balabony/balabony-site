import { cookies } from 'next/headers'

/**
 * Перевірка адмінської сесії для роутів, які лежать ПОЗА /api/admin.
 *
 * proxy.ts закриває весь префікс /api/admin, але кілька дорогих роутів
 * historically опинилися поруч: /api/generate-cover і /api/plan-covers.
 * Вони викликають Replicate і Anthropic, тобто кожен запит коштує грошей,
 * а захисту не мали взагалі — будь-хто ззовні міг запускати генерації.
 *
 * Переносити роути під /api/admin зараз ризиковано: на них зав'язані
 * сторінки адмінки, і зміна шляху ламає виклики. Тому перевіряємо сесію
 * тим самим механізмом, що й proxy: кука admin_session проти ADMIN_PASSWORD.
 *
 * Повертає true, якщо запит від адміна.
 */
export async function isAdminRequest(): Promise<boolean> {
  try {
    const store = await cookies()
    const session = store.get('admin_session')?.value
    const expected = process.env.ADMIN_PASSWORD
    if (!session || !expected) return false
    return session === expected
  } catch {
    return false
  }
}
