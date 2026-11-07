// 07.11.2026: спільне стискання фото в браузері. Сервер (Vercel) приймає до 4,5 МБ на запит,
// а фото з телефона часто 5–12 МБ — без стискання завантаження падало з «Немає звʼязку».
// Для документів (пільги) лишаємо більшу роздільність, щоб редактор міг прочитати текст.
export async function shrinkImage(file: File, maxSide = 2000, quality = 0.88): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  if (okType && file.size <= 2 * 1024 * 1024) return file
  let bmp: ImageBitmap
  try {
    bmp = await createImageBitmap(file)
  } catch {
    throw new Error('Не вдалося відкрити фото. Збережіть його як JPG і спробуйте ще раз.')
  }
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * k)
  c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/jpeg', quality))
  if (!blob) throw new Error('Не вдалося стиснути фото. Спробуйте інше зображення.')
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}
