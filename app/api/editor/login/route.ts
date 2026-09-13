import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { dbQuery } from '@/lib/db'
import { sendEditorLoginEmail } from '@/lib/editor-login-email'
import { LOGIN_LINK_MINUTES } from '@/lib/editor-auth'

/**
 * POST /api/editor/login  { email }
 *
 * Створює одноразовий токен і надсилає посилання на пошту редактора.
 *
 * ВІДПОВІДЬ ЗАВЖДИ ОДНАКОВА, навіть коли такої пошти в `editors` немає.
 * Інакше форма перетворюється на перевірку, хто входить до редакції:
 * ввів пошту — дізнався відповідь. Редакторів мало, але список їхніх
 * адрес нікому знати не треба.
 *
 * СТАРІ НЕВИКОРИСТАНІ ПОСИЛАННЯ ГАСЯТЬСЯ. Якщо редактор натиснув «надіслати»
 * двічі, працює тільки останній лист: попередні токени позначаються
 * використаними. Без цього старий лист із пошти лишався б робочим ключем.
 */

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ok = NextResponse.json({ ok: true })

  try {
    const body = await req.json().catch(() => ({}))
    const email = String((body as { email?: string })?.email ?? '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Вкажіть пошту' }, { status: 400 })
    }

    const found = await dbQuery(
      `select id, name, email from editors where lower(email) = $1 limit 1`,
      [email],
    )
    if (!found.rowCount) return ok

    const editor = found.rows[0] as { id: number; name: string; email: string }

    // Гасимо попередні невикористані посилання цього редактора.
    await dbQuery(
      `update editor_sessions
          set token_used_at = now()
        where editor_id = $1
          and token_used_at is null`,
      [editor.id],
    )

    const token = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + LOGIN_LINK_MINUTES * 60 * 1000)

    await dbQuery(
      `insert into editor_sessions (editor_id, token, expires_at)
       values ($1, $2, $3)`,
      [editor.id, token, expires.toISOString()],
    )

    const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'
    const loginUrl = `${site}/api/editor/session?token=${encodeURIComponent(token)}`

    const expiresLabel = expires.toLocaleTimeString('uk-UA', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Kyiv',
    })

    await sendEditorLoginEmail({
      to: editor.email,
      editorName: editor.name,
      loginUrl,
      expiresLabel: `${expiresLabel} за київським часом`,
    })

    return ok
  } catch (err) {
    console.error('[editor/login]', (err as Error)?.message)
    // Помилку показуємо, бо мовчазний «ok» тут ввів би редактора в оману:
    // він чекав би листа, якого не буде.
    return NextResponse.json({ ok: false, error: 'Не вдалося надіслати лист' }, { status: 500 })
  }
}
