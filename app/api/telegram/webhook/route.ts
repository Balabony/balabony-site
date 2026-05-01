import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

async function sendMessage(chatId: number, text: string) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const message = body?.message
    if (!message) return NextResponse.json({ ok: true })

    const chatId = message.chat.id
    const text = message.text || ''
    const firstName = message.from?.first_name || 'друже'

    if (text.startsWith('/start')) {
      await sendMessage(chatId,
        `🎧 Привіт, ${firstName}! Я бот Балабоні.\n\n` +
        `Твоя бабуся зможе надсилати тобі повідомлення!\n\n` +
        `📋 Твій ID підключення:\n` +
        `<code>${chatId}</code>\n\n` +
        `Скопіюй це число і передай бабусі.`
      )
      return NextResponse.json({ ok: true })
    }

    await sendMessage(chatId,
      `Привіт! 👋\n\nТвій ID: <code>${chatId}</code>\n\nПередай це число бабусі! 💙`
    )

  } catch (e) {
    console.error(e)
  }

  return NextResponse.json({ ok: true })
}
