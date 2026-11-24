// app/api/flyers/route.ts
//
// Lists the club images in /public/flyers, so the /matches page can use
// that folder as its source of truth: drop a file in, deploy, and it shows.
//
// `force-static` makes Next run this ONCE at build time and serve the
// result as a static file — no disk reads per request, and visitors make
// one tiny request instead of probing every club image. In `next dev` it
// runs on every request, so a newly added file shows up after a refresh.

import { readdir } from 'node:fs/promises'
import path from 'node:path'

export const dynamic = 'force-static'

const IMAGE = /\.(png|jpe?g|webp|avif)$/i

export async function GET() {
  let files: string[] = []
  try {
    files = (await readdir(path.join(process.cwd(), 'public', 'flyers')))
      .filter((f) => IMAGE.test(f))
      .sort()
  } catch {
    // No folder yet: every club falls back as if its image were missing.
  }
  return Response.json({ files })
}
