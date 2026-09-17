import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import NarrationOrderForm from '@/app/components/NarrationOrderForm'
import EditDraftForm from '@/app/components/EditDraftForm'
import AuthorContracts, { type ContractRow } from '@/app/components/AuthorContracts'
import AuthorRequisites, { type Requisites } from '@/app/components/AuthorRequisites'
import AuthorRevisions from '@/app/components/AuthorRevisions'
import AuthorSurvey, { type Feedback } from '@/app/components/AuthorSurvey'
import AuthorNewsletter from '@/app/components/AuthorNewsletter'
import AuthorMessageForm from '@/app/components/AuthorMessageForm'
import ContestCountdown from '@/app/components/ContestCountdown'
import ContestIntent from '@/app/components/ContestIntent'
import AuthorCoverUpload from '@/app/components/AuthorCoverUpload'
import AuthorProfileEditor from '@/app/components/AuthorProfileEditor'
import { dbQuery } from '@/lib/db'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import PublishWorkButton from '@/app/components/PublishWorkButton'
import { getAuthorVotes, getQueueWithTrend } from '@/lib/voice-queue'
import AddWorkForm from '@/app/components/AddWorkForm'
import WorksFilter from '@/app/components/WorksFilter'
import DeleteDraftButton from '@/app/components/DeleteDraftButton'
import ShareWorkTemplate from '@/app/components/ShareWorkTemplate'
import RequestUnpublishButton from '@/app/components/RequestUnpublishButton'

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
  birth_date?: string | null
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
  hide_from_directory?: boolean | null
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

