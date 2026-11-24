// lib/golafly-schema.tsx
//
// JSON-LD (schema.org) builders for golafly.com — Appendix A of the
// "Schema Markup Implementation Plan" (SEO team, Oct 2026), adapted to this
// project: the host comes from lib/seo.ts, types are strict (no `any`).
//
// Rules built in (section 3 of the plan):
//   • one <script type="application/ld+json"> per page, one @graph;
//   • Organization + WebSite on every page, referenced by stable @id;
//   • empty / null / undefined values are dropped — never guessed;
//   • "<" is escaped so page text can never close the <script> tag;
//   • no rating/review markup, no organizer, no hotel markup, no SearchAction;
//   • SportsEvent only when date + venue + city exist (Google requires them).
//
// Render <JsonLd data={…}/> from a SERVER component so the script is in the
// raw HTML (view-source), not added after hydration.

import { SITE_URL } from '@/lib/seo'

export const SITE = SITE_URL

/* ── 1) Brand facts ───────────────────────────────────────────────────────
 * Confirmed by the SEO team (Google Business Profile): legal name, phone,
 * Barcelona address. NOT confirmed yet: logo, email, sameAs — they stay empty
 * and are therefore omitted from the output. See SEO-SCHEMA-NOTES.md for the
 * values found on the site that are waiting for written confirmation. */
export const BRAND = {
  name: 'Golafly',
  legalName: 'GOLAFLY LTD',
  telephone: '+34667068018',
  streetAddress: 'Carrer de Cal Cisó 69',
  postalCode: '08038',
  addressLocality: 'Barcelona',
  addressCountry: 'ES',
  /** CONFIRM: full https URL of a square logo, at least 112×112 px. */
  logoUrl: '',
  /** CONFIRM: the support email (the footer shows contact@golafly.com). */
  email: '',
  /** CONFIRM: only real profile URLs (Google Business Profile, Trustpilot, socials). */
  sameAs: [] as string[],
}

/* ── 2) Helpers ─────────────────────────────────────────────────────────── */

type JsonValue = string | number | boolean | null | undefined | JsonValue[] | Json
export type Json = { [key: string]: JsonValue }

/** Removes undefined, null, "" and empty arrays/objects, recursively. */
export function clean(v: JsonValue): JsonValue {
  if (Array.isArray(v)) {
    const a = v.map(clean).filter((x) => x !== undefined)
    return a.length ? a : undefined
  }
  if (v && typeof v === 'object') {
    const o: Json = {}
    for (const [k, val] of Object.entries(v)) {
      const c = clean(val)
      if (c !== undefined) o[k] = c
    }
    return Object.keys(o).length ? o : undefined
  }
  if (v === undefined || v === null || v === '') return undefined
  return v
}

