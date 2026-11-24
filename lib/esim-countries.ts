// lib/esim-countries.ts
//
// Ported from the travels project's lib/esim-countries.ts, which already
// solves the exact problem matchday's eSIM Global search had: the backend's
// `type=global` packages endpoint has no country filter at all (confirmed —
// its EsimPackageFilters never accepted one, in either project). Travels
// never tries to search the global list by country text for that reason —
// typing/selecting a country always calls the `type=local&country=XX`
// endpoint instead, which the backend DOES support. This file is what makes
// that resolution possible: a real country name -> ISO code table plus a
// resolver with a fixed priority order (exact code, exact name, then
// starts-with) so "spain" reliably resolves to ES without false positives
// like "Algeria" matching "Albania".
//
// Trimmed from the travels version: no `region`/`global` pseudo-entries and
// no country-photo table, since matchday's Global tab has no per-country
// imagery and no Europe-region filter — just the country list and resolver
// the search box actually needs.

export interface EsimCountryEntry {
  label: string
  code: string
}

export const ESIM_COUNTRIES: EsimCountryEntry[] = [
  // Africa
  { label: 'Algeria', code: 'DZ' },
  { label: 'Angola', code: 'AO' },
  { label: 'Cameroon', code: 'CM' },
  { label: "Côte d'Ivoire", code: 'CI' },
  { label: 'Egypt', code: 'EG' },
  { label: 'Ethiopia', code: 'ET' },
  { label: 'Ghana', code: 'GH' },
  { label: 'Kenya', code: 'KE' },
  { label: 'Morocco', code: 'MA' },
  { label: 'Mozambique', code: 'MZ' },
  { label: 'Nigeria', code: 'NG' },
  { label: 'Rwanda', code: 'RW' },
  { label: 'Senegal', code: 'SN' },
  { label: 'South Africa', code: 'ZA' },
  { label: 'Tanzania', code: 'TZ' },
  { label: 'Tunisia', code: 'TN' },
  { label: 'Uganda', code: 'UG' },

  // Americas
  { label: 'Argentina', code: 'AR' },
  { label: 'Brazil', code: 'BR' },
  { label: 'Canada', code: 'CA' },
  { label: 'Chile', code: 'CL' },
  { label: 'Colombia', code: 'CO' },
  { label: 'Costa Rica', code: 'CR' },
  { label: 'Cuba', code: 'CU' },
  { label: 'Dominican Rep.', code: 'DO' },
  { label: 'Ecuador', code: 'EC' },
  { label: 'Jamaica', code: 'JM' },
  { label: 'Mexico', code: 'MX' },
  { label: 'Panama', code: 'PA' },
  { label: 'Peru', code: 'PE' },
  { label: 'United States', code: 'US' },
  { label: 'Uruguay', code: 'UY' },

  // Asia & Middle East
  { label: 'Azerbaijan', code: 'AZ' },
  { label: 'Bahrain', code: 'BH' },
  { label: 'Bangladesh', code: 'BD' },
  { label: 'Cambodia', code: 'KH' },
  { label: 'China', code: 'CN' },
  { label: 'Georgia', code: 'GE' },
  { label: 'Hong Kong', code: 'HK' },
  { label: 'India', code: 'IN' },
  { label: 'Indonesia', code: 'ID' },
  { label: 'Israel', code: 'IL' },
  { label: 'Japan', code: 'JP' },
  { label: 'Jordan', code: 'JO' },
  { label: 'Kazakhstan', code: 'KZ' },
  { label: 'Kuwait', code: 'KW' },
  { label: 'Kyrgyzstan', code: 'KG' },
  { label: 'Laos', code: 'LA' },
  { label: 'Lebanon', code: 'LB' },
  { label: 'Macau', code: 'MO' },
  { label: 'Malaysia', code: 'MY' },
  { label: 'Maldives', code: 'MV' },
  { label: 'Mongolia', code: 'MN' },
  { label: 'Myanmar', code: 'MM' },
  { label: 'Nepal', code: 'NP' },
  { label: 'Oman', code: 'OM' },
  { label: 'Pakistan', code: 'PK' },
  { label: 'Philippines', code: 'PH' },
  { label: 'Qatar', code: 'QA' },
  { label: 'Saudi Arabia', code: 'SA' },
  { label: 'Singapore', code: 'SG' },
  { label: 'South Korea', code: 'KR' },
  { label: 'Sri Lanka', code: 'LK' },
  { label: 'Taiwan', code: 'TW' },
  { label: 'Tajikistan', code: 'TJ' },
  { label: 'Thailand', code: 'TH' },
  { label: 'Turkey', code: 'TR' },
  { label: 'UAE', code: 'AE' },
  { label: 'Uzbekistan', code: 'UZ' },
  { label: 'Vietnam', code: 'VN' },

  // Europe
  { label: 'Albania', code: 'AL' },
  { label: 'Austria', code: 'AT' },
  { label: 'Belarus', code: 'BY' },
  { label: 'Belgium', code: 'BE' },
  { label: 'Bosnia', code: 'BA' },
  { label: 'Bulgaria', code: 'BG' },
  { label: 'Croatia', code: 'HR' },
  { label: 'Cyprus', code: 'CY' },
  { label: 'Czech Republic', code: 'CZ' },
  { label: 'Denmark', code: 'DK' },
  { label: 'Estonia', code: 'EE' },
  { label: 'Finland', code: 'FI' },
  { label: 'France', code: 'FR' },
  { label: 'Germany', code: 'DE' },
  { label: 'Greece', code: 'GR' },
  { label: 'Hungary', code: 'HU' },
  { label: 'Iceland', code: 'IS' },
  { label: 'Ireland', code: 'IE' },
  { label: 'Italy', code: 'IT' },
  { label: 'Kosovo', code: 'XK' },
  { label: 'Latvia', code: 'LV' },
  { label: 'Lithuania', code: 'LT' },
  { label: 'Luxembourg', code: 'LU' },
  { label: 'Malta', code: 'MT' },
  { label: 'Moldova', code: 'MD' },
  { label: 'Montenegro', code: 'ME' },
  { label: 'Netherlands', code: 'NL' },
  { label: 'North Macedonia', code: 'MK' },
  { label: 'Norway', code: 'NO' },
  { label: 'Poland', code: 'PL' },
  { label: 'Portugal', code: 'PT' },
  { label: 'Romania', code: 'RO' },
  { label: 'Serbia', code: 'RS' },
  { label: 'Slovakia', code: 'SK' },
  { label: 'Slovenia', code: 'SI' },
  { label: 'Spain', code: 'ES' },
  { label: 'Sweden', code: 'SE' },
  { label: 'Switzerland', code: 'CH' },
  { label: 'Ukraine', code: 'UA' },
  { label: 'United Kingdom', code: 'GB' },

  // Oceania
  { label: 'Australia', code: 'AU' },
  { label: 'Fiji', code: 'FJ' },
  { label: 'New Zealand', code: 'NZ' },
]

