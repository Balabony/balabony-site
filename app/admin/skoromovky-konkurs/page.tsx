// 01.11.2026: адмінка дитячого конкурсу «Скоромовка Балабонів» — усі подані скоромовки (лише для адміна).
import { cookies } from 'next/headers'
import { dbQuery } from '@/lib/db'
import { KIDS_CONTEST, AGE_GROUPS, groupLabel } from '@/lib/kids-contest'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Конкурс скоромовок — адмін', robots: { index: false, follow: false } }

type Row = { id: string; created_at: string; role: string; adult_name: string; email: string; school: string | null; child_name: string; child_age: number; age_group: string; city: string; title: string | null; body: string; status: string }

export default async function Page() {
  const pass = process.env.ADMIN_PASSWORD
  const ok = Boolean(pass) && (await cookies()).get('admin_session')?.value === pass
  if (!ok) return <main style={{ padding: 40, fontFamily: 'Arial' }}>Потрібен вхід: <a href="/admin/login">/admin/login</a></main>

  let rows: Row[] = []
  let err = ''
  try {
    const r = await dbQuery(
      `select id::text, created_at, role, adult_name, email, school, child_name, child_age, age_group, city, title, body, status
         from kids_contest_entries where contest = $1 order by created_at desc`,
      [KIDS_CONTEST.id],
    )
    rows = r.rows as Row[]
  } catch (e) { err = (e as Error)?.message ?? 'помилка бази' }

  const cnt = (g: string) => rows.filter((r) => r.age_group === g).length
  const teachers = new Set(rows.filter((r) => r.role === 'teacher').map((r) => r.email)).size
  const td = { border: '1px solid #e2e8f0', padding: '6px 8px', verticalAlign: 'top' as const, fontSize: 14 }

  return (
    <main style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
      <h1 style={{ margin: '0 0 6px' }}>Конкурс скоромовок 2026 — подані роботи</h1>
      {err && <p style={{ color: '#0f172a', fontWeight: 700 }}>Помилка: {err}. Чи створено таблицю kids_contest_entries?</p>}
      <p>Усього: <b>{rows.length}</b> · {AGE_GROUPS.map((g) => `${g.label.split(' (')[0]}: ${cnt(g.id)}`).join(' · ')} · вчителів: {teachers}</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead><tr>{['№', 'Дата', 'Дитина', 'Група', 'Місто', 'Скоромовка', 'Хто подав', 'Школа', 'Пошта'].map((h) => <th key={h} style={{ ...td, background: '#f8fafc', textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{r.id}</td>
                <td style={td}>{new Date(r.created_at).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}</td>
                <td style={td}>{r.child_name}, {r.child_age}</td>
                <td style={td}>{groupLabel(r.age_group).split(' (')[0]}</td>
                <td style={td}>{r.city}</td>
                <td style={{ ...td, whiteSpace: 'pre-line', minWidth: 260 }}>{r.title ? <b>{r.title}<br /></b> : null}{r.body}</td>
                <td style={td}>{r.adult_name} ({r.role === 'teacher' ? 'вчитель' : 'батьки'})</td>
                <td style={td}>{r.school ?? ''}</td>
                <td style={td}>{r.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
