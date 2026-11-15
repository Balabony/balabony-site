// app/api/admin/suggest-genre/route.ts
//
// Визначення жанру твору через Gemini — для екрана «Жанри».
//
// Модель обирає СУВОРО з канонічного переліку (lib/genres.ts) і повертає
// впевненість. Нічого не зберігає: рішення лишається за редактором, бо жанр
// видно читачам і за ним працюють фільтри.
//
// Приймає або перелік id творів, або текст напряму.

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { classifyGenre, type GenreResult } from '@/lib/genre-ai'

function checkAuth(req: NextRequest): boolean {
  return req.cookies.get('admin_session')?.value === process.env.ADMIN_PASSWORD
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY не налаштовано' }, { status: 500 })
  }

  const body = await req.json() as { ids?: string[] }
  const ids = Array.isArray(body.ids) ? body.ids.slice(0, 20) : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Не вказано творів' }, { status: 400 })
  }

  const db = getSupabaseAdmin()
  const { data: rows, error } = await db
    .from('content')
    .select('id, title, text, corrected_text, humanized_text, published_version')
    .in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: GenreResult[] = []

  /**
   * ПАРАЛЕЛЬНО, А НЕ ПО ОДНОМУ (17.09.2026).
   *
   * Було два послідовні місця одразу: клієнт слав по п'ять запитів один за
   * одним, а сервер усередині кожного питав модель по одному твору. На
   * партію в п'ятдесят виходило п'ятдесят викликів поспіль — кілька хвилин
   * очікування, протягом яких сторінку не можна закрити.
   *
   * Тепер твори з одного запиту опрацьовуються разом. Ліміт у 20 id на запит
   * лишається: він і обмежує одночасність, щоб не впертися в ліміт
   * запитів Gemini за хвилину. Якщо почнуть приходити 429 — зменшувати
   * партію на клієнті, а не тут.
   */
  // Ключ у власній змінній з явним типом: усередині classify TypeScript
  // втрачає звуження, зроблене перевіркою вище, бо функція може бути
  // викликана будь-коли — і збірка падала на `string | undefined`.
  const key: string = apiKey

  results.push(...await Promise.all((rows ?? []).map(r => classifyGenre(key, r))))

  return NextResponse.json({ results })
}
