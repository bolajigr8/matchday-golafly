// // components/checkout/passenger-section.tsx

// import PhoneInput from 'react-phone-input-2'
// import 'react-phone-input-2/lib/style.css'
// import { FieldWrap, SectionCard, fieldClass } from './form-fields'
// import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'
// import { DatePicker } from '@/components/ui/date-picker'
// import { todayISO, minDobISO } from '@/features/flights/schema'
// import type { PassengerInput } from '@/features/checkout/types'

// export function PassengerSection({
//   passengers,
//   errors,
//   requireIdentityDocs,
//   onUpdate,
//   onSameAsPrimaryChange,
// }: {
//   passengers: PassengerInput[]
//   errors: Record<string, Record<string, string>>
//   requireIdentityDocs: boolean
//   onUpdate: (id: string, patch: Partial<PassengerInput>) => void
//   onSameAsPrimaryChange: (id: string, same: boolean) => void
// }) {
//   return (
//     <SectionCard
//       title='Passenger details'
//       subtitle='Each passenger needs their own name and contact details for the airline — the first passenger defaults to your contact info above.'
//     >
//       <div className='space-y-4'>
//         {passengers.map((p, i) => {
//           const err = errors[p.id] ?? {}
//           return (
//             <div
//               key={p.id}
//               className='rounded-xl border border-border bg-muted/30 p-4'
//             >
//               <div className='mb-3 flex items-center justify-between gap-3'>
//                 <p className='font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
//                   Passenger {i + 1}
//                 </p>
//                 <label className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
//                   <input
//                     type='checkbox'
//                     checked={p.sameAsPrimary}
//                     onChange={(e) =>
//                       onSameAsPrimaryChange(p.id, e.target.checked)
//                     }
//                     className='size-3.5 accent-primary'
//                   />
//                   Same as contact info
//                 </label>
//               </div>
//               <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
//                 <FieldWrap label='Title'>
//                   <select
//                     className={fieldClass}
//                     value={p.title}
//                     onChange={(e) =>
//                       onUpdate(p.id, {
//                         title: e.target.value as PassengerInput['title'],
//                       })
//                     }
//                   >
//                     <option value='mr'>Mr</option>
//                     <option value='mrs'>Mrs</option>
//                     <option value='ms'>Ms</option>
//                     <option value='miss'>Miss</option>
//                     <option value='dr'>Dr</option>
//                   </select>
//                 </FieldWrap>
//                 <FieldWrap label='Gender'>
//                   <select
//                     className={fieldClass}
//                     value={p.gender}
//                     onChange={(e) =>
//                       onUpdate(p.id, {
//                         gender: e.target.value as PassengerInput['gender'],
//                       })
//                     }
//                   >
//                     <option value='m'>Male</option>
//                     <option value='f'>Female</option>
//                   </select>
//                 </FieldWrap>
//                 <FieldWrap label='First name' error={err.given_name}>
//                   <input
//                     className={fieldClass}
//                     value={p.given_name}
//                     disabled={p.sameAsPrimary}
//                     onChange={(e) =>
//                       onUpdate(p.id, { given_name: e.target.value })
//                     }
//                   />
//                 </FieldWrap>
//                 <FieldWrap label='Last name' error={err.family_name}>
//                   <input
//                     className={fieldClass}
//                     value={p.family_name}
//                     disabled={p.sameAsPrimary}
//                     onChange={(e) =>
//                       onUpdate(p.id, { family_name: e.target.value })
//                     }
//                   />
//                 </FieldWrap>
//                 <FieldWrap label='Date of birth' error={err.born_on}>
//                   <DateOfBirthPicker
//                     value={p.born_on}
//                     onChange={(iso) => onUpdate(p.id, { born_on: iso })}
//                     min={minDobISO()}
//                     max={todayISO()}
//                   />
//                 </FieldWrap>
//                 <FieldWrap label='Email' error={err.email}>
//                   <input
//                     type='email'
//                     className={fieldClass}
//                     value={p.email}
//                     disabled={p.sameAsPrimary}
//                     onChange={(e) => onUpdate(p.id, { email: e.target.value })}
//                   />
//                 </FieldWrap>
//                 <FieldWrap label='Phone' error={err.phone_number}>
//                   <PhoneInput
//                     country='ng'
//                     value={p.phone_number.replace(/^\+/, '')}
//                     disabled={p.sameAsPrimary}
//                     onChange={(val) =>
//                       onUpdate(p.id, { phone_number: `+${val}` })
//                     }
//                     inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary disabled:!opacity-60'
//                     buttonClass='!rounded-l-xl !border-border !bg-muted/60'
//                     dropdownClass='!bg-card !border-border !text-foreground'
//                     searchClass='!bg-background !text-foreground !border-border'
//                   />
//                 </FieldWrap>
//                 {p.offerType === 'infant_without_seat' && (
//                   <FieldWrap label='Infant status'>
//                     <div className='rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground'>
//                       Infant without seat · must be assigned to a traveling
//                       adult.
//                     </div>
//                   </FieldWrap>
//                 )}
//                 {p.offerType !== 'infant_without_seat' &&
//                   passengers.some(
//                     (other) =>
//                       other.offerType === 'infant_without_seat' &&
//                       other.id !== p.id,
//                   ) && (
//                     <FieldWrap
//                       label='Traveling with infant'
//                       error={err.infant_passenger_id}
//                     >
//                       <select
//                         className={fieldClass}
//                         value={p.infant_passenger_id ?? ''}
//                         onChange={(e) =>
//                           onUpdate(p.id, {
//                             infant_passenger_id: e.target.value || undefined,
//                           })
//                         }
//                       >
//                         <option value=''>No infant</option>
//                         {passengers
//                           .filter(
//                             (other) =>
//                               other.offerType === 'infant_without_seat',
//                           )
//                           .map((infant, infantIndex) => (
//                             <option key={infant.id} value={infant.id}>
//                               Infant {infantIndex + 1}
//                             </option>
//                           ))}
//                       </select>
//                     </FieldWrap>
//                   )}
//                 {requireIdentityDocs && (
//                   <>
//                     <FieldWrap
//                       label='Passport number'
//                       error={err.passportNumber}
//                     >
//                       <input
//                         className={fieldClass}
//                         value={p.passportNumber ?? ''}
//                         onChange={(e) =>
//                           onUpdate(p.id, { passportNumber: e.target.value })
//                         }
//                       />
//                     </FieldWrap>
//                     <FieldWrap
//                       label='Passport issuing country'
//                       error={err.passportCountry}
//                     >
//                       <input
//                         className={fieldClass}
//                         placeholder='NG'
//                         value={p.passportCountry ?? ''}
//                         onChange={(e) =>
//                           onUpdate(p.id, { passportCountry: e.target.value })
//                         }
//                       />
//                     </FieldWrap>
//                     <FieldWrap
//                       label='Passport expiry date'
//                       error={err.passportExpiry}
//                     >
//                       <div className={fieldClass}>
//                         <DatePicker
//                           value={p.passportExpiry ?? ''}
//                           onChange={(iso) =>
//                             onUpdate(p.id, { passportExpiry: iso })
//                           }
//                           min={todayISO()}
//                           placeholder='Date'
//                         />
//                       </div>
//                     </FieldWrap>
//                   </>
//                 )}
//                 {err.identity_documents && (
//                   <p className='text-[11px] text-destructive sm:col-span-2'>
//                     {err.identity_documents}
//                   </p>
//                 )}
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </SectionCard>
//   )
// }

