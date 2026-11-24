'use client'

import * as React from 'react'
import { ChevronDown, CheckIcon } from 'lucide-react'
import { CircleFlag } from 'react-circle-flags'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface PhoneInputProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  hasError?: boolean
  className?: string
  /* A country the dial code should follow — alpha2 ("ng") or a country name
     ("Nigeria"). Whenever it changes the dial code switches to match; the
     person can still pick another code from the list afterwards. */
  country?: string | null
  id?: string
  /* Style overrides so the field can match the form it sits in. */
  boxClassName?: string
  inputClassName?: string
}

interface DialEntry {
  name: string
  code: string
  alpha2: string
}

const DIAL_CODES: DialEntry[] = [
  { name: 'Afghanistan', code: '+93', alpha2: 'af' },
  { name: 'Albania', code: '+355', alpha2: 'al' },
  { name: 'Algeria', code: '+213', alpha2: 'dz' },
  { name: 'Andorra', code: '+376', alpha2: 'ad' },
  { name: 'Angola', code: '+244', alpha2: 'ao' },
  { name: 'Argentina', code: '+54', alpha2: 'ar' },
  { name: 'Armenia', code: '+374', alpha2: 'am' },
  { name: 'Australia', code: '+61', alpha2: 'au' },
  { name: 'Austria', code: '+43', alpha2: 'at' },
  { name: 'Azerbaijan', code: '+994', alpha2: 'az' },
  { name: 'Bahamas', code: '+1', alpha2: 'bs' },
  { name: 'Bahrain', code: '+973', alpha2: 'bh' },
  { name: 'Bangladesh', code: '+880', alpha2: 'bd' },
  { name: 'Belarus', code: '+375', alpha2: 'by' },
  { name: 'Belgium', code: '+32', alpha2: 'be' },
  { name: 'Belize', code: '+501', alpha2: 'bz' },
  { name: 'Benin', code: '+229', alpha2: 'bj' },
  { name: 'Bolivia', code: '+591', alpha2: 'bo' },
  { name: 'Bosnia and Herzegovina', code: '+387', alpha2: 'ba' },
  { name: 'Botswana', code: '+267', alpha2: 'bw' },
  { name: 'Brazil', code: '+55', alpha2: 'br' },
  { name: 'Brunei', code: '+673', alpha2: 'bn' },
  { name: 'Bulgaria', code: '+359', alpha2: 'bg' },
  { name: 'Burkina Faso', code: '+226', alpha2: 'bf' },
  { name: 'Burundi', code: '+257', alpha2: 'bi' },
  { name: 'Cambodia', code: '+855', alpha2: 'kh' },
  { name: 'Cameroon', code: '+237', alpha2: 'cm' },
  { name: 'Canada', code: '+1', alpha2: 'ca' },
  { name: 'Cape Verde', code: '+238', alpha2: 'cv' },
  { name: 'Central African Republic', code: '+236', alpha2: 'cf' },
  { name: 'Chad', code: '+235', alpha2: 'td' },
  { name: 'Chile', code: '+56', alpha2: 'cl' },
  { name: 'China', code: '+86', alpha2: 'cn' },
  { name: 'Colombia', code: '+57', alpha2: 'co' },
  { name: 'Comoros', code: '+269', alpha2: 'km' },
  { name: 'Congo', code: '+242', alpha2: 'cg' },
  { name: 'Costa Rica', code: '+506', alpha2: 'cr' },
  { name: 'Croatia', code: '+385', alpha2: 'hr' },
  { name: 'Cuba', code: '+53', alpha2: 'cu' },
  { name: 'Cyprus', code: '+357', alpha2: 'cy' },
  { name: 'Czech Republic', code: '+420', alpha2: 'cz' },
  { name: 'Denmark', code: '+45', alpha2: 'dk' },
  { name: 'Djibouti', code: '+253', alpha2: 'dj' },
  { name: 'Dominican Republic', code: '+1', alpha2: 'do' },
  { name: 'DR Congo', code: '+243', alpha2: 'cd' },
  { name: 'Ecuador', code: '+593', alpha2: 'ec' },
  { name: 'Egypt', code: '+20', alpha2: 'eg' },
  { name: 'El Salvador', code: '+503', alpha2: 'sv' },
  { name: 'Equatorial Guinea', code: '+240', alpha2: 'gq' },
  { name: 'Eritrea', code: '+291', alpha2: 'er' },
  { name: 'Estonia', code: '+372', alpha2: 'ee' },
  { name: 'Eswatini', code: '+268', alpha2: 'sz' },
  { name: 'Ethiopia', code: '+251', alpha2: 'et' },
  { name: 'Fiji', code: '+679', alpha2: 'fj' },
  { name: 'Finland', code: '+358', alpha2: 'fi' },
  { name: 'France', code: '+33', alpha2: 'fr' },
  { name: 'Gabon', code: '+241', alpha2: 'ga' },
  { name: 'Gambia', code: '+220', alpha2: 'gm' },
  { name: 'Georgia', code: '+995', alpha2: 'ge' },
  { name: 'Germany', code: '+49', alpha2: 'de' },
  { name: 'Ghana', code: '+233', alpha2: 'gh' },
  { name: 'Greece', code: '+30', alpha2: 'gr' },
  { name: 'Guatemala', code: '+502', alpha2: 'gt' },
  { name: 'Guinea', code: '+224', alpha2: 'gn' },
  { name: 'Guinea-Bissau', code: '+245', alpha2: 'gw' },
  { name: 'Guyana', code: '+592', alpha2: 'gy' },
  { name: 'Haiti', code: '+509', alpha2: 'ht' },
  { name: 'Honduras', code: '+504', alpha2: 'hn' },
  { name: 'Hungary', code: '+36', alpha2: 'hu' },
  { name: 'Iceland', code: '+354', alpha2: 'is' },
  { name: 'India', code: '+91', alpha2: 'in' },
  { name: 'Indonesia', code: '+62', alpha2: 'id' },
  { name: 'Iran', code: '+98', alpha2: 'ir' },
  { name: 'Iraq', code: '+964', alpha2: 'iq' },
  { name: 'Ireland', code: '+353', alpha2: 'ie' },
  { name: 'Israel', code: '+972', alpha2: 'il' },
  { name: 'Italy', code: '+39', alpha2: 'it' },
  { name: 'Ivory Coast', code: '+225', alpha2: 'ci' },
  { name: 'Jamaica', code: '+1', alpha2: 'jm' },
  { name: 'Japan', code: '+81', alpha2: 'jp' },
  { name: 'Jordan', code: '+962', alpha2: 'jo' },
  { name: 'Kazakhstan', code: '+7', alpha2: 'kz' },
  { name: 'Kenya', code: '+254', alpha2: 'ke' },
  { name: 'Kosovo', code: '+383', alpha2: 'xk' },
  { name: 'Kuwait', code: '+965', alpha2: 'kw' },
  { name: 'Kyrgyzstan', code: '+996', alpha2: 'kg' },
  { name: 'Laos', code: '+856', alpha2: 'la' },
  { name: 'Latvia', code: '+371', alpha2: 'lv' },
  { name: 'Lebanon', code: '+961', alpha2: 'lb' },
  { name: 'Lesotho', code: '+266', alpha2: 'ls' },
  { name: 'Liberia', code: '+231', alpha2: 'lr' },
  { name: 'Libya', code: '+218', alpha2: 'ly' },
  { name: 'Liechtenstein', code: '+423', alpha2: 'li' },
  { name: 'Lithuania', code: '+370', alpha2: 'lt' },
  { name: 'Luxembourg', code: '+352', alpha2: 'lu' },
  { name: 'Madagascar', code: '+261', alpha2: 'mg' },
  { name: 'Malawi', code: '+265', alpha2: 'mw' },
  { name: 'Malaysia', code: '+60', alpha2: 'my' },
  { name: 'Maldives', code: '+960', alpha2: 'mv' },
  { name: 'Mali', code: '+223', alpha2: 'ml' },
  { name: 'Malta', code: '+356', alpha2: 'mt' },
  { name: 'Mauritania', code: '+222', alpha2: 'mr' },
  { name: 'Mauritius', code: '+230', alpha2: 'mu' },
  { name: 'Mexico', code: '+52', alpha2: 'mx' },
  { name: 'Moldova', code: '+373', alpha2: 'md' },
  { name: 'Monaco', code: '+377', alpha2: 'mc' },
  { name: 'Mongolia', code: '+976', alpha2: 'mn' },
  { name: 'Montenegro', code: '+382', alpha2: 'me' },
  { name: 'Morocco', code: '+212', alpha2: 'ma' },
  { name: 'Mozambique', code: '+258', alpha2: 'mz' },
  { name: 'Myanmar', code: '+95', alpha2: 'mm' },
  { name: 'Namibia', code: '+264', alpha2: 'na' },
  { name: 'Nepal', code: '+977', alpha2: 'np' },
  { name: 'Netherlands', code: '+31', alpha2: 'nl' },
  { name: 'New Zealand', code: '+64', alpha2: 'nz' },
  { name: 'Nicaragua', code: '+505', alpha2: 'ni' },
  { name: 'Niger', code: '+227', alpha2: 'ne' },
  { name: 'Nigeria', code: '+234', alpha2: 'ng' },
  { name: 'North Korea', code: '+850', alpha2: 'kp' },
  { name: 'North Macedonia', code: '+389', alpha2: 'mk' },
  { name: 'Norway', code: '+47', alpha2: 'no' },
  { name: 'Oman', code: '+968', alpha2: 'om' },
  { name: 'Pakistan', code: '+92', alpha2: 'pk' },
  { name: 'Palestine', code: '+970', alpha2: 'ps' },
  { name: 'Panama', code: '+507', alpha2: 'pa' },
  { name: 'Papua New Guinea', code: '+675', alpha2: 'pg' },
  { name: 'Paraguay', code: '+595', alpha2: 'py' },
  { name: 'Peru', code: '+51', alpha2: 'pe' },
  { name: 'Philippines', code: '+63', alpha2: 'ph' },
  { name: 'Poland', code: '+48', alpha2: 'pl' },
  { name: 'Portugal', code: '+351', alpha2: 'pt' },
  { name: 'Qatar', code: '+974', alpha2: 'qa' },
  { name: 'Romania', code: '+40', alpha2: 'ro' },
  { name: 'Russia', code: '+7', alpha2: 'ru' },
  { name: 'Rwanda', code: '+250', alpha2: 'rw' },
  { name: 'Saudi Arabia', code: '+966', alpha2: 'sa' },
  { name: 'Senegal', code: '+221', alpha2: 'sn' },
  { name: 'Serbia', code: '+381', alpha2: 'rs' },
  { name: 'Sierra Leone', code: '+232', alpha2: 'sl' },
  { name: 'Singapore', code: '+65', alpha2: 'sg' },
  { name: 'Slovakia', code: '+421', alpha2: 'sk' },
  { name: 'Slovenia', code: '+386', alpha2: 'si' },
  { name: 'Somalia', code: '+252', alpha2: 'so' },
  { name: 'South Africa', code: '+27', alpha2: 'za' },
  { name: 'South Korea', code: '+82', alpha2: 'kr' },
  { name: 'South Sudan', code: '+211', alpha2: 'ss' },
  { name: 'Spain', code: '+34', alpha2: 'es' },
  { name: 'Sri Lanka', code: '+94', alpha2: 'lk' },
  { name: 'Sudan', code: '+249', alpha2: 'sd' },
  { name: 'Suriname', code: '+597', alpha2: 'sr' },
  { name: 'Sweden', code: '+46', alpha2: 'se' },
  { name: 'Switzerland', code: '+41', alpha2: 'ch' },
  { name: 'Syria', code: '+963', alpha2: 'sy' },
  { name: 'Taiwan', code: '+886', alpha2: 'tw' },
  { name: 'Tajikistan', code: '+992', alpha2: 'tj' },
  { name: 'Tanzania', code: '+255', alpha2: 'tz' },
  { name: 'Thailand', code: '+66', alpha2: 'th' },
  { name: 'Timor-Leste', code: '+670', alpha2: 'tl' },
  { name: 'Togo', code: '+228', alpha2: 'tg' },
  { name: 'Trinidad and Tobago', code: '+1', alpha2: 'tt' },
  { name: 'Tunisia', code: '+216', alpha2: 'tn' },
  { name: 'Turkey', code: '+90', alpha2: 'tr' },
  { name: 'Turkmenistan', code: '+993', alpha2: 'tm' },
  { name: 'Uganda', code: '+256', alpha2: 'ug' },
  { name: 'Ukraine', code: '+380', alpha2: 'ua' },
  { name: 'United Arab Emirates', code: '+971', alpha2: 'ae' },
  { name: 'United Kingdom', code: '+44', alpha2: 'gb' },
  { name: 'United States', code: '+1', alpha2: 'us' },
  { name: 'Uruguay', code: '+598', alpha2: 'uy' },
  { name: 'Uzbekistan', code: '+998', alpha2: 'uz' },
  { name: 'Venezuela', code: '+58', alpha2: 've' },
  { name: 'Vietnam', code: '+84', alpha2: 'vn' },
  { name: 'Yemen', code: '+967', alpha2: 'ye' },
  { name: 'Zambia', code: '+260', alpha2: 'zm' },
  { name: 'Zimbabwe', code: '+263', alpha2: 'zw' },
]

