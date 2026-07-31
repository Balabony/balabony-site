import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { CONTRACT_BLOCKS } from '@/lib/contract/template'
import { buildVars, fmtDate, DASH } from '@/lib/contract/vars'
import { computeDocHash, shortHash } from '@/lib/contract/hash'
import PrintButton from '@/app/components/PrintButton'

export const metadata: Metadata = {
  title: 'Авторський договір · Балабони',
  robots: { index: false, follow: false },
}


export default async function ContractPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const c = await dbQuery(
    `select id, number, status, rate, is_fop, created_at, signed_at, doc_hash
       from author_contracts where id = $1 and author_id = $2 limit 1`,
    [id, user.id],
  )
  if (c.rowCount === 0) notFound()
  const contract = c.rows[0] as {
    id: string; number: string; status: string; rate: number | null
    is_fop: boolean | null; created_at: string | null; signed_at: string | null
    doc_hash: string | null
  }

  const p = await dbQuery(
    `select full_name, rnokpp, address, phone, payout_iban, bank_name, payout_recipient, pen_name
       from author_profiles where user_id = $1 limit 1`,
    [user.id],
  )
  const prof = (p.rows[0] ?? {}) as Record<string, string | null>

  const w = await dbQuery(
    `select content_id, title from contract_works where contract_id = $1`,
    [contract.id],
  )
  const works = w.rows as { content_id: string | null; title: string | null }[]
  const worksCount = works.length

  const V = buildVars(contract, prof, user.email ?? null, worksCount)

  // Контрольна сума поточної редакції: те саме обчислення, що й при підписанні.
  const currentHash = computeDocHash(V, works)

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
            return <h1 key={i} style={{ fontSize: 23, textAlign: 'center', margin: '0 0 6px', fontWeight: 700, letterSpacing: 0.5 }}>{t}</h1>
          }
          // Підзаголовок під назвою договору
          if (i === 1) {
            return <p key={i} style={{ fontSize: 16, textAlign: 'center', margin: '0 0 26px', fontWeight: 700 }}>{t}</p>
          }
          // Рядок «№ … від …» і місто — по краях одного рядка
          if (t.startsWith('№') && t.includes('м. Львів')) {
            const city = 'м. Львів'
            const left = t.replace(city, '').trim()
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', fontSize: 14.5, fontWeight: 700, margin: '0 0 20px' }}>
                <span>{left}</span>
                <span>{city}</span>
              </div>
            )
          }
          if (b.k === 'h2') {
            return <h2 key={i} style={{ fontSize: 16, margin: '20px 0 8px', fontWeight: 700 }}>{t}</h2>
          }
          if (b.k === 'req') {
            return <p key={i} style={{ fontSize: 15, margin: '18px 0 6px', fontWeight: 700, letterSpacing: 0.5 }}>{t}</p>
          }
          return <p key={i} style={{ fontSize: 14.5, lineHeight: 1.6, margin: '0 0 8px', textAlign: 'justify' }}>{t}</p>
        })}

        <div style={{
          marginTop: 30, paddingTop: 14, borderTop: '1px solid #d8dee8',
          fontSize: 12, color: '#5a6b85', fontFamily: 'Arial, sans-serif', lineHeight: 1.7,
        }}>
          <div>Редакція від {fmtDate(null)} · творів у Додатку № 1: {worksCount}</div>
          <div>Контрольна сума редакції: {shortHash(currentHash)}</div>
          {contract.doc_hash && contract.doc_hash !== currentHash ? (
            <div style={{ marginTop: 4, color: '#8a5a00' }}>
              Підписано редакцію з сумою {shortHash(contract.doc_hash)} — відтоді перелік творів
              поповнився. Підписана редакція лишається чинною в тому вигляді, в якому її підписано.
            </div>
          ) : null}
        </div>

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
