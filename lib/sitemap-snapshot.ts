import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

/* The sitemap's "last good" API lists (matches, teams, tournaments), kept on
   the server's disk so a rebuild that runs while the match API is down
   republishes the previous lists instead of a sitemap with no matches
   (SEO, 10 Nov 2026: the live sitemap briefly had 0 match URLs).

   golafly.com runs on its own server with `next start`, so the folder
   survives restarts and deploys (it is outside .next/, which a build
   replaces). SITEMAP_CACHE_DIR can move it. Every read and write is best
   effort: a disk problem never breaks the sitemap. */

const DIR = process.env.SITEMAP_CACHE_DIR || path.join(process.cwd(), '.sitemap-cache')

/** A saved list older than this is not reused (its matches may be over). */
export const SNAPSHOT_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000

interface Snapshot<T> {
  savedAt: number
  items: T[]
}

export async function readSnapshot<T>(name: string): Promise<Snapshot<T> | null> {
  try {
    const raw = JSON.parse(await readFile(path.join(DIR, `${name}.json`), 'utf8')) as Snapshot<T>
    if (!Array.isArray(raw?.items) || typeof raw.savedAt !== 'number') return null
    return raw
  } catch {
    return null // no file yet, or unreadable
  }
}

export async function writeSnapshot<T>(name: string, items: T[]): Promise<void> {
  try {
    await mkdir(DIR, { recursive: true })
    const file = path.join(DIR, `${name}.json`)
    const tmp = `${file}.${process.pid}.tmp`
    // Write then rename, so a reader never sees half a file.
    await writeFile(tmp, JSON.stringify({ savedAt: Date.now(), items } satisfies Snapshot<T>))
    await rename(tmp, file)
  } catch (err) {
    console.warn(`[sitemap] could not save ${name} snapshot: ${err instanceof Error ? err.message : String(err)}`)
  }
}
