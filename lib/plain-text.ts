/**
 * Розмітка з Word у художньому тексті.
 *
 * Автори пишуть у Word і вставляють у форму разом із HTML. Читалка вміє
 * розгортати таку розмітку на льоту, але база далі засмічується: 138 із 479
 * творів уже лежать як HTML. Тому чистимо на ВХОДІ — у момент, коли текст
 * надходить від автора або зберігається редактором.
 *
 * Ціна рішення свідома: жирний і курсив із Word зникають. У художньому тексті
 * це майже завжди випадковий слід форматування, а не задум автора. Абзаци
 * сайт малює сам, чужі скрипти й стилі у творі не потрібні.
 *
 * Цей модуль — єдине джерело правди. Читалка імпортує звідси ж, щоб правила
 * не розʼїхались між входом і показом.
 */

const HTML_RE = /<\/?(?:p|br|div|strong|em|b|i|span|h[1-6]|ul|ol|li|blockquote|a)\b[^>]*>/i

export function looksLikeHtml(raw: string): boolean {
  return HTML_RE.test(raw)
}

export function decodeEntities(str: string): string {
  return str
    // Пробільні сутності з Word: у художньому тексті вони не несуть змісту,
    // тому зводимо їх до звичайного пробілу, а мʼякий перенос прибираємо.
    .replace(/&nbsp;/gi,   ' ')
    .replace(/&ensp;/gi,   ' ')
    .replace(/&emsp;/gi,   ' ')
    .replace(/&thinsp;/gi, ' ')
    .replace(/&shy;/gi,    '')
    .replace(/&zwnj;/gi,   '')
    .replace(/&zwj;/gi,    '')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&rdquo;/gi, '\u201D')
    .replace(/&sbquo;/gi, '\u201A')
    .replace(/&bdquo;/gi, '\u201E')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '…')
    .replace(/&middot;/gi, '·')
    .replace(/&quot;/gi,  '"')
    .replace(/&apos;/gi,  "'")
    .replace(/&#39;/g,    "'")
    .replace(/&lt;/gi,    '<')
    .replace(/&gt;/gi,    '>')
    // Числові сутності (&#8194; &#x2003;) — Word сипле і такими.
    // Виносимо в один прохід, інакше довелося б перелічувати їх поіменно.
    .replace(/&#(\d+);/g, (_, code) => safeFromCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => safeFromCode(parseInt(code, 16)))
    // &amp; — ОСТАННІМ, інакше «&amp;lt;» перетвориться на справжній тег
    .replace(/&amp;/gi,   '&')
}

/**
 * Числовий код → символ. Невидимі пробіли зводимо до звичайного, щоб у тексті
 * не лишалось «порожніх» знаків, які виглядають як пробіл, але ним не є.
 */
function safeFromCode(code: number): string {
  if (!Number.isFinite(code) || code < 9) return ''
  // U+2000…U+200A — типографські пробіли, U+00A0 — нерозривний, U+202F — вузький
  if (code === 0xa0 || code === 0x202f || (code >= 0x2000 && code <= 0x200a)) return ' '
  // U+200B…U+200D, U+00AD, U+FEFF — невидимі службові
  if (code === 0xad || code === 0xfeff || (code >= 0x200b && code <= 0x200d)) return ''
  try { return String.fromCodePoint(code) } catch { return '' }
}

export function htmlToPlain(raw: string): string {
  return decodeEntities(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|h[1-6]|blockquote|tr)>/gi, '\n\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Головна функція для точок входу: якщо текст схожий на HTML — розгортає,
 * якщо ні — повертає як є, лише нормалізує переноси. Безпечна для звичайного
 * тексту: нічого не зіпсує, якщо розмітки немає.
 */
export function toPlainText(raw: string): string {
  if (!raw) return raw
  if (looksLikeHtml(raw)) return htmlToPlain(raw)
  // Тегів немає — але сутності бувають і в чистому тексті («–&ensp;Та ну його»),
  // тож декодуємо завжди, а не лише коли розпізнали розмітку.
  return decodeEntities(raw)
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
}

/**
 * Анонс для картки або meta description.
 *
 * Окрема функція, бо тут легко наступити на ту саму міну двічі: читалка вміє
 * розгортати HTML старих творів на льоту, а список — ні, тому в анонс лізли
 * сирі «<p>», «<strong>» і вордівське «class="MsoNormal"». Спершу знімаємо
 * розмітку, і аж тоді ріжемо — інакше обрізка може розсікти тег навпіл.
 */
export function toExcerpt(raw: string | null | undefined, maxLength: number): string {
  if (!raw) return ''
  return toPlainText(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}
