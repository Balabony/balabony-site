/**
 * lib/plan-groups.ts
 *
 * Груповий доступ: сімейний (4 місця), корпоративний і бібліотечний пакети.
 *
 * ГОЛОВНЕ ПРАВИЛО. Учасник групи отримує ВЛАСНИЙ рядок у app_subscriptions
 * із source='group' і plan_group_id. Через це всі наявні перевірки доступу
 * (сторінка серії, /api/episode, читалка, преміум) працюють без жодної
 * правки: вони питають ту саму таблицю тим самим запитом.
 *
 * Видалили учасника → прибрали його рядок → доступ зник тієї ж миті.
 *
 * ЗАЙНЯТІ МІСЦЯ рахуються як власник + запрошення зі статусом 'pending' або
 * 'accepted'. Запрошення теж займає місце, поки висить — інакше власник
 * розсилає двадцять запрошень на чотири місця, і хто перший прийняв, той і
 * зайшов. Так само працюють Spotify, Fitbod і Brilliant.
 *
 * ПРОТУХЛІ ЗАПРОШЕННЯ (pending, у яких expires_at минув) місця не займають:
 * вони відсіюються в запиті, а не окремим прибиранням за розкладом.
 */

import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export type PlanGroupKind = 'family' | 'corporate' | 'library'

/** Скільки місць дає кожен вид пакета, разом із власником. */
export const SEATS_BY_KIND: Record<PlanGroupKind, number> = {
  family: 4,
  corporate: 25,
  library: 100,
}

export const KIND_LABEL: Record<PlanGroupKind, string> = {
  family: 'Сімейний доступ',
  corporate: 'Корпоративний доступ',
  library: 'Бібліотечний доступ',
}

export interface PlanGroup {
  id: string
  owner_user_id: string
  kind: PlanGroupKind
  seats: number
  plan: 'monthly' | 'yearly'
  expires_at: string
}

export interface PlanMember {
  inviteId: string
  email: string
  status: 'pending' | 'accepted'
  invitedAt: string
  acceptedAt: string | null
  /** Запрошення протухло: висить, але місця вже не займає. */
  stale: boolean
}

/** Одноразовий токен для посилання в листі. */
export function newInviteToken(): string {
  return crypto.randomBytes(24).toString('base64url')
}

/**
 * Група, якою людина ВОЛОДІЄ. Одна людина може мати лише одну активну групу:
 * друга оплата того самого пакета продовжує наявну, а не створює другу.
 */
export async function getOwnedGroup(userId: string): Promise<PlanGroup | null> {
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('plan_groups')
    .select('id, owner_user_id, kind, seats, plan, expires_at')
    .eq('owner_user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as PlanGroup) ?? null
}

/**
 * Учасники групи: прийняті й ті, кого запросили. Власника в переліку немає —
 * він і так бачить себе зверху сторінки.
 */
export async function listMembers(groupId: string): Promise<PlanMember[]> {
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('plan_invites')
    .select('id, email, status, invited_at, accepted_at, expires_at')
    .eq('group_id', groupId)
    .in('status', ['pending', 'accepted'])
    .order('invited_at', { ascending: true })

  const now = Date.now()
  return (data ?? []).map((r: any) => ({
    inviteId: r.id,
    email: r.email,
    status: r.status,
    invitedAt: r.invited_at,
    acceptedAt: r.accepted_at,
    stale: r.status === 'pending' && new Date(r.expires_at).getTime() < now,
  }))
}

/**
 * Скільки місць зайнято, разом із власником.
 * Протухлі запрошення не рахуються — місце вже вільне.
 */
export async function seatsUsed(groupId: string): Promise<number> {
  const members = await listMembers(groupId)
  const live = members.filter((m) => !m.stale).length
  return live + 1 // +1 — власник
}

/**
 * Видати учаснику доступ: створити йому рядок у app_subscriptions.
 *
 * expires_at береться від ГРУПИ, не від учасника: доступ не може жити довше
 * за оплату власника. liqpay_order_id синтетичний і унікальний — колонка має
 * UNIQUE, і без значення два учасники однієї групи конфліктували б на NULL
 * у частині СУБД.
 */
export async function grantMemberAccess(
  group: PlanGroup,
  userId: string,
): Promise<string | null> {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('app_subscriptions')
    .insert({
      user_id: userId,
      status: 'active',
      plan: group.plan,
      source: 'group',
      plan_group_id: group.id,
      started_at: new Date().toISOString(),
      expires_at: group.expires_at,
      liqpay_order_id: `group_${group.id}_${userId}`,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[plan-groups] grant failed', group.id, userId, error)
    return null
  }
  return data?.id ?? null
}

/**
 * Зняти доступ, виданий групою. Прибираємо рядок ЗА subscription_id, а не за
 * user_id: у людини цілком може бути й власна оплачена підписка, і її чіпати
 * не можна.
 */
export async function revokeMemberAccess(subscriptionId: string | null): Promise<void> {
  if (!subscriptionId) return
  const db = getSupabaseAdmin()
  const { error } = await db
    .from('app_subscriptions')
    .delete()
    .eq('id', subscriptionId)
    .eq('source', 'group')
  if (error) console.error('[plan-groups] revoke failed', subscriptionId, error)
}

/**
 * Продовження оплати власником: посунути кінець дії групи і всіх виданих нею
 * підписок разом. Інакше учасники втратять доступ, хоча власник заплатив.
 */
export async function extendGroup(groupId: string, expiresAt: string): Promise<void> {
  const db = getSupabaseAdmin()
  await db.from('plan_groups').update({ expires_at: expiresAt }).eq('id', groupId)
  await db
    .from('app_subscriptions')
    .update({ expires_at: expiresAt })
    .eq('plan_group_id', groupId)
    .eq('source', 'group')
}
