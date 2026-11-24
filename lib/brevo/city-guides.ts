// lib/brevo/city-guides.ts
//
// Content for email 3, "Discover your matchday city" (sent 14 days before the
// match): one photo and three tips — something to see, a pre-match bite and
// the route to the stadium. It reaches Brevo as contact attributes
// (lib/brevo/matchday.ts), because that email starts from the match date and
// can only read the contact.
//
// Every city gets the GENERAL version. The busiest match cities (from our
// upcoming fixtures, 19 Nov 2026) have their own "see" and "bite" tips, and
// stadiums with a clear public-transport stop have their own route tip.
// Facts here are customer-facing: check them before launch, and keep them
// short (one or two sentences, as in the design).

import { namesMatch } from '@/features/matchday/resolve'

/** Cities compare exactly (accents/case/punctuation ignored): a loose match
 *  would give London's tips to "Londonderry". Stadium names use the looser
 *  namesMatch (the API varies them), but only within the right city. */
function sameName(a: string, b: string): boolean {
  const n = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  return !!n(a) && n(a) === n(b)
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://golafly.com').replace(/\/$/, '')

export interface CityGuide {
  /** Absolute URL of the city photo (JPG, 1200×480). */
  photo: string
  see: string
  bite: string
  route: string
}

interface CityEntry {
  /** Names the match API may use for the city. */
  names: string[]
  photo?: string
  see: string
  bite: string
}

const CITIES: CityEntry[] = [
  {
    names: ['London'],
    see: 'Walk the South Bank from Westminster Bridge to Tower Bridge for the classic London views.',
    bite: 'Head to Covent Garden or Borough Market for a bite before making your way to the stadium.',
  },
  {
    names: ['Manchester'],
    see: "Explore the Northern Quarter's street art, record shops and independent cafés.",
    bite: 'Grab a pre-match bite in the Northern Quarter, a short walk from Piccadilly station.',
  },
  {
    names: ['Liverpool'],
    see: 'Walk along the Royal Albert Dock and the waterfront, home to the Beatles Story and the Tate.',
    bite: 'Try one of the cafés and restaurants on Bold Street or in the Baltic Triangle.',
  },
  {
    names: ['Birmingham'],
    see: 'Wander the canals around Brindleyplace and Gas Street Basin in the city centre.',
    bite: 'Find a pre-match bite in the Jewellery Quarter or at the food spots in Digbeth.',
  },
  {
    names: ['Madrid'],
    see: 'Stroll from Puerta del Sol to Plaza Mayor and on to the Royal Palace.',
    bite: 'Try tapas at Mercado de San Miguel, right next to Plaza Mayor.',
  },
  {
    names: ['Barcelona'],
    photo: `${SITE_URL}/email/city-barcelona.jpg`,
    see: 'Start at Sagrada Família, then take a walk through El Born if you have time.',
    bite: 'Head to La Boqueria Market for jamón and fresh fruit juice before making your way to the stadium.',
  },
  {
    names: ['Milan', 'Milano'],
    see: 'Start at the Duomo and walk through the Galleria Vittorio Emanuele II.',
    bite: 'Join the aperitivo along the Navigli canals before heading to the stadium.',
  },
  {
    names: ['Rome', 'Roma'],
    see: 'If you have a few hours, see the Colosseum and the Trevi Fountain.',
    bite: 'Have lunch in Trastevere before making your way to the stadium.',
  },
  {
    names: ['Turin', 'Torino'],
    see: 'Walk from Piazza Castello down Via Roma to Piazza San Carlo.',
    bite: "Stop for a bicerin, Turin's famous coffee and chocolate drink, in one of the historic cafés.",
  },
  {
    names: ['Lisbon', 'Lisboa'],
    see: 'Ride the famous tram 28 through the old streets of Alfama and Baixa.',
    bite: 'Try a pastel de nata in Belém, or grab lunch in the Time Out Market at Cais do Sodré.',
  },
  {
    names: ['Sevilla', 'Seville'],
    see: 'Visit the Cathedral and the Giralda, then the gardens of the Real Alcázar.',
    bite: 'Have tapas in Triana, just across the river from the old town.',
  },
  {
    names: ['Paris'],
    see: 'Walk along the Seine from the Louvre to the Eiffel Tower.',
    bite: 'Grab lunch at a bistro in Saint-Germain or Le Marais before the match.',
  },
  {
    names: ['Munich', 'München'],
    see: 'Start at Marienplatz, then wander through the Viktualienmarkt.',
    bite: 'Have a traditional lunch in one of the beer halls around Marienplatz.',
  },
]

/** Stadiums with a clear public-transport stop (names as the API uses them). */
/** Each route also names its city, so a stadium in another city with a
 *  similar name ("Stadio Olimpico Grande Torino") never gets Rome's tram. */
const ROUTES: Array<{ city: string; names: string[]; route: string }> = [
  // London
  { city: 'London', names: ['Stamford Bridge'], route: 'Take the District line to Fulham Broadway, a short walk from the stadium.' },
  { city: 'London', names: ['Emirates Stadium'], route: 'Take the Piccadilly line to Arsenal station, or the Victoria line to Highbury & Islington.' },
  { city: 'London', names: ['Tottenham Hotspur Stadium'], route: 'Take the Overground to White Hart Lane, a few minutes from the stadium.' },
  { city: 'London', names: ['London Stadium'], route: 'Head to Stratford station (Central, Jubilee and Elizabeth lines, DLR and Overground), then walk through the Olympic Park.' },
  { city: 'London', names: ['Wembley Stadium', 'Wembley'], route: 'Take the Jubilee or Metropolitan line to Wembley Park and walk up Olympic Way.' },
  { city: 'London', names: ['Craven Cottage'], route: 'Take the District line to Putney Bridge, then walk through Bishops Park.' },
  { city: 'London', names: ['Selhurst Park'], route: 'Take the train to Selhurst or Norwood Junction, both a short walk from the stadium.' },
  { city: 'London', names: ['The Den'], route: 'Take the train to South Bermondsey, a few minutes from the stadium.' },
  { city: 'London', names: ['The Valley'], route: 'Take the train to Charlton, a short walk from the stadium.' },
  { city: 'London', names: ['Loftus Road'], route: 'Take the Central line to White City, or the Circle or Hammersmith & City line to Shepherd’s Bush Market.' },
  // Manchester & Liverpool
  { city: 'Manchester', names: ['Etihad Stadium'], route: 'Take the Metrolink tram to Etihad Campus, right next to the stadium.' },
  { city: 'Manchester', names: ['Old Trafford'], route: 'Take the Metrolink tram to Old Trafford, about ten minutes on foot from the stadium.' },
  { city: 'Liverpool', names: ['Anfield'], route: 'On matchdays, the Soccerbus runs from Sandhills station to Anfield. Leave plenty of time.' },
  // Birmingham
  { city: 'Birmingham', names: ['Villa Park'], route: 'Take the train to Witton or Aston, both a short walk from Villa Park.' },
  // Spain
  { city: 'Barcelona', names: ['Spotify Camp Nou', 'Camp Nou'], route: 'Take Metro Line 5 to Collblanc. Check the route before you leave and give yourself time to get through the gates.' },
  { city: 'Madrid', names: ['Santiago Bernabeu', 'Santiago Bernabéu'], route: 'Take Metro Line 10 to Santiago Bernabéu, right next to the stadium.' },
  { city: 'Madrid', names: ['Wanda Metropolitano', 'Riyadh Air Metropolitano', 'Estadio Metropolitano'], route: 'Take Metro Line 7 to Estadio Metropolitano, right by the stadium.' },
  { city: 'Sevilla', names: ['Ramon Sanchez Pizjuan', 'Ramón Sánchez-Pizjuán', 'Sanchez Pizjuan'], route: 'Take Metro Line 1 to Nervión, a short walk from the stadium.' },
  // Italy
  { city: 'Milan', names: ['Giuseppe Meazza', 'San Siro'], route: 'Take Metro line M5 (lilac) to San Siro Stadio, right by the stadium.' },
  { city: 'Rome', names: ['Stadio Olimpico'], route: 'Take tram 2 from Piazzale Flaminio to Piazza Mancini, then walk across the bridge to the stadium.' },
  // Portugal, France, Germany
  { city: 'Lisbon', names: ['Estadio da Luz', 'Estádio da Luz'], route: 'Take the Metro blue line to Colégio Militar/Luz, a short walk from the stadium.' },
  { city: 'Lisbon', names: ['Estadio Jose Alvalade', 'José Alvalade'], route: 'Take the Metro green or yellow line to Campo Grande, next to the stadium.' },
  { city: 'Paris', names: ['Parc des Princes'], route: "Take Metro line 9 to Porte de Saint-Cloud or line 10 to Porte d'Auteuil." },
  { city: 'Saint-Denis', names: ['Stade de France'], route: 'Take RER B to La Plaine–Stade de France or RER D to Stade de France–Saint-Denis.' },
  { city: 'Munich', names: ['Allianz Arena'], route: 'Take the U6 to Fröttmaning, then follow the crowd for the 15-minute walk.' },
]

const GENERAL_PHOTO = `${SITE_URL}/email/city-general.jpg`

/** Email 3 content for a city and stadium: the city's own tips when we have
 *  them, the general version otherwise. Never fails. */
export function cityGuide(city: string | null | undefined, stadium: string | null | undefined): CityGuide {
  const cityName = (city ?? '').trim()
  const stadiumName = (stadium ?? '').trim()
  const entry = cityName ? CITIES.find((c) => c.names.some((n) => sameName(n, cityName))) : undefined
  const sameCity = (r: (typeof ROUTES)[number]) =>
    sameName(r.city, cityName) || (entry?.names.some((n) => sameName(n, r.city)) ?? false)
  const route =
    stadiumName && cityName
      ? ROUTES.find((r) => sameCity(r) && r.names.some((n) => namesMatch(n, stadiumName)))
      : undefined
  const where = cityName || 'the city'
  const ground = stadiumName || 'the stadium'
  return {
    photo: entry?.photo ?? GENERAL_PHOTO,
    see: entry?.see ?? `If you have a few hours before kickoff, take a walk around ${where} and soak up the matchday atmosphere.`,
    bite: entry?.bite ?? `Eat before you head to ${ground}: queues for food at the ground can be long on matchday.`,
    route:
      route?.route ??
      `Check your route to ${ground} before you leave and give yourself time to get through the gates.`,
  }
}
