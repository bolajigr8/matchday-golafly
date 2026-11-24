import Image from 'next/image'
import { Plane } from 'lucide-react'
import { cn } from '@/lib/utils'

/* Figma "WFS · Badge (swing)": the attendee badge on its lime lanyard,
   swinging ±3.2° from the top of the strap. Drawn once at the hero's size
   (card 407px wide) and scaled for the smaller places it appears (ticket
   page preview, confirmation), so every proportion stays as designed. */

const W = 415 // box the hero gives the badge
const H = 745

export interface SummitBadgeProps {
  line: string
  foot: string
  airport: string
  name?: string
  role?: string
  org?: string
  initials?: string
  /** 1 = hero size. */
  scale?: number
  /** Start the swing from the other side (second badge on confirmation). */
  mirror?: boolean
  className?: string
}

export function SummitBadge({
  line,
  foot,
  airport,
  name,
  role,
  org,
  initials,
  scale = 1,
  mirror,
  className,
}: SummitBadgeProps) {
  return (
    <div aria-hidden style={{ width: W * scale, height: H * scale }} className={cn('pointer-events-none relative shrink-0 select-none', className)}>
      <div style={{ width: W, height: H, transform: `scale(${scale})` }} className='absolute left-0 top-0 origin-top-left'>
        <div className='wfs-swing absolute inset-0' style={mirror ? { animationDelay: '-2.1s' } : undefined}>
          {/* Strap + clip */}
          <span className='absolute left-1/2 top-0 h-[188px] w-[47px] -translate-x-1/2 bg-wfs-lime' />
          <span className='absolute left-1/2 top-[166px] h-[30px] w-[58px] -translate-x-1/2 rounded-[7px] bg-[#2a2e2a]' />
          {/* Card */}
          <div className='absolute left-1 top-[184px] flex w-[407px] flex-col overflow-hidden rounded-[29px] bg-white text-[#121212] shadow-[0_37px_73px_-15px_rgba(0,0,0,0.35)]'>
            <div className='relative flex flex-col gap-[7px] bg-[#050606] px-[29px] pb-[27px] pt-[32px]'>
              <span className='absolute left-1/2 top-[14px] h-[13px] w-[69px] -translate-x-1/2 rounded-[6px] bg-[#2a2e2a]' />
              <span className='font-mono text-[13.4px] font-medium leading-[normal] tracking-[2.42px] text-wfs-lime'>{line}</span>
              <span className='font-display text-[36.6px] leading-[34.8px] text-white'>WORLD FOOTBALL SUMMIT</span>
            </div>
            <div className='flex flex-col gap-[17px] p-[29px]'>
              <span className='flex size-[78px] items-center justify-center rounded-full bg-wfs-lime font-display text-[36.6px] leading-none text-wfs-on-lime'>
                {initials || 'YOU'}
              </span>
              <span className='flex flex-col gap-[5px]'>
                <span className='line-clamp-2 break-words font-display text-[48.8px] uppercase leading-[44.9px]'>{name || 'YOUR NAME'}</span>
                <span className='truncate text-[17.1px] font-medium leading-[normal]'>{role || 'Your job title'}</span>
                <span className='truncate text-[16.5px] leading-[normal] text-[#5a6158]'>{org || 'Your company'}</span>
              </span>
              <span className='h-px w-full bg-[#e3e6df]' />
              <span className='flex items-center justify-between gap-3'>
                <span className='flex min-w-0 flex-col items-start gap-[7px]'>
                  <span className='rounded-full bg-wfs-lime px-[15px] py-[7px] font-mono text-[12.2px] font-medium leading-[normal] text-wfs-on-lime'>
                    GENERAL ENTRY
                  </span>
                  <span className='font-mono text-[12.2px] font-medium leading-[normal] tracking-[0.98px] text-[#5a6158]'>{foot}</span>
                </span>
                <span className='flex size-[75px] shrink-0 items-center justify-center rounded-[10px] border border-[#e3e6df] bg-white p-[6px]'>
                  <Image src='/figma/summit/qr.png' alt='' width={61} height={61} unoptimized className='size-full [image-rendering:pixelated]' />
                </span>
              </span>
            </div>
            <div className='flex items-center justify-between bg-[#f6f7f3] px-[29px] py-[15px]'>
              <span className='text-[14.6px] font-semibold leading-[normal]'>Travel by Golafly</span>
              <span className='flex items-center gap-[7px] font-mono text-[13.4px] font-medium leading-[normal] tracking-[0.81px] text-[#446600]'>
                ANY
                <Plane className='size-[15px]' strokeWidth={1.8} />
                {airport}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
