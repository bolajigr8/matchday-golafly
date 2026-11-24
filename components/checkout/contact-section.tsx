// // components/checkout/contact-section.tsx

// import PhoneInput from 'react-phone-input-2'
// import 'react-phone-input-2/lib/style.css'
// import { FieldWrap, SectionCard, fieldClass } from './form-fields'
// import type { ContactInfo } from '@/features/checkout/types'

// export function ContactSection({
//   contact,
//   errors,
//   onChange,
// }: {
//   contact: ContactInfo
//   errors: Record<string, string>
//   onChange: (patch: Partial<ContactInfo>) => void
// }) {
//   return (
//     <SectionCard
//       title='Contact information'
//       subtitle='Used for booking confirmations, and as the default for every traveler below — you only need to type it once.'
//     >
//       <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
//         <FieldWrap label='Full name' error={errors.fullName} full>
//           <input
//             className={fieldClass}
//             value={contact.fullName}
//             onChange={(e) => onChange({ fullName: e.target.value })}
//             placeholder='Jane Doe'
//           />
//         </FieldWrap>
//         <FieldWrap label='Email' error={errors.email}>
//           <input
//             type='email'
//             className={fieldClass}
//             value={contact.email}
//             onChange={(e) => onChange({ email: e.target.value })}
//             placeholder='you@example.com'
//           />
//         </FieldWrap>
//         <FieldWrap label='Phone' error={errors.phone}>
//           <PhoneInput
//             country='ng'
//             value={contact.phone.replace(/^\+/, '')}
//             onChange={(val) => onChange({ phone: `+${val}` })}
//             inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary disabled:!opacity-60'
//             buttonClass='!rounded-l-xl !border-border !bg-muted/60'
//             dropdownClass='!bg-card !border-border !text-foreground'
//             searchClass='!bg-background !text-foreground !border-border'
//           />
//         </FieldWrap>
//       </div>
//     </SectionCard>
//   )
// }

// components/checkout/contact-section.tsx

import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'
import { FieldWrap, SectionCard, fieldClass } from './form-fields'
import type { ContactInfo } from '@/features/checkout/types'

export function ContactSection({
  contact,
  errors,
  onChange,
}: {
  contact: ContactInfo
  errors: Record<string, string>
  onChange: (patch: Partial<ContactInfo>) => void
}) {
  return (
    <SectionCard
      title='Contact information'
      subtitle='Used for booking confirmations, and as the default for every traveler below — you only need to type it once.'
    >
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <FieldWrap label='Full name' error={errors.fullName} full>
          <input
            className={fieldClass}
            value={contact.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder='Jane Doe'
          />
        </FieldWrap>
        <FieldWrap label='Email' error={errors.email}>
          <input
            type='email'
            className={fieldClass}
            value={contact.email}
            onChange={(e) => onChange({ email: e.target.value })}
            placeholder='you@example.com'
          />
        </FieldWrap>
        <FieldWrap label='Phone' error={errors.phone}>
          <PhoneInput
            country='es'
            value={contact.phone.replace(/^\+/, '')}
            onChange={(val) => onChange({ phone: `+${val}` })}
            inputClass='!w-full !rounded-xl !border-border !bg-muted/60 !text-foreground !text-sm !h-11 !pl-[52px] focus:!border-primary disabled:!opacity-60'
            buttonClass='!rounded-l-xl !border-border !bg-muted/60'
            dropdownClass='!bg-card !border-border !text-foreground'
            searchClass='!bg-background !text-foreground !border-border'
          />
        </FieldWrap>
      </div>
    </SectionCard>
  )
}
