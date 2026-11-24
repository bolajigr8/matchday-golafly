// lib/consent.ts
//
// Single switch for cookie consent. Cookiebot is ON when a CBID is
// configured (NEXT_PUBLIC_COOKIEBOT_CBID, falling back to the Golafly main
// site's id — same account golafly-main uses). Set the env var to an empty
// string to turn Cookiebot off entirely; every consent check then returns
// true, so the site behaves exactly as it did before Cookiebot was added.

const GOLAFLY_MAIN_CBID = '9ffd8641-fd6e-4fef-8729-02e7f27c6874'

export const COOKIEBOT_CBID: string =
  process.env.NEXT_PUBLIC_COOKIEBOT_CBID ?? GOLAFLY_MAIN_CBID

export const cookiebotEnabled = COOKIEBOT_CBID.length > 0

/** Golafly's Meta (Facebook) Pixel. Public by nature: it ships in the page. */
const GOLAFLY_META_PIXEL_ID = '1109459805040284'

/* Google Analytics 4 / Google Ads: no hard-coded Google tag here. Since
   Nov 2026 golafly.com loads them through its GTM container (GTM-WSLHVTPM)
   and the landing sites through their own containers (lib/sites.ts
   gtmBootScript, loaded in app/layout.tsx behind the Consent Mode
   defaults). */

/** Meta Pixel: on by default with Golafly's id; NEXT_PUBLIC_FACEBOOK_PIXEL_ID
 *  overrides it, and "off" disables it. Loaded by
 *  components/shared/cookiebot-third-party-scripts.tsx ONLY after the
 *  visitor accepts marketing cookies in the Cookiebot banner — never
 *  before, which is why Meta's raw <script> snippet is not pasted into the
 *  page. Same init + PageView as that snippet; page views after client-side
 *  navigation are picked up by the pixel itself (it watches the URL). */
const pixelEnv = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim()
export const FACEBOOK_PIXEL_ID =
  pixelEnv === 'off' ? '' : pixelEnv || GOLAFLY_META_PIXEL_ID

export type ConsentCategory = 'preferences' | 'statistics' | 'marketing'
