// Єдине джерело правди для оформлення лід-абзацу (зачину) в усіх читалках.
//
// Лід — це перший абзац нарації. Він трохи більший, білий і напівжирний:
// журнальний прийом, за який чіпляється око на початку тексту.
// Кольором (золотом) не виділяємо навмисно — золото на сайті означає
// керування: кнопки, меню, посилання, імена персонажів у репліках.
//
// Базовий кегль у читалках різний (історії 18px, «Тиша» 17px, серії 16px),
// тому правило задане ВІДНОСНО бази, а не абсолютним числом. Так стрибок
// виглядає однаково скрізь.
//
// На репліку («Панас: …») лід не ставимо: там уже є золоте імʼя, другий
// акцент поруч перевантажив би рядок. За це відповідає виклик у читалці.

/** На скільки пікселів лід більший за основний текст. */
export const LEAD_SIZE_BUMP = 2

/** Спільні властивості ліду, окрім розміру. */
export const LEAD_COLOR = '#fff'
export const LEAD_WEIGHT = 500
export const LEAD_LINE_HEIGHT = 1.6
export const LEAD_MARGIN_BOTTOM = 20

/**
 * CSS-декларації ліду для читалок, що вставляють <style> у розмітку
 * (/episodes, /tysha).
 * @param baseFontSizePx базовий кегль основного тексту цієї читалки
 */
export function leadCssDeclarations(baseFontSizePx: number): string {
  return [
    `font-size:${baseFontSizePx + LEAD_SIZE_BUMP}px`,
    `line-height:${LEAD_LINE_HEIGHT}`,
    `color:${LEAD_COLOR}`,
    `font-weight:${LEAD_WEIGHT}`,
    `margin-bottom:${LEAD_MARGIN_BOTTOM}px`,
  ].join(';')
}

/**
 * Інлайн-стиль ліду для читалки, що збирає абзаци поштучно (/stories).
 * @param baseFontSizePx базовий кегль основного тексту цієї читалки
 */
export function leadInlineStyle(baseFontSizePx: number): string {
  return `margin:0 0 ${LEAD_MARGIN_BOTTOM}px 0;${[
    `font-size:${baseFontSizePx + LEAD_SIZE_BUMP}px`,
    `line-height:${LEAD_LINE_HEIGHT}`,
    `color:${LEAD_COLOR}`,
    `font-weight:${LEAD_WEIGHT}`,
  ].join(';')}`
}

/**
 * Максимальна довжина першого абзацу, який ще має сенс подавати лідом.
 * Понад це — зачин перестає бути зачином: збільшений і напівжирний текст
 * на пів екрана читається як помилка верстки, а не як акцент. Такий абзац
 * лишаємо звичайним. Поріг приблизно дорівнює пʼятьом рядкам на десктопі.
 */
export const LEAD_MAX_CHARS = 400

/** Чи годиться цей абзац на лід за довжиною. */
export function fitsLead(paragraph: string): boolean {
  return paragraph.trim().length <= LEAD_MAX_CHARS
}
