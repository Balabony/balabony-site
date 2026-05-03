import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'
import { sendEditorEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

interface AssignmentRow {
  editor_name: string
  editor_email: string
  token: string
  filename: string
  text: string
}

export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()
    const body = await request.json() as { assignmentId?: number }
    const assignmentId = body.assignmentId
    if (!assignmentId || isNaN(Number(assignmentId))) {
      return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 })
    }

    const result = await dbQuery(
      `SELECT a.editor_name, a.editor_email, a.token, s.filename, s.text
       FROM editorial_assignments a
       JOIN editorial_submissions s ON s.id = a.submission_id
       WHERE a.id = $1`,
      [Number(assignmentId)]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Завдання не знайдено' }, { status: 404 })
    }

    const row: AssignmentRow = result.rows[0]
    const approveUrl = `${SITE_URL}/editor/approve/${row.token}`
    const reviseUrl = `${SITE_URL}/editor/revise/${row.token}`

    await sendEditorEmail({
      to: row.editor_email,
      editorName: row.editor_name,
      filename: row.filename,
      text: row.text,
      approveUrl,
      reviseUrl,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
