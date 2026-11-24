'use client'

// Exit-intent lead capture — ported from golafly-main
// (components/shared/ExitIntentPopup.tsx) with the same triggers and
// session rules, plus a Fan / Player choice that is synced to HubSpot
// (golafly_segment) so the team can tell fan leads from player leads.
//
// Triggers (unchanged): armed after 10s; desktop = mouse leaves through
// the top of the window; tab hidden; mobile = scroll back up after reading
// 30% of the page, or a 55s fallback. Shows at most once per browser
// session and never after a lead was captured.
//
// Never shown on checkout / payment / admin pages so it can't interrupt a
// purchase.

import { isVipFlowPath } from '@/features/vip/routes'
import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, CheckCircle2, Loader2, ArrowRight, Ticket, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useLandingHost, useSiteKey } from '@/lib/site-runtime'
import { siteByKey } from '@/lib/sites'
import { cn } from '@/lib/utils'
import { exitPopupSchema, type ExitPopupFormData } from '@/schema/applynow'
import { PhoneInput } from '@/components/apply-now/phone-input'
import { LandingExitForm } from '@/components/shared/exit-intent-landing-form'

const SESSION_SHOWN_KEY = 'golafly_exit_intent_shown'
const SESSION_LEAD_KEY = 'golafly_lead_captured'
const ARMED_DELAY_MS = 10_000
const MOBILE_TIME_FALLBACK_MS = 55_000
const MOBILE_SCROLL_THRESHOLD = 0.3
const MOBILE_SCROLL_UP_PX = 80

/** Purchase, payment, account and admin flows — never interrupt these. */
const SUPPRESSED_PATHS = [
  '/builder',
  '/checkout',
  '/payment-success',
  '/payment-cancelled',
  '/admin',
  '/apply-now',
  '/book-consultation',
  '/register',
  '/fan',
  '/scout',
  // World Football Summit: its own landing page and booking steps.
  '/world-football-summit',
]

function cookieBannerOpen(): boolean {
  const el = document.getElementById('CybotCookiebotDialog')
  if (!el) return false
  const s = window.getComputedStyle(el)
  return s.display !== 'none' && s.visibility !== 'hidden'
}

function ssGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}
function ssSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    /* private mode */
  }
}

