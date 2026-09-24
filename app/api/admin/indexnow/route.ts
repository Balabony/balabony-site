import { NextResponse } from 'next/server'
import sitemap from '@/app/sitemap'

/**
 * IndexNow — масова відправка адрес у Bing (24.09.2026).
 *
 * Google IndexNow НЕ підтримує: для нього лише Search Console, ~10 адрес
 * на добу вручну. Але Bing, DuckDuckGo, Yandex і пошук у ChatGPT беруть
 * дані з IndexNow/Bing, і тут можна віддати всю карту сайту одним запитом.
 *
 * Як запускати: увійти в адмінку й відкрити в браузері
 *   https://balabony.com/api/admin/indexnow
 * Роут під /api/admin, тож proxy.ts пускає лише з адмінською сесією.
 * Не частіше разу на тиждень і після великих публікацій: IndexNow — для
 * нових і змінених сторінок, щоденне повторне надсилання всього списку
 * пошуковики вважають зловживанням.
 *
 * Ключ — не секрет: він мусить лежати публічно у файлі
 * public/c52a708368255a4218a108a8b972ab97.txt, саме так пошуковик перевіряє, що
 * запит іде від власника домену. Змінюючи ключ, змінити й файл.
 */

const KEY = 'c52a708368255a4218a108a8b972ab97'
const HOST = 'balabony.com'

export const dynamic = 'force-dynamic'

export async function GET() {
  const entries = await sitemap()
  const urls = Array.from(new Set(entries.map((e) => e.url)))

  const results: { batch: number; count: number; status: number }[] = []
  // Протокол приймає до 10 000 адрес за запит; ділимо з запасом.
  for (let i = 0; i < urls.length; i += 5000) {
    const urlList = urls.slice(i, i + 5000)
    try {
      const res = await fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: HOST,
          key: KEY,
          keyLocation: `https://${HOST}/${KEY}.txt`,
          urlList,
        }),
      })
      results.push({ batch: i / 5000 + 1, count: urlList.length, status: res.status })
    } catch {
      results.push({ batch: i / 5000 + 1, count: urlList.length, status: 0 })
    }
  }

  // 200 або 202 — прийнято. 403 — ключ не знайдено за keyLocation
  // (файл ще не задеплоєно). 422 — адреси не з цього домену. 429 — забагато.
  const ok = results.every((r) => r.status === 200 || r.status === 202)
  return NextResponse.json({ ok, total: urls.length, results })
}
