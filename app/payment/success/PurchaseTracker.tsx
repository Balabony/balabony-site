'use client'

import { useEffect } from 'react'

/**
 * Подія покупки — саме тут, а не на кнопці.
 *
 * Сторінка відкривається лише після того, як LiqPay провів платіж і повернув
 * користувача назад. Раніше подія purchase слалася в момент натискання
 * «Оплатити», тож у звіти потрапляли всі, хто передумав уже на сторінці
 * банку.
 *
 * Суму беремо з sessionStorage: LiqPay повертає людину без параметрів
 * запиту, а сторінка серверна й самої угоди не знає. Ключ одразу
 * прибираємо, інакше повторне відкриття сторінки з історії браузера
 * порахувало б покупку вдруге.
 *
 * Джерелом істини для грошей лишається вебхук: він пише в app_subscriptions
 * і revenue_events після перевірки підпису. Ця подія потрібна рекламним
 * кабінетам, які бачать лише браузер.
 */
export default function PurchaseTracker() {
  useEffect(() => {
    try {
      const amount = window.sessionStorage.getItem('bb_pending_amount')
      if (!amount) return

      const method = window.sessionStorage.getItem('bb_pending_method') ?? 'liqpay'
      window.sessionStorage.removeItem('bb_pending_amount')
      window.sessionStorage.removeItem('bb_pending_method')

      const gtag = (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag
      if (typeof gtag === 'function') {
        gtag('event', 'purchase', {
          currency: 'UAH',
          value: Number(amount) || 0,
          payment_type: method,
        })
      }
    } catch {
      // Аналітика не має ламати сторінку подяки.
    }
  }, [])

  return null
}
