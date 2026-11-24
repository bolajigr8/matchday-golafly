// // components/checkout/ticket-attendees-form.tsx
// //
// // Renders the attendee form described in the Integration Doc §05, driven
// // entirely by `attendees_required` — never a hardcoded field list. One
// // section per ticket (order.quantity), one input per required field.

// import { countries } from 'country-data-list'
// import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
// import { DatePicker } from '@/components/ui/date-picker'
// import { todayISO, minDobISO } from '@/features/flights/schema'
// import { FieldWrap, SectionCard, fieldClass } from './form-fields'
// import {
//   attendeeFieldLabel,
//   attendeeRenderKind,
//   countryPickerSendsIsoCode,
//   type AttendeeAnswers,
// } from '@/features/matchday/attendees'
// import type { AttendeeRequiredField } from '@/features/matchday/types'

// /** CountryDropdown only accepts a starting selection via `defaultValue`,
//  *  matched against `alpha3` — but our stored attendee answer is either an
//  *  ISO-2 code (`country`) or a full English name (`nationality`), never
//  *  alpha3. Without this lookup the dropdown's own button would always
//  *  show its placeholder even after a selection was made — the value is
//  *  captured correctly either way, but the control would visually look
//  *  like it forgot what was picked. */
// function findAlpha3(value: string, isIsoCode: boolean): string | undefined {
//   if (!value) return undefined
//   const list = countries.all as Country[]
//   const match = isIsoCode
//     ? list.find((c) => c.alpha2?.toUpperCase() === value.toUpperCase())
//     : list.find((c) => c.name?.toLowerCase() === value.toLowerCase())
//   return match?.alpha3
// }

// export function TicketAttendeesForm({
//   fields,
//   attendees,
//   errors,
//   onChange,
// }: {
//   fields: AttendeeRequiredField[]
//   attendees: AttendeeAnswers[]
//   /** Keyed as `${attendeeIndex}.${field_name}`, matching
//    *  validateAttendees()/parseAttendeeServerError() in
//    *  features/matchday/attendees.ts. */
//   errors: Record<string, string>
//   onChange: (attendeeIndex: number, fieldName: string, value: string) => void
// }) {
//   return (
//     <SectionCard
//       title='Ticket holder details'
//       subtitle="This stadium requires every ticket holder's details before tickets can be issued — please complete a section for each ticket. Without these, the order stays paid but the tickets can't be released."
//     >
//       <div className='space-y-5'>
//         {attendees.map((attendee, index) => (
//           <div
//             key={index}
//             className='rounded-xl border border-border bg-muted/30 p-4'
//           >
//             <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
//               Ticket holder {index + 1}
//             </p>
//             <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
//               {fields.map((field) => {
//                 const kind = attendeeRenderKind(field)
//                 const value = attendee[field.field_name] ?? ''
//                 const error = errors[`${index}.${field.field_name}`]
//                 const label = attendeeFieldLabel(field.field_name)

//                 if (kind === 'select-options') {
//                   return (
//                     <FieldWrap key={field.field_name} label={label} error={error}>
//                       <select
//                         className={fieldClass}
//                         value={value}
//                         onChange={(e) =>
//                           onChange(index, field.field_name, e.target.value)
//                         }
//                       >
//                         <option value=''>Select…</option>
//                         {field.options.map((opt) => (
//                           <option key={opt} value={opt}>
//                             {opt}
//                           </option>
//                         ))}
//                       </select>
//                     </FieldWrap>
//                   )
//                 }

//                 if (kind === 'country-picker') {
//                   const sendsIso = countryPickerSendsIsoCode(field)
//                   return (
//                     <FieldWrap key={field.field_name} label={label} error={error}>
//                       <CountryDropdown
//                         placeholder={`Select ${label.toLowerCase()}`}
//                         defaultValue={findAlpha3(value, sendsIso)}
//                         onChange={(country: Country) =>
//                           onChange(
//                             index,
//                             field.field_name,
//                             sendsIso ? country.alpha2 : country.name,
//                           )
//                         }
//                         triggerClassName={fieldClass}
//                       />
//                     </FieldWrap>
//                   )
//                 }

