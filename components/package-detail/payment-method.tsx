// 'use client'

// import { useState } from 'react'
// import Image from 'next/image'
// import {
//   CreditCard,
//   Lock,
//   Loader2,
//   User,
//   Mail,
//   Phone,
//   MapPin,
//   Users,
// } from 'lucide-react'
// import type { TourismPackage } from '@/lib/tourism-packages-data'
// import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
// import { ProgramsService } from '@/services/programs'
// import { toast } from 'sonner'

// interface PaymentMethodProps {
//   tourPackage: TourismPackage
//   programId?: number
// }

// export default function PaymentMethod({
//   tourPackage,
//   programId,
// }: PaymentMethodProps) {
//   const [fullName, setFullName] = useState('')
//   const [email, setEmail] = useState('')
//   const [phone, setPhone] = useState('')
//   const [country, setCountry] = useState('')
//   const [guests, setGuests] = useState(1)
//   const [agreedToTerms, setAgreedToTerms] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)

//   const totalCost = tourPackage.costNumeric * guests

//   const handleCheckout = async () => {
//     if (!programId) {
//       toast.error('Program checkout is not available for this package.')
//       return
//     }

//     if (!fullName || !email || !phone || !country) {
//       toast.error('Please fill in all required fields.')
//       return
//     }

//     if (!agreedToTerms) {
//       toast.error('Please agree to the Terms & Conditions.')
//       return
//     }

//     setIsLoading(true)
//     try {
//       const response = await ProgramsService.checkoutProgram(programId, {
//         full_name: fullName,
//         email,
//         phone,
//         country,
//         guests,
//         success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${window.location.origin}/payment-cancelled`,
//       })

//       if (response?.data?.checkout_url) {
//         window.location.href = response.data.checkout_url
//       } else {
//         toast.error('Failed to create checkout session. Please try again.')
//       }
//     } catch (error: any) {
//       toast.error(
//         error?.response?.data?.message || 'Checkout failed. Please try again.',
//       )
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   const inputClass =
//     'w-full bg-[rgba(255,255,255,0.05)] border border-lp-border rounded-[4px] px-3 py-2.5 text-lp-text-heading text-[14px] placeholder:text-lp-text-subtle focus:border-brand-gold-main focus:outline-none transition-colors'

//   return (
//     <section className='relative w-full bg-lp-bg pb-[40px] sm:pb-[60px] lg:pb-[80px]'>
//       <div className='container-custom px-custom'>
//         <div className='flex flex-col-reverse lg:flex-row gap-5 sm:gap-6'>
//           {/* Left Column - Checkout Form & Terms */}
//           <div className='flex-1 flex flex-col gap-5 sm:gap-6'>
//             {/* Guest selector */}
//             <div className='flex items-center gap-4'>
//               <span className='text-lp-text-muted text-[14px]'>Guests:</span>
//               <div className='flex items-center gap-3'>
//                 <button
//                   onClick={() => setGuests(Math.max(1, guests - 1))}
//                   className='w-8 h-8 rounded border border-lp-border bg-lp-bg-card text-lp-text-heading flex items-center justify-center hover:border-brand-gold-main transition-colors'
//                 >
//                   −
//                 </button>
//                 <span className='text-lp-text-heading text-[16px] font-medium w-6 text-center'>
//                   {guests}
//                 </span>
//                 <button
//                   onClick={() => setGuests(Math.min(10, guests + 1))}
//                   className='w-8 h-8 rounded border border-lp-border bg-lp-bg-card text-lp-text-heading flex items-center justify-center hover:border-brand-gold-main transition-colors'
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             {/* Checkout Form Card */}
//             <div className='dark-section backdrop-blur-[5px] bg-[rgba(20,20,20,0.9)] border border-brand-gold-main rounded-[6px] p-4 sm:p-5 lg:p-[25px]'>
//               <h3 className='text-brand-gold-main text-[16px] lg:text-[18px] font-bold uppercase mb-4'>
//                 Complete Your Booking
//               </h3>

//               <div className='space-y-4'>
//                 {/* Full Name */}
//                 <div>
//                   <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
//                     <User className='w-3.5 h-3.5' />
//                     Full Name
//                   </label>
//                   <input
//                     type='text'
//                     value={fullName}
//                     onChange={(e) => setFullName(e.target.value)}
//                     placeholder='John Doe'
//                     className={inputClass}
//                   />
//                 </div>

//                 {/* Email */}
//                 <div>
//                   <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
//                     <Mail className='w-3.5 h-3.5' />
//                     Email Address
//                   </label>
//                   <input
//                     type='email'
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     placeholder='johndoe@gmail.com'
//                     className={inputClass}
//                   />
//                 </div>

