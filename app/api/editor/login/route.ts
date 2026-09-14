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
 *
 * ПАУЗА МІЖ ЛИСТАМИ — саме через те, що новий лист гасить попередній.
 * Без паузи це була атака: хто знає пошту редакторки, натискає «надіслати»
 * в ту мить, коли вона переходить за своїм посиланням, — і її токен уже
 * мертвий, а скринька засипана листами. Тепер якщо непрогаслий лист
 * молодший за COOLDOWN_MINUTES, ми не надсилаємо новий і НІЧОГО НЕ ГАСИМО,
 * а відповідаємо тим самим «ok»: сторонній не має дізнатися ні що адреса
 * в базі є, ні що лист щойно був.
 *
 * ВІК ПОСИЛАННЯ РАХУЄМО З expires_at, а не з окремої колонки часу
 * створення: строк завжди рівно LOGIN_LINK_MINUTES від створення, тож
 * «молодше за дві хвилини» — це «до протермінування лишилося більше ніж
 * LOGIN_LINK_MINUTES − 2».
 */

export const dynamic = 'force-dynamic'

/** Скільки чекати між двома листами входу на одну адресу. */
const COOLDOWN_MINUTES = 2

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

    // Свіжий лист уже в дорозі — не чіпаємо ні його, ні скриньку.
    const fresh = await dbQuery(
      `select 1
         from editor_sessions
        where editor_id = $1
          and token_used_at is null
          and expires_at > now() + ($2 || ' minutes')::interval
        limit 1`,
      [editor.id, String(LOGIN_LINK_MINUTES - COOLDOWN_MINUTES)],
    )
    if (fresh.rowCount) return ok

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
