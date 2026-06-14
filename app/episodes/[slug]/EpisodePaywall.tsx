'use client'

import EpisodeBody from './EpisodeBody'

const GOLD = '#ef9f27'
const FREE_PER_SEASON = 2

interface Props {
  html:           string
  fontFamily:     string
  seasonNumber:   number
  episodeNumber:  number
  bypass?:        boolean
}

// Бере перші ~10% параграфів як безкоштовний тізер.
// Парсимо HTML простим способом — рахуємо <p ...>...</p>.
function getTeaserHtml(html: string): string {
  // Виокремлюємо <style>...</style> якщо є (треба залишити)
  const styleMatch = html.match(/<style>[\s\S]*?<\/style>/)
  const styles = styleMatch ? styleMatch[0] : ''
  const withoutStyle = html.replace(/<style>[\s\S]*?<\/style>/, '')

  // Знаходимо всі сцени
  const sceneMatches = withoutStyle.match(/<div class="scene[^"]*">[\s\S]*?<\/div>/g)
  if (!sceneMatches || sceneMatches.length === 0) return styles + withoutStyle

  // Рахуємо загальну кількість параграфів у всіх сценах
  const totalParagraphs = (withoutStyle.match(/<p /g) || []).length
  const teaserParagraphs = Math.max(3, Math.ceil(totalParagraphs * 0.12))

  // Збираємо тізер по сценах, доки не наберемо потрібну кількість параграфів
  let collected = 0
  const teaserScenes: string[] = []
  for (const scene of sceneMatches) {
    const paragraphsInScene = (scene.match(/<p /g) || []).length
    if (collected + paragraphsInScene <= teaserParagraphs) {
      teaserScenes.push(scene)
      collected += paragraphsInScene
    } else {
      // Обрізаємо сцену до потрібної кількості параграфів
      const need = teaserParagraphs - collected
      if (need <= 0) break
      const pMatches = scene.match(/<p [^>]*>[\s\S]*?<\/p>/g) || []
      const sliced = pMatches.slice(0, need).join('')
      // Зберігаємо обгортку <div class="scene...">
      const openTag = scene.match(/<div class="scene[^"]*">/)?.[0] ?? '<div class="scene">'
      teaserScenes.push(`${openTag}${sliced}</div>`)
      break
    }
  }

  return styles + teaserScenes.join('')
}

export default function EpisodePaywall({ html, fontFamily, episodeNumber, bypass = false }: Props) {
  const scrollToPricing = () => {
    window.location.href = '/#pricing'
  }

  // Адмін (залогінений власник) читає все без paywall.
  if (bypass) {
    return <EpisodeBody html={html} fontFamily={fontFamily} />
  }

  // Безкоштовно — перші дві серії кожного сезону («по дві серії з кожного сезону»).
  const isLocked = episodeNumber > FREE_PER_SEASON

  if (!isLocked) {
    return <EpisodeBody html={html} fontFamily={fontFamily} />
  }

  // Серія заблокована: показуємо тізер + paywall
  const teaserHtml = getTeaserHtml(html)

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
          Це була твоя безкоштовна серія. Щоб читати далі&nbsp;— обери&nbsp;пакет.
        </p>
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
          Обрати пакет →
        </button>
      </div>
    </div>
  )
}
