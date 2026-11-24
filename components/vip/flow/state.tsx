import type { ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VipButtonLink } from './button'

/* Loading block for a VIP flow page (pulse, same surface as the panels). */
export function VipLoading({ className }: { className?: string }) {
  return <div aria-hidden className={cn('h-[640px] animate-pulse rounded-[22px] bg-vip-line/3', className)} />
}

/* A full-width notice: a page that can't show (match gone, no package,
   switched off …). `message` is shown as written. */
export function VipNotice({
  title,
  message,
  action,
  className,
}: {
  title: string
  message?: string
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-4 rounded-[22px] border border-dashed border-vip-gold/40 bg-vip-tint/3 p-6 sm:p-8',
        className,
      )}
    >
      <h1 className='font-heading text-[24px] font-bold leading-[normal] text-vip-chalk sm:text-[28px]'>{title}</h1>
      {message && <p className='max-w-[620px] text-[15px] leading-[1.5] text-vip-mist'>{message}</p>}
      {action && (
        <VipButtonLink href={action.href} arrow>
          {action.label}
        </VipButtonLink>
      )}
    </div>
  )
}

/* An inline error from the backend, shown as written (contract §8). */
export function VipError({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p
      role='alert'
      className={cn(
        'flex items-start gap-2.5 rounded-[14px] border border-vip-error/40 bg-vip-error/8 px-4 py-3 text-[14px] leading-[1.45] text-vip-chalk',
        className,
      )}
    >
      <AlertCircle aria-hidden className='mt-0.5 size-4 shrink-0 text-vip-error' strokeWidth={2.25} />
      <span>{children}</span>
    </p>
  )
}

/* A gold info note (dashed), e.g. "seat choice is a request". */
export function VipNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'rounded-[14px] border border-dashed border-vip-gold/40 bg-vip-gold/7 px-[18px] py-3.5 text-[13.5px] leading-[1.45] text-vip-chalk',
        className,
      )}
    >
      {children}
    </p>
  )
}
