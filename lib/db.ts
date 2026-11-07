import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not configured')
    // 07.11.2026: EMAXCONNSESSION повторилася (адмінка «Кабінети авторів»). Session pooler Supabase
    // (порт 5432) дає лише 15 з'єднань на всі копії функцій Vercel. Transaction pooler (порт 6543)
    // розрахований саме на serverless: з'єднання віддається після кожного запиту. Сесійних функцій
    // (LISTEN, advisory locks, temp tables, SET) у коді немає — перевірено.
    let url = process.env.DATABASE_URL
    if (/pooler\.supabase\.com:5432\//.test(url)) url = url.replace('pooler.supabase.com:5432/', 'pooler.supabase.com:6543/')
    pool = new Pool({
      connectionString: url,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      // 17.10.2026: на Vercel кожна копія функції має свій пул. За замовчуванням pg
      // відкриває до 10 з'єднань на копію, а Session pooler Supabase тримає лише 15
      // на всіх — звідси EMAXCONNSESSION на /admin/dochytuvannia. Тримаємо мало
      // з'єднань і швидко віддаємо ті, що простоюють.
      max: 2,
      idleTimeoutMillis: 5_000,
      connectionTimeoutMillis: 10_000,
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
