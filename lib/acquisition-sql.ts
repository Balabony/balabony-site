/**
 * Канал першого дотику з user_acquisition — одним SQL-підзапитом.
 *
 * Дає рядки (id, channel, landing):
 *   id      — user_id як текст (акаунт або анонімний cookie);
 *   channel — facebook / google / telegram / instagram / viber / tiktok /
 *             прямий / хост іншого сайту / значення utm_source;
 *   landing — перша сторінка без параметрів.
 *
 * На id акаунта джерело переноситься при вході лише з 16.09.2026
 * (lib/reader-id.ts, mergeAnonInto). У кого рядка немає — «невідомо»,
 * а не «прямий»: ми просто не знаємо.
 *
 * String.raw — щоб «\.» у регулярних виразах дійшов до Postgres як є.
 */
export const ACQUISITION_CHANNEL_SQL = String.raw`
  select id, landing,
         case
           when raw is null                             then 'інше'
           when raw ~ '(facebook|^fb$|^fb\.)'           then 'facebook'
           when raw ~ '(instagram|^ig$)'                then 'instagram'
           -- пошта ДО google: mail.google.com і com.google.android.gm (див. lib/channel.ts)
           when raw ~ '(ukr\.net|mail\.google\.|\.gm$|outlook\.|live\.com|^i\.ua$|mail|email|newsletter)' then 'пошта'
           when raw ~ '(^|\.)google\.' or raw = 'google' then 'google'
           when raw ~ '(telegram|^t\.me$|^tg$)'         then 'telegram'
           when raw ~ 'viber'                           then 'viber'
           when raw ~ 'tiktok'                          then 'tiktok'
           when raw ~ 'storriss'                        then 'storriss'
           when raw = 'ref'                             then 'запрошення'
           when raw ~ 'balabony'                        then 'прямий'
           else regexp_replace(raw, '^(www|m|l|lm|mobile)\.', '')
         end as channel
    from (
      select a.user_id::text as id,
             case
               when coalesce(a.utm_source, '') <> '' then lower(a.utm_source)
               when coalesce(a.referrer, '') = ''    then 'прямий'
               else lower(substring(a.referrer from '^https?://([^/:?#]+)'))
             end as raw,
             nullif(split_part(coalesce(a.landing_path, ''), '?', 1), '') as landing
        from user_acquisition a
    ) s
`
