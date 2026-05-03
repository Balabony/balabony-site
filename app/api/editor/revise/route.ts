import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

interface ReviseBody {
  token?: string
  revisedText?: string
  comment?: string
}

interface AssignmentRow {
  id: number
  submission_id: number
  responded_at: string | null
}

export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()
    const body = await request.json() as ReviseBody
    const { token, revisedText, comment } = body

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    if (!revisedText?.trim()) {
      return NextResponse.json({ error: 'revisedText is required' }, { status: 400 })
    }

    const assignResult = await dbQuery(
      'SELECT id, submission_id, responded_at FROM editorial_assignments WHERE token = $1',
      [token]
    )
    if (assignResult.rows.length === 0) {
      return NextResponse.json({ error: 'Токен не знайдено' }, { status: 404 })
    }

    const assignment: AssignmentRow = assignResult.rows[0]
    if (assignment.responded_at) {
      return NextResponse.json({ error: 'Вже відповіли' }, { status: 400 })
    }

    await dbQuery(
      `UPDATE editorial_assignments
       SET response_action='revise', revised_text=$1, comment=$2, responded_at=NOW()
       WHERE token=$3`,
      [revisedText, comment ?? null, token]
    )
    await dbQuery(
      "UPDATE editorial_submissions SET status='has_revisions', updated_at=NOW() WHERE id=$1",
      [assignment.submission_id]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
