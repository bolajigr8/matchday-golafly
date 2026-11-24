// lib/sites.ts
//
// Landing sites: one competition-focused page per subdomain, served by this
// same app.
//
//   championsleague.golafly.com  →  /lp/championsleague  (internal route)
//   epl.golafly.com              →  /lp/epl
//   laliga.golafly.com           →  /lp/laliga
//
// proxy.ts looks at the Host header, finds the site here, and rewrites "/" to
// the internal route. The address bar never changes. Everything that is not
// the landing page or the booking flow is sent back to the main site.
//
// ADDING A SITE = adding one row to SITES below (plus DNS for its subdomain).
//
// No imports: proxy.ts and the inline <head> script both use this file.

export interface LandingSite {
  /** The subdomain label, e.g. "championsleague". Also the /lp/<key> route. */
  key: string
  /** Shown in copy: "{name} tickets". */
  name: string
  /** Matched against GET /tournaments (features/matchday/resolve.ts
   *  pickTournament) to find this competition's tournament_id. */
  tournamentName: string
  /** CLUBS[].file keys (features/matchday/flyers.ts), in display order. They
   *  feed the hero tiles, the carousel and "Follow your team". Local flyer
   *  images are the source of truth; the ticket-API image is the fallback. */
  clubs: readonly string[]
  seoTitle: string
  seoDescription: string
  /** Google Tag Manager container for this landing site only. Loaded by
   *  gtmBootScript() below; on golafly.com only on the payment pages of a
   *  buyer who came from this landing site (instead of MAIN_GTM_ID). */
  gtmId: string
}

export const SITES: Record<string, LandingSite> = {
  championsleague: {
    key: 'championsleague',
    name: 'Champions League',
    tournamentName: 'Champions League',
    clubs: [
      'realmadrid',
      'barcelona',
      'bayern',
      'psg',
      'liverpool',
      'mancity',
      'arsenal',
      'chelsea',
      'intermilan',
      'atleticomadrid',
      'acmilan',
      'tottenham',
      'napoli',
      'dortmund',
      'juventus',
      'benfica',
      'galatasaray',
      'ajax',
      'psv',
      'sporting',
      'leverkusen',
      'porto',
    ],
    gtmId: 'GTM-PBXXMSRK',
    seoTitle: 'Champions League Tickets | Golafly Matchday',
    seoDescription:
      'Buy UEFA Champions League tickets from verified sellers, with a 150% order guarantee. Add flights, a stay and an eSIM in the same checkout.',
  },
  epl: {
    key: 'epl',
    name: 'Premier League',
    tournamentName: 'Premier League',
    clubs: [
      'arsenal',
      'mancity',
      'liverpool',
      'chelsea',
      'manutd',
      'tottenham',
      'newcastle',
      'astonvilla',
      'westham',
      'everton',
    ],
    gtmId: 'GTM-MFJFLHR4',
    seoTitle: 'Premier League Tickets | Golafly Matchday',
    seoDescription:
      'Buy Premier League tickets from verified sellers, with a 150% order guarantee. Add flights, a stay and an eSIM in the same checkout.',
  },
  laliga: {
    key: 'laliga',
    name: 'La Liga',
    tournamentName: 'La Liga',
    clubs: [
      'realmadrid',
      'barcelona',
      'atleticomadrid',
      'sevilla',
      'betis',
      'athleticbilbao',
    ],
    gtmId: 'GTM-W7QKL73L',
    seoTitle: 'La Liga Tickets | Golafly Matchday',
    seoDescription:
      'Buy La Liga tickets from verified sellers, with a 150% order guarantee. Add flights, a stay and an eSIM in the same checkout.',
  },
}

export function siteByKey(key: string | null | undefined): LandingSite | null {
  return key && Object.prototype.hasOwnProperty.call(SITES, key)
    ? SITES[key]
    : null
}

/* ── Which hostnames are landing sites ───────────────────────────────────
   A hostname is a landing site when it is <key>.<root> for one of the roots
   below. "localhost" is in the list so http://championsleague.localhost:3000
   works in development with no hosts-file edit (Chrome and Firefox resolve
   *.localhost to 127.0.0.1). Add a staging root with
   NEXT_PUBLIC_LANDING_DOMAINS="golafly.com,localhost,staging.golafly.com". */

