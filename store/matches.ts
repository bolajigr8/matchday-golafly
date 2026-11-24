import { IMAGES, type HeroSlide } from './matchday'
/* ============================================================
   MATCHES — "Live World-Class Football" page data
   Ported from the Golafly matchday/experiences reference (Figma 250-18225).
   ============================================================ */

/* ─── World Cup 2026 — highlighted matches ────────────────── */
export interface WcMatch {
  id: string
  home: string
  away: string
  group: string
  date: string
  kickoff: string
  venue: string
  priceFrom: number
  banner: string
}

export const WC_MATCHES: WcMatch[] = [
  {
    id: 'wc1',
    home: 'Mexico',
    away: 'South Africa',
    group: 'A',
    date: 'Jun 11, 2026',
    kickoff: '13:00 CT',
    venue: 'Estadio Azteca, Mexico City',
    priceFrom: 185,
    banner:
      'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=70',
  },
  {
    id: 'wc2',
    home: 'United States',
    away: 'Paraguay',
    group: 'D',
    date: 'Jun 12, 2026',
    kickoff: '18:00 PT',
    venue: 'SoFi Stadium, Los Angeles',
    priceFrom: 220,
    banner:
      'https://images.unsplash.com/photo-1431324155629-1a6dae1434d5?w=600&q=70',
  },
  {
    id: 'wc3',
    home: 'Brazil',
    away: 'Morocco',
    group: 'C',
    date: 'Jun 13, 2026',
    kickoff: '18:00 ET',
    venue: 'MetLife Stadium, East Rutherford',
    priceFrom: 295,
    banner:
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=70',
  },
  {
    id: 'wc4',
    home: 'Argentina',
    away: 'Algeria',
    group: 'J',
    date: 'Jun 16, 2026',
    kickoff: '20:00 CT',
    venue: 'Arrowhead Stadium, Kansas City',
    priceFrom: 340,
    banner:
      'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&q=70',
  },
  {
    id: 'wc5',
    home: 'England',
    away: 'Croatia',
    group: 'L',
    date: 'Jun 17, 2026',
    kickoff: '15:00 CT',
    venue: 'AT&T Stadium, Arlington',
    priceFrom: 310,
    banner:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=70',
  },
  {
    id: 'wc6',
    home: 'Canada',
    away: 'Qatar',
    group: 'B',
    date: 'Jun 18, 2026',
    kickoff: '15:00 PT',
    venue: 'BC Place, Vancouver',
    priceFrom: 175,
    banner:
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=70',
  },
  {
    id: 'wc7',
    home: 'Mexico',
    away: 'South Korea',
    group: 'A',
    date: 'Jun 18, 2026',
    kickoff: '19:00 CT',
    venue: 'Estadio Akron, Zapopan',
    priceFrom: 165,
    banner:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70',
  },
  {
    id: 'wc8',
    home: 'Argentina',
    away: 'Austria',
    group: 'J',
    date: 'Jun 22, 2026',
    kickoff: '12:00 CT',
    venue: 'AT&T Stadium, Arlington',
    priceFrom: 280,
    banner:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=70',
  },
  {
    id: 'wc9',
    home: 'Norway',
    away: 'France',
    group: 'I',
    date: 'Jun 26, 2026',
    kickoff: '15:00 ET',
    venue: 'Gillette Stadium, Foxborough',
    priceFrom: 250,
    banner:
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=70',
  },
  {
    id: 'wc10',
    home: 'Uruguay',
    away: 'Spain',
    group: 'F',
    date: 'Jun 26, 2026',
    kickoff: '18:00 ET',
    venue: 'MetLife Stadium, East Rutherford',
    priceFrom: 265,
    banner:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=70',
  },
]

/* ─── Club matches — top European fixtures ────────────────── */
export type MatchBadge = 'neon' | 'blue' | 'amber' | 'red' | 'grey'

export interface ClubMatch {
  id: string
  home: string
  away: string
  comp: string
  compShort: string
  badge: MatchBadge
  date: string
  venue: string
  priceFrom: number | null
  avail: number
  hot?: boolean
  soldOut?: boolean
  featured?: boolean
  img: string
}

