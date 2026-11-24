'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Binoculars,
  Bell,
  Briefcase,
  ChevronsUpDown,
  CreditCard,
  Crown,
  FileText,
  GraduationCap,
  Hotel,
  LifeBuoy,
  Layers,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Ticket,
  TicketCheck,
  User,
} from 'lucide-react'
import { BriefcaseBusiness, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Routes } from '@/routes'
import { useAdminLogout, useAdminMe } from '@/features/admin/hooks'
import { getAdminUser, initialsFor } from '@/features/admin/session'

/* The admin shell has NO top bar. Everything a global bar would carry lives
   here instead, in five zones top-to-bottom:
     1 brand + ADMIN pill (also the environment badge)
     2 ⌘K search trigger — a button dressed as an input
     3 nav, with counts on the items being counted
     4 utility: notifications, rail collapse, theme
     5 user, whose popover opens UPWARD (nothing above to drop from)
   The breadcrumb and page actions live in AdminPageHeader, inside the pane. */

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
}

function MenuItem({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode
  label: string
  href: string
}) {
  return (
    <Link
      href={href}
      className='flex h-[30px] items-center gap-2.5 rounded-md px-2.5 text-[12.5px] text-foreground transition-colors hover:bg-accent [&>svg]:text-muted-foreground'
    >
      {icon}
      {label}
    </Link>
  )
}

const NAV: NavItem[] = [
  { href: Routes.adminDashboard, label: 'Dashboard', icon: LayoutDashboard },
  /* Second, under Dashboard: match tickets are the largest revenue stream.
     Everything below keeps the position it already had, so nobody has to
     relearn the nav. Deliberately ONE FLAT LIST — grouping these under
     MATCHDAY / CAMPS / TRAVEL headings was tried and dropped; twelve items
     do not need four headings to be findable. */
  // { href: Routes.adminTickets, label: "Tickets", icon: Ticket },
  { href: Routes.adminOrders, label: 'Orders', icon: ShoppingBag },

  { href: Routes.adminMatchTickets, label: 'MatchTickets', icon: TicketCheck },
  /* VIP packages sit with match tickets: a package is built on one. */
  { href: Routes.adminVipPackages, label: 'VIP packages', icon: Crown },
  { href: Routes.adminOffers, label: 'Offers', icon: Briefcase, count: 42 },
  { href: Routes.adminPrograms, label: 'Programs', icon: Layers },
  { href: Routes.adminAcademy, label: 'Academy', icon: GraduationCap },
  { href: Routes.adminPlayers, label: 'Players', icon: Users },
  { href: Routes.adminScouts, label: 'Scouts', icon: Binoculars },
  { href: Routes.adminInternships, label: 'Internships', icon: BriefcaseBusiness },
  // { href: Routes.adminTransactions, label: 'Transactions', icon: CreditCard },
  /* Travel products. Orders is the flight/eSIM/stays order book; Transactions
     above is programme and offer money — different businesses, same backend. */
  { href: Routes.adminOperations, label: 'Operations', icon: Hotel },
  /* Booking resolution: paid flight / hotel / eSIM bookings waiting on CS. */
  { href: Routes.adminActionRequired, label: 'Action required', icon: LifeBuoy },
  /* API merchants sell flights and eSIMs through the API — travel, so it
     sits with Orders and Operations. */
  { href: Routes.adminMerchants, label: 'Merchants', icon: Store },
  // {
  //   href: Routes.adminPartnerApplications,
  //   label: 'Partner Apps',
  //   icon: FileText,
  //   count: 7,
  // },
  { href: Routes.adminSettings, label: 'Settings', icon: Settings },
]

