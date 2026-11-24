// lib/match-destinations.ts
//
// Matchday's match records (WC_MATCHES / CLUB_MATCHES in store/matches.ts)
// only carry a free-text `venue` string like "Allianz Arena, Munich" — no
// structured destination data. This resolves that venue (and the match's
// human-readable date) into the IATA airport code, ISO country code, and
// city/region name needed to auto-populate and auto-run flight, stay, and
// eSIM searches the moment a match is selected in the builder.
//
// For LIVE fixtures (NEXT_PUBLIC_MATCHDAY_TICKETS_LIVE=true), the MatchDay
// API returns a structured venue with venue_city_name and venue_country_name.
// fromLiveEvent() in features/builder/match.ts now formats venue as
// "Venue Name, City" to match what extractCityFromVenue() expects here.
// It also exposes venueCity directly on BuilderMatch — callers may pass
// that for a faster lookup that skips the string-split step.
//
// Table: built from the actual venues in store/matches.ts PLUS a broad
// set of UK and European football cities that appear in real EFL/Premier
// League fixtures returned by the MatchDay API. Add entries here whenever
// a new venue's city is not yet covered. When a city isn't found, the
// builder falls back to manual search (see extras/client.tsx).

import { getCode } from 'country-list';

export interface MatchDestination {
  city: string;
  countryName: string;
  /** ISO 3166-1 alpha-2 — used for eSIM local-package lookups */
  countryCode: string;
  /** Nearest major commercial airport IATA code — used to seed flight search */
  airportCode: string;
}

