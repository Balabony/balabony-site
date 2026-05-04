import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Parse .env.local manually (no dotenv dependency)
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const BASE = 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers'

const updates = [
  { id: 's3-ep47', cover_url: `${BASE}/s3-ep47-1777907593975.jpg` },
  { id: 's3-ep46', cover_url: `${BASE}/s3-ep46-1777908375713.jpg` },
  { id: 's3-ep45', cover_url: `${BASE}/s3-ep45-1777908432264.jpg` },
]

for (const { id, cover_url } of updates) {
  const { error } = await supabase.from('series').update({ cover_url }).eq('id', id)
  if (error) { console.error(`❌ ${id}:`, error.message) }
  else        { console.log(`✓ ${id} → ${cover_url.split('/').pop()}`) }
}
