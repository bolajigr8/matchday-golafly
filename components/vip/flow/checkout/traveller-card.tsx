'use client'

import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'
import { VipInput } from '@/components/vip/flow/input'
import { VipPhoneInput } from '@/components/vip/flow/phone-input'
import { minDobISO, todayISO } from '@/features/flights/schema'
import type { VipCheckoutErrors, VipTraveller, VipTravellerFields } from '@/features/vip/checkout-validation'

/* Checkout → one traveller (same behaviour as the main Golafly flights
 * checkout, components/checkout/passenger-section.tsx): title, names as
 * on the passport, gender, date of birth (main DateOfBirthPicker in its
 * VIP tone), email and phone. "Same as contact info" — ticked on traveller
 * 1 — reuses the contact email and phone. Exactly the fields the backend's
 * flight passenger takes (contract §2.7).
 * Without a flight (flexible mode) the card asks only what is sent: names
 * and date of birth for hotel guests, or just the ticket holder's names. */

const TITLES: { value: VipTraveller['title']; label: string }[] = [
  { value: 'mr', label: 'Mr' },
  { value: 'ms', label: 'Ms' },
  { value: 'mrs', label: 'Mrs' },
  { value: 'miss', label: 'Miss' },
  { value: 'dr', label: 'Dr' },
]

const selectClass =
  'h-12 w-full rounded-xl border bg-vip-tint/3 px-3 text-[14.5px] leading-[normal] text-vip-chalk outline-none transition-colors focus:border-vip-gold/60 [&>option]:bg-vip-panel'
const labelClass = 'font-mono text-[10.5px] leading-[normal] tracking-[1.26px] text-vip-mist'

export function VipTravellerCard({
  index,
  traveller: t,
  errors,
  onChange,
  fields = 'flight',
}: {
  index: number
  traveller: VipTraveller
  errors: VipCheckoutErrors
  onChange: (patch: Partial<VipTraveller>) => void
  fields?: VipTravellerFields
}) {
  const k = `traveller.${index}`
  const err = (f: string) => errors[`${k}.${f}`]
  const flight = fields === 'flight'

  return (
    <fieldset className='flex flex-col gap-[18px] rounded-2xl border border-vip-line/8 bg-vip-tint/2 p-4 sm:p-5'>
      <legend className='sr-only'>{`Traveller ${index + 1}`}</legend>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <span className='font-mono text-[11px] font-medium leading-[normal] tracking-[1.32px] text-vip-gold-text'>
          {fields === 'ticket' ? (
            'TICKET HOLDER'
          ) : (
            <>
              TRAVELLER {index + 1}
              {index === 0 && ' · LEAD GUEST & TICKET HOLDER'}
            </>
          )}
        </span>
        {flight && (
        <label className='flex cursor-pointer items-center gap-2 text-[13px] leading-[normal] text-vip-mist'>
          <input
            type='checkbox'
            checked={t.sameAsContact}
            onChange={(e) => onChange({ sameAsContact: e.target.checked })}
            className='size-4 cursor-pointer accent-vip-gold'
          />
          Same as contact info
        </label>
        )}
      </div>

      <div className={flight ? 'grid gap-3 sm:grid-cols-[120px_1fr_1fr]' : 'grid gap-3 sm:grid-cols-2'}>
        {flight && (
        <label className='flex flex-col gap-2' data-field={`${k}.title`}>
          <span className={labelClass}>TITLE</span>
          <select
            value={t.title}
            onChange={(e) => onChange({ title: e.target.value as VipTraveller['title'] })}
            aria-invalid={!!err('title') || undefined}
            className={`${selectClass} ${err('title') ? 'border-[#e5484d]/70' : 'border-vip-line/10'}`}
          >
            <option value=''>—</option>
            {TITLES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {err('title') && <p className='text-[12px] leading-[normal] text-vip-error'>{err('title')}</p>}
        </label>
        )}
        <div data-field={`${k}.givenName`}>
          <VipInput
            label='FIRST NAME'
            autoComplete={index === 0 ? 'given-name' : 'off'}
            value={t.givenName}
            onChange={(e) => onChange({ givenName: e.target.value })}
            error={err('givenName')}
          />
        </div>
        <div data-field={`${k}.familyName`}>
          <VipInput
            label='LAST NAME'
            autoComplete={index === 0 ? 'family-name' : 'off'}
            value={t.familyName}
            onChange={(e) => onChange({ familyName: e.target.value })}
            error={err('familyName')}
          />
        </div>
      </div>

      {fields !== 'ticket' && (
      <div className={flight ? 'grid gap-3 sm:grid-cols-[180px_1fr]' : 'grid gap-3 sm:grid-cols-2'}>
        {flight && (
        <label className='flex flex-col gap-2' data-field={`${k}.gender`}>
          <span className={labelClass}>GENDER</span>
          <select
            value={t.gender}
            onChange={(e) => onChange({ gender: e.target.value as VipTraveller['gender'] })}
            aria-invalid={!!err('gender') || undefined}
            className={`${selectClass} ${err('gender') ? 'border-[#e5484d]/70' : 'border-vip-line/10'}`}
          >
            <option value=''>—</option>
            <option value='m'>Male</option>
            <option value='f'>Female</option>
          </select>
          {err('gender') && <p className='text-[12px] leading-[normal] text-vip-error'>{err('gender')}</p>}
        </label>
        )}
        <div className='flex flex-col gap-2' data-field={`${k}.bornOn`}>
          <span className={labelClass}>DATE OF BIRTH</span>
          <DateOfBirthPicker
            tone='vip'
            value={t.bornOn}
            min={minDobISO()}
            max={todayISO()}
            onChange={(iso) => onChange({ bornOn: iso })}
          />
          {err('bornOn') && <p className='text-[12px] leading-[normal] text-vip-error'>{err('bornOn')}</p>}
        </div>
      </div>
      )}

      {flight && !t.sameAsContact && (
        <div className='grid gap-3 sm:grid-cols-2'>
          <div data-field={`${k}.email`}>
            <VipInput
              label='EMAIL'
              type='email'
              value={t.email}
              onChange={(e) => onChange({ email: e.target.value })}
              error={err('email')}
            />
          </div>
          <div data-field={`${k}.phone`}>
            <VipPhoneInput label='PHONE' country='gb' value={t.phone} onChange={(phone) => onChange({ phone })} error={err('phone')} />
          </div>
        </div>
      )}
    </fieldset>
  )
}
