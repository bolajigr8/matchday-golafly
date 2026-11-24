'use client'

import { useState } from 'react'
import { CheckCircle2, DownloadCloud, LoaderCircle } from 'lucide-react'
import { isAxiosError } from 'axios'
import { toast } from 'sonner'
import CustomDialog from '@/components/shared/CustomDialog'
import { ProgramsService } from '@/services/programs'

interface DownloadBrochureModalProps {
  isOpen: boolean
  onClose: () => void
  packageName: string
  programId?: number
  triggerComponent?: React.ReactNode
}

/* Emails the program brochure (POST /v1/program/{id}/brochure/send).
   Built on the site's own tokens (card, foreground, brand…) so it is a solid,
   readable card in both themes. After a successful send it shows a
   confirmation for a few seconds, then closes; a failure keeps the form and
   what was typed. */
export default function DownloadBrochureModal({
  isOpen,
  onClose,
  packageName,
  programId,
  triggerComponent,
}: DownloadBrochureModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const close = () => {
    setSuccess(false)
    setName('')
    setEmail('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!programId) {
      toast.error('This brochure isn’t available right now.')
      return
    }
    setIsSubmitting(true)
    try {
      await ProgramsService.sendProgramBrochure(programId, { full_name: name.trim(), email: email.trim() })
      setSuccess(true)
      setTimeout(close, 3000)
    } catch (err) {
      const message = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined
      toast.error(message || 'Could not send the brochure', { description: 'Please try again in a moment.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    'h-11 w-full rounded-lg border border-input bg-background px-4 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/25'

  return (
    <CustomDialog
      open={isOpen}
      showTrigger={false}
      onOpenChange={(open) => !open && close()}
      triggerComponent={triggerComponent}
      contentClassName='max-w-md overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl'
    >
      <div className='p-6 md:p-8'>
        {success ? (
          <div className='flex flex-col items-center justify-center gap-4 py-8 text-center'>
            <CheckCircle2 className='size-16 text-brand-text' />
            <h3 className='font-heading text-xl font-bold uppercase tracking-wide text-foreground'>Brochure sent!</h3>
            <p className='text-sm text-muted-foreground'>
              We&apos;ve sent the {packageName} brochure to <span className='font-medium text-foreground'>{email}</span>. Please check your
              inbox.
            </p>
          </div>
        ) : (
          <>
            <div className='mb-7 flex flex-col items-center gap-3 text-center'>
              <div className='mb-1 flex size-12 items-center justify-center rounded-full border border-brand/40 bg-brand/10'>
                <DownloadCloud className='size-6 text-brand-text' />
              </div>
              <h3 className='font-heading text-xl font-bold uppercase tracking-wide text-foreground'>Download brochure</h3>
              <p className='text-sm leading-relaxed text-muted-foreground'>
                Enter your details to receive the full program information for {packageName} directly to your email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
              <label className='flex flex-col gap-1.5'>
                <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Full name</span>
                <input
                  type='text'
                  required
                  autoComplete='name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder='John Doe'
                  className={inputClass}
                />
              </label>

              <label className='flex flex-col gap-1.5'>
                <span className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>Email address</span>
                <input
                  type='email'
                  required
                  autoComplete='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='john@example.com'
                  className={inputClass}
                />
              </label>

              <button
                type='submit'
                disabled={isSubmitting}
                className='mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-bold uppercase tracking-wider text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge),0_0_18px_var(--brand-glow)] transition hover:brightness-95 disabled:opacity-60'
              >
                {isSubmitting && <LoaderCircle className='size-4 animate-spin' />}
                {isSubmitting ? 'Sending…' : 'Get brochure now'}
              </button>
            </form>
          </>
        )}
      </div>
    </CustomDialog>
  )
}
