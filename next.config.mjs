/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
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
