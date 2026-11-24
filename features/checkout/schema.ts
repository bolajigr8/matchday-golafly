// import { z } from 'zod'

// const PHONE_RE = /^\+\d{7,15}$/

// export const contactFormSchema = z.object({
//   fullName: z.string().trim().min(2, 'Enter the full name'),
//   email: z.string().email('Enter a valid email'),
//   phone: z.string().regex(PHONE_RE, 'Use international format, e.g. +2348012345678'),
// })

// export const hotelGuestFormSchema = z.object({
//   firstName: z.string().trim().min(1, 'First name is required'),
//   lastName: z.string().trim().min(1, 'Last name is required'),
//   isChild: z.boolean().optional(),
//   age: z.number().int().min(0).max(17).optional(),
// })

import { z } from 'zod'

const PHONE_RE = /^\+\d{7,15}$/

export const contactFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the full name'),
  email: z.string().email('Enter a valid email'),
  phone: z
    .string()
    .regex(PHONE_RE, 'Use international format, e.g. +34612345678'),
})

export const hotelGuestFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  isChild: z.boolean().optional(),
  age: z.number().int().min(0).max(17).optional(),
})