/** Absolute canonical URL for a path — same rules as lib/seo.ts canonical(). */
export const url = (path: string) => {
  const p = path.split(/[?#]/)[0]
  return p === '/' || p === '' ? `${SITE}/` : `${SITE}${p.replace(/\/+$/, '')}`
}
const ID = (path: string, frag: string) => `${url(path)}#${frag}`
export const ORG_ID = `${SITE}/#organization`
export const SITE_ID = `${SITE}/#website`

/** Safe JSON string for <script type="application/ld+json">. */
export function serialize(data: Json): string {
  return JSON.stringify(clean(data) ?? {}).replace(/</g, '\\u003c')
}

/** Local kick-off → ISO 8601. date "YYYY-MM-DD", time "HH:MM". With a time
 *  zone the UTC offset is added; without one the local time is returned. */
export function isoStart(
  date?: string | null,
  time?: string | null,
  timeZone?: string,
): string | undefined {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return undefined
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return date
  if (!timeZone) return `${date}T${time}:00`
  try {
    const offsetAt = (ms: number): string => {
      const part =
        new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
          .formatToParts(new Date(ms))
          .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
      return part === 'GMT' ? '+00:00' : part.replace('GMT', '')
    }
    const toMin = (o: string) =>
      (o[0] === '-' ? -1 : 1) * (parseInt(o.slice(1, 3), 10) * 60 + parseInt(o.slice(4, 6), 10))
    const [y, m, d] = date.split('-').map(Number)
    const [h, mi] = time.split(':').map(Number)
    const guess = Date.UTC(y, m - 1, d, h, mi)
    const utc = guess - toMin(offsetAt(guess)) * 60000
    return `${date}T${time}:00${offsetAt(utc)}`
  } catch {
    return `${date}T${time}:00`
  }
}

/** IANA time zone by ISO country code, when the venue time zone is not stored.
 *  Single-time-zone countries only: a country with several zones (Brazil,
 *  USA, Mexico, Russia, Canada, Australia …) is left out on purpose, and its
 *  kick-off is then written without an offset rather than with a wrong one. */
export const TZ_BY_COUNTRY: Record<string, string> = {
  GB: 'Europe/London', IE: 'Europe/Dublin', ES: 'Europe/Madrid', PT: 'Europe/Lisbon',
  FR: 'Europe/Paris', DE: 'Europe/Berlin', IT: 'Europe/Rome', NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels', CH: 'Europe/Zurich', AT: 'Europe/Vienna', DK: 'Europe/Copenhagen',
  NO: 'Europe/Oslo', SE: 'Europe/Stockholm', PL: 'Europe/Warsaw', CZ: 'Europe/Prague',
  SK: 'Europe/Bratislava', HU: 'Europe/Budapest', RO: 'Europe/Bucharest', GR: 'Europe/Athens',
  TR: 'Europe/Istanbul', UA: 'Europe/Kyiv', HR: 'Europe/Zagreb', RS: 'Europe/Belgrade',
  SI: 'Europe/Ljubljana', FI: 'Europe/Helsinki', EE: 'Europe/Tallinn', LV: 'Europe/Riga',
  LT: 'Europe/Vilnius', LU: 'Europe/Luxembourg', IS: 'Atlantic/Reykjavik', SA: 'Asia/Riyadh',
  QA: 'Asia/Qatar', AE: 'Asia/Dubai',
  // Added Nov 2026 (SEO brief, Task 6): countries in the fixture list that
  // had no zone, plus the rest of Europe and nearby football countries.
  MC: 'Europe/Monaco', BG: 'Europe/Sofia', AL: 'Europe/Tirane', ME: 'Europe/Podgorica',
  SM: 'Europe/San_Marino', AM: 'Asia/Yerevan', MD: 'Europe/Chisinau', AD: 'Europe/Andorra',
  LI: 'Europe/Vaduz', XK: 'Europe/Belgrade', GE: 'Asia/Tbilisi', FO: 'Atlantic/Faroe',
  KZ: 'Asia/Almaty', GI: 'Europe/Gibraltar', MK: 'Europe/Skopje', AZ: 'Asia/Baku',
  CY: 'Asia/Nicosia', MT: 'Europe/Malta', BY: 'Europe/Minsk', BA: 'Europe/Sarajevo',
  IL: 'Asia/Jerusalem', MA: 'Africa/Casablanca', EG: 'Africa/Cairo', KW: 'Asia/Kuwait',
  BH: 'Asia/Bahrain', OM: 'Asia/Muscat', JO: 'Asia/Amman', NG: 'Africa/Lagos',
  ZA: 'Africa/Johannesburg', JP: 'Asia/Tokyo', KR: 'Asia/Seoul', CN: 'Asia/Shanghai',
  AR: 'America/Argentina/Buenos_Aires', UY: 'America/Montevideo', CL: 'America/Santiago',
  CO: 'America/Bogota', PE: 'America/Lima',
}

/* ── 3) Sitewide nodes + page wrapper ───────────────────────────────────── */

export function organizationNode(): Json {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: BRAND.name,
    legalName: BRAND.legalName,
    url: url('/'),
    logo: BRAND.logoUrl ? { '@type': 'ImageObject', url: BRAND.logoUrl } : undefined,
    telephone: BRAND.telephone,
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.streetAddress,
      postalCode: BRAND.postalCode,
      addressLocality: BRAND.addressLocality,
      addressCountry: BRAND.addressCountry,
    },
    sameAs: BRAND.sameAs,
  }
}

export function websiteNode(): Json {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: url('/'),
    name: BRAND.name,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  }
}

/** Organization + WebSite + the page's own nodes, in one @graph. */
export function graph(...nodes: (Json | undefined | null)[]): Json {
  return {
    '@context': 'https://schema.org',
    '@graph': [organizationNode(), websiteNode(), ...nodes.filter((n): n is Json => !!n)],
  }
}