/** Resolve free-typed text to an ISO country code, or null if it doesn't
 *  match any known country. Fixed priority order — exact code, then exact
 *  name, then name-starts-with, then any-word-starts-with — and NO loose
 *  substring/.includes() matching, which is what let "Algeria" match
 *  "Albania" in an earlier version of this resolver (travels project fixed
 *  the same bug; ported here rather than re-introduced). */
export function resolveEsimCountryCode(input: string): string | null {
  const q = input.toLowerCase().trim()
  if (!q) return null

  const byCode = ESIM_COUNTRIES.find((c) => c.code.toLowerCase() === q)
  if (byCode) return byCode.code

  const byExact = ESIM_COUNTRIES.find((c) => c.label.toLowerCase() === q)
  if (byExact) return byExact.code

  const byStart = ESIM_COUNTRIES.find((c) =>
    c.label.toLowerCase().startsWith(q),
  )
  if (byStart) return byStart.code

  const byWordStart = ESIM_COUNTRIES.find((c) =>
    c.label
      .toLowerCase()
      .split(/\s+/)
      .some((word) => word.startsWith(q)),
  )
  if (byWordStart) return byWordStart.code

  return null
}

/** Display label for a resolved code, for messaging (e.g. "Showing local
 *  plans for Spain"). Falls back to the code itself if not found. */
export function esimCountryLabel(code: string): string {
  return ESIM_COUNTRIES.find((c) => c.code === code)?.label ?? code
}
