import { cn } from '@/lib/utils'

/* Booking-flow eyebrow: 5px gold dot + 12px mono caps (Figma "Eyebrow"
   frames on the Match page). */
export function VipEyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <p
      className={cn(
        'flex items-center gap-2 font-mono text-[12px] font-medium uppercase leading-[normal] tracking-[1.68px] text-vip-gold-text',
        className,
      )}
    >
      <span aria-hidden className='size-[5px] shrink-0 rounded-full bg-vip-gold' />
      {children}
    </p>
  )
}
