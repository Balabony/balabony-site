import { Resend } from 'resend'

/**
 * Лист із посиланням на вхід до кабінету редактора.
 *
 * Окремий файл, а не додаток до lib/email.ts: той файл великий і його
 * правлять часто, а тут одна функція, яку не треба чіпати роками.
 * Вигляд узятий із sendPlanInviteEmail, щоб листи платформи не
 * розсипалися на різні стилі.
 */

let resend: Resend | null = null
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEditorLoginEmail({
  to, editorName, loginUrl, expiresLabel,
}: {
  to: string
  editorName: string
  loginUrl: string
  expiresLabel: string
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
    to,
    subject: '[Балабони] Вхід до кабінету редактора',
    html: `
<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:600px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Редакція конкурсів</div>
  <p style="color:#c8d4e8;line-height:1.7;margin-bottom:18px;">
    Вітаємо, <strong style="color:#f5f0e8;">${editorName}</strong>! Посилання нижче
    відкриє кабінет, де зібрані призначені вам роботи.
  </p>
  <a href="${loginUrl}" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:15px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;margin-bottom:20px;">
    Увійти до кабінету
  </a>
  <p style="font-size:13px;color:#8899bb;line-height:1.6;margin:0;">
    Посилання одноразове й дійсне до ${expiresLabel}. Після переходу
    ви лишаєтесь у кабінеті на цьому пристрої й нового листа не потрібно.
  </p>
</div>
<p style="font-size:11px;color:#445566;margin-top:18px;text-align:center;">
  Якщо ви не просили цього листа — просто не переходьте за посиланням.
</p>
</body>
</html>`,
  })
}
