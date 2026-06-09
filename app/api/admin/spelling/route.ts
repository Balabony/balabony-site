import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

// Таблиця створюється сама при першому запиті — ручний SQL у Supabase не потрібен.
async function initSpellingTable() {
  await dbQuery(`CREATE TABLE IF NOT EXISTS spelling_rules (
    id SERIAL PRIMARY KEY,
    topic TEXT NOT NULL,
    category TEXT,
    rule_short TEXT NOT NULL,
    examples TEXT,
    norm_type TEXT NOT NULL DEFAULT 'mandatory',
    audience TEXT NOT NULL DEFAULT 'all',
    status TEXT NOT NULL DEFAULT 'draft',
    source TEXT,
    sort_order INTEGER DEFAULT 0,
    child_mode BOOLEAN NOT NULL DEFAULT false,
    child_mnemonic TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`)
  // авто-міграція для таблиць, створених раніше (без цих полів) — ручний SQL не потрібен
  await dbQuery(`ALTER TABLE spelling_rules ADD COLUMN IF NOT EXISTS child_mode BOOLEAN NOT NULL DEFAULT false`)
  await dbQuery(`ALTER TABLE spelling_rules ADD COLUMN IF NOT EXISTS child_mnemonic TEXT`)
  await dbQuery(`ALTER TABLE spelling_rules ADD COLUMN IF NOT EXISTS image_url TEXT`)
}

const ALLOWED_NORM = ['mandatory', 'variant']
const ALLOWED_AUDIENCE = ['editor', 'all']
const ALLOWED_STATUS = ['draft', 'verified']

export async function GET() {
  try {
    await initSpellingTable()
    const result = await dbQuery(
      `SELECT id, topic, category, rule_short, examples, norm_type, audience, status, source, sort_order, child_mode, child_mnemonic, image_url, updated_at
       FROM spelling_rules
       ORDER BY category NULLS LAST, sort_order ASC, topic ASC`
    )
    return NextResponse.json({ rules: result.rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initSpellingTable()
    const b = await request.json() as Record<string, unknown>
    const topic = String(b.topic ?? '').trim()
    const rule_short = String(b.rule_short ?? '').trim()
    if (!topic || !rule_short) {
      return NextResponse.json({ error: "Поля 'Тема' та 'Правило' обов'язкові" }, { status: 400 })
    }
    const norm_type = ALLOWED_NORM.includes(String(b.norm_type)) ? String(b.norm_type) : 'mandatory'
    const audience = ALLOWED_AUDIENCE.includes(String(b.audience)) ? String(b.audience) : 'all'
    const status = ALLOWED_STATUS.includes(String(b.status)) ? String(b.status) : 'draft'
    const child_mode = b.child_mode === true || b.child_mode === 'true'
    const result = await dbQuery(
      `INSERT INTO spelling_rules (topic, category, rule_short, examples, norm_type, audience, status, source, sort_order, child_mode, child_mnemonic, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, topic, category, rule_short, examples, norm_type, audience, status, source, sort_order, child_mode, child_mnemonic, image_url, updated_at`,
      [
        topic,
        b.category ? String(b.category).trim() : null,
        rule_short,
        b.examples ? String(b.examples).trim() : null,
        norm_type, audience, status,
        b.source ? String(b.source).trim() : null,
        Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
        child_mode,
        b.child_mnemonic ? String(b.child_mnemonic).trim() : null,
        b.image_url ? String(b.image_url).trim() : null,
      ]
    )
    return NextResponse.json({ rule: result.rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await initSpellingTable()
    const b = await request.json() as Record<string, unknown>
    const id = Number(b.id)
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Невірний id' }, { status: 400 })
    }
    const topic = String(b.topic ?? '').trim()
    const rule_short = String(b.rule_short ?? '').trim()
    if (!topic || !rule_short) {
      return NextResponse.json({ error: "Поля 'Тема' та 'Правило' обов'язкові" }, { status: 400 })
    }
    const norm_type = ALLOWED_NORM.includes(String(b.norm_type)) ? String(b.norm_type) : 'mandatory'
    const audience = ALLOWED_AUDIENCE.includes(String(b.audience)) ? String(b.audience) : 'all'
    const status = ALLOWED_STATUS.includes(String(b.status)) ? String(b.status) : 'draft'
    const child_mode = b.child_mode === true || b.child_mode === 'true'
    const result = await dbQuery(
      `UPDATE spelling_rules
       SET topic=$1, category=$2, rule_short=$3, examples=$4, norm_type=$5, audience=$6, status=$7, source=$8, sort_order=$9, child_mode=$10, child_mnemonic=$11, image_url=$12, updated_at=NOW()
       WHERE id=$13
       RETURNING id, topic, category, rule_short, examples, norm_type, audience, status, source, sort_order, child_mode, child_mnemonic, image_url, updated_at`,
      [
        topic,
        b.category ? String(b.category).trim() : null,
        rule_short,
        b.examples ? String(b.examples).trim() : null,
        norm_type, audience, status,
        b.source ? String(b.source).trim() : null,
        Number.isFinite(Number(b.sort_order)) ? Number(b.sort_order) : 0,
        child_mode,
        b.child_mnemonic ? String(b.child_mnemonic).trim() : null,
        b.image_url ? String(b.image_url).trim() : null,
        id,
      ]
    )
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Статтю не знайдено' }, { status: 404 })
    }
    return NextResponse.json({ rule: result.rows[0] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initSpellingTable()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: 'Невірний id' }, { status: 400 })
    }
    await dbQuery('DELETE FROM spelling_rules WHERE id = $1', [Number(id)])
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