//                 if (kind === 'date') {
//                   return (
//                     <FieldWrap key={field.field_name} label={label} error={error}>
//                       <div className={fieldClass}>
//                         <DatePicker
//                           value={value}
//                           onChange={(iso) =>
//                             onChange(index, field.field_name, iso)
//                           }
//                           min={minDobISO()}
//                           max={todayISO()}
//                           placeholder='Date'
//                         />
//                       </div>
//                     </FieldWrap>
//                   )
//                 }

//                 if (kind === 'email') {
//                   return (
//                     <FieldWrap key={field.field_name} label={label} error={error}>
//                       <input
//                         type='email'
//                         className={fieldClass}
//                         value={value}
//                         onChange={(e) =>
//                           onChange(index, field.field_name, e.target.value)
//                         }
//                       />
//                     </FieldWrap>
//                   )
//                 }

//                 if (kind === 'phone') {
//                   return (
//                     <FieldWrap key={field.field_name} label={label} error={error}>
//                       <input
//                         type='tel'
//                         placeholder='+972500000000'
//                         className={fieldClass}
//                         value={value}
//                         onChange={(e) =>
//                           onChange(index, field.field_name, e.target.value)
//                         }
//                       />
//                     </FieldWrap>
//                   )
//                 }

//                 // Generic text fallback — also covers any field name the
//                 // supplier adds later that we've never seen (doc §05:
//                 // "build that path even though nothing currently needs it").
//                 return (
//                   <FieldWrap key={field.field_name} label={label} error={error}>
//                     <input
//                       className={fieldClass}
//                       value={value}
//                       onChange={(e) =>
//                         onChange(index, field.field_name, e.target.value)
//                       }
//                     />
//                   </FieldWrap>
//                 )
//               })}
//             </div>
//           </div>
//         ))}
//       </div>
//     </SectionCard>
//   )
// }

// components/checkout/ticket-attendees-form.tsx
//
// Renders the attendee form described in the Integration Doc §05, driven
// entirely by `attendees_required` — never a hardcoded field list. One
// section per ticket (order.quantity), one input per required field.

import { countries } from 'country-data-list'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
import { DatePicker } from '@/components/ui/date-picker'
import { todayISO, minDobISO } from '@/features/flights/schema'
import { FieldWrap, fieldClass } from './form-fields'
import { cn } from '@/lib/utils'
import {
  attendeeFieldLabel,
  attendeeRenderKind,
  countryPickerSendsIsoCode,
  type AttendeeAnswers,
} from '@/features/matchday/attendees'
import type { AttendeeRequiredField } from '@/features/matchday/types'

/** CountryDropdown only accepts a starting selection via `defaultValue`,
 *  matched against `alpha3` — but our stored attendee answer is either an
 *  ISO-2 code (`country`) or a full English name (`nationality`), never
 *  alpha3. Without this lookup the dropdown's own button would always
 *  show its placeholder even after a selection was made — the value is
 *  captured correctly either way, but the control would visually look
 *  like it forgot what was picked. */
/** 16 px text on phones: iPhone Safari zooms the whole page into any input
 *  smaller than that when it is tapped, which makes the form jump around. */
const inputClass = cn(fieldClass, 'min-w-0 text-[16px] sm:text-[13px]')

function findAlpha3(value: string, isIsoCode: boolean): string | undefined {
  if (!value) return undefined
  const list = countries.all as Country[]
  const match = isIsoCode
    ? list.find((c) => c.alpha2?.toUpperCase() === value.toUpperCase())
    : list.find((c) => c.name?.toLowerCase() === value.toLowerCase())
  return match?.alpha3
}

