'use client'

import { useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* The looping crowd footage behind the hero and the Concierge CTA. In Figma
 * it is a 4.7 MB animated GIF (hero) and a 30-frame "Crowd loop" component
 * (CTA) — the same 6 s of footage. It ships once, as a muted looping video
 * (~0.5 MB WebM / ~0.75 MB MP4), with a JPG of the first frame until it
 * plays. Reduced motion: the still frame only, and nothing is downloaded. */
export function VipCrowdVideo({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  return (
    <video
      key={reduce ? 'still' : 'moving'}
      autoPlay={!reduce}
      loop
      muted
      playsInline
      preload={reduce ? 'none' : 'auto'}
      poster='/figma/vip/hero-fans-poster.jpg'
      aria-hidden
      tabIndex={-1}
      className={cn('pointer-events-none size-full object-cover', className)}
    >
      <source src='/figma/vip/hero-fans.webm' type='video/webm' />
      <source src='/figma/vip/hero-fans.mp4' type='video/mp4' />
    </video>
  )
}
