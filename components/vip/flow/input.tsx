'use client'

import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/* Checkout field (Figma 506:4277 etc.): 10.5px mono caps label, 48px dark
   box, #7c857a placeholder. Not in Figma: gold border on focus and a
   short red message under the box when the value is missing or wrong. */
export function VipInput({
  label,
  error,
  className,
  ...props
}: { label: string; error?: string | null } & ComponentProps<'input'>) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={id} className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errId : undefined}
        className={cn(
          'h-12 w-full rounded-xl border bg-vip-tint/3 px-4 text-[14.5px] leading-[normal] text-vip-chalk outline-none transition-colors placeholder:text-[#7c857a] focus:border-vip-gold/60 focus:bg-vip-line/5',
          error ? 'border-[#e5484d]/70' : 'border-vip-line/10',
        )}
        {...props}
      />
      {error && (
        <p id={errId} className='text-[12px] leading-[normal] text-vip-error'>
          {error}
        </p>
      )}
    </div>
  )
}
