import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import { dbQuery } from '@/lib/db'
import PrintButton from '@/app/components/PrintButton'

/**
 * Додаток № 1 «Перелік Творів Автора» — сторінка для збереження в PDF.
 *
 * Договір (Додаток № 1) обіцяє: «Автор має до нього постійний доступ і може
 * будь-коли завантажити чинну редакцію у форматі PDF із зазначенням дати
 * формування». Кнопки не було — цю обіцянку закриває ця сторінка.
 *
 * Чому друк браузера, а не серверний PDF: генерація на сервері вимагає
 * бібліотеки і вбудованого кириличного TTF, бо стандартні шрифти PDF
 * української не містять і текст вийшов би квадратами. Діалог друку малює
 * кирилицю сам і вміє «Зберегти як PDF» на всіх платформах. Той самий
 * підхід уже застосовано на сторінці самого договору.
 *
 * Перелік показуємо ПОВНИЙ, а не лише опубліковані твори: договором
 * охоплені твори зі статусом «опубліковано», але Додаток за своїм текстом
 * містить і статус кожного твору, тобто має показувати й решту.
 */

export const dynamic = 'force-dynamic'

const BRAND = {
  navy: '#16202e',
  amber: '#ef9f27',
  ink: '#1c1917',
  muted: '#6b7280',
  line: '#d8d2c6',
}
const SERIF = 'Georgia, "Times New Roman", serif'

type Row = {
  title: string | null
  prior_publication: string | null
  confirmed_at: string | null
  added_at: string | null
  content_status: string | null
  published_at: string | null
  co_authors: string | null
}

const STATUS: Record<string, string> = {
  published: 'опубліковано',
  review: 'на розгляді',
  human_review: 'на розгляді',
  draft: 'не опубліковано',
}

function d(iso: string | null): string {
  if (!iso) return '—'
  const t = new Date(iso)
  if (isNaN(t.getTime())) return '—'
  return `${String(t.getDate()).padStart(2, '0')}.${String(t.getMonth() + 1).padStart(2, '0')}.${t.getFullYear()}`
}

/** Строк за п. 4.2 — три роки від дати публікації конкретного Твору. */
function termEnd(publishedAt: string | null): string {
  if (!publishedAt) return '—'
  const t = new Date(publishedAt)
  if (isNaN(t.getTime())) return '—'
  return d(new Date(t.getFullYear() + 3, t.getMonth(), t.getDate()).toISOString())
}

