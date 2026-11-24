// lib/email/fonts.ts — Space Grotesk (the email design's typeface, SIL Open
// Font License) for the email images drawn on the server. Read once per
// server process.

import { readFile } from 'node:fs/promises'
import path from 'node:path'

type Font = { name: string; data: ArrayBuffer; weight: 500 | 700; style: 'normal' }

let cached: Promise<Font[]> | null = null

export function emailFonts(): Promise<Font[]> {
  cached ??= Promise.all(
    ([500, 700] as const).map(async (weight) => {
      const buf = await readFile(
        path.join(process.cwd(), 'lib', 'email', 'fonts', `space-grotesk-latin-${weight}-normal.woff`),
      )
      const data = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer
      return { name: 'Space Grotesk', data, weight, style: 'normal' as const }
    }),
  ).catch((e) => {
    cached = null
    throw e
  })
  return cached
}
