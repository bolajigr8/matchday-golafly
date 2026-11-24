'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { exitIntentSchema, type ExitIntentFormData } from '@/schema/applynow'
import { PhoneInput } from '../apply-now/phone-input'

const SESSION_LEAD_KEY = 'golafly_lead_captured'

function ssSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {}
}

export default function InquiryCard({
  tourPackage,
  programId,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tourPackage?: any
  programId?: string
}) {
  const [isSubmitted, setIsSubmitted] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExitIntentFormData>({
    resolver: zodResolver(exitIntentSchema),
    defaultValues: { firstName: '', email: '', phone: '' },
  })

  const onSubmit = async (data: ExitIntentFormData) => {
    try {
      const res = await fetch('/api/hubspot/exit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          ...(programId && { programId }),
          ...(tourPackage?.name && { programName: tourPackage.name }),
        }),
      })
      if (!res.ok)
        console.warn('InquiryCard HubSpot submission failed silently')
    } catch (err) {
      console.error('InquiryCard submission error:', err)
    } finally {
      ssSet(SESSION_LEAD_KEY, '1')
      setIsSubmitted(true)
    }
  }

  return (
    <div
      id='apply'
      className='sticky top-10 block transition-colors duration-300'
    >
      <div className='  relative rounded-[36px] border border-[#a3ff00]/60 bg-white dark:bg-[#050505] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(163,230,53,0.1)] overflow-hidden min-h-[550px]'>
        <div className='absolute -top-24 left-1/2 -translate-x-1/2 w-[320px]  bg-[#a3ff00]/10 blur-[100px] rounded-full pointer-events-none  ' />

        <div className='relative z-10'>
          <AnimatePresence mode='wait'>
            {!isSubmitted ? (
              <motion.div
                key='form-view'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Program Info */}
                {tourPackage && (
                  <div className='mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800'>
                    <p className='text-[12px] font-bold uppercase tracking-[0.25em] text-[#a3ff00] mb-3'>
                      READY TO APPLY?
                    </p>
                    <h3 className='text-[22px] font-black text-zinc-900 dark:text-[#F5F7F3] leading-tight uppercase '>
                      {/* {tourPackage.name} */} START YOUR APPLICATION
                    </h3>
                    {/* <div className='space-y-2 text-zinc-500 dark:text-zinc-400 text-sm font-medium'>
                      {tourPackage.location && (
                        <div className='flex items-center gap-2'>
                          <MapPin
                            size={13}
                            className='text-[#a3ff00] shrink-0'
                          />
                          <span>{tourPackage.location}</span>
                        </div>
                      )}
                      {tourPackage.tourDates && (
                        <div className='flex items-center gap-2'>
                          <Calendar
                            size={13}
                            className='text-[#a3ff00] shrink-0'
                          />
                          <span>{tourPackage.tourDates}</span>
                        </div>
                      )}
                    </div> */}
                  </div>
                )}

                {/* <p className='text-[10px] font-bold uppercase tracking-[0.25em] text-[#a3ff00] mb-4'>
                  Interested in this program?
                </p> */}
                {/* <h3 className='text-[18px] font-black text-zinc-900 dark:text-[#F5F7F3] leading-tight uppercase mb-2'>
                  Have Our Team{' '}
                  <span className='text-[#a3ff00]'>Reach Out</span>
                </h3> */}
                <p className='text-[12px] leading-[1.75] text-zinc-500 dark:text-zinc-400  mb-8'>
                  Complete your details below and a Golafly advisor will contact
                  you to discuss your football background, answer your
                  questions, and guide you through the next steps of the
                  scouting camp application process.
                </p>

                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className='space-y-4'
                  noValidate
                >
                  <InquiryField
                    label='First Name'
                    error={errors.firstName?.message}
                  >
                    <InquiryInput
                      registration={register('firstName')}
                      placeholder='e.g. Marcus'
                      autoComplete='given-name'
                      hasError={!!errors.firstName}
                    />
                  </InquiryField>

                  <InquiryField
                    label='Email Address'
                    error={errors.email?.message}
                  >
                    <InquiryInput
                      registration={register('email')}
                      type='email'
                      placeholder='you@example.com'
                      autoComplete='email'
                      hasError={!!errors.email}
                    />
                  </InquiryField>

                  <InquiryField
                    label='Phone / WhatsApp'
                    error={errors.phone?.message}
                  >
                    <Controller
                      name='phone'
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.phone}
                          placeholder='000 000 0000'
                        />
                      )}
                    />
                  </InquiryField>

                  <div className='pt-2'>
                    <button
                      type='submit'
                      disabled={isSubmitting}
                      className='h-16 rounded-full bg-[#a3ff00] text-black w-full font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#a3ff00]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2.5'
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className='w-4 h-4 animate-spin' />
                          Sending...
                        </>
                      ) : (
                        <>
                          START MY APPLICATION
                          <ArrowRight className='w-4 h-4' />
                        </>
                      )}
                    </button>
                  </div>

                  {/* <p className='text-center text-[10px] font-bold text-zinc-300 dark:text-zinc-700 mt-2 tracking-widest uppercase'>
                    No spam — just a real conversation.
                  </p> */}
                </form>
              </motion.div>
            ) : (
              <motion.div
                key='success-view'
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className='flex flex-col items-center justify-center text-center py-16'
              >
                <div className='relative mb-8'>
                  <div className='w-20 h-20 rounded-full flex items-center justify-center bg-[#a3ff00]/10'>
                    <div className='w-14 h-14 rounded-full flex items-center justify-center bg-[#a3ff00]/20'>
                      <CheckCircle2 className='w-7 h-7 text-[#a3ff00]' />
                    </div>
                  </div>
                  <motion.div
                    className='absolute inset-0 rounded-full border border-[#a3ff00]/30'
                    animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                </div>
                <p className='text-[10px] font-bold uppercase tracking-[0.25em] text-[#a3ff00] mb-3'>
                  Message Received
                </p>
                <h3 className='text-[22px] font-black uppercase tracking-tight leading-tight text-zinc-900 dark:text-[#F5F7F3] mb-4'>
                  You're All Set!
                </h3>
                <p className='text-[12px] leading-[1.8] max-w-[240px] text-zinc-500 dark:text-zinc-400'>
                  Expect a call from our team within 24 hours. We'll walk you
                  through this program personally.
                </p>
                {tourPackage?.name && (
                  <p className='text-[11px] font-bold text-[#a3ff00]/70 mt-4 uppercase tracking-widest'>
                    {tourPackage.name}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function InquiryField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className='space-y-1.5'>
      <label className='block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2'>
        {label} *
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className='text-[10px] text-red-400'
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function InquiryInput({
  registration,
  hasError,
  ...props
}: {
  registration: ReturnType<ReturnType<typeof useForm>['register']>
  hasError: boolean
  type?: string
  placeholder?: string
  autoComplete?: string
}) {
  const [focused, setFocused] = React.useState(false)
  return (
    <input
      {...registration}
      {...props}
      className='w-full h-14 rounded-xl text-sm font-medium outline-none transition-all duration-200 px-5 dark:text-white text-zinc-900 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/50'
      style={{
        border: hasError
          ? '1px solid rgba(239,68,68,0.7)'
          : focused
            ? '1px solid rgba(163,255,0,0.5)'
            : '1px solid rgba(163,255,0,0.15)',
        borderRadius: '0.75rem',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
