import { cookies } from 'next/headers'
import { dbQuery } from '@/lib/db'

/**
 * Сесія редактора конкурсу.
 *
 * ЧОМУ ОКРЕМО ВІД АДМІНКИ. Єдиний вхід, який був у проєкті, — /admin/login
 * проти ADMIN_PASSWORD, і він відкриває договори, реквізити виплат і базу
 * підписників. Дати редакторові цей пароль означало б роздати всю адмінку.
 * Тому окрема cookie, окрема таблиця сесій, окремий набір прав: редактор
 * бачить лише свої призначені роботи.
 *
 * ЧОМУ БЕЗ ПАРОЛЯ. Одноразове посилання на пошту, той самий підхід, що для
 * читачів. Пароль довелося б видавати, зберігати й відкликати вручну, а
 * посилання протухає саме.
 *
 * ОДНА КОЛОНКА expires_at НА ДВА СТРОКИ. Поки посилання не використане,
 * expires_at — це строк посилання (година). Після переходу за ним рядок
 * переписується: token_used_at заповнюється, з'являється session_token,
 * а expires_at відсувається на строк сесії. Так один рядок описує весь
 * шлях від листа до виходу, і немає другої таблиці, яку треба чистити.
 */

export const EDITOR_COOKIE = 'editor_session'

/** Скільки живе посилання з листа. */
export const LOGIN_LINK_MINUTES = 60

/** Скільки живе сесія після входу. */
export const SESSION_DAYS = 30

export interface EditorIdentity {
  id: number
  name: string
  email: string
}

/**
 * Хто зайшов — за токеном сесії.
 *
 * Прострочені сесії не видаляються, а просто перестають проходити умову
 * expires_at > now(): рядок лишається як слід у журналі, хто і коли заходив.
 */
export async function getEditorByToken(token: string | undefined | null): Promise<EditorIdentity | null> {
  if (!token) return null

  const res = await dbQuery(
    `select e.id, e.name, e.email
       from editor_sessions s
       join editors e on e.id = s.editor_id
      where s.session_token = $1
        and s.expires_at > now()
      limit 1`,
    [token],
  )

  return res.rowCount ? (res.rows[0] as EditorIdentity) : null
}

/** Те саме, але для серверних сторінок — cookie бере сам. */
export async function getEditor(): Promise<EditorIdentity | null> {
  const store = await cookies()
  return getEditorByToken(store.get(EDITOR_COOKIE)?.value)
}
