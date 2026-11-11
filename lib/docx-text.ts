import mammoth from 'mammoth'

/**
 * 11.11.2026: текст із Word без втрати тире в діалогах.
 * Word автоматично робить рядок «– Привіт» маркованим списком, а маркер списку — це не символ
 * тексту. mammoth.extractRawText такі маркери викидає, і діалоги лишалися без тире
 * (скарга Анастасії Доброван). Читаємо через HTML: кожен пункт списку перетворюємо на абзац
 * із «— » на початку, якщо тире там ще немає.
 */
const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

export async function docxToText(buffer: Buffer): Promise<string> {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  return html
    .replace(/<li>([\s\S]*?)<\/li>/g, (_, inner: string) => {
      const t = inner.replace(/<[^>]+>/g, '').trim()
      return `<p>${/^[—–-]/.test(t) ? inner : '— ' + inner}</p>`
    })
    .replace(/<\/?(ul|ol)>/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, e: string) => ENT[e] ?? (e.startsWith('#') ? String.fromCodePoint(Number(e.slice(1))) : m))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
