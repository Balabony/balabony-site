'use client'

import EpisodeBody from './EpisodeBody'
import { getTeaserHtml } from '@/lib/episode-teaser'

const GOLD = '#ef9f27'
const FREE_PER_SEASON = 1

interface Props {
  html:           string
  fontFamily:     string
  seasonNumber:   number
  episodeNumber:  number
  bypass?:        boolean
  isPremium?:     boolean
  hasPick?:            boolean
  hasSub?:             boolean
  hasPremiumAccess?:   boolean
  globalEpisodeNumber?: number
  /**
   * Сервер уже вирішив, що серія замкнена, і надіслав у html лише тізер.
   * Тоді компонент не має права показати текст як повний: у нього просто
   * немає решти. Прапорець існує саме для цього — щоб клієнтський розрахунок
   * доступу не «розблокував» уривок.
   */
  serverLocked?: boolean
}

export default function EpisodePaywall({ html, fontFamily, seasonNumber, episodeNumber, serverLocked = false, bypass = false, isPremium = false, hasPick = false, hasSub = false, hasPremiumAccess = false, globalEpisodeNumber }: Props) {
  const scrollToPricing = () => {
    window.location.href = '/#pricing'
  }

  // Обрати цю серію як безкоштовну. Ліміт перевіряє сервер (/api/pick),
  // тут лише надсилаємо запит і перезавантажуємо сторінку при успіху.
  const pickThisEpisode = async () => {
    if (!globalEpisodeNumber) return
    try {
      const res = await fetch('/api/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'series',
          season: seasonNumber,
          contentId: globalEpisodeNumber,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        window.location.reload()
      } else {
        alert(data.message ?? 'Безкоштовні серії цього сезону вичерпано.')
      }
    } catch {
      alert('Не вдалося обрати серію. Спробуйте ще раз.')
    }
  }

  // Адмін (залогінений власник) читає все без paywall. Але якщо сервер уже
  // обрізав текст, показувати нема чого — повного html у браузері немає.
  if (bypass && !serverLocked) {
    return <EpisodeBody html={html} fontFamily={fontFamily} />
  }

  // Відкрито, якщо: вітрина (перша серія сезону), підписка, або серію обрано.
  // Преміальна серія доступна лише за підпискою — вибором не відкривається.
  // Бонусна (преміальна) серія — лише річна передплата або пільговий
  // статус. Будь-яка інша активна підписка (місячна, сімейна місячна)
  // її НЕ відкриває.
  // serverLocked має пріоритет над будь-яким клієнтським розрахунком: сервер
  // надіслав лише тізер, і «розблокувати» його на клієнті неможливо.
  const isUnlocked = serverLocked
    ? false
    : isPremium
      ? hasPremiumAccess
      : (hasSub || episodeNumber <= FREE_PER_SEASON || hasPick)
  const isLocked = !isUnlocked
  if (!isLocked) {
    return <EpisodeBody html={html} fontFamily={fontFamily} />
  }

  // Серія заблокована: показуємо тізер + paywall. Якщо обрізав сервер —
  // html уже є тізером, різати вдруге не треба.
  const teaserHtml = serverLocked ? html : getTeaserHtml(html)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative', maxHeight: 400, overflow: 'hidden' }}>
        <EpisodeBody html={teaserHtml} fontFamily={fontFamily} />
        {/* Градієнт згасання внизу тізера */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: 'linear-gradient(to bottom, transparent, #0a1628)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Paywall-плашка */}
      <div
        style={{
          marginTop: 24,
          padding: '32px 24px',
          borderRadius: 16,
          background: 'rgba(239,159,39,0.08)',
          border: `1px solid ${GOLD}44`,
          textAlign: 'center',
          fontFamily,
        }}
      >
        <div
          style={{
            fontSize: 28,
            marginBottom: 12,
            color: GOLD,
            fontWeight: 800,
          }}
        >
          🔒
        </div>
        <p
          style={{
            fontSize: 16,
            color: '#f5f0e8',
            lineHeight: 1.5,
            margin: '0 0 20px',
            fontFamily,
          }}
        >
          {isPremium ? 'Це бонусна серія. Вона доступна за річною передплатою або пільговим доступом.' : 'Це була твоя безкоштовна серія. Щоб читати далі — обери пакет.'}
        </p> 
        {!isPremium && globalEpisodeNumber && (
          <button
            onClick={pickThisEpisode}
            style={{
              padding: '14px 28px',
              background: 'transparent',
              color: GOLD,
              border: `1px solid ${GOLD}`,
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily,
              marginRight: 12,
              marginBottom: 12,
            }}
          >
            Обрати цю серію
          </button>
        )}
        <button
          onClick={scrollToPricing}
          style={{
            padding: '14px 28px',
            background: GOLD,
            color: '#0a1628',
            border: 'none',
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily,
          }}
        >
          {isPremium ? 'Оформити річну передплату →' : 'Обрати пакет →'}
        </button>
      </div>
    </div>
  )
}