export interface Crumb {
  name: string
  /** Omit on the last crumb (the current page). */
  path?: string
}

export function breadcrumbNode(pagePath: string, crumbs: Crumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    '@id': ID(pagePath, 'breadcrumb'),
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.path ? url(c.path) : undefined,
    })),
  }
}

export interface PageInfo {
  path: string
  metaTitle: string
  metaDescription?: string
}

type PageType = 'WebPage' | 'CollectionPage' | 'AboutPage' | 'ContactPage'

export function webPageNode(p: PageInfo, type: PageType = 'WebPage', extra: Json = {}, hasBreadcrumb = true): Json {
  return {
    '@type': type,
    '@id': ID(p.path, 'webpage'),
    url: url(p.path),
    name: p.metaTitle,
    description: p.metaDescription,
    inLanguage: 'en',
    isPartOf: { '@id': SITE_ID },
    breadcrumb: hasBreadcrumb ? { '@id': ID(p.path, 'breadcrumb') } : undefined,
    ...extra,
  }
}

export interface ListEntry {
  path: string
  name: string
}

export function itemListNode(pagePath: string, frag: string, name: string | undefined, items: ListEntry[]): Json | undefined {
  if (!items.length) return undefined // never an empty ItemList
  return {
    '@type': 'ItemList',
    '@id': ID(pagePath, frag),
    name,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: url(it.path),
      name: it.name,
    })),
  }
}

/* ── 4) Page builders ───────────────────────────────────────────────────── */

/** HOME "/" — no breadcrumb. */
export function homeSchema(p: { metaTitle: string; metaDescription?: string }): Json {
  return graph(webPageNode({ path: '/', ...p }, 'WebPage', { about: { '@id': ORG_ID } }, false))
}

/** MATCH /match/[league]/[slug]/event/[id] */
export interface MatchSchemaInput {
  path: string
  metaTitle: string
  metaDescription?: string
  home: string
  away: string
  /** Only when /team/<slug> exists. */
  homeSlug?: string
  awaySlug?: string
  venue?: string
  city?: string
  /** Google needs a street address for event rich results — pass it when known. */
  street?: string
  postalCode?: string
  /** ISO 3166-1 alpha-2. */
  countryCode?: string
  timeZone?: string
  /** "YYYY-MM-DD" or null when TBC. */
  date?: string | null
  /** "HH:MM" or null when TBC. */
  timeLocal?: string | null
  status?: 'scheduled' | 'postponed' | 'cancelled' | 'rescheduled'
  /** Lowest price shown on the page. */
  price?: number | null
  currency?: string | null
  soldOut?: boolean
  leagueName?: string
  /** Only when /tournament/<slug> exists. */
  leagueSlug?: string
  image?: string | null
  now?: Date
}

export function matchSchema(m: MatchSchemaInput): Json {
  const name = `${m.home} vs ${m.away}`
  const tz = m.timeZone ?? (m.countryCode ? TZ_BY_COUNTRY[m.countryCode] : undefined)
  const start = isoStart(m.date, m.timeLocal, tz)
  const status = m.status ?? 'scheduled'
  const today = (m.now ?? new Date()).toISOString().slice(0, 10)
  const isPast = !!m.date && /^\d{4}-\d{2}-\d{2}$/.test(m.date) && m.date < today
  const canEvent = !!start && !!m.venue && !!m.city

  const priceStr = m.price == null || !Number.isFinite(Number(m.price)) ? undefined : Number(m.price).toFixed(2)
  const offers: Json | undefined =
    priceStr && m.currency && !isPast && status !== 'cancelled'
      ? {
          '@type': 'Offer',
          url: url(m.path),
          price: priceStr,
          priceCurrency: m.currency,
          availability: m.soldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        }
      : undefined

  const event: Json | undefined = canEvent
    ? {
        '@type': 'SportsEvent',
        '@id': ID(m.path, 'event'),
        name,
        sport: 'Soccer',
        startDate: start,
        eventStatus:
          status === 'postponed'
            ? 'https://schema.org/EventPostponed'
            : status === 'cancelled'
              ? 'https://schema.org/EventCancelled'
              : status === 'rescheduled'
                ? 'https://schema.org/EventRescheduled'
                : 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
          '@type': 'Place',
          name: m.venue,
          address: {
            '@type': 'PostalAddress',
            streetAddress: m.street,
            postalCode: m.postalCode,
            addressLocality: m.city,
            addressCountry: m.countryCode,
          },
        },
        homeTeam: { '@type': 'SportsTeam', name: m.home, url: m.homeSlug ? url(`/team/${m.homeSlug}`) : undefined },
        awayTeam: { '@type': 'SportsTeam', name: m.away, url: m.awaySlug ? url(`/team/${m.awaySlug}`) : undefined },
        url: url(m.path),
        image: m.image ?? undefined,
        offers,
      }
    : undefined

  const crumbs: Crumb[] = [
    { name: 'Home', path: '/' },
    { name: 'Matches', path: '/matches' },
  ]
  if (m.leagueName && m.leagueSlug) crumbs.push({ name: m.leagueName, path: `/tournament/${m.leagueSlug}` })
  crumbs.push({ name })

  return graph(
    webPageNode(m, 'WebPage', { mainEntity: event ? { '@id': ID(m.path, 'event') } : undefined }),
    event,
    breadcrumbNode(m.path, crumbs),
  )
}

