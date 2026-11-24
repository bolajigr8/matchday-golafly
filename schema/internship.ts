import * as z from 'zod'

export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_ACCEPT =
  '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const CV_EXTENSION = /\.(pdf|docx?)$/i

export const internshipApplicationSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().min(8, 'Enter your phone number with country code'),
  country: z.string().min(1, 'Choose your country of residence'),
  university: z.string().trim().min(2, 'Enter your university'),
  course: z.string().trim().min(2, 'Enter your course of study'),
  yearOfStudy: z.string().min(1, 'Choose your year of study'),
  position: z.string().min(1, 'Choose the position you are applying for'),
  startDate: z.string().min(1, 'Choose your earliest start date'),
  portfolioUrl: z
    .string()
    .trim()
    .url('Enter a full link, starting with https://')
    .or(z.literal('')),
  motivation: z
    .string()
    .trim()
    .min(50, 'Tell us a little more (at least 50 characters)')
    .max(1000, 'Keep this under 1,000 characters'),
  cv: z
    .custom<File>((value) => typeof File !== 'undefined' && value instanceof File, {
      message: 'Attach your CV to apply',
    })
    .refine((file) => CV_EXTENSION.test(file.name), 'Upload your CV as a PDF, DOC or DOCX file')
    .refine((file) => file.size <= CV_MAX_BYTES, 'Your CV must be under 5 MB'),
  acceptTerms: z.boolean().refine((value) => value, {
    message: 'Confirm you agree so we can review your application',
  }),
})

export type InternshipApplicationData = z.infer<typeof internshipApplicationSchema>
