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

/** Чи вкладається ролик у зручні для TikTok 30-60 секунд. */
function fitColor(sec: number): string {
  if (sec >= 20 && sec <= 60) return '#22c55e'
  if (sec > 60 && sec <= 90) return '#eab308'
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

  const withScript = rows.filter(r => (r.short_script ?? '').trim().length > 0)

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
        Тексти згенеровано в розділі «Усі серії «Балабонів»». Тут їх можна
        прочитати, скопіювати й побачити, як обкладинку обріже вертикальний
        кадр. Саме відео монтується зовні.
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
          Серій у списку: {rows.length} · із повним текстом шорту: {withScript.length}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {rows.map(r => {
          const script = (r.short_script ?? '').trim()
          const hook = (r.hook ?? '').trim()
          const body = script || hook
          const w = words(body)
          const sec = seconds(w)
          const isHookOnly = !script && Boolean(hook)

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
                  {isHookOnly && (
                    <span style={{ fontSize: 11.5, color: '#eab308' }}>
                      тільки гачок, повного шорту немає
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
