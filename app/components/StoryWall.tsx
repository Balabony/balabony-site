'use client'

import { useEffect, useState } from 'react'

/**
 * Реєстраційна стіна на ЧЕТВЕРТОМУ творі (рішення Богдана 12.09.2026).
 *
 * Навіщо. З 129 дочитувань лише 5 належали акаунтам. Рядок над текстом і
 * прохання в точці зарахування — це запрошення; стіна — єдина точка, де
 * читач справді зупиняється.
 *
 * Три вільні історії, стіна на четвертій. Середній відвідувач читає 1,7-1,8
 * матеріалу за візит, тобто випадкового читача стіна не зачепить узагалі —
 * у неї впирається лише той, хто повернувся втретє. А це вже людина, якій
 * сайт сподобався, і в неї є причина завести акаунт. Первісний задум (стіна
 * на другому творі) відкинуто 12.09.2026: при 574 прочитаннях за весь час
 * жорсткість нічого не заробить, бо фільтрувати нема чого.
 *
 * Стіна НЕ спрацьовує при відкритті — лише коли людина прочитала чверть
 * тексту. Замок на порожньому місці читається як «сайт не працює»; замок
 * після зав'язки читається як «далі за акаунтом». На розв'язці (70-75%)
 * ставити не можна: прочитання зараховується вже з 70%, тобто стіна там не
 * дала б ані акаунта, ані дочитування — тільки зіпсоване враження.
 *
 * ЧОМУ СТІНА КЛІЄНТСЬКА, А НЕ СЕРВЕРНА
 * У серіях замок робить сервер: у браузер їде обрізаний тизер (див.
 * getTeaserHtml і EpisodePaywall). Для платних серій це правильно. Для 988
 * історій те саме означало б, що Google отримує 988 сторінок з уривками
 * замість текстів — і перелінковка, сторінки жанрів та авторів втрачають
 * сенс разом із місяцями роботи над індексацією.
 *
 * Тому тут навпаки: сервер ЗАВЖДИ віддає повний текст, стіну малює клієнт
 * поверх нього. Пошуковий робот бачить твір цілком, людина бачить прохання.
 * Обхід через вимкнений JavaScript лишається можливим — з обходом свідомо
 * не воюємо (рішення 12.09.2026), бо кожен запобіжник тут б'є передусім по
 * чесному читачеві.
 *
 * Текст не ховається повністю. Видно початок, далі затемнення: різкий обрив
 * на першому абзаці читається як поломка сайту, а частина тексту з градієнтом
 * читається як «далі за акаунтом».
 *
 * КОЛИ СТІНИ НЕМАЄ
 *   — читач у акаунті (компонент просто не рендериться, див. сторінку твору);
 *   — твір конкурсний: в умовах записано, що конкурсні нічим не блокуються,
 *     і Ad Grants жене платний трафік саме на них;
 *   — це перший твір за сеанс;
 *   — читач уже відкривав цей твір — перечитування не карається.
 */

/** Скільки історій читається вільно до стіни. */
const FREE_STORIES = 3

/** Яку частку тексту людина має прочитати, перш ніж з'явиться стіна. */
const TRIGGER_SHARE = 0.25

/**
 * Скільки днів живе лічильник. Одне число — вся суворість стіни.
 * Доба виявилася б надто щедрою (постійний читач ніколи не зареєструється),
 * місяць — надто злим для людини, якої ми ще навіть не знаємо.
 * Якщо стіна почне різати прочитання, міняється тільки це число.
 */
const DAYS = 3

/** Скільки прочитаних адрес пам'ятаємо. Cookie не має рости безмежно. */
const KEEP = 20

const COOKIE = 'bb_seen'
const GOLD = '#ef9f27'
const FONT = "'Montserrat', Arial, sans-serif"

function readSeen(): string[] {
  try {
    const row = document.cookie.split('; ').find(c => c.startsWith(`${COOKIE}=`))
    if (!row) return []
    return decodeURIComponent(row.slice(COOKIE.length + 1)).split(',').filter(Boolean)
  } catch {
    return []
  }
}

