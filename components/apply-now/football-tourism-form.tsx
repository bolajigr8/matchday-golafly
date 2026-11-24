'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  useGetLandingOffers,
  useGetLandingOfferCategories,
} from '@/hooks/use-offers'
import { ApplicationsService } from '@/services/applications'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  footballTourismSchema,
  type FootballTourismFormData,
} from '@/schema/applynow'
import { captureFormError } from '@/lib/sentry-logger'
import { PhoneInput } from './phone-input'

export function FootballTourismForm() {
  const form = useForm<FootballTourismFormData>({
    resolver: zodResolver(footballTourismSchema),
    defaultValues: {
      offer_id: undefined,
      experienceType: '',
      fullName: '',
      lastName: '',
      age: '',
      nationality: '',
      needsVisa: 'no',
      email: '',
      phone: '',
      country: '',
      acceptTerms: false,
    },
  })

  const { data: categoriesGroup } = useGetLandingOfferCategories()
  const cat = categoriesGroup?.find((c) => c.slug === 'football_tourism_offers')
  const { data: offersGroup, isLoading: offersLoading } = useGetLandingOffers(
    'football_tourism_offers',
  )
  const offersList = offersGroup || []

  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  async function onSubmit(data: FootballTourismFormData) {
    try {
      // 1. Submit to the Golafly backend database (same endpoint as Golafly main)
      const formData = new FormData()
      if (data.offer_id) formData.append('offer_id', data.offer_id)
      if (cat) formData.append('offer_category_id', cat.id.toString())
      formData.append('offer_category_slug', 'football_tourism_offers')

      const {
        offer_id: _offerId,
        profileFile: _profileFile,
        acceptTerms: _acceptTerms,
        ...payloadRaw
      } = data

      formData.append(
        'payload',
        JSON.stringify({
          first_name: payloadRaw.fullName,
          last_name: payloadRaw.lastName,
          age: payloadRaw.age,
          nationality: payloadRaw.nationality,
          visa_required: payloadRaw.needsVisa === 'yes',
          email: payloadRaw.email,
          phone: payloadRaw.phone,
          current_location_country: payloadRaw.country,
          experience_type: payloadRaw.experienceType,
        }),
      )

      formData.append('terms_accepted', data.acceptTerms ? '1' : '0')
      if (fileInputRef.current?.files?.length) {
        formData.append('attachments[0][file]', fileInputRef.current.files[0])
      }

      const dbSubmit = ApplicationsService.createApplication(formData)

      // 2. Submit to HubSpot (same flow as Golafly main — form → API route → HubSpot)
      const hubspotSubmit = fetch('/api/hubspot/apply-football-tourism', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const [, hubspotResponse] = await Promise.all([dbSubmit, hubspotSubmit])

      if (!hubspotResponse.ok) console.warn('Failed tracking to HubSpot')

      toast.success('Application submitted successfully!', {
        description: "We'll get back to you within 24-48 hours.",
        position: 'bottom-right',
      })
      form.reset()
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      captureFormError(error, 'FootballTourismForm', data)
      console.error('Football tourism submit failed', error)
      toast.error('Submission failed', {
        description: 'Please try again in a moment.',
        position: 'bottom-right',
      })
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit(onSubmit)(e)
      }}
      className='space-y-[32px]'
    >
      {/* Which Program Section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-[16px]'>
        <div>
          <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
            Which Program Are You Applying For?
          </h3>
          <Controller
            name='experienceType'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full bg-background border-input text-foreground'>
                    <SelectValue placeholder='Select Experience Type' />
                  </SelectTrigger>
                  <SelectContent className='bg-popover border-input'>
                    <SelectItem
                      value='trial-showcase'
                      className='text-foreground'
                    >
                      Trial & Showcase Experiences
                    </SelectItem>
                    <SelectItem
                      value='matchday-travel'
                      className='text-foreground'
                    >
                      Matchday Travel Experiences
                    </SelectItem>
                    <SelectItem
                      value='iconic-venues'
                      className='text-foreground'
                    >
                      Iconic Football Destinations
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
        <div>
          <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
            Specific Offer (Optional)
          </h3>
          <Controller
            name='offer_id'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={offersLoading || offersList.length === 0}
                >
                  <SelectTrigger className='w-full bg-background border-input text-foreground'>
                    <SelectValue
                      placeholder={
                        offersLoading
                          ? 'Loading offers...'
                          : 'Select an available Offer'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className='bg-popover border-input'>
                    {offersList.map((o) => (
                      <SelectItem
                        key={o.id}
                        value={o.id.toString()}
                        className='text-foreground'
                      >
                        {o.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>
      </div>

      {/* Personal Information */}
      <FieldGroup>
        <div className='grid grid-cols-2 gap-[16px]'>
          <Controller
            name='fullName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Full Name *</FieldLabel>
                <Input
                  {...field}
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name='lastName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Last Name *</FieldLabel>
                <Input
                  {...field}
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <div className='grid grid-cols-2 gap-[16px]'>
          <Controller
            name='age'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Age *</FieldLabel>
                <Input
                  {...field}
                  type='number'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name='nationality'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Nationality *
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className='w-full bg-background border-input text-foreground'>
                    <SelectValue placeholder='Select Nationality' />
                  </SelectTrigger>
                  <SelectContent className='bg-popover border-input'>
                    <SelectItem value='us' className='text-foreground'>
                      United States
                    </SelectItem>
                    <SelectItem value='uk' className='text-foreground'>
                      United Kingdom
                    </SelectItem>
                    <SelectItem value='spain' className='text-foreground'>
                      Spain
                    </SelectItem>
                    <SelectItem value='germany' className='text-foreground'>
                      Germany
                    </SelectItem>
                    <SelectItem value='france' className='text-foreground'>
                      France
                    </SelectItem>
                    <SelectItem value='italy' className='text-foreground'>
                      Italy
                    </SelectItem>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* Visa Question */}
        <Controller
          name='needsVisa'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-foreground'>
                Do you need a visa? *
              </FieldLabel>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className='flex gap-[16px]'
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value='yes'
                    id='visa-yes'
                    className='border-[#b4ff39] text-[#b4ff39]'
                  />
                  <Label htmlFor='visa-yes' className='text-foreground'>
                    Yes
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value='no'
                    id='visa-no'
                    className='border-[#b4ff39] text-[#b4ff39]'
                  />
                  <Label htmlFor='visa-no' className='text-foreground'>
                    No
                  </Label>
                </div>
              </RadioGroup>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* Contact Information */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-[16px]'>
          <Controller
            name='email'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Email Address *
                </FieldLabel>
                <Input
                  {...field}
                  type='email'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='phone'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Phone Number *
                </FieldLabel>
                <PhoneInput
                  value={field.value}
                  onChange={field.onChange}
                  hasError={fieldState.invalid}
                  placeholder='000 000 0000'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        {/* Location */}
        <Controller
          name='country'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel className='text-foreground'>
                Current Location and Country *
              </FieldLabel>
              <CountryDropdown
                triggerClassName='w-full bg-background border-input text-foreground'
                onChange={(selectedCountry: Country) =>
                  field.onChange(selectedCountry.name)
                }
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* File Upload */}
        <Field>
          <FieldLabel className='text-foreground'>
            Upload Profile CV / Resume
          </FieldLabel>
          <div className='border-2 border-dashed border-[#b4ff39]/30 rounded-[4px] p-[24px] text-center'>
            <div className='flex flex-col items-center gap-[8px]'>
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-[#b4ff39]'
              >
                <path
                  d='M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M17 8L12 3L7 8'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M12 3V15'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>

              {selectedFile ? (
                <>
                  <p className='text-[#b4ff39] text-[14px] font-semibold truncate max-w-[260px]'>
                    {selectedFile.name}
                  </p>
                  <p className='text-muted-foreground text-[12px]'>
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                </>
              ) : (
                <p className='text-[#b4ff39] text-[14px] font-semibold'>
                  UPLOAD PROFILE CV / RESUME
                </p>
              )}

              <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                id='cv-upload'
                accept='.pdf,.doc,.docx'
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />

              <Button
                type='button'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
                className='mt-[8px] border-[#b4ff39] text-[#b4ff39] hover:bg-[#b4ff39]/10'
              >
                {selectedFile ? 'CHANGE FILE' : 'CHOOSE FILE'}
              </Button>
            </div>
          </div>
        </Field>
      </FieldGroup>

      {/* Terms and Conditions */}
      <Controller
        name='acceptTerms'
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className='flex items-start gap-[12px]'>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                className='border-[#b4ff39] data-[state=checked]:bg-[#b4ff39] data-[state=checked]:text-black mt-1 shrink-0'
              />
              <Label className='text-muted-foreground inline text-[12px] leading-[18px]'>
                * Submitting an application does not guarantee acceptance. By
                applying, you agree to our{' '}
                <span className='text-[#b4ff39] inline'>Privacy Policy</span>{' '}
                and <span className='text-[#b4ff39] inline'>Terms</span>.
              </Label>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Submit Button */}
      <button
        type='submit'
        className='inline-flex items-center justify-center bg-[#b4ff39] border border-[#8fcf1f] px-[41px] py-[10px] rounded-[2px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.3)] font-bold text-[13px] uppercase text-[#1a1a1a] whitespace-nowrap transition-colors hover:bg-[#b4ff39]/80 min-h-[45px] min-w-[140px] w-full'
      >
        SUBMIT APPLICATION
      </button>

      <div className='flex items-center gap-[8px] text-muted-foreground text-[12px]'>
        <Checkbox className='border-muted-foreground' />
        <span>I&apos;m not a robot</span>
      </div>
    </form>
  )
}
