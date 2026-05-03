import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

interface AssignmentRow {
  editor_name: string
  responded_at: string | null
  filename: string
  text: string
}

export async function GET(request: NextRequest) {
  try {
    await initEditorialTables()
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    const result = await dbQuery(
      `SELECT a.editor_name, a.responded_at, s.filename, s.text
       FROM editorial_assignments a
       JOIN editorial_submissions s ON s.id = a.submission_id
       WHERE a.token = $1`,
      [token]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Токен не знайдено' }, { status: 404 })
    }

    const row: AssignmentRow = result.rows[0]
    return NextResponse.json({
      filename: row.filename,
      text: row.text,
      editorName: row.editor_name,
      alreadyResponded: !!row.responded_at,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