//                 {/* Phone */}
//                 <div>
//                   <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
//                     <Phone className='w-3.5 h-3.5' />
//                     Phone Number
//                   </label>
//                   <input
//                     type='tel'
//                     value={phone}
//                     onChange={(e) => setPhone(e.target.value)}
//                     placeholder='+2347014065500'
//                     className={inputClass}
//                   />
//                 </div>

//                 {/* Country */}
//                 <div>
//                   <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
//                     <MapPin className='w-3.5 h-3.5' />
//                     Country
//                   </label>
//                   <CountryDropdown
//                     triggerClassName={inputClass}
//                     onChange={(selectedCountry: Country) =>
//                       setCountry(selectedCountry.name)
//                     }
//                   />
//                 </div>
//               </div>

//               {/* Secure Payment Note */}
//               <div className='flex items-center gap-2 mt-5 pt-4 border-t border-lp-border-strong'>
//                 <CreditCard className='w-4 h-4 text-brand-gold-main' />
//                 <span className='text-lp-text-muted text-[12px]'>
//                   You will be redirected to Stripe&apos;s secure checkout to
//                   complete payment.
//                 </span>
//               </div>
//             </div>

//             {/* Terms & Conditions Card */}
//             <div className='bg-[#b4ff39] border border-[#b4ff39]/90 rounded-[6px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] p-4 sm:p-5 lg:p-[25px]'>
//               <h3 className='text-[#4a3b32] text-[16px] lg:text-[18px] font-bold uppercase mb-3'>
//                 Terms &amp; Conditions
//               </h3>

//               <div className='space-y-3 mb-4'>
//                 {tourPackage.terms.map((term, idx) => (
//                   <div key={idx} className='flex items-start gap-2.5'>
//                     <svg
//                       width='13'
//                       height='13'
//                       viewBox='0 0 13 13'
//                       fill='none'
//                       className='shrink-0 mt-0.5'
//                     >
//                       <path
//                         d='M10.5 3.5L5 9L2.5 6.5'
//                         stroke='#5c4d44'
//                         strokeWidth='1.5'
//                         strokeLinecap='round'
//                         strokeLinejoin='round'
//                       />
//                     </svg>
//                     <span className='text-[#5c4d44] text-[13px] leading-[1.5]'>
//                       {term}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               <div className='border-t border-[rgba(0,0,0,0.1)] pt-4'>
//                 <label className='flex items-center gap-2.5 cursor-pointer'>
//                   <input
//                     type='checkbox'
//                     checked={agreedToTerms}
//                     onChange={(e) => setAgreedToTerms(e.target.checked)}
//                     className='w-[18px] h-[18px] accent-[#3e2723] rounded'
//                   />
//                   <span className='text-[#3e2723] text-[13px] font-bold'>
//                     I have read and agree to the Terms &amp; Conditions
//                   </span>
//                 </label>
//               </div>
//             </div>
//           </div>

//           {/* Right Column - Booking Summary */}
//           <div className='w-full lg:w-[400px]'>
//             <div className='dark-section backdrop-blur-[5px] bg-[rgba(20,20,20,0.9)] border border-brand-gold-main rounded-[6px] p-4 sm:p-6 lg:sticky lg:top-[calc(100px+var(--bf-bar-h,0px))]'>
//               {/* Gallery Images */}
//               <div className='grid grid-cols-2 gap-1 rounded-[4px] overflow-hidden mb-4'>
//                 {tourPackage.galleryImages.map((img, idx) => (
//                   <div
//                     key={idx}
//                     className='relative w-full h-[80px] overflow-hidden'
//                   >
//                     <Image
//                       src={img}
//                       alt={`${tourPackage.name} view ${idx + 1}`}
//                       fill
//                       className='object-cover'
//                     />
//                   </div>
//                 ))}
//               </div>

//               {/* Tour Name */}
//               <h4 className='text-lp-text-heading text-[16px] uppercase mb-1'>
//                 {tourPackage.name}
//               </h4>

//               {/* Dates */}
//               <p className='text-lp-text-muted text-[14px] mb-1'>
//                 {tourPackage.tourDates}
//               </p>

//               {/* Guests */}
//               <div className='flex items-center gap-1.5 mb-4'>
//                 <Users className='w-3.5 h-3.5 text-lp-text-muted' />
//                 <span className='text-lp-text-muted text-[14px]'>
//                   {guests} {guests === 1 ? 'Adult' : 'Adults'}
//                 </span>
//               </div>

//               {/* Total */}
//               <div className='flex items-baseline gap-1 mb-4'>
//                 <span className='text-lp-text-heading text-[20px] font-medium'>
//                   Total {tourPackage.currency} {totalCost.toLocaleString()}
//                 </span>
//               </div>

