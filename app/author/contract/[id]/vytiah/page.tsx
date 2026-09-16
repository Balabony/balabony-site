import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import { CONTRACT_REVISION } from '@/lib/contract/template'
import PrintButton from '@/app/components/PrintButton'

/**
 * Додаток № 2 — англомовний витяг про обсяг прав (п. 16.13 Договору).
 *
 * Договір обіцяє: «Автор має право будь-коли отримати копію витягу в
 * Особистому кабінеті». Ця сторінка і є тією копією.
 *
 * Текст англійською свідомо: витяг існує для іноземних партнерів, донорів
 * і ліцензіатів. Автор бачить те саме, що побачить партнер, — інакше
 * «отримати копію» не мало б сенсу.
 *
 * Витяг НЕ підписується Автором і не змінює умов Договору (п. 16.13), тому
 * рядка для його підпису тут немає — лише засвідчення Видавцем.
 *
 * Обсяг прав нижче переказує розділи 2-4 Договору. Змінюючи їх, звіряти цю
 * сторінку: розбіжність між витягом і договором — саме те, чого п. 16.13
 * велить уникати.
 */

export const dynamic = 'force-dynamic'

const BRAND = {
  navy: '#16202e',
  ink: '#1c1917',
  muted: '#6b7280',
  line: '#d8d2c6',
}
const SERIF = 'Georgia, "Times New Roman", serif'

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function RightsStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const c = await dbQuery(
    `select c.id, c.number, c.signed_at, c.created_at,
            p.full_name, p.pen_name,
            (select count(*) from contract_works w where w.contract_id = c.id)::int as works_count
       from author_contracts c
       left join author_profiles p on p.user_id = c.author_id
      where c.id = $1 and c.author_id = $2
      limit 1`,
    [id, user.id],
  )
  const contract = c.rows[0] as
    | { id: string; number: string | null; signed_at: string | null; created_at: string | null
        full_name: string | null; pen_name: string | null; works_count: number }
    | undefined

  if (!contract) {
    return (
      <main style={{ background: '#fff', color: BRAND.ink, minHeight: '60vh', padding: '28px 18px 64px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <h1 style={{ fontSize: 21, margin: '0 0 12px' }}>Витяг не знайдено</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>
            Такого договору немає або він належить іншому автору.
          </p>
          <a href="/author/dashboard" style={{ fontSize: 14, color: BRAND.navy }}>← Кабінет</a>
        </div>
      </main>
    )
  }

  const signed = contract.signed_at ?? contract.created_at
  const author = (contract.full_name ?? '').trim() || '—'
  const pen = (contract.pen_name ?? '').trim()

  const h2: React.CSSProperties = {
    fontFamily: SERIF, fontSize: 15.5, color: BRAND.navy, margin: '22px 0 8px',
  }
  const p: React.CSSProperties = { fontSize: 13.5, lineHeight: 1.65, margin: '0 0 10px' }
  const li: React.CSSProperties = { fontSize: 13.5, lineHeight: 1.6, marginBottom: 5 }

  return (
    <main style={{ background: '#fff', color: BRAND.ink, padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>

        <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <a
            href={`/author/contract/${contract.id}`}
            style={{ fontSize: 14, color: BRAND.navy, textDecoration: 'none', border: `1px solid ${BRAND.line}`, borderRadius: 8, padding: '9px 16px' }}
          >
            ← Договір
          </a>
          <PrintButton />
        </div>

        <p className="no-print" style={{ fontSize: 13.5, lineHeight: 1.6, color: BRAND.muted, margin: '0 0 22px', padding: '12px 14px', border: `1px solid ${BRAND.line}`, borderRadius: 10 }}>
          Це англомовний витяг для іноземних партнерів і ліцензіатів (Додаток № 2, п. 16.13
          договору). Він має інформаційний характер, не змінює умов договору і вами не
          підписується. У разі розбіжностей діє україномовний текст договору.
        </p>

        <h1 style={{ fontFamily: SERIF, fontSize: 21, margin: '0 0 4px', color: BRAND.navy }}>
          Annex No. 2 — Statement of Rights Granted
        </h1>
        <p style={{ fontSize: 13, color: BRAND.muted, margin: '0 0 6px', lineHeight: 1.6 }}>
          to Author Agreement {contract.number ? `No. ${contract.number}` : ''}
          {signed ? ` dated ${iso(new Date(signed))}` : ''} · Agreement revision {CONTRACT_REVISION}
          <br />
          Issued on {iso(new Date())}
        </p>

        <h2 style={h2}>1. Rightsholder and Works</h2>
        <p style={p}>
          <strong>Publisher (rightsholder):</strong> Bohdan Khomyn, individual entrepreneur, Lviv, Ukraine.
          <br />
          <strong>Author:</strong> {author}{pen ? ` (writing as ${pen})` : ''}.
          <br />
          <strong>Works:</strong> {contract.works_count} title(s), as listed in Annex No. 1 to the Agreement.
        </p>

        <h2 style={h2}>2. Rights held by the Publisher</h2>
        <p style={p}>
          Under Section 3 of the Agreement the Author has assigned exclusive economic rights to the
          Publisher, including the right to:
        </p>
        <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
          <li style={li}>publish the texts on the Publisher&apos;s platform and distribute them, including on a paid basis;</li>
          <li style={li}>produce audio content, including by means of speech synthesis;</li>
          <li style={li}><strong>translate the Works into any language</strong>, produce audio content in other languages, and distribute both through foreign publishers and licensees, including on a paid basis (cl. 3.12);</li>
          <li style={li}><strong>grant sublicences to third parties without further consent from the Author</strong> (cl. 3.8);</li>
          <li style={li}>produce accessible formats (EPUB, DAISY, Braille, easy-to-read);</li>
          <li style={li}>publish the Works in print editions and in collections;</li>
          <li style={li}>use the Works in grant-funded, educational and cultural projects;</li>
          <li style={li}>determine at its own discretion the technical means, structure and functionality of the platform (cl. 3.20).</li>
        </ul>

        <h2 style={h2}>3. Derivative works</h2>
        <p style={p}>
          Audio content, translations and other derivative works produced by the Publisher
          <strong> belong to the Publisher</strong>, constitute separate objects of rights, and the
          Publisher may dispose of them independently of the underlying texts and without the
          Author&apos;s consent (cl. 4.3, 4.3-1). The licence to use a Work as part of a derivative
          work is irrevocable, perpetual and worldwide (cl. 3.18).
        </p>

        <h2 style={h2}>4. Territory and term</h2>
        <p style={p}>
          Territory: worldwide (cl. 4.1). Term of assignment:
          <strong> three years for each Work separately</strong>, running from the date that Work is
          published on the platform (cl. 4.2). This time limit does not apply to derivative works or
          to the licence under cl. 3.18, which are perpetual (cl. 4.2-1).
        </p>

        <h2 style={h2}>5. Limitations the partner should be aware of</h2>
        <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>
          <li style={li}>Works previously published elsewhere are assigned on a <strong>non-exclusive</strong> basis (cl. 2.8).</li>
          <li style={li}>Training of artificial intelligence systems <strong>for commercial purposes</strong> requires separate written consent from the Author (cl. 3.19).</li>
          <li style={li}>The Author&apos;s name or pen name is credited in every use; the content of a Work is not distorted.</li>
          <li style={li}>The Author retains the right to post their Works on their own channels and to publish them as a separate book (cl. 2.7-1, 2.7-2).</li>
        </ul>

        <h2 style={h2}>6. Status of this document</h2>
        <p style={p}>
          This statement is informational, is certified by the Publisher and is not signed by the
          Author. It does not modify the Agreement and neither creates nor limits the rights of the
          parties. In the event of any discrepancy, the Ukrainian text of the Agreement prevails
          (cl. 16.13).
        </p>

        <p style={{ fontSize: 13, marginTop: 30 }}>____________ / B. I. Khomyn /</p>

        <style>{`
          @media print {
            .no-print { display: none !important }
            .bb-root, nav, header, footer,
            [role="dialog"], [data-nosnippet] { display: none !important }
            body { background: #fff }
            @page { margin: 14mm 12mm }
          }
        `}</style>
      </div>
    </main>
  )
}
