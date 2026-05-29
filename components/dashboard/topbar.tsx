'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { DASHBOARD_USER } from '@/store/dashboard'
import { openMobileSidebar } from '@/components/dashboard/sidebar'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Home',
  '/dashboard/tickets': 'Tickets',
  '/dashboard/travel': 'Travel',
  '/dashboard/inbox': 'Inbox',
  '/dashboard/rewards': 'Rewards',
  '/dashboard/profile': 'Profile',
  '/dashboard/payments': 'Payments',
  '/dashboard/settings': 'Settings',
}

export function DashboardTopbar() {
  const pathname = usePathname()
  const currentLabel = ROUTE_LABELS[pathname] ?? 'Dashboard'
  const isHome = pathname === '/dashboard'

  return (
    <header className='flex h-15 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6'>
      <div className='flex items-center gap-3'>
        {/* Hamburger — mobile only */}
        <button
          className='rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted md:hidden'
          onClick={() => openMobileSidebar()}
          aria-label='Open menu'
        >
          <Menu className='h-5 w-5' />
        </button>

        {/* Breadcrumb */}
        <nav className='flex items-center gap-1.5 font-mono text-[12px]'>
          <Link
            href='/dashboard'
            className='text-muted-foreground transition-colors hover:text-foreground'
          >
            Home
          </Link>
          {!isHome && (
            <>
              <ChevronRight className='h-3 w-3 text-muted-foreground' />
              <span className='font-semibold text-primary'>{currentLabel}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right controls */}
      <div className='flex items-center gap-3 sm:gap-4'>
        {/* Notification bell */}
        <button className='relative rounded-lg p-1.5 text-foreground transition-colors hover:bg-muted'>
          <Bell className='h-5 w-5' />
          <span className='absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-orange-500 font-mono text-[9px] font-bold text-white'>
            3
          </span>
        </button>

        {/* User */}
        <button className='flex items-center gap-2.5 rounded-xl px-2 py-1 transition-colors hover:bg-muted'>
          <div className='flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-amber-400 to-orange-500'>
            <span className='font-heading text-sm font-bold text-white'>A</span>
          </div>
          <div className='hidden text-left sm:block'>
            <p className='font-heading text-[13px] font-bold leading-tight text-foreground'>
              {DASHBOARD_USER.name}
            </p>
            <p className='font-mono text-[10px] leading-tight text-muted-foreground'>
              Fan since {DASHBOARD_USER.memberSince}
            </p>
          </div>
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        </button>
      </div>
    </header>
  )
}
