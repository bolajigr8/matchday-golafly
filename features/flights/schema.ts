// import { z } from 'zod'

// const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// export function todayISO() {
//   const d = new Date()
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// const MAX_PASSENGER_AGE_YEARS = 120

// export function minDobISO() {
//   const d = new Date()
//   d.setFullYear(d.getFullYear() - MAX_PASSENGER_AGE_YEARS)
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// function ageFromDob(dob: string): number {
//   const [y, m, d] = dob.split('-').map(Number)
//   const today = new Date()
//   let age = today.getFullYear() - y
//   const hasHadBirthdayThisYear =
//     today.getMonth() + 1 > m ||
//     (today.getMonth() + 1 === m && today.getDate() >= d)
//   if (!hasHadBirthdayThisYear) age -= 1
//   return age
// }

// export const CABIN_CLASS_OPTIONS = [
//   { value: 'economy', label: 'Economy' },
//   { value: 'premium_economy', label: 'Premium Economy' },
//   { value: 'business', label: 'Business' },
//   { value: 'first', label: 'First' },
// ] as const

// const MAX_TOTAL_PASSENGERS = 9

// export const flightSearchSchema = z
//   .object({
//     origin: z
//       .string()
//       .trim()
//       .regex(
//         /^[A-Za-z]{3}$/,
//         'Select a valid airport from the suggestions list',
//       )
//       .transform((v) => v.toUpperCase()),
//     destination: z
//       .string()
//       .trim()
//       .regex(
//         /^[A-Za-z]{3}$/,
//         'Select a valid airport from the suggestions list',
//       )
//       .transform((v) => v.toUpperCase()),
//     departure_date: z
//       .string()
//       .regex(DATE_RE, 'Select a departure date')
//       .refine((d) => d >= todayISO(), "Departure date can't be in the past"),
//     return_date: z.string().optional(),
//     adults: z.coerce
//       .number()
//       .min(1, 'At least 1 adult is required')
//       .max(MAX_TOTAL_PASSENGERS),
//     children_ages: z.array(z.coerce.number().min(2).max(11)),
//     infants: z.coerce.number().min(0).max(MAX_TOTAL_PASSENGERS),
//     cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']),
//   })
//   .superRefine((vals, ctx) => {
//     if (vals.return_date) {
//       if (!DATE_RE.test(vals.return_date)) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['return_date'],
//           message: 'Select a valid return date',
//         })
//       } else if (vals.return_date < vals.departure_date) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['return_date'],
//           message: "Return can't be before departure",
//         })
//       }
//     }
//     if (
//       vals.origin &&
//       vals.destination &&
//       vals.origin.trim().toUpperCase() === vals.destination.trim().toUpperCase()
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['destination'],
//         message: "Origin and destination can't be the same",
//       })
//     }
//     const total = vals.adults + vals.children_ages.length + vals.infants
//     if (total > MAX_TOTAL_PASSENGERS) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['adults'],
//         message: `Maximum ${MAX_TOTAL_PASSENGERS} passengers per booking`,
//       })
//     }
//     if (vals.infants > vals.adults) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['infants'],
//         message: 'Each infant must travel with an adult',
//       })
//     }
//   })

// export type FlightSearchValues = z.infer<typeof flightSearchSchema>

// /* ── Checkout ────────────────────────────────────────────────── */

// export const identityDocumentSchema = z.object({
//   type: z.string().min(1),
//   unique_identifier: z.string().min(1, 'Document number is required'),
//   issuing_country_code: z
//     .string()
//     .length(2, 'Use a 2-letter country code (e.g. NG)')
//     .regex(/^[A-Za-z]{2}$/, 'Use letters only, e.g. NG'),
//   expires_on: z.string().optional(),
// })
// export type IdentityDocumentValues = z.infer<typeof identityDocumentSchema>