export function TicketAttendeesForm({
  fields,
  attendees,
  errors,
  onChange,
}: {
  fields: AttendeeRequiredField[]
  attendees: AttendeeAnswers[]
  /** Keyed as `${attendeeIndex}.${field_name}`, matching
   *  validateAttendees()/parseAttendeeServerError() in
   *  features/matchday/attendees.ts. */
  errors: Record<string, string>
  onChange: (attendeeIndex: number, fieldName: string, value: string) => void
}) {
  return (
    // A framed card from the sm breakpoint up; on phones the page's own card
    // is the only frame, so the inputs use almost the full screen width.
    <div className='min-w-0 sm:rounded-2xl sm:border sm:border-border sm:bg-card sm:p-5'>
      <div className='mb-4'>
        <h2 className='text-[15px] font-bold text-foreground sm:text-[13px]'>
          Ticket holder details
        </h2>
        <p className='mt-1 text-[13px] leading-relaxed text-muted-foreground sm:text-xs'>
          This stadium requires every ticket holder&apos;s details before tickets can be issued. Please
          complete a section for each ticket. Without these, the order stays paid but the tickets
          can&apos;t be released.
        </p>
      </div>
      <div className='space-y-4 sm:space-y-5'>
        {attendees.map((attendee, index) => (
          <div
            key={index}
            className='min-w-0 rounded-xl border border-border bg-muted/30 p-3 sm:p-4'
          >
            <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-primary'>
              Ticket holder {index + 1}
            </p>
            <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
              {fields.map((field) => (
                // data-attendee-key lets the page scroll to the first field
                // with a problem (key = `${index}.${field_name}`, as in errors).
                <div
                  key={field.field_name}
                  data-attendee-key={`${index}.${field.field_name}`}
                  className='scroll-mt-28'
                >
                {(() => {
                const kind = attendeeRenderKind(field)
                const value = attendee[field.field_name] ?? ''
                const error = errors[`${index}.${field.field_name}`]
                const label = attendeeFieldLabel(field.field_name)

                if (kind === 'select-options') {
                  return (
                    <FieldWrap
                      key={field.field_name}
                      label={label}
                      error={error}
                    >
                      <select
                        className={inputClass}
                        value={value}
                        onChange={(e) =>
                          onChange(index, field.field_name, e.target.value)
                        }
                      >
                        <option value=''>Select…</option>
                        {field.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </FieldWrap>
                  )
                }

                if (kind === 'country-picker') {
                  const sendsIso = countryPickerSendsIsoCode(field)
                  return (
                    <FieldWrap
                      key={field.field_name}
                      label={label}
                      error={error}
                    >
                      <CountryDropdown
                        placeholder={`Select ${label.toLowerCase()}`}
                        defaultValue={findAlpha3(value, sendsIso)}
                        onChange={(country: Country) =>
                          onChange(
                            index,
                            field.field_name,
                            sendsIso ? country.alpha2 : country.name,
                          )
                        }
                        triggerClassName={inputClass}
                      />
                    </FieldWrap>
                  )
                }

                if (kind === 'date') {
                  return (
                    <FieldWrap
                      key={field.field_name}
                      label={label}
                      error={error}
                    >
                      <div className={inputClass}>
                        <DatePicker
                          value={value}
                          onChange={(iso) =>
                            onChange(index, field.field_name, iso)
                          }
                          min={minDobISO()}
                          max={todayISO()}
                          placeholder='Date'
                        />
                      </div>
                    </FieldWrap>
                  )
                }

                if (kind === 'email') {
                  return (
                    <FieldWrap
                      key={field.field_name}
                      label={label}
                      error={error}
                    >
                      <input
                        type='email'
                        className={inputClass}
                        value={value}
                        onChange={(e) =>
                          onChange(index, field.field_name, e.target.value)
                        }
                      />
                    </FieldWrap>
                  )
                }

                if (kind === 'phone') {
                  return (
                    <FieldWrap
                      key={field.field_name}
                      label={label}
                      error={error}
                    >
                      <input
                        type='tel'
                        placeholder='+34612345678'
                        className={inputClass}
                        value={value}
                        onChange={(e) =>
                          onChange(index, field.field_name, e.target.value)
                        }
                      />
                    </FieldWrap>
                  )
                }

                // Generic text fallback — also covers any field name the
                // supplier adds later that we've never seen (doc §05:
                // "build that path even though nothing currently needs it").
                return (
                  <FieldWrap key={field.field_name} label={label} error={error}>
                    <input
                      className={inputClass}
                      value={value}
                      onChange={(e) =>
                        onChange(index, field.field_name, e.target.value)
                      }
                    />
                  </FieldWrap>
                )
                })()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
