import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'
import { MatchdayLogo } from '@/components/brand/matchday-logo'
import { CartButton } from '@/components/cart/cart-button'
import { ThemeToggle } from '@/components/ui/theme-toggle'

/* "VIP · Builder header" (Figma 504:2932): logo + VIP chip on the left;
   secure-booking note, light/dark switch, the site cart and "Back to VIP
   matches" on the right. The logo follows the theme (dark wordmark on the
   white light-mode header).
   76px tall, 112px side padding at 1440. */
export function VipFlowHeader() {
  return (
    <header className='sticky top-0 z-50 border-b border-vip-line/7 bg-vip-ink'>
      <div className='page-container flex h-[64px] items-center justify-between gap-4 sm:h-[76px]'>
        <div className='flex min-w-0 items-center gap-3.5'>
          <Link
            href='/'
            aria-label='Golafly Matchday, home'
            className='flex shrink-0 items-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vip-gold-light'
          >
            <MatchdayLogo size='md' className='[--md-h:32px] sm:[--md-h:40px]' />
          </Link>
          <span className='hidden shrink-0 items-center rounded-full border border-vip-gold/60 bg-vip-gold/8 px-2.5 py-[5px] font-mono text-[10.5px] font-medium leading-[normal] tracking-[1.05px] text-vip-gold-text sm:flex'>
            VIP HOSPITALITY
          </span>
        </div>

        <div className='flex shrink-0 items-center gap-3 sm:gap-6'>
          <p className='hidden items-center gap-1.5 text-[13px] leading-[normal] text-vip-mist lg:flex'>
            <Lock aria-hidden className='size-3 fill-vip-gold-strong text-vip-gold-strong' strokeWidth={2} />
            Secure booking · 150% guarantee
          </p>
          <ThemeToggle className='size-[38px] text-vip-fg/90 hover:bg-vip-line/5 hover:text-vip-fg focus-visible:outline-vip-gold-light' />
          <CartButton className='size-[38px] border-transparent p-2.5 text-vip-fg/90 hover:bg-vip-line/5' />
          <Link
            href='/vip'
            className='flex items-center gap-[7px] rounded-sm font-mono text-[12px] leading-[normal] text-vip-chalk transition-colors hover:text-vip-gold-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vip-gold-light'
          >
            <ArrowLeft aria-hidden className='size-3' strokeWidth={2} />
            <span>
              <span className='max-sm:hidden'>Back to </span>VIP matches
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
