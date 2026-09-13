import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'

/**
 * Одноразове посилання на пряме завантаження файлу підпису в сховище.
 *
 * ЧОМУ ЦЕ З'ЯВИЛОСЯ. 13.09.2026 автор надіслав підписаний договір на
 * 10,7 МБ і тричі отримав «немає зв'язку». У нашому коді стояла перевірка
 * на 10 МБ із чемним повідомленням, але вона НІКОЛИ НЕ СПРАЦЬОВУВАЛА:
 * Vercel ріже тіло запиту приблизно на 4,5 МБ, тобто запит помирав до
 * того, як доходив до нашого коду. Людина бачила помилку зв'язку і шукала
 * причину в себе.
 *
 * PDF, підписаний після конвертації через XPS, легко важить понад 10 МБ —
 * це сторінки-картинки. Отже межа в 4,5 МБ відсікала б і надалі не лише
 * цього автора.
 *
 * РІШЕННЯ: файл більше не проходить через наш сервер узагалі. Браузер
 * отримує звідси одноразове посилання і ллє файл просто в сховище
 * Supabase, а нам потім надсилає лише шлях. Ліміт Vercel більше ні до
 * чого — на маленький JSON його вистачає.
 */

export const dynamic = 'force-dynamic'

const BUCKET = 'contract-signatures'
const ALLOWED = ['.p7s', '.pdf', '.asics', '.asice']

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let body: { contractId?: string; filename?: string }
  try {
    body = await req.json() as { contractId?: string; filename?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const contractId = String(body.contractId ?? '').trim()
  const filename = String(body.filename ?? '').trim().toLowerCase()

  if (!contractId) {
    return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  }

  const ext = ALLOWED.find(e => filename.endsWith(e))
  if (!ext) {
    return NextResponse.json(
      { ok: false, error: 'Підходять файли .p7s, .asics, .asice або підписаний PDF' },
      { status: 400 },
    )
  }

  // Договір має належати тому, хто просить, і ще не бути підписаним.
  const own = await dbQuery(
    `select id, status from author_contracts where id = $1 and author_id = $2 limit 1`,
    [contractId, user.id],
  )
  const contract = own.rows[0] as { id: string; status: string } | undefined
  if (!contract) {
    return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  }
  if (contract.status === 'signed') {
    return NextResponse.json({ ok: false, error: 'Договір уже підписано' }, { status: 409 })
  }

  // Шлях той самий, що й раніше: одна людина, один договір, один файл.
  const path = `${user.id}/${contract.id}${ext}`

  const admin = getSupabaseAdmin()
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true })

  if (error || !data) {
    console.error('[kep-url]', error?.message)
    return NextResponse.json(
      { ok: false, error: 'Не вдалося підготувати завантаження' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, path, token: data.token, bucket: BUCKET })
}