export const CLUB_MATCHES: ClubMatch[] = [
  {
    id: 'cl1',
    home: 'Real Madrid',
    away: 'Man City',
    comp: 'Champions League',
    compShort: 'UCL',
    badge: 'neon',
    date: 'May 31, 2026',
    venue: 'Allianz Arena, Munich',
    priceFrom: 850,
    avail: 42,
    hot: true,
    featured: true,
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=70',
  },
  {
    id: 'cl2',
    home: 'Bayern Munich',
    away: 'PSG',
    comp: 'Champions League',
    compShort: 'UCL',
    badge: 'neon',
    date: 'Jun 18, 2026',
    venue: 'Allianz Arena, Munich',
    priceFrom: 620,
    avail: 35,
    hot: true,
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=70',
  },
  {
    id: 'cl3',
    home: 'Arsenal',
    away: 'Liverpool',
    comp: 'Premier League',
    compShort: 'PL',
    badge: 'blue',
    date: 'Jun 14, 2026',
    venue: 'Emirates Stadium, London',
    priceFrom: 320,
    avail: 60,
    img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&q=70',
  },
  {
    id: 'cl4',
    home: 'Barcelona',
    away: 'Atlético Madrid',
    comp: 'La Liga',
    compShort: 'LA LIGA',
    badge: 'amber',
    date: 'Jun 22, 2026',
    venue: 'Estadi Olímpic, Barcelona',
    priceFrom: 190,
    avail: 70,
    img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=70',
  },
  {
    id: 'cl5',
    home: 'Atlético',
    away: 'Villarreal',
    comp: 'Europa League Final',
    compShort: 'UEL',
    badge: 'neon',
    date: 'Jun 28, 2026',
    venue: 'Estadio Olímpico, Seville',
    priceFrom: 380,
    avail: 20,
    hot: true,
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=70',
  },
  {
    id: 'cl6',
    home: 'Juventus',
    away: 'Inter',
    comp: 'Serie A',
    compShort: 'SERIE A',
    badge: 'grey',
    date: 'Jul 3, 2026',
    venue: 'Allianz Stadium, Turin',
    priceFrom: null,
    avail: 0,
    soldOut: true,
    img: 'https://images.unsplash.com/photo-1431324155629-1a6dae1434d5?w=600&q=70',
  },
  {
    id: 'cl7',
    home: 'Chelsea',
    away: 'Tottenham',
    comp: 'Premier League Derby',
    compShort: 'PL',
    badge: 'blue',
    date: 'Jul 8, 2026',
    venue: 'Stamford Bridge, London',
    priceFrom: 210,
    avail: 80,
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=70',
  },
  {
    id: 'cl8',
    home: 'Real Madrid',
    away: 'Barcelona',
    comp: 'El Clásico · La Liga',
    compShort: 'LA LIGA',
    badge: 'amber',
    date: 'Oct 25, 2026',
    venue: 'Santiago Bernabéu, Madrid',
    priceFrom: 480,
    avail: 30,
    hot: true,
    img: 'https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600&q=70',
  },
  {
    id: 'cl9',
    home: 'Man City',
    away: 'Man United',
    comp: 'Manchester Derby · PL',
    compShort: 'PL',
    badge: 'blue',
    date: 'Nov 8, 2026',
    venue: 'Etihad Stadium, Manchester',
    priceFrom: 295,
    avail: 55,
    img: 'https://images.unsplash.com/photo-1471295253337-3ceaaad65897?w=600&q=70',
  },
  {
    id: 'cl10',
    home: 'AC Milan',
    away: 'Inter',
    comp: 'Derby della Madonnina',
    compShort: 'SERIE A',
    badge: 'amber',
    date: 'Nov 22, 2026',
    venue: 'San Siro, Milan',
    priceFrom: 240,
    avail: 48,
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=70',
  },
]

export const TOURNAMENT_FILTERS = [
  'All',
  'Champions League',
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Europa League',
] as const

/* ─── Popular teams — crests (initials + brand colours) ───── */
export interface TeamCrest {
  name: string
  abbr: string
  color: string
  bg: string
}