// components/checkout/passenger-section.tsx

import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { FieldWrap, SectionCard, fieldClass } from './form-fields'
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'
import { DatePicker } from '@/components/ui/date-picker'
import { todayISO, minDobISO } from '@/features/flights/schema'
import type { PassengerInput } from '@/features/checkout/types'

export function PassengerSection({
  passengers,
  errors,
  requireIdentityDocs,
  onUpdate,
  onSameAsPrimaryChange,
}: {
  passengers: PassengerInput[]
  errors: Record<string, Record<string, string>>
  requireIdentityDocs: boolean
  onUpdate: (id: string, patch: Partial<PassengerInput>) => void
  onSameAsPrimaryChange: (id: string, same: boolean) => void
}) {
  return (
    <SectionCard
      title='Passenger details'
      subtitle='Each passenger needs their own name and contact details for the airline — the first passenger defaults to your contact info above.'
    >
      <div className='space-y-4'>
        {passengers.map((p, i) => {
          const err = errors[p.id] ?? {}
          return (
            <div
              key={p.id}
              className='rounded-xl border border-border bg-muted/30 p-4'
            >
              <div className='mb-3 flex items-center justify-between gap-3'>
                <p className='font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
                  Passenger {i + 1}
                </p>
                <label className='flex items-center gap-1.5 text-[11px] text-muted-foreground'>
                  <input
                    type='checkbox'
                    checked={p.sameAsPrimary}
                    onChange={(e) =>
                      onSameAsPrimaryChange(p.id, e.target.checked)
                    }
                    className='size-3.5 accent-primary'
                  />
                  Same as contact info
                </label>
              </div>
              <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                <FieldWrap label='Title'>
                  <select
                    className={fieldClass}
                    value={p.title}
                    onChange={(e) =>
                      onUpdate(p.id, {
                        title: e.target.value as PassengerInput['title'],
                      })
                    }
                  >
                    <option value='mr'>Mr</option>
                    <option value='mrs'>Mrs</option>
                    <option value='ms'>Ms</option>
                    <option value='miss'>Miss</option>
                    <option value='dr'>Dr</option>
                  </select>
                </FieldWrap>
                <FieldWrap label='Gender'>
                  <select
                    className={fieldClass}
                    value={p.gender}
                    onChange={(e) =>
                      onUpdate(p.id, {
                        gender: e.target.value as PassengerInput['gender'],
                      })
                    }
                  >
                    <option value='m'>Male</option>
                    <option value='f'>Female</option>
                  </select>
                </FieldWrap>
                <FieldWrap label='First name' error={err.given_name}>
                  <input
                    className={fieldClass}
                    value={p.given_name}
                    disabled={p.sameAsPrimary}
                    onChange={(e) =>
                      onUpdate(p.id, { given_name: e.target.value })
                    }
                  />
                </FieldWrap>
                <FieldWrap label='Last name' error={err.family_name}>
                  <input
                    className={fieldClass}
                    value={p.family_name}
                    disabled={p.sameAsPrimary}
                    onChange={(e) =>
                      onUpdate(p.id, { family_name: e.target.value })
                    }
                  />
                </FieldWrap>
                <FieldWrap label='Date of birth' error={err.born_on}>
                  <DateOfBirthPicker
                    value={p.born_on}
                    onChange={(iso) => onUpdate(p.id, { born_on: iso })}
                    min={minDobISO()}
                    max={todayISO()}
                  />
                </FieldWrap>
                <FieldWrap label='Email' error={err.email}>
                  <input
                    type='email'
                    className={fieldClass}
                    value={p.email}
                    disabled={p.sameAsPrimary}
                    onChange={(e) => onUpdate(p.id, { email: e.target.value })}
                  />
                </FieldWrap>
                <FieldWrap label='Phone' error={err.phone_number}>
                  <PhoneInput
                    country='es'
                    value={p.phone_number.replace(/^\+/, '')}
                    disabled={p.sameAsPrimary}
                    onChange={(val) =>
                      onUpdate(p.id, { phone_number: `+${val}` })
                    }
                    inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary disabled:!opacity-60'
                    buttonClass='!rounded-l-xl !border-border !bg-muted/60'
                    dropdownClass='!bg-card !border-border !text-foreground'
                    searchClass='!bg-background !text-foreground !border-border'
                  />
                </FieldWrap>
                {p.offerType === 'infant_without_seat' && (
                  <FieldWrap label='Infant status'>
                    <div className='rounded-lg border border-border bg-muted px-3 py-2 text-xs text-muted-foreground'>
                      Infant without seat · must be assigned to a traveling
                      adult.
                    </div>
                  </FieldWrap>
                )}
                {p.offerType !== 'infant_without_seat' &&
                  passengers.some(
                    (other) =>
                      other.offerType === 'infant_without_seat' &&
                      other.id !== p.id,
                  ) && (
                    <FieldWrap
                      label='Traveling with infant'
                      error={err.infant_passenger_id}
                    >
                      <select
                        className={fieldClass}
                        value={p.infant_passenger_id ?? ''}
                        onChange={(e) =>
                          onUpdate(p.id, {
                            infant_passenger_id: e.target.value || undefined,
                          })
                        }
                      >
                        <option value=''>No infant</option>
                        {passengers
                          .filter(
                            (other) =>
                              other.offerType === 'infant_without_seat',
                          )
                          .map((infant, infantIndex) => (
                            <option key={infant.id} value={infant.id}>
                              Infant {infantIndex + 1}
                            </option>
                          ))}
                      </select>
                    </FieldWrap>
                  )}
                {requireIdentityDocs && (
                  <>
                    <FieldWrap
                      label='Passport number'
                      error={err.passportNumber}
                    >
                      <input
                        className={fieldClass}
                        value={p.passportNumber ?? ''}
                        onChange={(e) =>
                          onUpdate(p.id, { passportNumber: e.target.value })
                        }
                      />
                    </FieldWrap>
                    <FieldWrap
                      label='Passport issuing country'
                      error={err.passportCountry}
                    >
                      <input
                        className={fieldClass}
                        placeholder='NG'
                        value={p.passportCountry ?? ''}
                        onChange={(e) =>
                          onUpdate(p.id, { passportCountry: e.target.value })
                        }
                      />
                    </FieldWrap>
                    <FieldWrap
                      label='Passport expiry date'
                      error={err.passportExpiry}
                    >
                      <div className={fieldClass}>
                        <DatePicker
                          value={p.passportExpiry ?? ''}
                          onChange={(iso) =>
                            onUpdate(p.id, { passportExpiry: iso })
                          }
                          min={todayISO()}
                          placeholder='Date'
                        />
                      </div>
                    </FieldWrap>
                  </>
                )}
                {err.identity_documents && (
                  <p className='text-[11px] text-destructive sm:col-span-2'>
                    {err.identity_documents}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
