'use client'

import { Dialog as DialogPrimitive } from 'radix-ui'
import { CheckCircle2, Clock3, RotateCcw, UserRoundPen, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CONTACT } from '@/store/data'
import { formatVipPrice } from '@/features/vip/format'
import type { VipTone } from '@/features/vip/status'

/* "VIP · Booking details (overlay)" (Figma 513:5780): 460px dark sheet with
   a gold hairline over a dark backdrop (Figma's overlays use #000 at 74%).
   Every line with its detail, "PAID" total, WhatsApp button.
   Live data: after payment the backend's package view has statuses but no
   lines or prices (contract §6), so each line shows the backend's own
   status word (and its held message) instead of a price; the details are
   what the customer chose (saved at checkout). PAID is the checkout total
   when this browser saved it, otherwise it is left out. Figma's "Message my
   concierge" is worded "Message us on WhatsApp" (no concierge is sold). */

export interface VipDetailLine {
  name: string
  detail?: string | null
  status: { label: string; tone: VipTone }
  note?: string | null
}

const TONE: Record<VipTone, string> = {
  progress: 'text-vip-gold-text',
  done: 'text-[#3fb950]',
  refunded: 'text-vip-mist',
  action: 'text-vip-gold-text',
}

function ToneIcon({ t }: { t: VipTone }) {
  const cls = cn('size-3.5 shrink-0', TONE[t])
  if (t === 'done') return <CheckCircle2 aria-hidden className={cls} strokeWidth={2.25} />
  if (t === 'refunded') return <RotateCcw aria-hidden className={cls} strokeWidth={2.25} />
  if (t === 'action') return <UserRoundPen aria-hidden className={cls} strokeWidth={2.25} />
  return <Clock3 aria-hidden className={cls} strokeWidth={2.25} />
}

export function VipBookingDetails({
  open,
  onOpenChange,
  reference,
  title,
  subtitle,
  lines,
  paid,
  live,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reference: string
  title: string
  subtitle: string
  lines: VipDetailLine[]
  paid: { amount: number; currency: string } | null
  /** true while the page still refreshes the statuses. */
  live: boolean
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-50 bg-black/74 data-[state=open]:animate-in data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content className='fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[460px] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-3xl border border-vip-gold/45 bg-vip-popover p-7 shadow-[0_24px_60px_rgba(0,0,0,0.6)] outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95'>
          <div className='flex items-center justify-between'>
            <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.32px] text-vip-gold-text'>
              BOOKING {reference}
            </span>
            <DialogPrimitive.Close
              aria-label='Close'
              className='flex size-8 items-center justify-center rounded-full border border-vip-line/20 text-vip-chalk transition-colors hover:border-vip-gold/60'
            >
              <X aria-hidden className='size-3.5' strokeWidth={2} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className='font-heading text-[24px] font-bold leading-[normal] text-vip-chalk'>
            {title}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className='text-[13.5px] leading-[normal] text-vip-mist'>
            {subtitle}
          </DialogPrimitive.Description>
          <ul className='flex flex-col gap-4'>
            {lines.map((l) => (
              <li key={l.name} className='flex flex-col gap-1 border-b border-vip-line/6 pb-3'>
                <span className='flex justify-between gap-4'>
                  <span className='flex min-w-0 flex-col gap-[3px]'>
                    <span className='text-[14px] font-medium leading-[normal] text-vip-chalk'>{l.name}</span>
                    {l.detail && <span className='text-[12px] leading-[normal] text-vip-mist'>{l.detail}</span>}
                  </span>
                  <span className={cn('flex shrink-0 items-center gap-1.5 text-[13px] font-semibold leading-[normal]', TONE[l.status.tone])}>
                    <ToneIcon t={l.status.tone} />
                    {l.status.label}
                  </span>
                </span>
                {l.note && <span className='text-[12px] leading-[1.45] text-vip-mist'>{l.note}</span>}
              </li>
            ))}
          </ul>
          {paid && (
            <div className='flex items-center justify-between'>
              <span className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>PAID</span>
              <span className='font-heading text-[28px] font-bold leading-[normal] text-vip-gold-text'>
                {formatVipPrice(paid.amount, paid.currency)}
              </span>
            </div>
          )}
          {live && <p className='text-[12px] leading-[normal] text-vip-mist'>Statuses update by themselves every 20 seconds.</p>}
          <a
            href={CONTACT.whatsapp}
            target='_blank'
            rel='noopener noreferrer'
            className='flex h-[52px] items-center justify-center rounded-full border border-vip-line/20 px-7 text-[15px] font-semibold leading-[normal] text-vip-chalk transition-colors hover:border-vip-gold/75 hover:bg-vip-gold/8 hover:text-vip-gold-text'
          >
            Message us on WhatsApp
          </a>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
