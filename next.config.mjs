/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Тільки WebP. Раніше стояло ['image/avif', 'image/webp'] — і кожна
    // картинка перетворювалася двічі: окремо в AVIF, окремо у WebP.
    // Це подвоювало витрату ліміту трансформацій.
    formats: ['image/webp'],

    // Явний перелік розмірів. Без нього Next бере свої типові вісім
    // deviceSizes і вісім imageSizes — до шістнадцяти варіантів на одну
    // картинку. Тут лишені тільки потрібні ширини з огляду на sizes
    // у компонентах: 60px, 96px, 320px, 360px, 400px і 100vw на
    // мобільному, з урахуванням екранів 2x.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],

    // Одна якість. Кожне інше значення quality — окрема трансформація.
    qualities: [75],

    // Тридцять днів кешу перетвореної картинки.
    minimumCacheTTL: 2592000,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'swwzsrtbfjsdsmpgfpsk.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'storriss.com',
      },
      {
        protocol: 'https',
        hostname: 'www.storriss.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff|woff2|mp3|mp4)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}
export default nextConfig
