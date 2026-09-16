// FILE: app/admin/shorts/page.tsx
//
// Матеріал для роликів — тексти шортів, які вже згенеровані.
//
// НАВІЩО, аудит 16.09.2026. Гачки-шорти (`content.short_script`) генеруються
// батчем у /admin/series-list і лягають у базу — але прочитати їх було НІДЕ.
// Текст показувався один раз, у рядку прогресу під час генерації, і зникав.
// Щоб узяти сценарій для ролика, доводилося лізти в Supabase руками. Дев'ять
// десятків готових текстів лежали недоступними — восьмий випадок «зроблено,
// але не видно» за тиждень.
//
// Що тут є: список серій із текстом шорту, лічильник слів і приблизна
// тривалість озвучення, кадр обкладинки в пропорції 9:16 (як його обріже
// TikTok) і кнопка копіювання.
//
// Чого тут НЕМАЄ і не буде: генерації самого відео. Рендер — це ffmpeg,
// десятки секунд процесора й сотні мегабайтів на ролик; серверлес-функція
// Vercel для цього не призначена. Ролик монтується зовні (CapCut), звідси
// береться текст і кадр.
//
// «Тиша» тут теж є, хоча short_script генерується лише для «Балабонів»
// (/api/admin/short-script-batch фільтрує type='balabony'). Для «Тиші»
// показуємо hook — одне речення; це менше, ніж треба на ролик, і сторінка
// про це прямо каже.

import { dbQuery } from '@/lib/db'
import CopyText from './CopyText'

