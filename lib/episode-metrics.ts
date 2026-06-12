// lib/episode-metrics.ts
// Єдиний модуль контролю якості серії «Балабони»:
//  • тривалість 9–10 хв (за темпом озвучення ~150 слів/хв → 1350–1500 слів)
//  • композиція: плавний вхід + гачок на початку, висновок наприкінці
//  • переважно ДІАЛОГИ різних персонажів (бо озвучка багатоголоса)
// Використовується і в адмінці (індикатор), і в підказках генерації.

export const WORDS_PER_MIN = 150

// Цільова тривалість серії
export const TARGET_MIN_MINUTES = 9
export const TARGET_MAX_MINUTES = 10

// Відповідні межі за словами (округлено під темп озвучення)
export const MIN_WORDS = 1350
export const MAX_WORDS = 1500

// Мінімум реплік прямої мови, щоб серія годилась для багатоголосої озвучки
export const MIN_DIALOGUE_LINES = 8

export interface EpisodeMetrics {
  words: number
  minutes: number          // округлено до 0.1
  lengthState: 'short' | 'ok' | 'long'
  hasHook: boolean         // є змістовний (плавний) зачин на початку
  dialogueLines: number    // скільки реплік прямої мови
  hasDialogue: boolean     // достатньо діалогів для озвучки
  hasConclusion: boolean   // є фінал/висновок наприкінці
  structureOk: boolean     // зачин + діалоги + висновок присутні
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

// Зачин: змістовний перший абзац (>150 символів без технічних ремарок),
// що плавно вводить у місце/час/настрій.
function detectHook(text: string): boolean {
  const firstPara = (text.trim().split(/\n{2,}/)[0] || '').replace(/\([^)]*\)/g, '').trim()
  return firstPara.length >= 150
}

// Діалоги: рахуємо репліки у форматі «Ім'я: …» (рядок починається з імені + двокрапка),
// а також, про всяк випадок, старий формат із тире.
export function countDialogueLines(text: string): number {
  const speaker = (text.match(/(^|\n)\s*[А-ЯҐЄІЇ][А-Яа-яҐґЄєІіЇї'’ ]{1,22}:\s/gu) || []).length
  const dash    = (text.match(/(^|\n)\s*[—–-]\s+\S/gu) || []).length
  return Math.max(speaker, dash)
}

// Висновок: змістовний завершальний абзац.
function detectConclusion(text: string): boolean {
  const paras = text.trim().split(/\n{2,}/).filter(Boolean)
  const last = (paras[paras.length - 1] || '').replace(/\([^)]*\)/g, '').trim()
  return last.length >= 100
}

export function analyzeEpisode(text: string): EpisodeMetrics {
  const words = countWords(text)
  const minutes = estimateMinutes(text)

  const lengthState: EpisodeMetrics['lengthState'] =
    words < MIN_WORDS ? 'short' : words > MAX_WORDS ? 'long' : 'ok'

  const hasHook = detectHook(text)
  const dialogueLines = countDialogueLines(text)
  const hasDialogue = dialogueLines >= MIN_DIALOGUE_LINES
  const hasConclusion = detectConclusion(text)
  const structureOk = hasHook && hasDialogue && hasConclusion

  const hints: string[] = []
  if (lengthState === 'short') {
    const need = MIN_WORDS - words
    hints.push(`Закоротко на ~${need} слів — дотягни до 9–10 хв (≈ ${MIN_WORDS}–${MAX_WORDS} слів).`)
  } else if (lengthState === 'long') {
    const over = words - MAX_WORDS
    hints.push(`Задовго на ~${over} слів — підріж до 9–10 хв (≈ ${MIN_WORDS}–${MAX_WORDS} слів).`)
  }
  if (!hasHook) hints.push('Немає плавного зачину — додай атмосферний вступ (місце, час, настрій) у перший абзац.')
  if (!hasDialogue) hints.push(`Замало діалогів (${dialogueLines}) — для багатоголосої озвучки потрібні репліки різних персонажів (мін. ${MIN_DIALOGUE_LINES}).`)
  if (!hasConclusion) hints.push('Немає чіткого висновку наприкінці.')

  return {
    words, minutes, lengthState,
    hasHook, dialogueLines, hasDialogue, hasConclusion, structureOk,
    ok: lengthState === 'ok' && structureOk,
    hints,
  }
}
