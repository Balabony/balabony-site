import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { Resend } from 'resend'

/**
 * Вступ до Клубу Балабонів (17.10.2026).
 * Пише в klub_members і заодно підписує на розсилку (subscribers, source 'klub'),
 * бо головна перевага клубу — щотижневий лист.
 */
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > 8
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as { name?: string; email?: string; role?: string; consent?: boolean; website?: string; source?: string }
    if (b.website) return NextResponse.json({ ok: true }) // honeypot
    const name = String(b.name ?? '').trim().slice(0, 80)
    const email = String(b.email ?? '').trim().toLowerCase().slice(0, 160)
    const role = ['reader', 'author', 'both'].includes(String(b.role)) ? String(b.role) : 'reader'
    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Вкажіть, як до вас звертатися' }, { status: 400 })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ ok: false, error: 'Перевірте адресу пошти' }, { status: 400 })
    if (b.consent !== true) return NextResponse.json({ ok: false, error: 'Потрібна згода на листи клубу' }, { status: 400 })
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (limited(ip)) return NextResponse.json({ ok: false, error: 'Забагато спроб. Спробуйте пізніше.' }, { status: 429 })

    const res = await dbQuery(
      `insert into klub_members (name, email, role, source)
       values ($1, $2, $3, $4)
       on conflict (email) do update set name = excluded.name, role = excluded.role
       returning (xmax = 0) as is_new`,
      [name, email, role, b.source ? String(b.source).slice(0, 100) : null],
    )
    const isNew = Boolean(res.rows[0]?.is_new)

    try {
      await getSupabaseAdmin().from('subscribers').upsert(
        { email, consent: true, source: 'klub', token: crypto.randomUUID() },
        { onConflict: 'email', ignoreDuplicates: true },
      )
    } catch { /* розсилка не критична */ }

    // Вітальний лист новому членові клубу (не критично: членство зберігається й без нього).
    if (isNew && process.env.RESEND_API_KEY) {
      try {
        const tk = await dbQuery(`select token from subscribers where email = $1 limit 1`, [email])
        const token = tk.rows[0]?.token as string | undefined
        const unsub = token ? `https://balabony.com/vidpysatysia?t=${token}` : 'mailto:nazar@balabony.com?subject=Відписка'
        const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
        await new Resend(process.env.RESEND_API_KEY).emails.send({
          from: 'Клуб Балабонів <contact@balabony.com>',
          to: email,
          subject: 'Вітаємо в Клубі Балабонів!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1e293b; line-height: 1.6;">
              <p style="text-align:center;margin:0 0 12px"><img src="https://balabony.com/klub/balabon-klub-600.webp" width="240" height="240" alt="Балабон — талісман клубу" style="border-radius:16px"></p>
              <h2 style="color: #C97A14; margin: 0 0 10px;">${esc(name)}, вітаємо в Клубі Балабонів!</h2>
              <p>Тепер ви серед тих, хто читає й пише українською. Що далі:</p>
              <ul>
                <li>раз на тиждень — лист із новими історіями й серіями;</li>
                <li>першими — умови нових конкурсів і їхні переможці;</li>
                <li>з кінця листопада — значок члена клубу в кабінеті та три закриті історії щомісяця безкоштовно;</li>
                <li>щороку в грудні найактивнішим — друкований календар «Балабони».</li>
              </ul>
              <p>Почитати вже зараз: <a href="https://balabony.com/stories?utm_source=klub&utm_medium=email&utm_campaign=vitannia" style="color:#C97A14">історії Балабонів</a>.<br>
              Пишете самі? <a href="https://balabony.com/konkursy?utm_source=klub&utm_medium=email&utm_campaign=vitannia" style="color:#C97A14">Конкурси з призами</a>.</p>
              <p>Розкажіть про Балабони друзям — і, можливо, саме ви отримаєте календар у грудні.</p>
              <p style="margin-top:20px">Читаємо українське!<br>Редакція Балабонів</p>
              <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
                <a href="https://balabony.com/klub#pravyla" style="color:#94a3b8">Правила клубу</a> ·
                <a href="${unsub}" style="color:#94a3b8">Відписатися</a><br>
                Клуб веде ЛОГО «Інститут громадянського суспільства», Львів.
              </p>
            </div>`,
        })
      } catch { /* лист не критичний */ }
    }

    return NextResponse.json({ ok: true, isNew })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти. Спробуйте ще раз.' }, { status: 500 })
  }
}
