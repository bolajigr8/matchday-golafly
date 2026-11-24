'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  useGetLandingOffers,
  useGetLandingOfferCategories,
} from '@/hooks/use-offers'
import { ApplicationsService } from '@/services/applications'
import { ProgramApplicantsService } from '@/services/program-applicants'
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
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  playerManagementSchema,
  type PlayerManagementFormData,
} from '@/schema/applynow'
import { captureFormError } from '@/lib/sentry-logger'
import { PhoneInput } from './phone-input'

export function PlayerManagementForm({
  programSubcategoryId,
}: {
  programSubcategoryId?: number
}) {
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const isProgramApplicantsFlow =
    typeof programSubcategoryId === 'number' &&
    !Number.isNaN(programSubcategoryId)

  const form = useForm<PlayerManagementFormData>({
    resolver: zodResolver(playerManagementSchema),
    defaultValues: {
      offer_id: undefined,
      fullName: '',
      dateOfBirth: '',
      nationality: '',
      currentClub: '',
      position: '',
      email: '',
      phone: '',
      country: '',
      height: '',
      weight: '',
      preferredFoot: undefined,
      trainingLink: '',
      videoHighlights: '',
      experienceSummary: '',
      message: '',
      acceptTerms: false,
    },
  })

  const { data: categoriesGroup } = useGetLandingOfferCategories()
  const cat = categoriesGroup?.find(
    (c) => c.slug === 'club_offers' || c.slug === 'player_management',
  )
  const { data: offersGroup, isLoading: offersLoading } =
    useGetLandingOffers('club_offers')
  const offersList = offersGroup || []

  async function onSubmit(data: PlayerManagementFormData) {
    try {
      const {
        offer_id: _offerId,
        acceptTerms: _acceptTerms,
        profileFile: _profileFile,
        trainingLink,
        videoHighlights,
        ...payloadRaw
      } = data

      const payload = {
        full_name: payloadRaw.fullName,
        date_of_birth: payloadRaw.dateOfBirth,
        nationality: payloadRaw.nationality,
        current_club: payloadRaw.currentClub,
        position: payloadRaw.position,
        height_cm: payloadRaw.height,
        weight_kg: payloadRaw.weight,
        preferred_foot: payloadRaw.preferredFoot,
        email: payloadRaw.email,
        phone: payloadRaw.phone,
        country: payloadRaw.country,
        training_link: trainingLink,
        video_highlights_url: videoHighlights,
        experience_summary: payloadRaw.experienceSummary,
        inquiry_message: payloadRaw.message,
      }

      const formData = new FormData()

      const dbSubmit = isProgramApplicantsFlow
        ? (() => {
            formData.append('program_category_id', '3')
            formData.append(
              'program_subcategory_id',
              String(programSubcategoryId),
            )
            formData.append('payload', JSON.stringify(payload))
            formData.append('terms_accepted', data.acceptTerms ? '1' : '0')
            uploadedFiles.forEach((file) => {
              formData.append('files[]', file)
            })
            return ProgramApplicantsService.createApplicant(formData)
          })()
        : (() => {
            // Legacy offers-based applications (kept for existing flows)
            if (data.offer_id) formData.append('offer_id', data.offer_id)
            if (cat) formData.append('offer_category_id', cat.id.toString())
            formData.append('offer_category_slug', cat?.slug || 'club_offers')
            formData.append(
              'payload',
              JSON.stringify({
                ...payload,
                sport: 'Football',
                message: payload.inquiry_message,
              }),
            )
            formData.append('terms_accepted', data.acceptTerms ? '1' : '0')
            uploadedFiles.forEach((file, idx) => {
              formData.append(`attachments[${idx}][file]`, file)
            })
            return ApplicationsService.createApplication(formData)
          })()

      // 2. Submit to HubSpot (same flow as Golafly main)
      const hubspotSubmit = fetch('/api/hubspot/apply-player-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const [, hubspotResponse] = await Promise.all([dbSubmit, hubspotSubmit])

      if (!hubspotResponse.ok) console.warn('Failed tracking to HubSpot')

      toast.success('Application submitted successfully!', {
        description:
          'Our scouts will review your profile and contact you soon.',
        position: 'bottom-right',
      })
      form.reset()
      setUploadedFiles([])
    } catch (error) {
      captureFormError(error, 'PlayerManagementForm', data)
      console.error('Player management submit failed', error)
      toast.error('Submission failed', {
        description: 'Please try again in a moment.',
        position: 'bottom-right',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-[32px]'>
      {/* Personal Information */}
      <div>
        <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
          Player Information
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

          <div className='grid grid-cols-2 gap-[16px]'>
            <Controller
              name='dateOfBirth'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Date of Birth *
                  </FieldLabel>
                  <Input
                    {...field}
                    type='date'
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

          <div className='grid grid-cols-2 gap-[16px]'>
            <Controller
              name='currentClub'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Current Club (Optional)
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full bg-background border-input text-foreground'>
                      <SelectValue placeholder='Select Position' />
                    </SelectTrigger>
                    <SelectContent className='bg-popover border-input'>
                      <SelectItem
                        value='goalkeeper'
                        className='text-foreground'
                      >
                        Goalkeeper
                      </SelectItem>
                      <SelectItem value='defender' className='text-foreground'>
                        Defender
                      </SelectItem>
                      <SelectItem
                        value='midfielder'
                        className='text-foreground'
                      >
                        Midfielder
                      </SelectItem>
                      <SelectItem value='forward' className='text-foreground'>
                        Forward
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
        </FieldGroup>
      </div>

      {/* Physical Attributes */}
      <div>
        <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
          Physical Attributes
        </h3>
        <FieldGroup>
          <div className='grid grid-cols-3 gap-[16px]'>
            <Controller
              name='height'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Height (cm)
                  </FieldLabel>
                  <Input
                    {...field}
                    type='number'
                    placeholder='180'
                    className='bg-background border-input text-foreground'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='weight'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Weight (kg)
                  </FieldLabel>
                  <Input
                    {...field}
                    type='number'
                    placeholder='75'
                    className='bg-background border-input text-foreground'
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name='preferredFoot'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className='text-foreground'>
                    Preferred Foot
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className='w-full bg-background border-input text-foreground'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent className='bg-popover border-input'>
                      <SelectItem value='left' className='text-foreground'>
                        Left
                      </SelectItem>
                      <SelectItem value='right' className='text-foreground'>
                        Right
                      </SelectItem>
                      <SelectItem value='both' className='text-foreground'>
                        Both
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
        </FieldGroup>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className='text-foreground text-[16px] font-semibold mb-[24px]'>
          Contact Information
        </h3>
        <FieldGroup>
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

          <Controller
            name='trainingLink'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Transfer Market link
                </FieldLabel>
                <Input
                  {...field}
                  type='url'
                  placeholder='https://youtube.com/...'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name='videoHighlights'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Video Highlights URL (Optional)
                </FieldLabel>
                <Input
                  {...field}
                  type='url'
                  placeholder='https://youtube.com/...'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='experienceSummary'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Experience Summary *
                </FieldLabel>
                <Input
                  {...field}
                  placeholder='Academy 2018–2022; first team debut 2023...'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name='message'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel className='text-foreground'>
                  Inquiry Message *
                </FieldLabel>
                <Input
                  {...field}
                  placeholder='Interested in representation for the next window...'
                  className='bg-background border-input text-foreground'
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* File Upload */}
          <Field>
            <FieldLabel className='text-foreground'>
              Upload Profile / Resume (Multiple files allowed)
            </FieldLabel>
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
              className='hidden'
              onChange={(e) => {
                if (e.target.files) {
                  setUploadedFiles((prev) => [
                    ...prev,
                    ...Array.from(e.target.files || []),
                  ])
                }
              }}
            />
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
                <p className='text-[#b4ff39] text-[14px] font-semibold'>
                  UPLOAD PLAYER PROFILE
                </p>
                <p className='text-muted-foreground text-[12px]'>
                  PDF, DOC, DOCX, JPG, PNG accepted
                </p>
                <Button
                  type='button'
                  variant='outline'
                  className='mt-[8px] rounded-sm border-[#b4ff39] text-[#b4ff39] hover:text-[#b4ff39] hover:bg-[#b4ff39]/10'
                  onClick={() => fileInputRef.current?.click()}
                >
                  CHOOSE FILES
                </Button>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className='mt-[16px] space-y-[8px]'>
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between bg-background border border-input rounded-[4px] p-[12px]'
                  >
                    <span className='text-foreground text-[13px] truncate max-w-[80%]'>
                      {file.name}
                    </span>
                    <button
                      type='button'
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((_, i) => i !== index),
                        )
                      }
                      className='text-muted-foreground hover:text-[#b4ff39] transition-colors'
                    >
                      <X className='w-[16px] h-[16px]' />
                    </button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='mt-[8px] rounded-sm border-[#b4ff39] text-[#b4ff39] hover:text-[#b4ff39] hover:bg-[#b4ff39]/10'
                  onClick={() => fileInputRef.current?.click()}
                >
                  + ADD MORE FILES
                </Button>
              </div>
            )}
          </Field>
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
        SUBMIT APPLICATION
      </button>

      <div className='flex items-center gap-[8px] text-muted-foreground text-[12px]'>
        <Checkbox className='border-muted-foreground' />
        <span>I&apos;m not a robot</span>
      </div>
    </form>
  )
}
