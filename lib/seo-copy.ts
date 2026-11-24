// lib/seo-copy.ts
//
// Meta titles and descriptions that are generated, not typed into a page
// file: tournaments, teams, national teams and matches, plus the per-slug
// copy for blog posts and internship positions.
//
// SOURCE: the SEO brief "Golafly_Meta_Titles_Descriptions.xlsx" (Oct 2026).
// It gives one exact title and description for every crawled URL. The ~1,000
// match URLs and ~380 team URLs in it follow fixed templates that are picked
// by length, so they are generated here rather than pasted in. That way every
// team and fixture gets correct copy, not just the ones that were crawled on
// one day, and the copy stays right as fixtures come and go. Tournaments
// carry hand-written "featuring …" lines, so those 34 are a table below,
// with a generated fallback for any competition the table doesn't know.
//
// RULES THE BRIEF FOLLOWS (and every generator here keeps):
//   • title 50–60 characters, description 140–155 (Google cuts them off
//     beyond that);
//   • the brand is "Golafly" — never "Match Day" or "Matchday Builder";
//   • people search for "<club> tickets", "<league> tickets": the name
//     comes first and uses the name fans actually type (see TOURNAMENTS).
//
// HOW A GENERATOR CHOOSES: it lists its templates from richest to leanest
// and takes the first one that lands inside the length window (`pick`). If
// none does (an unusually long or short name) it takes the closest. This is
// the rule the brief's copy follows; it reproduces the brief exactly.
//
// Dependency-free apart from lib/slug and the static national-team list, so
// pages, the sitemap and checks can import it without pulling in React.

import { NATIONAL_TEAM_NAMES } from '@/features/matchday/international'
import { slugify } from '@/lib/slug'

export interface SeoCopy {
  title: string
  description: string
}

const TITLE_MIN = 50
const TITLE_MAX = 60
const DESC_MIN = 140
const DESC_MAX = 155

const has = (obj: object, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key)

/** First candidate inside [min, max]; otherwise the one closest to the
 *  window (earlier wins a tie). `candidates` must not be empty. */
function pick(candidates: string[], min: number, max: number): string {
  for (const c of candidates) if (c.length >= min && c.length <= max) return c
  let best = candidates[0]
  let bestGap = Infinity
  for (const c of candidates) {
    const gap = c.length < min ? min - c.length : c.length - max
    if (gap < bestGap) {
      best = c
      bestGap = gap
    }
  }
  return best
}

/* ── Season ────────────────────────────────────────────────────────── */

/** "2026/27" — the football season in progress. It rolls over on 1 July, so
 *  titles say "2026/27" from July 2026 to June 2027 and then change by
 *  themselves; nobody has to remember to edit ~400 pages. */
export function seasonLabel(now: Date = new Date()): string {
  const start = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1
  return `${start}/${String(start + 1).slice(-2)}`
}

/* ── Tournaments ───────────────────────────────────────────────────── */

interface TournamentEntry {
  /** The name fans search for ("Bundesliga", not "German Bundesliga"). */
  label: string
  /** {season} is replaced with seasonLabel(). */
  title: string
  description: string
}

