import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Figma "WFS · Route LOS LHR" (Pos=Start → Pos=End): a lime plane flies a
   dashed line from the departure code to the arrival code, drawing a solid
   line behind it, then starts again. */
export function SummitRoute({
  from,
  to,
  caption,
  className,
}: {
  from: string
  to: string
  caption?: string
  className?: string
}) {
  return (
    <div className={cn('flex w-full max-w-[560px] flex-col', className)}>
      <div className='flex h-[46px] items-center gap-[34px]'>
        <span className='font-display text-[36px] leading-none text-wfs-text'>{from}</span>
        <span className='relative mr-[15px] h-[30px] min-w-0 flex-1' aria-hidden>
          <span className='absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-[1.5px] border-dashed border-[#b9beb6] dark:border-wfs-line' />
          <span className='wfs-trail absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-wfs-text dark:bg-wfs-ink' />
          <span className='wfs-fly absolute top-0 flex size-[30px] -translate-x-1/2 items-center justify-center rounded-full bg-wfs-lime text-wfs-on-lime'>
            <Plane className='size-[15px]' strokeWidth={1.8} />
          </span>
        </span>
        <span className='font-display text-[36px] leading-none text-wfs-text'>{to}</span>
      </div>
      {caption && (
        <p className='text-center font-mono text-[10.5px] leading-[normal] tracking-[0.63px] text-wfs-muted'>{caption}</p>
      )}
    </div>
  )
}