// export const passengerSchema = z.object({
//   id: z.string().min(1),
//   offerType: z.enum(['adult', 'child', 'infant_without_seat']).optional(),
//   title: z.enum(['mr', 'mrs', 'ms', 'miss', 'dr']),
//   given_name: z
//     .string()
//     .trim()
//     .min(2, 'First name must be at least 2 characters')
//     .regex(/^[A-Za-z][A-Za-z '-]*$/, 'First name can only contain letters'),
//   family_name: z
//     .string()
//     .trim()
//     .min(2, 'Last name must be at least 2 characters')
//     .regex(/^[A-Za-z][A-Za-z '-]*$/, 'Last name can only contain letters'),
//   gender: z.enum(['m', 'f']),
//   born_on: z
//     .string()
//     .regex(DATE_RE, 'Enter a valid date of birth')
//     .refine((d) => d <= todayISO(), 'Date of birth cannot be in the future')
//     .refine(
//       (d) => d >= minDobISO(),
//       `Please enter a realistic date of birth (age can't exceed ${MAX_PASSENGER_AGE_YEARS} years)`,
//     ),
//   email: z.string().email('Enter a valid email for this passenger'),
//   phone_number: z
//     .string()
//     .regex(
//       /^\+\d{7,15}$/,
//       'Use international format starting with +, e.g. +2348012345678',
//     ),
//   infant_passenger_id: z.string().optional(),
//   identity_documents: z.array(identityDocumentSchema).optional(),
// })
// export type PassengerValues = z.infer<typeof passengerSchema>

// export function buildCheckoutSchema(
//   offerPassengers: { id: string; type?: string | null }[],
//   requireIdentityDocuments: boolean,
// ) {
//   return z
//     .object({
//       passengers: z.array(passengerSchema).min(1),
//       contact_email: z.string().email('Enter a valid contact email'),
//       contact_phone: z
//         .string()
//         .regex(
//           /^\+\d{7,15}$/,
//           'Use international format starting with +, e.g. +2348012345678',
//         ),
//     })
//     .superRefine((vals, ctx) => {
//       const infantIds = new Set(
//         offerPassengers
//           .filter((p) => p.type === 'infant_without_seat')
//           .map((p) => p.id),
//       )
//       const claimedInfantIds = new Set<string>()

//       vals.passengers.forEach((p, i) => {
//         const offerPax = offerPassengers.find((op) => op.id === p.id)
//         const type = offerPax?.type

//         if (!type) return

//         const age = ageFromDob(p.born_on)

//         if (type === 'adult' && age < 18) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as an adult — date of birth must show age 18 or older',
//           })
//         }
//         if (type === 'child' && (age < 2 || age > 11)) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as a child (age 2–11) — date of birth is outside that range',
//           })
//         }
//         if (type === 'infant_without_seat' && age >= 2) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as an infant (under 2) — date of birth is outside that range',
//           })
//         }

//         if (p.infant_passenger_id) {
//           if (type !== 'adult') {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'Only an adult can travel with an infant',
//             })
//           } else if (!infantIds.has(p.infant_passenger_id)) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'Select a valid infant for this booking',
//             })
//           } else if (claimedInfantIds.has(p.infant_passenger_id)) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'This infant is already assigned to another adult',
//             })
//           } else {
//             claimedInfantIds.add(p.infant_passenger_id)
//           }
//         }

//         if (requireIdentityDocuments) {
//           const doc = p.identity_documents?.[0]
//           if (!doc?.unique_identifier || !doc?.issuing_country_code) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'identity_documents'],
//               message: 'Passport details are required for this flight',
//             })
//           }
//         }
//       })

//       for (const infantId of infantIds) {
//         if (!claimedInfantIds.has(infantId)) {
//           const infantIndex = vals.passengers.findIndex(
//             (p) => p.id === infantId,
//           )
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path:
//               infantIndex >= 0
//                 ? ['passengers', infantIndex, 'id']
//                 : ['passengers'],
//             message:
//               'This infant needs to be assigned to a traveling adult above',
//           })
//         }
//       }
//     })
// }
// export type CheckoutValues = z.infer<ReturnType<typeof buildCheckoutSchema>>

