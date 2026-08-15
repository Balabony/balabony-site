import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import ContractWorksList, { type WorkRow } from '@/app/components/ContractWorksList'

export const dynamic = 'force-dynamic'

const BRAND = {
  navy: '#16202e',
  cream: '#f6f1e7',
  amber: '#ef9f27',
  ink: '#1c1917',
  muted: '#78716c',
}
const SERIF = 'Georgia, "Times New Roman", serif'

export default async function ContractWorksPage(
  { searchParams }: { searchParams: Promise<{ contract?: string }> },
) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { contract: contractId } = await searchParams

  let number = ''
  let works: WorkRow[] = []
  let found = false

  if (contractId) {
    try {
      const c = await dbQuery(
        `select number from author_contracts where id = $1 and author_id = $2 limit 1`,
        [contractId, user.id],
      )
      const row = c.rows[0] as { number: string } | undefined
      if (row) {
        found = true
        number = row.number
        const w = await dbQuery(
          `select w.id,
                  w.title,
                  w.prior_publication,
                  w.confirmed_at,
                  w.added_at,
                  w.has_third_party_audio,
                  w.audio_with_consent,
                  w.audio_sources,
                  w.series_name,
                  w.series_order,
                  t.status        as content_status,
                  t.published_at  as published_at,
                  t.type          as content_type,
                  t.episode_number as episode_number
             from contract_works w
             left join content t on t.id = w.content_id
            where w.contract_id = $1
            order by coalesce(t.type::text, 'zzz') asc,
                     t.episode_number asc nulls last,
                     w.title asc`,
          [contractId],
        )
        works = w.rows as WorkRow[]
      }
    } catch (e) {
      // Мовчазний catch тут колись показував «Договір не знайдено» на будь-якій
      // помилці SQL — наприклад, коли в запиті зʼявлялася нова колонка, якої ще
      // немає в базі. Тепер причина видна в логах Vercel.
      const err = e as { message?: string }
      console.error('[author/works] db', err?.message)
      found = false
    }
  }

  return (
    <main style={{ padding: '2rem 1rem', background: BRAND.navy, minHeight: '80vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <a href="/" style={{ textDecoration: 'none', fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: BRAND.amber, letterSpacing: '0.5px' }}>
            Balabony<span style={{ fontSize: '0.7rem', verticalAlign: 'super' }}>™</span>
          </a>
          <a href="/author/dashboard" style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
            ← До кабінету
          </a>
        </div>

        <div style={{ background: BRAND.cream, borderRadius: 16, padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: '1.7rem', color: BRAND.ink, margin: '0 0 1rem' }}>
            Перелік творів
          </h1>

          {!found ? (
            <p style={{ color: BRAND.muted, lineHeight: 1.7, margin: 0 }}>
              Договір не знайдено. Поверніться до <a href="/author/dashboard" style={{ color: '#b45309' }}>кабінету</a> і
              відкрийте перелік із картки договору.
            </p>
          ) : (
            <ContractWorksList
              contractId={contractId ?? ''}
              contractNumber={number}
              works={works}
              generatedAt={new Date().toISOString()}
            />
          )}
        </div>
      </div>
    </main>
  )
}
