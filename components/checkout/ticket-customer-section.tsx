// // components/checkout/ticket-customer-section.tsx
// //
// // Doc §04 "Request" / §10 "Checkout" checklist: "email, first name, last
// // name and phone are all required." Address fields are optional and
// // collapsed by default so the form doesn't look bigger than it needs to
// // for the common case.

// import { useState } from 'react'
// import PhoneInput from 'react-phone-input-2'
// import 'react-phone-input-2/lib/style.css'
// import { ChevronDown } from 'lucide-react'
// import { countries } from 'country-data-list'
// import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
// import { cn } from '@/lib/utils'
// import { FieldWrap, SectionCard, fieldClass } from './form-fields'
// import type { MatchdayCustomer } from '@/features/matchday/types'

// /** CountryDropdown keys its starting selection off `alpha3`, but
//  *  customer.country is stored as a plain English name — without this
//  *  lookup, re-opening the "Billing address" section (or any re-render)
//  *  would show the dropdown's placeholder even after a country was
//  *  already picked. */
// function findAlpha3ByName(name: string): string | undefined {
//   if (!name) return undefined
//   const match = (countries.all as Country[]).find(
//     (c) => c.name?.toLowerCase() === name.toLowerCase(),
//   )
//   return match?.alpha3
// }

// export function TicketCustomerSection({
//   customer,
//   errors,
//   onChange,
// }: {
//   customer: MatchdayCustomer
//   errors: Record<string, string>
//   onChange: (patch: Partial<MatchdayCustomer>) => void
// }) {
//   const [showOptional, setShowOptional] = useState(false)

//   return (
//     <SectionCard
//       title='Your details'
//       subtitle="We need these details to issue your tickets — we'll also send your booking confirmation here."
//     >
//       <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
//         <FieldWrap label='First name' error={errors.first_name}>
//           <input
//             className={fieldClass}
//             value={customer.first_name}
//             onChange={(e) => onChange({ first_name: e.target.value })}
//             placeholder='Leo'
//           />
//         </FieldWrap>
//         <FieldWrap label='Last name' error={errors.last_name}>
//           <input
//             className={fieldClass}
//             value={customer.last_name}
//             onChange={(e) => onChange({ last_name: e.target.value })}
//             placeholder='Nguyen'
//           />
//         </FieldWrap>
//         <FieldWrap label='Email' error={errors.email}>
//           <input
//             type='email'
//             className={fieldClass}
//             value={customer.email}
//             onChange={(e) => onChange({ email: e.target.value })}
//             placeholder='you@example.com'
//           />
//         </FieldWrap>
//         <FieldWrap label='Phone' error={errors.phone}>
//           <PhoneInput
//             country='ng'
//             value={customer.phone.replace(/^\+/, '')}
//             onChange={(val) => onChange({ phone: `+${val}` })}
//             inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary'
//             buttonClass='!rounded-l-xl !border-border !bg-muted/60'
//             dropdownClass='!bg-card !border-border !text-foreground'
//             searchClass='!bg-background !text-foreground !border-border'
//           />
//         </FieldWrap>
//       </div>

//       <button
//         type='button'
//         onClick={() => setShowOptional((v) => !v)}
//         className='mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground'
//       >
//         <ChevronDown
//           className={cn('size-3.5 transition-transform', showOptional && 'rotate-180')}
//         />
//         Billing address (optional)
//       </button>

//       {showOptional && (
//         <div className='mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2'>
//           <FieldWrap label='Country'>
//             <CountryDropdown
//               placeholder='Select country'
//               defaultValue={findAlpha3ByName(customer.country ?? '')}
//               onChange={(country: Country) => onChange({ country: country.name })}
//               triggerClassName={fieldClass}
//             />
//           </FieldWrap>
//           <FieldWrap label='City'>
//             <input
//               className={fieldClass}
//               value={customer.city ?? ''}
//               onChange={(e) => onChange({ city: e.target.value })}
//             />
//           </FieldWrap>
//           <FieldWrap label='Address' full>
//             <input
//               className={fieldClass}
//               value={customer.address ?? ''}
//               onChange={(e) => onChange({ address: e.target.value })}
//             />
//           </FieldWrap>
//           <FieldWrap label='State / region'>
//             <input
//               className={fieldClass}
//               value={customer.state ?? ''}
//               onChange={(e) => onChange({ state: e.target.value })}
//             />
//           </FieldWrap>
//           <FieldWrap label='Postal code'>
//             <input
//               className={fieldClass}
//               value={customer.postal_code ?? ''}
//               onChange={(e) => onChange({ postal_code: e.target.value })}
//               placeholder="Leave blank if you're unsure"
//             />
//           </FieldWrap>
//         </div>
//       )}
//     </SectionCard>
//   )
// }

