import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

interface FileMeta {
  filename: string
  index: number
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()

  const metaRaw = formData.get('metadata')
  if (!metaRaw || typeof metaRaw !== 'string') {
    return NextResponse.json({ error: 'metadata відсутній' }, { status: 400 })
  }

  let meta: FileMeta[]
  try {
    meta = JSON.parse(metaRaw) as FileMeta[]
  } catch {
    return NextResponse.json({ error: 'Невалідний metadata JSON' }, { status: 400 })
  }

  const zip = new JSZip()

  for (let i = 0; i < meta.length; i++) {
    const { filename, index } = meta[i]
    const file = formData.get(`file_${index}`) as File | null
    if (!file) continue

    const num = String(i + 1).padStart(2, '0')
    const safeName = filename.replace(/[/\\:*?"<>|]/g, '_').replace(/\.docx$/i, '')
    const buffer = Buffer.from(await file.arrayBuffer())
    zip.file(`${num}_${safeName}.docx`, buffer)
  }

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  return new NextResponse(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename*=UTF-8\'\'%D0%91%D0%B0%D0%BB%D0%B0%D0%B1%D0%BE%D0%BD%D0%B8_%D1%81%D0%B5%D1%80%D1%96%D1%97_%D0%B2%D0%BF%D0%BE%D1%80%D1%8F%D0%B4%D0%BA%D0%BE%D0%B2%D0%B0%D0%BD%D1%96.zip',
    },
  })
}
