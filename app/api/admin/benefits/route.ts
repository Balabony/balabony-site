import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseAdmin } from '@/lib/supabase-server'

/**
 * Черга перевірки пільгових статусів.
 *
 * Сюди потрапляють лише заявки, подані вручну (цивільна інвалідність) —
 * ті, що Дія валідувати не вміє. Статуси, підтверджені Дією, сюди не йдуть.
 *
 * Після рішення редактора скан ВИДАЛЯЄТЬСЯ зі сховища: медичні документи
 * ми не зберігаємо. У базі лишається тільки категорія й дата рішення.
 */

const TABLE = 'benefit_status'
const BUCKET = 'benefit-docs'
const LINK_TTL = 300 // посилання на скан живе 5 хвилин

interface Row {
  user_id: string
  category: string
  review_status: string
  document_path: string | null
  submitted_at: string | null
  valid_until: string | null
}

async function assertAdmin() {
  const jar = await cookies()
  return jar.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

// ── Список заявок на розгляді ────────────────────────────────────────
export async function GET() {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = getSupabaseAdmin()

  const { data, error } = await admin
    .from(TABLE)
    .select('user_id, category, review_status, document_path, submitted_at, valid_until')
    .eq('review_status', 'pending')
    .order('submitted_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as Row[]

  // Пошта потрібна, щоб редактор розумів, чию заявку дивиться,
  // і міг звʼязатися в разі питань.
  const items = await Promise.all(
    rows.map(async (r) => {
      let docUrl: string | null = null
      if (r.document_path) {
        const { data: signed } = await admin.storage
          .from(BUCKET)
          .createSignedUrl(r.document_path, LINK_TTL)
        docUrl = signed?.signedUrl ?? null
      }

      let email: string | null = null
      try {
        const { data: u } = await admin.auth.admin.getUserById(r.user_id)
        email = u?.user?.email ?? null
      } catch {
        // користувача могли видалити — заявку все одно показуємо
      }

      return {
        userId: r.user_id,
        email,
        category: r.category,
        submittedAt: r.submitted_at,
        validUntil: r.valid_until,
        docUrl,
        hasDoc: Boolean(r.document_path),
      }
    }),
  )

  return NextResponse.json({ items })
}

// ── Рішення редактора ────────────────────────────────────────────────
interface DecisionBody {
  userId?: string
  decision?: 'verified' | 'rejected'
  reason?: string
}

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await req.json()) as DecisionBody
  const { userId, decision } = body

  if (!userId || (decision !== 'verified' && decision !== 'rejected')) {
    return NextResponse.json({ error: 'Некоректний запит' }, { status: 400 })
  }

  const admin = getSupabaseAdmin()

  const { data: row, error: readErr } = await admin
    .from(TABLE)
    .select('document_path, review_status')
    .eq('user_id', userId)
    .maybeSingle()

  if (readErr || !row) {
    return NextResponse.json({ error: 'Заявку не знайдено' }, { status: 404 })
  }

  const now = new Date().toISOString()

  // Відмова знімає пільгу одразу: valid_until у минуле.
  const patch: Record<string, unknown> = {
    review_status: decision,
    reviewed_at: now,
    document_path: null,
    reject_reason: decision === 'rejected' ? (body.reason?.trim() || null) : null,
    verified_at: decision === 'verified' ? now : null,
  }

  if (decision === 'rejected') {
    patch.valid_until = now
  }

  const { error: updErr } = await admin.from(TABLE).update(patch).eq('user_id', userId)

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 })
  }

  // Скан більше не потрібен — прибираємо незалежно від рішення.
  if (row.document_path) {
    await admin.storage.from(BUCKET).remove([row.document_path])
  }

  return NextResponse.json({ ok: true, decision })
}
