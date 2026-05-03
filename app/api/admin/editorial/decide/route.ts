import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

interface DecideBody {
  assignmentId?: number
  action?: 'accept' | 'reject'
}

export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()
    const body = await request.json() as DecideBody
    const { assignmentId, action } = body

    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
    }
    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 })
    }

    if (action === 'accept') {
      const assignResult = await dbQuery(
        'SELECT submission_id FROM editorial_assignments WHERE id = $1',
        [Number(assignmentId)]
      )
      if (assignResult.rows.length === 0) {
        return NextResponse.json({ error: 'Завдання не знайдено' }, { status: 404 })
      }
      const submissionId: number = assignResult.rows[0].submission_id
      await dbQuery(
        "UPDATE editorial_submissions SET status='approved', updated_at=NOW() WHERE id=$1",
        [submissionId]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
