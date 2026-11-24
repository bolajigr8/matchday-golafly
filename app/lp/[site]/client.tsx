'use client'

import { MatchHero } from '@/components/matches/match-hero'
import { HeroSection } from '@/components/home/hero-section'
import { WhyGolafly } from '@/components/matches/why-trust'
// import { TrustStrip } from '@/components/matches/why-trust' // optional extra: six small trust badges
import { LandingHeader } from '@/components/landing/landing-header'
import { ResellerBanner } from '@/components/reseller-banner'
import { LandingFixtures } from '@/components/landing/landing-fixtures'
import { LandingClubs } from '@/components/landing/landing-clubs'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingTripExtras } from '@/components/landing/landing-trip-extras'
import { LandingFaq } from '@/components/landing/landing-faq'
import { LandingFinalCta } from '@/components/landing/landing-final-cta'
import { LandingStickyCta } from '@/components/landing/landing-sticky-cta'
import { LandingFooter } from '@/components/landing/landing-footer'
import {
  LandingScopeProvider,
  useLandingScope,
} from '@/features/landing/scope'
import { siteByKey } from '@/lib/sites'

/* The landing page, one line per section.
 *
 * To drop a section, comment out its line (and, if nothing else uses it, its
 * import). To reorder, move the line. Everything below runs inside
 * <LandingScopeProvider>, which is what limits the shared pieces (the heroes,
 * the search) to this one competition.
 *
 * Address: championsleague.golafly.com  (see lib/sites.ts and proxy.ts). */

/** The /matches hero (the carousel of featured fixtures), wired to this
 *  competition. Its own search box is off: the first hero already has one.
 *  Set showSearch to true to have a second search box here. */
function MatchesHero() {
  const scope = useLandingScope()
  return (
    <MatchHero
      showSearch={false}
      onSearch={scope?.search}
      onBook={(event) => scope?.openMatch(event, 'carousel')}
    />
  )
}

export default function LandingClient({
  siteKey,
  tourId,
  tourName,
}: {
  siteKey: string
  tourId: number | null
  tourName: string
}) {
  const site = siteByKey(siteKey)
  if (!site) return null

  return (
    <LandingScopeProvider
      site={site}
      initialTourId={tourId}
      initialTourName={tourName}
    >
      {/* ── Top ───────────────────────────────────────────────────────── */}
      <ResellerBanner />  {/* "we are a ticket reseller" notice (Google Ads policy) */}
      <LandingHeader />   {/* main-site navbar, landing variant (no search, no page links) */}

      <main>
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <HeroSection />   {/* 1. the home page hero, with the search */}

        {/* ── Matches ───────────────────────────────────────────────── */}
        <LandingFixtures />   {/* all fixtures (+ search results), straight after the hero */}
        <MatchesHero />       {/* the /matches hero: "<League> tickets — Pick your match" carousel */}
        <LandingClubs />      {/* "Follow your team" → main site */}

        {/* ── Why us / how it works ─────────────────────────────────── */}
        <LandingHowItWorks />   {/* 4 steps */}
        <LandingTripExtras />   {/* flights, stays, eSIM (information only) */}
        <WhyGolafly />          {/* why book with Golafly */}
        {/* <TrustStrip /> */}
        <LandingFaq />          {/* questions from the site's own Help & FAQs */}
        <LandingFinalCta />     {/* last "Get tickets" button */}
      </main>

      {/* ── Bottom ────────────────────────────────────────────────────── */}
      <LandingFooter />        {/* legal links, contact, cookie settings */}
      <LandingStickyCta />     {/* phones only: floating "Get tickets" bar */}
    </LandingScopeProvider>
  )
}
