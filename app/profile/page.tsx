import { redirect } from 'next/navigation'
import MyLibrary from '@/app/components/MyLibrary'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'
import LogoutButton from './LogoutButton'
import { dbQuery } from '@/lib/db'
import { getBalance } from '@/lib/points'
import { levelFromReads } from '@/lib/levels'
import { countInvited, inviteLink, REFERRAL_POINTS } from '@/lib/referral'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const hasSubscription = profile?.subscription_until && new Date(profile.subscription_until) > new Date()

  // Бали й прочитані серії. Обидва запити не критичні: якщо не вдалися,
  // показуємо нулі, а не ламаємо сторінку.
  const balance = await getBalance(user.id)

  let totalReads = 0
  try {
    const r = await dbQuery(
      `select count(*)::int as n from user_episode_reads where user_id = $1`,
      [user.id],
    )
    totalReads = (r.rows[0] as { n: number } | undefined)?.n ?? 0
  } catch {
    // лишаємо 0
  }
  const level = levelFromReads(totalReads)
  const invited = await countInvited(user.id)

  // Чи має ця людина кабінет автора. Раніше сюди потрапляли й автори — і не
  // мали звідси жодного шляху до своїх творів, бо кабінет живе за іншою
  // адресою. Тепер, якщо профіль автора є, показуємо перехід у кабінет.
  let isAuthor = false
  try {
    const res = await dbQuery(
      `select 1
         from author_profiles
        where user_id = $1::uuid
          and is_active
        limit 1`,
      [user.id],
    )
    isAuthor = res.rows.length > 0
  } catch {
    // Не змогли перевірити — просто не показуємо блок.
  }

  return (
    <main style={{
      minHeight: '100vh',
      padding: '2rem 1rem',
      background: 'linear-gradient(180deg, #0a1628 0%, #0f1f3a 100%)',
    }}>
      <div style={{
        maxWidth: '640px',
        margin: '0 auto',
        background: '#0D1B2A',
        border: '1px solid rgba(239,159,39,0.22)',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
      }}>
        <h1 style={{
          fontSize: '1.75rem',
          marginBottom: '1.5rem',
          color: '#FFF8EE',
          fontFamily: "'Comfortaa', sans-serif",
        }}>
          Мій профіль
        </h1>

        {/* Кабінет був набором цифр без жодного слова пояснення: читач бачив
            «Бали 0» і не знав ні за що вони, ні що з ними робити. Пояснення
            коротко, при кожному блоці — довгі тексти тут ніхто не читає. */}
        <p style={{
          fontSize: '0.95rem', color: '#C7BFB2', lineHeight: 1.7,
          margin: '0 0 2rem',
        }}>
          Тут зібрано все ваше на Балабонах: недочитане, збережене, автори,
          за якими ви стежите, і те, що ви вже прочитали.
        </p>

        {isAuthor && (
          <a
            href="/author/dashboard"
            style={{
              display: 'block',
              marginBottom: '1.75rem',
              padding: '1rem 1.15rem',
              background: 'rgba(239,159,39,0.10)',
              border: '1px solid rgba(239,159,39,0.55)',
              borderRadius: '10px',
              textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FAC775' }}>
              Кабінет автора →
            </div>
            <div style={{ fontSize: '0.92rem', color: '#C7BFB2', marginTop: '0.35rem', lineHeight: 1.5 }}>
              Ваші твори, статистика прочитань, договір і реквізити для виплат.
            </div>
          </a>
        )}

        {/* Збережене й недочитане — те, по що читач найчастіше сюди й заходить. */}
        <MyLibrary />

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Email
          </div>
          <div style={{ fontSize: '1rem', color: '#FFF8EE', fontWeight: 500 }}>
            {user.email}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Підписка
          </div>
          {hasSubscription ? (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(125,219,160,0.12)',
              borderRadius: '8px',
              color: '#7ddba0',
            }}>
              <strong>Активна:</strong> {profile.subscription_tier || 'базова'}
              <br />
              <span style={{ fontSize: '0.9rem' }}>
                до {new Date(profile.subscription_until).toLocaleDateString('uk-UA')}
              </span>
            </div>
          ) : (
            <div style={{
              padding: '0.75rem 1rem',
              background: 'rgba(239,159,39,0.12)',
              borderRadius: '8px',
              color: '#FAC775',
            }}>
              Немає активної підписки.{' '}
              <a href="/" style={{ color: '#FAC775', textDecoration: 'underline' }}>
                Обрати план
              </a>
            </div>
          )}
        </div>

        {/* Запрошення.

            До 09.09.2026 тут показувався сам код і більше нічого: `?ref=` ніде
            не приймався, зв'язок не зберігався, ніхто нічого не отримував.
            Тепер механіка є, тому показуємо готове посилання, а не код —
            людині не треба здогадуватися, що з вісьмома символами робити. */}
        {profile?.referral_code && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.35rem' }}>
              Запросити друзів
            </div>
            <div style={{
              padding: '0.6rem 0.8rem',
              background: 'rgba(255,248,238,0.07)',
              color: '#FFF8EE',
              border: '1px solid rgba(255,248,238,0.14)',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              wordBreak: 'break-all',
            }}>
              {inviteLink(profile.referral_code)}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginTop: '0.5rem', lineHeight: 1.7 }}>
              Надішліть це посилання тому, кому може сподобатися. Коли людина
              за ним зареєструється, вам нарахується {REFERRAL_POINTS.inviter} балів,
              а їй — {REFERRAL_POINTS.invited}. Посилання працює 90 днів після переходу:
              якщо друг відкриє його сьогодні, а зареєструється за тиждень,
              воно все одно спрацює.
              {invited > 0
                ? ` Уже прийшло за вашим посиланням: ${invited}.`
                : ' Поки за ним ніхто не прийшов.'}
            </div>
          </div>
        )}

        {/* Бали й рівень.

            Раніше тут стояла колонка `users.bonus_points`, у яку не пише ЖОДЕН
            роут: бали живуть у `point_events`, а рівень рахується з
            `user_episode_reads`. Читач із півсотнею балів бачив порожнє місце
            й робив висновок, що система не працює. Тепер обидва числа беремо
            з тих самих джерел, що й решта сайту. */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Бали
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFF8EE' }}>
            {balance}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginTop: '0.35rem', lineHeight: 1.6 }}>
            Нараховуємо за прочитану серію, за читання кілька днів поспіль,
            за відгук і за пройдене опитування.
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.25rem' }}>
            Рівень
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#FAC775' }}>
            {level.current.title}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginTop: '0.35rem' }}>
            Прочитано серій: {totalReads}
            {level.next && ` · до рівня «${level.next.title}» лишилося ${level.next.min - totalReads}`}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginTop: '0.35rem', lineHeight: 1.6 }}>
            Рахуємо різні серії, а не відкриття сторінки: перечитане вдруге
            не додає нічого. Рівні — «Початківець», «Читач», «Книгочій»,
            «Знавець Балабонів».
          </div>
        </div>

        {/* Що далі. Кабінет закінчувався кнопкою «Вийти» — людина не знала,
            куди з нього йти. */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#8CA0B8', marginBottom: '0.5rem' }}>
            Куди далі
          </div>
          <div style={{ fontSize: '0.92rem', color: '#C7BFB2', lineHeight: 1.8 }}>
            <a href="/stories" style={{ color: '#FAC775' }}>Усі історії</a>
            {' — каталог, зараз понад тисяча творів.'}
            <br />
            <a href="/top" style={{ color: '#FAC775' }}>Що читають</a>
            {' — з чого почати, якщо не знаєте, за що взятися.'}
            <br />
            <a href="/episodes" style={{ color: '#FAC775' }}>Серіали</a>
            {' — довгі історії, що виходять серіями.'}
            <br />
            <a href="/become-author" style={{ color: '#FAC775' }}>Стати автором</a>
            {' — якщо пишете самі.'}
          </div>
        </div>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <a
            href="/moi-avtory"
            style={{
              display: 'inline-block',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              background: 'rgba(239,159,39,0.12)',
              color: '#FAC775',
              textDecoration: 'none',
              fontWeight: 600,
              marginBottom: '1.25rem',
            }}
          >
            Мої автори →
          </a>
          <div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  )
}