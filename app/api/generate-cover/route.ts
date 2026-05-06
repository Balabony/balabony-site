import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { applyGoldenFrame } from '@/lib/golden-frame'

const POSE_FILES = [
  'panas-walking', 'panas-sitting', 'panas-thinking', 'panas-back',
  'panas-crouching', 'panas-reaching', 'panas-lying', 'panas-running',
  'panas-laughing', 'panas-reading', 'panas-window-night', 'panas-digging',
  'panas-surprised', 'panas-praying', 'panas-arguing', 'panas-sleeping',
  'panas-notebook', 'panas-quarrel', 'panas-tree', 'panas-chickens',
  'panas-neighbor', 'panas-holding', 'panas-packages',
]

const GOLDEN_HOUR_LIGHTING = 'warm golden hour lighting, soft directional sunlight from low angle, deep amber and gold tones, long soft shadows, cinematic atmosphere, nostalgic mood, slight haze, rich warm colors, evening glow, painterly quality'

async function analyzeScene(title: string, description: string): Promise<{ scene: string; poseFile: string; keyObject: string | null; objectOwner: 'self' | 'other' | null }> {
  const fallbackPose = POSE_FILES[Math.floor(Math.random() * POSE_FILES.length)] + '.jpg'
  const fallbackScene = description?.trim() || title

  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicKey) return { scene: fallbackScene, poseFile: fallbackPose, keyObject: null, objectOwner: null }

  try {
    const client = new Anthropic({ apiKey: anthropicKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Проаналізуй опис серії та поверни JSON з трьома полями.

ПОЗИ і коли використовувати:
- panas-walking: іде кудись, подорож, прогулянка
- panas-sitting: сидить, відпочиває, розмірковує спокійно
- panas-thinking: думає, вирішує задачу, здивований ситуацією
- panas-back: дивиться вдалину, чекає, спостерігає, самотність
- panas-crouching: щось розглядає на землі, городні роботи, пошук
- panas-reaching: тягнеться до чогось високого, дістає з полиці
- panas-lying: відпочиває на природі, дивиться в небо, мріє
- panas-running: тікає, женеться, поспішає, щось термінове
- panas-laughing: радість, кумедна ситуація, гумор, успіх
- panas-reading: читає, вивчає щось, вечірня сцена
- panas-window-night: нічна сцена, безсоння, очікування, туга
- panas-digging: копає, садить, ховає, знаходить у землі
- panas-surprised: шок, несподівана подія, відкриття, переляк
- panas-praying: молитва, вдячність, горе, духовний момент
- panas-arguing: конфлікт, суперечка, відстоює позицію
- panas-sleeping: втомився, дрімає, сни, ліниво
- panas-notebook: пише, планує, винаходить, веде записи
- panas-quarrel: гаряча сварка, злість, скандал
- panas-tree: пригода, ховається, застряг, дитячий момент
- panas-chickens: фермерський побут, тварини, щоденна рутина
- panas-neighbor: плітки, розмова через тин, сусідська комунікація
- panas-holding: знахідка, розглядає об'єкт, отримав подарунок
- panas-packages: шопінг, несе речі, переїзд, повернувся з міста

КЛЮЧОВИЙ ПРЕДМЕТ (keyObject):
- Один конкретний предмет, який є символом або рушієм сюжету цієї серії
- Має бути згаданий або підрозуміватись у тексті (не вигадуй)
- Якщо предмет має відкритий стан (блокнот, книга, шкатулка, скриня) — опиши у відкритому вигляді: "відкритий блокнот зі сторінками", "відкрита скриня"
- 1-5 слів, якщо очевидного предмета немає — null

ВЛАСНИК ПРЕДМЕТА (objectOwner):
- "self"  — предмет тримає або використовує сам дід Панас
- "other" — предмет належить іншому персонажу серії (жінці, сусіду, дільничному...)
- null    — якщо keyObject є null

Поверни ТІЛЬКИ валідний JSON без пояснень:
{"scene":"<одне речення до 15 слів: конкретна дія + ракурс + місце (стара хата, городець, подвір'я, садок, хлів, сіни)>","pose":"<назва без .jpg>","keyObject":"<опис предмета або null>","objectOwner":"self" або "other" або null}

Назва серії: ${title}
Опис: ${description}`,
      }],
    })
    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : ''
    const parsed = JSON.parse(raw.replace(/^```json\s*|\s*```$/g, ''))
    const poseKey = String(parsed.pose || '').replace(/\.jpg$/, '')
    const poseFile = POSE_FILES.includes(poseKey) ? poseKey + '.jpg' : fallbackPose
    const scene = String(parsed.scene || '').trim() || fallbackScene
    const keyObject = parsed.keyObject && parsed.keyObject !== 'null'
      ? String(parsed.keyObject).trim()
      : null
    const objectOwner = keyObject
      ? (parsed.objectOwner === 'other' ? 'other' : 'self')
      : null
    return { scene, poseFile, keyObject, objectOwner }
  } catch {
    return { scene: fallbackScene, poseFile: fallbackPose, keyObject: null, objectOwner: null }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { seriesId, title, description } = await req.json()

    if (!seriesId || !title) {
      return NextResponse.json({ error: 'seriesId and title are required' }, { status: 400 })
    }

    const token = process.env.REPLICATE_API_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })
    }

    const { scene, poseFile, keyObject, objectOwner } = await analyzeScene(title, description)

    const imagePath = join(process.cwd(), 'public', 'panas-poses', poseFile)
    const imageBuffer = readFileSync(imagePath)
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`

    const seed = Math.floor(Math.random() * 2_000_000)
    let objectPrefix = ''
    if (keyObject && objectOwner === 'other') {
      objectPrefix = `${keyObject} as a small detail at edge of frame, partially visible, hinting at another presence, `
    } else if (keyObject) {
      objectPrefix = `${keyObject} clearly visible in his hands or directly beside him, `
    }
    const prompt = `${objectPrefix}${scene}, ${GOLDEN_HOUR_LIGHTING}, seed_${seed}`
    const negative_prompt = `text, letters, words, captions, logos, watermarks, signatures, typography, written words, BALABONI, БАЛАБОНИ, titles, subtitles, label, writing, font, alphabet, numbers, digits, inscription, cyrillic letters, latin letters, foreign script, gibberish, ornamental text, decorative lettering, handwriting, graffiti, newspaper, poster text, overlaid text, burned-in text, banner, headline`

    const replicateRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({ input: { prompt, negative_prompt, input_image: base64Image, seed, guidance_scale: 7 } }),
      }
    )

    if (!replicateRes.ok) {
      const errText = await replicateRes.text()
      return NextResponse.json({ error: `Replicate error: ${errText}` }, { status: 502 })
    }

    let prediction = await replicateRes.json()

    if (!prediction.output && prediction.id && prediction.status !== 'failed') {
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000))
        const poll = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        prediction = await poll.json()
        if (prediction.status === 'succeeded' || prediction.status === 'failed') break
      }
    }

    if (prediction.status === 'failed' || !prediction.output) {
      return NextResponse.json({ error: 'Generation failed or timed out' }, { status: 502 })
    }

    const generatedUrl: string = Array.isArray(prediction.output)
      ? prediction.output[0]
      : prediction.output

    const imgRes = await fetch(generatedUrl)
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download generated image' }, { status: 502 })
    }
    const rawBuffer = Buffer.from(await imgRes.arrayBuffer())

    const finalBuffer = await applyGoldenFrame(rawBuffer)

    const supabase = getSupabaseAdmin()
    const fileName = `${seriesId}-${Date.now()}.jpg`

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(fileName, finalBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadError) {
      return NextResponse.json({ error: `Storage error: ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl, fileName, scene, poseFile, keyObject, objectOwner })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
