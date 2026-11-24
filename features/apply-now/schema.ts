import * as z from 'zod'

/* ─── Football Tourism (travel/trial applicants) ─────────────── */
export const footballTourismSchema = z.object({
  experienceType: z.string().min(1, 'Please select an experience type'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.string().min(1, 'Age is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  needsVisa: z.enum(['yes', 'no']),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms and conditions',
  }),
})
export type FootballTourismFormData = z.infer<typeof footballTourismSchema>

/* ─── Sports Marketing (brand / agency applicants) ────────────── */
export const sportsMarketingSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().min(2, 'Position is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  serviceInterest: z.string().min(1, 'Please select a service'),
  budget: z.string().min(1, 'Budget range is required'),
  projectDetails: z
    .string()
    .min(20, 'Please provide project details (min 20 characters)'),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms and conditions',
  }),
})
export type SportsMarketingFormData = z.infer<typeof sportsMarketingSchema>

/* ─── Player Management (THE PLAYER REGISTRATION — trial/tryout applicants) ───
   This is intentionally its own schema, separate from ticket-buying "fans".
   A player here is applying to be scouted/represented, not purchasing a match ticket. */
export const playerManagementSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  currentClub: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required'),
  country: z.string().min(1, 'Country is required'),
  height: z.string().optional(),
  weight: z.string().optional(),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  videoHighlights: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  experienceSummary: z
    .string()
    .min(10, 'Please provide a brief summary of your experience'),
  message: z.string().min(5, 'Please leave a short message or inquiry'),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: 'You must accept the terms and conditions',
  }),
})
export type PlayerManagementFormData = z.infer<typeof playerManagementSchema>
