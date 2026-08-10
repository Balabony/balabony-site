import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Короткі посилання для друкованих газет: balabony.com/g1, /g2 …
 *
 * Навіщо саме короткі: QR із довгої адреси з UTM-мітками — це щільна сітка
 * дрібних квадратів, яка на газетному папері (фарба розтікається) не читається.
 * З `balabony.com/g1` елементів учетверо менше, квадрати більші, сканується
 * навіть із поганого відбитка. Плюс людина, яка не вміє сканувати, може просто
 * набрати адресу руками — а це половина нашої аудиторії 55+.
 *
 * UTM-мітки додаємо тут, на боці сервера, а не в друкованій адресі.
 */

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params
  const site = 'https://balabony.com'

  // Нормалізуємо: у газеті можуть надрукувати великими літерами
  const key = (code ?? '').trim().toLowerCase()

  if (!key) return NextResponse.redirect(site, 302)

  const db = getSupabaseAdmin()

  const { data } = await db
    .from('qr_links')
    .select('code, target, campaign, is_active')
    .eq('code', key)
    .maybeSingle()

  // Невідомий код — ведемо на головну, а не на 404.
  // Людина з газети не має бачити помилку: газету вже не виправиш.
  if (!data || data.is_active === false) {
    return NextResponse.redirect(site, 302)
  }

  // Записуємо перехід. Помилка запису не має ламати редирект.
  try {
    await db.from('qr_hits').insert({
      code: key,
      referer: req.headers.get('referer'),
      user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })
  } catch {
    // мовчки: статистика не варта зламаного переходу
  }

  const target = String(data.target ?? '/')
  const url = new URL(target.startsWith('http') ? target : site + target)

  url.searchParams.set('utm_source', 'gazeta')
  url.searchParams.set('utm_medium', 'qr')
  url.searchParams.set('utm_campaign', String(data.campaign ?? key))
  url.searchParams.set('utm_content', key)

  return NextResponse.redirect(url.toString(), 302)
}