export const TEAMS: TeamCrest[] = [
  { name: 'Real Madrid', abbr: 'RM', color: '#FEBE10', bg: '#FFFFFF' },
  { name: 'FC Barcelona', abbr: 'FCB', color: '#A50044', bg: '#004D98' },
  { name: 'Bayern Munich', abbr: 'FCB', color: '#FFFFFF', bg: '#DC052D' },
  { name: 'Paris Saint-Germain', abbr: 'PSG', color: '#FFFFFF', bg: '#004170' },
  { name: 'Liverpool FC', abbr: 'LFC', color: '#F6EB61', bg: '#C8102E' },
  { name: 'Manchester City', abbr: 'MCI', color: '#FFFFFF', bg: '#6CABDD' },
  { name: 'Juventus', abbr: 'JUV', color: '#FFFFFF', bg: '#000000' },
  { name: 'Inter Milan', abbr: 'INT', color: '#0068A8', bg: '#000000' },
  { name: 'AC Milan', abbr: 'ACM', color: '#FFFFFF', bg: '#FB090B' },
  { name: 'Arsenal', abbr: 'ARS', color: '#FFFFFF', bg: '#EF0107' },
  { name: 'Chelsea', abbr: 'CHE', color: '#FFFFFF', bg: '#034694' },
  { name: 'Atlético Madrid', abbr: 'ATM', color: '#FFFFFF', bg: '#CE3524' },
]

/* More top clubs for the /matches "Follow your team" grid — revealed two
   rows at a time by its "Load more" button. Kept separate from TEAMS so
   nothing else that maps over TEAMS changes. */
export const MORE_TEAMS: TeamCrest[] = [
  { name: 'Manchester United', abbr: 'MUN', color: '#FBE122', bg: '#DA291C' },
  { name: 'Tottenham Hotspur', abbr: 'TOT', color: '#FFFFFF', bg: '#132257' },
  { name: 'Borussia Dortmund', abbr: 'BVB', color: '#000000', bg: '#FDE100' },
  { name: 'Napoli', abbr: 'NAP', color: '#FFFFFF', bg: '#12A0D7' },
  { name: 'AS Roma', abbr: 'ROM', color: '#F0BC42', bg: '#8E1F2F' },
  { name: 'Newcastle United', abbr: 'NEW', color: '#FFFFFF', bg: '#241F20' },
  { name: 'Aston Villa', abbr: 'AVL', color: '#95BFE5', bg: '#670E36' },
  { name: 'Benfica', abbr: 'SLB', color: '#FFFFFF', bg: '#E83030' },
  { name: 'FC Porto', abbr: 'FCP', color: '#FFFFFF', bg: '#003893' },
  { name: 'Ajax', abbr: 'AJX', color: '#FFFFFF', bg: '#D2122E' },
  { name: 'Celtic', abbr: 'CEL', color: '#FFFFFF', bg: '#018749' },
  { name: 'Galatasaray', abbr: 'GS', color: '#FDB912', bg: '#A90432' },
  { name: 'Sevilla', abbr: 'SEV', color: '#D7182A', bg: '#FFFFFF' },
  { name: 'Real Betis', abbr: 'BET', color: '#FFFFFF', bg: '#00954C' },
  { name: 'Lazio', abbr: 'LAZ', color: '#FFFFFF', bg: '#87D8F7' },
  { name: 'Bayer Leverkusen', abbr: 'B04', color: '#000000', bg: '#E32221' },
  { name: 'Marseille', abbr: 'OM', color: '#FFFFFF', bg: '#2FAEE0' },
  { name: 'West Ham United', abbr: 'WHU', color: '#1BB1E7', bg: '#7A263A' },
  { name: 'Everton', abbr: 'EVE', color: '#FFFFFF', bg: '#003399' },
  { name: 'Rangers', abbr: 'RFC', color: '#FFFFFF', bg: '#1B458F' },
  { name: 'PSV Eindhoven', abbr: 'PSV', color: '#FFFFFF', bg: '#ED1C24' },
  { name: 'Fenerbahce', abbr: 'FB', color: '#FFED00', bg: '#002D72' },
  { name: 'Sporting CP', abbr: 'SCP', color: '#FFFFFF', bg: '#008057' },
  { name: 'Athletic Bilbao', abbr: 'ATH', color: '#FFFFFF', bg: '#EE2523' },
]

/* ─── VIP experiences — rotating premium packages ─────────── */
export interface VipExperience {
  flag: string
  tag: string
  title: string
  date: string
  desc: string
  competition: string
  seating: string
  venue: string
  hospitality: string
  price: string
  img: string
}

