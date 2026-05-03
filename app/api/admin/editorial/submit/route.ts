import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { dbQuery, initEditorialTables } from '@/lib/db'
import { sendEditorEmail } from '@/lib/email'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

interface EntryInput {
  filename: string
  text: string
}

interface EditorRow {
  id: number
  name: string
  email: string
}

export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()

    const body = await request.json() as { entries?: EntryInput[] }
    const entries = body.entries
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'entries must be a non-empty array' }, { status: 400 })
    }

    const editorsResult = await dbQuery('SELECT id, name, email FROM editors ORDER BY name ASC')
    const editors: EditorRow[] = editorsResult.rows

    if (editors.length === 0) {
      return NextResponse.json(
        { error: 'Немає редакторів. Додайте редакторів у /admin/editors' },
        { status: 400 }
      )
    }

    for (const entry of entries) {
      const subResult = await dbQuery(
        'INSERT INTO editorial_submissions (filename, text) VALUES ($1, $2) RETURNING id',
        [entry.filename, entry.text]
      )
      const submissionId: number = subResult.rows[0].id

      for (const editor of editors) {
        const token = randomBytes(32).toString('hex')
        await dbQuery(
          `INSERT INTO editorial_assignments
            (submission_id, editor_id, editor_name, editor_email, token)
           VALUES ($1, $2, $3, $4, $5)`,
          [submissionId, editor.id, editor.name, editor.email, token]
        )

        const approveUrl = `${SITE_URL}/editor/approve/${token}`
        const reviseUrl = `${SITE_URL}/editor/revise/${token}`

        await sendEditorEmail({
          to: editor.email,
          editorName: editor.name,
          filename: entry.filename,
          text: entry.text,
          approveUrl,
          reviseUrl,
        })
      }
    }

    return NextResponse.json({ submitted: entries.length, editorCount: editors.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
