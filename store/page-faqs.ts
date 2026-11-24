/* FAQs for the hub and programme pages ("money pages"), word for word from
   the SEO team's "Golafly FAQ Content for the Money Pages" (Nov 2026).
   Ticket, delivery, payment, seat and postponement answers are the ones
   /help-faqs already publishes (store/faqs.ts); programme facts come from
   the programme pages. Do not add claims that are not on the site.

   Rendered by components/shared/page-faq.tsx, which also emits the
   matching FAQPage JSON-LD, so the markup always equals the visible text.

   Intentionally NOT here (per the document): / and /help-faqs already have
   FAQs; /stays and /flights are on hold until the SEO team confirms. */

export interface PageFaq {
  q: string
  a: string
}

const AUTHENTIC: PageFaq = {
  q: 'Are match tickets guaranteed and authentic?',
  a: 'Yes — every ticket is sourced from vetted sellers. You receive a confirmed seat or package the moment your booking is paid, with the exact category and stand shown before checkout.',
}
const DELIVERY: PageFaq = {
  q: 'When will I receive my tickets?',
  a: 'Mobile and e-tickets are delivered to your account and email 3–7 days before kickoff. Where a club requires physical or collection tickets, your concierge arranges them and confirms the details in writing.',
}
const SEATS: PageFaq = {
  q: 'Can I choose where I sit?',
  a: 'For most fixtures you select the category and stand during booking. Exact seat numbers are assigned by the club closer to the match and are always within the category you paid for.',
}
const POSTPONED: PageFaq = {
  q: 'What happens if the match is rescheduled or postponed?',
  a: 'Your tickets remain valid for the new date. If you can’t attend, we’ll rebook you for an alternative fixture or refund the ticket value where the club permits.',
}

export const PAGE_FAQS = {
  '/matches': [
    {
      q: 'How do I buy football tickets on Golafly?',
      a: 'Choose a fixture on this page, then select the category and stand during booking. You can browse freely; an account is created at checkout so you can manage tickets, download e-tickets and track every booking in one place.',
    },
    AUTHENTIC,
    DELIVERY,
    SEATS,
    POSTPONED,
    {
      q: 'What payment methods do you accept?',
      a: 'All major credit and debit cards, Apple Pay and Google Pay. Bank transfer is available for hospitality and group bookings over €2,000.',
    },
  ],
  '/teams': [
    {
      q: 'How do I find tickets for my club?',
      a: 'Open your club’s page to see its upcoming fixtures with ticket prices. You can also search for a team, match or competition from the home page.',
    },
    {
      q: 'Can I book tickets, hotel and flights together?',
      a: 'Yes — the matchday builder lets you add tickets, hospitality, stays and transfers in a single checkout. You can also book tickets on their own.',
    },
    AUTHENTIC,
    DELIVERY,
    {
      q: 'Which currency am I charged in?',
      a: 'Prices display in your selected currency (EUR, GBP, USD and more). The amount shown at checkout is the amount charged — no hidden conversion fees from Golafly.',
    },
  ],
  '/tournaments': [
    {
      q: 'Which competitions can I find tickets for?',
      a: 'Golafly lists upcoming fixtures for competitions including the Premier League, Champions League, Italian Serie A, Spanish La Liga, La Liga Hypermotion, German Bundesliga, French Ligue 1, Europa League and Nations League. Open a competition to see all its upcoming matches.',
    },
    {
      q: 'Can I do a multi-match trip?',
      a: 'Absolutely. Multi-match itineraries across cities are popular during tournament windows — share your dates and we’ll build a route around the fixtures.',
    },
    AUTHENTIC,
    DELIVERY,
    POSTPONED,
  ],
  '/international': [
    {
      q: 'How do I find tickets for international matches?',
      a: 'This page lists upcoming international fixtures. Open a fixture to choose your category and stand and complete your booking.',
    },
    SEATS,
    DELIVERY,
    {
      q: 'Is my payment secure?',
      a: 'Payments are processed through PCI-DSS compliant providers with 3-D Secure authentication. Golafly never stores your full card details.',
    },
    POSTPONED,
  ],
  '/program/football-tourism': [
    {
      q: 'What does the Football Tourism programme include?',
      a: 'The programme includes professional club trial matches, international competitions, stadium tours and museums, matchday experiences and cultural football travel. Everything is managed by Golafly from start to finish.',
    },
    {
      q: 'What kinds of trips can I choose from?',
      a: 'There are three ways to take part: trials and showcase matches with professional clubs, matchday travel to major football destinations, and visits to iconic stadiums and football museums.',
    },
    {
      q: 'How many clubs and countries does Golafly work with?',
      a: 'Golafly works with 37+ partner clubs and serves 14 countries.',
    },
    {
      q: 'How do I apply?',
      a: 'Select Apply Now on this page and choose the programme you are interested in.',
    },
  ],
  '/program/player-management': [
    {
      q: 'What does Golafly player management cover?',
      a: 'It covers talent scouting, career planning, trial management and contract support, with ongoing support to build a player’s career and not just a single deal.',
    },
    {
      q: 'Where does Golafly’s club network reach?',
      a: 'Golafly is linked to clubs, scouts and agents in leading football markets across Europe and Africa, and works with 37+ partner clubs.',
    },
    {
      q: 'How quickly will Golafly reply?',
      a: 'Golafly responds within 48 hours.',
    },
    {
      q: 'How do I get started?',
      a: 'Select Get Scouted or Apply Now on this page.',
    },
  ],
  '/program/sports-marketing': [
    {
      q: 'What sports marketing services does Golafly offer?',
      a: 'Golafly offers four services: club and kit sponsorships, stadium advertising, matchday activations and digital partnerships.',
    },
    {
      q: 'What does stadium advertising include?',
      a: 'Stadium advertising includes LED perimeter boards, hospitality branding, ticket back branding and stadium naming rights.',
    },
    {
      q: 'What are matchday activations?',
      a: 'Matchday activations include fan experience zones, player appearances, VIP hospitality events and in-stadium activations at live matches.',
    },
    {
      q: 'How many countries does Golafly serve?',
      a: 'Golafly serves 14 countries.',
    },
    {
      q: 'How do I start a conversation?',
      a: 'Select Talk To Our Team on this page.',
    },
  ],
  '/tourism/trials': [
    {
      q: 'What is the Elite Football Trial Showcase?',
      a: 'It is a trial event where players perform in front of scouts from the Premier League, La Liga and Bundesliga. The showcase events take place across Europe and are designed to put players in front of professional scouts and clubs.',
    },
    {
      q: 'How do I apply for a trial?',
      a: 'Select Apply For Trials or Book Your Spot on this page.',
    },
    {
      q: 'Who organises the showcase?',
      a: 'Golafly organises the showcase events and provides professional event management.',
    },
  ],
} as const satisfies Record<string, readonly PageFaq[]>

export type PageFaqPath = keyof typeof PAGE_FAQS
