'use client'

import { Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionCard } from './form-fields'
import type { EsimCheckoutInput } from '@/features/checkout/types'

export function EsimSection({ item, value, errors, onChange }: {
  item: { name: string; detail: string; price: number; qty: number }
  value: EsimCheckoutInput
  errors: Record<string, string>
  onChange: (patch: Partial<EsimCheckoutInput>) => void
}) {
  return <SectionCard title='eSIM details' subtitle='Your shared contact information is reused. Only eSIM-specific confirmations are required here.'>
    <div className='rounded-xl border border-border bg-muted/30 p-4'>
      <div className='flex items-start gap-3'><div className='grid size-10 place-items-center rounded-lg bg-primary/10 text-primary'><Smartphone className='size-5'/></div><div><p className='text-sm font-bold'>{item.name}</p><p className='mt-1 text-xs text-muted-foreground'>{item.detail}</p><p className='mt-2 font-mono text-xs font-bold text-primary'>€{(item.price*item.qty).toFixed(2)}</p></div></div>
      <div className='mt-4 space-y-3'>
        <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs', errors.deviceConfirmed ? 'border-destructive' : 'border-border')}><input type='checkbox' checked={value.deviceConfirmed} onChange={(e)=>onChange({deviceConfirmed:e.target.checked})} className='mt-0.5 size-4 accent-primary'/><span><span className='font-semibold'>My device supports eSIM</span><span className='mt-1 block text-muted-foreground'>I have checked that my phone or tablet supports eSIM.</span></span></label>
        {errors.deviceConfirmed && <p className='text-[11px] text-destructive'>{errors.deviceConfirmed}</p>}
        <label className={cn('flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-xs', errors.activationConfirmed ? 'border-destructive' : 'border-border')}><input type='checkbox' checked={value.activationConfirmed} onChange={(e)=>onChange({activationConfirmed:e.target.checked})} className='mt-0.5 size-4 accent-primary'/><span><span className='font-semibold'>I understand eSIM activation</span><span className='mt-1 block text-muted-foreground'>I understand how the eSIM will be installed and activated after purchase.</span></span></label>
        {errors.activationConfirmed && <p className='text-[11px] text-destructive'>{errors.activationConfirmed}</p>}
        <label className='flex cursor-pointer items-center justify-between rounded-lg border border-border p-3 text-xs'><span><span className='font-semibold'>Auto-activate on arrival</span><span className='mt-1 block text-muted-foreground'>Keep the activation preference from the builder.</span></span><input type='checkbox' checked={Boolean(value.autoActivate)} onChange={(e)=>onChange({autoActivate:e.target.checked})} className='size-4 accent-primary'/></label>
      </div>
    </div>
  </SectionCard>
}
