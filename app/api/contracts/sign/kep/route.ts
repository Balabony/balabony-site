import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'

/**
 * Підписання договору кваліфікованим електронним підписом.
 *
 * Автор підписує файл договору у себе — на czo.gov.ua/sign, у клієнті свого
 * банку або будь-якою програмою ІІТ — і завантажує сюди результат (.p7s або
 * підписаний PDF). Ключ ніколи не покидає його комп’ютер, ми його не бачимо.
 *
 * ВАЖЛИВО: тут ми лише приймаємо й зберігаємо файл підпису. Криптографічної
 * перевірки чинності сертифіката на цьому етапі НЕ відбувається — її робить
 * редактор вручну через czo.gov.ua/verify, доки не піднято сервер ІІТ.
 */

const BUCKET = 'contract-signatures'
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = ['.p7s', '.pdf', '.asics', '.asice']

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const contractId = String(form.get('contractId') ?? '').trim()
  const file = form.get('file')

  if (!contractId) return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'Додайте файл підпису' }, { status: 400 })

  const name = file.name.toLowerCase()
  if (!ALLOWED.some(ext => name.endsWith(ext))) {
    return NextResponse.json(
      { ok: false, error: 'Підходять файли .p7s, .asics, .asice або підписаний PDF' },
      { status: 400 },
    )
  }
  if (file.size === 0) return NextResponse.json({ ok: false, error: 'Файл порожній' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Файл більший за 10 МБ' }, { status: 400 })

  const own = await dbQuery(
    `select id, number, status from author_contracts where id = $1 and author_id = $2 limit 1`,
    [contractId, user.id],
  )
  const contract = own.rows[0] as { id: string; number: string; status: string } | undefined
  if (!contract) return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  if (contract.status === 'signed') {
    return NextResponse.json({ ok: false, error: 'Договір уже підписано' }, { status: 409 })
  }

  const ext = ALLOWED.find(e => name.endsWith(e)) ?? '.p7s'
  const path = `${user.id}/${contract.id}${ext}`

  const admin = getSupabaseAdmin()
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'application/octet-stream',
    upsert: true,
  })
  if (upErr) {
    return NextResponse.json({ ok: false, error: 'Не вдалося зберегти файл' }, { status: 500 })
  }

  await dbQuery(
    `update author_contracts
        set status = 'signed', signed_at = now(),
            signature_url = $1, sign_method = 'kep'
      where id = $2`,
    [path, contract.id],
  )

  return NextResponse.json({ ok: true, number: contract.number })
}
