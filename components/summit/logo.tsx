import { cn } from '@/lib/utils'

/* The Golafly logo as drawn in the summit design (Figma "Golafly logo ·
   Black / White"): black in light mode, white in dark mode. */
export function SummitGolaflyLogo({ className }: { className?: string }) {
  return (
    <span role='img' aria-label='Golafly' className={cn('inline-flex shrink-0', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/figma/summit/golafly-logo-black.svg' alt='' className='h-full w-auto dark:hidden' />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src='/figma/summit/golafly-logo-white.svg' alt='' className='hidden h-full w-auto dark:block' />
    </span>
  )
}
