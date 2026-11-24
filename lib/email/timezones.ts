// lib/email/timezones.ts
//
// The match API gives kick-off in the STADIUM's local time with no offset
// ("2027-02-14T21:00:00"). The email countdown needs the real moment (UTC),
// so the stadium's time zone comes from its country (plus the few cities
// that sit in another zone than their country's capital). Unknown country →
// null: the email then shows the kick-off text without a countdown.

/** Country (as the API names it, lower case) → IANA time zone. */
const COUNTRY_TZ: Record<string, string> = {
  'united kingdom': 'Europe/London',
  england: 'Europe/London',
  scotland: 'Europe/London',
  wales: 'Europe/London',
  'northern ireland': 'Europe/London',
  ireland: 'Europe/Dublin',
  'republic of ireland': 'Europe/Dublin',
  iceland: 'Atlantic/Reykjavik',
  'faroe islands': 'Atlantic/Faroe',
  gibraltar: 'Europe/Gibraltar',
  malta: 'Europe/Malta',
  'san marino': 'Europe/San_Marino',
  liechtenstein: 'Europe/Vaduz',
  lithuania: 'Europe/Vilnius',
  latvia: 'Europe/Riga',
  estonia: 'Europe/Tallinn',
  belarus: 'Europe/Minsk',
  moldova: 'Europe/Chisinau',
  'bosnia and herzegovina': 'Europe/Sarajevo',
  montenegro: 'Europe/Podgorica',
  'north macedonia': 'Europe/Skopje',
  kosovo: 'Europe/Belgrade',
  armenia: 'Asia/Yerevan',
  israel: 'Asia/Jerusalem',
  spain: 'Europe/Madrid',
  portugal: 'Europe/Lisbon',
  italy: 'Europe/Rome',
  germany: 'Europe/Berlin',
  france: 'Europe/Paris',
  monaco: 'Europe/Monaco',
  belgium: 'Europe/Brussels',
  netherlands: 'Europe/Amsterdam',
  luxembourg: 'Europe/Luxembourg',
  switzerland: 'Europe/Zurich',
  austria: 'Europe/Vienna',
  denmark: 'Europe/Copenhagen',
  norway: 'Europe/Oslo',
  sweden: 'Europe/Stockholm',
  finland: 'Europe/Helsinki',
  poland: 'Europe/Warsaw',
  'czech republic': 'Europe/Prague',
  czechia: 'Europe/Prague',
  slovakia: 'Europe/Bratislava',
  hungary: 'Europe/Budapest',
  croatia: 'Europe/Zagreb',
  serbia: 'Europe/Belgrade',
  slovenia: 'Europe/Ljubljana',
  albania: 'Europe/Tirane',
  greece: 'Europe/Athens',
  cyprus: 'Asia/Nicosia',
  turkey: 'Europe/Istanbul',
  turkiye: 'Europe/Istanbul',
  romania: 'Europe/Bucharest',
  bulgaria: 'Europe/Sofia',
  ukraine: 'Europe/Kyiv',
  andorra: 'Europe/Andorra',
  georgia: 'Asia/Tbilisi',
  azerbaijan: 'Asia/Baku',
  'saudi arabia': 'Asia/Riyadh',
  qatar: 'Asia/Qatar',
  'united arab emirates': 'Asia/Dubai',
  morocco: 'Africa/Casablanca',
  egypt: 'Africa/Cairo',
  japan: 'Asia/Tokyo',
}

/** Cities whose zone differs from their country's (lower case, accents off). */
const CITY_TZ: Record<string, string> = {
  funchal: 'Atlantic/Madeira',
  'ponta delgada': 'Atlantic/Azores',
  'las palmas': 'Atlantic/Canary',
  'las palmas de gran canaria': 'Atlantic/Canary',
  'santa cruz de tenerife': 'Atlantic/Canary',
  tenerife: 'Atlantic/Canary',
}

function plain(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** The stadium's time zone, or null when we don't know it. */
export function stadiumTimeZone(country: unknown, city: unknown): string | null {
  if (typeof city === 'string' && CITY_TZ[plain(city)]) return CITY_TZ[plain(city)]
  if (typeof country === 'string') return COUNTRY_TZ[plain(country)] ?? null
  return null
}

/** Offset (ms) of `tz` from UTC at the instant `utcMs`. */
function offsetMs(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'))
  return asUtc - utcMs
}

/** "2027-02-14T21:00:00" (stadium local time) → "2027-02-14T20:00:00Z".
 *  Null when the date has no time, the zone is unknown or anything is off. */
export function kickoffUtc(localIso: unknown, country: unknown, city: unknown): string | null {
  if (typeof localIso !== 'string') return null
  const m = localIso.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
  if (!m) return null
  const tz = stadiumTimeZone(country, city)
  if (!tz) return null
  try {
    const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
    /* Two passes so a kick-off near a clock change uses the right offset. */
    let utc = wall - offsetMs(wall, tz)
    utc = wall - offsetMs(utc, tz)
    const d = new Date(utc)
    return Number.isNaN(d.getTime()) ? null : d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  } catch {
    return null
  }
}
