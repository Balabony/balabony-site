import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import NarrationOrderForm from '@/app/components/NarrationOrderForm'
import AuthorContracts, { type ContractRow } from '@/app/components/AuthorContracts'
import AuthorRequisites, { type Requisites } from '@/app/components/AuthorRequisites'
import AuthorSurvey, { type Feedback } from '@/app/components/AuthorSurvey'
import AuthorNewsletter from '@/app/components/AuthorNewsletter'
import AuthorMessageForm from '@/app/components/AuthorMessageForm'
import ContestCountdown from '@/app/components/ContestCountdown'
import AuthorCoverUpload from '@/app/components/AuthorCoverUpload'
import AuthorProfileEditor from '@/app/components/AuthorProfileEditor'
import { dbQuery } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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
  bio?: string | null
  avatar_url?: string | null
  avatar_position?: number | null
  avatar_source_url?: string | null
  postal_code?: string | null
  np_branch?: string | null
  requisites_updated_at?: string | null
  newsletter_opt_out?: boolean | null
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
  type: string | null
  episode_number: number | null
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
  approved: 'Опубліковано',
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
  text: '#e8eef7',
  muted: '#b9c6db',
  line: 'rgba(143,163,196,0.22)',
}
const SERIF = 'Georgia, "Times New Roman", serif'

// Групування кабінету: спершу серіали (за номером серії), потім окремі історії
const GROUP_LABEL: Record<string, string> = {
  balabony: 'Серіал «Балабони»',
  tysha: 'Серіал «Тиша»',
  story: 'Окремі історії',
}
const GROUP_ORDER = ['balabony', 'tysha', 'story']

type StoryGroup = { key: string; label: string; items: StoryStat[] }

function groupStories(list: StoryStat[]): StoryGroup[] {
  const map = new Map<string, StoryStat[]>()
  for (const s of list) {
    const key = s.type || 'story'
    const arr = map.get(key)
    if (arr) arr.push(s)
    else map.set(key, [s])
  }

  const keys = Array.from(map.keys()).sort((a, b) => {
    const ia = GROUP_ORDER.indexOf(a)
    const ib = GROUP_ORDER.indexOf(b)
    const wa = ia < 0 ? 99 : ia
    const wb = ib < 0 ? 99 : ib
    return wa - wb || a.localeCompare(b, 'uk')
  })

  return keys.map((key) => ({
    key,
    label: GROUP_LABEL[key] || key,
    items: (map.get(key) || []).slice().sort((a, b) => {
      const na = a.episode_number
      const nb = b.episode_number
      if (na != null && nb != null) return na - nb
      if (na != null) return -1
      if (nb != null) return 1
      return (a.title || '').localeCompare(b.title || '', 'uk')
    }),
  }))
}

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

interface ContestLink {
  href:  string
  title: string
  text:  string
  main?: boolean
}

