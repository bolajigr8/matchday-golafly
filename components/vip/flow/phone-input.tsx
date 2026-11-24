'use client'

import { useId } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { cn } from '@/lib/utils'

/* Phone field with country flag + dialling code — the same component the
   main Golafly checkout uses (react-phone-input-2), dressed in the VIP
   field look (VipInput): mono caps label, 48px dark box, gold focus,
   dark country list. Stores "+234…" like the main checkout. */
export function VipPhoneInput({
  label,
  value,
  onChange,
  error,
  disabled,
  country = 'ng',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  disabled?: boolean
  country?: string
}) {
  const id = useId()
  return (
    <div className='flex min-w-0 flex-col gap-2'>
      <label htmlFor={id} className='font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'>
        {label}
      </label>
      <PhoneInput
        country={country}
        value={value.replace(/^\+/, '')}
        onChange={(val) => onChange(val ? `+${val}` : '')}
        disabled={disabled}
        /* The library's Nigeria pattern splits a 10-digit number as
           "803 000 000 0"; use the usual "803 000 0000". */
        masks={{ ng: '... ... ....' }}
        inputProps={{ id, 'aria-invalid': !!error || undefined, autoComplete: 'tel' }}
        containerClass='vip-phone !w-full'
        inputClass={cn(
          '!h-12 !w-full !rounded-xl !border !bg-vip-tint/3 !pl-[58px] !text-[14.5px] !text-vip-chalk focus:!border-vip-gold/60 focus:!bg-vip-tint/5 disabled:!opacity-60',
          error ? '!border-[#e5484d]/70' : '!border-vip-line/10',
        )}
        buttonClass='!rounded-l-xl !border-vip-line/10 !bg-vip-tint/5 hover:!bg-vip-tint/8'
        dropdownClass='!bg-vip-popover !border !border-vip-gold/35 !text-vip-chalk !rounded-xl !shadow-[0_16px_40px_rgba(0,0,0,0.18)] dark:!shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
        searchClass='!bg-vip-popover !text-vip-chalk !border-vip-line/10'
      />
      {error && <p className='text-[12px] leading-[normal] text-vip-error'>{error}</p>}
    </div>
  )
}
