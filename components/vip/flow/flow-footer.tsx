import Link from 'next/link'
import { CONTACT } from '@/store/data'

/* "VIP · Builder footer" (Figma 504:2969): one 88px row at 1440 — copyright
   left, FIFA mark and links right. Stacks on small screens. */
const LINKS = [
  { label: 'Help & FAQs', href: '/help-faqs' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Refund policy', href: '/legal/refund' },
]

const link =
  'rounded-sm text-[13px] font-medium leading-[normal] text-vip-chalk transition-colors hover:text-vip-gold-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vip-gold-light'

export function VipFlowFooter() {
  return (
    <footer className='border-t border-vip-line/7 bg-vip-ink'>
      <div className='page-container flex flex-col gap-5 py-8 lg:h-[88px] lg:flex-row lg:items-center lg:justify-between lg:py-0'>
        <p className='text-[12.5px] leading-[normal] text-vip-mist'>
          © 2026 Golafly Ltd · London · Barcelona
        </p>
        <div className='flex flex-wrap items-center gap-x-7 gap-y-3'>
          <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.05px] text-vip-mist'>
            FIFA LICENSED
          </span>
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
          <a href={CONTACT.whatsapp} target='_blank' rel='noopener noreferrer' className={link}>
            WhatsApp us
          </a>
        </div>
      </div>
    </footer>
  )
}