export default async function AuthorDashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/author/dashboard')
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

  // Голоси читачів за озвучення кожного твору.
  //
  // Автору це потрібніше, ніж будь-кому: черга на /cherga показує спільний
  // список усіх авторів, і щоб побачити свої твори, він мусив шукати себе
  // серед інших. А саме він розповідатиме читачам «проголосуйте за мене».
  //
  // Окремим запитом через dbQuery, а не .in() зі списком id: у Богдана 138
  // творів, і довгий IN() у проєкті вже підводив (див. ways-of-working).
  // ВСЯ ЧЕРГА ПРЯМО В КАБІНЕТІ (17.09.2026).
  // Доти кабінет мав лише посилання «Подивитися чергу →», і автор не бачив
  // ані того, хто попереду, ані наскільки він відстав. Побачити суперника —
  // єдине, що перетворює чергу з оголошення на змагання.
  // Двадцять, а не п'ять: автор має знайти в списку СЕБЕ, інакше таблиця
  // показує чужі перемоги й нічого більше. Коли черга переросте двадцятку,
  // сюди доведеться додати рядок власного твору поза видимою частиною.
  const queueTop = await getQueueWithTrend(20)

  // Рейтинг АВТОРІВ — окремо від черги творів. Черга показує лише те, за що
  // вже голосували; тут є всі, зокрема з нулем, і автор бачить своє місце
  // серед усіх, а не лише переможців.
  const authorVotes = await getAuthorVotes(100)

  const votesById = new Map<string, number>()

  // Ім'я, під яким твори автора лежать у content.author_name — саме за ним
  // порівнюємо рядки черги, щоб підсвітити його власний твір.
  const myName = (profile.pen_name?.trim() || profile.display_name || '').trim()
  try {
    const v = await dbQuery(
      `select v.content_id::text as id, count(*)::int as votes
         from voice_votes v
         join content c on c.id = v.content_id
        where c.author_id = $1
        group by v.content_id`,
      [user.id],
    )
    for (const row of v.rows as { id: string; votes: number }[]) {
      votesById.set(row.id, row.votes)
    }
  } catch {
    // Голоси — не головне в кабінеті: якщо запит упав, показуємо решту.
  }

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

  // ТРЕТІЙ РЕЙТИНГ — ЗА ДОЧИТУВАННЯМИ (17.09.2026).
  //
  // Два попередні рахують ГОЛОСИ за озвучення: це те, чого читач хоче, а не
  // те, що він прочитав. Дочитування — інша величина й інша заслуга: 70%
  // тексту, доведені до кінця. Тому окремий блок, а не колонка в наявному.
  //
  // Дані вже є в author_month_stats (30 днів) — тими самими, що на /avtory.
  // Бракує лише імен: у таблиці лежить author_id.
  const topReadIds = ranked.slice(0, 12).map(r => r.author_id)
  const { data: topReadProfiles } = topReadIds.length
    ? await admin
        .from('author_profiles')
        .select('user_id, display_name, pen_name, hide_from_directory')
        .in('user_id', topReadIds) as {
          data: { user_id: string; display_name: string | null; pen_name: string | null; hide_from_directory: boolean | null }[] | null
        }
    : { data: [] }

  const readNameById = new Map(
    (topReadProfiles ?? []).map(p => [p.user_id, (p.pen_name?.trim() || p.display_name || 'Автор').trim()]),
  )

  // Псевдонім засновника з рейтингів прибрано — як і в голосуванні.
  const readBoard = ranked
    .filter(r => readNameById.has(r.author_id))
    .filter(r => (readNameById.get(r.author_id) ?? '') !== 'Назар Колодій')
    .slice(0, 10)
    .map(r => ({
      name: readNameById.get(r.author_id) ?? 'Автор',
      reads: r.reads_completed,
      depth: r.avg_percentage,
      isMe: r.author_id === user.id,
    }))

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
    birth_date: profile.birth_date ?? null,
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
              (select count(*) from contract_works w where w.contract_id = c.id)::int as works_count,
              -- Скільки творів чекають підтвердження. Підтвердження — це згода
              -- автора на розміщення й озвучення, тобто юридично значуща дія,
              -- а не перегляд списку. Станом на 09.09.2026 її не зробив ЖОДЕН
              -- автор: 508 творів у договорах, підтверджено 0 (крім власних
              -- творів засновника). Причина не в небажанні — кнопка звалася
              -- «Перелік творів» і виглядала як довідка, а лічильник стояв уже
              -- всередині сторінки, куди ніхто не заходив.
              (select count(*) from contract_works w
                where w.contract_id = c.id and w.confirmed_at is null)::int as pending_count
         from author_contracts c
        where c.author_id = $1
        order by c.created_at desc`,
      [user.id],
    )
    contracts = cr.rows as ContractRow[]
  } catch {
    contracts = []
  }

  const totalCompleted = stories.reduce((s, x) => s + (x.reads_completed || 0), 0)
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

  // Скільки творів чекають підтвердження і в якому договорі. Договір зазвичай
  // один; якщо їх кілька, ведемо в перший, де є непідтверджені.
  const pendingWorks = contracts.reduce((n, c) => n + (c.pending_count ?? 0), 0)
  const pendingContractId = contracts.find(c => (c.pending_count ?? 0) > 0)?.id ?? null

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

        {/* ТЕСТОВИЙ РЕЖИМ — НАЙПЕРШИЙ БЛОК КАБІНЕТУ (17.09.2026).

            Кабінет показує баланс, «нараховано» і «до виплати». Автор бачить
            суму, не отримує грошей і робить єдиний можливий висновок — що його
            обманюють. Причина в тому, що передплата ще не продається, і сказати
            це мусимо ми першими, до того як про це спитають.

            Дата 30.11.2026 — та сама, що й старт передплати й озвучення.
            Міняється разом з ними, у трьох місцях одночасно. */}
        <div style={{
          marginBottom: '1.5rem', padding: '0.9rem 1.2rem', borderRadius: 12,
          background: 'rgba(239,159,39,0.12)', border: '1px solid rgba(239,159,39,0.45)',
        }}>
          <div style={{ color: '#FAC775', fontWeight: 700, marginBottom: 6 }}>
            Платформа в тестовому режимі
          </div>
          <div style={{ color: '#e8eef7', lineHeight: 1.7, fontSize: '0.93rem' }}>
            Орієнтовна дата запуску — 30 листопада 2026 року. До того передплата
            не продається, тож виплат авторам поки немає: нарахування в кабінеті
            ви бачите, але це механіка, а не гроші. Перші виплати — не раніше
            2027 року: спершу має початися продаж передплати, накопичитися
            прочитання й пройти розрахунковий період. Усе інше — публікація
            творів, конкурси, черга на озвучення — працює по-справжньому.
          </div>
        </div>

        {/* Заголовок сторінки */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: '2.1rem', color: 'white', margin: 0 }}>Кабінет автора</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0.35rem 0 0' }}>{profile.display_name}</p>
        </div>

        {/* Редакційні правки конкурсних серій. Стоїть найвище з плашок:
            у неї єдиної є строк, після якого мовчання означає згоду. */}
        <AuthorRevisions />

        {/* Плашка про непідтверджені твори.

            Підтвердження стоїть на сторінці, куди веде одна кнопка в блоці
            договорів нижче. Лічильник «Підтверджено 0 із 62» був УСЕРЕДИНІ тієї
            сторінки, тобто його бачив лише той, хто вже дійшов. Тому виносимо
            саму суть нагору: скільки чекає, що це означає і куди тиснути. */}
        {pendingWorks > 0 && pendingContractId && (
          <div style={{
            marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 12,
            background: 'rgba(239,159,39,0.10)', border: '1px solid rgba(239,159,39,0.45)',
          }}>
            <div style={{ color: '#FAC775', fontWeight: 700, marginBottom: 6 }}>
              Чекають вашого підтвердження: {pendingWorks}
            </div>
            <div style={{ color: '#e8eef7', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 12 }}>
              Підтвердження твору — це ваша згода на його розміщення та озвучення
              на умовах договору. Поки твір не підтверджений, ми не маємо
              письмової підстави його публікувати. Це займе кілька хвилин:
              перегляньте перелік і натисніть «Підтвердити».
            </div>
            <a
              href={`/author/dashboard/works?contract=${pendingContractId}`}
              style={{
                display: 'inline-block', padding: '0.6rem 1.1rem', borderRadius: 8,
                background: '#ef9f27', color: '#0a1628', fontWeight: 700,
                textDecoration: 'none', fontSize: '0.95rem',
              }}
            >
              Переглянути й підтвердити
            </a>
          </div>
        )}

        {/* Додати свою історію. Стоїть перед чергою на озвучення: автори
            питали, чи можна залити старі твори, і до 09.09.2026 зробити це
            самостійно було неможливо. */}
        <AddWorkForm />

        {/* Черга на озвучення.

            Автори мають знати, що озвучення тепер не рішення редакції, а вибір
            читачів: вони витрачають зароблені бали, щоб просунути твір уперед.
            Це водночас відповідь на питання «коли озвучите мене» — раніше на
            нього не було чесної відповіді, бо коштів на озвучення немає. */}
        <div style={{
          marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 12,
          background: 'rgba(143,163,196,0.10)', border: '1px solid rgba(143,163,196,0.35)',
        }}>
          <div style={{ color: '#f5f0e8', fontWeight: 700, marginBottom: 6 }}>
            Що озвучимо першим — вирішують читачі
          </div>
          <div style={{ color: '#e8eef7', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: 12 }}>
            Ми не вибираємо самі, кого озвучити. На платформі є черга: читач витрачає
            бали, зароблені читанням, і віддає голос за твір, який хоче почути. Коли
            з&apos;являться кошти на запис, ми почнемо з того, що набрало найбільше
            голосів.
            <br /><br />
            Тому просування ваших історій — це не лише читачі, а й місце в черзі на
            озвучення. Розкажіть про свої твори там, де вас читають: кожен новий читач
            може віддати голос саме за вас.
          </div>
          {/* ДВА РЕЙТИНГИ ГОЛОСІВ, смугами (17.09.2026).
              Списком цифра голосів читалася разом із кількістю творів автора
              і плуталася з нею; смуга показує різницю без пояснень.
              Третій рейтинг — за дочитуваннями — нижче, зеленим: це інша
              величина, і однаковий колір злив би їх в одну таблицю. */}
          {(() => {
            const Bar = ({ pos, label, sub, votes, recent, mine, max }: {
              pos: number; label: string; sub?: string
              votes: number; recent: number; mine: boolean; max: number
            }) => {
              const w = votes > 0 ? Math.max(6, Math.round((votes / max) * 100)) : 0
              const word = votes === 1
                ? 'голос'
                : votes % 10 >= 2 && votes % 10 <= 4 && (votes < 10 || votes > 20)
                  ? 'голоси'
                  : 'голосів'
              return (
                <div style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.86rem', marginBottom: 3 }}>
                    <span style={{ color: mine ? '#FAC775' : '#e8eef7', fontWeight: mine ? 700 : 400 }}>
                      {pos}. {label}
                      {sub && <span style={{ color: '#9fb0c6' }}>{' · '}{sub}</span>}
                    </span>
                    <span style={{ color: '#FAC775', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {votes} {word}
                      {recent > 0 && <span style={{ color: '#97C459' }}>{' +'}{recent}</span>}
                    </span>
                  </div>
                  <div style={{
                    height: 10, borderRadius: 5, overflow: 'hidden',
                    background: 'rgba(143,163,196,0.16)',
                    border: mine ? '1px solid rgba(239,159,39,0.55)' : '1px solid transparent',
                  }}>
                    <div style={{ width: `${w}%`, height: '100%', background: mine ? '#FAC775' : '#ef9f27', borderRadius: 5 }} />
                  </div>
                </div>
              )
            }

            const isMine = (n: string | null) =>
              (n ?? '').trim().toLowerCase() === myName.trim().toLowerCase()

            const works = queueTop.slice(0, 10)
            const maxWork = Math.max(1, ...works.map(w => w.votes))
            const authors = authorVotes.slice(0, 10)
            const maxAuthor = Math.max(1, ...authors.map(a => a.votes))

            return (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ color: '#f5f0e8', fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>
                    Рейтинг творів
                  </div>
                  <div style={{ color: '#9fb0c6', fontSize: '0.82rem', marginBottom: 10 }}>
                    Скільки читачів проголосували за озвучення кожного тексту. Зеленим — за тиждень.
                  </div>
                  {works.length === 0 ? (
                    <div style={{ color: '#9fb0c6', fontSize: '0.86rem' }}>
                      За жоден твір поки не проголосували.
                    </div>
                  ) : works.map((w, i) => (
                    <Bar key={w.id} pos={i + 1} label={w.title}
                      sub={isMine(w.author_name) ? 'ваш твір' : (w.author_name ?? '')}
                      votes={w.votes} recent={w.recent} mine={isMine(w.author_name)} max={maxWork} />
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#f5f0e8', fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>
                    Рейтинг авторів
                  </div>
                  <div style={{ color: '#9fb0c6', fontSize: '0.82rem', marginBottom: 10 }}>
                    Сума голосів за всі твори автора.
                  </div>
                  {authors.map((a, i) => (
                    <Bar key={a.author_name} pos={i + 1}
                      label={isMine(a.author_name) ? 'Ви' : a.author_name}
                      votes={a.votes} recent={a.recent} mine={isMine(a.author_name)} max={maxAuthor} />
                  ))}
                </div>
              </>
            )
          })()}

          {readBoard.length > 0 && (() => {
            const maxRead = Math.max(1, ...readBoard.map(r => r.reads))
            return (
              <div style={{ marginBottom: 14, paddingTop: 12, borderTop: '1px solid rgba(143,163,196,0.22)' }}>
                <div style={{ color: '#f5f0e8', fontWeight: 700, fontSize: '0.92rem', marginBottom: 2 }}>
                  Рейтинг за дочитуваннями
                </div>
                <div style={{ color: '#9fb0c6', fontSize: '0.82rem', marginBottom: 10 }}>
                  Скільки читачів довели текст щонайменше до 70% за останні 30 днів. Це інша величина, ніж голоси: не «хочу почути», а «прочитав».
                </div>
                {readBoard.map((r, i) => (
                  <div key={r.name} style={{ marginBottom: 7 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: '0.86rem', marginBottom: 3 }}>
                      <span style={{ color: r.isMe ? '#FAC775' : '#e8eef7', fontWeight: r.isMe ? 700 : 400 }}>
                        {i + 1}. {r.isMe ? 'Ви' : r.name}
                        <span style={{ color: '#9fb0c6' }}>{' · '}глибина {r.depth}%</span>
                      </span>
                      <span style={{ color: '#FAC775', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {r.reads} дочитувань
                      </span>
                    </div>
                    <div style={{
                      height: 10, borderRadius: 5, overflow: 'hidden',
                      background: 'rgba(143,163,196,0.16)',
                      border: r.isMe ? '1px solid rgba(239,159,39,0.55)' : '1px solid transparent',
                    }}>
                      <div style={{
                        width: `${Math.max(6, Math.round((r.reads / maxRead) * 100))}%`,
                        height: '100%', background: r.isMe ? '#FAC775' : '#97C459', borderRadius: 5,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

          <a
            href="/cherga"
            style={{
              display: 'inline-block', padding: '0.55rem 1rem', borderRadius: 8,
              background: 'transparent', color: '#FAC775', fontWeight: 700,
              textDecoration: 'none', fontSize: '0.92rem',
              border: '1px solid rgba(239,159,39,0.5)',
            }}
          >
            Уся черга й голосування →
          </a>
        </div>

        <AuthorProfileEditor
          initialAvatar={profile.avatar_url ?? null}
          initialBio={profile.bio ?? null}
          initialPosition={profile.avatar_position ?? null}
          hasSource={Boolean(profile.avatar_source_url)}
          displayName={profile.pen_name?.trim() || profile.display_name || 'Автор'}
          initialHidden={profile.hide_from_directory ?? false}
        />

        {/* Конкурси — усі активні, з дедлайнами. Компонент рахує дні в браузері. */}
        <ContestCountdown />

        {/* Намір узяти участь. Стоїть ОДРАЗУ під анонсами: автор щойно
            побачив конкурси й строки — саме тут відповідь має сенс. */}
        <ContestIntent />

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
          {/* Підписи виправлено 16.09.2026. Було навпаки: reads_total стояв під
              словом «прочитань», хоча це ВІДКРИТТЯ. За п. 1.5 договору
              прочитанням вважається 70% обсягу плюс час — у базі це
              reads_completed. Автор бачив 627 «прочитань» там, де за договором
              їх 141, і саме за цим числом він рахуватиме свою винагороду. */}
          <div style={card}><div style={statNum}>{totalCompleted}</div><div style={statLabel}>прочитань (п. 1.5)</div></div>
          <div style={card}><div style={statNum}>{totalReads}</div><div style={statLabel}>відкриттів</div></div>
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

        {/* РЯДОК ПІД БАЛАНСОМ (17.09.2026).

            Плашка вгорі каже, що виплат не буде до 2027 року, а тут автор
            бачить конкретну суму «До виплати». Дві сторінки прокрутки між
            ними — і два твердження виглядають як суперечність: або він не
            помітив плашки, або вирішив, що гроші вже мали прийти.
            Те саме речення поруч із самим числом знімає питання. */}
        <p style={{ fontSize: '0.85rem', color: '#b9c6db', lineHeight: 1.6, margin: '-0.9rem 0 1.5rem' }}>
          Виплати почнуться не раніше 2027 року — після старту передплати. Поки
          що це нарахування за механікою договору, а не готові до перерахунку гроші.
        </p>

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
              {/* Пошук і фільтр. Показуємо лише коли творів справді багато:
                  при трьох історіях поле пошуку — зайвий елемент. */}
              {stories.length >= 8 && <WorksFilter total={stories.length} />}

              {groups.map((g) => (
                <div key={g.key} data-group={g.key}>
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
                <div
                  key={s.content_id}
                  data-work={s.title}
                  data-status={s.status}
                  style={{ borderTop: `1px solid ${BRAND.line}`, padding: '0.9rem 1.5rem' }}
                >
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
                    {/* «Перегляди» прибрано 09.09.2026.

                        Показник рахувався клієнтським трекером (`/api/analytics/track`,
                        подія open/read_start, унікальні сесії) і працював уривками: на
                        весь сайт максимум 30 переглядів, тоді як на одній серії 119
                        прочитань. Поруч із «Прочитаннями», за якими рахується
                        винагорода, це виглядало як помилка в грошах. Замість нього —
                        «Дочитали», яке в базі вже є (reads_completed) і яке автору
                        справді цікаве. Сам лічильник не чіпали: він лишається в базі
                        й в аналітиці. */}
                    <span>Прочитань: <strong style={{ color: BRAND.ink }}>{s.reads_completed}</strong></span>
                    <span>Відкриттів: <strong style={{ color: BRAND.ink }}>{s.reads_total}</strong></span>
                    <span>Дочитування: <strong style={{ color: BRAND.ink }}>{s.avg_read_percentage}%</strong></span>
                    {/* Голоси показуємо лише там, де вони є: нуль біля кожного
                        твору читався б як докір, а не як інформація. */}
                    {(votesById.get(s.content_id) ?? 0) > 0 && (
                      <span>
                        Голосів за озвучення:{' '}
                        <strong style={{ color: BRAND.ink }}>{votesById.get(s.content_id)}</strong>
                      </span>
                    )}
                  </div>
                  <AuthorCoverUpload
                    contentId={s.content_id}
                    initialCover={coverById.get(s.content_id) ?? null}
                  />

                  {/* Подивитися очима читача. Для чернетки це єдиний спосіб
                      перевірити верстку до публікації: сторінка твору показує
                      неопублікований текст авторові й нікому більше. */}
                  {s.slug && (
                    <a
                      href={`/stories/${s.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block', marginTop: 10, marginRight: 8,
                        fontSize: '0.85rem', fontWeight: 700, color: BRAND.amber,
                        textDecoration: 'none', border: '1px solid rgba(239,159,39,0.45)',
                        borderRadius: 8, padding: '7px 13px',
                      }}
                    >
                      {s.status === 'draft' ? 'Переглянути чернетку' : 'Відкрити на сайті'}
                    </a>
                  )}

                  {/* Готовий допис для соцмереж — тільки для опублікованих:
                      посилання на чернетку читач не відкриє, і поділ ним
                      обернувся б порожньою сторінкою. */}
                  {s.status === 'published' && s.slug && (
                    <ShareWorkTemplate
                      title={s.title}
                      slug={s.slug}
                      votes={votesById.get(s.content_id) ?? 0}
                    />
                  )}

                  {['draft', 'approved', 'published'].includes(s.status) && (
                    <EditDraftForm contentId={s.content_id} />
                  )}

                  {s.status === 'draft' && (
                    <PublishWorkButton contentId={s.content_id} title={s.title} />
                  )}

                  {/* Видалення — лише для чернеток. Опублікований твір має
                      прочитання, з яких рахується винагорода, і посилання
                      ззовні: зняти його з публікації — розмова з редакцією. */}
                  {s.status === 'draft' && (
                    <DeleteDraftButton contentId={s.content_id} title={s.title} />
                  )}

                  {/* Опублікований твір автор зняти не може — але й шукати
                      пошту редакції не мусить: кнопка надсилає звернення
                      через /api/author/message. */}
                  {s.status === 'published' && (
                    <RequestUnpublishButton
                      contentId={s.content_id}
                      title={s.title}
                      slug={s.slug}
                      type={s.type}
                    />
                  )}

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
