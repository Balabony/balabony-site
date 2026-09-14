import { NextResponse } from 'next/server'
import { publicCountedReads } from '@/lib/contest-reads'

/**
 * Відкриті дочитування по конкурсних роботах.
 *
 * Умови конкурсів, розділ «Що видно всім»: кількість зарахованих
 * дочитувань по кожній роботі відкрита на сторінці конкурсу й
 * оновлюється постійно. Сторінка `/konkursy` статична (revalidate
 * годину), тому число береться звідси, а не з розмітки — інакше воно
 * застигало б на годину й обіцянка була б неправдою.
 *
 * Ендпоінт відкритий навмисно: тут немає нічого, чого не видно на самій
 * сторінці. Прізвищ читачів, поштових адрес і редакційних балів у
 * відповіді немає.
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const rows = await publicCountedReads()
  return NextResponse.json(
    { ok: true, rows },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
