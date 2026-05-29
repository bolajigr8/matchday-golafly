'use client'

import { TicketsMainColumn } from '@/components/dashboard/tickets/tickets-main-column'
import { TicketsRightSidebar } from '@/components/dashboard/tickets/tickets-right-sidebar'

export function TicketsClient() {
  return (
    <div className='p-6'>
      {/* Page heading */}
      <div className='mb-6'>
        <h1 className='font-heading text-2xl font-bold text-foreground'>
          My Tickets
        </h1>
        <p className='mt-1 text-[13px] text-muted-foreground'>
          View and manage all your match tickets in one place.
        </p>
      </div>

      <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]'>
        <TicketsMainColumn />
        <TicketsRightSidebar />
      </div>
    </div>
  )
}
