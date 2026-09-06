/**
 * Обрізання серії до безкоштовного тізера.
 *
 * Ця функція жила в EpisodePaywall.tsx — клієнтському компоненті. Це означало,
 * що сервер віддавав у браузер ПОВНИЙ текст замкненої серії, а ховав його вже
 * скрипт. Будь-хто міг прочитати платну серію через «Переглянути код сторінки».
 * Після 25 листопада це був би прямий обхід передплати.
 *
 * У «Тиші» те саме зроблено правильно (buildTeaser на сервері) — тут
 * вирівнюємо «Балабонів» під той самий підхід: у HTML потрапляє лише тізер.
 *
 * Модуль без 'use client' і без React — його можна викликати і з серверного
 * компонента, і з клієнтського.
 */

/** Частка абзаців, яку показуємо безкоштовно. */
const TEASER_SHARE = 0.12

/** Мінімум абзаців у тізері, щоб уривок не був беззмістовним. */
const TEASER_MIN_PARAGRAPHS = 3

/**
 * Бере перші ~12% абзаців як безкоштовний тізер.
 * Розмітка проста й передбачувана (її генерує formatEpisodeText),
 * тому парсимо регулярними виразами, а не повноцінним парсером.
 */
export function getTeaserHtml(html: string): string {
  const styleMatch = html.match(/<style>[\s\S]*?<\/style>/)
  const styles = styleMatch ? styleMatch[0] : ''
  const withoutStyle = html.replace(/<style>[\s\S]*?<\/style>/, '')

  const sceneMatches = withoutStyle.match(/<div class="scene[^"]*">[\s\S]*?<\/div>/g)
  if (!sceneMatches || sceneMatches.length === 0) return styles + withoutStyle

  const totalParagraphs = (withoutStyle.match(/<p /g) || []).length
  const teaserParagraphs = Math.max(
    TEASER_MIN_PARAGRAPHS,
    Math.ceil(totalParagraphs * TEASER_SHARE),
  )

  let collected = 0
  const teaserScenes: string[] = []
  for (const scene of sceneMatches) {
    const paragraphsInScene = (scene.match(/<p /g) || []).length
    if (collected + paragraphsInScene <= teaserParagraphs) {
      teaserScenes.push(scene)
      collected += paragraphsInScene
    } else {
      const need = teaserParagraphs - collected
      if (need <= 0) break
      const pMatches = scene.match(/<p [^>]*>[\s\S]*?<\/p>/g) || []
      const sliced = pMatches.slice(0, need).join('')
      const openTag = scene.match(/<div class="scene[^"]*">/)?.[0] ?? '<div class="scene">'
      teaserScenes.push(`${openTag}${sliced}</div>`)
      break
    }
  }

  return styles + teaserScenes.join('')
}
