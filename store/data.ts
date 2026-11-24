import type { SocialIconKey } from '@/components/social-icons'
import { GOLAFLY_PROGRAMS } from '@/store/ecosystem'

/* ─── Social links ────────────────────────────────────────────── */
export interface SocialLink {
  name: SocialIconKey
  href: string
}

export const SOCIAL_LINKS: SocialLink[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/golafly/' },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61586686345297',
  },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/68992893' },
  { name: 'Twitter', href: 'https://x.com/golafly?s=20' },
  { name: 'TikTok', href: 'https://www.tiktok.com/@golafly' },
  { name: 'WhatsApp', href: 'https://wa.me/447466398696' },
]

/* ─── Navbar links ────────────────────────────────────────────── */
export interface NavChild {
  label: string
  /** Static destination — used as-is. Omit this and set `matchdayFilter`
   *  instead for tournament/team links, whose real id has to be resolved
   *  from the live GET /tournaments or GET /teams catalogue at render time
   *  (see components/navbar.tsx) rather than hardcoded here. */
  href?: string
  /** Resolved by the navbar to `/tournament/<id>` or `/team/<id>` by
   *  matching `name` against the real MatchDay catalogue. `name` is the display name we know today — the
   *  supplier's exact catalogue spelling may differ slightly, which is why
   *  the lookup in features/matchday/resolve.ts is forgiving about it. */
  matchdayFilter?: { type: 'tournament' | 'team'; name: string }
  /** Column heading inside a dropdown. Columns render in the order their
   *  first child appears. 'National teams' is also what tells the navbar to
   *  match the team name exactly ("England" ≠ "New England Revolution"). */
  group?: NavGroup
  /** Render in the dropdown's footer row as an "All …" link. */
  cta?: boolean
  /** Hide this link when its matchdayFilter isn't in today's catalogue
   *  (instead of falling back to a directory page). */
  hideIfMissing?: boolean
  star?: boolean // neon star prefix (e.g. World Cup 2026)
  badge?: string // small pill badge (e.g. "NEW")
}

export type NavGroup =
  | 'Club competitions'
  | 'International'
  | 'Clubs'
  | 'National teams'

export interface NavItem {
  label: string
  href?: string // present for plain links; omitted for pure dropdowns
  /** Other route prefixes that mark this item as the current section
   *  (e.g. /team/123 lights up "Teams"). `href` always counts. */
  activePrefixes?: string[]
  /** Keep Google Translate off the label. "Matches" comes out as
   *  "Allumettes" (matchsticks) in French. */
  noTranslate?: boolean
  /** Renders as the gold VIP Hospitality pill (Figma "Nav · VIP"). */
  vip?: boolean
  /** Desktop: shown in the top Golafly bar (EcosystemBar) instead of the
   *  main navbar, to give the navbar room. Phones keep it in the menu. */
  topBar?: boolean
  children?: NavChild[] // present → renders a dropdown
}

const INTERNATIONAL_COMPETITIONS = [
  'Nations League',
  'World Cup',
  'European Championship',
  'World Cup Qualifiers',
  'Friendlies',
]

const NATIONAL_TEAMS = [
  'Croatia',
  'Czech Republic',
  'Denmark',
  'England',
  'France',
  'Germany',
  'Italy',
  'Netherlands',
  'Norway',
  'Portugal',
  'Spain',
  'Wales',
]

/* Main navigation. Company programmes and the Scouting Camp are not here on purpose:
   they live in the Golafly family bar above the navbar, the mobile menu and
   the footer (store/ecosystem.ts). */
