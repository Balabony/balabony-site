import { CONTRACT_BLOCKS } from './template'
import { buildVars, DASH } from './vars'
import { computeDocHash, templateFingerprint } from './hash'
import { dbQuery } from '@/lib/db'

/**
 * Знімок договору на момент підписання.
 *
 * Навіщо: текст збирається з lib/contract/template.ts НАЖИВО, а в базі до
 * 10.09.2026 зберігалася лише контрольна сума. Тому після кожної правки
 * шаблону автор, який підписав стару редакцію, відкривав у кабінеті нову —
 * документ, якого він не підписував. Сума при цьому розходилася, і плашка
 * унизу сторінки чесно про це казала, але самого підписаного тексту не
 * існувало ніде: ні в базі, ні у файлі.
 *
 * Тепер при підписанні зберігаємо блоки ВЖЕ З ПІДСТАВЛЕНИМИ значеннями —
 * рівно те, що автор бачив на екрані, — разом зі складом переліку творів,
 * відбитком редакції умов і контрольною сумою.
 *
 * Знімок пишеться один раз і більше не змінюється. Якщо його зберегти не
 * вдалося, підписання все одно завершується: втратити знімок неприємно,
 * але зірвати підписання через це — гірше.
 */

export type SnapshotBlock = { k: string; t: string }

export type ContractSnapshot = {
  /** Відбиток редакції умов — та сама функція, що й у контрольній сумі. */
  fingerprint: string
  /** Контрольна сума договору цілком: текст + підстановки + перелік творів. */
  hash: string
  /** Блоки з підставленими значеннями — те, що бачив автор. */
  blocks: SnapshotBlock[]
  /** Склад Додатка № 1 на момент підписання. */
  works: { content_id: string | null; title: string | null }[]
  saved_at: string
}

function fill(t: string, vars: Record<string, string>): string {
  return t.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? DASH)
}

/**
 * Збирає знімок за id договору і записує його в author_contracts.
 * Повертає true, якщо знімок збережено.
 *
 * Дані беремо з бази, а не з сесії: функцію викликають і з КЕП-роуту, де є
 * користувач, і з вебхука підписання, де його немає.
 */
export async function saveContractSnapshot(contractId: string): Promise<boolean> {
  try {
    const c = await dbQuery(
      `select c.id, c.number, c.created_at, c.signed_at, c.author_id,
              p.full_name, p.rnokpp, p.birth_date, p.address, p.phone,
              p.payout_iban, p.bank_name, p.payout_recipient, p.pen_name, p.is_fop,
              -- Саме u.email, а НЕ coalesce(p.email, u.email): у документ
              -- підставляється пошта, яку автор бачив на сторінці договору,
              -- а сторінка і sign/start беруть її з авторизації. Профільне
              -- p.email автор не редагує (його проставляють імпортом), тож
              -- coalesce давав інший текст і, як наслідок, іншу суму.
              u.email as email
         from author_contracts c
         left join author_profiles p on p.user_id = c.author_id
         left join auth.users u      on u.id      = c.author_id
        where c.id = $1
        limit 1`,
      [contractId],
    )
    const row = c.rows[0] as Record<string, string | boolean | null> | undefined
    if (!row) return false

    const w = await dbQuery(
      `select content_id, title from contract_works where contract_id = $1`,
      [contractId],
    )
    const works = w.rows as { content_id: string | null; title: string | null }[]

    // signed_at у базі ще може бути порожнім — договір підписують саме зараз,
    // тож дату в шапці документа беремо поточну, як її побачить автор.
    const vars = buildVars(
      {
        number: row.number as string | null,
        created_at: row.created_at as string | null,
        signed_at: (row.signed_at as string | null) ?? new Date().toISOString(),
      },
      row,
      (row.email as string | null) ?? null,
      works.length,
    )

    const snapshot: ContractSnapshot = {
      fingerprint: templateFingerprint(),
      hash: computeDocHash(vars, works),
      blocks: CONTRACT_BLOCKS.map(b => ({ k: b.k, t: fill(b.t, vars) })),
      works,
      saved_at: new Date().toISOString(),
    }

    // coalesce: якщо знімок уже є, не перезаписуємо — підписана редакція одна.
    //
    // doc_hash пишеться ІНАКШЕ, ніж решта. Раніше тут теж стояв coalesce, і це
    // було хибно: sign/start завжди встигає записати doc_hash першим, тож
    // coalesce ЗАВЖДИ лишав суму зі старту. А вона рахується до підписання,
    // коли signed_at ще порожній, тому дата в шапці там — день створення
    // договору, а в знімку — день підпису. Договір, підписаний не того дня,
    // коли створений, гарантовано давав дві різні суми.
    //
    // Головною має бути сума знімка: знімок — це і є текст, який лишається в
    // базі, і сума мусить бути сумою саме його. Одноразовість збережена:
    // перезапис відбувається лише тоді, коли знімка ще не було. SET читає
    // СТАРЕ значення doc_snapshot, тобто стан до цього ж UPDATE.
    await dbQuery(
      `update author_contracts
          set doc_snapshot    = coalesce(doc_snapshot, $1::jsonb),
              doc_snapshot_at = coalesce(doc_snapshot_at, now()),
              doc_hash        = case when doc_snapshot is null then $2 else doc_hash end,
              doc_hash_at     = case when doc_snapshot is null then now() else doc_hash_at end
        where id = $3`,
      [JSON.stringify(snapshot), snapshot.hash, contractId],
    )
    return true
  } catch (e) {
    console.error('saveContractSnapshot failed', contractId, e)
    return false
  }
}
