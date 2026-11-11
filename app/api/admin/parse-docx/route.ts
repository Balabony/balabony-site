import { NextRequest, NextResponse } from 'next/server'
import { docxToText } from '@/lib/docx-text'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Файл відсутній' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    return NextResponse.json({ text: await docxToText(buffer), filename: file.name })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Помилка парсингу'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
