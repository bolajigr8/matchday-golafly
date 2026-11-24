import type { Metadata, Viewport } from 'next'
// import { Inter, Space_Grotesk, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import localFont from 'next/font/local'
import { SITE_URL } from '@/lib/seo'

import { ConditionalHeader } from '@/components/conditional-header'
import { ThemeProvider } from '@/components/theme-provider'
import { ConditionalFooter } from '@/components/conditional-footer'
import { GoogleTranslateProvider } from '@/components/google-translate'
import { Providers } from '@/components/providers'
import CookiebotThirdPartyScripts from '@/components/shared/cookiebot-third-party-scripts'
import { CookiebotLoader } from '@/components/shared/cookiebot-loader'
import { gtmBootScript, MAIN_GTM_ID, siteBootScript } from '@/lib/sites'
import ExitIntentPopup from '@/components/shared/exit-intent-popup'
import { ScrollToTop } from '@/components/shared/scroll-to-top'
import { VipThemeClass } from '@/components/vip/vip-theme-class'
import { vipThemeBootScript } from '@/features/vip/routes'
import { PillarIntro } from '@/components/brand/pillar-intro'
import { bootScript as pillarIntroBootScript } from '@/lib/pillar-intro'
import { COOKIEBOT_CBID, cookiebotEnabled } from '@/lib/consent'

import './globals.css'

/* Fonts are bundled locally (app/fonts) so builds never depend on
   Google Fonts being reachable from the build server. Variable font
   files: one file covers every weight. */
const spaceGrotesk = localFont({
  src: './fonts/space-grotesk-latin-wght-normal.woff2',
  variable: '--font-heading',
  weight: '300 700',
  display: 'swap',
})

const inter = localFont({
  src: './fonts/inter-latin-wght-normal.woff2',
  variable: '--font-sans',
  weight: '100 900',
  display: 'swap',
})

const jetbrainsMono = localFont({
  src: './fonts/jetbrains-mono-latin-wght-normal.woff2',
  variable: '--font-mono',
  weight: '100 800',
  display: 'swap',
})

/* Condensed display face — ticket date numerals, directory titles, hero. */
const bebasNeue = localFont({
  src: './fonts/bebas-neue-latin-400-normal.woff2',
  variable: '--font-display',
  weight: '400',
  display: 'swap',
})

