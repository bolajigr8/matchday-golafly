'use client'

import { cn } from '@/lib/utils'

function Bar({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

/** Single hotel-card skeleton, matching the per-card pattern already used
 *  for FlightCardSkeleton in the builder — caller maps this in a loop,
 *  it doesn't bundle its own grid/sidebar (there isn't one in the builder). */
export function HotelCardSkeleton() {
  return (
    <div className='flex flex-col gap-2 rounded-2xl border border-border bg-card p-2 sm:flex-row'>
      <Bar className='h-52 w-full shrink-0 rounded-xl sm:h-auto sm:w-56' />
      <div className='flex-1 space-y-3 p-3 sm:p-4'>
        <Bar className='h-4 w-2/3' />
        <Bar className='h-3 w-1/2' />
        <div className='flex gap-1.5'>
          <Bar className='h-5 w-16 rounded-full' />
          <Bar className='h-5 w-12 rounded-full' />
        </div>
        <div className='flex justify-end pt-2'>
          <Bar className='h-9 w-32 rounded-full' />
        </div>
      </div>
    </div>
  )
}
