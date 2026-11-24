'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Plane } from 'lucide-react'

/* "VIP · Route strip" (Figma 513:6115): LOS ── dashed path ── MAD, the
   plane glides Start → End drawing a gold trail behind it. 660px wide in
   Figma; scales down on small screens. */
export function VipRouteStrip({ from, to }: { from: string; to: string }) {
  const reduce = useReducedMotion()
  const glide = { duration: 2.8, ease: 'easeInOut' as const, repeat: Infinity, repeatDelay: 1.4 }

  return (
    <div aria-label={`${from} to ${to}`} role='img' className='flex w-full max-w-[660px] items-center gap-4 py-3.5 sm:gap-[25px]'>
      <span className='font-heading text-[18px] font-bold leading-[normal] text-vip-chalk'>{from}</span>
      <div className='relative h-[18px] flex-1'>
        <div className='absolute inset-x-0 top-1/2 border-t-[1.5px] border-dashed border-vip-gold/60' />
        <motion.div
          className='absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-vip-gold-light to-vip-gold'
          initial={{ width: '0%' }}
          animate={reduce ? { width: '0%' } : { width: ['0%', '96%'] }}
          transition={glide}
        />
        <motion.div
          className='absolute top-0'
          initial={{ left: '0%' }}
          animate={reduce ? { left: '0%' } : { left: ['0%', '96%'] }}
          transition={glide}
        >
          <Plane
            aria-hidden
            className='size-[18px] rotate-45 fill-vip-gold-text text-vip-gold-text [filter:drop-shadow(0_0_6px_rgba(212,178,106,0.9))]'
            strokeWidth={1}
          />
        </motion.div>
      </div>
      <span className='font-heading text-[18px] font-bold leading-[normal] text-vip-chalk'>{to}</span>
    </div>
  )
}
