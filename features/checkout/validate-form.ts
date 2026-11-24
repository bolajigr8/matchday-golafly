import { buildCheckoutSchema } from '@/features/flights/schema'
import { contactFormSchema } from './schema'
import { hotelGuestFormSchema } from './schema'
import type { ContactInfo, EsimCheckoutInput, HotelGuestInput, PassengerInput } from './types'

export interface CheckoutFormErrors {
  contact: Record<string, string>
  passengers: Record<string, Record<string, string>>
  hotelGuests: Record<number, Record<string, string>>
  esim: Record<string, string>
}

function emptyErrors(): CheckoutFormErrors {
  return { contact: {}, passengers: {}, hotelGuests: {}, esim: {} }
}

export function validateCheckoutForm(params: {
  contact: ContactInfo
  passengers: PassengerInput[]
  offerPassengers?: { id: string; type?: string | null }[]
  hotelGuests: HotelGuestInput[]
  requireIdentityDocs: boolean
  hasFlight: boolean
  hasHotel: boolean
  hasEsim: boolean
  esim?: EsimCheckoutInput
}): { valid: boolean; errors: CheckoutFormErrors } {
  const errors = emptyErrors()
  const contactResult = contactFormSchema.safeParse(params.contact)
  if (!contactResult.success) {
    for (const issue of contactResult.error.issues) errors.contact[String(issue.path[0])] = issue.message
  }

  if (params.hasFlight) {
    const offerPassengers = params.offerPassengers ?? params.passengers.map((p) => ({ id: p.id, type: p.offerType }))
    const schema = buildCheckoutSchema(offerPassengers, params.requireIdentityDocs)
    const flightPassengers = params.passengers.map((p) => ({
      ...p,
      identity_documents:
        params.requireIdentityDocs && p.passportNumber && p.passportCountry
          ? [{
              type: 'passport',
              unique_identifier: p.passportNumber,
              issuing_country_code: p.passportCountry.toUpperCase(),
              ...(p.passportExpiry ? { expires_on: p.passportExpiry } : {}),
            }]
          : p.identity_documents,
    }))
    const result = schema.safeParse({
      passengers: flightPassengers,
      contact_email: params.contact.email,
      contact_phone: params.contact.phone,
    })
    if (!result.success) {
      for (const issue of result.error.issues) {
        const [root, index, field] = issue.path
        if (root === 'passengers' && typeof index === 'number') {
          const id = params.passengers[index]?.id
          if (id) {
            errors.passengers[id] ??= {}
            errors.passengers[id][String(field ?? 'form')] = issue.message
          }
        } else if (root === 'contact_email' || root === 'contact_phone') {
          errors.contact[root === 'contact_email' ? 'email' : 'phone'] = issue.message
        }
      }
    }
  }

  if (params.hasHotel) {
    params.hotelGuests.forEach((guest, index) => {
      const result = hotelGuestFormSchema.safeParse(guest)
      if (!result.success) {
        errors.hotelGuests[index] = {}
        for (const issue of result.error.issues) errors.hotelGuests[index][String(issue.path[0])] = issue.message
      }
    })
  }

  if (params.hasEsim) {
    if (!params.esim?.deviceConfirmed) errors.esim.deviceConfirmed = 'Please confirm your device is eSIM-compatible.'
    if (!params.esim?.activationConfirmed) errors.esim.activationConfirmed = 'Please confirm you understand how eSIM activation works.'
  }

  return {
    valid:
      Object.keys(errors.contact).length === 0 &&
      Object.keys(errors.passengers).length === 0 &&
      Object.keys(errors.hotelGuests).length === 0 &&
      Object.keys(errors.esim).length === 0,
    errors,
  }
}
