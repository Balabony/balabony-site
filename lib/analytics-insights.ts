import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { dbQuery } from '@/lib/db'
import { getReport } from '@/lib/analytics-report'
import { ensureAnalyticsTables } from '@/lib/analytics-extra'
import { STYLE_MODEL } from '@/lib/ai-style-check'

/**
 * 06.11.2026 (Богдан): щотижня ШІ читає аналітику й дає висновки:
 * тенденції читання, залучення читачів, поради Богдану й поради авторам — як писати,
 * щоб дочитували. Зберігається в analytics_insights, показується на /admin/dzherela
 * і надсилається листом на nazar@balabony.com.
 */

function prompt(week: unknown, month: unknown) {
  return `Ти — аналітик української літературно-аудіо платформи «Балабони» (balabony.com): короткі історії, серіали, конкурси авторів, аудіо, друковані газети з QR-кодами (аудиторія переважно 45+). Нижче — метрики за останні 7 днів і для порівняння за 28 днів (JSON, команда платформи виключена).

7 днів: ${JSON.stringify(week)}
28 днів: ${JSON.stringify(month)}

Напиши звіт українською, коротко й конкретно, лише на основі цих чисел (не вигадуй даних; якщо даних замало — так і скажи):
## Що змінилося за тиждень
3–5 пунктів: тенденції читання й відвідувань (порівняй тиждень із середнім за 28 днів), що росте, що падає.
## Залучення читачів — поради Богдану
3–5 конкретних дій на цей тиждень: які джерела підсилити, що робити з газетою, які твори просувати, коли публікувати (за годинами й днями), що додати за пошуковими запитами без результатів.
## Поради авторам — як писати, щоб дочитували
Наша мета — навчати авторів писати так, як хочуть читачі. Порівняй найкраще й найгірше дочитувані твори (works: назва, жанр, довжина в словах, зачин) і дочитуваність за довжиною (byLength), де кидають читати (dropoff), серійне читання. Дай 5–7 конкретних порад окремо про: оптимальну довжину; назву (які назви відкривають і дочитують); зачин — перші речення (наведи короткий приклад удалого зачину з даних); жанри й теми; закінчення серії (гачок до наступної). Звертайся до авторів на «ви», дружньо, з прикладами з даних. Цей розділ Богдан пересилатиме авторам — пиши так, щоб його можна було надіслати без правок і без внутрішніх цифр платформи.
## Порада читачам
1–2 речення: що почитати чи послухати цього тижня (з назвами з даних).
## Головне одним реченням`
}

export async function makeWeeklyInsight(): Promise<string> {
  await ensureAnalyticsTables()
  const [week, month] = await Promise.all([getReport(7), getReport(28)])
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Немає ANTHROPIC_API_KEY')
  const msg = await new Anthropic({ apiKey: key }).messages.create({
    model: STYLE_MODEL, max_tokens: 3500,
    messages: [{ role: 'user', content: prompt(week, month) }],
  })
  const text = msg.content.map((c) => (c.type === 'text' ? c.text : '')).join('').trim()
  await dbQuery(`insert into analytics_insights (period_days, metrics, text) values (7, $1, $2)`, [JSON.stringify({ week, month }), text])

  try {
    const html = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/^## (.*)$/gm, '<h3 style="color:#ef9f27;margin:18px 0 6px">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>')
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: 'nazar@balabony.com',
      subject: '[Балабони] Аналітика тижня: висновки й поради',
      html: `<div style="font-family:Arial,sans-serif;max-width:680px;line-height:1.55">${html}<p style="color:#888;font-size:13px">Усі цифри: https://balabony.com/admin/dzherela</p></div>`,
    })
  } catch (e) { console.error('[analytics-insights mail]', (e as Error).message) }
  return text
}

export async function latestInsight(): Promise<{ text: string; created_at: string } | null> {
  try {
    await ensureAnalyticsTables()
    const r = await dbQuery(`select text, created_at::text from analytics_insights order by created_at desc limit 1`)
    return (r.rows[0] as { text: string; created_at: string } | undefined) ?? null
  } catch { return null }
}