/** Exact copy from the brief, keyed by slugify(API tournament name). */
const TOURNAMENTS: Record<string, TournamentEntry> = {
  'afc-champions-league-elite': {
    label: 'AFC Champions League Elite',
    title: 'AFC Champions League Elite Tickets {season} | Golafly',
    description:
      "Buy AFC Champions League Elite tickets for {season} matches featuring Asia's top clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'austrian-football-bundesliga': {
    label: 'Austrian Bundesliga',
    title: 'Austrian Bundesliga Tickets | Fixtures & Seats | Golafly',
    description:
      'Get Austrian Bundesliga tickets for upcoming matches. Compare verified seats and book with our 150% order guarantee. Book flights and hotels too.',
  },
  'belgian-first-division-a': {
    label: 'Belgian Pro League',
    title: 'Belgian Pro League Tickets | Fixtures & Seats | Golafly',
    description:
      'Buy Belgian Pro League tickets for {season} matches featuring Club Brugge, Anderlecht and Genk. Compare seats from verified sellers and book securely.',
  },
  'campeonato-brasileiro': {
    label: 'Brasileirão',
    title: 'Brasileirão Tickets {season} | Fixtures & Seats | Golafly',
    description:
      "Buy Brasileirão tickets for {season} matches featuring Brazil's biggest clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'carabao-cup': {
    label: 'Carabao Cup',
    title: 'Carabao Cup Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Carabao Cup tickets for {season} matches featuring English League Cup ties. Compare verified seats and book with our 150% order guarantee.',
  },
  'champions-league': {
    label: 'Champions League',
    title: 'Champions League Tickets {season} | Verified Seats | Golafly',
    description:
      "Buy Champions League tickets for {season} matches featuring Europe's biggest clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'copa-sudamericana': {
    label: 'Copa Sudamericana',
    title: 'Copa Sudamericana Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Copa Sudamericana tickets for {season} matches featuring South American club cup ties. Compare verified seats and book with our 150% order guarantee.',
  },
  'coppa-italia': {
    label: 'Coppa Italia',
    title: 'Coppa Italia Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Coppa Italia tickets for {season} fixtures, with Italian cup ties. Compare seats from verified sellers and book securely with our 150% order guarantee.',
  },
  'dfb-pokal': {
    label: 'DFB-Pokal',
    title: 'DFB-Pokal Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy DFB-Pokal tickets for {season} matches featuring German cup ties. Compare seats from verified sellers and book securely with our 150% order guarantee.',
  },
  'danish-superliga': {
    label: 'Danish Superliga',
    title: 'Danish Superliga Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Danish Superliga tickets for {season} matches featuring FC Copenhagen, Midtjylland and Brøndby. Compare seats from verified sellers and book securely.',
  },
  'efl-championship': {
    label: 'EFL Championship',
    title: 'EFL Championship Tickets {season} | Verified Seats | Golafly',
    description:
      "Buy EFL Championship tickets for {season} matches featuring England's second-tier clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'dutch-eredivisie': {
    label: 'Eredivisie',
    title: 'Eredivisie Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Eredivisie tickets for {season} matches featuring Ajax, PSV Eindhoven and Feyenoord. Compare verified seats and book with our 150% order guarantee.',
  },
  'europa-league': {
    label: 'Europa League',
    title: 'Europa League Tickets {season} | Fixtures & Seats | Golafly',
    description:
      "Buy Europa League tickets for {season} matches featuring Europe's midweek club nights. Compare verified seats and book with our 150% order guarantee.",
  },
  'europa-conference-league': {
    label: 'Conference League',
    title: 'Conference League Tickets {season} | Verified Seats | Golafly',
    description:
      "Buy Conference League tickets for {season} matches featuring Europe's third-tier club competition. Compare seats from verified sellers and book securely.",
  },
  'french-ligue-1': {
    label: 'Ligue 1',
    title: 'Ligue 1 Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Ligue 1 tickets for {season} matches featuring Paris Saint-Germain, Marseille and Lyon. Compare verified seats and book with our 150% order guarantee.',
  },
  'fa-cup': {
    label: 'FA Cup',
    title: 'FA Cup Tickets {season} | Fixtures & Verified Seats | Golafly',
    description:
      'Buy FA Cup tickets for {season} matches featuring English cup ties. Compare seats from verified sellers and book securely with our 150% order guarantee.',
  },
  'german-2bundesliga': {
    label: '2. Bundesliga',
    title: '2. Bundesliga Tickets {season} | Fixtures & Seats | Golafly',
    description:
      "Buy 2. Bundesliga tickets for {season} matches featuring Germany's second-tier clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'friendly-matches': {
    label: 'Friendly Matches',
    title: 'Friendly Matches Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Friendly Matches tickets for {season} matches featuring club and international friendlies. Compare seats from verified sellers and book securely.',
  },
  'german-bundesliga': {
    label: 'Bundesliga',
    title: 'Bundesliga Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Bundesliga tickets for {season} matches featuring Bayern Munich, Dortmund and Leverkusen. Compare verified seats and book with our 150% order guarantee.',
  },
  'italian-serie-a': {
    label: 'Serie A',
    title: 'Serie A Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Serie A tickets for {season} matches featuring Inter, AC Milan, Juventus and Napoli. Compare verified seats and book with our 150% order guarantee.',
  },
  'la-liga-hypermotion': {
    label: 'La Liga Hypermotion',
    title: 'La Liga Hypermotion Tickets | Fixtures & Seats | Golafly',
    description:
      "Buy La Liga Hypermotion tickets for {season} matches featuring Spain's second division. Compare verified seats and book with our 150% order guarantee.",
  },
  'portuguese-liga-nos': {
    label: 'Liga Portugal',
    title: 'Liga Portugal Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Liga Portugal tickets for {season} matches featuring Benfica, Porto and Sporting. Compare verified seats and book with our 150% order guarantee.',
  },
  'nations-league': {
    label: 'UEFA Nations League',
    title: 'UEFA Nations League Tickets | Fixtures & Seats | Golafly',
    description:
      'Buy UEFA Nations League tickets for {season} matches featuring national team fixtures. Compare verified seats and book with our 150% order guarantee.',
  },
  'premier-league': {
    label: 'Premier League',
    title: 'Premier League Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Premier League tickets for {season} matches featuring Arsenal, Liverpool and Manchester City. Compare seats from verified sellers and book securely.',
  },
  'saudi-pro-league': {
    label: 'Saudi Pro League',
    title: 'Saudi Pro League Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Saudi Pro League tickets for {season} matches featuring Al Hilal, Al Nassr and Al Ittihad. Compare seats from verified sellers and book securely.',
  },
  'scottish-premiership': {
    label: 'Scottish Premiership',
    title: 'Scottish Premiership Tickets | Fixtures & Seats | Golafly',
    description:
      'Buy Scottish Premiership tickets for {season} matches featuring Celtic, Rangers and Hearts. Compare verified seats and book with our 150% order guarantee.',
  },
  'spanish-la-liga': {
    label: 'La Liga',
    title: 'La Liga Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy La Liga tickets for {season} matches featuring Real Madrid, Barcelona and Atlético. Compare verified seats and book with our 150% order guarantee.',
  },
  'super-league-greece': {
    label: 'Greek Super League',
    title: 'Greek Super League Tickets | Fixtures & Seats | Golafly',
    description:
      'Buy Greek Super League tickets for {season} matches featuring Olympiacos, Panathinaikos and AEK. Compare seats from verified sellers and book securely.',
  },
  'swiss-super-league': {
    label: 'Swiss Super League',
    title: 'Swiss Super League Tickets | Fixtures & Seats | Golafly',
    description:
      "Buy Swiss Super League tickets for {season} matches featuring Switzerland's top clubs. Compare verified seats and book with our 150% order guarantee.",
  },
  'turkish-super-league': {
    label: 'Turkish Süper Lig',
    title: 'Turkish Süper Lig Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Turkish Süper Lig tickets for {season} matches featuring Galatasaray, Fenerbahçe and Beşiktaş. Compare seats from verified sellers and book securely.',
  },
  'taca-da-liga': {
    label: 'Taça da Liga',
    title: 'Taça da Liga Tickets {season} | Fixtures & Seats | Golafly',
    description:
      'Buy Taça da Liga tickets for {season} matches featuring Portuguese League Cup ties. Compare verified seats and book with our 150% order guarantee.',
  },
  'taca-de-portugal': {
    label: 'Taça de Portugal',
    title: 'Taça de Portugal Tickets {season} | Verified Seats | Golafly',
    description:
      'Buy Taça de Portugal tickets for {season} matches featuring Portuguese cup ties. Compare verified seats and book with our 150% order guarantee.',
  },
  'women-champions-league': {
    label: "Women's Champions League",
    title: "Women's Champions League Tickets {season} | Golafly MatchDay",
    description:
      "Buy Women's Champions League tickets for {season} matches featuring Europe's best women's clubs. Compare seats from verified sellers and book securely.",
  },
  'scottish-league-cup': {
    label: 'Scottish League Cup',
    title: 'Scottish League Cup Tickets | Fixtures & Seats | Golafly',
    description:
      'Buy Scottish League Cup tickets for {season} matches featuring Scottish cup ties. Compare verified seats and book with our 150% order guarantee.',
  },
}

