import { Resend } from 'resend'

let resend: Resend | null = null
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY)
  return resend
}

export async function sendEditorEmail({
  to, editorName, filename, text, approveUrl, reviseUrl,
}: {
  to: string; editorName: string; filename: string
  text: string; approveUrl: string; reviseUrl: string
}) {
  const wordCount = text.trim().split(/\s+/).length
  const preview = text.slice(0, 1200).replace(/\n/g, '<br>')

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
    to,
    subject: `[Балабони] На погодження: ${filename}`,
    html: `
<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony<sup style="font-size:11px">®</sup></div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Редакція</div>
  <p style="color:#c8d4e8;margin-bottom:6px;">Вітаємо, <strong style="color:#f5f0e8;">${editorName}</strong>!</p>
  <p style="color:#c8d4e8;margin-bottom:20px;">Серія <strong style="color:#f0a500;">${filename}</strong> (${wordCount} слів) очікує вашого погодження.</p>
  <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:18px;border:1px solid rgba(255,255,255,0.08);margin-bottom:24px;font-size:14px;color:#c8d4e8;line-height:1.7;">
    <div style="font-size:10px;font-weight:700;color:#8899bb;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Текст серії (фрагмент):</div>
    ${preview}${text.length > 1200 ? '…' : ''}
  </div>
  <table style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:6px;">
        <a href="${approveUrl}" style="display:block;text-align:center;background:#22c55e;color:#fff;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
          ✅ Погоджую
        </a>
      </td>
      <td style="padding:6px;">
        <a href="${reviseUrl}" style="display:block;text-align:center;background:#f0a500;color:#081420;padding:14px 20px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
          ✏️ Надіслати правки
        </a>
      </td>
    </tr>
  </table>
  <p style="font-size:11px;color:#445566;margin-top:20px;text-align:center;">Ви отримали цей лист як редактор серіалу «Балабони»</p>
</div>
</body>
</html>`,
  })
}

export async function sendReminderEmail(params: {
  to: string; editorName: string; filename: string
  text: string; approveUrl: string; reviseUrl: string
}) {
  return sendEditorEmail(params)
}