/** The dial-code entry for an alpha2 code or a country name, if we have one. */
export function dialEntryFor(country?: string | null): DialEntry | undefined {
  if (!country) return undefined
  const c = country.trim().toLowerCase()
  return (
    DIAL_CODES.find((d) => d.alpha2 === c) ??
    DIAL_CODES.find((d) => d.name.toLowerCase() === c)
  )
}

export function PhoneInput({
  value = '',
  onChange,
  placeholder = '000 000 0000',
  hasError = false,
  className = '',
  country,
  id,
  boxClassName,
  inputClassName,
}: PhoneInputProps) {
  const defaultEntry =
    dialEntryFor(country) ??
    DIAL_CODES.find((d) => d.alpha2 === 'gb') ??
    DIAL_CODES[0]
  const [selectedDial, setSelectedDial] =
    React.useState<DialEntry>(defaultEntry)
  const [localNumber, setLocalNumber] = React.useState('')
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!value) return
    const matched = DIAL_CODES.find((d) => value.startsWith(d.code))
    if (matched) {
      // Seeding from the initial value, once on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDial(matched)
      setLocalNumber(value.slice(matched.code.length).trimStart())
    } else {
      setLocalNumber(value)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const emit = React.useCallback(
    (dial: DialEntry, number: string) => {
      const composed = number ? `${dial.code} ${number.trim()}` : ''
      onChange?.(composed)
    },
    [onChange],
  )

  /* Follow the country: a newly chosen country sets its dial code. Keyed on
     the resolved alpha2 so re-renders with the same country change nothing,
     and a code the person picked by hand stays until the country changes. */
  const followed = dialEntryFor(country)?.alpha2
  const lastFollowed = React.useRef(followed)
  React.useEffect(() => {
    if (!followed || followed === lastFollowed.current) return
    lastFollowed.current = followed
    const entry = dialEntryFor(followed)
    if (!entry) return
    // Syncing to the `country` prop, and telling the parent the new number.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedDial(entry)
    emit(entry, localNumber)
  }, [followed]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDialSelect = (entry: DialEntry) => {
    setSelectedDial(entry)
    setOpen(false)
    emit(entry, localNumber)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value
    setLocalNumber(num)
    emit(selectedDial, num)
  }

  return (
    <div className={cn('flex w-full', className)}>
      {/* Single unified box — one border, one background, looks like one input */}
      <div
        className={cn(
          'flex w-full items-center rounded-md border shadow-sm',
          'bg-form-input-bg border-form-input-border',
          'ring-[#b4ff39] focus-within:ring-1 focus-within:ring-[#b4ff39]',
          hasError && 'border-destructive',
          boxClassName,
        )}
      >
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type='button'
              className={cn(
                'flex h-9 items-center gap-1.5 pl-3 pr-2 shrink-0 rounded-l-md',
                'bg-transparent text-lp-text-heading text-sm',
                'hover:bg-accent hover:text-accent-foreground cursor-pointer',
                'transition-colors duration-150',
                'focus:outline-none',
              )}
            >
              <div className='inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full'>
                <CircleFlag countryCode={selectedDial.alpha2} height={20} />
              </div>
              <span className='text-xs font-bold text-muted-foreground'>
                {selectedDial.code}
              </span>
              <ChevronDown
                size={14}
                className={cn(
                  'text-muted-foreground transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </button>
          </PopoverTrigger>

          <PopoverContent
            collisionPadding={10}
            side='bottom'
            align='start'
            className='min-w-[280px] p-0'
          >
            <Command className='w-full max-h-[200px] sm:max-h-[270px]'>
              <CommandList>
                <div className='sticky top-0 z-10 bg-popover'>
                  <CommandInput placeholder='Search country or code...' />
                </div>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {DIAL_CODES.map((entry) => (
                    <CommandItem
                      key={`${entry.alpha2}-${entry.code}`}
                      value={`${entry.name} ${entry.code}`}
                      onSelect={() => handleDialSelect(entry)}
                      className='flex items-center gap-2'
                    >
                      <div className='flex flex-grow w-0 items-center gap-2 overflow-hidden'>
                        <div className='inline-flex items-center justify-center w-5 h-5 shrink-0 overflow-hidden rounded-full'>
                          <CircleFlag countryCode={entry.alpha2} height={20} />
                        </div>
                        <span className='overflow-hidden text-ellipsis whitespace-nowrap text-sm'>
                          {entry.name}
                        </span>
                        <span className='text-muted-foreground text-xs shrink-0'>
                          {entry.code}
                        </span>
                      </div>
                      <CheckIcon
                        className={cn(
                          'ml-auto h-4 w-4 shrink-0',
                          selectedDial.alpha2 === entry.alpha2 &&
                            selectedDial.code === entry.code
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Thin internal divider only — no border on the input itself */}
        <div className='w-px self-stretch bg-form-input-border opacity-50' />

        {/* Input is fully borderless — the outer div owns the border */}
        <Input
          id={id}
          type='tel'
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder}
          autoComplete='tel-national'
          className={cn(
            'flex-1 h-9 border-0 bg-transparent shadow-none',
            'focus-visible:ring-0 focus-visible:ring-offset-0',
            'text-lp-text-heading placeholder:text-muted-foreground',
            inputClassName,
          )}
        />
      </div>
    </div>
  )
}
