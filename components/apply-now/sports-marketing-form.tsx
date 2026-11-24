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
import { ProgramApplicantsService } from '@/services/program-applicants'
import { CountryDropdown, type Country } from '@/components/ui/county-dropdown'

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  sportsMarketingSchema,
  type SportsMarketingFormData,
} from '@/schema/applynow'
import { captureFormError } from '@/lib/sentry-logger'
import { PhoneInput } from './phone-input'

export function SportsMarketingForm({
  programSubcategoryId,
}: {
  programSubcategoryId?: number
}) {
  const isProgramApplicantsFlow =
    typeof programSubcategoryId === 'number' &&
    !Number.isNaN(programSubcategoryId)

  const form = useForm<SportsMarketingFormData>({
    resolver: zodResolver(sportsMarketingSchema),
    defaultValues: {
      offer_id: undefined,
      companyName: '',
      fullName: '',
      position: '',
      email: '',
      phone: '',
      country: '',
      serviceInterest: '',
      budget: '',
      projectDetails: '',
      acceptTerms: false,
    },
  })

  const { data: categoriesGroup } = useGetLandingOfferCategories()
  const cat = categoriesGroup?.find((c) => c.slug === 'sports_marketing_offers')
  const { data: offersGroup, isLoading: offersLoading } = useGetLandingOffers(
    'sports_marketing_offers',
  )
  const offersList = offersGroup || []

  async function onSubmit(data: SportsMarketingFormData) {
    try {
      const {
        offer_id: _offerId,
        acceptTerms: _acceptTerms,
        ...payloadRaw
      } = data

      const payload = {
        company_name: payloadRaw.companyName,
        contact_person: payloadRaw.fullName,
        position: payloadRaw.position,
        email: payloadRaw.email,
        phone: payloadRaw.phone,
        country: payloadRaw.country,
        service_interest: payloadRaw.serviceInterest,
        budget_range: payloadRaw.budget,
        project_details: payloadRaw.projectDetails,
      }

      const formData = new FormData()

      const dbSubmit = isProgramApplicantsFlow
        ? (() => {
            formData.append('program_category_id', '2')
            formData.append(
              'program_subcategory_id',
              String(programSubcategoryId),
            )
            formData.append('payload', JSON.stringify(payload))
            formData.append('terms_accepted', data.acceptTerms ? '1' : '0')
            return ProgramApplicantsService.createApplicant(formData)
          })()
        : (() => {
            // Legacy offers-based applications (kept for existing flows)
            if (data.offer_id) formData.append('offer_id', data.offer_id)
            if (cat) formData.append('offer_category_id', cat.id.toString())
            formData.append('offer_category_slug', 'sports_marketing_offers')
            formData.append(
              'payload',
              JSON.stringify({
                company_name: payload.company_name,
                contact_name: payload.contact_person,
                position: payload.position,
                email: payload.email,
                phone: payload.phone,
                country: payload.country,
                service_interest: payload.service_interest,
                budget_range: payload.budget_range,
                project_details: payload.project_details,
              }),
            )
            formData.append('terms_accepted', data.acceptTerms ? '1' : '0')
            return ApplicationsService.createApplication(formData)
          })()

      // 2. Submit to HubSpot (same flow as Golafly main)
      const hubspotSubmit = fetch('/api/hubspot/apply-sports-marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const [, hubspotResponse] = await Promise.all([dbSubmit, hubspotSubmit])

      if (!hubspotResponse.ok) console.warn('Failed tracking to HubSpot')

      toast.success('Application submitted successfully!', {
        description: 'Our marketing team will contact you within 24-48 hours.',
        position: 'bottom-right',
      })
      form.reset()
    } catch (error) {
      captureFormError(error, 'SportsMarketingForm', data)
      console.error('Sports marketing submit failed', error)
      toast.error('Submission failed', {
        description: 'Please try again in a moment.',
        position: 'bottom-right',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-[32px]'>
      {/* Company Information */}
      <div>
        <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
          Company Information
        </h3>

        {!isProgramApplicantsFlow && (
          <div className='mb-4'>
            <Controller
              name='offer_id'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Specific Offer (Optional)
                  </FieldLabel>
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
        )}

        <FieldGroup>
          <Controller
            name='companyName'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Company Name *
                </FieldLabel>
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

          <div className='grid grid-cols-2 gap-[16px]'>
            <Controller
              name='fullName'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Contact Person *
                  </FieldLabel>
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
              name='position'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Position *
                  </FieldLabel>
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
                    Phone Number / WhatsApp *
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

          <Controller
            name='country'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>Country *</FieldLabel>
                <CountryDropdown
                  triggerClassName='w-full bg-background border-input text-foreground'
                  onChange={(selectedCountry: Country) =>
                    field.onChange(selectedCountry.name)
                  }
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

      {/* Service Details */}
      <div>
        <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
          Service Requirements
        </h3>
        <FieldGroup>
          <div className='grid grid-cols-2 gap-[16px]'>
            <Controller
              name='serviceInterest'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Service Interest *
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full bg-background border-input text-foreground'>
                      <SelectValue placeholder='Select Service' />
                    </SelectTrigger>
                    <SelectContent className='bg-popover border-input'>
                      <SelectItem
                        value='brand-partnership'
                        className='text-foreground'
                      >
                        Brand Partnership
                      </SelectItem>
                      <SelectItem
                        value='event-sponsorship'
                        className='text-foreground'
                      >
                        Event Sponsorship
                      </SelectItem>
                      <SelectItem
                        value='digital-marketing'
                        className='text-foreground'
                      >
                        Digital Marketing
                      </SelectItem>
                      <SelectItem
                        value='athlete-endorsement'
                        className='text-foreground'
                      >
                        Athlete Endorsement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='budget'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Budget Range *
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full bg-background border-input text-foreground'>
                      <SelectValue placeholder='Select Budget' />
                    </SelectTrigger>
                    <SelectContent className='bg-popover border-input'>
                      <SelectItem value='10k-50k' className='text-foreground'>
                        $10,000 - $50,000
                      </SelectItem>
                      <SelectItem value='50k-100k' className='text-foreground'>
                        $50,000 - $100,000
                      </SelectItem>
                      <SelectItem value='100k-500k' className='text-foreground'>
                        $100,000 - $500,000
                      </SelectItem>
                      <SelectItem value='500k+' className='text-foreground'>
                        $500,000+
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

          <Controller
            name='projectDetails'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Project Details *
                </FieldLabel>
                <Textarea
                  {...field}
                  rows={5}
                  placeholder='Tell us about your marketing goals and requirements...'
                  className='bg-background border-input text-foreground resize-none'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </div>

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
        SUBMIT INQUIRY
      </button>

      <div className='flex items-center gap-[8px] text-muted-foreground text-[12px]'>
        <Checkbox className='border-muted-foreground' />
        <span>I&apos;m not a robot</span>
      </div>
    </form>
  )
}
