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

export async function GET(request: NextRequest) {
  try {
    await initEditorialTables()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
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
      "UPDATE editorial_assignments SET response_action='approve', responded_at=NOW() WHERE token=$1",
      [token]
    )
    await dbQuery(
      "UPDATE editorial_submissions SET status='approved', updated_at=NOW() WHERE id=$1",
      [assignment.submission_id]
    )

    const subResult = await dbQuery(
      'SELECT filename FROM editorial_submissions WHERE id = $1',
      [assignment.submission_id]
    )
    const submission: SubmissionRow = subResult.rows[0]

    return NextResponse.json({ ok: true, filename: submission.filename })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
