import { Fragment, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* Booking-flow section card (Figma Extras "Flights" / "Hotel" / "VIP
   extras" / "eSIM" frames): 22px radius, faint fill, 26px padding, with a
   head row of title + grey subtitle and an optional right-hand slot. */
export function VipPanel({
  title,
  subtitle,
  aside,
  children,
  className,
  id,
}: {
  title: string
  subtitle?: string
  aside?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn('flex flex-col gap-5 rounded-[22px] border border-vip-line/8 bg-vip-tint/3 p-5 sm:p-[26px]', className)}
    >
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4'>
        <div className='flex min-w-0 flex-col gap-1'>
          <h2 id={id} className='font-heading text-[22px] font-bold leading-[normal] text-vip-chalk'>
            {title}
          </h2>
          {subtitle && <p className='text-[13.5px] leading-[normal] text-vip-mist'>{subtitle}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

/* Mini sub-steps ("SEARCH — RESULTS — FARE …", Figma 506:3907): 20px dots,
   done = gold tint + ✓, current = solid gold, upcoming = outline. */
export function VipSubSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol aria-label='Progress' className='flex shrink-0 flex-wrap items-center gap-2.5 sm:flex-nowrap'>
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        return (
          <Fragment key={s}>
            {i > 0 && (
              <li aria-hidden className={cn('h-px w-[18px]', i <= current ? 'bg-vip-gold/70' : 'bg-vip-line/15')} />
            )}
            <li className='flex items-center gap-1.5' aria-current={state === 'current' ? 'step' : undefined}>
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full font-mono text-[10px] font-medium leading-none',
                  state === 'done' && 'border border-vip-gold/60 bg-vip-gold/14 text-vip-gold-text',
                  state === 'current' && 'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111]',
                  state === 'upcoming' && 'border border-vip-line/20 text-vip-mist',
                )}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'font-mono text-[10.5px] leading-[normal] tracking-[0.84px]',
                  state === 'upcoming' ? 'text-vip-mist' : 'text-vip-gold-text',
                )}
              >
                {s}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

/* Small pill chip (Trip type / eSIM region, Figma 513:4997 / 513:5539). */
export function VipChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-[7px] text-[12.5px] font-medium leading-[normal] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light',
        active
          ? 'border-vip-gold/60 bg-vip-gold/10 text-vip-gold-text'
          : 'border-vip-line/12 bg-vip-tint/4 text-vip-chalk hover:border-vip-line/25',
      )}
    >
      {children}
    </button>
  )
}

/* Read-only field box with a mono caps label (Route / Dates fields). */
export function VipField({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>{label}</span>
      <div className='flex h-12 items-center gap-2 truncate rounded-xl border border-vip-line/10 bg-vip-tint/3 px-4 text-[14.5px] leading-[normal] text-vip-chalk'>
        {children}
      </div>
    </div>
  )
}