const DEFAULT_ROOTS = 'golafly.com,localhost'

export const LANDING_ROOTS: string[] = (
  process.env.NEXT_PUBLIC_LANDING_DOMAINS || DEFAULT_ROOTS
)
  .split(',')
  .map((r) => r.trim().toLowerCase())
  .filter(Boolean)

/** The root a landing hostname belongs to, e.g. "golafly.com". */
export function rootFromHost(host: string | null | undefined): string | null {
  const hostname = (host ?? '').split(':')[0].toLowerCase()
  for (const root of LANDING_ROOTS) {
    const suffix = `.${root}`
    if (hostname.length > suffix.length && hostname.endsWith(suffix))
      return root
  }
  return null
}

/** "championsleague.golafly.com:443" → "championsleague". Anything that is not
 *  a registered landing subdomain (golafly.com, www, an unknown label) → null,
 *  so those keep behaving as the main site. */
export function siteKeyFromHost(
  host: string | null | undefined,
): string | null {
  const hostname = (host ?? '').split(':')[0].toLowerCase()
  const root = rootFromHost(host)
  if (!root) return null
  const label = hostname.slice(0, -(root.length + 1))
  return siteByKey(label) ? label : null
}

/** Pages a landing hostname serves itself. Everything else goes to the main
 *  site (proxy.ts). "/" is handled separately (it is rewritten, not passed). */
export const LANDING_OWN_PREFIXES = [
  '/builder',
  '/payment-success',
  '/payment-cancelled',
  '/cart',
] as const

