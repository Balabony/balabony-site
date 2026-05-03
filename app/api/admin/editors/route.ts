import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, initEditorialTables } from '@/lib/db'

export async function GET() {
  try {
    await initEditorialTables()
    const result = await dbQuery('SELECT id, name, email, created_at FROM editors ORDER BY name ASC')
    return NextResponse.json({ editors: result.rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initEditorialTables()
    const body = await request.json() as { name?: string; email?: string }
    const name = body.name?.trim()
    const email = body.email?.trim()
    if (!name || !email) {
      return NextResponse.json({ error: "Поля 'name' та 'email' обов'язкові" }, { status: 400 })
    }
    const result = await dbQuery(
      'INSERT INTO editors (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    )
    return NextResponse.json({ editor: result.rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    if (message.includes('unique') || message.includes('duplicate')) {
      return NextResponse.json({ error: 'Редактор з таким email вже існує' }, { status: 400 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initEditorialTables()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Невірний id' }, { status: 400 })
    }
    await dbQuery('DELETE FROM editors WHERE id = $1', [Number(id)])
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