// Джерело — сторінка /konkursy. Якорі збігаються з id секцій на ній.
const CONTESTS: ContestLink[] = [
  {
    href:  '/konkursy',
    title: '«Це довга історія» — конкурс серіалів',
    text:  'Десять серій за десять тижнів. Головна нагорода — 20 000 ₴, багатоголосе озвучення та місяць у газеті «Життя». Заявки: 1–15 листопада 2026.',
    main:  true,
  },
  {
    href:  '/konkursy#rozghin',
    title: '«Розгін» — три серії за десять днів',
    text:  'Найкоротша дистанція. Перше місце — 5 000 ₴. Подання будь-коли, дедлайну немає.',
  },
  {
    href:  '/konkursy#odyn-den',
    title: '«Один день, який усе змінив»',
    text:  'Коротка проза до 1500 слів. Перше місце — 3 000 ₴, історії переможців виходять у газеті «Життя». Прийом: 1 листопада — 15 грудня 2026.',
  },
  {
    href:  '/konkursy#z-viterczem',
    title: '«З вітерцем» — гумористична історія',
    text:  'Смішна історія з життя до 1500 слів. Перше місце — 3 000 ₴, публікація в газеті «Життя». Прийом: 1 листопада — 15 грудня 2026.',
  },
]

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
    .eq('author_id', user.id) as { data: StoryStat[] | null }

  const stories = stats || []
  const groups = groupStories(stories)

  // Обкладинки тягнемо окремо: view author_story_stats зібрана під
  // статистику і колонки cover_url не має.
  const { data: coverRows } = await supabase
    .from('content')
    .select('id, cover_url')
    .eq('author_id', user.id) as { data: { id: string; cover_url: string | null }[] | null }

  const coverById = new Map<string, string | null>()
  for (const c of coverRows ?? []) coverById.set(c.id, c.cover_url)

  // Місце автора за останні 30 днів. Показуємо лише йому: публічно
  // висить тільки топ, бо побачити себе останнім — привід піти, а не
  // писати краще.
  const admin = getSupabaseAdmin()
  const { data: monthRows } = await admin
    .from('author_month_stats')
    .select('author_id, reads_completed, reads_total, avg_percentage') as {
      data: { author_id: string; reads_completed: number; reads_total: number; avg_percentage: number }[] | null
    }

  const ranked = (monthRows ?? [])
    .filter((r) => r.reads_completed > 0)
    .sort((a, b) => b.reads_completed - a.reads_completed)

  const myIndex = ranked.findIndex((r) => r.author_id === user.id)
  const mine = myIndex >= 0 ? ranked[myIndex] : null

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
  // На сайті твір видно за статусом approved або published — публічні сторінки
  // беруть обидва (.in('status', ['approved','published'])). Рахуємо так само,
  // інакше автор бачить нуль при живому архіві.
  const LIVE = ['approved', 'published']
  const published = stories.filter(s => LIVE.includes(s.status)).length

  // Скільки читачів стежить за автором. Рахує service role: RLS показує
  // людині лише її власні підписки, і звичайний клієнт повернув би нуль.
  const { count: followersCount } = await admin
    .from('author_follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('author_user_id', user.id)
  const followers = followersCount ?? 0

  const card: React.CSSProperties = {
    background: BRAND.cream, borderRadius: 14, padding: '1.25rem 1.5rem',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)', flex: '1 1 160px',
  }
  const statNum: React.CSSProperties = { fontSize: '2rem', fontWeight: 700, color: BRAND.ink, lineHeight: 1 }
  const statLabel: React.CSSProperties = { fontSize: '0.88rem', color: '#b9c6db', fontWeight: 600, marginTop: 6 }

  return (
    <main style={{ padding: '2rem 1rem', background: BRAND.navy }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <BrandBar />

        {/* Заголовок сторінки */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.1rem', color: 'white', margin: 0 }}>Кабінет автора</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.35rem 0 0' }}>{profile.display_name}</p>
        </div>

        <AuthorProfileEditor
          initialAvatar={profile.avatar_url ?? null}
          initialBio={profile.bio ?? null}
          initialPosition={profile.avatar_position ?? null}
          hasSource={Boolean(profile.avatar_source_url)}
          displayName={profile.pen_name?.trim() || profile.display_name || 'Автор'}
        />

        {/* Конкурси. Усі активні конкурси з лінками на свої розділи сторінки
            /konkursy — автор бачить повний вибір, а не лише головний. */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '0.85rem', color: BRAND.amber, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.7rem',
          }}>
            Конкурси для авторів
          </div>

          {CONTESTS.map((c, i) => (
            <a
              key={c.href}
              href={c.href}
              style={{
                display: 'block', textDecoration: 'none',
                background: BRAND.navyCard, borderRadius: 14,
                padding: '1rem 1.4rem',
                marginBottom: i === CONTESTS.length - 1 ? 0 : '0.7rem',
                border: c.main
                  ? `2px solid ${BRAND.amber}`
                  : '1px solid rgba(239,159,39,0.28)',
              }}
            >
              <div style={{
                fontFamily: SERIF, fontSize: c.main ? '1.3rem' : '1.12rem',
                fontWeight: 700, color: 'white',
              }}>
                {c.title} &rarr;
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.82)', fontSize: '0.93rem',
                marginTop: 5, lineHeight: 1.55,
              }}>
                {c.text}
              </div>
            </a>
          ))}
        </div>

        {/* Публікація в газеті — це просування, а не другий гонорар.
            Автор має знати це до того, як подасться на конкурс. */}
        <div style={{
          background: 'rgba(239,159,39,0.07)',
          border: '1px solid rgba(239,159,39,0.22)',
          borderRadius: 12, padding: '0.95rem 1.3rem', marginBottom: '1.5rem',
          color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: 1.6,
        }}>
          <strong style={{ color: BRAND.amber, fontWeight: 700 }}>Про публікацію в газеті.</strong>{' '}
          Історії переможців друкуються в газеті «Життя» разом із QR-кодом, що веде
          на вашу сторінку тут, на Балабонах. Це просування, а не другий гонорар:
          газета за публікацію нічого не виплачує, і саме тому вона й безкоштовна для вас.
          Газета виходить щотижня і поширюється по всій Україні через Укрпошту.
          Читач, який відсканував код, приходить на платформу й читає далі — а прочитання
          вже нараховуються вам за вашою ставкою.
        </div>

        {/* Формат і читач. Автори питали, що саме писати — тепер відповідь
            стоїть у кабінеті, а не тільки в листах. */}
        <div style={{
          background: BRAND.navyCard, borderRadius: 14,
          padding: '1.1rem 1.5rem', marginBottom: '1.5rem',
          border: '1px solid rgba(239,159,39,0.25)',
          color: 'rgba(255,255,255,0.85)', fontSize: '0.93rem', lineHeight: 1.65,
        }}>
          <div style={{
            fontSize: '0.85rem', color: BRAND.amber, fontWeight: 700,
            letterSpacing: 1, textTransform: 'uppercase', marginBottom: '0.6rem',
          }}>
            Що ми шукаємо
          </div>

          <p style={{ margin: '0 0 0.7rem' }}>
            <strong style={{ color: 'white' }}>Формат.</strong> Платформа будується навколо
            серіалів. Одна серія — приблизно 1500 слів: саме такий обсяг читається за раз,
            без відкладання «на потім». Окремі історії теж потрібні, але серіал дає те, чого
            окрема історія дати не може — читач повертається наступного тижня, і його
            повернення нараховується вам.
          </p>

          <p style={{ margin: '0 0 0.7rem' }}>
            <strong style={{ color: 'white' }}>Читач.</strong> Переважно жінка. Найкраще
            заходять історії, де є героїня, у якій читачка впізнає себе: та, що зараз щось
            вирішує у власному житті — робота, стосунки, діти, гроші, вибір між своїм і чужим.
            Не обов&apos;язково молода і не обов&apos;язково міська. Важливо, щоб вона була жива
            і щоб її рішення щось коштувало.
          </p>

          <p style={{ margin: 0 }}>
            <strong style={{ color: 'white' }}>Гачок.</strong> У серіалі кожна серія має
            закінчуватися так, щоб хотілося наступної. Ми міряємо не перегляди, а доходимість:
            скільки людей дочитали до кінця і скільки повернулися. За цим же визначаємо
            переможців конкурсів.
          </p>
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
          <div style={card}><div style={statNum}>{followers}</div><div style={statLabel}>читачів стежать</div></div>
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
          <div style={{ padding: '1rem 1.5rem', borderBottom: `1px solid ${BRAND.line}`, fontFamily: SERIF, fontWeight: 700, fontSize: '1.2rem', color: BRAND.amber }}>
            Мої історії ({stories.length})
          </div>

          {stories.length === 0 ? (
            <div style={{ padding: '2rem 1.5rem', color: BRAND.muted, textAlign: 'center' }}>
              Поки що до вашого профілю не прив&apos;язано жодної історії.
            </div>
          ) : (
            <div>
              {groups.map((g) => (
                <div key={g.key}>
                  <div style={{
                    borderTop: `1px solid ${BRAND.line}`,
                    background: 'rgba(143,163,196,0.08)',
                    padding: '0.6rem 1.5rem',
                    fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.4px',
                    textTransform: 'uppercase', color: BRAND.muted,
                  }}>
                    {g.label} · {g.items.length}
                  </div>

              {g.items.map((s) => (
                <div key={s.content_id} style={{ borderTop: `1px solid ${BRAND.line}`, padding: '0.9rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div style={{ color: BRAND.ink, fontWeight: 700, fontSize: '1rem', lineHeight: 1.35, minWidth: 0, flex: '1 1 200px' }}>
                      {s.episode_number != null && (
                        <span style={{ color: BRAND.muted, fontWeight: 700, marginRight: 8 }}>
                          №{s.episode_number}
                        </span>
                      )}
                      {s.title}
                      {s.is_free && (
                        <span style={{ marginLeft: 8, fontSize: '0.7rem', color: '#ef9f27', background: 'rgba(239,159,39,0.18)', border: '1px solid rgba(239,159,39,0.5)', padding: '2px 8px', borderRadius: 999, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          безкоштовна
                        </span>
                      )}
                    </div>
                    <span style={{
                      flex: 'none', fontSize: '0.72rem', padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(143,163,196,0.15)', border: '1px solid rgba(143,163,196,0.35)', color: '#e8eef7', fontWeight: 700,
                      whiteSpace: 'nowrap', lineHeight: 1.5,
                    }}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap', marginTop: 8, fontSize: '0.88rem', color: '#b9c6db' }}>
                    <span>Перегляди: <strong style={{ color: BRAND.ink }}>{s.views_count}</strong></span>
                    <span>Прочитань: <strong style={{ color: BRAND.ink }}>{s.reads_total}</strong></span>
                    <span>Дочитування: <strong style={{ color: BRAND.ink }}>{s.avg_read_percentage}%</strong></span>
                  </div>
                  <AuthorCoverUpload
                    contentId={s.content_id}
                    initialCover={coverById.get(s.content_id) ?? null}
                  />

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
              ))}
            </div>
          )}
        </div>


        {mine && (
          <div style={{
            background: BRAND.cream,
            border: `1px solid ${BRAND.line}`,
            borderRadius: 14,
            padding: '1.1rem 1.5rem',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.4px',
              textTransform: 'uppercase', color: BRAND.muted, marginBottom: 8,
            }}>
              Ваші показники за 30 днів
            </div>

            <div style={{ display: 'flex', gap: '1.6rem', flexWrap: 'wrap', alignItems: 'baseline' }}>
              <span style={{ color: BRAND.text, fontSize: '0.95rem' }}>
                Дочитувань: <strong style={{ color: BRAND.ink }}>{mine.reads_completed}</strong>
              </span>
              <span style={{ color: BRAND.text, fontSize: '0.95rem' }}>
                Глибина читання: <strong style={{ color: BRAND.ink }}>{mine.avg_percentage}%</strong>
              </span>
              <span style={{ color: BRAND.amber, fontSize: '0.95rem', fontWeight: 700 }}>
                {myIndex + 1} місце з {ranked.length}
              </span>
            </div>

            <p style={{ color: BRAND.muted, fontSize: '0.82rem', lineHeight: 1.6, margin: '10px 0 0' }}>
              Рахуються прочитання, доведені щонайменше до 70% тексту. Публічно на
              сторінці авторів видно лише перші місця — ваше місце бачите тільки ви.
            </p>
          </div>
        )}

        <ContestCountdown />

        <AuthorRequisites initial={requisites} />

        <AuthorContracts contracts={contracts} diiaEnabled={Boolean((process.env.SIGN_SERVICE_URL ?? '').trim())} />

        <AuthorSurvey initial={feedback} />

      <AuthorNewsletter initialOptOut={Boolean(profile.newsletter_opt_out)} />

        <AuthorMessageForm />

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