// components/checkout/ticket-customer-section.tsx
//
// Doc §04 "Request" / §10 "Checkout" checklist: "email, first name, last
// name and phone are all required." Address fields are optional and
// collapsed by default so the form doesn't look bigger than it needs to
// for the common case.

import { useState } from 'react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { ChevronDown } from 'lucide-react'
import { countries } from 'country-data-list'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
import { cn } from '@/lib/utils'
import { FieldWrap, SectionCard, fieldClass } from './form-fields'
import type { MatchdayCustomer } from '@/features/matchday/types'

/** CountryDropdown keys its starting selection off `alpha3`, but
 *  customer.country is stored as a plain English name — without this
 *  lookup, re-opening the "Billing address" section (or any re-render)
 *  would show the dropdown's placeholder even after a country was
 *  already picked. */
function findAlpha3ByName(name: string): string | undefined {
  if (!name) return undefined
  const match = (countries.all as Country[]).find(
    (c) => c.name?.toLowerCase() === name.toLowerCase(),
  )
  return match?.alpha3
}

export function TicketCustomerSection({
  customer,
  errors,
  onChange,
}: {
  customer: MatchdayCustomer
  errors: Record<string, string>
  onChange: (patch: Partial<MatchdayCustomer>) => void
}) {
  const [showOptional, setShowOptional] = useState(false)

  return (
    <SectionCard
      title='Your details'
      subtitle="We need these details to issue your tickets — we'll also send your booking confirmation here."
    >
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <FieldWrap label='First name' error={errors.first_name}>
          <input
            className={fieldClass}
            value={customer.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            placeholder='Leo'
          />
        </FieldWrap>
        <FieldWrap label='Last name' error={errors.last_name}>
          <input
            className={fieldClass}
            value={customer.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
            placeholder='Nguyen'
          />
        </FieldWrap>
        <FieldWrap label='Email' error={errors.email}>
          <input
            type='email'
            className={fieldClass}
            value={customer.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder='you@example.com'
          />
        </FieldWrap>
        <FieldWrap label='Phone' error={errors.phone}>
          <PhoneInput
            country='es'
            value={customer.phone.replace(/^\+/, '')}
            onChange={(val) => onChange({ phone: `+${val}` })}
            inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary'
            buttonClass='!rounded-l-xl !border-border !bg-muted/60'
            dropdownClass='!bg-card !border-border !text-foreground'
            searchClass='!bg-background !text-foreground !border-border'
          />
        </FieldWrap>
      </div>

      <button
        type='button'
        onClick={() => setShowOptional((v) => !v)}
        className='mt-4 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground'
      >
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform',
            showOptional && 'rotate-180',
          )}
        />
        Billing address (optional)
      </button>

      {showOptional && (
        <div className='mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2'>
          <FieldWrap label='Country'>
            <CountryDropdown
              placeholder='Select country'
              defaultValue={findAlpha3ByName(customer.country ?? '')}
              onChange={(country: Country) =>
                onChange({ country: country.name })
              }
              triggerClassName={fieldClass}
            />
          </FieldWrap>
          <FieldWrap label='City'>
            <input
              className={fieldClass}
              value={customer.city ?? ''}
              onChange={(e) => onChange({ city: e.target.value })}
            />
          </FieldWrap>
          <FieldWrap label='Address' full>
            <input
              className={fieldClass}
              value={customer.address ?? ''}
              onChange={(e) => onChange({ address: e.target.value })}
            />
          </FieldWrap>
          <FieldWrap label='State / region'>
            <input
              className={fieldClass}
              value={customer.state ?? ''}
              onChange={(e) => onChange({ state: e.target.value })}
            />
          </FieldWrap>
          <FieldWrap label='Postal code'>
            <input
              className={fieldClass}
              value={customer.postal_code ?? ''}
              onChange={(e) => onChange({ postal_code: e.target.value })}
              placeholder="Leave blank if you're unsure"
            />
          </FieldWrap>
        </div>
      )}
    </SectionCard>
  )
}