const CITY_DESTINATIONS: Record<string, MatchDestination> = {
  // ── World Cup / South America ──────────────────────────────────────────
  'mexico city': { city: 'Mexico City', countryName: 'Mexico', countryCode: 'MX', airportCode: 'MEX' },
  zapopan:       { city: 'Guadalajara', countryName: 'Mexico', countryCode: 'MX', airportCode: 'GDL' },
  guadalajara:   { city: 'Guadalajara', countryName: 'Mexico', countryCode: 'MX', airportCode: 'GDL' },
  'los angeles': { city: 'Los Angeles', countryName: 'United States', countryCode: 'US', airportCode: 'LAX' },
  'east rutherford': { city: 'New York', countryName: 'United States', countryCode: 'US', airportCode: 'EWR' },
  'new york':    { city: 'New York', countryName: 'United States', countryCode: 'US', airportCode: 'JFK' },
  newark:        { city: 'New York', countryName: 'United States', countryCode: 'US', airportCode: 'EWR' },
  'kansas city': { city: 'Kansas City', countryName: 'United States', countryCode: 'US', airportCode: 'MCI' },
  arlington:     { city: 'Dallas', countryName: 'United States', countryCode: 'US', airportCode: 'DFW' },
  dallas:        { city: 'Dallas', countryName: 'United States', countryCode: 'US', airportCode: 'DFW' },
  vancouver:     { city: 'Vancouver', countryName: 'Canada', countryCode: 'CA', airportCode: 'YVR' },
  foxborough:    { city: 'Boston', countryName: 'United States', countryCode: 'US', airportCode: 'BOS' },
  boston:        { city: 'Boston', countryName: 'United States', countryCode: 'US', airportCode: 'BOS' },
  miami:         { city: 'Miami', countryName: 'United States', countryCode: 'US', airportCode: 'MIA' },
  'san francisco': { city: 'San Francisco', countryName: 'United States', countryCode: 'US', airportCode: 'SFO' },
  seattle:       { city: 'Seattle', countryName: 'United States', countryCode: 'US', airportCode: 'SEA' },
  houston:       { city: 'Houston', countryName: 'United States', countryCode: 'US', airportCode: 'IAH' },
  philadelphia:  { city: 'Philadelphia', countryName: 'United States', countryCode: 'US', airportCode: 'PHL' },
  chicago:       { city: 'Chicago', countryName: 'United States', countryCode: 'US', airportCode: 'ORD' },

  // ── Germany ────────────────────────────────────────────────────────────
  munich:        { city: 'Munich', countryName: 'Germany', countryCode: 'DE', airportCode: 'MUC' },
  münchen:       { city: 'Munich', countryName: 'Germany', countryCode: 'DE', airportCode: 'MUC' },
  berlin:        { city: 'Berlin', countryName: 'Germany', countryCode: 'DE', airportCode: 'BER' },
  hamburg:       { city: 'Hamburg', countryName: 'Germany', countryCode: 'DE', airportCode: 'HAM' },
  frankfurt:     { city: 'Frankfurt', countryName: 'Germany', countryCode: 'DE', airportCode: 'FRA' },
  dortmund:      { city: 'Dortmund', countryName: 'Germany', countryCode: 'DE', airportCode: 'DTM' },
  cologne:       { city: 'Cologne', countryName: 'Germany', countryCode: 'DE', airportCode: 'CGN' },
  düsseldorf:    { city: 'Düsseldorf', countryName: 'Germany', countryCode: 'DE', airportCode: 'DUS' },
  dusseldorf:    { city: 'Düsseldorf', countryName: 'Germany', countryCode: 'DE', airportCode: 'DUS' },
  leipzig:       { city: 'Leipzig', countryName: 'Germany', countryCode: 'DE', airportCode: 'LEJ' },
  gelsenkirchen: { city: 'Gelsenkirchen', countryName: 'Germany', countryCode: 'DE', airportCode: 'DTM' },
  stuttgart:     { city: 'Stuttgart', countryName: 'Germany', countryCode: 'DE', airportCode: 'STR' },

  // ── UK – England ───────────────────────────────────────────────────────
  london:        { city: 'London', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LHR' },
  manchester:    { city: 'Manchester', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  liverpool:     { city: 'Liverpool', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LPL' },
  birmingham:    { city: 'Birmingham', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  newcastle:     { city: 'Newcastle', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'NCL' },
  'newcastle upon tyne': { city: 'Newcastle', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'NCL' },
  leeds:         { city: 'Leeds', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  sheffield:     { city: 'Sheffield', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  bristol:       { city: 'Bristol', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BRS' },
  leicester:     { city: 'Leicester', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'EMA' },
  nottingham:    { city: 'Nottingham', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'EMA' },
  derby:         { city: 'Derby', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'EMA' },
  // Bug: this was 'DSA' (Doncaster Sheffield Airport), which has been
  // permanently closed to commercial passenger flights since 4 Nov
  // 2022 — a reopening is being worked on but commercial flights aren't
  // expected before 2028 at the earliest. Any flight search against
  // that code returns nothing, which is exactly what showed up as
  // "dsa doesn't correspond to any airport" on the extras page. East
  // Midlands (EMA) is Lincoln's nearest live commercial airport and
  // already the airport used for the neighbouring Leicester/
  // Nottingham/Derby entries below.
  lincoln:       { city: 'Lincoln', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'EMA' },
  coventry:      { city: 'Coventry', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  sunderland:    { city: 'Sunderland', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'NCL' },
  middlesbrough: { city: 'Middlesbrough', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MME' },
  southampton:   { city: 'Southampton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'SOU' },
  portsmouth:    { city: 'Portsmouth', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'SOU' },
  brighton:      { city: 'Brighton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LGW' },
  cardiff:       { city: 'Cardiff', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'CWL' },
  swansea:       { city: 'Swansea', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'CWL' },
  norwich:       { city: 'Norwich', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'NWI' },
  ipswich:       { city: 'Ipswich', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'NWI' },
  stoke:         { city: 'Stoke-on-Trent', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  'stoke-on-trent': { city: 'Stoke-on-Trent', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  wolves:        { city: 'Wolverhampton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  wolverhampton: { city: 'Wolverhampton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  'west bromwich': { city: 'West Bromwich', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BHX' },
  reading:       { city: 'Reading', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LHR' },
  watford:       { city: 'Watford', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LHR' },
  luton:         { city: 'Luton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LTN' },
  oxford:        { city: 'Oxford', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LHR' },
  burnley:       { city: 'Burnley', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  blackburn:     { city: 'Blackburn', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  bolton:        { city: 'Bolton', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  wigan:         { city: 'Wigan', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  preston:       { city: 'Preston', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'MAN' },
  hull:          { city: 'Hull', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'HUY' },
  'kingston upon hull': { city: 'Hull', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'HUY' },
  // These three (plus Sheffield and Lincoln above) all pointed at 'DSA'
  // — see the Lincoln comment above for why that's dead. Leeds Bradford
  // is the closest live commercial airport to South Yorkshire now (~39
  // miles from Doncaster, vs ~57-59 for Manchester/East Midlands, per
  // current post-closure travel advisories).
  doncaster:     { city: 'Doncaster', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  rotherham:     { city: 'Rotherham', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  barnsley:      { city: 'Barnsley', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  huddersfield:  { city: 'Huddersfield', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },
  bradford:      { city: 'Bradford', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'LBA' },

  // ── UK – Scotland / N. Ireland ─────────────────────────────────────────
  glasgow:       { city: 'Glasgow', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'GLA' },
  edinburgh:     { city: 'Edinburgh', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'EDI' },
  aberdeen:      { city: 'Aberdeen', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'ABZ' },
  belfast:       { city: 'Belfast', countryName: 'United Kingdom', countryCode: 'GB', airportCode: 'BFS' },

  // ── Spain ─────────────────────────────────────────────────────────────
  barcelona:     { city: 'Barcelona', countryName: 'Spain', countryCode: 'ES', airportCode: 'BCN' },
  madrid:        { city: 'Madrid', countryName: 'Spain', countryCode: 'ES', airportCode: 'MAD' },
  seville:       { city: 'Seville', countryName: 'Spain', countryCode: 'ES', airportCode: 'SVQ' },
  sevilla:       { city: 'Seville', countryName: 'Spain', countryCode: 'ES', airportCode: 'SVQ' },
  valencia:      { city: 'Valencia', countryName: 'Spain', countryCode: 'ES', airportCode: 'VLC' },
  bilbao:        { city: 'Bilbao', countryName: 'Spain', countryCode: 'ES', airportCode: 'BIO' },
  'san sebastián': { city: 'San Sebastián', countryName: 'Spain', countryCode: 'ES', airportCode: 'EAS' },
  zaragoza:      { city: 'Zaragoza', countryName: 'Spain', countryCode: 'ES', airportCode: 'ZAZ' },
  malaga:        { city: 'Málaga', countryName: 'Spain', countryCode: 'ES', airportCode: 'AGP' },
  pamplona:      { city: 'Pamplona', countryName: 'Spain', countryCode: 'ES', airportCode: 'EAS' },

  // ── Italy ─────────────────────────────────────────────────────────────
  milan:         { city: 'Milan', countryName: 'Italy', countryCode: 'IT', airportCode: 'MXP' },
  rome:          { city: 'Rome', countryName: 'Italy', countryCode: 'IT', airportCode: 'FCO' },
  naples:        { city: 'Naples', countryName: 'Italy', countryCode: 'IT', airportCode: 'NAP' },
  napoli:        { city: 'Naples', countryName: 'Italy', countryCode: 'IT', airportCode: 'NAP' },
  turin:         { city: 'Turin', countryName: 'Italy', countryCode: 'IT', airportCode: 'TRN' },
  torino:        { city: 'Turin', countryName: 'Italy', countryCode: 'IT', airportCode: 'TRN' },
  florence:      { city: 'Florence', countryName: 'Italy', countryCode: 'IT', airportCode: 'FLR' },
  firenze:       { city: 'Florence', countryName: 'Italy', countryCode: 'IT', airportCode: 'FLR' },
  genoa:         { city: 'Genoa', countryName: 'Italy', countryCode: 'IT', airportCode: 'GOA' },
  bologna:       { city: 'Bologna', countryName: 'Italy', countryCode: 'IT', airportCode: 'BLQ' },
  bergamo:       { city: 'Bergamo', countryName: 'Italy', countryCode: 'IT', airportCode: 'BGY' },
  verona:        { city: 'Verona', countryName: 'Italy', countryCode: 'IT', airportCode: 'VRN' },

  // ── France ────────────────────────────────────────────────────────────
  paris:         { city: 'Paris', countryName: 'France', countryCode: 'FR', airportCode: 'CDG' },
  lyon:          { city: 'Lyon', countryName: 'France', countryCode: 'FR', airportCode: 'LYS' },
  marseille:     { city: 'Marseille', countryName: 'France', countryCode: 'FR', airportCode: 'MRS' },
  lille:         { city: 'Lille', countryName: 'France', countryCode: 'FR', airportCode: 'LIL' },
  bordeaux:      { city: 'Bordeaux', countryName: 'France', countryCode: 'FR', airportCode: 'BOD' },
  nice:          { city: 'Nice', countryName: 'France', countryCode: 'FR', airportCode: 'NCE' },
  nantes:        { city: 'Nantes', countryName: 'France', countryCode: 'FR', airportCode: 'NTE' },
  rennes:        { city: 'Rennes', countryName: 'France', countryCode: 'FR', airportCode: 'RNS' },
  toulouse:      { city: 'Toulouse', countryName: 'France', countryCode: 'FR', airportCode: 'TLS' },
  strasbourg:    { city: 'Strasbourg', countryName: 'France', countryCode: 'FR', airportCode: 'SXB' },
  lens:          { city: 'Lens', countryName: 'France', countryCode: 'FR', airportCode: 'LIL' },
  monaco:        { city: 'Monaco', countryName: 'Monaco', countryCode: 'MC', airportCode: 'NCE' },

  // ── Netherlands ───────────────────────────────────────────────────────
  amsterdam:     { city: 'Amsterdam', countryName: 'Netherlands', countryCode: 'NL', airportCode: 'AMS' },
  rotterdam:     { city: 'Rotterdam', countryName: 'Netherlands', countryCode: 'NL', airportCode: 'RTM' },
  eindhoven:     { city: 'Eindhoven', countryName: 'Netherlands', countryCode: 'NL', airportCode: 'EIN' },
  utrecht:       { city: 'Utrecht', countryName: 'Netherlands', countryCode: 'NL', airportCode: 'AMS' },
  arnhem:        { city: 'Arnhem', countryName: 'Netherlands', countryCode: 'NL', airportCode: 'AMS' },

  // ── Portugal ──────────────────────────────────────────────────────────
  lisbon:        { city: 'Lisbon', countryName: 'Portugal', countryCode: 'PT', airportCode: 'LIS' },
  porto:         { city: 'Porto', countryName: 'Portugal', countryCode: 'PT', airportCode: 'OPO' },
  braga:         { city: 'Braga', countryName: 'Portugal', countryCode: 'PT', airportCode: 'OPO' },
  guimarães:     { city: 'Guimarães', countryName: 'Portugal', countryCode: 'PT', airportCode: 'OPO' },

  // ── Other Europe ──────────────────────────────────────────────────────
  brussels:      { city: 'Brussels', countryName: 'Belgium', countryCode: 'BE', airportCode: 'BRU' },
  bruges:        { city: 'Bruges', countryName: 'Belgium', countryCode: 'BE', airportCode: 'BRU' },
  antwerp:       { city: 'Antwerp', countryName: 'Belgium', countryCode: 'BE', airportCode: 'ANR' },
  liège:         { city: 'Liège', countryName: 'Belgium', countryCode: 'BE', airportCode: 'LGG' },
  gent:          { city: 'Ghent', countryName: 'Belgium', countryCode: 'BE', airportCode: 'BRU' },
  vienna:        { city: 'Vienna', countryName: 'Austria', countryCode: 'AT', airportCode: 'VIE' },
  zurich:        { city: 'Zurich', countryName: 'Switzerland', countryCode: 'CH', airportCode: 'ZRH' },
  bern:          { city: 'Bern', countryName: 'Switzerland', countryCode: 'CH', airportCode: 'ZRH' },
  basel:         { city: 'Basel', countryName: 'Switzerland', countryCode: 'CH', airportCode: 'BSL' },
  prague:        { city: 'Prague', countryName: 'Czech Republic', countryCode: 'CZ', airportCode: 'PRG' },
  warsaw:        { city: 'Warsaw', countryName: 'Poland', countryCode: 'PL', airportCode: 'WAW' },
  'warsaw city': { city: 'Warsaw', countryName: 'Poland', countryCode: 'PL', airportCode: 'WAW' },
  krakow:        { city: 'Krakow', countryName: 'Poland', countryCode: 'PL', airportCode: 'KRK' },
  kraków:        { city: 'Krakow', countryName: 'Poland', countryCode: 'PL', airportCode: 'KRK' },
  bucharest:     { city: 'Bucharest', countryName: 'Romania', countryCode: 'RO', airportCode: 'OTP' },
  athens:        { city: 'Athens', countryName: 'Greece', countryCode: 'GR', airportCode: 'ATH' },
  istanbul:      { city: 'Istanbul', countryName: 'Turkey', countryCode: 'TR', airportCode: 'IST' },
  ankara:        { city: 'Ankara', countryName: 'Turkey', countryCode: 'TR', airportCode: 'ESB' },
  moscow:        { city: 'Moscow', countryName: 'Russia', countryCode: 'RU', airportCode: 'SVO' },
  kyiv:          { city: 'Kyiv', countryName: 'Ukraine', countryCode: 'UA', airportCode: 'KBP' },
  'kyiv city':   { city: 'Kyiv', countryName: 'Ukraine', countryCode: 'UA', airportCode: 'KBP' },
  copenhagen:    { city: 'Copenhagen', countryName: 'Denmark', countryCode: 'DK', airportCode: 'CPH' },
  stockholm:     { city: 'Stockholm', countryName: 'Sweden', countryCode: 'SE', airportCode: 'ARN' },
  oslo:          { city: 'Oslo', countryName: 'Norway', countryCode: 'NO', airportCode: 'OSL' },
  helsinki:      { city: 'Helsinki', countryName: 'Finland', countryCode: 'FI', airportCode: 'HEL' },

  // ── Middle East / Africa ──────────────────────────────────────────────
  doha:          { city: 'Doha', countryName: 'Qatar', countryCode: 'QA', airportCode: 'DOH' },
  dubai:         { city: 'Dubai', countryName: 'UAE', countryCode: 'AE', airportCode: 'DXB' },
  riyadh:        { city: 'Riyadh', countryName: 'Saudi Arabia', countryCode: 'SA', airportCode: 'RUH' },
  'saudi arabia': { city: 'Riyadh', countryName: 'Saudi Arabia', countryCode: 'SA', airportCode: 'RUH' },
  cairo:         { city: 'Cairo', countryName: 'Egypt', countryCode: 'EG', airportCode: 'CAI' },
  casablanca:    { city: 'Casablanca', countryName: 'Morocco', countryCode: 'MA', airportCode: 'CMN' },
  abuja:         { city: 'Abuja', countryName: 'Nigeria', countryCode: 'NG', airportCode: 'ABV' },
  lagos:         { city: 'Lagos', countryName: 'Nigeria', countryCode: 'NG', airportCode: 'LOS' },
};

/** Extracts the city from a "Venue Name, City" string — always the text
 *  after the last comma, trimmed. Matchday's venue strings are
 *  consistently formatted this way across both WC_MATCHES and CLUB_MATCHES.
 *  For live events, fromLiveEvent() in features/builder/match.ts formats
 *  the venue as "venue_name, venue_city_name" to match this expectation. */
function extractCityFromVenue(venue: string): string | null {
  const parts = venue.split(',');
  if (parts.length < 2) return null;
  return parts[parts.length - 1].trim();
}

/** Resolves a city name directly to structured destination data, or null
 *  if the city isn't in the table. Normalises to lowercase for the lookup.
 *  This is the core lookup — both string-based and direct-city callers use it. */
export function resolveCityDestination(cityName: string): MatchDestination | null {
  const key = cityName.toLowerCase().trim();
  if (CITY_DESTINATIONS[key]) return CITY_DESTINATIONS[key];

  // Forgiving second pass: strip accents ("Málaga" -> "malaga"), then try
  // each comma/dash-separated part ("London, England", "Greater London"),
  // then a known city appearing as a whole word inside the string.
  const plain = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const folded = plain(cityName);
  const table = Object.entries(CITY_DESTINATIONS).map(([k, v]) => [plain(k), v] as const);
  const exact = table.find(([k]) => k === folded);
  if (exact) return exact[1];
  for (const part of folded.split(/[,\-\/()]/).map((x) => x.trim()).filter(Boolean)) {
    const hit = table.find(([k]) => k === part);
    if (hit) return hit[1];
  }
  const words = ` ${folded.replace(/[^a-z0-9]+/g, ' ')} `;
  const contained = table
    .filter(([k]) => k.length >= 4 && words.includes(` ${k} `))
    .sort((a, b) => b[0].length - a[0].length)[0];
  return contained ? contained[1] : null;
}

/** ISO country code from a country name as the MatchDay API sends it
 *  ("England", "Luxembourg", "United Kingdom"). Empty string if unknown. */
export function countryCodeFromName(name: string | null | undefined): string {
  if (!name) return '';
  const n = name.trim().toLowerCase();
  // Names the country-list package doesn't know (it uses official names such
  // as "United Kingdom of Great Britain and Northern Ireland"). "United
  // Kingdom", "Netherlands", "Moldova" and "Faroe Islands" were missing,
  // which left ~295 match pages without addressCountry (SEO brief, Task 3).
  const alias: Record<string, string> = {
    england: 'GB', scotland: 'GB', wales: 'GB', 'northern ireland': 'GB',
    'united kingdom': 'GB', uk: 'GB', 'great britain': 'GB',
    usa: 'US', 'united states': 'US', 'united states of america': 'US',
    uae: 'AE', 'united arab emirates': 'AE', russia: 'RU', turkey: 'TR', turkiye: 'TR',
    czechia: 'CZ', 'czech republic': 'CZ', 'south korea': 'KR', 'korea republic': 'KR',
    'north korea': 'KP', 'north macedonia': 'MK', macedonia: 'MK',
    'bosnia and herzegovina': 'BA', bosnia: 'BA', kosovo: 'XK',
    netherlands: 'NL', 'the netherlands': 'NL', holland: 'NL',
    moldova: 'MD', 'republic of moldova': 'MD', 'faroe islands': 'FO',
    'republic of ireland': 'IE', iran: 'IR', syria: 'SY', vietnam: 'VN',
    bolivia: 'BO', venezuela: 'VE', tanzania: 'TZ', taiwan: 'TW', laos: 'LA',
    'ivory coast': 'CI', "cote d'ivoire": 'CI', 'cape verde': 'CV',
    'dr congo': 'CD', 'congo dr': 'CD', palestine: 'PS', vatican: 'VA',
  };
  if (alias[n]) return alias[n];
  return getCode(name) ?? '';
}

/** Resolves a match's venue string to structured destination data, or
 *  null if the city isn't in the table (new venue added to matches
 *  data without a corresponding entry here). Callers must handle null
 *  by falling back to manual search — never assume this always resolves. */
export function resolveMatchDestination(venue: string): MatchDestination | null {
  const city = extractCityFromVenue(venue);
  if (!city) return null;
  return resolveCityDestination(city);
}

/** Parses matchday's human-readable date strings ("Jun 11, 2026") into
 *  YYYY-MM-DD. Returns null if unparseable rather than throwing, since
 *  this feeds directly into search defaults that must never crash the
 *  builder over a malformed date. */
export function parseMatchDateISO(dateStr: string): string | null {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

/** Adds `days` calendar days to an ISO date string, returning ISO. Used
 *  to derive sensible flight-return / hotel-checkout defaults (e.g.
 *  arrive 1 day before kickoff, leave 2 days after). */
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface MatchTripDefaults {
  destination: MatchDestination;
  /** Suggested flight departure date — 1 day before kickoff */
  flightDeparture: string;
  /** Suggested flight return date — 1 day after kickoff, mirroring the
   *  1-day-before departure default. (Previously 2 days after — changed
   *  per product request so departure/return are symmetric around the
   *  match date.) */
  flightReturn: string;
  /** Suggested hotel check-in — same as flight departure */
  hotelCheckin: string;
  /** Suggested hotel check-out — 2 days after kickoff. Deliberately its own
   *  value rather than reusing flightReturn: a hotel stay running a day
   *  longer than the flight-back suggestion is a reasonable default (an
   *  extra night before an early flight out), and keeping it separate means
   *  changing the flight-return default above doesn't silently shorten the
   *  suggested hotel stay too. */
  hotelCheckout: string;
}

/** The single entry point the builder actually calls: given a match's
 *  venue + date strings, returns everything needed to auto-fill and
 *  auto-run flight/stay/eSIM searches, or null if either piece can't be
 *  resolved (unknown venue, or an unparseable date) — the builder must
 *  fall back to a manual/empty search state in that case, never guess.
 *
 *  For live fixtures, pass the match's venueCity field directly using
 *  getMatchTripDefaultsFromCity() below — it skips the string-split step. */
export function getMatchTripDefaults(
  venue: string,
  matchDateStr: string,
): MatchTripDefaults | null {
  const destination = resolveMatchDestination(venue);
  if (!destination) return null;

  const matchDateISO = parseMatchDateISO(matchDateStr);
  if (!matchDateISO) return null;

  const flightDeparture = addDaysISO(matchDateISO, -1);
  const flightReturn = addDaysISO(matchDateISO, 1);
  const hotelCheckout = addDaysISO(matchDateISO, 2);

  return {
    destination,
    flightDeparture,
    flightReturn,
    hotelCheckin: flightDeparture,
    hotelCheckout,
  };
}

/** Variant that takes a city name directly (e.g. from BuilderMatch.venueCity
 *  for live fixtures) instead of parsing it from a "Venue, City" string.
 *  Avoids the brittle string-split and works for any case where the city
 *  is already known. Falls back to null when the city isn't in the table. */
export function getMatchTripDefaultsFromCity(
  cityName: string,
  matchDateStr: string,
): MatchTripDefaults | null {
  const destination = resolveCityDestination(cityName);
  if (!destination) return null;

  const matchDateISO = parseMatchDateISO(matchDateStr);
  if (!matchDateISO) return null;

  const flightDeparture = addDaysISO(matchDateISO, -1);
  const flightReturn = addDaysISO(matchDateISO, 1);
  const hotelCheckout = addDaysISO(matchDateISO, 2);

  return {
    destination,
    flightDeparture,
    flightReturn,
    hotelCheckin: flightDeparture,
    hotelCheckout,
  };
}


/** Same dates logic as getMatchTripDefaults*, for an already-resolved
 *  destination (e.g. one found asynchronously for a city not in the table). */
export function buildTripDefaults(
  destination: MatchDestination,
  matchDateStr: string,
): MatchTripDefaults | null {
  const matchDateISO = parseMatchDateISO(matchDateStr);
  if (!matchDateISO) return null;
  const flightDeparture = addDaysISO(matchDateISO, -1);
  return {
    destination,
    flightDeparture,
    flightReturn: addDaysISO(matchDateISO, 1),
    hotelCheckin: flightDeparture,
    hotelCheckout: addDaysISO(matchDateISO, 2),
  };
}