// Icons and the share image come from the file conventions in app/
// (favicon.ico, icon.png, apple-icon.png, opengraph-image.jpg).
// metadataBase makes the share image URL absolute.
export const metadata: Metadata = {
  // Makes every page's relative canonical absolute on SITE_URL.
  // Deliberately NO `alternates` here: children would inherit it and the
  // 404 page would get a canonical (lib/seo.ts).
  metadataBase: new URL(SITE_URL),
  // Default for any page that doesn't set its own; the homepage repeats it
  // explicitly (app/page.tsx).
  title: 'Football Tickets, Flights & Hotels for Matchday | Golafly',
  description:
    "Buy football match tickets, flights, hotels and an eSIM in one checkout. Verified sellers and a 150% order guarantee for Europe's biggest matches.",
  applicationName: 'Golafly Matchday',
  // iOS "Add to Home Screen": opens full-screen with this name. The manifest
  // (app/manifest.ts) covers Android and desktop.
  appleWebApp: {
    capable: true,
    title: 'Matchday',
    statusBarStyle: 'default',
  },
  // Google Search Console ownership for golafly.com, carried over from the
  // old site (golafly-main/app/layout.tsx). Matchday now serves
  // golafly.com, so without these the property would lose its verification.
  verification: {
    google: [
      'pjqUrMpoicx8CF-etvwTVlyTlssgRCTr3HJa06mYlZ0',
      '7L7qSvLzBXyAmqVYkhbxKyvhgEHlKjk2_coKsJA5n4g',
    ],
  },
  openGraph: {
    siteName: 'Golafly Matchday',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

// Colours the browser bar / task switcher; matches the manifest's theme_color.
export const viewport: Viewport = {
  themeColor: '#050606',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <head>
        {/*
         * Which site is this? Sets window.__GF_SITE = { key, consent } from the
         * hostname (lib/sites.ts). key is null on golafly.com and consent is
         * then always 'banner', so the main site is unaffected. Landing
         * hostnames (championsleague.golafly.com …) get their own key, and
         * 'open' only if the build was made with
         * NEXT_PUBLIC_LANDING_CONSENT=open (testing). Must run before the
         * consent default and Cookiebot below.
         */}
        <script
          id='gf-site-boot'
          dangerouslySetInnerHTML={{ __html: siteBootScript() }}
        />
        {/* Hides the pillar intro before first paint when this section was
            already seen this visit, or motion is reduced (lib/pillar-intro.ts). */}
        {/* VIP pages: turns the site's lime into VIP gold before first paint
            (app/globals.css html.vip-theme). */}
        <script
          id='vip-theme-boot'
          dangerouslySetInnerHTML={{ __html: vipThemeBootScript() }}
        />
        <script
          id='gf-intro-boot'
          dangerouslySetInnerHTML={{ __html: pillarIntroBootScript() }}
        />
        {/*
         * Google Consent Mode v2 default — must be in dataLayer before
         * Cookiebot and before any Google tag, or Google assumes "granted".
         * Everything starts denied until a real Cookiebot decision.
         * (Ported from golafly-main/app/layout.tsx.)
         */}
        {/*
         * Force EXPLICIT consent for every visitor.
         *
         * The banner was showing for a moment and then closing on its own
         * because the Cookiebot account (shared with Golafly) uses
         * "implied consent" for some regions, e.g. outside the EU: the
         * first scroll, swipe or link tap is treated as "accept" and the
         * dialog closes. On phones the first swipe happens almost at once,
         * so it looked like the banner just vanished.
         *
         * Cookiebot's documented override: when its dialog initialises or
         * displays, switch it to 'strict' (explicit) and remove its scroll
         * listener. The banner then stays until the visitor clicks a
         * button. Registered in <head> so it's in place before uc.js runs.
         */}
        {cookiebotEnabled && (
          <script
            id='cookiebot-explicit-consent'
            dangerouslySetInnerHTML={{
              __html: `(function(){function s(){var d=window.Cookiebot&&window.Cookiebot.dialog;if(!d)return;d.consentLevel='strict';if(typeof d.detachOnscrollEvent==='function')d.detachOnscrollEvent();}window.addEventListener('CookiebotOnDialogInit',s);window.addEventListener('CookiebotOnDialogDisplay',s);})();`,
            }}
          />
        )}
        {cookiebotEnabled && (
          <script
            id='google-consent-default'
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}var g=window.__GF_SITE;var v=(g&&((g.key&&g.consent==='open')||g.carry==='open'))?'granted':'denied';var c={ad_storage:v,ad_user_data:v,ad_personalization:v,analytics_storage:v};if(v==='denied')c.wait_for_update=500;gtag('consent','default',c);`,
            }}
          />
        )}
        {/*
         * Google Tag Manager (SEO, Nov 2026): golafly.com loads GTM-WSLHVTPM
         * on every page; GA4 runs inside that container (the hard-coded
         * gtag.js tag was removed so page views aren't counted twice). The
         * landing sites (championsleague / epl / laliga .golafly.com) keep
         * their own containers. Exactly one container per page: see
         * gtmBootScript() in lib/sites.ts. As high as possible in <head>,
         * but after the site detection and the Consent Mode defaults above,
         * which must reach dataLayer before any Google tag.
         */}
        <script
          id='gtm-container'
          dangerouslySetInnerHTML={{ __html: gtmBootScript() }}
        />
      </head>
      <body className='min-h-full flex flex-col bg-background text-foreground'>
        {/* Google Tag Manager (noscript): only for visitors without JavaScript. */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${MAIN_GTM_ID}`}
            height='0'
            width='0'
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/*
         * Cookiebot loads AFTER React has hydrated the page.
         *
         * It used to be a synchronous <script> in <head> with
         * data-blockingmode='auto'. That made the banner flash and vanish
         * (worst on mobile): Cookiebot injected its dialog into <body>
         * while the page was still hydrating, and when React then
         * reconciled <body> (any hydration mismatch makes React re-render
         * the document from scratch) it removed the dialog nodes it did
         * not create. Slow phones hydrate later, so the banner was
         * usually already on screen when it got wiped. Auto-blocking also
         * rewrites/intercepts Next's own scripts, which is a known source
         * of those hydration errors in the first place.
         *
         * 'manual' blocking is safe here because nothing on Matchday
         * relies on auto-blocking: the Facebook Pixel, Google Translate
         * and video embeds are gated on Cookiebot consent in code
         * (cookiebot-third-party-scripts.tsx, google-translate.tsx,
         * cookiebot-iframe.tsx), and the Google tags in <head> run behind
         * the Consent Mode defaults, so they start as "denied".
         */}
        {cookiebotEnabled && <CookiebotLoader cbid={COOKIEBOT_CBID} />}
        <CookiebotThirdPartyScripts />
        <Providers>
          <ThemeProvider
            attribute='class'
            defaultTheme='light'
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalHeader />

            <GoogleTranslateProvider />

            <div className='flex flex-1 flex-col'>{children}</div>

            <ConditionalFooter />

            <ExitIntentPopup />

            <ScrollToTop />

            <VipThemeClass />

            {/* PLAY IT / LIVE IT / TRAVEL FOR IT opener, chosen by route */}
            <PillarIntro />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