export function isLandingOwnPath(pathname: string): boolean {
  return LANDING_OWN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

/** The main site's origin for a given landing host: the root domain.
 *  championsleague.golafly.com → https://golafly.com.
 *  In development (*.localhost) it is http://main.localhost on the same port,
 *  on purpose: Next turns a redirect to its own host ("localhost" or
 *  127.0.0.1) into a relative one, which on championsleague.localhost would
 *  loop back to itself. Any other *.localhost name works (browsers resolve
 *  them all to this machine) and "main" is not a landing site. */
export function mainOriginForHost(host: string | null | undefined): string {
  const root = rootFromHost(host) ?? 'golafly.com'
  if (root === 'localhost') {
    const port = (host ?? '').split(':')[1]
    return `http://main.localhost${port ? `:${port}` : ''}`
  }
  return `https://${root}`
}

/** Absolute URL on the main site, for links inside landing pages. Build-time
 *  constant so server and client render the same HTML. In development set
 *  NEXT_PUBLIC_MAIN_SITE_URL=http://localhost:3000 to stay local. */
export const MAIN_SITE_URL = (
  process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'https://golafly.com'
).replace(/\/$/, '')

export function mainUrl(path = '/'): string {
  return `${MAIN_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** The public address of a landing site, used for its canonical URL. */
export function siteOrigin(key: string): string {
  const root = (
    process.env.NEXT_PUBLIC_LANDING_PRIMARY_DOMAIN || 'golafly.com'
  ).trim()
  return `https://${key}.${root}`
}

/* ── Consent mode for landing sites ──────────────────────────────────────
   'banner' (the default, and what the main site always does):
        Cookiebot loads and Google/Meta wait for the visitor's choice.
   'open'  (testing only):
        no Cookiebot, no banner, Google/Meta start immediately.

   It is read at BUILD time from NEXT_PUBLIC_LANDING_CONSENT, and ONLY the
   exact value "open" switches it on. An unset or misspelled value is
   'banner', so a production build that forgot the variable stays compliant.
   The main site (golafly.com) ignores this entirely: the inline script below
   only ever reports 'open' for a registered landing hostname. */

export type ConsentMode = 'banner' | 'open'

export const LANDING_CONSENT: ConsentMode =
  process.env.NEXT_PUBLIC_LANDING_CONSENT === 'open' ? 'open' : 'banner'

/** Inline <head> script. Runs before Google's tag and Cookiebot and sets
 *  window.__GF_SITE = { key, consent } from location.hostname, in the browser,
 *  so the page HTML can stay static (no per-request header reads) and still
 *  differ per hostname. */
export function siteBootScript(): string {
  const cfg = {
    keys: Object.keys(SITES),
    roots: LANDING_ROOTS,
    consent: LANDING_CONSENT,
  }
  return (
    `(function(){var s={key:null,consent:'banner'};try{var c=${JSON.stringify(cfg)};` +
    `var h=location.hostname.toLowerCase();` +
    `for(var i=0;i<c.roots.length;i++){var x='.'+c.roots[i];` +
    `if(h.length>x.length&&h.slice(-x.length)===x){var l=h.slice(0,-x.length);` +
    `if(c.keys.indexOf(l)>-1){s={key:l,consent:c.consent};break}}}` +
    // golafly.com payment page, buyer sent back by Stripe from a landing page
    // that ran in 'open' mode: carry that policy for this page only.
    `if(!s.key&&c.consent==='open'&&location.pathname.indexOf('/payment-')===0){` +
    `var k=document.cookie.split(';');for(var j=0;j<k.length;j++){var t=k[j].trim();` +
    `if(t.indexOf('gf_lp=')===0){var p=decodeURIComponent(t.slice(6)).split('.');` +
    `if(p[1]==='open'&&c.keys.indexOf(p[0])>-1)s.carry='open'}}}}catch(e){}` +
    `window.__GF_SITE=s;})();`
  )
}

/** Google Tag Manager container for golafly.com (all pages). GA4 now runs
 *  inside it, so the old hard-coded gtag.js tag was removed (SEO, Nov 2026). */
export const MAIN_GTM_ID = 'GTM-WSLHVTPM'

/** Inline <head> script: loads the ONE Google Tag Manager container for this
 *  page. Must come after siteBootScript() (reads window.__GF_SITE) and after
 *  the Consent Mode v2 defaults in app/layout.tsx, so GTM starts with
 *  everything "denied" until the visitor's Cookiebot choice.
 *
 *   • golafly.com → MAIN_GTM_ID (same behaviour as SEO's standard snippet).
 *   • a landing hostname → that site's own container (unchanged; SEO: the
 *     subdomains stay as they are for now).
 *   • golafly.com /payment-* for a buyer whose booking began on a landing
 *     site → that landing site's container INSTEAD of the main one. Stripe
 *     always returns buyers to golafly.com/payment-success, and that is where
 *     the purchase is reported (lib/analytics.ts trackPurchase) with the
 *     landing site's Google Ads conversion. Both containers carry the same
 *     GA4 property, so loading both would count the sale twice. The landing
 *     site comes from the gf_lp cookie (lib/landing-return.ts), which is
 *     deleted once the sale is reported.
 *
 *  Only one container is ever loaded, so nothing is counted twice. */
export function gtmBootScript(): string {
  const ids: Record<string, string> = {}
  for (const k of Object.keys(SITES)) ids[k] = SITES[k].gtmId
  return (
    `(function(){try{var m=${JSON.stringify(ids)};var s=window.__GF_SITE;` +
    `var key=s&&s.key;` +
    `if(!key&&location.pathname.indexOf('/payment-')===0){` +
    `var k=document.cookie.split(';');for(var j=0;j<k.length;j++){var t=k[j].trim();` +
    `if(t.indexOf('gf_lp=')===0){key=decodeURIComponent(t.slice(6)).split('.')[0];break}}}` +
    `var id=(key&&Object.prototype.hasOwnProperty.call(m,key)&&m[key])||` +
    `(s&&s.key?'':${JSON.stringify(MAIN_GTM_ID)});if(!id)return;` +
    `window.dataLayer=window.dataLayer||[];` +
    `window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});` +
    `var j=document.createElement('script');j.async=true;j.id='gtm-script';` +
    `j.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(id);` +
    `var f=document.getElementsByTagName('script')[0];` +
    `if(f&&f.parentNode)f.parentNode.insertBefore(j,f);else document.head.appendChild(j)}catch(e){}})();`
  )
}