// export const cancellationSchema = z.object({
//   order_id: z
//     .string()
//     .min(1, 'Order ID is required')
//     .regex(/^ord_/i, 'Order ID should start with "ord_"'),
//   reason: z
//     .string()
//     .max(2000, 'Reason must be under 2000 characters')
//     .optional(),
// })
// export type CancellationValues = z.infer<typeof cancellationSchema>

// export const guestCancellationSchema = z
//   .object({
//     identifierType: z.enum(['reference', 'pnr']),
//     reference: z.string().optional(),
//     pnr: z.string().optional(),
//     email: z.string().email('Enter a valid email'),
//     reason: z
//       .string()
//       .max(2000, 'Reason must be under 2000 characters')
//       .optional(),
//   })
//   .superRefine((vals, ctx) => {
//     if (vals.identifierType === 'reference') {
//       if (!vals.reference || !/^GF-?\d{4,}$/i.test(vals.reference.trim())) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['reference'],
//           message: 'Enter a valid reference, e.g. GF-00001234',
//         })
//       }
//     } else {
//       if (!vals.pnr || !/^[A-Za-z0-9]{5,8}$/.test(vals.pnr.trim())) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['pnr'],
//           message: 'Enter a valid 5–8 character booking PNR',
//         })
//       }
//     }
//   })
// export type GuestCancellationValues = z.infer<typeof guestCancellationSchema>

// import { z } from 'zod'

// const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// export function todayISO() {
//   const d = new Date()
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// const MAX_PASSENGER_AGE_YEARS = 100

// export function minDobISO() {
//   const d = new Date()
//   d.setFullYear(d.getFullYear() - MAX_PASSENGER_AGE_YEARS)
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
// }

// function ageFromDob(dob: string): number {
//   const [y, m, d] = dob.split('-').map(Number)
//   const today = new Date()
//   let age = today.getFullYear() - y
//   const hasHadBirthdayThisYear =
//     today.getMonth() + 1 > m ||
//     (today.getMonth() + 1 === m && today.getDate() >= d)
//   if (!hasHadBirthdayThisYear) age -= 1
//   return age
// }

// export const CABIN_CLASS_OPTIONS = [
//   { value: 'economy', label: 'Economy' },
//   { value: 'premium_economy', label: 'Premium Economy' },
//   { value: 'business', label: 'Business' },
//   { value: 'first', label: 'First' },
// ] as const

// const MAX_TOTAL_PASSENGERS = 9

// export const flightSearchSchema = z
//   .object({
//     // origin: z.string().min(3, 'Enter at least 3 characters'),
//     // destination: z.string().min(3, 'Enter at least 3 characters'),

//     origin: z
//       .string()
//       .trim()
//       .regex(
//         /^[A-Za-z]{3}$/,
//         'Select a valid airport from the suggestions list',
//       )
//       .transform((v) => v.toUpperCase()),
//     destination: z
//       .string()
//       .trim()
//       .regex(
//         /^[A-Za-z]{3}$/,
//         'Select a valid airport from the suggestions list',
//       )
//       .transform((v) => v.toUpperCase()),
//     departure_date: z
//       .string()
//       .regex(DATE_RE, 'Select a departure date')
//       .refine((d) => d >= todayISO(), "Departure date can't be in the past"),
//     return_date: z.string().optional(),
//     adults: z.coerce
//       .number()
//       .min(1, 'At least 1 adult is required')
//       .max(MAX_TOTAL_PASSENGERS),
//     children_ages: z.array(z.coerce.number().min(2).max(11)),
//     infants: z.coerce.number().min(0).max(MAX_TOTAL_PASSENGERS),
//     cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']),
//   })
//   .superRefine((vals, ctx) => {
//     if (vals.return_date) {
//       if (!DATE_RE.test(vals.return_date)) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['return_date'],
//           message: 'Select a valid return date',
//         })
//       } else if (vals.return_date < vals.departure_date) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['return_date'],
//           message: "Return can't be before departure",
//         })
//       }
//     }
//     if (
//       vals.origin &&
//       vals.destination &&
//       vals.origin.trim().toUpperCase() === vals.destination.trim().toUpperCase()
//     ) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['destination'],
//         message: "Origin and destination can't be the same",
//       })
//     }
//     const total = vals.adults + vals.children_ages.length + vals.infants
//     if (total > MAX_TOTAL_PASSENGERS) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['adults'],
//         message: `Maximum ${MAX_TOTAL_PASSENGERS} passengers per booking`,
//       })
//     }
//     if (vals.infants > vals.adults) {
//       ctx.addIssue({
//         code: z.ZodIssueCode.custom,
//         path: ['infants'],
//         message: 'Each infant must travel with an adult',
//       })
//     }
//   })

