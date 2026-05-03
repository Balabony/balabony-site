'use client'

import React, { useState, useRef, useEffect } from 'react'

const TOTAL_SEC = 754
const STORY_TITLE = 'Синій блокнот (Серія 1)'
const STORY_URL = 'https://balabony.com'

// ============================================================
// АНАЛІТИКА — без персональних даних
// ============================================================
function trackEvent(event: string) {
  try {
    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, { event_category: 'balabony' })
    }
    // Простий локальний лічильник для звіту
    const key = `balabony_event_${event}`
    const count = parseInt(localStorage.getItem(key) || '0') + 1
    localStorage.setItem(key, String(count))
    console.log(`[Analytics] ${event}: ${count}`)
  } catch (e) {}
}

// Отримати статистику для звіту
function getStats() {
  const events = ['click_viber_share', 'click_call_grandchildren', 'click_write_children', 'click_sleep_timer', 'click_voice_message']
  return events.map(e => ({ event: e, count: parseInt(localStorage.getItem(`balabony_event_${e}`) || '0') }))
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return m + ':' + (sec < 10 ? '0' : '') + sec
}

function getViberUrl(title: string, url: string) {
  const text = encodeURIComponent(`Слухаю цікаву історію на Балабонях: ${title}. Приєднуйся: ${url}`)
  return `viber://forward?text=${text}`
}

const SPEEDS = [1.0, 1.25, 1.5, 2.0]
const SLEEP_OPTIONS = [null, 15, 30, 60]

function ViberIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4 0C5.5.3.6 5.4.6 11.4c0 2.1.6 4.2 1.6 6L.6 23.4l6.2-1.6c1.7.9 3.6 1.4 5.6 1.4 6 0 10.9-4.9 10.9-10.9S17.4 0 11.4 0zm5.5 16.4c-.3.8-1.4 1.5-2.3 1.6-.6.1-1.4.1-4.5-1.3-3.8-1.7-6.2-5.6-6.4-5.8-.2-.3-1.5-2-.1-3.5.4-.4.9-.6 1.3-.6h.3c.4 0 .6.1.9.7.3.7 1 2.5 1.1 2.7.1.2.2.4.1.6-.1.2-.2.4-.3.5-.1.2-.3.4-.4.5-.2.2-.4.4-.2.8.2.4.9 1.5 2 2.4 1.4 1.2 2.5 1.5 2.9 1.7.4.1.6.1.8-.1.2-.2.9-1 1.1-1.3.2-.3.4-.3.7-.2.3.1 2.1 1 2.4 1.2.3.2.6.3.7.4.1.3.1 1-.2 1.7z"/>
    </svg>
  )
}

function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

// ============================================================
// МОДУЛЬ 1: ВІДЕОДЗВІНОК ОНУКАМ (один клік!)
// ============================================================
function VideoCall({ phone }: { phone: string }) {
  const handleVideoCall = () => {
    trackEvent('click_video_call')
    if (phone) {
      window.open(`viber://contact?number=${phone}`, '_blank')
    }
  }

  if (!phone) return null

  return (
    <button
      onClick={handleVideoCall}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        background: 'linear-gradient(135deg, #7360f2, #a855f7)',
        color: '#fff', border: 'none',
        borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
        fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15,
        minHeight: 80, minWidth: 110,
        boxShadow: '0 4px 15px rgba(115,96,242,0.4)',
      }}
    >
      <span style={{ fontSize: 28 }}>📹</span>
      <span>Відеодзвінок</span>
      <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>онукам у Viber</span>
    </button>
  )
}

