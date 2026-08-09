/**
 * Зведення поштової адреси до одного вигляду.
 *
 * Gmail ігнорує крапки в імені й усе після плюса: leonid.opiy@gmail.com і
 * leonidopiy@gmail.com — та сама скринька. Supabase так не вважає й заводить
 * два різні облікові записи.
 *
 * Через це 9 серпня автор отримав кабінет на адресу з крапкою, а при вході
 * через /login (де нормалізація вже стояла) створив собі другий, порожній
 * акаунт — і не побачив жодного зі своїх десяти творів.
 *
 * Тому функція одна на весь сайт: і сторінка входу, і заведення автора в
 * адмінці мусять приходити до однакового результату. Якщо нормалізувати
 * лише в одному місці, дублі відтворюються знову.
 *
 * Чіпаємо тільки gmail: в інших доменах крапка може бути значуща.
 */
export function normalizeEmail(raw: string): string {
  const t = (raw ?? '').trim().toLowerCase()
  const at = t.lastIndexOf('@')
  if (at < 1) return t
  const name = t.slice(0, at)
  const domain = t.slice(at + 1)
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return t
  return `${name.split('+')[0].replace(/\./g, '')}@gmail.com`
}