// export type FlightSearchValues = z.infer<typeof flightSearchSchema>

// /* ── Checkout ────────────────────────────────────────────────── */

// export const identityDocumentSchema = z.object({
//   type: z.string().min(1),
//   unique_identifier: z.string().min(1, 'Document number is required'),
//   issuing_country_code: z
//     .string()
//     .length(2, 'Use a 2-letter country code (e.g. NG)')
//     .regex(/^[A-Za-z]{2}$/, 'Use letters only, e.g. NG'),
//   expires_on: z.string().optional(),
// })
// export type IdentityDocumentValues = z.infer<typeof identityDocumentSchema>

// export const passengerSchema = z.object({
//   id: z.string().min(1),
//   offerType: z.enum(['adult', 'child', 'infant_without_seat']).optional(),
//   title: z.enum(['mr', 'mrs', 'ms', 'miss', 'dr']),
//   given_name: z
//     .string()
//     .trim()
//     .min(2, 'First name must be at least 2 characters')
//     .regex(/^[A-Za-z][A-Za-z '-]*$/, 'First name can only contain letters'),
//   family_name: z
//     .string()
//     .trim()
//     .min(2, 'Last name must be at least 2 characters')
//     .regex(/^[A-Za-z][A-Za-z '-]*$/, 'Last name can only contain letters'),
//   gender: z.enum(['m', 'f']),
//   born_on: z
//     .string()
//     .regex(DATE_RE, 'Enter a valid date of birth')
//     .refine((d) => d <= todayISO(), 'Date of birth cannot be in the future')
//     .refine(
//       (d) => d >= minDobISO(),
//       `Please enter a realistic date of birth (under ${MAX_PASSENGER_AGE_YEARS} years old)`,
//     ),
//   email: z.string().email('Enter a valid email for this passenger'),
//   phone_number: z
//     .string()
//     .regex(
//       /^\+\d{7,15}$/,
//       'Use international format starting with +, e.g. +34612345678',
//     ),
//   infant_passenger_id: z.string().optional(),
//   identity_documents: z.array(identityDocumentSchema).optional(),
// })
// export type PassengerValues = z.infer<typeof passengerSchema>

// export function buildCheckoutSchema(
//   offerPassengers: { id: string; type?: string | null }[],
//   requireIdentityDocuments: boolean,
// ) {
//   return z
//     .object({
//       passengers: z.array(passengerSchema).min(1),
//       contact_email: z.string().email('Enter a valid contact email'),
//       contact_phone: z
//         .string()
//         .regex(
//           /^\+\d{7,15}$/,
//           'Use international format starting with +, e.g. +34612345678',
//         ),
//     })
//     .superRefine((vals, ctx) => {
//       const infantIds = new Set(
//         offerPassengers
//           .filter((p) => p.type === 'infant_without_seat')
//           .map((p) => p.id),
//       )
//       const claimedInfantIds = new Set<string>()

