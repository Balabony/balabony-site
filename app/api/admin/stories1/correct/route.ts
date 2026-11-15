import { NextRequest, NextResponse } from 'next/server'
import { runCorrection } from '@/lib/ai-correct'

/**
 * Грамотність: редакторська правка тексту (кнопка «Грамотність» у редакторських інструментах).
 *
 * 15.11.2026 (Богдан: «правка ШІ граматики не працює»). Раніше модель мала
 * повернути ВЕСЬ виправлений текст. На творах у 10–15 тис. знаків відповідь
 * обрізалася на ліміті токенів (8000), маркер ===ENDTEXT=== не доходив — і
 * редактор отримував або сирий шматок відповіді, або нічого; ще й без
 * maxDuration запит падав за таймаутом.
 *
 * Тепер модель повертає ЛИШЕ список правок (через інструмент — JSON завжди
 * валідний). Виправлений текст збираємо тут, застосовуючи правки до
 * оригіналу. Відповідь у 5–10 разів коротша, нічого не обрізається, а правки,
 * цитати яких немає в тексті, відкидаються (захист від вигаданих помилок).
 * Формат відповіді той самий: { corrected_text, changes }.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { text, genre } = await req.json() as { text?: string; genre?: string }
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    return NextResponse.json(await runCorrection(text, genre))
  } catch (err) {
    console.error('[stories1/correct]', (err as Error)?.message)
    return NextResponse.json({ error: `Перевірка не вдалася: ${(err as Error)?.message ?? String(err)}` }, { status: 500 })
  }
}
