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
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
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

// ============================================================
// GIFT EMAILS
// ============================================================

export async function sendGiftPurchaseEmail({
  to, senderName, recipientName, recipientEmail,
  giftType, activationDate, code, personalMessage,
}: {
  to: string
  senderName: string
  recipientName: string
  recipientEmail: string
  giftType: 'annual' | 'family-annual'
  activationDate: string
  code: string
  personalMessage?: string
}) {
  const giftLabel = giftType === 'annual'
    ? 'Річна підписка Балабонів'
    : 'Сімейна річна підписка Балабонів'

  const dateUa = new Date(activationDate).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
    to,
    subject: `Ваш подарунок прийнято — ${giftLabel}`,
    html: `<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Подарунок</div>
  <p style="color:#c8d4e8;margin-bottom:6px;">Привіт, <strong style="color:#f5f0e8;">${senderName}</strong>!</p>
  <p style="color:#c8d4e8;margin-bottom:20px;">Ми отримали оплату за ваш подарунок: <strong style="color:#f0a500;">${giftLabel}</strong>.</p>
  <div style="background:#0a1628;border-radius:12px;padding:20px;margin:24px 0;border-left:3px solid #f0a500;">
    <div style="font-size:11px;color:#8899bb;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Одержувач</div>
    <div style="color:#f5f0e8;font-weight:600;margin-bottom:4px;">${recipientName}</div>
    <div style="color:#c8d4e8;font-size:14px;">${recipientEmail}</div>
    <div style="margin-top:16px;font-size:11px;color:#8899bb;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Дата вручення</div>
    <div style="color:#f0a500;font-weight:600;">${dateUa}</div>
  </div>
  ${personalMessage ? `
  <div style="background:#0a1628;border-radius:12px;padding:20px;margin:24px 0;">
    <div style="font-size:11px;color:#8899bb;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Ваше побажання</div>
    <p style="color:#c8d4e8;font-style:italic;margin:0;">«${personalMessage}»</p>
  </div>` : ''}
  <p style="color:#c8d4e8;margin-bottom:8px;">У день вручення ми надішлемо одержувачу красиву електронну картку з кодом активації:</p>
  <div style="font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#f0a500;text-align:center;padding:16px;background:#0a1628;border-radius:8px;letter-spacing:3px;margin-bottom:24px;">${code}</div>
  <p style="color:#8899bb;font-size:12px;margin-top:32px;">Дякуємо, що даруєте Балабонів. Зворотний зв'язок: editorial@balabony.com</p>
</div>
</body>
</html>`,
  })
}


export async function sendGiftDeliveryEmail({
  to, senderName, recipientName,
  giftType, code, personalMessage,
}: {
  to: string
  senderName: string
  recipientName: string
  giftType: 'annual' | 'family-annual'
  code: string
  personalMessage?: string
}) {
  const giftLabel = giftType === 'annual'
    ? 'річну підписку Балабонів'
    : 'сімейну річну підписку Балабонів'

  const activateUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://balabony.com'}/gift/activate?code=${encodeURIComponent(code)}`

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'editorial@balabony.com',
    to,
    subject: `${senderName} дарує вам Балабонів`,
    html: `<!DOCTYPE html>
<html lang="uk">
<body style="font-family:Arial,sans-serif;background:#0a1628;color:#f5f0e8;padding:32px;max-width:680px;margin:0 auto;">
<div style="background:#0f1e3a;border-radius:16px;padding:28px;border:1px solid rgba(240,165,0,0.3);">
  <div style="font-size:22px;font-weight:700;color:#f0a500;margin-bottom:4px;">Balabony</div>
  <div style="font-size:11px;color:#8899bb;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">Для вас подарунок</div>
  <p style="color:#c8d4e8;margin-bottom:6px;">Вітаємо, <strong style="color:#f5f0e8;">${recipientName}</strong>!</p>
  <p style="color:#c8d4e8;margin-bottom:20px;"><strong style="color:#f0a500;">${senderName}</strong> дарує вам ${giftLabel} — цілий рік українських історій і серій.</p>
  ${personalMessage ? `
  <div style="background:#0a1628;border-radius:12px;padding:20px;margin:24px 0;border-left:3px solid #f0a500;">
    <div style="font-size:11px;color:#8899bb;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">Особисте побажання</div>
    <p style="color:#f5f0e8;font-style:italic;margin:0;font-size:16px;line-height:1.6;">«${personalMessage}»</p>
    <div style="text-align:right;color:#f0a500;margin-top:12px;font-weight:600;">— ${senderName}</div>
  </div>` : ''}
  <div style="text-align:center;margin:32px 0;">
    <div style="font-size:11px;color:#8899bb;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">Ваш код активації</div>
    <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#f0a500;padding:20px;background:#0a1628;border-radius:8px;letter-spacing:4px;display:inline-block;border:1px solid rgba(240,165,0,0.3);">${code}</div>
  </div>
  <div style="text-align:center;margin:32px 0;">
    <a href="${activateUrl}" style="background:#f0a500;color:#0a1628;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;display:inline-block;font-size:16px;">Активувати подарунок</a>
  </div>
  <p style="color:#8899bb;font-size:12px;margin-top:32px;text-align:center;">Просто натисніть кнопку — все налаштується автоматично.</p>
</div>
</body>
</html>`,
  })
}