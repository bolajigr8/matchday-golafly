'use client'

import Link from 'next/link'
import { useId, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Loader2, Mail, MailCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { mainUrl } from '@/lib/sites'

/* The newsletter sign-up pill, shared by the site footer and the landing
   footer. Both sit on the ink band, so the colours are the band's.
   Sends to /api/newsletter (HubSpot + Brevo). */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; confirm: boolean }
  | { kind: 'error'; message: string }

export function NewsletterForm({
  source,
  site,
  size = 'lg',
  privacyHref = '/legal/privacy',
  className,
}: {
  /** Where the form is, for reporting: 'footer', 'landing-footer' … */
  source: string
  /** Landing site key, when on a landing page. */
  site?: string
  size?: 'lg' | 'sm'
  /** Landing hostnames link out to the main site's privacy page. */
  privacyHref?: string
  className?: string
}) {
  const uid = useId()
  const inputId = `${uid}-email`
  const msgId = `${uid}-msg`
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const sending = status.kind === 'sending'
  const error = status.kind === 'error' ? status.message : null
  const sm = size === 'sm'

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (sending) return
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setStatus({ kind: 'error', message: 'Enter a valid email address, like you@email.com.' })
      return
    }
    setStatus({ kind: 'sending' })
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source, site, website }),
      })
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; confirm?: boolean; error?: string }
        | null
      if (!res.ok || !data?.ok) {
        setStatus({
          kind: 'error',
          message: data?.error || 'We couldn’t sign you up just now. Please try again.',
        })
        return
      }
      setStatus({ kind: 'done', confirm: Boolean(data.confirm) })
      // They gave us their email: the exit popup stays away this visit.
      window.dispatchEvent(new CustomEvent('lead-captured'))
    } catch {
      setStatus({ kind: 'error', message: 'No connection. Check your internet and try again.' })
    }
  }

  return (
    <div className={cn('w-full', className)} aria-live='polite'>
      <AnimatePresence mode='wait' initial={false}>
        {status.kind === 'done' ? (
          <motion.div
            key='done'
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/[0.07]',
              sm ? 'px-4 py-3' : 'px-5 py-4',
            )}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground',
                sm ? 'size-8' : 'size-10',
              )}
            >
              {status.confirm ? (
                <MailCheck aria-hidden className={sm ? 'size-4' : 'size-[18px]'} />
              ) : (
                <CheckCircle2 aria-hidden className={sm ? 'size-4' : 'size-[18px]'} />
              )}
            </span>
            <div className='min-w-0'>
              <p className={cn('font-semibold text-band-ink-fg', sm ? 'text-[14px]' : 'text-[15px]')}>
                {status.confirm ? 'Almost there, check your inbox' : 'You’re in!'}
              </p>
              <p className='mt-0.5 text-[13px] leading-snug'>
                {status.confirm
                  ? 'Click the link we just sent to confirm your subscription.'
                  : 'The next ticket drops and matchday tips will land in your inbox.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key='form'
            noValidate
            onSubmit={onSubmit}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <label htmlFor={inputId} className='sr-only'>
              Email address
            </label>
            {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
            <input
              type='text'
              name='website'
              tabIndex={-1}
              autoComplete='off'
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className='absolute -left-[9999px] size-px opacity-0'
            />
            <div
              className={cn(
                // One border only: focus just brightens it (no extra ring).
                'flex items-center gap-2 rounded-full border bg-white/[0.04] transition-[border-color,background-color] duration-200 focus-within:bg-white/[0.06]',
                sm ? 'p-1' : 'p-1.5',
                error
                  ? 'border-red-400/70'
                  : 'border-band-ink-border focus-within:border-primary/60',
              )}
            >
              <Mail aria-hidden className='ml-3 hidden size-4 shrink-0 text-band-ink-muted sm:block' />
              <input
                id={inputId}
                name='email'
                type='email'
                inputMode='email'
                autoComplete='email'
                placeholder='you@email.com'
                value={email}
                disabled={sending}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setStatus({ kind: 'idle' })
                }}
                aria-invalid={error ? true : undefined}
                aria-describedby={msgId}
                className={cn(
                  'min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-band-ink-fg shadow-none outline-none placeholder:text-band-ink-muted focus:outline-hidden focus:ring-0 disabled:opacity-70 sm:px-1 sm:text-[15px]',
                  sm ? 'h-10' : 'h-11',
                  /* Browser autofill paints its own box behind the text. Never
                     let that colour arrive (an endless background transition),
                     so the field stays see-through on the pill, and keep the
                     text in the band's white. */
                  'autofill:[transition:background-color_9999s_ease-out_0s] autofill:[-webkit-text-fill-color:var(--band-ink-fg)] autofill:[caret-color:var(--band-ink-fg)]',
                )}
              />
              <button
                type='submit'
                disabled={sending}
                className={cn(
                  'group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground transition-shadow duration-200 hover:shadow-[0_0_24px_var(--brand-glow)] disabled:cursor-wait',
                  sm ? 'h-10 px-4 text-[13px] sm:px-5' : 'h-11 px-5 text-[14px] sm:px-6',
                  FOCUS_RING,
                )}
              >
                {sending ? (
                  <>
                    <Loader2 aria-hidden className='size-4 animate-spin' />
                    <span className='hidden sm:inline'>Subscribing…</span>
                    <span className='sr-only sm:hidden'>Subscribing…</span>
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight
                      aria-hidden
                      className='hidden size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none sm:block'
                    />
                  </>
                )}
              </button>
            </div>
            {error ? (
              <p
                id={msgId}
                role='alert'
                className={cn('mt-3 px-4 leading-relaxed text-red-300', sm ? 'text-[12px]' : 'text-[13px]')}
              >
                {error}
              </p>
            ) : (
              <p id={msgId} className={cn('mt-3 px-4 leading-relaxed', sm ? 'text-[12px]' : 'text-[13px]')}>
                No spam, unsubscribe anytime. Read our{' '}
                <PrivacyLink href={privacyHref} />.
              </p>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function PrivacyLink({ href }: { href: string }) {
  const cls = cn(
    'rounded-sm text-band-ink-fg underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-primary',
    FOCUS_RING,
  )
  // On a landing hostname the legal pages live on the main site.
  return href.startsWith('/') ? (
    <Link href={href} className={cls}>
      privacy policy
    </Link>
  ) : (
    <a href={href} className={cls}>
      privacy policy
    </a>
  )
}

/** The privacy link for a landing hostname. */
export const landingPrivacyHref = () => mainUrl('/legal/privacy')