export const VIP_EXPERIENCES: VipExperience[] = [
  {
    flag: 'DE',
    tag: 'FINAL',
    title: 'UEFA Champions League Final 2026 – VIP Hospitality',
    date: 'MAY 31, 2026',
    desc: 'The ultimate football hospitality experience. Secure your place at the pinnacle of European club football with exclusive access, premium seating, and end-to-end concierge service.',
    competition: 'Champions League',
    seating: 'Category 1 Premium',
    venue: 'Allianz Arena, Munich',
    hospitality: 'Pre & Post Match (Included)',
    price: 'From €4,500/pp',
    img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=900&q=80',
  },
  {
    flag: 'ES',
    tag: 'EL CLÁSICO',
    title: 'El Clásico VIP Hospitality – Bernabéu 2026',
    date: 'OCT 25, 2026',
    desc: 'Experience the biggest rivalry in football from premium seats. Real Madrid vs Barcelona at the Santiago Bernabéu — historic atmosphere, exclusive lounge access, gourmet catering.',
    competition: 'La Liga',
    seating: 'VIP Hospitality',
    venue: 'Santiago Bernabéu, Madrid',
    hospitality: 'Pre-match hospitality included',
    price: 'From €2,800/pp',
    img: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=900&q=80',
  },
  {
    flag: 'IT',
    tag: 'DERBY',
    title: 'Derby della Madonnina – Milan 2026',
    date: 'NOV 22, 2026',
    desc: 'Watch AC Milan vs Inter Milan in the legendary Derby della Madonnina at San Siro. Premium category seating with hospitality suite access and signature Italian dining.',
    competition: 'Serie A',
    seating: 'Category 1',
    venue: 'San Siro, Milan',
    hospitality: 'Hospitality suite access',
    price: 'From €1,500/pp',
    img: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=900&q=80',
  },
]

/* ─── Tournament crests — for the same brand-badge fallback treatment ── */
export interface TournamentCrest {
  name: string
  abbr: string
  color: string
  bg: string
}

export const TOURNAMENTS: TournamentCrest[] = [
  { name: 'Premier League', abbr: 'PL', color: '#FFFFFF', bg: '#3D195B' },
  { name: 'Champions League', abbr: 'UCL', color: '#B7965A', bg: '#0E1E5B' },
  { name: 'Italian Serie A', abbr: 'SA', color: '#FFFFFF', bg: '#008C45' },
  { name: 'German Bundesliga', abbr: 'BL', color: '#FFFFFF', bg: '#D3010C' },
  { name: 'French Ligue 1', abbr: 'L1', color: '#DAE036', bg: '#091C3E' },
  { name: 'Europa League', abbr: 'UEL', color: '#FFFFFF', bg: '#FF6600' },
  { name: 'Spanish La Liga', abbr: 'LL', color: '#FFFFFF', bg: '#FF4B44' },
  { name: 'La Liga Hypermotion', abbr: 'LL2', color: '#FFFFFF', bg: '#1E3A8A' },

  { name: 'Nations League', abbr: 'UNL', color: '#FFFFFF', bg: '#1E3888' },
]

/* ─── Why book with Golafly ───────────────────────────────── */
export const MATCH_WHY = [
  {
    k: '01',
    t: 'Trusted Representation',
    d: 'A trusted network of ticket sellers across Europe. Transparent fees — no hidden costs.',
  },
  {
    k: '02',
    t: 'Global Network',
    d: 'Direct access to hospitality programs, premium seating and travel partners in 30+ countries.',
  },
  {
    k: '03',
    t: 'End-to-end Concierge',
    d: 'Tickets, hotel, flights, eSim and on-the-ground support — all in one booking with 24/7 assistance.',
  },
] as const

/* ─── Trust strip — icon key resolves to a lucide icon in the UI ── */
export const TRUST_ITEMS = [
  {
    icon: 'shield',
    t: 'Verified Sellers',
    d: 'Every ticket checked before delivery',
  },
  {
    icon: 'star',
    t: 'Best-Seat Guarantee',
    d: 'Premium seating verified, every time',
  },
  {
    icon: 'headset',
    t: '24/7 Concierge',
    d: 'Multilingual support before & during your trip',
  },
  {
    icon: 'check',
    t: 'Verified Sellers',
    d: 'Every listing audited by Golafly',
  },
  { icon: 'lock', t: 'Secure Payment', d: 'PCI DSS · 3D Secure · Stripe' },
  {
    icon: 'bolt',
    t: 'Instant Confirmation',
    d: 'E-tickets delivered to your inbox',
  },
] as const