export function AdminSidebar({
  collapsed,
  onToggleCollapsed,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
}) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()

  /* resolvedTheme is undefined during SSR, so marking a segment active before
     mount is a guaranteed hydration mismatch. Render both segments neutral on
     the server and light them up once we know the real theme. */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  const isLight = mounted && resolvedTheme !== 'dark'

  const [menuOpen, setMenuOpen] = useState(false)
  const logout = useAdminLogout()
  const { data: me } = useAdminMe()

  /* Cookie first so the name is right on the very first paint, then /me once
     it lands. Reading the cookie during render would mismatch on the server,
     hence the same mounted guard. */
  const cached = mounted ? getAdminUser() : null
  const admin = me?.data?.admin ?? cached
  const displayName = admin?.name ?? 'Admin'
  const displayRole = admin?.role ?? 'Admin'
  const initials = admin?.name ? initialsFor(admin.name) : 'GA'

  return (
    /* border-r, not a box-shadow. The shadow was being drawn per stacking
       context and started level with the nav instead of at the top of the
       rail; a real border on an h-full element spans top to bottom, full
       stop. */
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col border-r border-[var(--edge)] bg-sidebar lg:flex',
        collapsed ? 'w-[72px]' : 'w-[280px]',
      )}
    >
      {/* 1 — Brand */}
      <div className={cn('p-3', collapsed && 'flex justify-center')}>
        <Link href={Routes.adminDashboard} className='flex items-center gap-2'>
          <span className='font-heading text-[15px] font-semibold tracking-tight text-sidebar-foreground'>
            {collapsed ? 'GF' : 'GOLAFLY'}
          </span>
          {!collapsed && (
            <span className='rounded-full px-[7px] py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-[0_0_0_1px_var(--edge)]'>
              Admin
            </span>
          )}
        </Link>
      </div>

      {/* 2 — Nav */}
      {/* No overflow-y-auto: eight items never outgrow the viewport, and the
          scroll container it created was drawing an edge of its own. */}
      <nav className='flex flex-1 flex-col gap-px p-2'>
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex h-8 items-center gap-2.5 rounded-md text-[12.5px] transition-colors',
                collapsed ? 'w-8 justify-center self-center px-0' : 'px-2.5',
                active
                  ? 'bg-sidebar-accent font-semibold text-brand-text'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
              title={collapsed ? item.label : undefined}
            >
              {/* The 2px bar may be raw lime — it is a fill. The label beside
                  it may not, so it uses --brand-text. */}
              {active && (
                <span className='absolute inset-y-[7px] left-0 w-0.5 rounded-full bg-brand' />
              )}
              <Icon className='size-[15px] shrink-0' />
              {!collapsed && item.label}
              {!collapsed && item.count != null && (
                <span
                  className={cn(
                    'ml-auto rounded-full px-1.5 py-px font-mono text-[9.5px] font-semibold tabular-nums text-muted-foreground',
                    active ? 'bg-background' : 'bg-sidebar-accent',
                  )}
                >
                  {item.count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* 4 — Utility */}
      <div
        className={cn('flex items-center gap-1 p-3', collapsed && 'flex-col')}
      >
        <button
          type='button'
          className='relative flex size-[30px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'
          aria-label='Notifications'
        >
          <Bell className='size-[15px]' />
          <span className='absolute right-1.5 top-1.5 size-[5px] rounded-full bg-brand ring-2 ring-sidebar' />
        </button>
        <button
          type='button'
          onClick={onToggleCollapsed}
          className='flex size-[30px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground'
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className='size-[15px]' />
          ) : (
            <PanelLeftClose className='size-[15px]' />
          )}
        </button>
        {!collapsed && (
          <span className='ml-auto inline-flex overflow-hidden rounded-md shadow-[0_0_0_1px_var(--edge)]'>
            <button
              type='button'
              onClick={() => setTheme('light')}
              className={cn(
                'flex h-[26px] w-7 items-center justify-center transition-colors',
                isLight
                  ? 'bg-sidebar-accent text-brand-text'
                  : 'text-muted-foreground',
              )}
              aria-label='Light theme'
            >
              <Sun className='size-[13px]' />
            </button>
            <button
              type='button'
              onClick={() => setTheme('dark')}
              className={cn(
                'flex h-[26px] w-7 items-center justify-center transition-colors',
                isDark
                  ? 'bg-sidebar-accent text-brand-text'
                  : 'text-muted-foreground',
              )}
              aria-label='Dark theme'
            >
              <Moon className='size-[13px]' />
            </button>
          </span>
        )}
      </div>

      {/* 5 — User. Popover opens UPWARD; there is nothing above to drop from. */}
      <div
        className={cn('relative p-3 pt-0', collapsed && 'flex justify-center')}
      >
        {menuOpen && (
          <>
            <button
              type='button'
              aria-label='Close menu'
              onClick={() => setMenuOpen(false)}
              className='fixed inset-0 z-10 cursor-default'
            />
            <div className='absolute bottom-full left-3 right-3 z-20 mb-1 rounded-xl bg-popover p-1.5 shadow-[0_0_0_1px_var(--edge-strong),var(--lift-3)]'>
              <div className='border-b border-[var(--edge)] px-2 pb-2 pt-1.5'>
                <p className='text-[11px] text-muted-foreground'>
                  Signed in as
                </p>
                <p className='mt-0.5 truncate text-xs font-semibold'>
                  {admin?.email ?? '—'}
                </p>
              </div>
              <MenuItem
                icon={<User className='size-3.5' />}
                label='Profile'
                href={Routes.adminSettings}
              />
              <MenuItem
                icon={<Settings className='size-3.5' />}
                label='Settings'
                href={Routes.adminSettings}
              />
              <button
                type='button'
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className='flex h-[30px] w-full items-center gap-2.5 rounded-md px-2.5 text-[12.5px] text-destructive transition-colors hover:bg-accent disabled:opacity-50'
              >
                <LogOut className='size-3.5' />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </>
        )}

        <button
          type='button'
          onClick={() => setMenuOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-sidebar-accent',
            collapsed ? '' : 'w-full',
          )}
        >
          <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-brand font-mono text-[10px] font-semibold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]'>
            {initials}
          </span>
          {!collapsed && (
            <>
              <span className='min-w-0 text-left'>
                <span className='block truncate text-xs font-semibold leading-tight text-sidebar-foreground'>
                  {displayName}
                </span>
                <span className='mt-0.5 block truncate font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground'>
                  {displayRole}
                </span>
              </span>
              <ChevronsUpDown className='ml-auto size-[13px] shrink-0 text-muted-foreground' />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
