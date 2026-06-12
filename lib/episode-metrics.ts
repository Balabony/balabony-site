// lib/episode-metrics.ts
// Єдиний модуль контролю якості серії «Балабони»:
//  • тривалість 9–10 хв (за темпом озвучення ~150 слів/хв → 1350–1500 слів)
//  • композиція не змінюється: гачок на початку + висновок («Приказка серії») у кінці
// Використовується і в адмінці (індикатор), і в підказках генерації.

export const WORDS_PER_MIN = 150

// Цільова тривалість серії
export const TARGET_MIN_MINUTES = 9
export const TARGET_MAX_MINUTES = 10

// Відповідні межі за словами (округлено під темп озвучення)
export const MIN_WORDS = 1350
export const MAX_WORDS = 1500

export interface EpisodeMetrics {
  words: number
  minutes: number          // округлено до 0.1
  lengthState: 'short' | 'ok' | 'long'
  hasHook: boolean         // є виражений гачок на початку
  hasProverb: boolean      // є «Приказка серії» (маркер висновку)
  hasConclusion: boolean   // є фінал/висновок наприкінці
  structureOk: boolean     // гачок + висновок присутні
  ok: boolean              // довжина в межах І структура коректна
  hints: string[]          // людські підказки, що підправити
}

export function countWords(text: string): number {
  const t = (text || '').trim()
  if (!t) return 0
  return t.split(/\s+/).filter(Boolean).length
}

export function estimateMinutes(text: string): number {
  const w = countWords(text)
  return Math.round((w / WORDS_PER_MIN) * 10) / 10
}

// Гачок: явний маркер «Гачок/Hook» АБО змістовний перший абзац (>200 символів),
// що одразу вводить у дію, а не починається з технічної ремарки.
function detectHook(text: string): boolean {
  if (/\b(гачок|hook)\b/iu.test(text.slice(0, 400))) return true
  const firstPara = (text.trim().split(/\n{2,}/)[0] || '').replace(/\([^)]*\)/g, '').trim()
  return firstPara.length >= 200
}

// Висновок: наявність «Приказка серії» (канонічний маркер кінцівки)
// або змістовний завершальний абзац.
function detectProverb(text: string): boolean {
  return /приказк[аи]\s+сер[іи]ї/iu.test(text)
}

function detectConclusion(text: string): boolean {
  if (detectProverb(text)) return true
  if (/\b(фінал|висновок|епілог)\b/iu.test(text)) return true
  const paras = text.trim().split(/\n{2,}/).filter(Boolean)
  const last = (paras[paras.length - 1] || '').replace(/\([^)]*\)/g, '').trim()
  return last.length >= 120
}

export function analyzeEpisode(text: string): EpisodeMetrics {
  const words = countWords(text)
  const minutes = estimateMinutes(text)

  const lengthState: EpisodeMetrics['lengthState'] =
    words < MIN_WORDS ? 'short' : words > MAX_WORDS ? 'long' : 'ok'

  const hasHook = detectHook(text)
  const hasProverb = detectProverb(text)
  const hasConclusion = detectConclusion(text)
  const structureOk = hasHook && hasConclusion

  const hints: string[] = []
  if (lengthState === 'short') {
    const need = MIN_WORDS - words
    hints.push(`Закоротко на ~${need} слів — дотягни до 9–10 хв (≈ ${MIN_WORDS}–${MAX_WORDS} слів).`)
  } else if (lengthState === 'long') {
    const over = words - MAX_WORDS
    hints.push(`Задовго на ~${over} слів — підріж до 9–10 хв (≈ ${MIN_WORDS}–${MAX_WORDS} слів).`)
  }
  if (!hasHook) hints.push('Немає вираженого гачка на початку — додай інтригу/подію в перший абзац.')
  if (!hasConclusion) hints.push('Немає чіткого висновку наприкінці.')
  if (!hasProverb) hints.push('Бракує рядка «Приказка серії: …» у фіналі.')

  return {
    words, minutes, lengthState,
    hasHook, hasProverb, hasConclusion, structureOk,
    ok: lengthState === 'ok' && structureOk,
    hints,
  }
}
