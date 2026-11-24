'use client'

// The exit popup's form on the ticket landing pages (epl., laliga. …).
// Everyone there is a fan, so there is no Fan / Player choice, and the
// phone is optional: the ask is just "email me when tickets drop".
// Same endpoint as the main popup (HubSpot + Brevo), tagged with the site.

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { landingPopupSchema, type LandingPopupFormData } from '@/schema/applynow'
import { PhoneInput } from '@/components/apply-now/phone-input'

export function LandingExitForm({
  siteKey,
  onDone,
}: {
  siteKey: string | null
  /** Called once the lead was sent (or failed: the visitor is never stuck). */
  onDone: () => void
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LandingPopupFormData>({
    resolver: zodResolver(landingPopupSchema),
    defaultValues: { firstName: '', email: '', phone: '' },
  })

  const onSubmit = async (data: LandingPopupFormData) => {
    try {
      const res = await fetch('/api/hubspot/exit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, leadType: 'fan', site: siteKey ?? undefined }),
      })
      if (!res.ok) console.warn('Landing exit popup submission failed')
      else window.dispatchEvent(new CustomEvent('lead-captured'))
    } catch (err) {
      console.error('Landing exit popup submission error:', err)
    } finally {
      onDone()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4' noValidate>
      <div className='grid grid-cols-1 gap-3 sm:gap-4'>
        <Field label='First name' error={errors.firstName?.message}>
          <input
            {...register('firstName')}
            placeholder='e.g. Marcus'
            autoComplete='given-name'
            aria-invalid={!!errors.firstName}
            className={inputClass(!!errors.firstName)}
          />
        </Field>
        <Field label='Email address' error={errors.email?.message}>
          <input
            {...register('email')}
            type='email'
            inputMode='email'
            placeholder='you@example.com'
            autoComplete='email'
            aria-invalid={!!errors.email}
            className={inputClass(!!errors.email)}
          />
        </Field>
        <Field label='Phone / WhatsApp' optional>
          <Controller
            name='phone'
            control={control}
            render={({ field }) => (
              <PhoneInput
                value={field.value}
                onChange={field.onChange}
                placeholder='000 000 0000'
              />
            )}
          />
        </Field>
      </div>

      <div className='pt-1 sm:pt-2'>
        <button
          type='submit'
          disabled={isSubmitting}
          className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[13px] font-bold uppercase tracking-wider text-primary-foreground shadow-[0_0_18px_var(--brand-glow)] transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 sm:h-[52px] sm:text-sm'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='size-4 animate-spin' /> Sending…
            </>
          ) : (
            <>
              Send me ticket alerts <ArrowRight className='size-4' />
            </>
          )}
        </button>
        <p className='mt-3 text-center text-[11px] leading-relaxed text-muted-foreground'>
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </form>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'h-11 w-full rounded-xl border bg-muted/40 px-4 text-[16px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary sm:h-12 sm:text-sm',
    hasError ? 'border-red-400/70' : 'border-border',
  )
}

function Field({
  label,
  optional,
  error,
  children,
}: {
  label: string
  optional?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <span className='mb-1.5 flex items-baseline gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-2'>
        {label}
        {optional ? (
          <span className='font-medium normal-case tracking-normal text-muted-foreground/80'>(optional)</span>
        ) : (
          ' *'
        )}
      </span>
      {children}
      {error && <p className='text-[11px] text-red-500'>{error}</p>}
    </div>
  )
}