export default async function DodatokPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/author/dashboard')

  const { id } = await params

  const c = await dbQuery(
    `select c.id, c.number, c.signed_at, c.created_at, p.full_name
       from author_contracts c
       left join author_profiles p on p.user_id = c.author_id
      where c.id = $1 and c.author_id = $2
      limit 1`,
    [id, user.id],
  )
  const contract = c.rows[0] as
    | { id: string; number: string | null; signed_at: string | null; created_at: string | null; full_name: string | null }
    | undefined

  if (!contract) {
    return (
      <main style={{ background: '#fff', color: BRAND.ink, minHeight: '60vh', padding: '28px 18px 64px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <h1 style={{ fontSize: 21, margin: '0 0 12px' }}>Додаток не знайдено</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>
            Такого договору немає або він належить іншому автору.
          </p>
          <a href="/author/dashboard" style={{ fontSize: 14, color: BRAND.navy }}>← Кабінет</a>
        </div>
      </main>
    )
  }

  const w = await dbQuery(
    `select w.title, w.prior_publication, w.confirmed_at, w.added_at, w.co_authors,
            t.status::text as content_status, t.published_at
       from contract_works w
       left join content t on t.id = w.content_id
      where w.contract_id = $1
      order by t.published_at asc nulls last, w.title asc`,
    [contract.id],
  )
  const works = w.rows as Row[]

  const formedAt = new Date()
  const formed =
    `${String(formedAt.getDate()).padStart(2, '0')}.${String(formedAt.getMonth() + 1).padStart(2, '0')}.` +
    `${formedAt.getFullYear()} о ${String(formedAt.getHours()).padStart(2, '0')}:${String(formedAt.getMinutes()).padStart(2, '0')}`

  const published = works.filter(r => (r.content_status ?? '') === 'published').length

  const th: React.CSSProperties = {
    textAlign: 'left', fontSize: 12, fontWeight: 700, color: BRAND.navy,
    borderBottom: `2px solid ${BRAND.navy}`, padding: '8px 6px', verticalAlign: 'bottom',
  }
  const td: React.CSSProperties = {
    fontSize: 12.5, color: BRAND.ink, borderBottom: `1px solid ${BRAND.line}`,
    padding: '7px 6px', verticalAlign: 'top',
  }

  return (
    <main style={{ background: '#fff', color: BRAND.ink, padding: '24px 16px 64px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif' }}>

        <div className="no-print" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
          <a
            href={`/author/contract/${contract.id}`}
            style={{ fontSize: 14, color: BRAND.navy, textDecoration: 'none', border: `1px solid ${BRAND.line}`, borderRadius: 8, padding: '9px 16px' }}
          >
            ← Договір
          </a>
          <PrintButton />
          <span style={{ fontSize: 13, color: BRAND.muted }}>
            У діалозі друку оберіть «Зберегти як PDF».
          </span>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 22, margin: '0 0 6px', color: BRAND.navy }}>
          Додаток № 1 — Перелік Творів Автора
        </h1>
        <p style={{ fontSize: 13.5, color: BRAND.muted, margin: '0 0 18px', lineHeight: 1.6 }}>
          до авторського договору {contract.number ? `№ ${contract.number}` : ''}
          {contract.full_name ? ` · ${contract.full_name}` : ''}
          <br />
          Дата формування переліку: {formed}
        </p>

        {works.length === 0 ? (
          <p style={{ fontSize: 15, lineHeight: 1.6 }}>
            Перелік поки порожній: жодного твору до цього договору не долучено.
          </p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 34 }}>№</th>
                  <th style={th}>Назва Твору</th>
                  <th style={{ ...th, width: 92 }}>Долучено<br />або підтверджено</th>
                  <th style={{ ...th, width: 92 }}>Статус</th>
                  <th style={{ ...th, width: 82 }}>Дата<br />публікації</th>
                  <th style={{ ...th, width: 82 }}>Строк<br />за п. 4.2</th>
                  <th style={{ ...th, width: 110 }}>Раніше публікувався</th>
                  <th style={{ ...th, width: 110 }}>Співавтори</th>
                </tr>
              </thead>
              <tbody>
                {works.map((r, i) => (
                  <tr key={`${r.title ?? ''}-${i}`}>
                    <td style={{ ...td, color: BRAND.muted }}>{i + 1}</td>
                    <td style={td}>{(r.title ?? '').trim() || '—'}</td>
                    <td style={td}>{d(r.confirmed_at ?? r.added_at)}</td>
                    <td style={td}>{STATUS[r.content_status ?? ''] ?? 'не опубліковано'}</td>
                    <td style={td}>{d(r.published_at)}</td>
                    <td style={td}>{termEnd(r.published_at)}</td>
                    <td style={td}>{(r.prior_publication ?? '').trim() || '—'}</td>
                    <td style={td}>{(r.co_authors ?? '').trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ fontSize: 13, color: BRAND.muted, lineHeight: 1.7, margin: '0 0 20px' }}>
              Усього творів у переліку: <strong style={{ color: BRAND.ink }}>{works.length}</strong>,
              з них зі статусом «опубліковано»: <strong style={{ color: BRAND.ink }}>{published}</strong>.
              Договором охоплені Твори зі статусом «опубліковано». Строк передачі прав обчислюється
              окремо для кожного Твору — три роки від дати його публікації на Платформі (п. 4.2).
              Перелік формується автоматично і є невідʼємною частиною Договору.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, marginTop: 34, fontSize: 13 }}>
              <span>____________ / Б.&nbsp;І.&nbsp;Хомин /</span>
              <span>____________ / ___________________ /</span>
            </div>
          </>
        )}

        <style>{`
          @media print {
            .no-print { display: none !important }
            .bb-root, nav, header, footer,
            [role="dialog"], [data-nosnippet] { display: none !important }
            body { background: #fff }
            thead { display: table-header-group }
            tr { break-inside: avoid }
            @page { margin: 14mm 12mm }
          }
        `}</style>
      </div>
    </main>
  )
}
