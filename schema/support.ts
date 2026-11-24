import * as z from 'zod'

export const SUPPORT_TOPICS = [
  { value: 'payment', label: 'Payment issue' },
  { value: 'booking', label: 'Booking or tickets' },
  { value: 'refund', label: 'Refund or cancellation' },
  { value: 'account', label: 'Account help' },
  { value: 'other', label: 'Something else' },
] as const

const topicValues = SUPPORT_TOPICS.map((t) => t.value) as [
  (typeof SUPPORT_TOPICS)[number]['value'],
  ...(typeof SUPPORT_TOPICS)[number]['value'][],
]

export const supportSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: z.string().trim().email('Enter a valid email address').max(200),
  topic: z.enum(topicValues),
  orderRef: z.string().trim().max(100).optional().or(z.literal('')),
  message: z
    .string()
    .trim()
    .min(10, 'Please tell us a bit more (at least 10 characters)')
    .max(4000, 'Message is too long (max 4000 characters)'),
  // Honeypot: real users never see or fill this. Bots do.
  website: z.string().max(0).optional().or(z.literal('')),
})

export type SupportInput = z.infer<typeof supportSchema>