export const metadata = {
  title: 'Шорти — адмінка',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const FONT = "'Montserrat', Arial, sans-serif"
const GOLD = '#ef9f27'

type Row = {
  slug: string
  title: string | null
  type: string | null
  season_number: number | null
  episode_number: number | null
  short_script: string | null
  hook: string | null
  cover_url: string | null
}

/**
 * Готовий пост для Telegram, Facebook чи опису під роликом: гачок, назва
 * серії й посилання. Збирається тут, а не пишеться руками щоразу.
 *
 * Хештегів навмисно три і всі українські: довгі хмари тегів не дають
 * охоплення, а виглядають як спам.
 */
function postText(body: string, title: string, url: string, isTysha: boolean): string {
  const tags = isTysha
    ? '#тиша #українськапроза #воєннадрама'
    : '#балабони #українськігісторії #гумор'
  return `${body}\n\n«${title}» — читати: ${url}\n\n${tags}`
}

/** Слів у тексті — за ними рахується тривалість озвучення. */
function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Приблизна тривалість озвучення, секунди.
 * 150 слів за хвилину — темп спокійної дикторської начитки українською;
 * ElevenLabs на стандартній швидкості дає приблизно це.
 */
function seconds(w: number): number {
  return Math.round((w / 150) * 60)
}

/**
 * Ціль — ролик до 10 секунд (рішення Богдана 16.09.2026). Це приблизно
 * 25 слів: одне-два речення, не більше.
 *
 * Через це головним текстом тут став `hook` — одне речення, — а не
 * `short_script` на 70-90 слів: останній озвучується 30-36 секунд, тобто
 * втричі довше за ціль. Шорт-скрипт лишається поруч як довгий варіант
 * (для опису під постом), але видно одразу, що в десять секунд він не
 * вкладається.
 */
function fitColor(sec: number): string {
  if (sec <= 10) return '#22c55e'
  if (sec <= 15) return '#eab308'
  return '#ef4444'
}

export default async function ShortsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const sp = await searchParams
  const typeFilter = ['balabony', 'tysha'].includes(sp.type ?? '') ? sp.type! : ''

  let rows: Row[] = []
  let error = ''

  try {
    const res = await dbQuery(
      `select slug, title, type, season_number, episode_number,
              short_script, hook, cover_url
         from content
        where type in ('balabony','tysha')
          and status = 'published'
          and (coalesce(short_script,'') <> '' or coalesce(hook,'') <> '')
          ${typeFilter ? 'and type = $1' : ''}
        order by type, season_number nulls last, episode_number nulls last`,
      typeFilter ? [typeFilter] : [],
    )
    rows = res.rows as Row[]
  } catch (e) {
    error = e instanceof Error ? e.message : 'Помилка запиту'
  }

  const withHook = rows.filter(r => (r.hook ?? '').trim().length > 0)
  const fits = rows.filter(r => {
    const body = (r.hook ?? '').trim() || (r.short_script ?? '').trim()
    return body.length > 0 && seconds(words(body)) <= 10
  })

  const tab = (href: string, label: string, active: boolean) => (
    <a
      href={href}
      style={{
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.16)'}`,
        background: active ? `${GOLD}1a` : 'transparent',
        color: active ? GOLD : '#d8d2c6',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  )

  return (
    <div style={{ padding: '24px 20px 80px', fontFamily: FONT, color: '#f5f0e8', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: GOLD, margin: '0 0 6px' }}>
        Шорти — матеріал для роликів
      </h1>
      <p style={{ fontSize: 13.5, color: 'rgba(245,240,232,0.6)', lineHeight: 1.6, margin: '0 0 18px', maxWidth: 680 }}>
        Ціль — ролик до 10 секунд, тобто приблизно 25 слів. Основний текст
        тут — гачок на одне речення; довший шорт-скрипт схований під кожним
        записом. Зелений таймінг означає, що текст у десять секунд
        вкладається. «Копіювати пост» дає готовий текст із назвою,
        посиланням і хештегами — його можна вставити в Telegram чи Facebook.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {tab('/admin/shorts', 'Усі', !typeFilter)}
        {tab('/admin/shorts?type=balabony', 'Балабони', typeFilter === 'balabony')}
        {tab('/admin/shorts?type=tysha', 'Тиша', typeFilter === 'tysha')}
      </div>

      {error && (
        <div style={{ padding: 14, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: 13.5 }}>
          {error}
        </div>
      )}

      {!error && (
        <div style={{ fontSize: 13, color: 'rgba(245,240,232,0.55)', marginBottom: 16 }}>
          Серій у списку: {rows.length} · із гачком: {withHook.length} · у 10 секунд вкладається: {fits.length}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map(r => {
          const script = (r.short_script ?? '').trim()
          const hook = (r.hook ?? '').trim()
          const body = hook || script
          const w = words(body)
          const sec = seconds(w)
          const isFallback = !hook && Boolean(script)

          return (
            <div
              key={`${r.type}-${r.slug}`}
              style={{
                display: 'flex',
                gap: 14,
                padding: 14,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              {/* Кадр 9:16 — так обкладинку обріже вертикальне відео.
                  Видно одразу, чи не зникає при цьому обличчя й назва. */}
              <div
                style={{
                  width: 68,
                  aspectRatio: '9 / 16',
                  flexShrink: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#0d1b30',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {r.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.cover_url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: 'rgba(245,240,232,0.45)' }}>
                    {r.type === 'tysha' ? 'ТИША' : 'БАЛАБОНИ'} · S{r.season_number ?? '?'}E{r.episode_number ?? '?'}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: 600 }}>{r.title ?? r.slug}</span>
                </div>

                <p style={{ fontSize: 14, lineHeight: 1.65, color: '#e8e2d6', margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>
                  {body}
                </p>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(245,240,232,0.5)' }}>
                    {w} слів
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: fitColor(sec) }}>
                    ≈{sec} с
                  </span>
                  {isFallback && (
                    <span style={{ fontSize: 11.5, color: '#eab308' }}>
                      гачка немає, це довгий шорт
                    </span>
                  )}
                  <CopyText text={body} label="Копіювати гачок" />
                  <CopyText
                    text={postText(
                      body,
                      r.title ?? r.slug,
                      r.type === 'tysha'
                        ? `https://balabony.com/tysha/${r.slug}`
                        : `https://balabony.com/episodes/${r.slug}`,
                      r.type === 'tysha',
                    )}
                    label="Копіювати пост"
                  />
                  {hook && script && (
                    <details style={{ flexBasis: '100%', marginTop: 4 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, color: 'rgba(245,240,232,0.45)' }}>
                        довгий варіант · {words(script)} слів · ≈{seconds(words(script))} с
                      </summary>
                      <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(245,240,232,0.75)', margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>
                        {script}
                      </p>
                      <div style={{ marginTop: 8 }}>
                        <CopyText text={script} label="Копіювати довгий" />
                      </div>
                    </details>
                  )}
                  <a
                    href={r.type === 'tysha' ? `/tysha/${r.slug}` : `/episodes/${r.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12.5, color: GOLD, textDecoration: 'none' }}
                  >
                    серія →
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {!error && rows.length === 0 && (
        <div style={{ fontSize: 14, color: 'rgba(245,240,232,0.6)' }}>
          Нічого не знайдено. Шорти генеруються кнопкою в розділі «Усі серії «Балабонів»».
        </div>
      )}
    </div>
  )
}
