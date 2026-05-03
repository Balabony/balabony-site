import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not configured')
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  }
  return pool
}

export async function dbQuery(text: string, params?: unknown[]) {
  return getPool().query(text, params)
}

export async function initEditorialTables() {
  await dbQuery(`CREATE TABLE IF NOT EXISTS editors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`)
  await dbQuery(`CREATE TABLE IF NOT EXISTS editorial_submissions (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_review',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`)
  await dbQuery(`CREATE TABLE IF NOT EXISTS editorial_assignments (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES editorial_submissions(id) ON DELETE CASCADE,
    editor_id INTEGER,
    editor_name TEXT NOT NULL,
    editor_email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    response_action TEXT,
    revised_text TEXT,
    comment TEXT
  )`)
}
