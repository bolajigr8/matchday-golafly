'use client'

import * as React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { ArrowRight, CircleCheck, LoaderCircle } from 'lucide-react'
import { PhoneInput } from '@/components/apply-now/phone-input'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { captureFormError } from '@/lib/sentry-logger'
import { QueryParams, Routes } from '@/routes'
import { internshipApplicationSchema, type InternshipApplicationData } from '@/schema/internship'
import { INTERNSHIP_FIELD_MAP, InternshipService, buildInternshipFormData } from '@/services/internship'
import { YEAR_OF_STUDY_OPTIONS, type InternshipPosition } from '@/store/internship'
import { CvDropzone } from './cv-dropzone'
import { pillPrimary, pillSecondary } from './ui'

const inputClass = 'h-11 bg-background border-input text-foreground'

type Submitted = { firstName: string; email: string; positionTitle: string }

export function InternshipApplyForm({ positions }: { positions: InternshipPosition[] }) {
  const [submitted, setSubmitted] = React.useState<Submitted | null>(null)
  const [formKey, setFormKey] = React.useState(0)

  if (submitted) {
    return (
      <div className='grid justify-items-center gap-4 rounded-3xl border border-border bg-card px-6 py-14 text-center'>
        <span className='grid size-16 place-items-center rounded-full bg-primary/15 text-brand-text'>
          <CircleCheck className='size-8' />
        </span>
        <h2 className='text-3xl font-bold text-foreground'>Application received</h2>
        <p className='max-w-md text-muted-foreground'>
          {`Thanks, ${submitted.firstName}. Your application for ${submitted.positionTitle} is with the Golafly team. We'll reply to ${submitted.email}.`}
        </p>
        <div className='flex flex-col gap-3 pt-2 sm:flex-row'>
          <Link href={Routes.internship} className={pillSecondary}>
            Back to internship
          </Link>
          <button
            type='button'
            onClick={() => {
              setSubmitted(null)
              setFormKey((k) => k + 1)
            }}
            className='px-4 py-3 text-sm font-semibold text-brand-text'
          >
            Submit another application
          </button>
        </div>
      </div>
    )
  }

  return <ApplyFormFields key={formKey} positions={positions} onSubmitted={setSubmitted} />
}

