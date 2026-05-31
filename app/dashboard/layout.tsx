import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Matchday Dashboard',
    default: 'Dashboard | Matchday',
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <DashboardSidebar />
      <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
        <DashboardTopbar />
        <main className='flex-1 overflow-y-auto'>{children}</main>
      </div>
    </div>
  )
}
