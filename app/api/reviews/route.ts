import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

let pool: Pool | null = null

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL })
  return pool
}

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS reviews (
    id           SERIAL PRIMARY KEY,
    content_type VARCHAR(20)  NOT NULL,
    content_id   VARCHAR(255) NOT NULL,
    author_id    VARCHAR(255),
    rating       SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    user_id      VARCHAR(255),
    created_at   TIMESTAMPTZ  DEFAULT NOW()
  )
`

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    contentType?: string
    contentId?: string
    authorId?: string | null
    rating?: number
    comment?: string | null
    userId?: string | null
  }
  const { contentType, contentId, authorId, rating, comment, userId } = body

  if (!contentType || !contentId || !rating) {
    return NextResponse.json({ error: "Відсутні обов'язкові поля" }, { status: 400 })
  }

  const db = getPool()
  if (!db) {
    return NextResponse.json({ ok: true, stored: 'local' })
  }

  try {
    await db.query(CREATE_TABLE)
    await db.query(
      `INSERT INTO reviews (content_type, content_id, author_id, rating, comment, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [contentType, contentId, authorId ?? null, rating, comment ?? null, userId ?? null]
    )
    return NextResponse.json({ ok: true, stored: 'db' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const authorId  = searchParams.get('authorId')
  const contentId = searchParams.get('contentId')

  const db = getPool()
  if (!db) {
    return NextResponse.json({ reviews: [], note: 'DATABASE_URL не налаштовано' })
  }

  try {
    await db.query(CREATE_TABLE)

    let rows
    if (authorId) {
      const r = await db.query(
        `SELECT * FROM reviews WHERE author_id = $1 ORDER BY created_at DESC`,
        [authorId]
      )
      rows = r.rows
    } else if (contentId) {
      const r = await db.query(
        `SELECT * FROM reviews WHERE content_id = $1 ORDER BY created_at DESC`,
        [contentId]
      )
      rows = r.rows
    } else {
      const r = await db.query(
        `SELECT * FROM reviews ORDER BY created_at DESC LIMIT 200`
      )
      rows = r.rows
    }

    return NextResponse.json({ reviews: rows })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
