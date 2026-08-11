import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Короткі посилання для листів: balabony.com/m/a1
 *
 * Механізм той самий, що й у /g/[code] для газети, і таблиця та сама
 * (`qr_links`, колонка `channel`). Різниця лише в UTM-мітці `utm_medium`:
 * газета — `qr`, пошта — `email`. Це дає розклад по каналах у звіті,
 * не плодячи другої системи посилань.
 *
 * Навіщо короткий код у листі: ціль можна перенаправити ПІСЛЯ відправки.
 * Лист уже в поштових скриньках і не редагується — а посилання лишається
 * керованим. Якщо історія виявиться слабкою, трафік переводимо на іншу.
 */

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const { code } = await ctx.params
  const site = 'https://balabony.com'

  const key = (code ?? '').trim().toLowerCase()
  if (!key) return NextResponse.redirect(site, 302)

  const db = getSupabaseAdmin()

  const { data } = await db
    .from('qr_links')
    .select('code, target, campaign, is_active, channel')
    .eq('code', key)
    .maybeSingle()

  // Невідомий код — на головну, а не 404: лист уже не виправиш.
  if (!data || data.is_active === false) {
    return NextResponse.redirect(site, 302)
  }

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

  const channel = String(data.channel ?? 'email')

  url.searchParams.set('utm_source', channel === 'facebook' ? 'facebook' : 'email')
  url.searchParams.set('utm_medium', channel === 'facebook' ? 'social' : 'email')
  url.searchParams.set('utm_campaign', String(data.campaign ?? key))
  url.searchParams.set('utm_content', key)

  return NextResponse.redirect(url.toString(), 302)
}
