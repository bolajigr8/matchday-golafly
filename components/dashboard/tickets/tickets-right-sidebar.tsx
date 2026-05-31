'use client'

import {
  BedDouble,
  Plane,
  Wifi,
  Car,
  Headphones,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react'

export function TicketsRightSidebar() {
  const addOns = [
    { icon: BedDouble, label: 'Hotels', sub: 'Find the best stays' },
    { icon: Plane, label: 'Flights', sub: 'Book your flights' },
    { icon: Wifi, label: 'eSIM', sub: 'Stay connected' },
    { icon: Car, label: 'Car Rental', sub: 'Drive your way' },
  ]

  return (
    <aside className='space-y-4'>
      {/* Upcoming trip */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='font-heading text-[14px] font-bold text-foreground'>
          Upcoming Trip
        </h3>
        <div className='mt-3 overflow-hidden rounded-xl border border-border'>
          <div className='bg-linear-to-br from-blue-900/60 to-blue-950/40 p-3'>
            <p className='font-heading text-sm font-bold text-foreground'>
              Barcelona
            </p>
            <p className='font-mono text-[10px] text-muted-foreground'>
              24 May – 27 May 2024
            </p>
          </div>
          <div
            className='h-24 bg-cover bg-center'
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=70)',
            }}
          />
        </div>
        <div className='mt-3 space-y-1.5'>
          {[
            { Icon: Calendar, label: '1 Match' },
            { Icon: Calendar, label: '2 Nights' },
            { Icon: Users, label: '1 Traveler' },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className='flex items-center gap-2 text-[12px] text-muted-foreground'
            >
              <Icon className='h-3.5 w-3.5 text-primary' />
              {label}
            </div>
          ))}
        </div>
        <button className='mt-3 flex w-full items-center justify-between rounded-xl bg-primary/10 px-4 py-2.5 font-heading text-[12px] font-bold text-primary transition-colors hover:bg-primary/20'>
          View Itinerary <ChevronRight className='h-4 w-4' />
        </button>
      </div>

      {/* Add to trip */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='font-heading text-[14px] font-bold text-foreground'>
          Add to your trip
        </h3>
        <p className='mt-0.5 text-[11px] text-muted-foreground'>
          Complete your journey
        </p>
        <div className='mt-3 space-y-2'>
          {addOns.map(({ icon: Icon, label, sub }) => (
            <button
              key={label}
              className='flex w-full items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:border-primary/30 hover:bg-muted/40'
            >
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10'>
                <Icon className='h-4 w-4 text-primary' />
              </div>
              <div className='flex-1 text-left'>
                <p className='font-heading text-[12px] font-bold text-foreground'>
                  {label}
                </p>
                <p className='text-[10px] text-muted-foreground'>{sub}</p>
              </div>
              <ChevronRight className='h-3.5 w-3.5 text-muted-foreground' />
            </button>
          ))}
        </div>
      </div>

      {/* Need help */}
      <div className='rounded-2xl border border-border bg-card p-4'>
        <h3 className='font-heading text-[14px] font-bold text-foreground'>
          Need help?
        </h3>
        <p className='mt-0.5 text-[12px] text-muted-foreground'>
          Our support team is here to help you 24/7.
        </p>
        <button className='mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 font-heading text-[12px] font-bold text-foreground transition-colors hover:border-primary/30'>
          <Headphones className='h-4 w-4' /> Contact Support
        </button>
      </div>
    </aside>
  )
}
