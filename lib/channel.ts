/**
 * Канал залучення з utm_source або реферера — одне правило для всіх звітів.
 *
 * НАВІЩО (18.09.2026). Звіти показували хости як є, і Facebook розсипався
 * на чотири рядки: lm.facebook.com, m.facebook.com, facebook.com,
 * l.facebook.com — по 2–3% кожен, разом ~11%. Так само пошта:
 * secureurl.ukr.net (перехід з листа в ukr.net) і com.google.android.gm
 * (застосунок Gmail) виглядали як «сайти», хоча це листи.
 *
 * Те саме правило в SQL — lib/acquisition-sql.ts. Міняєте тут — міняйте й там.
 */
export function channelFromSource(raw: string): string {
  const s = raw.toLowerCase().replace(/^(www|m|l|lm|mobile)\./, '')
  if (/facebook|^fb$|^fb\./.test(s)) return 'facebook'
  if (/instagram|^ig$/.test(s)) return 'instagram'
  // Пошта — ДО google: mail.google.com і com.google.android.gm містять «google».
  if (/ukr\.net|mail\.google\.|\.gm$|outlook\.|live\.com|^i\.ua$|mail|email|newsletter/.test(s)) return 'пошта'
  if (/(^|\.)google\.|^google$|googlequicksearchbox/.test(s)) return 'google'
  if (/telegram|^t\.me$|^tg$/.test(s)) return 'telegram'
  if (/viber/.test(s)) return 'viber'
  if (/tiktok/.test(s)) return 'tiktok'
  if (/storriss/.test(s)) return 'storriss'
  return s
}

export function channelOf(
  a: { utm_source?: string | null; referrer?: string | null },
  direct = 'прямий',
): string {
  if (a.utm_source) return channelFromSource(a.utm_source)
  const ref = a.referrer
  if (!ref) return direct
  try {
    const host = new URL(ref).hostname
    if (host.includes('balabony')) return direct
    return channelFromSource(host)
  } catch {
    return direct
  }
}