// ============================================================
// МОДУЛЬ: ЕКСТРЕНА ДОПОМОГА
// ============================================================
function EmergencyButtons({ sosPhone }: { sosPhone: string }) {
  const [confirm, setConfirm] = useState<string | null>(null)

  const call = (num: string) => {
    trackEvent(`click_emergency_${num}`)
    window.location.href = `tel:${num}`
    setConfirm(null)
  }

  const btnBase: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 4, border: 'none', borderRadius: 14, cursor: 'pointer',
    fontFamily: "'Montserrat', sans-serif", fontWeight: 800,
    color: '#fff', width: '100%', height: 72, padding: '8px 4px',
  }

  return (
    <>
      <div style={{
        padding: '6px 4%',
        background: 'rgba(220,38,38,0.08)',
        borderTop: '1px solid rgba(220,38,38,0.25)',
      }}>
        <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 5, letterSpacing: 1 }}>
          🆘 ЕКСТРЕНА ДОПОМОГА
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 6 }}>
          <button onClick={() => setConfirm('112')} style={{ ...btnBase, background: '#dc2626', boxShadow: '0 2px 12px rgba(220,38,38,0.4)', fontSize: 20, height: 54 }}>
            <span>🆘 <b>112</b></span>
            <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.9 }}>Екстрена</span>
          </button>
          <button onClick={() => setConfirm('103')} style={{ ...btnBase, background: '#b91c1c', fontSize: 17, height: 54 }}>
            <span>🚑 <b>103</b></span>
            <span style={{ fontSize: 9, opacity: 0.9 }}>Швидка</span>
          </button>
          <button onClick={() => setConfirm('102')} style={{ ...btnBase, background: '#1d4ed8', fontSize: 17, height: 54 }}>
            <span>🛡️ <b>102</b></span>
            <span style={{ fontSize: 9, opacity: 0.9 }}>Поліція</span>
          </button>
        </div>
        {sosPhone && (
          <a href={`tel:${sosPhone}`} onClick={() => trackEvent('click_emergency_sos')}
            style={{ ...btnBase, background: '#7360f2', fontSize: 14, textDecoration: 'none', width: '100%', height: 44, marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
            <span>❤️ <b>SOS Свої</b> — {sosPhone}</span>
          </a>
        )}
      </div>

      {/* Підтвердження виклику */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: '#1a2332', borderRadius: 24, padding: 32,
            width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 20,
          }}>
            <div style={{ fontSize: 56 }}>
              {confirm === '112' ? '🆘' : confirm === '103' ? '🚑' : confirm === '102' ? '🛡️' : '🚒'}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center' }}>
              Викликати {confirm === '103' ? 'Швидку допомогу' : confirm === '102' ? 'Поліцію' : confirm === '101' ? 'Рятувальників' : 'екстрену службу'}?
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#ef4444' }}>{confirm}</div>
            <button
              onClick={() => call(confirm)}
              style={{
                background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 14, padding: '18px', fontSize: 22, fontWeight: 800,
                cursor: 'pointer', width: '100%',
                fontFamily: "'Montserrat', sans-serif",
                boxShadow: '0 4px 20px rgba(220,38,38,0.5)',
              }}
            >
              ✅ ТАК, ВИКЛИКАТИ
            </button>
            <button
              onClick={() => setConfirm(null)}
              style={{
                background: '#334155', color: '#fff', border: 'none',
                borderRadius: 14, padding: '14px', fontSize: 18, fontWeight: 700,
                cursor: 'pointer', width: '100%',
                fontFamily: "'Montserrat', sans-serif",
              }}
            >
              ❌ НІ, СКАСУВАТИ
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// МОДУЛЬ: TELEGRAM BOT — «Голосовий привіт»
// ============================================================
// ВАЖЛИВО: Замінити BOT_TOKEN та BOT_USERNAME на реальні дані!
const BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || ''
const BOT_USERNAME = 'Balabony_auth_bot'

async function sendTelegramNotification(chatId: string, storyTitle: string) {
  const text = `🎧 Твоя бабуся зараз слухає казку «${storyTitle}» на Балабонях!\n\nМаєш вільну хвилинку подзвонити? ❤️\n\n👉 balabony.com`
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

function TelegramConnect({ storyTitle }: { storyTitle: string; fullWidth?: boolean }) {
  const [chatId, setChatId] = useState<string>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('balabony_tg_chat_id') || '' : ''
  )
  const [showSetup, setShowSetup] = useState(false)
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [step, setStep] = useState<'link' | 'waiting'>('link')

  const connectLink = `https://t.me/${BOT_USERNAME}?start=connect`

  const handleNotify = async () => {
    if (!chatId) { setShowSetup(true); return }
    trackEvent('click_telegram_notify')
    setSending(true)
    await sendTelegramNotification(chatId, storyTitle)
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  const handleConnected = () => {
    // Зберігаємо chat_id після підключення
    // В реальному боті chat_id приходить автоматично після /start
    const id = (document.getElementById('tg-chat-id') as HTMLInputElement)?.value
    if (id) {
      localStorage.setItem('balabony_tg_chat_id', id)
      setChatId(id)
      setShowSetup(false)
    }
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }
  const modalStyle: React.CSSProperties = {
    background: '#1a2332', borderRadius: 24, padding: 32,
    width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16,
  }

  return (
    <>
      <button
        onClick={handleNotify}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          background: sending ? '#1a6fa8' : sent ? '#0ea5e9' : '#229ED9',
          color: '#fff', border: 'none',
          borderRadius: 16, padding: '14px 18px', cursor: 'pointer',
          fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15,
          minHeight: 80, minWidth: 110,
          transition: 'background 0.2s',
        }}
      >
        {/* Telegram іконка */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.94-.92c-.64-.203-.658-.64.136-.954l11.49-4.43c.533-.194 1.002.13.838.858z"/>
        </svg>
        <span>{sent ? '✅ Надіслано!' : sending ? 'Надсилаю...' : 'Через Telegram'}</span>
        <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>
          {chatId ? 'Повідомити онука' : 'Підключити'}
        </span>
      </button>

      {/* Модальне вікно підключення */}
      {showSetup && (
        <div style={overlayStyle} onClick={() => setShowSetup(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontSize: 40 }}>✈️</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>
              Підключити Telegram онука
            </div>

            {step === 'link' ? (
              <>
                <div style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
                  <strong style={{ color: '#fff' }}>Крок 1:</strong> Перешліть онуку це посилання
                </div>
                <div style={{
                  background: '#0f172a', borderRadius: 12, padding: 16,
                  fontSize: 14, color: '#38bdf8', wordBreak: 'break-all',
                  fontFamily: 'monospace', textAlign: 'center',
                }}>
                  {connectLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(connectLink)
                    window.open(`https://t.me/share/url?url=${encodeURIComponent(connectLink)}&text=${encodeURIComponent('Натисни це посилання щоб я могла надсилати тобі привіти з Балабоні 💙')}`, '_blank')
                  }}
                  style={{
                    background: '#229ED9', color: '#fff', border: 'none',
                    borderRadius: 14, padding: '14px', fontSize: 18, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  📤 Переслати онуку
                </button>
                <div style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center' }}>
                  <strong style={{ color: '#fff' }}>Крок 2:</strong> Онук відкриє бота і натисне /start. Бот покаже йому <strong style={{ color: '#38bdf8' }}>ID підключення</strong>.
                </div>
                <button
                  onClick={() => setStep('waiting')}
                  style={{
                    background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                    borderRadius: 12, padding: '12px', fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Онук вже отримав ID →
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center' }}>
                  Введіть <strong style={{ color: '#fff' }}>ID підключення</strong> який показав бот онуку:
                </div>
                <input
                  id="tg-chat-id"
                  type="text"
                  placeholder="Наприклад: 123456789"
                  style={{
                    fontSize: 22, padding: '14px 16px', borderRadius: 12,
                    border: '2px solid #475569', background: '#0f1623', color: '#fff',
                    fontFamily: "'Montserrat', sans-serif", width: '100%', boxSizing: 'border-box',
                  }}
                  autoFocus
                />
                <button
                  onClick={handleConnected}
                  style={{
                    background: '#229ED9', color: '#fff', border: 'none',
                    borderRadius: 14, padding: '16px', fontSize: 20, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Montserrat', sans-serif",
                  }}
                >
                  ✅ Підключити
                </button>
                <button onClick={() => setStep('link')} style={{ background: 'transparent', color: '#64748b', border: 'none', fontSize: 14, cursor: 'pointer' }}>
                  ← Назад
                </button>
              </>
            )}

            <button onClick={() => { setShowSetup(false); setStep('link') }} style={{ background: 'transparent', color: '#475569', border: 'none', fontSize: 13, cursor: 'pointer' }}>
              Скасувати
            </button>
          </div>
        </div>
      )}
    </>
  )
}



// ============================================================
// МОДУЛЬ 2: ЗВ'ЯЗОК З РОДИНОЮ (Speed Dial)
// ============================================================
function FamilyDial() {
  const [viberPhone, setViberPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('balabony_viber_phone') || ''
    return ''
  })
  const [waPhone, setWaPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('balabony_wa_phone') || ''
    return ''
  })
  const [editingViber, setEditingViber] = useState(false)
  const [editingWa, setEditingWa] = useState(false)
  const [inputViber, setInputViber] = useState('')
  const [inputWa, setInputWa] = useState('')
  const [showStats, setShowStats] = useState(false)

  const saveViber = () => {
    const num = inputViber.replace(/\s/g, '')
    localStorage.setItem('balabony_viber_phone', num)
    setViberPhone(num)
    setEditingViber(false)
    trackEvent('click_call_grandchildren')
    window.open(`viber://chat?number=${num}`, '_blank')
  }

  const saveWa = () => {
    const num = inputWa.replace(/[^0-9]/g, '')
    localStorage.setItem('balabony_wa_phone', num)
    setWaPhone(num)
    setEditingWa(false)
    trackEvent('click_write_children')
    window.open(`https://wa.me/${num}`, '_blank')
  }

  const handleViberCall = () => {
    trackEvent('click_call_grandchildren')
    if (viberPhone) window.open(`viber://chat?number=${viberPhone}`, '_blank')
    else { setInputViber(''); setEditingViber(true) }
  }

  const handleWaChat = () => {
    trackEvent('click_write_children')
    if (waPhone) window.open(`https://wa.me/${waPhone}`, '_blank')
    else { setInputWa(''); setEditingWa(true) }
  }

  const btnStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 3, border: 'none', borderRadius: 12, cursor: 'pointer',
    padding: '6px 4px', width: '100%', height: 52, minWidth: 'unset',
    fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 12,
  }
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  }
  const modalStyle: React.CSSProperties = {
    background: '#1a2332', borderRadius: 24, padding: 32,
    width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 16,
  }
  const inputStyle: React.CSSProperties = {
    fontSize: 22, padding: '14px 16px', borderRadius: 12,
    border: '2px solid #475569', background: '#0f1623', color: '#fff',
    fontFamily: "'Montserrat', sans-serif", width: '100%', boxSizing: 'border-box',
  }

  return (
    <>
      <div style={{
        padding: '4px 4%', background: 'rgba(255,255,255,0.04)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textAlign: 'center', marginBottom: 4, letterSpacing: 1 }}>
          📞 РІДНІ
        </div>
        {/* Сітка 2x2 — всі однакові */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 4 }}>
          <button onClick={handleViberCall} style={{ ...btnStyle, background: '#7360f2', color: '#fff' }}>
            <ViberIcon size={22} />
            <span>Подзвонити онукам</span>
            {viberPhone && <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>{viberPhone}</span>}
          </button>
          <button onClick={handleWaChat} style={{ ...btnStyle, background: '#25D366', color: '#fff' }}>
            <WhatsAppIcon size={22} />
            <span>Написати дітям</span>
            {waPhone && <span style={{ fontSize: 9, opacity: 0.7, fontWeight: 400 }}>{waPhone}</span>}
          </button>
          <button
            onClick={() => { trackEvent('click_video_call'); if(viberPhone) { window.open(`viber://contact?number=${viberPhone}`, '_blank') } else { alert('Спочатку введіть номер онуків') } }}
            style={{ ...btnStyle, background: '#be185d', color: '#fff' }}
          >
            <span style={{ fontSize: 22 }}>📹</span>
            <span>Відеодзвінок</span>
            <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 400 }}>у Viber</span>
          </button>
          <TelegramConnect storyTitle={STORY_TITLE} />
        </div>
        {/* Нижній рядок */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {(viberPhone || waPhone) && (
            <button
              onClick={() => { localStorage.removeItem('balabony_viber_phone'); localStorage.removeItem('balabony_wa_phone'); setViberPhone(''); setWaPhone('') }}
              style={{ background: 'transparent', border: '1px solid #475569', color: '#64748b', borderRadius: 12, padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif" }}
            >✏️ Змінити номери</button>
          )}
        </div>
      </div>

      {/* Модальне вікно Viber */}
      {editingViber && (
        <div style={overlayStyle} onClick={() => setEditingViber(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}><ViberIcon size={40} /></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Номер онуків у Viber</div>
            <div style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center' }}>Введіть номер — збережеться автоматично</div>
            <input style={inputStyle} type="tel" placeholder="+380 XX XXX XX XX" value={inputViber} onChange={e => setInputViber(e.target.value)} autoFocus />
            <button onClick={saveViber} disabled={!inputViber} style={{ background: '#7360f2', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 20, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: inputViber ? 1 : 0.5 }}>
              Зберегти і подзвонити 📞
            </button>
            <button onClick={() => setEditingViber(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', fontSize: 14, cursor: 'pointer', padding: 8 }}>Скасувати</button>
          </div>
        </div>
      )}

      {/* Модальне вікно WhatsApp */}
      {editingWa && (
        <div style={overlayStyle} onClick={() => setEditingWa(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center' }}><WhatsAppIcon size={40} /></div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Номер дітей у WhatsApp</div>
            <div style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center' }}>Введіть номер — збережеться автоматично</div>
            <input style={inputStyle} type="tel" placeholder="+380 XX XXX XX XX" value={inputWa} onChange={e => setInputWa(e.target.value)} autoFocus />
            <button onClick={saveWa} disabled={!inputWa} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 20, fontWeight: 700, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", opacity: inputWa ? 1 : 0.5 }}>
              Зберегти і написати 💬
            </button>
            <button onClick={() => setEditingWa(false)} style={{ background: 'transparent', color: '#64748b', border: 'none', fontSize: 14, cursor: 'pointer', padding: 8 }}>Скасувати</button>
          </div>
        </div>
      )}

      {/* Модуль аналітики */}
      {showStats && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setShowStats(false)}>
          <div style={{ background: '#1a2332', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 20, textAlign: 'center' }}>
              📊 Аналітика Балабоні
            </div>
            {getStats().map(({ event, count }) => (
              <div key={event} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
                <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{event}</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#f59e0b' }}>{count}</span>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: 16, background: '#0f172a', borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Для грантового звіту:</div>
              <div style={{ fontSize: 16, color: '#10b981', fontWeight: 700 }}>
                З'єднано родин: {getStats().find(e => e.event === 'click_call_grandchildren')?.count || 0}
              </div>
            </div>
            <button onClick={() => setShowStats(false)} style={{ marginTop: 16, width: '100%', background: '#334155', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 16, cursor: 'pointer' }}>
              Закрити
            </button>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================
// ОСНОВНИЙ ПЛЕЄР
// ============================================================
export default function AudioPlayer() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speedIdx, setSpeedIdx] = useState(0)
  const [sleepIdx, setSleepIdx] = useState(0)
  const [viberTooltip, setViberTooltip] = useState(false)
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sleepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (playing) {
      const tick = () => {
        setProgress(p => {
          const next = Math.min(p + 100 / TOTAL_SEC / 10, 100)
          if (next < 100) rafRef.current = setTimeout(tick, 100)
          else setPlaying(false)
          return next
        })
      }
      rafRef.current = setTimeout(tick, 100)
    } else {
      if (rafRef.current) clearTimeout(rafRef.current)
    }
    return () => { if (rafRef.current) clearTimeout(rafRef.current) }
  }, [playing])

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const ratio = e.nativeEvent.offsetX / bar.offsetWidth
    setProgress(ratio * 100)
  }

  const cycleSpeed = () => setSpeedIdx(i => (i + 1) % SPEEDS.length)

  const cycleSleep = () => {
    trackEvent('click_sleep_timer')
    if (sleepTimerRef.current) clearTimeout(sleepTimerRef.current)
    const next = (sleepIdx + 1) % SLEEP_OPTIONS.length
    setSleepIdx(next)
    const mins = SLEEP_OPTIONS[next]
    if (mins !== null) {
      sleepTimerRef.current = setTimeout(() => {
        setPlaying(false)
        setSleepIdx(0)
      }, mins * 60000)
    }
  }

  const handleViber = () => {
    trackEvent('click_viber_share')
    window.open(getViberUrl(STORY_TITLE, STORY_URL), '_blank')
    setViberTooltip(true)
    setTimeout(() => setViberTooltip(false), 2000)
  }

  const currentSec = progress / 100 * TOTAL_SEC

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, width: '100%',
      background: 'var(--dark)', color: '#fff',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.3)', zIndex: 200,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Компактний мультифункціональний плеєр */}
      <div style={{ padding: '10px 4%', display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* 1. Кнопка відтворення */}
        <button
          onClick={() => setPlaying(p => !p)}
          aria-label={playing ? 'Пауза' : 'Відтворити'}
          style={{ width: 44, height: 44, background: 'var(--accent-gold)', borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          {playing ? (
            <div style={{ display: 'flex', gap: 3 }}>
              <span style={{ display: 'block', width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
            </div>
          ) : (
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '11px solid #fff', marginLeft: 2 }} />
          )}
        </button>

        {/* 2. Іконки зв'язку — без тексту, лише кольорові іконки */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {/* 💜 Viber #7360F2 */}
          <button
            onClick={() => {
              const p = typeof window !== 'undefined' ? localStorage.getItem('balabony_viber_phone') : null
              if (p) window.open(`viber://chat?number=${p}`, '_blank')
              else alert('Додайте номер онуків у блоці Рідні')
            }}
            title="Viber — Подзвонити онукам"
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#7360F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <ViberIcon size={16} />
          </button>

          {/* 💚 WhatsApp #25D366 */}
          <button
            onClick={() => {
              const wa = typeof window !== 'undefined' ? localStorage.getItem('balabony_wa_phone') : null
              if (wa) window.open(`https://wa.me/${wa}`, '_blank')
              else alert('Додайте номер у блоці Рідні')
            }}
            title="WhatsApp — Написати дітям"
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#25D366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <WhatsAppIcon size={16} />
          </button>

          {/* 💙 Telegram #229ED9 */}
          <button
            onClick={() => {
              const id = typeof window !== 'undefined' ? localStorage.getItem('balabony_tg_chat_id') : null
              const BOT_T = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || ''
              if (id && BOT_T) {
                fetch(`https://api.telegram.org/bot${BOT_T}/sendMessage`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: id, text: `🎧 Бабуся слухає «${STORY_TITLE}» на Балабонях! Зателефонуй? ❤️`, parse_mode: 'HTML' })
                }).then(() => alert('✅ Надіслано!'))
              } else alert('Підключіть Telegram у блоці Рідні')
            }}
            title="Telegram — Написати онуку"
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#229ED9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.17 13.667l-2.94-.92c-.64-.203-.658-.64.136-.954l11.49-4.43c.533-.194 1.002.13.838.858z"/>
            </svg>
          </button>

          {/* 🆘 SOS #DC2626 */}
          <button
            onClick={() => {
              const sos = typeof window !== 'undefined' ? localStorage.getItem('balabony_viber_phone') : null
              window.location.href = sos ? `tel:${sos}` : 'tel:112'
            }}
            title="SOS — збережений контакт або 112"
            style={{ width: 34, height: 34, borderRadius: '50%', background: '#DC2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}
          >
            🆘
          </button>
        </div>

        {/* 5. Швидкість */}
        <button onClick={cycleSpeed} style={{ fontSize: 11, fontWeight: 700, border: '1px solid #475569', color: '#94a3b8', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: 'transparent', fontFamily: "'Montserrat', sans-serif", flexShrink: 0 }}>
          {SPEEDS[speedIdx].toFixed(1)}×
        </button>

        {/* 6. Таймер сну */}
        <button onClick={cycleSleep} style={{ fontSize: 11, fontWeight: 700, border: '1px solid #475569', color: '#94a3b8', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', background: 'transparent', fontFamily: "'Montserrat', sans-serif", flexShrink: 0 }}>
          {SLEEP_OPTIONS[sleepIdx] === null ? '🌙' : `${SLEEP_OPTIONS[sleepIdx]}хв`}
        </button>

      </div>
    </div>
  )
}