//               {/* Pay Button */}
//               <button
//                 disabled={!agreedToTerms || isLoading || !programId}
//                 onClick={handleCheckout}
//                 className='w-full bg-gradient-to-b from-[#b4ff39] to-[#b4ff39]/90 text-black text-[16px] font-bold uppercase py-3.5 rounded-[4px] shadow-[0px_4px_10px_0px_rgba(212,175,55,0.3)] hover:from-[#b4ff39] hover:to-[rgb(201,154,14)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
//               >
//                 {isLoading ? (
//                   <>
//                     <Loader2 className='w-5 h-5 animate-spin' />
//                     Processing...
//                   </>
//                 ) : (
//                   <>
//                     PAY {tourPackage.currency} {totalCost.toLocaleString()}
//                   </>
//                 )}
//               </button>

//               {/* Secure Payment */}
//               <div className='flex items-center justify-center gap-2 mt-3'>
//                 <Lock className='w-[11px] h-[11px] text-lp-text-muted' />
//                 <span className='text-lp-text-muted text-[11px] uppercase tracking-[0.5px]'>
//                   Payment is secure and encrypted
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   )
// }

'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  CreditCard,
  Lock,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Users,
} from 'lucide-react'
import type { TourismPackage } from '@/lib/tourism-packages-data'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
import { ProgramsService } from '@/services/programs'
import { toast } from 'sonner'

interface PaymentMethodProps {
  tourPackage: TourismPackage
  programId?: number
}