//       vals.passengers.forEach((p, i) => {
//         const offerPax = offerPassengers.find((op) => op.id === p.id)
//         const type = offerPax?.type

//         if (!type) return

//         const age = ageFromDob(p.born_on)

//         if (type === 'adult' && age < 18) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as an adult — date of birth must show age 18 or older',
//           })
//         }
//         if (type === 'child' && (age < 2 || age > 11)) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as a child (age 2–11) — date of birth is outside that range',
//           })
//         }
//         if (type === 'infant_without_seat' && age >= 2) {
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['passengers', i, 'born_on'],
//             message:
//               'This passenger was booked as an infant (under 2) — date of birth is outside that range',
//           })
//         }

//         if (p.infant_passenger_id) {
//           if (type !== 'adult') {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'Only an adult can travel with an infant',
//             })
//           } else if (!infantIds.has(p.infant_passenger_id)) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'Select a valid infant for this booking',
//             })
//           } else if (claimedInfantIds.has(p.infant_passenger_id)) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'infant_passenger_id'],
//               message: 'This infant is already assigned to another adult',
//             })
//           } else {
//             claimedInfantIds.add(p.infant_passenger_id)
//           }
//         }

//         if (requireIdentityDocuments) {
//           const doc = p.identity_documents?.[0]
//           if (!doc?.unique_identifier || !doc?.issuing_country_code) {
//             ctx.addIssue({
//               code: z.ZodIssueCode.custom,
//               path: ['passengers', i, 'identity_documents'],
//               message: 'Passport details are required for this flight',
//             })
//           }
//         }
//       })

//       for (const infantId of infantIds) {
//         if (!claimedInfantIds.has(infantId)) {
//           const infantIndex = vals.passengers.findIndex(
//             (p) => p.id === infantId,
//           )
//           ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path:
//               infantIndex >= 0
//                 ? ['passengers', infantIndex, 'id']
//                 : ['passengers'],
//             message: 'Select which adult this infant is traveling with',
//           })
//         }
//       }
//     })
// }
// export type CheckoutValues = z.infer<ReturnType<typeof buildCheckoutSchema>>

// export const cancellationSchema = z.object({
//   order_id: z
//     .string()
//     .min(1, 'Order ID is required')
//     .regex(/^ord_/i, 'Order ID should start with "ord_"'),
//   reason: z
//     .string()
//     .max(2000, 'Reason must be under 2000 characters')
//     .optional(),
// })
// export type CancellationValues = z.infer<typeof cancellationSchema>

// export const guestCancellationSchema = z
//   .object({
//     identifierType: z.enum(['reference', 'pnr']),
//     reference: z.string().optional(),
//     pnr: z.string().optional(),
//     email: z.string().email('Enter a valid email'),
//     reason: z
//       .string()
//       .max(2000, 'Reason must be under 2000 characters')
//       .optional(),
//   })
//   .superRefine((vals, ctx) => {
//     if (vals.identifierType === 'reference') {
//       if (!vals.reference || !/^GF-?\d{4,}$/i.test(vals.reference.trim())) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['reference'],
//           message: 'Enter a valid reference, e.g. GF-00001234',
//         })
//       }
//     } else {
//       if (!vals.pnr || !/^[A-Za-z0-9]{5,8}$/.test(vals.pnr.trim())) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           path: ['pnr'],
//           message: 'Enter a valid 5–8 character booking PNR',
//         })
//       }
//     }
//   })
// export type GuestCancellationValues = z.infer<typeof guestCancellationSchema>

import { z } from 'zod'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const MAX_PASSENGER_AGE_YEARS = 120

export function minDobISO() {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MAX_PASSENGER_AGE_YEARS)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ageFromDob(dob: string): number {
  const [y, m, d] = dob.split('-').map(Number)
  const today = new Date()
  let age = today.getFullYear() - y
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d)
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export const CABIN_CLASS_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First' },
] as const

const MAX_TOTAL_PASSENGERS = 9

