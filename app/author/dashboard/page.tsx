import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import NarrationOrderForm from '@/app/components/NarrationOrderForm'
import AuthorContracts, { type ContractRow } from '@/app/components/AuthorContracts'
import AuthorRequisites, { type Requisites } from '@/app/components/AuthorRequisites'
import AuthorSurvey, { type Feedback } from '@/app/components/AuthorSurvey'
import { dbQuery } from '@/lib/db'

export const dynamic = 'force-dynamic'

type AuthorProfile = {
  user_id: string
  display_name: string
  email: string | null
  is_fop: boolean
  revenue_share: number
  payout_iban: string | null
  is_active: boolean
  full_name?: string | null
  rnokpp?: string | null
  address?: string | null
  phone?: string | null
  bank_name?: string | null
  payout_recipient?: string | null
  pen_name?: string | null
  postal_code?: string | null
  np_branch?: string | null
  requisites_updated_at?: string | null
}

type StoryStat = {
  content_id: string
  title: string
  slug: string
  status: string
  is_free: boolean
  views_count: number
  reads_total: number
  reads_completed: number
  avg_read_percentage: number
}

type Balance = {
  total_accrued: number
  total_paid: number
  balance: number
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Чернетка',
  humanizing: 'Обробка',
  human_review: 'Перевірка',
  approved: 'Схвалено',
  review: 'На редактурі',
  published: 'Опубліковано',
}

