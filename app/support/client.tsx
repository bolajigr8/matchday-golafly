'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { supportSchema, SUPPORT_TOPICS, type SupportInput } from '@/schema/support'

export function SupportClient({
  initialTopic,
}: {
  initialTopic: SupportInput['topic']
}) {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportInput>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: '',
      email: '',
      topic: initialTopic,
      orderRef: '',
      message: '',
      website: '',
    },
  })

  const onSubmit = async (values: SupportInput) => {
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Something went wrong')
      }
      setSent(true)
      reset()
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : 'Could not send your message.',
      )
    }
  }

  const fieldError = (msg?: string) =>
    msg ? <p className='mt-1.5 text-xs text-destructive'>{msg}</p> : null

  return (
    <div className='min-h-screen bg-background'>
      <section className='border-b border-border bg-gradient-to-b from-muted/40 to-background'>
        <div className='page-container py-16 sm:py-20'>
          <p className='mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary'>
            Support
          </p>
          <h1 className='font-heading text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-6xl'>
            Contact <span className='text-primary'>support</span>
          </h1>
          <p className='mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base'>
            Tell us what happened and we&apos;ll reply to your email as soon as
            we can.
          </p>
        </div>
      </section>

      <section className='page-container max-w-2xl py-12 sm:py-16'>
        {sent ? (
          <div className='rounded-2xl border border-border bg-muted/30 p-10 text-center'>
            <CheckCircle2 className='mx-auto mb-4 size-14 text-primary' />
            <h2 className='font-heading text-2xl font-bold uppercase text-foreground'>
              Message sent
            </h2>
            <p className='mt-3 text-sm text-muted-foreground'>
              Thanks, our team has your query and will reply by email.
            </p>
            <button
              type='button'
              onClick={() => setSent(false)}
              className='mt-6 text-sm font-semibold text-primary hover:underline'
            >
              Send another message
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className='space-y-6 rounded-2xl border border-border bg-muted/20 p-6 sm:p-8'
          >
            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <Label htmlFor='name' className='mb-2'>
                  Full name
                </Label>
                <Input
                  id='name'
                  autoComplete='name'
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {fieldError(errors.name?.message)}
              </div>
              <div>
                <Label htmlFor='email' className='mb-2'>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  autoComplete='email'
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {fieldError(errors.email?.message)}
              </div>
            </div>

            <div className='grid gap-6 sm:grid-cols-2'>
              <div>
                <Label htmlFor='topic' className='mb-2'>
                  Topic
                </Label>
                <select
                  id='topic'
                  className='h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
                  {...register('topic')}
                >
                  {SUPPORT_TOPICS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor='orderRef' className='mb-2'>
                  Order / booking reference (optional)
                </Label>
                <Input id='orderRef' {...register('orderRef')} />
              </div>
            </div>

            <div>
              <Label htmlFor='message' className='mb-2'>
                How can we help?
              </Label>
              <Textarea
                id='message'
                rows={6}
                aria-invalid={!!errors.message}
                {...register('message')}
              />
              {fieldError(errors.message?.message)}
            </div>

            {/* Honeypot — hidden from people, bots fill it in */}
            <div aria-hidden='true' className='absolute -left-[9999px] h-0 w-0 overflow-hidden'>
              <label>
                Website
                <input type='text' tabIndex={-1} autoComplete='off' {...register('website')} />
              </label>
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto'
            >
              {isSubmitting ? (
                <Loader2 className='size-4 animate-spin' />
              ) : (
                <Send className='size-4' />
              )}
              {isSubmitting ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