function ApplyFormFields({
  positions,
  onSubmitted,
}: {
  positions: InternshipPosition[]
  onSubmitted: (value: Submitted) => void
}) {
  const searchParams = useSearchParams()
  const requested = searchParams.get(QueryParams.position) ?? ''
  const initialPosition = positions.some((p) => p.slug === requested) ? requested : ''

  const form = useForm<InternshipApplicationData>({
    resolver: zodResolver(internshipApplicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      country: '',
      university: '',
      course: '',
      yearOfStudy: '',
      position: initialPosition,
      startDate: '',
      portfolioUrl: '',
      motivation: '',
      cv: undefined,
      acceptTerms: false,
    },
  })

  const onSubmit = async (data: InternshipApplicationData) => {
    // The API stores the position by its name ("Marketing"), not the slug.
    const positionTitle = positions.find((p) => p.slug === data.position)?.title ?? data.position
    try {
      await InternshipService.submitApplication(buildInternshipFormData(data, positionTitle))
      onSubmitted({
        firstName: data.fullName.split(' ')[0],
        email: data.email,
        positionTitle,
      })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      captureFormError(error, 'InternshipApplyForm', { ...data, cv: data.cv?.name })
      const body = (error as { response?: { data?: { message?: string; errors?: Record<string, string[] | string> } } })
        ?.response?.data
      // A 422 names the fields it rejected — put each message on its input.
      let first: string | undefined
      for (const [apiField, raw] of Object.entries(body?.errors ?? {})) {
        const message = Array.isArray(raw) ? raw[0] : raw
        const field = INTERNSHIP_FIELD_MAP[apiField]
        if (!message) continue
        first ??= message
        if (field) form.setError(field, { type: 'server', message })
      }
      toast.error('We couldn’t send your application', {
        description: first ?? body?.message ?? 'Check your connection and try again.',
      })
    }
  }

  const motivationLength = useWatch({ control: form.control, name: 'motivation' })?.length ?? 0

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className='grid gap-8 rounded-3xl border border-border bg-card p-5 sm:p-8 lg:p-9'
    >
      <Section title='About you'>
        <div className='grid gap-5 sm:grid-cols-2'>
          <TextField form={form} name='fullName' label='Full name' autoComplete='name' />
          <TextField form={form} name='email' label='Email' type='email' autoComplete='email' inputMode='email' />
        </div>
        <div className='grid gap-5 sm:grid-cols-2'>
          <Controller
            name='phone'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Phone</FieldLabel>
                <PhoneInput value={field.value} onChange={field.onChange} hasError={fieldState.invalid} />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            name='country'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Country of residence</FieldLabel>
                <CountryDropdown
                  triggerClassName='w-full h-11 bg-background border-input text-foreground'
                  onChange={(country: Country) => field.onChange(country.name)}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </Section>

      <Section title='Your studies'>
        <div className='grid gap-5 sm:grid-cols-2'>
          <TextField form={form} name='university' label='University' autoComplete='organization' />
          <TextField form={form} name='course' label='Course of study' placeholder='e.g. BSc International Business' />
        </div>
        <div className='grid gap-5 sm:grid-cols-2'>
          <Controller
            name='yearOfStudy'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Year of study</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full bg-background border-input text-foreground data-[size=default]:h-11' aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder='Select your year' />
                  </SelectTrigger>
                  <SelectContent className='bg-popover border-input'>
                    {YEAR_OF_STUDY_OPTIONS.map((year) => (
                      <SelectItem key={year} value={year} className='text-foreground'>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <TextField form={form} name='startDate' label='Earliest start date' type='date' />
        </div>
      </Section>

      <Section title='The role'>
        <Controller
          name='position'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-foreground'>Internship position</FieldLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className='w-full bg-background border-input text-foreground data-[size=default]:h-11' aria-invalid={fieldState.invalid}>
                  <SelectValue placeholder='Choose a position' />
                </SelectTrigger>
                <SelectContent className='bg-popover border-input'>
                  {positions.map((position) => (
                    <SelectItem key={position.slug} value={position.slug} className='text-foreground'>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <TextField
          form={form}
          name='portfolioUrl'
          label='LinkedIn or portfolio'
          optional
          type='url'
          inputMode='url'
          placeholder='https://linkedin.com/in/…'
        />
        <Controller
          name='motivation'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-foreground'>Why this track?</FieldLabel>
              <Textarea
                {...field}
                rows={5}
                maxLength={1000}
                aria-invalid={fieldState.invalid}
                placeholder='What interests you about this area, and what would you like to work on?'
                className='min-h-32 bg-background border-input text-foreground'
              />
              <div className='flex justify-between gap-4'>
                {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : <span />}
                <span className='shrink-0 text-xs tabular-nums text-muted-foreground'>{motivationLength} / 1,000</span>
              </div>
            </Field>
          )}
        />
      </Section>

      <Section title='Your CV'>
        <Controller
          name='cv'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <CvDropzone
                value={field.value}
                invalid={fieldState.invalid}
                onChange={(file) => {
                  field.onChange(file)
                  if (file) void form.trigger('cv')
                }}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </Section>

      <Controller
        name='acceptTerms'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <label className='flex items-start gap-3 text-sm text-foreground'>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.invalid}
                className='mt-0.5'
              />
              <span>
                I agree that Golafly may store my application and CV to assess it, and contact me about this
                internship.
              </span>
            </label>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className='border-t border-border pt-6'>
        <button
          type='submit'
          disabled={form.formState.isSubmitting}
          className={`${pillPrimary} w-full disabled:opacity-70 sm:w-auto`}
        >
          {form.formState.isSubmitting ? (
            <>
              <LoaderCircle className='size-4 animate-spin' />
              Sending…
            </>
          ) : (
            <>
              Submit application
              <ArrowRight className='size-4' strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className='grid gap-5'>
      <legend className='mb-5 font-heading text-lg font-semibold text-foreground'>{title}</legend>
      <FieldGroup className='gap-5'>{children}</FieldGroup>
    </fieldset>
  )
}

type TextFieldName = 'fullName' | 'email' | 'university' | 'course' | 'startDate' | 'portfolioUrl'

function TextField({
  form,
  name,
  label,
  optional,
  ...inputProps
}: {
  form: ReturnType<typeof useForm<InternshipApplicationData>>
  name: TextFieldName
  label: string
  optional?: boolean
} & Omit<React.ComponentProps<'input'>, 'name' | 'form'>) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel className='text-foreground'>
            {label}
            {optional && <span className='font-normal text-muted-foreground'> (optional)</span>}
          </FieldLabel>
          <Input {...inputProps} {...field} aria-invalid={fieldState.invalid} className={inputClass} />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
