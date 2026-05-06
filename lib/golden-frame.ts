import sharp from 'sharp'

// Applies Balabony golden frame to a generated cover image.
// Photo → 8px solid gold border (#ef9f27) → 70px cream canvas (#f2eff8)
export async function applyGoldenFrame(inputBuf: Buffer): Promise<Buffer> {
  return sharp(inputBuf)
    .extend({ top: 8, left: 8, right: 8, bottom: 8,
              background: { r: 0xef, g: 0x9f, b: 0x27 } })
    .extend({ top: 70, left: 70, right: 70, bottom: 70,
              background: { r: 0xf2, g: 0xef, b: 0xf8 } })
    .jpeg({ quality: 92 })
    .toBuffer()
}
