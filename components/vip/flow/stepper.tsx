import Link from 'next/link'
import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { VIP_FLOW_STEPS, vipFlowHref, type VipFlowStep } from '@/features/vip/routes'

/* "VIP · Builder stepper" (Figma 506:3507). Done steps: gold-tinted dot with
   ✓ and gold label (a link back, except once the booking is confirmed).
   Current: solid gold dot with a glow. Upcoming: outlined dot, grey label.
   Lines after a done step are gold. On small screens only the current
   step keeps its label so the row fits. */
export function VipStepper({
  club,
  eventId,
  current,
  className,
}: {
  /** The match (absent on Confirmed, whose steps are never links). */
  club?: string
  eventId?: number
  current: VipFlowStep
  className?: string
}) {
  const currentIndex = VIP_FLOW_STEPS.findIndex((s) => s.id === current)
  const locked = current === 'confirmed' || !club || eventId === undefined

  return (
    <nav aria-label='Booking steps' className={cn('min-w-0', className)}>
      <ol className='flex items-center gap-2 sm:gap-3.5'>
        {VIP_FLOW_STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
          const content = (
            <>
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-medium leading-[normal]',
                  state === 'current' &&
                    'bg-linear-to-r from-vip-gold-light to-vip-gold text-[#111111] shadow-[0_0_14px_rgba(212,178,106,0.45)]',
                  state === 'done' && 'border border-vip-gold/60 bg-vip-gold/14 text-vip-gold-text',
                  state === 'upcoming' && 'border border-vip-line/20 text-vip-mist',
                )}
              >
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'text-[14px] font-medium leading-[normal]',
                  state === 'current' && 'text-vip-chalk',
                  state === 'done' && 'text-vip-gold-text',
                  state === 'upcoming' && 'text-vip-mist',
                  state !== 'current' && 'max-sm:sr-only',
                )}
              >
                {step.label}
              </span>
            </>
          )

          return (
            <Fragment key={step.id}>
              {i > 0 && (
                <li
                  aria-hidden
                  className={cn(
                    'h-px min-w-3 flex-1 sm:w-[72px] sm:flex-none',
                    i <= currentIndex ? 'bg-vip-gold/70' : 'bg-vip-line/14',
                  )}
                />
              )}
              <li className='shrink-0'>
                {state === 'done' && !locked && step.id !== 'confirmed' ? (
                  <Link
                    href={vipFlowHref(club!, eventId!, step.id)}
                    className='flex items-center gap-2.5 rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vip-gold-light'
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    className='flex items-center gap-2.5'
                    aria-current={state === 'current' ? 'step' : undefined}
                  >
                    {content}
                  </span>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