export const flightSearchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z]{3}$/,
        'Select a valid airport from the suggestions list',
      )
      .transform((v) => v.toUpperCase()),
    destination: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z]{3}$/,
        'Select a valid airport from the suggestions list',
      )
      .transform((v) => v.toUpperCase()),
    departure_date: z
      .string()
      .regex(DATE_RE, 'Select a departure date')
      .refine((d) => d >= todayISO(), "Departure date can't be in the past"),
    return_date: z.string().optional(),
    adults: z.coerce
      .number()
      .min(1, 'At least 1 adult is required')
      .max(MAX_TOTAL_PASSENGERS),
    children_ages: z.array(z.coerce.number().min(2).max(11)),
    infants: z.coerce.number().min(0).max(MAX_TOTAL_PASSENGERS),
    cabin_class: z.enum(['economy', 'premium_economy', 'business', 'first']),
  })
  .superRefine((vals, ctx) => {
    if (vals.return_date) {
      if (!DATE_RE.test(vals.return_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['return_date'],
          message: 'Select a valid return date',
        })
      } else if (vals.return_date < vals.departure_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['return_date'],
          message: "Return can't be before departure",
        })
      }
    }
    if (
      vals.origin &&
      vals.destination &&
      vals.origin.trim().toUpperCase() === vals.destination.trim().toUpperCase()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: "Origin and destination can't be the same",
      })
    }
    const total = vals.adults + vals.children_ages.length + vals.infants
    if (total > MAX_TOTAL_PASSENGERS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['adults'],
        message: `Maximum ${MAX_TOTAL_PASSENGERS} passengers per booking`,
      })
    }
    if (vals.infants > vals.adults) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['infants'],
        message: 'Each infant must travel with an adult',
      })
    }
  })

export type FlightSearchValues = z.infer<typeof flightSearchSchema>

/* ── Checkout ────────────────────────────────────────────────── */

export const identityDocumentSchema = z.object({
  type: z.string().min(1),
  unique_identifier: z.string().min(1, 'Document number is required'),
  issuing_country_code: z
    .string()
    .length(2, 'Use a 2-letter country code (e.g. NG)')
    .regex(/^[A-Za-z]{2}$/, 'Use letters only, e.g. NG'),
  expires_on: z.string().optional(),
})
export type IdentityDocumentValues = z.infer<typeof identityDocumentSchema>

