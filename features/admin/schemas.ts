import { z } from 'zod'

/* Zod schemas for the admin forms, ported from the Golafly frontend's
 * `schema/*.ts` with four defects corrected — each marked below.
 *
 * zod v3 in this repo, not v4.
 */

/* An optional currency that still had `.length(3)` meant CLEARING the box
   blocked submit with "Currency must be 3 characters" and no obvious cause.
   Empty is now genuinely empty. */
const optionalCurrency = z
  .string()
  .trim()
  .refine((v) => v === '' || v.length === 3, 'Currency must be 3 letters, e.g. EUR')
  .optional()
  .nullable()

const optionalDate = z.string().trim().optional().nullable()

/* Dates: the old forms had NO cross-field checks at all, so a program could be
   saved ending before it started. Comparing as strings is safe because the API
   uses ISO YYYY-MM-DD. */
const isBefore = (a?: string | null, b?: string | null) =>
  !a || !b || a.slice(0, 10) <= b.slice(0, 10)

export const programSchema = z
  .object({
    program_category_id: z.coerce.number().min(1, 'Category is required'),
    program_subcategory_id: z.coerce.number().min(1, 'Subcategory is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    slug: z.string().min(3, 'Slug is required'),
    description: z.string().optional().nullable(),
    inclusions: z.string().optional().nullable(),
    highlights: z.array(z.string()).optional(),
    badges: z.array(z.string()).optional(),
    location: z.string().optional().nullable(),
    season_label: z.string().optional().nullable(),
    country_code: z.string().optional().nullable(),
    price_from: z.coerce.number().optional().nullable(),
    price_currency: optionalCurrency,
    deadline: optionalDate,
    event_date: optionalDate,
    start_date: optionalDate,
    end_date: optionalDate,
    hero_image: z.string().optional().nullable(),
    icon_image: z.string().optional().nullable(),
    banner_url: z.string().optional().nullable(),
    brochure_url: z.string().optional().nullable(),
    details: z.record(z.string(), z.unknown()).optional(),
    status: z.boolean().default(false),
  })
  .refine((v) => isBefore(v.start_date, v.end_date), {
    message: 'End date cannot be before the start date',
    path: ['end_date'],
  })
  .refine((v) => isBefore(v.deadline, v.start_date), {
    message: 'The application deadline should fall on or before the start date',
    path: ['deadline'],
  })

export type ProgramFormValues = z.input<typeof programSchema>

export const offerSchema = z.object({
  offer_category_id: z.coerce.number().min(1, 'Category is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().min(3, 'Slug is required'),
  description: z.string().optional().nullable(),
  badges: z.array(z.string()).optional(),
  season_label: z.string().optional().nullable(),
  country_code: z.string().optional().nullable(),
  price_from: z.coerce.number().optional().nullable(),
  price_currency: optionalCurrency,
  deadline: optionalDate,
  hero_image: z.string().optional().nullable(),
  icon_image: z.string().optional().nullable(),
  /* Categories post wildly different keys — club_name vs league vs
     experience_type — so this stays open and the server validates it. */
  details: z.record(z.string(), z.unknown()).optional(),
  status: z.boolean().default(false),
})

export type OfferFormValues = z.input<typeof offerSchema>

export const academySchema = z
  .object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    slug: z.string().min(3, 'Slug must be at least 3 characters'),
    city: z.string().min(2, 'City is required'),
    country_name: z.string().min(2, 'Country is required'),
    country_code: z.string().length(2, 'Country code must be 2 letters, e.g. ES'),
    duration_label: z.string().min(2, 'Duration is required, e.g. 2 weeks'),
    age_min: z.coerce.number().min(5, 'Minimum age must be at least 5'),
    age_max: z.coerce.number().min(5, 'Maximum age must be at least 5'),
    price_from: z.coerce.number().min(0, 'Price must be 0 or more'),
    price_currency: z.string().length(3, 'Currency must be 3 letters, e.g. EUR'),
    features: z.array(z.string()).min(1, 'Add at least one feature'),
    description: z.string().optional().nullable(),
    terms_and_conditions: z.string().optional().nullable(),
    header_image_url: z.string().optional().nullable(),
    primary_image_url: z.string().optional().nullable(),
    has_accommodation: z.boolean().default(false),
    accepts_all_ages: z.boolean().default(false),
    status: z.boolean().default(false),
  })
  /* The old schema never checked this, so an academy could accept ages 18–12. */
  .refine((v) => v.age_max >= v.age_min, {
    message: 'Maximum age cannot be below the minimum',
    path: ['age_max'],
  })

export type AcademyFormValues = z.input<typeof academySchema>

/* Shared by the offer/program category forms and Teams — flat enough for the
   declarative FormSheet. */
export const categorySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2, 'Slug is required'),
  status: z.boolean().default(true),
})

export const createTeamMemberSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email address'),
    role: z.string().min(2, 'Role is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(8, 'Confirm the password'),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

/* The old update schema marked every field `.optional()` while defaulting them
   to "", so `.optional()` never engaged and an untouched form failed `.min(2)`.
   Empty now genuinely means "leave unchanged", and the password-match check —
   missing entirely from the old update schema — is applied when a password is
   actually being set. */
export const updateTeamMemberSchema = z
  .object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email address'),
    role: z.string().min(2, 'Role is required'),
    password: z
      .string()
      .refine((v) => v === '' || v.length >= 8, 'Password must be at least 8 characters'),
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

/** Create-mode slug generator. Same rules the old forms used. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}
