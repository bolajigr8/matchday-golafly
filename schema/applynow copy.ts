import * as z from 'zod'

// Football Tourism Schema
export const footballTourismSchema = z.object({
  offer_id: z.string().min(1, 'Please select a specific offer').optional(),
  experienceType: z.string().min(1, 'Please select an experience type'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  age: z.string().min(1, 'Age is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  needsVisa: z.enum(['yes', 'no']),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  country: z.string().min(1, 'Country is required'),
  profileFile: z.any().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

// Sports Marketing Schema
export const sportsMarketingSchema = z.object({
  offer_id: z.string().min(1, 'Please select a specific offer').optional(),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  position: z.string().min(2, 'Position is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  country: z.string().min(1, 'Country is required'),
  serviceInterest: z.string().min(1, 'Please select a service'),
  budget: z.string().min(1, 'Budget range is required'),
  projectDetails: z
    .string()
    .min(20, 'Please provide project details (min 20 characters)'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

// Player Management Schema
export const playerManagementSchema = z.object({
  offer_id: z.string().min(1, 'Please select a specific offer').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  nationality: z.string().min(1, 'Nationality is required'),
  currentClub: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  country: z.string().min(1, 'Country is required'),
  height: z.string().optional(),
  weight: z.string().optional(),
  preferredFoot: z.enum(['left', 'right', 'both']).optional(),
  trainingLink: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  videoHighlights: z
    .string()
    .url('Please provide a valid URL')
    .optional()
    .or(z.literal('')),
  experienceSummary: z
    .string()
    .min(10, 'Please provide a brief summary of your experience'),
  message: z.string().min(5, 'Please leave a short message or inquiry'),
  profileFile: z.any().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
})

// Exit Intent

export const exitIntentSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
})

export type FootballTourismFormData = z.infer<typeof footballTourismSchema>
export type SportsMarketingFormData = z.infer<typeof sportsMarketingSchema>
export type PlayerManagementFormData = z.infer<typeof playerManagementSchema>

export type ExitIntentFormData = z.infer<typeof exitIntentSchema>