export const NAV_LINKS: NavItem[] = [
  { label: 'Matches', href: '/matches', activePrefixes: ['/match'], noTranslate: true },
  {
    label: 'Competitions',
    href: '/tournaments',
    activePrefixes: ['/tournament', '/international'],
    children: [
      {
        label: 'UEFA Champions League',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'Champions League' },
      },
      {
        label: 'Premier League',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'Premier League' },
      },
      {
        label: 'La Liga',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'La Liga' },
      },
      {
        label: 'La Liga Hypermotion',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'La Liga Hypermotion' },
      },
      {
        label: 'Serie A',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'Serie A' },
      },
      {
        label: 'Bundesliga',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'Bundesliga' },
      },
      {
        label: 'Europa League',
        group: 'Club competitions',
        matchdayFilter: { type: 'tournament', name: 'Europa League' },
      },
      ...INTERNATIONAL_COMPETITIONS.map(
        (name): NavChild => ({
          label: name,
          group: 'International',
          hideIfMissing: true,
          matchdayFilter: { type: 'tournament', name },
        }),
      ),
      { label: 'All competitions', href: '/tournaments', cta: true },
      { label: 'International hub', href: '/international', cta: true },
    ],
  },
  {
    label: 'Teams',
    href: '/teams',
    activePrefixes: ['/team'],
    children: [
      {
        label: 'Real Madrid',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Real Madrid' },
      },
      {
        label: 'FC Barcelona',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'FC Barcelona' },
      },
      {
        label: 'Bayern Munich',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Bayern Munich' },
      },
      {
        label: 'Paris Saint-Germain',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Paris Saint-Germain' },
      },
      {
        label: 'Liverpool FC',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Liverpool' },
      },
      {
        label: 'Manchester City',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Manchester City' },
      },
      {
        label: 'Juventus',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Juventus' },
      },
      {
        label: 'Inter Milan',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Inter Milan' },
      },
      {
        label: 'AC Milan',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'AC Milan' },
      },
      {
        label: 'Arsenal',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Arsenal' },
      },
      {
        label: 'Chelsea',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Chelsea' },
      },
      {
        label: 'Atlético Madrid',
        group: 'Clubs',
        matchdayFilter: { type: 'team', name: 'Atletico Madrid' },
      },
      ...NATIONAL_TEAMS.map(
        (name): NavChild => ({
          label: name,
          group: 'National teams',
          hideIfMissing: true,
          matchdayFilter: { type: 'team', name },
        }),
      ),
      { label: 'All teams', href: '/teams', cta: true },
    ],
  },
  /* Company: just the three Golafly programmes. They come from
     GOLAFLY_PROGRAMS, the same list the footer renders, so the two can't
     drift apart. Clicking the "Company" label itself opens /about; program
     pages light the item up via activePrefixes. */
  {
    label: 'Company',
    href: '/about',
    activePrefixes: ['/program'],
    children: GOLAFLY_PROGRAMS.map(
      (p): NavChild => ({ label: p.label, href: p.href }),
    ),
  },
  { label: 'Help', href: '/help-faqs', topBar: true },
  /* VIP Hospitality (premium). Figma: "Header → Nav · VIP" (397:2682). */
  { label: 'VIP', href: '/vip', vip: true },
]

/* ─── Offices ─────────────────────────────────────────────────── */
export const OFFICES = [
  {
    city: 'London',
    lines: ['128 City Road · EC1V 2NX', 'United Kingdom'],
  },
  {
    city: 'Barcelona',
    lines: ['C/ Cal Ciso 69 · 08038', 'Spain'],
  },
] as const

/* ─── Contact ─────────────────────────────────────────────────── */
export const CONTACT = {
  email: 'contact@golafly.com',
  /** Same line as Golafly Travel and the Scouting Camp. */
  phone: '+44 7466 398696',
  whatsapp: 'https://wa.me/447466398696',
} as const

/* ─── Brand ───────────────────────────────────────────────────── */
export const BRAND = {
  name: 'Golafly',
  tagline:
    'Global football development, tourism, and sports marketing. Connecting talent, brands, and fans to real opportunities worldwide.',
  legal: '© 2026 Golafly Ltd. All rights reserved.',
  badges: ['FIFA Licensed', 'Ethical Representation', 'Transparent Fees'],
} as const
