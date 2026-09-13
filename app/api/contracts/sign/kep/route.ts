import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { dbQuery } from '@/lib/db'
import { saveContractSnapshot } from '@/lib/contract/snapshot'

/**
 * Підписання договору кваліфікованим електронним підписом.
 *
 * Автор підписує файл договору у себе — на czo.gov.ua/sign, у клієнті свого
 * банку або будь-якою програмою ІІТ — і завантажує сюди результат (.p7s або
 * підписаний PDF). Ключ ніколи не покидає його комп’ютер, ми його не бачимо.
 *
 * ВАЖЛИВО: тут ми лише фіксуємо файл підпису. Криптографічної перевірки
 * чинності сертифіката на цьому етапі НЕ відбувається — її робить редактор
 * вручну через czo.gov.ua/verify, доки не піднято сервер ІІТ.
 *
 * ФАЙЛ СЮДИ БІЛЬШЕ НЕ НАДХОДИТЬ. З 13.09.2026 браузер ллє його прямо в
 * сховище за одноразовим посиланням (/api/contracts/sign/kep-url), а сюди
 * приходить лише шлях. Причина: Vercel ріже тіло запиту приблизно на
 * 4,5 МБ, і підписаний PDF на 10,7 МБ не доходив до цього коду взагалі —
 * автор бачив «немає зв'язку» і думав, що винен його інтернет.
 */

const BUCKET = 'contract-signatures'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Потрібно увійти' }, { status: 401 })

  let body: { contractId?: string; path?: string }
  try {
    body = await req.json() as { contractId?: string; path?: string }
  } catch {
    return NextResponse.json({ ok: false, error: 'Невірний запит' }, { status: 400 })
  }

  const contractId = String(body.contractId ?? '').trim()
  const path = String(body.path ?? '').trim()

  if (!contractId) return NextResponse.json({ ok: false, error: 'Не вказано договір' }, { status: 400 })
  if (!path) return NextResponse.json({ ok: false, error: 'Не вказано файл підпису' }, { status: 400 })

  // Шлях приходить із браузера, тому не віримо йому на слово: він мусить
  // починатися з теки цього користувача. Інакше можна було б підсунути
  // чужий файл і оголосити його своїм підписом.
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ ok: false, error: 'Невірний шлях файлу' }, { status: 400 })
  }

  const own = await dbQuery(
    `select id, number, status from author_contracts where id = $1 and author_id = $2 limit 1`,
    [contractId, user.id],
  )
  const contract = own.rows[0] as { id: string; number: string; status: string } | undefined
  if (!contract) return NextResponse.json({ ok: false, error: 'Договір не знайдено' }, { status: 404 })
  if (contract.status === 'signed') {
    return NextResponse.json({ ok: false, error: 'Договір уже підписано' }, { status: 409 })
  }

  const admin = getSupabaseAdmin()

  // Файл має справді лежати у сховищі. Без цієї перевірки достатньо було б
  // надіслати правдоподібний шлях, щоб договір став підписаним без підпису.
  const { data: found, error: listErr } = await admin.storage
    .from(BUCKET)
    .list(user.id, { search: path.slice(user.id.length + 1) })

  const uploaded = found?.find(f => `${user.id}/${f.name}` === path)
  if (listErr || !uploaded) {
    return NextResponse.json(
      { ok: false, error: 'Файл підпису не знайдено у сховищі — спробуйте завантажити ще раз' },
      { status: 400 },
    )
  }
  if ((uploaded.metadata?.size ?? 0) === 0) {
    return NextResponse.json({ ok: false, error: 'Файл порожній' }, { status: 400 })
  }

  await dbQuery(
    `update author_contracts
        set status = 'signed', signed_at = now(),
            signature_url = $1, sign_method = 'kep'
      where id = $2`,
    [path, contract.id],
  )

  // КЕП-шлях до 10.09.2026 не писав ні знімка, ні контрольної суми взагалі:
  // договір вважався підписаним, а якої саме редакції — ніде не лишалося.
  await saveContractSnapshot(contract.id)

  return NextResponse.json({ ok: true, number: contract.number })
}
