import { dbQuery } from '@/lib/db'

/**
 * Синхронізація переліку творів (Додаток № 1) з творами автора — див. коментар у /api/admin/sync-contract-works.
 * 08.11.2026: винесено сюди й викликається САМЕ при відкритті кабінету, договору та посилання на підпис —
 * раніше після привʼязки творів договір показував старий перелік, доки адмін не натисне синхронізацію вручну.
 * Підписаний договір не чіпає (його перелік зафіксовано знімком, п. 2.5-1), але нові твори в чинний перелік додає.
 */
export async function syncContractWorks(contractId: string, authorId: string): Promise<{ healed: number; added: number }> {
  // 1. Зшити старі ручні рядки з реальними творами за назвою.
  const healed = await dbQuery(
    `update contract_works w
        set content_id = t.id
       from content t
      where w.contract_id = $1::uuid
        and w.content_id is null
        and t.author_id = $2::uuid
        and lower(btrim(t.title)) = lower(btrim(w.title))
        and not exists (
          select 1 from contract_works w2
           where w2.contract_id = w.contract_id
             and w2.content_id = t.id)`,
    [contractId, authorId],
  )

  // 2. Додати те, чого в переліку ще немає.
  const added = await dbQuery(
    `insert into contract_works (contract_id, content_id, title)
     select $1::uuid, t.id, t.title
       from content t
      where t.author_id = $2::uuid
        and t.status <> 'draft'
        and not exists (
          select 1 from contract_works w
           where w.contract_id = $1::uuid
             and w.content_id = t.id)`,
    [contractId, authorId],
  )

  return { healed: healed.rowCount ?? 0, added: added.rowCount ?? 0 }
}

/** Тихо синхронізувати чинний договір автора (помилка не ламає сторінку). */
export async function syncAuthorWorks(authorId: string): Promise<void> {
  try {
    const c = await dbQuery(`select id::text as id from author_contracts where author_id = $1::uuid and status <> 'terminated' order by created_at desc limit 1`, [authorId])
    const id = c.rows[0]?.id as string | undefined
    if (id) await syncContractWorks(id, authorId)
  } catch (e) { console.error('[syncAuthorWorks]', e) }
}