/* Hero quick-filter chips.
 *
 * Two kinds:
 *  - `href` — a real same-page anchor for content that isn't fixture data
 *    (today: only "#vip", which VipSection always renders statically).
 *  - `search` — resolved against the live MatchDay catalogue and turned
 *    into a /matches?... query (see components/matches/match-hero.tsx and
 *    app/matches/client.tsx). `tourName` matches a competition by name;
 *    `homeTeamName`/`awayTeamName` matches a specific fixture pairing
 *    (both together, e.g. a named derby) via GET /events' home_team_name/
 *    away_team_name filters.
 *
 * Note on the two derby-style chips: the API has no concept of nicknames
 * ("El Clásico", "Manchester Derby") — it only matches literal team names
 * (doc §03). These chips work by naming the actual two clubs; if the
 * supplier's catalogue doesn't currently list a fixture between that exact
 * pairing, the chip correctly returns zero results rather than falling
 * back to something unrelated.
 */
export interface HeroChip {
  label: string
  href?: string
  search?: { tourName?: string; homeTeamName?: string; awayTeamName?: string }
  star?: boolean
  accent?: boolean
}

export const HERO_CHIPS: HeroChip[] = [
  {
    label: 'World Cup 2026',
    search: { tourName: 'World Cup 2026' },
    star: true,
    accent: true,
  },
  { label: 'Champions League Final', search: { tourName: 'Champions League' } },
  {
    label: 'El Clásico',
    search: { homeTeamName: 'Real Madrid', awayTeamName: 'FC Barcelona' },
  },
  { label: 'VIP Hospitality', href: '#vip' },
  {
    label: 'Manchester Derby',
    search: {
      homeTeamName: 'Manchester City',
      awayTeamName: 'Manchester United',
    },
  },
]

export const COMPETITION_OPTIONS = [
  'All Competitions',
  'World Cup 2026',
  'Champions League',
  'Premier League',
  'La Liga',
  'La Liga Hypermotion',
  'Serie A',
  'Bundesliga',
] as const

/* ─── Matches page hero carousel ──────────────────────────────────
   Same slide shape and mechanics as the home hero (store/matchday.ts
   HERO_SLIDES), but every slide is about tickets. Swap images freely:
   a slide whose image fails to load falls back to the gradient. */

export const MATCH_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'tickets',
    image: IMAGES.heroPitch,
    imagePosition: '70% center',
    eyebrow: 'Live Match Tickets · Verified sellers',
    title: [{ text: 'Every match.' }, { text: 'Every ticket.', accent: true }],
    body: "Real-time fixtures and prices for the world's biggest leagues. Pick your match, choose your seats and check out in minutes.",
    primary: { label: 'Browse fixtures', href: '#matches' },
    secondary: { label: 'Popular clubs ↓', href: '#clubs' },
  },
  {
    id: 'worldcup',
    image: IMAGES.heroBgNew,
    imagePosition: 'center',
    eyebrow: 'World Cup 2026 · Champions League · Top leagues',
    title: [
      { text: 'The biggest' },
      { text: 'nights', accent: true },
      { text: 'in football' },
    ],
    body: 'From World Cup group games to Champions League finals and the Manchester Derby, find tickets for the fixtures everyone is talking about.',
    primary: { label: 'See live fixtures', href: '#matches' },
  },
  {
    id: 'vip',
    image: IMAGES.heroBg,
    imagePosition: 'center',
    eyebrow: 'VIP Hospitality · Club level · Executive boxes',
    title: [{ text: 'Best seats' }, { text: 'in the house', accent: true }],
    body: 'Padded club seats, lounge access and private boxes at the stadiums you want to visit. Compare every category before you buy.',
    primary: { label: 'View hospitality', href: '#vip' },
    secondary: { label: 'All fixtures', href: '#matches' },
  },
  {
    id: 'trip',
    image:
      'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1800&q=80',
    imagePosition: 'center',
    eyebrow: 'Tickets + Flights + Hotels + eSIM',
    title: [
      { text: 'Book the match.' },
      { text: 'Build the trip.', accent: true },
    ],
    body: 'After you choose your seats, add flights, a hotel near the stadium and a travel eSIM in the same checkout.',
    primary: { label: 'Pick a fixture', href: '#matches' },
  },
]