export default function ExitIntentPopup() {
  const pathname = usePathname() ?? '/'
  /* Landing sites (epl., laliga. …) get a fan-only "ticket alerts" version,
     to keep the visitors who leave without booking. Their booking pages
     (/builder, /cart …) stay suppressed below, like on golafly.com. */
  const onLanding = useLandingHost()
  const siteKey = useSiteKey()
  const site = siteByKey(siteKey)
  const suppressed =
    SUPPRESSED_PATHS.some((p) => pathname.startsWith(p)) ||
    /* VIP booking flow (/vip/<club>/<match>/…, /vip/confirmed). */
    isVipFlowPath(pathname)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [hasShown, setHasShown] = React.useState(false)

  const isArmed = React.useRef(false)
  const shownRef = React.useRef(false)
  const lastScrollY = React.useRef(0)
  const maxScrollReached = React.useRef(0)
  const pageHeightRef = React.useRef(0)
  const mobileTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExitPopupFormData>({
    resolver: zodResolver(exitPopupSchema),
    defaultValues: { firstName: '', email: '', phone: '' },
  })

  // Any other lead form on the site can dispatch 'lead-captured'.
  React.useEffect(() => {
    const handler = () => ssSet(SESSION_LEAD_KEY, '1')
    window.addEventListener('lead-captured', handler)
    return () => window.removeEventListener('lead-captured', handler)
  }, [])

  const triggerPopup = React.useCallback(() => {
    if (shownRef.current || !isArmed.current) return
    if (ssGet(SESSION_SHOWN_KEY) || ssGet(SESSION_LEAD_KEY)) return
    // Never stack on top of the cookie banner; a later trigger can still fire.
    if (cookieBannerOpen()) return
    shownRef.current = true
    ssSet(SESSION_SHOWN_KEY, '1')
    setHasShown(true)
    setIsOpen(true)
  }, [])

  // Arm after a delay, and disarm on suppressed pages.
  React.useEffect(() => {
    isArmed.current = false
    if (suppressed) return
    if (ssGet(SESSION_SHOWN_KEY) || ssGet(SESSION_LEAD_KEY)) return

    const armTimer = setTimeout(() => {
      isArmed.current = true
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      if (isTouch) {
        mobileTimerRef.current = setTimeout(
          () => triggerPopup(),
          MOBILE_TIME_FALLBACK_MS - ARMED_DELAY_MS,
        )
      }
    }, ARMED_DELAY_MS)

    return () => {
      clearTimeout(armTimer)
      if (mobileTimerRef.current) clearTimeout(mobileTimerRef.current)
      isArmed.current = false
    }
  }, [suppressed, pathname, triggerPopup])

  // Desktop: pointer leaves through the top edge.
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (isArmed.current && e.clientY <= 10) triggerPopup()
    }
    document.addEventListener('mouseleave', handler)
    return () => document.removeEventListener('mouseleave', handler)
  }, [triggerPopup])

  // Tab switched away.
  React.useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') triggerPopup()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [triggerPopup])

  // Mobile: scroll back up after reading part of the page.
  React.useEffect(() => {
    const updatePageHeight = () => {
      pageHeightRef.current = document.documentElement.scrollHeight - window.innerHeight
    }
    updatePageHeight()
    window.addEventListener('resize', updatePageHeight)
    let ticking = false
    const handler = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const h = pageHeightRef.current
        const pct = h > 0 ? y / h : 0
        if (pct > maxScrollReached.current) maxScrollReached.current = pct
        if (
          maxScrollReached.current >= MOBILE_SCROLL_THRESHOLD &&
          y < lastScrollY.current - MOBILE_SCROLL_UP_PX
        ) {
          if (mobileTimerRef.current) {
            clearTimeout(mobileTimerRef.current)
            mobileTimerRef.current = null
          }
          triggerPopup()
        }
        lastScrollY.current = y
        ticking = false
      })
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => {
      window.removeEventListener('scroll', handler)
      window.removeEventListener('resize', updatePageHeight)
    }
  }, [triggerPopup])

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    setTimeout(() => setIsSubmitted(false), 400)
  }, [])

  // Esc closes.
  React.useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  const finishLanding = React.useCallback(() => {
    ssSet(SESSION_LEAD_KEY, '1')
    setIsSubmitted(true)
    setTimeout(() => handleClose(), 3500)
  }, [handleClose])

  const onSubmit = async (data: ExitPopupFormData) => {
    try {
      const res = await fetch('/api/hubspot/exit-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) console.warn('Exit intent HubSpot submission failed')
      else window.dispatchEvent(new CustomEvent('lead-captured'))
    } catch (err) {
      console.error('Exit intent submission error:', err)
    } finally {
      ssSet(SESSION_LEAD_KEY, '1')
      setIsSubmitted(true)
      setTimeout(() => handleClose(), 3000)
    }
  }

  if (suppressed && !isOpen) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key='exit-backdrop'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className='fixed inset-0 z-[9998] bg-black/70 backdrop-blur-[2px]'
              onClick={handleClose}
            />
            <motion.div
              key='exit-modal'
              role='dialog'
              aria-modal='true'
              aria-labelledby='exit-popup-title'
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className='pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center p-4'
            >
              <div
                className='pointer-events-auto relative w-full max-w-[460px] overflow-hidden rounded-[28px] border border-primary/50 bg-card shadow-[0_40px_120px_rgba(0,0,0,0.2)] dark:shadow-[0_0_80px_var(--brand-glow)] sm:rounded-[32px]'
                style={{ maxHeight: '92vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className='pointer-events-none absolute -top-24 left-1/2 hidden size-[320px] -translate-x-1/2 rounded-full bg-primary/10 blur-[60px] sm:block' />

                <button
                  type='button'
                  onClick={handleClose}
                  aria-label='Close'
                  className='absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:right-5 sm:top-5 sm:size-8'
                >
                  <X className='size-4 sm:size-3.5' />
                </button>

                <AnimatePresence mode='wait'>
                  {!isSubmitted ? (
                    <motion.div
                      key='form'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className='relative z-10 overflow-y-auto scrollbar-hide'
                      style={{ maxHeight: '92vh' }}
                    >
                      <div className='border-b border-primary/10 px-5 pt-6 pb-4 sm:px-8 sm:pt-10 sm:pb-6'>
                        <div className='mb-2.5 flex items-center gap-2 sm:mb-4'>
                          <span className='size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--brand-glow)]' />
                          <p className='font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-brand-text'>
                            Before you go
                          </p>
                        </div>
                        <h2
                          id='exit-popup-title'
                          className='mb-2 pr-8 font-heading text-[18px] font-bold uppercase leading-[1.15] tracking-tight text-foreground sm:mb-3 sm:text-[24px] sm:font-black'
                        >
                          {onLanding ? (
                            <>
                              Not ready to book <span className='text-brand-text'>yet?</span>
                            </>
                          ) : (
                            'Get first access to the biggest matches'
                          )}
                        </h2>
                        <p className='text-[12px] leading-[1.6] text-muted-foreground sm:text-[13px] sm:leading-[1.7]'>
                          {onLanding
                            ? `We'll email you when new ${site?.name ?? 'match'} tickets drop or prices change, so you never miss your match.`
                            : 'Leave your details and a Golafly advisor will reach out with tickets, travel packages or trial opportunities that fit you.'}
                        </p>
                      </div>

                      <div className='px-5 py-5 sm:px-8 sm:py-7'>
                        {onLanding ? (
                          <LandingExitForm siteKey={siteKey} onDone={finishLanding} />
                        ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className='space-y-3 sm:space-y-4' noValidate>
                          <PopupField label='I am a' error={errors.leadType?.message}>
                            <Controller
                              name='leadType'
                              control={control}
                              render={({ field }) => (
                                <div role='radiogroup' aria-label='I am a' className='grid grid-cols-2 gap-2.5'>
                                  {(
                                    [
                                      { v: 'fan', label: 'Fan', hint: 'Tickets & trips', Icon: Ticket },
                                      { v: 'player', label: 'Player', hint: 'Trials & scouting', Icon: Trophy },
                                    ] as const
                                  ).map(({ v, label, hint, Icon }) => {
                                    const on = field.value === v
                                    return (
                                      <button
                                        key={v}
                                        type='button'
                                        role='radio'
                                        aria-checked={on}
                                        onClick={() => field.onChange(v)}
                                        className={cn(
                                          'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors sm:gap-2.5 sm:px-3.5 sm:py-3',
                                          on
                                            ? 'border-primary bg-primary/15'
                                            : 'border-border bg-muted/40 hover:border-primary/40',
                                          errors.leadType && !field.value && 'border-red-400/70',
                                        )}
                                      >
                                        <Icon className={cn('size-4 shrink-0', on ? 'text-brand-text' : 'text-muted-foreground')} />
                                        <span className='min-w-0'>
                                          <span className='block text-[13px] font-semibold text-foreground sm:text-sm sm:font-bold'>{label}</span>
                                          <span className='block truncate text-[10px] text-muted-foreground sm:text-[10.5px]'>{hint}</span>
                                        </span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}
                            />
                          </PopupField>

                          <PopupField label='First name' error={errors.firstName?.message}>
                            <input
                              {...register('firstName')}
                              placeholder='e.g. Marcus'
                              autoComplete='given-name'
                              aria-invalid={!!errors.firstName}
                              className={inputClass(!!errors.firstName)}
                            />
                          </PopupField>

                          <PopupField label='Email address' error={errors.email?.message}>
                            <input
                              {...register('email')}
                              type='email'
                              placeholder='you@example.com'
                              autoComplete='email'
                              aria-invalid={!!errors.email}
                              className={inputClass(!!errors.email)}
                            />
                          </PopupField>

                          <PopupField label='Phone / WhatsApp' error={errors.phone?.message}>
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
                          </PopupField>

                          <div className='pt-1 sm:pt-2'>
                            <button
                              type='submit'
                              disabled={isSubmitting}
                              className='flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[12.5px] font-bold uppercase tracking-wider text-primary-foreground sm:h-14 sm:gap-2.5 sm:text-sm sm:font-black sm:tracking-widest shadow-[0_0_18px_var(--brand-glow)] transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className='size-4 animate-spin' /> Sending…
                                </>
                              ) : (
                                <>
                                  Keep me posted <ArrowRight className='size-4' />
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key='success'
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className='relative z-10 flex flex-col items-center justify-center px-6 py-14 text-center sm:px-8 sm:py-16'
                    >
                      <div className='mb-7 flex size-20 items-center justify-center rounded-full bg-primary/10'>
                        <div className='flex size-14 items-center justify-center rounded-full bg-primary/20'>
                          <CheckCircle2 className='size-7 text-brand-text' />
                        </div>
                      </div>
                      <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-brand-text'>
                        {onLanding ? 'You’re on the list' : 'Message received'}
                      </p>
                      <h3 className='mb-3 font-heading text-[20px] font-bold uppercase tracking-tight text-foreground sm:text-2xl sm:font-black'>
                        You&apos;re all set!
                      </h3>
                      <p className='max-w-[260px] text-[12.5px] leading-[1.75] text-muted-foreground'>
                        {onLanding
                          ? `Watch your inbox for the next ${site?.name ?? 'ticket'} drop.`
                          : 'Expect to hear from our team within 24 hours.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <StickyBar
        // Not on landing pages: their phones already have the "Get tickets" bar.
        visible={hasShown && !isOpen && !isSubmitted && !suppressed && !onLanding}
        onReopen={() => setIsOpen(true)}
      />
    </>
  )
}

function inputClass(hasError: boolean) {
  return cn(
    'h-11 w-full rounded-xl border bg-muted/40 px-4 text-[14px] sm:h-12 sm:text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary',
    hasError ? 'border-red-400/70' : 'border-border',
  )
}

/* While the bar is on screen its height is published as --bottom-bar-h on
   <html>, so the other bottom-fixed pieces (back-to-top button, app install
   prompt) sit above it instead of underneath. */
function useBottomBarHeight(el: HTMLDivElement | null) {
  React.useEffect(() => {
    if (!el) return
    const root = document.documentElement
    const set = () => root.style.setProperty('--bottom-bar-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => {
      ro.disconnect()
      root.style.removeProperty('--bottom-bar-h')
    }
  }, [el])
}

function StickyBar({ visible, onReopen }: { visible: boolean; onReopen: () => void }) {
  const [dismissed, setDismissed] = React.useState(false)
  const [barEl, setBarEl] = React.useState<HTMLDivElement | null>(null)
  useBottomBarHeight(visible && !dismissed ? barEl : null)
  if (dismissed) return null
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key='sticky-bar'
          ref={setBarEl}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className='fixed inset-x-0 bottom-0 z-[60] flex items-center justify-between gap-4 border-t border-primary/20 bg-card px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.08)]'
        >
          <div className='flex min-w-0 items-center gap-3'>
            <span className='size-1.5 shrink-0 rounded-full bg-primary' />
            <p className='truncate font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground'>
              Matchday plans? <span className='text-foreground'>Leave your number</span>
            </p>
          </div>
          <div className='flex shrink-0 items-center gap-3'>
            <button
              type='button'
              onClick={onReopen}
              className='flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em] text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95'
            >
              Get in touch <ArrowRight className='size-3' />
            </button>
            <button
              type='button'
              onClick={() => setDismissed(true)}
              aria-label='Dismiss'
              className='flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground'
            >
              <X className='size-3' />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function PopupField({
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
      <span className='mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:mb-2 sm:font-black sm:tracking-widest'>
        {label} *
      </span>
      {children}
      {error && <p className='text-[10.5px] text-red-500'>{error}</p>}
    </div>
  )
}
