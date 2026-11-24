'use client'

import Link from 'next/link'
import { ArrowLeft, Loader2, Lock } from 'lucide-react'
import { VipButton } from '@/components/vip/flow/button'
import { vipItemDetail } from '@/components/vip/flow/extras/package-panel'
import { CONTACT } from '@/store/data'
import type { VipPackage } from '@/features/vip/contract'
import { formatVipPrice } from '@/features/vip/format'
import { packageItem } from '@/features/vip/package'

/* Checkout → "Order summary" (Figma 506:4359, 400px, sticky) with the
   "VIP · Pay block" (513:5747): lines, total, Pay.
   Live data: the lines and total are the backend's `price_summary`. Figma's
   coupon field is not shown: the backend refuses coupons on VIP packages
   ("Coupons can't be used on VIP packages."). The "≈ local currency" line is
   left out (no backend figure). */

const ITEM_NAMES: Record<string, string> = {
  matchday: 'Hospitality ticket',
  flight: 'Flight',
  stays: 'Hotel',
  esim: 'eSIM',
}

export function VipOrderSummary({
  pkg,
  title,
  subtitle,
  onPay,
  paying,
  backHref,
}: {
  pkg: VipPackage
  title: string
  /** "Sat 6 Mar 2027 · Spotify Camp Nou · 2 guests" */
  subtitle: string
  onPay: () => void
  paying: boolean
  backHref: string
}) {
  const summary = pkg.price_summary
  const currency = summary?.currency ?? packageItem(pkg, 'matchday')?.currency ?? 'EUR'
  const money = (n: number) => formatVipPrice(n, currency)
  const total = summary?.total.amount ?? null

  return (
    <aside
      aria-labelledby='vip-summary-title'
      className='flex flex-col gap-3.5 rounded-[22px] border border-vip-gold/45 bg-linear-to-b from-vip-gold/10 to-vip-panel to-50% p-6 shadow-[0_20px_60px_rgba(212,178,106,0.15)]'
    >
      <p className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>ORDER SUMMARY</p>
      <h2 id='vip-summary-title' className='font-heading text-[20px] font-bold leading-[normal] text-vip-chalk'>
        {title}
      </h2>
      <p className='text-[13px] leading-[normal] text-vip-mist'>{subtitle}</p>

      <ul className='flex flex-col gap-3.5'>
        {pkg.items.map((item) => {
          const lines = (summary?.lines ?? []).filter((l) => l.item_id === item.id)
          const sum = lines.reduce((s, l) => s + l.amount, 0)
          const detail = vipItemDetail(pkg, item)
          return (
            <li key={item.id} className='flex flex-col gap-1.5 border-b border-vip-line/6 pb-3 text-[14px] leading-[normal]'>
              <span className='flex items-center justify-between gap-4'>
                <span className='flex min-w-0 flex-col gap-[3px]'>
                  <span className='text-vip-chalk'>
                    {ITEM_NAMES[item.type] ?? item.type}
                    {item.type === 'matchday' && item.quantity ? ` × ${item.quantity}` : ''}
                  </span>
                  {detail && <span className='text-[12px] text-vip-mist'>{detail}</span>}
                </span>
                <span className='shrink-0 font-semibold text-vip-chalk'>{lines.length ? money(sum) : '—'}</span>
              </span>
              {lines.length > 1 &&
                lines.map((l) => (
                  <span key={`${l.key}-${l.label}`} className='flex justify-between gap-4 text-[12px] text-vip-mist'>
                    <span>{l.label}</span>
                    <span className='shrink-0'>{money(l.amount)}</span>
                  </span>
                ))}
            </li>
          )
        })}
        {summary?.golafly_booking_fee && summary.golafly_booking_fee.amount > 0 && (
          <li className='flex items-center justify-between gap-4 border-b border-vip-line/6 pb-3 text-[14px] leading-[normal]'>
            <span className='text-vip-chalk'>Golafly booking fee</span>
            <span className='font-semibold text-vip-chalk'>{money(summary.golafly_booking_fee.amount)}</span>
          </li>
        )}
      </ul>

      <div className='flex items-end justify-between gap-3'>
        <div className='flex flex-col gap-[3px]'>
          <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>TOTAL</span>
          <span className='text-[12px] leading-[normal] text-vip-mist'>All fees included</span>
        </div>
        <span className='font-heading text-[34px] font-bold leading-[normal] text-vip-gold-text'>
          {total !== null ? money(total) : '—'}
        </span>
      </div>

      <VipButton arrow={!paying} onClick={onPay} disabled={paying} className='w-full'>
        {paying ? (
          <span className='flex items-center gap-2'>
            <Loader2 aria-hidden className='size-4 animate-spin' /> Opening secure payment…
          </span>
        ) : total !== null ? (
          `Pay ${money(total)}`
        ) : (
          'Pay securely'
        )}
      </VipButton>
      <p className='flex items-center gap-1.5 text-[12px] leading-[normal] text-vip-mist'>
        <Lock aria-hidden className='size-3 fill-vip-gold-strong text-vip-gold-strong' strokeWidth={2} />
        One secure payment on Stripe covers every item above
      </p>
      <p className='text-[12px] leading-[1.45] text-vip-mist'>
        Your match tickets are booked first, then the rest of your package.
      </p>

      <Link
        href={backHref}
        className='flex w-fit items-center gap-[7px] font-mono text-[12px] leading-[normal] text-vip-chalk transition-colors hover:text-vip-gold-text'
      >
        <ArrowLeft aria-hidden className='size-3' strokeWidth={2} />
        Back to extras
      </Link>
      <a
        href={CONTACT.whatsapp}
        target='_blank'
        rel='noopener noreferrer'
        className='text-[12.5px] leading-[normal] text-vip-gold-text underline underline-offset-2 hover:opacity-80'
      >
        Rather talk it through? Chat with us on WhatsApp
      </a>
    </aside>
  )
}