export const passengerSchema = z.object({
  id: z.string().min(1),
  offerType: z.enum(['adult', 'child', 'infant_without_seat']).optional(),
  title: z.enum(['mr', 'mrs', 'ms', 'miss', 'dr']),
  given_name: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[A-Za-z][A-Za-z '-]*$/, 'First name can only contain letters'),
  family_name: z
    .string()
    .trim()
    .min(2, 'Last name must be at least 2 characters')
    .regex(/^[A-Za-z][A-Za-z '-]*$/, 'Last name can only contain letters'),
  gender: z.enum(['m', 'f']),
  born_on: z
    .string()
    .regex(DATE_RE, 'Enter a valid date of birth')
    .refine((d) => d <= todayISO(), 'Date of birth cannot be in the future')
    .refine(
      (d) => d >= minDobISO(),
      `Please enter a realistic date of birth (age can't exceed ${MAX_PASSENGER_AGE_YEARS} years)`,
    ),
  email: z.string().email('Enter a valid email for this passenger'),
  phone_number: z
    .string()
    .regex(
      /^\+\d{7,15}$/,
      'Use international format starting with +, e.g. +34612345678',
    ),
  infant_passenger_id: z.string().optional(),
  identity_documents: z.array(identityDocumentSchema).optional(),
})
export type PassengerValues = z.infer<typeof passengerSchema>

export function buildCheckoutSchema(
  offerPassengers: { id: string; type?: string | null }[],
  requireIdentityDocuments: boolean,
) {
  return z
    .object({
      passengers: z.array(passengerSchema).min(1),
      contact_email: z.string().email('Enter a valid contact email'),
      contact_phone: z
        .string()
        .regex(
          /^\+\d{7,15}$/,
          'Use international format starting with +, e.g. +34612345678',
        ),
    })
    .superRefine((vals, ctx) => {
      const infantIds = new Set(
        offerPassengers
          .filter((p) => p.type === 'infant_without_seat')
          .map((p) => p.id),
      )
      const claimedInfantIds = new Set<string>()

      vals.passengers.forEach((p, i) => {
        const offerPax = offerPassengers.find((op) => op.id === p.id)
        const type = offerPax?.type

        if (!type) return

        const age = ageFromDob(p.born_on)

        if (type === 'adult' && age < 18) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passengers', i, 'born_on'],
            message:
              'This passenger was booked as an adult — date of birth must show age 18 or older',
          })
        }
        if (type === 'child' && (age < 2 || age > 11)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passengers', i, 'born_on'],
            message:
              'This passenger was booked as a child (age 2–11) — date of birth is outside that range',
          })
        }
        if (type === 'infant_without_seat' && age >= 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['passengers', i, 'born_on'],
            message:
              'This passenger was booked as an infant (under 2) — date of birth is outside that range',
          })
        }

        if (p.infant_passenger_id) {
          if (type !== 'adult') {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['passengers', i, 'infant_passenger_id'],
              message: 'Only an adult can travel with an infant',
            })
          } else if (!infantIds.has(p.infant_passenger_id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['passengers', i, 'infant_passenger_id'],
              message: 'Select a valid infant for this booking',
            })
          } else if (claimedInfantIds.has(p.infant_passenger_id)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['passengers', i, 'infant_passenger_id'],
              message: 'This infant is already assigned to another adult',
            })
          } else {
            claimedInfantIds.add(p.infant_passenger_id)
          }
        }

        if (requireIdentityDocuments) {
          const doc = p.identity_documents?.[0]
          if (!doc?.unique_identifier || !doc?.issuing_country_code) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['passengers', i, 'identity_documents'],
              message: 'Passport details are required for this flight',
            })
          }
        }
      })

      for (const infantId of infantIds) {
        if (!claimedInfantIds.has(infantId)) {
          const infantIndex = vals.passengers.findIndex(
            (p) => p.id === infantId,
          )
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path:
              infantIndex >= 0
                ? ['passengers', infantIndex, 'id']
                : ['passengers'],
            message:
              'This infant needs to be assigned to a traveling adult above',
          })
        }
      }
    })
}
export type CheckoutValues = z.infer<ReturnType<typeof buildCheckoutSchema>>

export const cancellationSchema = z.object({
  order_id: z
    .string()
    .min(1, 'Order ID is required')
    .regex(/^ord_/i, 'Order ID should start with "ord_"'),
  reason: z
    .string()
    .max(2000, 'Reason must be under 2000 characters')
    .optional(),
})
export type CancellationValues = z.infer<typeof cancellationSchema>

export const guestCancellationSchema = z
  .object({
    identifierType: z.enum(['reference', 'pnr']),
    reference: z.string().optional(),
    pnr: z.string().optional(),
    email: z.string().email('Enter a valid email'),
    reason: z
      .string()
      .max(2000, 'Reason must be under 2000 characters')
      .optional(),
  })
  .superRefine((vals, ctx) => {
    if (vals.identifierType === 'reference') {
      if (!vals.reference || !/^GF-?\d{4,}$/i.test(vals.reference.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reference'],
          message: 'Enter a valid reference, e.g. GF-00001234',
        })
      }
    } else {
      if (!vals.pnr || !/^[A-Za-z0-9]{5,8}$/.test(vals.pnr.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pnr'],
          message: 'Enter a valid 5–8 character booking PNR',
        })
      }
    }
  })
export type GuestCancellationValues = z.infer<typeof guestCancellationSchema>
