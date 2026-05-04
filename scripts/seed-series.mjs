import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const rows = [
  {
    id: 's3-ep47', number: 47, season: 3,
    title: 'Загублений рецепт',
    cover_url: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/s3-ep47-1777906226617.jpg',
    has_audio: true,
    url: '/episodes/s3-ep47',
    description: 'Дід Панас шукає старий бабусин рецепт борщу на горищі',
  },
  {
    id: 's3-ep46', number: 46, season: 3,
    title: 'Велика прогулянка',
    cover_url: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/s3-ep46-1777906281500.jpg',
    has_audio: true,
    url: '/episodes/s3-ep46',
    description: 'Дід Панас іде через весь ліс до сусіднього села',
  },
  {
    id: 's3-ep45', number: 45, season: 3,
    title: 'Дощ у суботу',
    cover_url: 'https://swwzsrtbfjsdsmpgfpsk.supabase.co/storage/v1/object/public/covers/s3-ep45-1777906323269.jpg',
    has_audio: false,
    url: '/episodes/s3-ep45',
    description: 'Дід Панас застряг вдома через дощ і згадує молодість',
  },
]

const { data, error } = await supabase.from('series').upsert(rows, { onConflict: 'id' }).select('id, title, cover_url')

if (error) { console.error('Error:', error.message); process.exit(1) }
console.log('Inserted:')
data.forEach(r => console.log(`  ${r.id} — ${r.title}\n  cover: ${r.cover_url}\n`))