/** Where the short name used inside match copy differs from the label. */
const MATCH_LEAGUE_NAMES: Record<string, string> = {
  'turkish-super-league': 'Süper Lig',
  'nations-league': 'Nations League',
}

/** The league as it reads inside a match title or description, or null when
 *  the fixture has no tournament. Falls back to the API's own name. */
export function matchLeagueName(tournament?: string | null): string | null {
  const name = tournament?.trim()
  if (!name) return null
  const slug = slugify(name)
  if (has(MATCH_LEAGUE_NAMES, slug)) return MATCH_LEAGUE_NAMES[slug]
  if (has(TOURNAMENTS, slug)) return TOURNAMENTS[slug].label
  return name
}

/** Title + description for /tournament/<slug>. `name` is the API's name. */
export function tournamentSeo(name: string, now?: Date): SeoCopy {
  const season = seasonLabel(now)
  const slug = slugify(name)
  if (has(TOURNAMENTS, slug)) {
    const t = TOURNAMENTS[slug]
    return {
      title: t.title.replace('{season}', season),
      description: t.description.replace('{season}', season),
    }
  }

  // A competition the brief doesn't list (new in the catalogue). Same
  // shape as the table, built from the name.
  const n = name.trim()
  const heads = [
    `Buy ${n} tickets for ${season} matches.`,
    `Buy ${n} tickets for upcoming ${season} fixtures.`,
  ]
  const bodies = [
    'Compare seats from verified sellers and book securely with our 150% order guarantee.',
    'Compare verified seats and book with our 150% order guarantee.',
    'Verified sellers, secure checkout and our 150% order guarantee.',
  ]
  const extras = ['Book flights and hotels too.', '']
  const descriptions: string[] = []
  for (const body of bodies)
    for (const head of heads)
      for (const extra of extras)
        descriptions.push([head, body, extra].filter(Boolean).join(' '))
  return { title: clubTitle(n, season), description: pick(descriptions, DESC_MIN, DESC_MAX) }
}

