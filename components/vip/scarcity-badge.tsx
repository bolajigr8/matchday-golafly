'use client'

import { motion, useReducedMotion } from 'framer-motion'

/* Figma: "VIP · Badge · Few seats left" (513:5905). Two variants, Rest and
   Glow; the badge breathes between them: the dot grows 6 → 8px with a
   stronger halo and the border goes from 55% to 90% gold. */

const BORDER_REST = 'rgba(212, 178, 106, 0.55)'
const BORDER_GLOW = 'rgba(212, 178, 106, 0.9)'
const breathe = { duration: 1.6, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' as const }

export function VipScarcityBadge({ label }: { label: string }) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className='flex items-center gap-[7px] rounded-full border bg-[rgba(12,11,8,0.88)] py-1.5 pl-2.5 pr-3'
      style={{ borderColor: BORDER_REST }}
      animate={reduce ? undefined : { borderColor: [BORDER_REST, BORDER_GLOW] }}
      transition={breathe}
    >
      {/* 6px layout slot; the SVGs carry their halo outside it. */}
      <span aria-hidden className='relative size-1.5 shrink-0'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src='/figma/vip/pulse-rest.svg'
          alt=''
          width={22}
          height={22}
          className='absolute -left-2 -top-2 size-[22px] max-w-none'
        />
        <motion.span
          className='absolute -left-[17px] -top-[17px] size-10'
          initial={{ opacity: 0 }}
          animate={reduce ? undefined : { opacity: [0, 1] }}
          transition={breathe}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src='/figma/vip/pulse-glow.svg'
            alt=''
            width={40}
            height={40}
            className='size-10 max-w-none'
          />
        </motion.span>
      </span>
      <span className='whitespace-nowrap font-mono text-[11px] font-medium leading-[normal] tracking-[0.88px] text-vip-gold-text'>
        {label}
      </span>
    </motion.div>
  )
}
