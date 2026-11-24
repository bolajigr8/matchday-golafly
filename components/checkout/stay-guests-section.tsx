'use client'

// Hotel guest names on the cart checkout (/builder/pay), for ETG and Duffel.
// The main guest's citizenship is shown read-only: the price is tied to the
// search, so changing it means going back to the hotel search (Citizenship,
// room name and failed hotel API contract, 2.7.6).

import Link from 'next/link'
import { BedDouble } from 'lucide-react'
import { DateOfBirthPicker } from '@/components/ui/date-of-birth-picker'
import { FieldWrap, SectionCard, fieldClass } from './form-fields'
import { useStayCountries, countryName } from '@/features/stays/residency'
import { CITIZENSHIP_LABEL } from '@/components/stays/citizenship-picker'
import { todayISO } from '@/features/stays/date-validation'
import type {
  DuffelGuestDraft,
  StayCheckoutLine,
  StayGender,
  StayRoomDraft,
} from '@/features/checkout/stay-guests'

export function StayGuestsSection({
  line,
  rooms,
  duffelGuests,
  errors,
  onRoomsChange,
  onDuffelGuestsChange,
  changeHref,
}: {
  line: StayCheckoutLine
  rooms: StayRoomDraft[]
  duffelGuests: DuffelGuestDraft[]
  errors: Record<string, string>
  onRoomsChange: (rooms: StayRoomDraft[]) => void
  onDuffelGuestsChange: (guests: DuffelGuestDraft[]) => void
  changeHref: string
}) {
  return (
    <SectionCard
      title='Hotel guest details'
      subtitle='Enter every guest’s name exactly as on the ID they will show at check-in.'
    >
      <div className='mb-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex min-w-0 items-start gap-2'>
          <BedDouble className='mt-0.5 size-4 shrink-0 text-brand-text' />
          <div className='min-w-0'>
            <p className='text-[13px] font-bold text-foreground'>{line.hotelName}</p>
            {/* The full room name, never shortened (contract section 3). */}
            {line.roomName && <p className='break-words text-[12px] text-foreground/80'>{line.roomName}</p>}
          </div>
        </div>
        {line.provider === 'etg' && line.residency && <CitizenshipReadOnly code={line.residency} changeHref={changeHref} />}
      </div>

      {line.provider === 'duffel' ? (
        <div className='space-y-3'>
          {duffelGuests.map((guest, i) => {
            const set = (patch: Partial<DuffelGuestDraft>) =>
              onDuffelGuestsChange(duffelGuests.map((g, j) => (j === i ? { ...g, ...patch } : g)))
            return (
              <div key={i} className='rounded-xl border border-border bg-background/40 p-4'>
                <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>Guest {i + 1}</p>
                <div className='grid gap-3 sm:grid-cols-2'>
                  <FieldWrap label='First name' error={errors[`guests.${i}.given_name`]}>
                    <input className={fieldClass} value={guest.given_name} autoComplete='given-name' onChange={(e) => set({ given_name: e.target.value })} />
                  </FieldWrap>
                  <FieldWrap label='Last name' error={errors[`guests.${i}.family_name`]}>
                    <input className={fieldClass} value={guest.family_name} autoComplete='family-name' onChange={(e) => set({ family_name: e.target.value })} />
                  </FieldWrap>
                  <FieldWrap label='Date of birth (optional)' error={errors[`guests.${i}.born_on`]} full>
                    <DateOfBirthPicker value={guest.born_on} min='1900-01-02' max={todayISO()} onChange={(v: string) => set({ born_on: v })} />
                  </FieldWrap>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className='space-y-4'>
          {rooms.map((room, r) => {
            const update = (next: StayRoomDraft) => onRoomsChange(rooms.map((x, k) => (k === r ? next : x)))
            const slots = [
              ...room.adults.map((g, i) => ({ g, kind: 'adults' as const, i, label: `Adult ${i + 1}` })),
              ...room.children.map((g, i) => ({ g, kind: 'children' as const, i, label: `Child ${i + 1} · ${g.age} yrs` })),
            ]
            return (
              <div key={r} className='rounded-xl border border-border bg-muted/30 p-4'>
                {rooms.length > 1 && (
                  <p className='mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-brand-text'>Room {r + 1}</p>
                )}
                <div className='space-y-3'>
                  {slots.map(({ g, kind, i, label }) => {
                    const key = `rooms.${r}.${kind}.${i}`
                    const set = (patch: Partial<typeof g>) =>
                      update(
                        kind === 'adults'
                          ? { ...room, adults: room.adults.map((x, j) => (j === i ? { ...x, ...patch } : x)) }
                          : { ...room, children: room.children.map((x, j) => (j === i ? { ...x, ...patch } : x)) },
                      )
                    return (
                      <div key={key} className='rounded-lg border border-border bg-background/40 p-3'>
                        <p className='mb-2 font-mono text-[10px] font-bold text-muted-foreground'>{label}</p>
                        <div className={line.genderRequired ? 'grid gap-3 sm:grid-cols-3' : 'grid gap-3 sm:grid-cols-2'}>
                          <FieldWrap label='First name' error={errors[`${key}.first_name`]}>
                            <input className={fieldClass} value={g.first_name} onChange={(e) => set({ first_name: e.target.value })} />
                          </FieldWrap>
                          <FieldWrap label='Last name' error={errors[`${key}.last_name`]}>
                            <input className={fieldClass} value={g.last_name} onChange={(e) => set({ last_name: e.target.value })} />
                          </FieldWrap>
                          {line.genderRequired && (
                            <FieldWrap label='Gender' error={errors[`${key}.gender`]}>
                              <select className={fieldClass} value={g.gender} onChange={(e) => set({ gender: e.target.value as StayGender })}>
                                <option value=''>Select</option>
                                <option value='male'>Male</option>
                                <option value='female'>Female</option>
                                <option value='unknown'>Prefer not to say</option>
                              </select>
                            </FieldWrap>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

function CitizenshipReadOnly({ code, changeHref }: { code: string; changeHref: string }) {
  const { data: countries } = useStayCountries()
  return (
    <div className='shrink-0 sm:text-right'>
      <p className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>{CITIZENSHIP_LABEL}</p>
      <p className='text-[12px] font-medium text-foreground'>{countryName(countries, code) ?? code.toUpperCase()}</p>
      <Link href={changeHref} className='font-mono text-[10px] font-bold text-brand-text hover:underline'>
        Change search
      </Link>
    </div>
  )
}