/** Page with WebPage + breadcrumb only (match page whose event couldn't be read). */
export function matchFallbackSchema(p: PageInfo & { name: string }): Json {
  return graph(
    webPageNode(p, 'WebPage'),
    breadcrumbNode(p.path, [{ name: 'Home', path: '/' }, { name: 'Matches', path: '/matches' }, { name: p.name }]),
  )
}

/** TEAM /team/[slug] (clubs and national teams). */
export function teamSchema(t: {
  slug: string
  name: string
  metaTitle: string
  metaDescription?: string
  parent?: Crumb
  matches: ListEntry[]
}): Json {
  const path = `/team/${t.slug}`
  const parent: Crumb = t.parent ?? { name: 'Teams', path: '/teams' }
  return graph(
    webPageNode({ path, metaTitle: t.metaTitle, metaDescription: t.metaDescription }, 'CollectionPage', {
      about: { '@id': ID(path, 'team') },
      mainEntity: t.matches.length ? { '@id': ID(path, 'matches') } : undefined,
    }),
    { '@type': 'SportsTeam', '@id': ID(path, 'team'), name: t.name, sport: 'Soccer', url: url(path) },
    itemListNode(path, 'matches', `Upcoming ${t.name} matches`, t.matches),
    breadcrumbNode(path, [{ name: 'Home', path: '/' }, parent, { name: t.name }]),
  )
}

/** TOURNAMENT /tournament/[slug] — never an Event (a season isn't one event). */
export function tournamentSchema(t: {
  slug: string
  name: string
  metaTitle: string
  metaDescription?: string
  matches: ListEntry[]
}): Json {
  const path = `/tournament/${t.slug}`
  return graph(
    webPageNode({ path, metaTitle: t.metaTitle, metaDescription: t.metaDescription }, 'CollectionPage', {
      mainEntity: t.matches.length ? { '@id': ID(path, 'matches') } : undefined,
    }),
    itemListNode(path, 'matches', `${t.name} matches`, t.matches),
    breadcrumbNode(path, [{ name: 'Home', path: '/' }, { name: 'Tournaments', path: '/tournaments' }, { name: t.name }]),
  )
}

/** LISTING HUBS /matches /tournaments /teams /international */
export function hubSchema(h: {
  path: '/matches' | '/tournaments' | '/teams' | '/international'
  name: string
  metaTitle: string
  metaDescription?: string
  items: ListEntry[]
}): Json {
  return graph(
    webPageNode(h, 'CollectionPage', { mainEntity: h.items.length ? { '@id': ID(h.path, 'list') } : undefined }),
    itemListNode(h.path, 'list', h.name, h.items),
    breadcrumbNode(h.path, [{ name: 'Home', path: '/' }, { name: h.name }]),
  )
}

