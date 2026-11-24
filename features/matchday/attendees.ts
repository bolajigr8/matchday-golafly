// features/matchday/attendees.ts
//
// Helpers for building the dynamic attendee form from `attendees_required`
// (doc §05 — "Building the form from attendees_required"). Never hardcode
// the field list; this module only supplies rendering hints (label,
// whether it needs the country picker) for whatever fields the order
// actually asks for.

import type { AttendeeRequiredField, AttendeeValueType } from './types'

/** "Suggested labels" table (doc §05). */
const SUGGESTED_LABELS: Record<string, string> = {
  first_name: 'First name',
  last_name: 'Last name',
  date_of_birth: 'Date of birth',
  sex: 'Gender',
  country: 'Country',
  phone: 'Phone number',
  nationality: 'Nationality',
  passport_number: 'Passport number',
  mobile_operating_system: 'Phone type',
  side: 'Supporting',
  email: 'Email address',
}

/** Label from the suggested table, falling back to a humanised version of
 *  field_name for anything new the supplier adds later (doc §05, step 4:
 *  "field_name.replace('_',' ') capitalised, for anything new" — this is
 *  the graceful-degradation path the doc explicitly asks to build even
 *  though nothing currently needs it). */
export function attendeeFieldLabel(fieldName: string): string {
  if (SUGGESTED_LABELS[fieldName]) return SUGGESTED_LABELS[fieldName]
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** The two fields that need a country picker are SELECT with empty
 *  `options` (doc §05: "A SELECT with empty options is not a bug... An
 *  empty array means the set is open-ended, which today is only country
 *  and nationality."). `nationality` is documented as TEXT/value_type but
 *  still wants a country picker per the field table — so this checks the
 *  field_name directly rather than only value_type, matching the doc's
 *  own "two that need a country picker" callout. */
export function isCountryPickerField(field: AttendeeRequiredField): boolean {
  if (field.field_name === 'nationality') return true
  return field.value_type === 'SELECT' && field.options.length === 0
}

/** `country` is validated (name or ISO-2) and rejects unknown values;
 *  `nationality` is stored as-is and must be sent as the country NAME,
 *  never an ISO code (doc §05: "If you use one picker for both, make sure
 *  it submits the name for nationality. Sending VN there is accepted and
 *  silently wrong."). The attendee form component uses this to decide
 *  what to actually put in the outgoing value for a country-picker field. */
export function countryPickerSendsIsoCode(field: AttendeeRequiredField): boolean {
  return field.field_name === 'country'
}

/** Render kind used by the attendee form component. Mirrors doc §05's
 *  "Rendering it dynamically" rules in order: options first, then
 *  value_type, with country-picker as the open-ended-SELECT case. */
export type AttendeeRenderKind =
  | 'select-options'
  | 'country-picker'
  | 'date'
  | 'email'
  | 'phone'
  | 'text'

export function attendeeRenderKind(
  field: AttendeeRequiredField,
): AttendeeRenderKind {
  if (field.options.length > 0) return 'select-options'
  if (isCountryPickerField(field)) return 'country-picker'
  const byType: Record<AttendeeValueType, AttendeeRenderKind> = {
    SELECT: 'country-picker', // open-ended SELECT with no options
    DATE: 'date',
    EMAIL: 'email',
    PHONE: 'phone',
    TEXT: 'text',
  }
  return byType[field.value_type] ?? 'text'
}

/** One attendee's answers, keyed by the API's exact field_name values.
 * SELECT membership is case-insensitive in Integration Docs 3. */
export type AttendeeAnswers = Record<string, string>

/** Builds `quantity` empty attendee slots, one per ticket (doc §04:
 *  "One entry per ticket. Two tickets means exactly two entries."). */
export function buildEmptyAttendees(
  fields: AttendeeRequiredField[],
  quantity: number,
): AttendeeAnswers[] {
  const empty: AttendeeAnswers = {}
  for (const field of fields) empty[field.field_name] = ''
  return Array.from({ length: quantity }, () => ({ ...empty }))
}

/** Client-side mirror of the server's own attendee validation (doc §10
 *  "Attendees" checklist: "Client-side validation mirroring the rules —
 *  all required fields present, exactly one entry per ticket."). Returns
 *  errors keyed as `${attendeeIndex}.${field_name}` so the form can
 *  highlight the exact cell, matching how the 422 response names the
 *  attendee index (doc §04). */
export function validateAttendees(
  fields: AttendeeRequiredField[],
  attendees: AttendeeAnswers[],
  quantity: number,
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (attendees.length !== quantity) {
    errors._count = `Expected ${quantity} attendee(s), got ${attendees.length}.`
  }

  attendees.forEach((attendee, index) => {
    for (const field of fields) {
      const value = (attendee[field.field_name] ?? '').trim()
      if (!value) {
        errors[`${index}.${field.field_name}`] = 'Required.'
        continue
      }
      if (
        field.options.length > 0 &&
        !field.options.some(
          (option) => option.toLowerCase() === value.toLowerCase(),
        )
      ) {
        // Membership matters, but Docs 3 says SELECT casing is
        // case-insensitive. The backend canonicalises the accepted value.
        errors[`${index}.${field.field_name}`] =
          `Must be one of: ${field.options.join(', ')}.`
      }
      if (field.value_type === 'DATE' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errors[`${index}.${field.field_name}`] =
          'Use the date picker — free-typed dates are stored as empty by the supplier.'
      }
    }
  })

  return errors
}

/** Maps a 422 "Attendee N is missing required field(s): x, y." style
 *  server message onto the same `${index}.${field}` keys validateAttendees
 *  produces, so server-side errors highlight the same cells (doc §04:
 *  "The 422 messages name the attendee index (1-based) and the exact
 *  fields, so they map cleanly onto form errors."). Best-effort parse —
 *  falls back to a top-level message if the shape doesn't match. */
export function parseAttendeeServerError(message: string): {
  fieldErrors: Record<string, string>
  generalMessage: string | null
} {
  const match = message.match(
    /Attendee (\d+) is missing required field\(s\):\s*(.+?)\.?$/i,
  )
  if (!match) return { fieldErrors: {}, generalMessage: message }

  const index = parseInt(match[1], 10) - 1
  const fieldNames = match[2].split(',').map((s) => s.trim())
  const fieldErrors: Record<string, string> = {}
  for (const name of fieldNames) {
    fieldErrors[`${index}.${name}`] = 'Required.'
  }
  return { fieldErrors, generalMessage: null }
}
