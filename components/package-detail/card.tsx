'use client'

import {
  Calendar,
  CircleCheckBig,
  LoaderCircle,
  MapPin,
  User,
  Minus,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { Country, CountryDropdown } from '../ui/county-dropdown'
import { ProgramsService } from '@/services/programs'
import { toast } from 'sonner'
import { PhoneInput } from '../apply-now/phone-input'
import { cn } from '@/lib/utils'

export default function Card({
  tourPackage,
  programId,
}: {
  tourPackage: any
  programId: string | undefined
}) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    country: '',
    guests: 1,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    if (!programId) {
      toast.error('Program checkout is not available for this package.')
      return
    }

    if (step === 1) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.country
      ) {
        toast.error('Please fill in all required fields.')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      setStep(3)
      setIsLoading(true)
      try {
        const response = await ProgramsService.checkoutProgram(
          Number(programId),
          {
            full_name: formData.name,
            email: formData.email,
            phone: formData.phoneNumber,
            country: formData.country,
            guests: formData.guests,
            success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${window.location.origin}/payment-cancelled`,
          },
        )

        if (response?.data?.checkout_url) {
          sessionStorage.setItem(
            'golafly_payment_data',
            JSON.stringify({
              full_name: formData.name,
              email: formData.email,
              phone: formData.phoneNumber,
              country: formData.country,
              guests: formData.guests,
              program_id: Number(programId),
              program_name: tourPackage?.name ?? '',
              program_location: tourPackage?.location ?? '',
              program_dates: tourPackage?.tourDates ?? '',
              price_per_person: tourPackage?.costNumeric ?? 0,
              total_amount: (tourPackage?.costNumeric ?? 0) * formData.guests,
              currency: tourPackage?.currency ?? 'NGN',
              payment_date: new Date().toISOString(),
            }),
          )
          window.location.href = response.data.checkout_url
        } else {
          toast.error('Failed to create checkout session. Please try again.')
          setStep(2)
        }
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Checkout failed.')
        setStep(2)
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div
      id='apply'
      className='sticky top-10 block transition-colors duration-300'
    >
      <div className='relative rounded-[36px] border border-[#a3ff00]/60 bg-white dark:bg-[#050505] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.1)] dark:shadow-[0_0_80px_rgba(163,230,53,0.1)] overflow-hidden'>
        {/* Glow Effect */}
        <div className='absolute -top-24 left-1/2 -translate-x-1/2 w-[320px] h-[320px] bg-[#a3ff00]/10 blur-[100px] rounded-full pointer-events-none' />

        <div className='relative z-10'>
          <p className='text-[10px] font-bold uppercase tracking-[0.25em] text-[#a3ff00] mb-4'>
            Football Tourism • {tourPackage?.location}
          </p>

          <h3 className='text-[18px] font-black text-zinc-900 dark:text-[#F5F7F3] leading-tight uppercase'>
            {tourPackage?.name}
          </h3>

          <div className='mt-6 space-y-3 text-zinc-500 dark:text-[#A6B0A3] font-medium text-sm'>
            <div className='flex items-center gap-2'>
              <MapPin size={14} className='text-[#a3ff00]' />{' '}
              {tourPackage?.location}
            </div>
            <div className='flex items-center gap-2'>
              <Calendar size={14} className='text-[#a3ff00]' />{' '}
              {tourPackage?.tourDates}
            </div>
            <div className='flex items-center gap-2'>
              <User size={14} className='text-[#a3ff00]' /> {formData.guests}{' '}
              Participants
            </div>
          </div>

          <div className='mt-8 flex items-end gap-2'>
            <span className='text-5xl font-black text-zinc-900 dark:text-[#a3ff00]'>
              {tourPackage?.currency || 'NGN'}{' '}
              {tourPackage?.costNumeric?.toLocaleString()}
            </span>
            <span className='text-zinc-400 dark:text-[#A6B0A3] pb-1 text-xs'>
              / person
            </span>
          </div>

          {/* Stepper */}
          <div className='mt-10 flex items-center justify-between text-center text-[10px] font-black uppercase tracking-widest relative'>
            {/* The Background Line (Track) */}
            <div className='absolute top-[68px] left-[15%] right-[15%] h-[2px] bg-zinc-100 dark:bg-zinc-800 -z-0' />

            {/* The Progress Line (Fill) */}
            <div
              className='absolute top-[28px] left-[15%] h-[2px] bg-[#a3ff00] transition-all duration-500 ease-in-out -z-0 shadow-[0_0_10px_rgba(163,255,0,0.4)]'
              style={{
                width: step === 1 ? '0%' : step === 2 ? '35%' : '70%',
              }}
            />

            {['Info', 'Confirm', 'Pay'].map((el, idx) => {
              const isCompleted = step >= idx + 1

              return (
                <div key={idx} className='flex-1 relative z-10'>
                  {/* Label */}
                  <span
                    className={`transition-colors duration-300 ${
                      isCompleted
                        ? 'text-[#a3ff00]'
                        : 'text-zinc-400 dark:text-zinc-700'
                    }`}
                  >
                    {el}
                  </span>

                  {/* Step Circle */}
                  <div
                    className={`w-10 mt-4 h-10 mx-auto rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-500 bg-white dark:bg-[#050505] ${
                      isCompleted
                        ? 'border-[#a3ff00] text-[#a3ff00] shadow-[0_0_15px_rgba(163,255,0,0.3)] scale-110'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-700'
                    }`}
                  >
                    {idx + 1}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Step Views */}
          <div className='min-h-[280px]'>
            {step === 1 && (
              <>
                <div className='mt-10 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 p-5 flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guests: Math.max(1, prev.guests - 1),
                        }))
                      }
                      className='w-10 h-10 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:border-[#a3ff00] transition-colors'
                    >
                      <Minus size={14} />
                    </button>
                    <span className='font-black text-zinc-900 dark:text-white text-lg w-4 text-center'>
                      {formData.guests}
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          guests: prev.guests + 1,
                        }))
                      }
                      className='w-10 h-10 rounded-full bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:border-[#a3ff00] transition-colors'
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className='text-xs font-bold uppercase tracking-widest text-zinc-400'>
                    Participants
                  </span>
                </div>
                <Info formData={formData} setFormData={setFormData} />
              </>
            )}

            {step === 2 && (
              <div className='mt-10'>
                <Confirm
                  program={tourPackage}
                  total={`${tourPackage?.currency || 'NGN'} ${(tourPackage?.costNumeric * formData.guests).toLocaleString()}`}
                  formData={formData}
                />
              </div>
            )}

            {step === 3 && (
              <div className='mt-10'>
                <Redirecting
                  isLoading={isLoading}
                  total={`${tourPackage?.currency || 'NGN'} ${(tourPackage?.costNumeric * formData.guests).toLocaleString()}`}
                />
              </div>
            )}
          </div>

          {/* Footer Summary & Actions */}
          <div className='mt-10 flex items-center justify-between text-sm border-t border-zinc-100 dark:border-zinc-900 pt-6'>
            <span className='text-zinc-400 font-bold uppercase tracking-widest text-[10px]'>
              Total Due
            </span>
            <span className='text-2xl font-black text-zinc-900 dark:text-[#a3ff00]'>
              €{(tourPackage?.costNumeric * formData.guests).toLocaleString()}
            </span>
          </div>

          {step !== 3 && (
            <div className='space-y-3 mt-8'>
              <button
                onClick={handleCheckout}
                className='h-16 rounded-full bg-[#a3ff00] text-black w-full font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-[#a3ff00]/20'
              >
                {step === 1 ? 'Continue' : 'Proceed to Payment'}
              </button>
              {step > 1 && (
                <button
                  onClick={() => setStep(1)}
                  className='w-full text-zinc-400 dark:text-zinc-500 font-bold text-[10px] uppercase tracking-widest py-2 hover:text-zinc-900 dark:hover:text-white transition-colors'
                >
                  ← Edit Information
                </button>
              )}
            </div>
          )}

          <p className='text-center text-[10px] font-bold text-zinc-300 dark:text-zinc-700 mt-6 tracking-widest uppercase'>
            Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
function Info({ formData, setFormData }: any) {
  const inputStyles =
    'w-full h-14 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 px-5 outline-none focus:border-[#a3ff00]/50 text-sm font-medium transition-all dark:text-white'

  return (
    <div className='mt-8 space-y-4'>
      {/* Name Input */}
      <div>
        <label className='text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block'>
          Full Name
        </label>
        <input
          placeholder='Lionel Messi'
          className={inputStyles}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      {/* Email Input */}
      <div>
        <label className='text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block'>
          Email
        </label>
        <input
          type='email'
          placeholder='messirve@miamifc.com'
          className={inputStyles}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      {/* Phone Input - Extracted to full-width to give it breathing room */}
      <div>
        <label className='text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block'>
          Phone
        </label>
        <PhoneInput
          value={formData.phoneNumber}
          onChange={(val: string) =>
            setFormData({ ...formData, phoneNumber: val })
          }
          placeholder='000 000 0000'
          hasError={false}
          className='h-14 w-full text-sm font-medium rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 focus-within:border-[#a3ff00]/50 transition-all dark:text-white [&_div]:border-none [&_div]:shadow-none [&_div]:!bg-transparent [&_div]:h-full [&_button]:h-full [&_input]:h-full [&_input]:!bg-transparent'
        />
      </div>

      {/* Country Dropdown - Moves to its own full width block below */}
      <div>
        <label className='text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 block'>
          Country
        </label>
        <CountryDropdown
          triggerClassName={inputStyles}
          onChange={(selectedCountry: Country) =>
            setFormData({ ...formData, country: selectedCountry.name })
          }
        />
      </div>
    </div>
  )
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className='w-full flex py-2 items-center justify-between border-b border-zinc-100 dark:border-zinc-900/50'>
    <h2 className='text-[10px] uppercase font-black tracking-widest text-zinc-400'>
      {label}
    </h2>
    <h4 className='text-xs font-bold text-zinc-900 dark:text-zinc-200'>
      {value}
    </h4>
  </div>
)
function Confirm({ program, formData, total }: any) {
  return (
    <div className='w-full space-y-1'>
      <Row label='Program' value={program?.name} />
      <Row label='Dates' value={program?.tourDates} />
      <Row label='Attendee' value={formData?.name} />
      <Row label='Email' value={formData?.email} />
      <Row label='Country' value={formData?.country} />
      <Row label='Guests' value={`${formData.guests} Player(s)`} />
    </div>
  )
}

function Redirecting({
  total,
  isLoading,
}: {
  total: string
  isLoading: boolean
}) {
  return (
    <div className='w-full flex flex-col items-center justify-center py-10 gap-6'>
      <div className='relative'>
        {isLoading ? (
          <LoaderCircle
            className='text-[#a3ff00] animate-spin'
            size={60}
            strokeWidth={3}
          />
        ) : (
          <CircleCheckBig
            className='text-[#a3ff00]'
            size={60}
            strokeWidth={3}
          />
        )}
      </div>
      <div className='text-center'>
        <h2 className='text-lg font-black uppercase tracking-tighter dark:text-white'>
          Redirecting
        </h2>
        <p className='text-xs text-zinc-500 max-w-[200px] mt-2 font-medium'>
          Completing your {total} secure checkout via Stripe.
        </p>
      </div>
    </div>
  )
}
