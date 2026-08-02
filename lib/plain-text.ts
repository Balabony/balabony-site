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
    .replace(/&nbsp;/gi,  ' ')
    .replace(/&laquo;/gi, '«')
    .replace(/&raquo;/gi, '»')
    .replace(/&lsquo;/gi, '\u2018')
    .replace(/&rsquo;/gi, '\u2019')
    .replace(/&ldquo;/gi, '\u201C')
    .replace(/&rdquo;/gi, '\u201D')
    .replace(/&ndash;/gi, '–')
    .replace(/&mdash;/gi, '—')
    .replace(/&hellip;/gi, '…')
    .replace(/&quot;/gi,  '"')
    .replace(/&#39;/g,    "'")
    .replace(/&lt;/gi,    '<')
    .replace(/&gt;/gi,    '>')
    // &amp; — ОСТАННІМ, інакше «&amp;lt;» перетвориться на справжній тег
    .replace(/&amp;/gi,   '&')
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
  return raw
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