function writeSeen(list: string[]) {
  try {
    const value = encodeURIComponent(list.slice(-KEEP).join(','))
    document.cookie = `${COOKIE}=${value}; path=/; max-age=${60 * 60 * 24 * DAYS}; SameSite=Lax`
  } catch {
    /* приватний режим — просто не запам'ятаємо */
  }
}

export default function StoryWall({ slug }: { slug: string }) {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const seen = readSeen()

    // Перечитування не карається: якщо адреса вже в списку, читач її колись
    // відкривав, і замикати текст посеред знайомої історії — образливо.
    if (seen.includes(slug)) return

    const overLimit = seen.length >= FREE_STORIES
    writeSeen([...seen, slug])
    if (!overLimit) return

    const body = document.querySelector('article.story-body')
    if (!(body instanceof HTMLElement)) return

    /** Яка частка тексту вже побувала на екрані. */
    const share = () => {
      const rect = body.getBoundingClientRect()
      if (rect.height <= 0) return 0
      return Math.max(0, Math.min(1, (window.innerHeight - rect.top) / rect.height))
    }

    const close = () => {
      // Обрізаємо рівно по тому, що людина ВЖЕ бачить, а не по фіксованій
      // висоті. Інакше сторінка різко коротшає, браузер підтягує скрол — і
      // текст стрибає перед очима саме в мить, коли його читають.
      const rect = body.getBoundingClientRect()
      const seenPx = Math.round(window.scrollY + window.innerHeight - (rect.top + window.scrollY))
      body.style.maxHeight = `${Math.max(240, seenPx)}px`
      body.style.overflow = 'hidden'
      body.style.position = 'relative'
      setLocked(true)
    }

    const onScroll = () => {
      if (share() < TRIGGER_SHARE) return
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      close()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    // Коротка історія може вміститися на екран одразу — тоді чверть уже
    // прочитано, і чекати на гортання нема сенсу.
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [slug])

  if (!locked) return null

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Затемнення переходить від прозорого до кольору сторінки — щоб текст
          не обривався лінією, а танув. Мінус 40px: накладка заходить на
          останні рядки видимого тексту. */}
      <div
        aria-hidden="true"
        style={{
          height: 120, marginTop: -120, position: 'relative', zIndex: 2,
          background: 'linear-gradient(to bottom, transparent, #0a1628)',
          pointerEvents: 'none',
        }}
      />

      <div style={{
        position: 'relative', zIndex: 3,
        padding: '16px 18px', borderRadius: 10,
        background: 'rgba(239,159,39,0.09)',
        border: '1px solid rgba(239,159,39,0.24)',
        borderLeft: `3px solid ${GOLD}`,
        fontSize: 13.5, lineHeight: 1.6, color: '#c8d4e8',
      }}>
        <div style={{ color: '#FFF8EE', fontWeight: 700, fontSize: 15 }}>
          Далі — після входу.
        </div>
        <div style={{ marginTop: 6 }}>
          Три історії читаються вільно, ви їх прочитали. Щоб читати далі, увійдіть —
          це безкоштовно, без передплат і прив’язки карти.
        </div>
        <a
          href={`/login?next=${encodeURIComponent(
            typeof window === 'undefined' ? '/' : window.location.pathname,
          )}`}
          style={{
            display: 'inline-block', marginTop: 12,
            background: GOLD, color: '#0a1628',
            fontWeight: 800, fontSize: 14,
            padding: '10px 20px', borderRadius: 10, textDecoration: 'none',
          }}
        >
          Увійти через Google за один клік
        </a>
        <div style={{ marginTop: 10, fontSize: 12.5 }}>
          Ваші прочитання зараховуватимуться авторам, а місце в тексті
          збережеться на всіх пристроях.
        </div>
      </div>
    </div>
  )
}
