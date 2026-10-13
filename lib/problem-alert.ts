// =============================================================================
// АВТОМАТИЧНЕ ПОВІДОМЛЕННЯ БОГДАНУ ПРО ПРОБЛЕМИ (рішення 14.10.2026).
//
// Автори, у яких щось не вийшло з заявкою, зазвичай не пишуть — просто
// йдуть. Тому кожна відмова форми (заявка автора, конкурсна подача) і кожна
// помилка дії в адмінці надсилає лист на nazar@balabony.com: хто, що
// намагався, яку помилку побачив. Пароль/вхід (401) не шлемо — це шум.
// =============================================================================

import { Resend } from 'resend'
import { createSupabaseServerClient } from '@/lib/supabase-ssr'

const TO = 'nazar@balabony.com'

function esc(v: string): string {
  return (v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function sendProblemAlert(p: { where: string; error: string; who?: string; extra?: string }) {
  if (!process.env.RESEND_API_KEY) return
  const time = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
  const html = `
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:24px;max-width:640px;margin:0 auto;">
  <div style="background:#0f1e3a;border-radius:14px;padding:22px;border:1px solid rgba(239,107,107,.5);">
    <div style="font-size:18px;font-weight:700;color:#ef6b6b;margin-bottom:12px;">⚠ Проблема: ${esc(p.where)}</div>
    <p style="color:#c8d4e8;margin:0 0 8px;"><b>Хто:</b> ${p.who ? `<a href="mailto:${esc(p.who)}" style="color:#ef9f27">${esc(p.who)}</a>` : 'не відомо (не увійшов або без пошти)'}</p>
    <p style="color:#c8d4e8;margin:0 0 8px;"><b>Що побачив:</b> ${esc(p.error)}</p>
    ${p.extra ? `<p style="color:#8899bb;margin:0 0 8px;">${esc(p.extra)}</p>` : ''}
    <p style="color:#8899bb;font-size:12px;margin:12px 0 0;">${esc(time)} · Якщо помилка на нашому боці — напишіть автору, що все виправлено, і попросіть спробувати ще раз.</p>
  </div>
</body>`
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
      to: TO,
      ...(p.who ? { replyTo: p.who } : {}),
      subject: `[Балабони] ⚠ ${p.where}: ${p.error.slice(0, 80)}`,
      html,
    })
  } catch (e) {
    console.error('[problem-alert]', (e as Error)?.message)
  }
}

/** Обгортка для POST: якщо відповідь — помилка (крім 401), шле лист із пошою користувача. */
export async function alertIfFailed(res: Response, where: string): Promise<void> {
  if (res.status < 400 || res.status === 401 || res.status === 403) return
  let error = `HTTP ${res.status}`
  try {
    const j = await res.clone().json() as { error?: string }
    if (j?.error) error = j.error
  } catch { /* не JSON */ }
  let who: string | undefined
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    who = user?.email ?? undefined
  } catch { /* без пошти */ }
  await sendProblemAlert({ where, error, who })
}
