'use client'

import { useState } from 'react'
import { trackStoryEvent } from '@/lib/analytics'

interface Props { url: string; title: string }

function FBIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.932-1.956 1.889v2.261h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg> }
function TGIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> }
function WAIcon()     { return <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> }
function ViberIcon()  { return <svg width="13" height="13" viewBox="0 0 32 32" fill="#fff"><path d="M16 1C7.7 1 1 7.7 1 16s6.7 15 15 15 15-6.7 15-15S24.3 1 16 1zm5.3 20.7c-.5.5-1 .8-1.7.9-.4.1-.8 0-1.1-.2-1.4-.7-2.7-1.6-3.8-2.7-1.1-1.1-2-2.4-2.7-3.8-.3-.6-.4-1.2-.1-1.8.2-.4.5-.8.8-1.1l1-1c.3-.3.7-.3.9 0l1.5 1.9c.2.3.2.7-.1.9l-.7.7c-.1.1-.1.3 0 .4.5.9 1.2 1.6 2 2.1.1.1.3.1.4 0l.7-.7c.3-.3.7-.3.9-.1l1.9 1.5c.3.3.3.7 0 1l-.9.9z"/></svg> }
function LinkIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> }
function CheckIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
function TikTokIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.79 1.52V6.74a4.85 4.85 0 01-1.03-.05z"/></svg> }

const BTNS = [
  { label: 'Facebook', bg: '#1877F2', Icon: FBIcon,    href: (u: string)              => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { label: 'Telegram', bg: '#229ED9', Icon: TGIcon,    href: (u: string, t: string)   => `https://t.me/share/url?url=${u}&text=${t}` },
  { label: 'WhatsApp', bg: '#25D366', Icon: WAIcon,    href: (u: string, t: string)   => `https://wa.me/?text=${t}%20${u}` },
  { label: 'Viber',    bg: '#7360F2', Icon: ViberIcon,  href: (u: string, t: string)   => `viber://forward?text=${t}%20${u}` },
  { label: 'TikTok',   bg: '#010101', Icon: TikTokIcon, href: (u: string, _t: string)  => `https://www.tiktok.com/share?url=${u}` },
]

export default function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false)
  const eu = encodeURIComponent(url)
  const et = encodeURIComponent(title)

  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
      {BTNS.map(({ label, bg, Icon, href }) => (
        <a
          key={label}
          href={href(eu, et)}
          target="_blank"
          rel="noopener noreferrer"
          title={label}
          onClick={() => trackStoryEvent(url, title, 'share')}
          style={{ width: 26, height: 26, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
        >
          <Icon />
        </a>
      ))}
      <button onClick={copy} title="Копіювати посилання"
        style={{ width: 26, height: 26, borderRadius: '50%', background: copied ? '#22c55e' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
        {copied ? <CheckIcon /> : <LinkIcon />}
      </button>
    </div>
  )
}
