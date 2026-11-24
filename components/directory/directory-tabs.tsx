'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/teams', label: 'Teams' },
  { href: '/tournaments', label: 'Tournaments' },
  { href: '/international', label: 'International' },
]

/** Teams / Tournaments / International sub-navigation shown above each
 *  directory page, as on the partner marketplace. */
export function DirectoryTabs() {
  const pathname = usePathname()
  return (
    <nav
      aria-label='Browse football tickets'
      className='border-b border-ticket-line/70 bg-background'
    >
      <div className='page-container flex justify-center gap-1 overflow-x-auto scrollbar-hide sm:gap-6'>
        {TABS.map((t) => {
          const active = pathname === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative shrink-0 px-3 py-3 text-[14px] uppercase tracking-wide transition-colors sm:text-[15px]',
                active
                  ? 'font-semibold text-brand-text after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
                  : 'text-ticket-ink hover:text-brand-text',
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