/* ── Teams and national teams ──────────────────────────────────────── */

/** National teams the brief lists. The app's own curated list
 *  (NATIONAL_TEAM_NAMES) is a subset of Europe, and the API has no
 *  club/national flag, so both are used — matched exactly, never loosely
 *  ("Austria" must not catch "Austria Wien"). Add a name here when a new
 *  national team appears in GET /teams. */
const NATIONAL_TEAMS = new Set(
  [
    ...[
      'Albania',
      'Andorra',
      'Armenia',
      'Austria',
      'Azerbaijan',
      'Belgium',
      'Croatia',
      'Czech Republic',
      'Denmark',
      'England',
      'Estonia',
      'Faroe Islands',
      'Finland',
      'France',
      'Georgia',
      'Germany',
      'Gibraltar',
      'Greece',
      'Hungary',
      'Iceland',
      'Ireland',
      'Israel',
      'Italy',
      'Kazakhstan',
      'Kosovo',
      'Latvia',
      'Liechtenstein',
      'Lithuania',
      'Luxembourg',
      'Moldova',
      'Netherlands',
      'North Macedonia',
      'Northern Ireland',
      'Norway',
      'Poland',
      'Portugal',
      'Romania',
      'San Marino',
      'Scotland',
      'Serbia',
      'Slovakia',
      'Slovenia',
      'Spain',
      'Switzerland',
      'Turkey',
      'Ukraine',
      'Wales',
    ],
    ...NATIONAL_TEAM_NAMES,
  ].map(slugify),
)

export function isNationalTeamName(name: string): boolean {
  return NATIONAL_TEAMS.has(slugify(name))
}

function clubTitle(n: string, season: string): string {
  return pick(
    [
      `${n} Tickets ${season} | Fixtures, Seats & Prices | Golafly`,
      `${n} Tickets ${season} | Buy Verified Seats | Golafly`,
      `${n} Tickets ${season} | Fixtures & Seats | Golafly`,
      `${n} Tickets ${season} | Buy Seats | Golafly`,
      `${n} Tickets | Fixtures & Seats | Golafly`,
      // The brief's own fallback for the longest club names.
      `${n} Tickets | Golafly MatchDay`,
      `${n} Tickets | Golafly`,
    ],
    TITLE_MIN,
    TITLE_MAX,
  )
}

/** Title + description for /team/<slug>. `name` is the API's team name. */
export function teamSeo(name: string, now?: Date): SeoCopy {
  const season = seasonLabel(now)
  const n = name.trim()

  if (isNationalTeamName(n)) {
    return {
      title: pick(
        [
          `${n} National Team Tickets ${season} | Matches | Golafly`,
          `${n} National Team Tickets | Verified Seats | Golafly`,
          `${n} National Team Tickets | Fixtures | Golafly`,
        ],
        TITLE_MIN,
        TITLE_MAX,
      ),
      description: pick(
        [
          `Buy ${n} national team tickets for upcoming internationals, qualifiers and friendlies. Verified sellers, secure checkout and our 150% order guarantee.`,
          `Buy ${n} national team tickets for upcoming internationals, qualifiers and friendlies. Compare verified seats and book with our 150% order guarantee.`,
          `Buy ${n} national team tickets for upcoming matches. Compare seats from verified sellers and book securely with our 150% order guarantee.`,
        ],
        DESC_MIN,
        DESC_MAX,
      ),
    }
  }

  return {
    title: clubTitle(n, season),
    description: pick(
      [
        `Buy ${n} tickets for every ${season} home and away fixture. Compare seats from verified sellers and book securely with our 150% order guarantee.`,
        `Buy ${n} tickets for ${season} home and away fixtures. Compare seats from verified sellers and book securely with our 150% order guarantee.`,
        `Buy ${n} tickets for every ${season} home and away fixture. Verified sellers, secure checkout and our 150% order guarantee.`,
      ],
      DESC_MIN,
      DESC_MAX,
    ),
  }
}

