import { cn } from '@/lib/utils'

/* Figma "WFS · Partner seal (spinning)": a 170px ink disc with the words
   running round its edge (slowly turning) and a still lime core. */
const RING = 'OFFICIAL TRAVEL PARTNER ✦ WORLD FOOTBALL SUMMIT ✦ '

export function SummitSeal({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('relative size-[170px] shrink-0 select-none', className)}>
      <svg viewBox='0 0 170 170' className='wfs-spin absolute inset-0 size-full'>
        <circle cx='85' cy='85' r='84.5' fill='#050606' stroke='#b7ff0a' strokeOpacity='0.6' />
        <defs>
          <path id='wfs-seal-ring' d='M85 85 m-70 0 a70 70 0 1 1 140 0 a70 70 0 1 1 -140 0' />
        </defs>
        <text fill='#ffffff' fontSize='9.5' fontWeight='500' className='font-mono' letterSpacing='1.55'>
          <textPath href='#wfs-seal-ring' startOffset='25%' textLength='434' lengthAdjust='spacing'>
            {(RING + RING).split('✦').map((part, i, all) => (
              <tspan key={i}>
                {part}
                {i < all.length - 1 && <tspan fill='#b7ff0a'>✦</tspan>}
              </tspan>
            ))}
          </textPath>
        </text>
      </svg>
      <span className='absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-wfs-lime font-display text-[22px] leading-[19.8px] text-wfs-on-lime'>
        <span>GOLAFLY</span>
        <span>× WFS</span>
      </span>
    </div>
  )
}