export default function PaymentMethod({
  tourPackage,
  programId,
}: PaymentMethodProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [guests, setGuests] = useState(1)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const totalCost = tourPackage.costNumeric * guests

  const handleCheckout = async () => {
    if (!programId) {
      toast.error('Program checkout is not available for this package.')
      return
    }

    if (!fullName || !email || !phone || !country) {
      toast.error('Please fill in all required fields.')
      return
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms & Conditions.')
      return
    }

    setIsLoading(true)
    try {
      const response = await ProgramsService.checkoutProgram(programId, {
        full_name: fullName,
        email,
        phone,
        country,
        guests,
        success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/payment-cancelled`,
      })

      if (response?.data?.checkout_url) {
        window.location.href = response.data.checkout_url
      } else {
        toast.error('Failed to create checkout session. Please try again.')
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Checkout failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass =
    'w-full bg-[rgba(255,255,255,0.05)] border border-lp-border rounded-[4px] px-3 py-2.5 text-lp-text-heading text-[14px] placeholder:text-lp-text-subtle focus:border-brand-gold-main focus:outline-none transition-colors'

  return (
    <section className='relative w-full bg-lp-bg pb-[40px] sm:pb-[60px] lg:pb-[80px]'>
      <div className='container-custom px-custom'>
        <div className='flex flex-col-reverse lg:flex-row gap-5 sm:gap-6'>
          {/* Left Column - Checkout Form & Terms */}
          <div className='flex-1 flex flex-col gap-5 sm:gap-6'>
            {/* Guest selector */}
            <div className='flex items-center gap-4'>
              <span className='text-lp-text-muted text-[14px]'>Guests:</span>
              <div className='flex items-center gap-3'>
                <button
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  className='w-8 h-8 rounded border border-lp-border bg-lp-bg-card text-lp-text-heading flex items-center justify-center hover:border-brand-gold-main transition-colors'
                >
                  −
                </button>
                <span className='text-lp-text-heading text-[16px] font-medium w-6 text-center'>
                  {guests}
                </span>
                <button
                  onClick={() => setGuests(Math.min(10, guests + 1))}
                  className='w-8 h-8 rounded border border-lp-border bg-lp-bg-card text-lp-text-heading flex items-center justify-center hover:border-brand-gold-main transition-colors'
                >
                  +
                </button>
              </div>
            </div>

            {/* Checkout Form Card */}
            <div className='dark-section backdrop-blur-[5px] bg-[rgba(20,20,20,0.9)] border border-brand-gold-main rounded-[6px] p-4 sm:p-5 lg:p-[25px]'>
              <h3 className='text-brand-gold-main text-[16px] lg:text-[18px] font-bold uppercase mb-4'>
                Complete Your Booking
              </h3>

              <div className='space-y-4'>
                {/* Full Name */}
                <div>
                  <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
                    <User className='w-3.5 h-3.5' />
                    Full Name
                  </label>
                  <input
                    type='text'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='John Doe'
                    className={inputClass}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
                    <Mail className='w-3.5 h-3.5' />
                    Email Address
                  </label>
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='johndoe@gmail.com'
                    className={inputClass}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
                    <Phone className='w-3.5 h-3.5' />
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder='+34612345678'
                    className={inputClass}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className='text-lp-text-muted text-[12px] flex items-center gap-1.5 mb-1.5'>
                    <MapPin className='w-3.5 h-3.5' />
                    Country
                  </label>
                  <CountryDropdown
                    triggerClassName={inputClass}
                    onChange={(selectedCountry: Country) =>
                      setCountry(selectedCountry.name)
                    }
                  />
                </div>
              </div>

              {/* Secure Payment Note */}
              <div className='flex items-center gap-2 mt-5 pt-4 border-t border-lp-border-strong'>
                <CreditCard className='w-4 h-4 text-brand-gold-main' />
                <span className='text-lp-text-muted text-[12px]'>
                  You will be redirected to Stripe&apos;s secure checkout to
                  complete payment.
                </span>
              </div>
            </div>

            {/* Terms & Conditions Card */}
            <div className='bg-[#b4ff39] border border-[#b4ff39]/90 rounded-[6px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] p-4 sm:p-5 lg:p-[25px]'>
              <h3 className='text-[#4a3b32] text-[16px] lg:text-[18px] font-bold uppercase mb-3'>
                Terms &amp; Conditions
              </h3>

              <div className='space-y-3 mb-4'>
                {tourPackage.terms.map((term, idx) => (
                  <div key={idx} className='flex items-start gap-2.5'>
                    <svg
                      width='13'
                      height='13'
                      viewBox='0 0 13 13'
                      fill='none'
                      className='shrink-0 mt-0.5'
                    >
                      <path
                        d='M10.5 3.5L5 9L2.5 6.5'
                        stroke='#5c4d44'
                        strokeWidth='1.5'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <span className='text-[#5c4d44] text-[13px] leading-[1.5]'>
                      {term}
                    </span>
                  </div>
                ))}
              </div>

              <div className='border-t border-[rgba(0,0,0,0.1)] pt-4'>
                <label className='flex items-center gap-2.5 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className='w-[18px] h-[18px] accent-[#3e2723] rounded'
                  />
                  <span className='text-[#3e2723] text-[13px] font-bold'>
                    I have read and agree to the Terms &amp; Conditions
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className='w-full lg:w-[400px]'>
            <div className='dark-section backdrop-blur-[5px] bg-[rgba(20,20,20,0.9)] border border-brand-gold-main rounded-[6px] p-4 sm:p-6 lg:sticky lg:top-[calc(100px+var(--bf-bar-h,0px))]'>
              {/* Gallery Images */}
              <div className='grid grid-cols-2 gap-1 rounded-[4px] overflow-hidden mb-4'>
                {tourPackage.galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className='relative w-full h-[80px] overflow-hidden'
                  >
                    <Image
                      src={img}
                      alt={`${tourPackage.name} view ${idx + 1}`}
                      fill
                      className='object-cover'
                    />
                  </div>
                ))}
              </div>

              {/* Tour Name */}
              <h4 className='text-lp-text-heading text-[16px] uppercase mb-1'>
                {tourPackage.name}
              </h4>

              {/* Dates */}
              <p className='text-lp-text-muted text-[14px] mb-1'>
                {tourPackage.tourDates}
              </p>

              {/* Guests */}
              <div className='flex items-center gap-1.5 mb-4'>
                <Users className='w-3.5 h-3.5 text-lp-text-muted' />
                <span className='text-lp-text-muted text-[14px]'>
                  {guests} {guests === 1 ? 'Adult' : 'Adults'}
                </span>
              </div>

              {/* Total */}
              <div className='flex items-baseline gap-1 mb-4'>
                <span className='text-lp-text-heading text-[20px] font-medium'>
                  Total {tourPackage.currency} {totalCost.toLocaleString()}
                </span>
              </div>

              {/* Pay Button */}
              <button
                disabled={!agreedToTerms || isLoading || !programId}
                onClick={handleCheckout}
                className='w-full bg-gradient-to-b from-[#b4ff39] to-[#b4ff39]/90 text-black text-[16px] font-bold uppercase py-3.5 rounded-[4px] shadow-[0px_4px_10px_0px_rgba(212,175,55,0.3)] hover:from-[#b4ff39] hover:to-[rgb(201,154,14)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    Processing...
                  </>
                ) : (
                  <>
                    PAY {tourPackage.currency} {totalCost.toLocaleString()}
                  </>
                )}
              </button>

              {/* Secure Payment */}
              <div className='flex items-center justify-center gap-2 mt-3'>
                <Lock className='w-[11px] h-[11px] text-lp-text-muted' />
                <span className='text-lp-text-muted text-[11px] uppercase tracking-[0.5px]'>
                  Payment is secure and encrypted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