/* ── Matches ───────────────────────────────────────────────────────── */

export interface MatchSeoInput {
  /** Team names exactly as the API sends them. */
  home: string
  away: string
  /** The API's tournament name ("Spanish La Liga"), if the fixture has one. */
  tournament?: string | null
  venue?: string | null
  city?: string | null
  /** The fixture day (a valid Date), or null while the API has no date yet. */
  date: Date | null
  /** "17:45", or null while the kick-off time is to be confirmed. */
  kickoff: string | null
}

// Fixed English names: Intl abbreviates September as "Sept" in en-GB and
// the spelling has changed between ICU versions, so it isn't used here.
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "26 Oct 2026" */
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`

const WOMEN = /\s*\(Women\)\s*$/i

/** "Man City (Women) vs PSG (Women)" reads "Man City vs PSG Women" in a
 *  title; the description keeps the API's names. */
function titleFixture(home: string, away: string): string {
  if (WOMEN.test(home) && WOMEN.test(away))
    return `${home.replace(WOMEN, '')} vs ${away.replace(WOMEN, '')} Women`
  return `${home} vs ${away}`
}

// Closing lines, longest first: the longest one that still fits is used.
const MATCH_TAILS = [
  'Verified sellers and a 150% order guarantee.',
  'Verified seats and secure checkout.',
  'Book flights and hotels too.',
]

/** Title + description for /match/…/event/<id>. */
export function matchSeo(m: MatchSeoInput): SeoCopy {
  const league = matchLeagueName(m.tournament)
  const venue = (m.venue ?? '').trim()
  const city = (m.city ?? '').trim()
  const where = [venue, city].filter(Boolean).join(', ')

  /* Title — richest first: league + date, date, "Buy" + date, league,
     "Buy", bare, then without the word "Tickets". */
  const F = titleFixture(m.home, m.away)
  const D = m.date ? shortDate(m.date) : 'date TBC'
  const titles: string[] = []
  if (league) titles.push(`${F} Tickets | ${league} | ${D} | Golafly`)
  titles.push(`${F} Tickets | ${D} | Golafly`, `Buy ${F} Tickets | ${D} | Golafly`)
  if (league) titles.push(`${F} Tickets | ${league} | Golafly`)
  titles.push(`Buy ${F} Tickets | Golafly`, `${F} Tickets | Golafly`, `${F} | Golafly`)

  /* Description — which parts to keep is decided by length: league + venue
     + city first, then without the league, then venue without the city. */
  const fixture = `${m.home} vs ${m.away}`
  const when = m.date
    ? `on ${DAYS[m.date.getDay()]} ${shortDate(m.date)}, kick-off ${m.kickoff ?? 'time TBC'}`
    : 'on a date to be confirmed, kick-off time TBC'
  const atFull = where ? ` at ${where}` : ''
  const atVenue = venue ? ` at ${venue}` : ''
  const standard: Array<[boolean, string]> = []
  if (league) standard.push([true, atFull])
  standard.push([false, atFull], [false, atVenue])
  // Last resorts, only reached when there is little or no venue to show.
  const lastResort: Array<[boolean, string]> = []
  if (league) lastResort.push([true, atVenue], [true, ''])
  lastResort.push([false, ''])

  const build = (layouts: Array<[boolean, string]>) => {
    const out: string[] = []
    for (const [withLeague, at] of layouts)
      for (const tail of MATCH_TAILS)
        out.push(
          `Buy ${fixture} tickets${withLeague ? ` for the ${league}` : ''}${at} ${when}. ${tail}`,
        )
    return out
  }
  const descriptions = build(standard)
  // Very long fixture names: drop the kick-off and keep just the date.
  if (m.date)
    for (const tail of MATCH_TAILS)
      descriptions.push(
        `Get ${fixture} tickets for ${shortDate(m.date)}${atVenue || atFull}. ${tail}`,
      )
  descriptions.push(...build(lastResort))

  return {
    title: pick(titles, TITLE_MIN, TITLE_MAX),
    description: pick(descriptions, DESC_MIN, DESC_MAX),
  }
}

/* ── Blog posts ────────────────────────────────────────────────────── */

/** Exact copy from the brief for the posts it covers, keyed by slug. The
 *  title is the whole <title> (no " | Matchday Blog" is added). A post's own
 *  SEO Title / Meta Description in Sanity still wins over these. */
const POSTS: Record<string, SeoCopy> = {
  'ultimate-guide-to-football-tourism-in-europe-2026-edition': {
    title: 'Football Tourism in Europe: The Ultimate 2026 Guide',
    description:
      'Plan your football trip to Europe with this 2026 guide: iconic stadiums, big matches, museums and travel tips for fans, families and aspiring players.',
  },
  'how-football-agents-help-players-build-successful-careers': {
    title: 'How Football Agents Help Players Build Successful Careers',
    description:
      'Talent alone is not enough. Learn how football agents help players with contracts, club pathways and long-term career planning, and when to seek one.',
  },
  'what-is-sports-marketing-and-why-does-it-matter-in-football': {
    title: 'What Is Sports Marketing and Why It Matters in Football?',
    description:
      'Sports marketing in football explained: how sponsorship, stadium advertising and fan engagement help brands reach global audiences and grow their reach.',
  },
}

/** One line of plain text no longer than `max`, cut at a word. Used when a
 *  post has no meta description: the article intro can run to several
 *  paragraphs, and Google would index them with the line breaks. */
export function cleanDescription(
  text: string | null | undefined,
  max: number = DESC_MAX,
): string | undefined {
  const flat = text?.replace(/\s+/g, ' ').trim()
  if (!flat) return undefined
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max - 1)
  const at = cut.lastIndexOf(' ')
  const trimmed = (at > max / 2 ? cut.slice(0, at) : cut).replace(/[\s,;:.\-–—]+$/, '')
  return `${trimmed}…`
}

/** Title + description for a blog post page. Order of precedence:
 *  Sanity SEO fields → the brief's copy → the post's own title and the
 *  first line of its intro. `suffix` is "Matchday Blog" / "Travel Blog". */
export function blogPostSeo(
  post: {
    slug: string
    title: string
    seoTitle?: string | null
    metaDescription?: string | null
    featuredCaption?: string | null
    intro?: string[] | null
  },
  suffix: string,
): { title: string; description: string | undefined } {
  const brief = has(POSTS, post.slug) ? POSTS[post.slug] : null
  return {
    title: post.seoTitle?.trim() || brief?.title || `${post.title} | ${suffix}`,
    description:
      cleanDescription(post.metaDescription) ||
      brief?.description ||
      cleanDescription(post.featuredCaption || post.intro?.[0]),
  }
}

/* ── Internship positions ──────────────────────────────────────────── */

/** Exact copy from the brief, keyed by position slug. */
const POSITIONS: Record<string, SeoCopy> = {
  'product-management': {
    title: 'Product Management Internship in Travel & Football | Golafly',
    description:
      'Join Golafly as a product management intern and help build better products across flights, hotels, eSIM, match tickets, football camps and Golafly Academy.',
  },
  'travel-product-innovation': {
    title: 'Travel Product & Innovation Internship | Golafly Careers',
    description:
      'Research the next generation of travel products at Golafly and find new revenue opportunities as a travel product intern. Apply with your CV.',
  },
  'marketing-growth-analyst': {
    title: 'Marketing & Growth Analyst Internship in Football | Golafly',
    description:
      'Help Golafly grow as a marketing and growth analyst intern. Analyse markets, develop campaigns and research how to reach the right customers. Apply now.',
  },
  'academy-partnerships': {
    title: 'Football Academy Partnerships Internship | Golafly Careers',
    description:
      "Help Golafly build Europe's football academy network. Research, contact and onboard football academies as a partnerships intern. Apply with your CV today.",
  },
  'football-partnerships': {
    title: 'Football Partnerships Internship: Clubs & Academies',
    description:
      'Build relationships with clubs, academies, tournaments, coaches and football organisations as a partnerships intern at Golafly. Apply with your CV.',
  },
  'business-strategy-market-research': {
    title: 'Business Strategy & Market Research Internship | Golafly',
    description:
      'Answer the big questions as a business strategy and market research intern at Golafly. Research new markets and opportunities in football. Apply today.',
  },
}

/** The brief's copy for an internship position, or null for a position it
 *  doesn't cover (the page then builds its own from the position). */
export function positionSeo(slug: string): SeoCopy | null {
  return has(POSITIONS, slug) ? POSITIONS[slug] : null
}
