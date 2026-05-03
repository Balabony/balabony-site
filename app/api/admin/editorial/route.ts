import { NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

export async function GET() {
  try {
    await initEditorialTables()
    const result = await dbQuery(`
      SELECT
        s.id, s.filename, s.status, s.submitted_at, s.updated_at,
        json_agg(json_build_object(
          'id', a.id, 'editorName', a.editor_name, 'editorEmail', a.editor_email,
          'token', a.token, 'responseAction', a.response_action,
          'revisedText', a.revised_text, 'comment', a.comment,
          'respondedAt', a.responded_at
        ) ORDER BY a.id) as assignments
      FROM editorial_submissions s
      LEFT JOIN editorial_assignments a ON a.submission_id = s.id
      GROUP BY s.id
      ORDER BY s.submitted_at DESC
    `)
    return NextResponse.json({ submissions: result.rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
