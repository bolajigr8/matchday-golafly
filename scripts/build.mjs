#!/usr/bin/env node
/* `npm run build` — runs `next build`, and on a small Linux server makes sure
 * it has the memory to finish.
 *
 * Why: the build needs about 2.2 GB at its peak (measured). On the deploy
 * server that is more than is free, so the kernel's out-of-memory killer stops
 * it ("Killed"), and the half-written .next left the site down.
 *
 * On Linux, when RAM + swap is under BUILD_MEMORY_MB (default 4096):
 *   - adds a temporary swap file for the build and removes it afterwards
 *     (needs root, or sudo without a password; otherwise it says so and
 *     builds anyway);
 *   - keeps the previous build aside and puts it back if the build fails.
 *
 * Everywhere else (Windows, macOS, CI with enough memory) it is plain
 * `next build`. Anything going wrong in the extra steps is reported and the
 * build still runs. Set BUILD_NO_SWAP=1 to skip the swap step. */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(root)

const NEED_MB = Number(process.env.BUILD_MEMORY_MB) || 4096
const SWAPFILE = '/swapfile-next-build'
const onLinux = process.platform === 'linux'

const log = (msg) => console.log(`==> ${msg}`)
const warn = (msg) => console.warn(`!! ${msg}`)

function memoryMb() {
  const info = readFileSync('/proc/meminfo', 'utf8')
  const kb = (key) => Number(info.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))?.[1] ?? 0)
  return Math.floor((kb('MemTotal') + kb('SwapTotal')) / 1024)
}

/* How to run a command as root: directly, through passwordless sudo, or not at all. */
function rootPrefix() {
  if (process.getuid?.() === 0) return []
  if (spawnSync('sudo', ['-n', 'true'], { stdio: 'ignore' }).status === 0) return ['sudo', '-n']
  return null
}

let swapPrefix = null // set while our swap file is in use

function asRoot(prefix, args, stdio = 'ignore') {
  const [cmd, ...rest] = [...prefix, ...args]
  return spawnSync(cmd, rest, { stdio }).status === 0
}

function removeSwap() {
  if (!swapPrefix) return
  log('Removing temporary swap')
  asRoot(swapPrefix, ['swapoff', SWAPFILE])
  asRoot(swapPrefix, ['rm', '-f', SWAPFILE])
  swapPrefix = null
}

function addSwapIfNeeded() {
  if (!onLinux || process.env.BUILD_NO_SWAP) return
  const have = memoryMb()
  if (have >= NEED_MB) return
  log(`Memory available to the build (RAM + swap): ${have} MB, wanted: ${NEED_MB} MB`)

  const prefix = rootPrefix()
  if (!prefix) {
    warn('Cannot add swap without root. If the build is killed, run it as root: sudo npm run build')
    return
  }

  // A swap file left behind by an earlier run that was interrupted.
  if (existsSync(SWAPFILE)) {
    asRoot(prefix, ['swapoff', SWAPFILE])
    asRoot(prefix, ['rm', '-f', SWAPFILE])
  }

  const add = NEED_MB - have
  const df = spawnSync('df', ['-Pm', '/'], { encoding: 'utf8' })
  const freeDisk = Number(df.stdout?.trim().split('\n')[1]?.split(/\s+/)[3] ?? 0)
  if (freeDisk < add + 1024) {
    warn(`Not enough disk for ${add} MB of swap (${freeDisk} MB free on /). Building without it.`)
    return
  }

  log(`Adding ${add} MB of temporary swap at ${SWAPFILE}`)
  const created =
    asRoot(prefix, ['fallocate', '-l', `${add}M`, SWAPFILE]) ||
    asRoot(prefix, ['dd', 'if=/dev/zero', `of=${SWAPFILE}`, 'bs=1M', `count=${add}`, 'status=none'])
  const on =
    created &&
    asRoot(prefix, ['chmod', '600', SWAPFILE]) &&
    asRoot(prefix, ['mkswap', SWAPFILE]) &&
    asRoot(prefix, ['swapon', SWAPFILE])
  if (!on) {
    warn('Could not turn the swap file on (not allowed here?). Building without it.')
    asRoot(prefix, ['rm', '-f', SWAPFILE])
    return
  }
  swapPrefix = prefix
  log(`Now: ${memoryMb()} MB`)
}

/* Keep the last good build so a failed build can be undone. Linux only: on a
   dev machine .next also holds the dev server's cache. */
let keptPrevious = false
function keepPreviousBuild() {
  if (!onLinux) return
  rmSync('.next-prev', { recursive: true, force: true })
  if (existsSync('.next')) {
    renameSync('.next', '.next-prev')
    keptPrevious = true
  }
}

function restorePreviousBuild() {
  if (!keptPrevious) return
  rmSync('.next', { recursive: true, force: true })
  renameSync('.next-prev', '.next')
  warn('Put the previous build back. Restart the app to keep serving the old version.')
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    removeSwap()
    process.exit(1)
  })
}

try {
  addSwapIfNeeded()
} catch (error) {
  warn(`Swap step skipped: ${error.message}`)
}
try {
  keepPreviousBuild()
} catch (error) {
  warn(`Could not set the previous build aside: ${error.message}`)
}

const next = createRequire(import.meta.url).resolve('next/dist/bin/next')
const build = spawnSync(process.execPath, [next, 'build', ...process.argv.slice(2)], { stdio: 'inherit' })

try {
  removeSwap()
} catch (error) {
  warn(`Could not remove ${SWAPFILE}: ${error.message}`)
}

if (build.status === 0) {
  if (keptPrevious) rmSync('.next-prev', { recursive: true, force: true })
  process.exit(0)
}

warn(
  build.signal
    ? `Build was stopped by ${build.signal}${build.signal === 'SIGKILL' ? ' — the server ran out of memory' : ''}.`
    : `Build failed (exit ${build.status}).`,
)
try {
  restorePreviousBuild()
} catch (error) {
  warn(`Could not put the previous build back: ${error.message}`)
}
process.exit(build.status ?? 1)