/** BLOG POST — path is the post's CANONICAL path. */
export function blogPostSchema(b: {
  path: string
  indexPath: '/blog' | '/travel/blog'
  indexName: string
  metaTitle: string
  metaDescription?: string
  headline: string
  datePublished?: string
  dateModified?: string
  authorName?: string
  image?: string
}): Json {
  return graph(
    webPageNode(b, 'WebPage', { mainEntity: { '@id': ID(b.path, 'article') } }),
    {
      '@type': 'BlogPosting',
      '@id': ID(b.path, 'article'),
      mainEntityOfPage: { '@id': ID(b.path, 'webpage') },
      headline: b.headline,
      description: b.metaDescription,
      image: b.image,
      datePublished: b.datePublished,
      dateModified: b.dateModified,
      author: b.authorName ? { '@type': 'Person', name: b.authorName } : { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      inLanguage: 'en',
    },
    breadcrumbNode(b.path, [{ name: 'Home', path: '/' }, { name: b.indexName, path: b.indexPath }, { name: b.headline }]),
  )
}

/** BLOG INDEX /blog /travel/blog */
export function blogIndexSchema(b: {
  path: '/blog' | '/travel/blog'
  name: string
  metaTitle: string
  metaDescription?: string
  posts: ListEntry[]
}): Json {
  return graph(
    webPageNode(b, 'CollectionPage', {
      about: { '@id': ID(b.path, 'blog') },
      mainEntity: b.posts.length ? { '@id': ID(b.path, 'list') } : undefined,
    }),
    { '@type': 'Blog', '@id': ID(b.path, 'blog'), url: url(b.path), name: b.name, publisher: { '@id': ORG_ID } },
    itemListNode(b.path, 'list', undefined, b.posts),
    breadcrumbNode(b.path, [{ name: 'Home', path: '/' }, { name: b.name }]),
  )
}

/** SERVICE /program/* and /tourism/trials */
export function serviceSchema(s: {
  path: string
  serviceName: string
  metaTitle: string
  metaDescription?: string
  description?: string
}): Json {
  return graph(
    webPageNode(s, 'WebPage', { mainEntity: { '@id': ID(s.path, 'service') } }),
    {
      '@type': 'Service',
      '@id': ID(s.path, 'service'),
      name: s.serviceName,
      description: s.description ?? s.metaDescription,
      url: url(s.path),
      provider: { '@id': ORG_ID },
    },
    breadcrumbNode(s.path, [{ name: 'Home', path: '/' }, { name: s.serviceName }]),
  )
}

/** /about (AboutPage), /support (ContactPage), everything else plain WebPage. */
export function simplePageSchema(p: {
  path: string
  pageName: string
  metaTitle: string
  metaDescription?: string
  type?: 'WebPage' | 'AboutPage' | 'ContactPage'
  parent?: Crumb
}): Json {
  const t = p.type ?? 'WebPage'
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }]
  if (p.parent) crumbs.push(p.parent)
  crumbs.push({ name: p.pageName })
  return graph(webPageNode(p, t, t === 'WebPage' ? {} : { about: { '@id': ORG_ID } }), breadcrumbNode(p.path, crumbs))
}

/** /help-faqs — questions and answers word for word as on the page. */
export function faqSchema(f: {
  path: string
  pageName: string
  metaTitle: string
  metaDescription?: string
  faqs: { q: string; a: string }[]
}): Json {
  return graph(
    webPageNode(f, 'WebPage', { mainEntity: f.faqs.length ? { '@id': ID(f.path, 'faq') } : undefined }),
    f.faqs.length
      ? {
          '@type': 'FAQPage',
          '@id': ID(f.path, 'faq'),
          mainEntity: f.faqs.map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        }
      : undefined,
    breadcrumbNode(f.path, [{ name: 'Home', path: '/' }, { name: f.pageName }]),
  )
}

/** FAQ block on a hub / programme page (components/shared/page-faq.tsx).
 *  Its own script next to the page's main schema: a FAQPage that points at
 *  the page's WebPage node (same @id, so Google joins the two). The text is
 *  exactly the visible text. */
export function pageFaqSchema(path: string, faqs: readonly { q: string; a: string }[]): Json | null {
  if (!faqs.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': ID(path, 'faq'),
    url: url(path),
    isPartOf: { '@id': ID(path, 'webpage') },
    mainEntity: faqs.map((x) => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a },
    })),
  }
}

/* ── 5) Component (server component) ────────────────────────────────────── */

export function JsonLd({ data }: { data: Json }) {
  return <script type='application/ld+json' dangerouslySetInnerHTML={{ __html: serialize(data) }} />
}