// --- Бренд-токени Balabony (зі сайту: theme-color #ef9f27, темно-синя героїка, кремові поверхні, сериф) ---
const BRAND = {
  navy: '#0a1628',
  navyCard: '#122445',
  cream: '#0f1e3a',
  amber: '#ef9f27',
  amberDark: '#FFB347',
  ink: '#f5f0e8',
  text: '#dbe4f0',
  muted: '#8fa3c4',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = 'Georgia, "Times New Roman", serif'

function uah(n: number) {
  return new Intl.NumberFormat('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)
}

// Верхня смуга з лого — щоб кабінет відчувався частиною сайту
function BrandBar() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
      <a href="/" style={{ textDecoration: 'none', fontFamily: SERIF, fontSize: '1.4rem', fontWeight: 700, color: BRAND.amber, letterSpacing: '0.5px' }}>
        Balabony<span style={{ fontSize: '0.7rem', verticalAlign: 'super' }}>™</span>
      </a>
      <a href="/" style={{ textDecoration: 'none', fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
        ← На сайт
      </a>
    </div>
  )
}

export default async function AuthorDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Профіль автора (RLS: лише свій). Якщо профілю немає — користувач не автор.
  const { data: profile } = await supabase
    .from('author_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: AuthorProfile | null }

  if (!profile) {
    return (
      <main style={{ padding: '2rem 1rem', background: BRAND.navy }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <BrandBar />
          <div style={{ background: BRAND.cream, padding: '2.5rem', borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,0.35)' }}>
            <h1 style={{ fontFamily: SERIF, fontSize: '1.9rem', marginBottom: '1rem', color: BRAND.ink }}>Кабінет автора</h1>
            <p style={{ color: BRAND.text, lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Ваш обліковий запис ще не підключено як авторський. Якщо ви подали заявку
              й очікуєте підтвердження — редакція активує доступ після підписання угоди.
            </p>
            <a href="/become-author" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', background: BRAND.amber, color: BRAND.ink, borderRadius: 10, textDecoration: 'none', fontWeight: 700 }}>
              Стати автором →
            </a>
          </div>
        </div>
      </main>
    )
  }

  // Історії автора + перегляди/прочитання (RLS на content успадковується)
  const { data: stats } = await supabase
    .from('author_story_stats')
    .select('*')
    .eq('author_id', user.id)
    .order('views_count', { ascending: false }) as { data: StoryStat[] | null }

  const stories = stats || []

  // Баланс
  const { data: bal } = await supabase
    .from('author_balance')
    .select('total_accrued, total_paid, balance')
    .eq('author_id', user.id)
    .single() as { data: Balance | null }

  const balance: Balance = bal || { total_accrued: 0, total_paid: 0, balance: 0 }

  const requisites: Requisites = {
    full_name: profile.full_name ?? null,
    rnokpp: profile.rnokpp ?? null,
    address: profile.address ?? null,
    phone: profile.phone ?? null,
    payout_iban: profile.payout_iban ?? null,
    bank_name: profile.bank_name ?? null,
    payout_recipient: profile.payout_recipient ?? null,
    pen_name: profile.pen_name ?? null,
    postal_code: profile.postal_code ?? null,
    np_branch: profile.np_branch ?? null,
    is_fop: profile.is_fop,
    requisites_updated_at: profile.requisites_updated_at ?? null,
  }

  // Опитування автора
  let feedback: Feedback = {
    ease_rating: null, inconvenience: null, topics: null, topics_other: null,
    helps_write: null, audio_interest: null, wishes: null, updated_at: null,
  }
  try {
    const fr = await dbQuery(
      `select ease_rating, inconvenience, topics, topics_other,
              helps_write, audio_interest, wishes, updated_at
         from author_feedback where author_id = $1 limit 1`,
      [user.id],
    )
    if (fr.rows[0]) feedback = fr.rows[0] as Feedback
  } catch {
    // таблиці ще немає — показуємо порожню форму
  }

  // Договори автора + кількість творів у переліку (Додаток № 1)
  let contracts: ContractRow[] = []
  try {
    const cr = await dbQuery(
      `select c.id, c.number, c.status, c.rate, c.is_fop,
              c.doc_url, c.signed_pdf_url, c.signature_url, c.signed_at,
              (select count(*) from contract_works w where w.contract_id = c.id)::int as works_count
         from author_contracts c
        where c.author_id = $1
        order by c.created_at desc`,
      [user.id],
    )
    contracts = cr.rows as ContractRow[]
  } catch {
    contracts = []
  }

  const totalViews = stories.reduce((s, x) => s + (x.views_count || 0), 0)
  const totalReads = stories.reduce((s, x) => s + (x.reads_total || 0), 0)
  const published = stories.filter(s => s.status === 'published').length

  const card: React.CSSProperties = {
    background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)', flex: '1 1 160px',
  }
  const statNum: React.CSSProperties = { fontSize: '2rem', fontWeight: 700, color: BRAND.ink, lineHeight: 1 }
  const statLabel: React.CSSProperties = { fontSize: '0.88rem', color: '#8fa3c4', fontWeight: 600, marginTop: 6 }

  return (
    <main style={{ padding: '2rem 1rem', background: BRAND.navy }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <BrandBar />

        {/* Заголовок сторінки */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.1rem', color: 'white', margin: 0 }}>Кабінет автора</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.35rem 0 0' }}>{profile.display_name}</p>
        </div>

        {/* Умови співпраці */}
        <div style={{ background: BRAND.navyCard, color: 'white', borderRadius: 14, padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', border: '1px solid rgba(239,159,39,0.25)' }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Ваші умови</div>
            <div style={{ fontFamily: SERIF, fontSize: '1.25rem', fontWeight: 700, color: BRAND.amber }}>
              {profile.is_fop ? 'Автор-ФОП · 50%' : 'Без ФОП · 40%'}
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.85, maxWidth: 420 }}>
            {profile.is_fop
              ? 'Половина доходу з ваших історій — ваша. Податки ви сплачуєте самостійно.'
              : '40% доходу з ваших історій — ваші. Податки сплачує платформа.'}
          </div>
        </div>

        {/* Зведення */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={card}><div style={statNum}>{published}</div><div style={statLabel}>опубліковано історій</div></div>
          <div style={card}><div style={statNum}>{totalViews}</div><div style={statLabel}>переглядів усього</div></div>
          <div style={card}><div style={statNum}>{totalReads}</div><div style={statLabel}>прочитань</div></div>
          <div style={{ ...card, background: BRAND.amber }}>
            <div style={{ ...statNum, color: BRAND.ink }}>{uah(balance.balance)} ₴</div>
            <div style={{ ...statLabel, color: 'rgba(28,25,23,0.7)' }}>баланс до виплати</div>
          </div>
        </div>

        {/* Деталі балансу */}
        <div style={{ background: BRAND.cream, borderRadius: 14, padding: '1.1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
          <div><div style={statLabel}>Нараховано всього</div><div style={{ fontWeight: 700, color: BRAND.ink }}>{uah(balance.total_accrued)} ₴</div></div>
          <div><div style={statLabel}>Виплачено</div><div style={{ fontWeight: 700, color: BRAND.ink }}>{uah(balance.total_paid)} ₴</div></div>
          <div><div style={statLabel}>До виплати</div><div style={{ fontWeight: 700, color: BRAND.amberDark }}>{uah(balance.balance)} ₴</div></div>
        </div>

        {/* Список історій */}
        <div style={{ background: BRAND.cream, borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${BRAND.line}`, fontFamily: SERIF, fontWeight: 700, fontSize: '1.15rem', color: BRAND.ink }}>
            Мої історії ({stories.length})
          </div>

          {stories.length === 0 ? (
            <div style={{ padding: '2rem 1.5rem', color: BRAND.muted, textAlign: 'center' }}>
              Поки що до вашого профілю не прив&apos;язано жодної історії.
            </div>
          ) : (
            <div>
              {stories.map((s) => (
                <div key={s.content_id} style={{ borderTop: `1px solid ${BRAND.line}`, padding: '0.9rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ color: BRAND.ink, fontWeight: 700, fontSize: '1rem', lineHeight: 1.35, minWidth: 0, flex: '1 1 200px' }}>
                      {s.title}
                      {s.is_free && (
                        <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#ef9f27', background: 'rgba(239,159,39,0.18)', border: '1px solid rgba(239,159,39,0.5)', padding: '2px 8px', borderRadius: 999, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          безкоштовна
                        </span>
                      )}
                    </div>
                    <span style={{
                      flex: 'none', fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(143,163,196,0.15)', border: '1px solid rgba(143,163,196,0.35)', color: '#dbe4f0', fontWeight: 700,
                      whiteSpace: 'nowrap', lineHeight: 1.5,
                    }}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap', marginTop: 8, fontSize: '0.88rem', color: '#8fa3c4' }}>
                    <span>Перегляди: <strong style={{ color: BRAND.ink }}>{s.views_count}</strong></span>
                    <span>Прочитань: <strong style={{ color: BRAND.ink }}>{s.reads_total}</strong></span>
                    <span>Дочитування: <strong style={{ color: BRAND.ink }}>{s.avg_read_percentage}%</strong></span>
                  </div>
                  <a
                    href={`/author/series/${s.content_id}`}
                    style={{
                      display: 'inline-block', marginTop: 10, fontSize: '0.85rem', fontWeight: 700,
                      color: BRAND.amber, textDecoration: 'none',
                      border: '1px solid rgba(239,159,39,0.45)', borderRadius: 8, padding: '7px 13px',
                    }}
                  >
                    Супровідні тексти →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <AuthorRequisites initial={requisites} />

        <AuthorContracts contracts={contracts} />

        <AuthorSurvey initial={feedback} />

        <div style={{ marginTop: '1.5rem' }}>
          <NarrationOrderForm />
        </div>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', marginTop: '1rem', lineHeight: 1.5 }}>
          Нарахування з&apos;являються після оплат читачів за ваші історії. Виплати —
          за умовами угоди автора. Питання: <a href="/contact" style={{ color: BRAND.amber }}>напишіть редакції</a>.
        </p>
      </div>
    </main>
  )
}
