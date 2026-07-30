import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { CONTRACT_BLOCKS } from '@/lib/contract/template'
import PrintButton from '@/app/components/PrintButton'

export const metadata: Metadata = {
  title: 'Авторський договір · Балабони',
  robots: { index: false, follow: false },
}

const DASH = '_______________'

function fmtDate(iso: string | null): string {
  const d = iso ? new Date(iso) : new Date()
  return `«${String(d.getDate()).padStart(2, '0')}» ${d.toLocaleDateString('uk-UA', { month: 'long' })} ${d.getFullYear()} р.`
}

export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const c = await dbQuery(
    `select id, number, status, rate, is_fop, created_at, signed_at
       from author_contracts where id = $1 and author_id = $2 limit 1`,
    [id, user.id],
  )
  if (c.rowCount === 0) notFound()
  const contract = c.rows[0] as {
    id: string; number: string; status: string; rate: number | null
    is_fop: boolean | null; created_at: string | null; signed_at: string | null
  }

  const p = await dbQuery(
    `select full_name, rnokpp, address, phone, payout_iban, bank_name, payout_recipient, pen_name
       from author_profiles where user_id = $1 limit 1`,
    [user.id],
  )
  const prof = (p.rows[0] ?? {}) as Record<string, string | null>

  const w = await dbQuery(`select count(*)::int as n from contract_works where contract_id = $1`, [contract.id])
  const worksCount = (w.rows[0]?.n as number | undefined) ?? 0

  const V: Record<string, string> = {
    NUMBER: contract.number || DASH,
    DATE: fmtDate(contract.signed_at ?? contract.created_at),
    AUTHOR_NAME: prof.full_name || DASH,
    AUTHOR_RNOKPP: prof.rnokpp || DASH,
    AUTHOR_ADDRESS: prof.address || DASH,
    AUTHOR_PHONE: prof.phone || DASH,
    AUTHOR_EMAIL: user.email || DASH,
    AUTHOR_IBAN: prof.payout_iban || DASH,
    AUTHOR_BANK: prof.bank_name || DASH,
    AUTHOR_RECIPIENT: prof.payout_recipient || prof.full_name || DASH,
    PEN_NAME: prof.pen_name || '—',
    WORKS_COUNT: String(worksCount),
  }

  const fill = (t: string) => t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => V[k] ?? DASH)

  return (
    <main style={{ background: '#ffffff', color: '#16202e', minHeight: '60vh', padding: '28px 18px 64px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: "'Times New Roman', Georgia, serif" }}>

        <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
          <a href="/author/dashboard" style={{ fontSize: 14, color: '#2c3a52', textDecoration: 'none', border: '1px solid #ccd3de', borderRadius: 8, padding: '9px 16px', fontFamily: 'Arial, sans-serif' }}>
            ← Кабінет
          </a>
          <PrintButton />
        </div>

        {CONTRACT_BLOCKS.map((b, i) => {
          const t = fill(b.t)
          if (b.k === 'h1') {
            return <h1 key={i} style={{ fontSize: 22, textAlign: 'center', margin: '0 0 4px', fontWeight: 700 }}>{t}</h1>
          }
          if (b.k === 'h2') {
            return <h2 key={i} style={{ fontSize: 16, margin: '20px 0 8px', fontWeight: 700 }}>{t}</h2>
          }
          if (b.k === 'req') {
            return <p key={i} style={{ fontSize: 15, margin: '18px 0 6px', fontWeight: 700, letterSpacing: 0.5 }}>{t}</p>
          }
          return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px', textAlign: 'justify' }}>{t}</p>
        })}

        <p className="no-print" style={{ fontSize: 13, color: '#5a6b85', marginTop: 28, fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
          Щоб підписати договір кваліфікованим підписом, збережіть цю сторінку як PDF
          (кнопка вище або Ctrl+P → «Зберегти як PDF»), підпишіть файл своїм ключем і
          завантажте його в кабінеті.
        </p>

        <style>{`@media print { .no-print { display: none !important } body { background: #fff } }`}</style>
      </div>
    </main>
  )
}
