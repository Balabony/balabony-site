import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

interface AssignmentRow {
  id: number
  submission_id: number
  responded_at: string | null
}

interface SubmissionRow {
  filename: string
}

async function loadAssignment(token: string): Promise<AssignmentRow | undefined> {
  const r = await dbQuery(
    'SELECT id, submission_id, responded_at FROM editorial_assignments WHERE token = $1',
    [token],
  )
  return r.rows[0] as AssignmentRow | undefined
}

async function filenameOf(submissionId: number): Promise<string | null> {
  const r = await dbQuery('SELECT filename FROM editorial_submissions WHERE id = $1', [submissionId])
  return (r.rows[0] as SubmissionRow | undefined)?.filename ?? null
}

/**
 * 23.10.2026: GET лише ПОКАЗУЄ, що буде погоджено — БЕЗ зміни стану.
 * Раніше GET одразу схвалював твір, тож просте відкриття листа дорівнювало
 * схваленню (без жодного підтвердження, а ще сканер пошти міг смикнути лінк).
 * Тепер саме схвалення робить лише POST — кнопка «Схвалити» на сторінці.
 */
export async function GET(request: NextRequest) {
  try {
    await initEditorialTables()
    const token = new URL(request.url).searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    const assignment = await loadAssignment(token)
    if (!assignment) {
      return NextResponse.json({ error: 'Токен не знайдено' }, { status: 404 })
    }
    const filename = await filenameOf(assignment.submission_id)
    return NextResponse.json({
      ok: true,
      filename,
      alreadyResponded: !!assignment.responded_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Саме схвалення — лише за явним POST (натискання кнопки «Схвалити»). */
export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()
    let token = ''
    try {
      token = String(((await request.json()) as { token?: string })?.token ?? '').trim()
    } catch {
      token = ''
    }
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    const assignment = await loadAssignment(token)
    if (!assignment) {
      return NextResponse.json({ error: 'Токен не знайдено' }, { status: 404 })
    }
    if (assignment.responded_at) {
      return NextResponse.json({ error: 'Вже відповіли' }, { status: 400 })
    }

    await dbQuery(
      "UPDATE editorial_assignments SET response_action='approve', responded_at=NOW() WHERE token=$1",
      [token],
    )
    await dbQuery(
      "UPDATE editorial_submissions SET status='approved', updated_at=NOW() WHERE id=$1",
      [assignment.submission_id],
    )

    const filename = await filenameOf(assignment.submission_id)
    return NextResponse.json({ ok: true, filename })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
