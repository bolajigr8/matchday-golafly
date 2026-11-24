'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { useHydrated } from '@/hooks/use-hydrated'

/* Light / dark switch for headers that don't carry the main navbar (the
   checkout header, the auth screens, the fan and player dashboards). Same
   button as the navbar's: round, 36px, sun in dark mode, moon in light.
   The saved theme lives in localStorage, which the server can't see, so the
   icon is only picked once hydrated — both renders agree until then. */

export function ThemeToggle({
  className,
  withLabel,
}: {
  className?: string
  /** Show "Light mode" / "Dark mode" beside the icon (sidebar rows). */
  withLabel?: boolean
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHydrated()
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <button
      type='button'
      onClick={() => mounted && setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-foreground/75 transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        withLabel ? 'gap-3' : 'size-9 rounded-full',
        className,
      )}
    >
      {isDark ? (
        <Sun aria-hidden className='size-[18px] shrink-0' strokeWidth={1.75} />
      ) : (
        <Moon aria-hidden className='size-[18px] shrink-0' strokeWidth={1.75} />
      )}
      {withLabel && (isDark ? 'Light mode' : 'Dark mode')}
    </button>
  )
}
