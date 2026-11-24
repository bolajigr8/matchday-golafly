/* ============================================================
   HELP & FAQs — matchday knowledge base
   Ported from the Golafly matchday/help-faqs reference.
   ============================================================ */
export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id: string;
  name: string;
  items: FaqItem[];
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "tickets",
    name: "Tickets & Booking",
    items: [
      { q: "Are match tickets guaranteed and authentic?", a: "Yes — every ticket is sourced from vetted sellers. You receive a confirmed seat or package the moment your booking is paid, with the exact category and stand shown before checkout." },
      { q: "When will I receive my tickets?", a: "Mobile and e-tickets are delivered to your account and email 3–7 days before kickoff. Where a club requires physical or collection tickets, your concierge arranges them and confirms the details in writing." },
      { q: "Can I choose where I sit?", a: "For most fixtures you select the category and stand during booking. Exact seat numbers are assigned by the club closer to the match and are always within the category you paid for." },
      { q: "Can I book tickets, hotel and flights together?", a: "Yes — the matchday builder lets you add tickets, hospitality, stays and transfers in a single checkout. You can also book tickets on their own." },
    ],
  },
  {
    id: "payments",
    name: "Payments",
    items: [
      { q: "What payment methods do you accept?", a: "All major credit and debit cards, Apple Pay and Google Pay. Bank transfer is available for hospitality and group bookings over €2,000." },
      { q: "Which currency am I charged in?", a: "Prices display in your selected currency (EUR, GBP, USD and more). The amount shown at checkout is the amount charged — no hidden conversion fees from Golafly." },
      { q: "Can I pay in instalments?", a: "Selected packages over €600 support a split-payment plan: a deposit to confirm, with the balance due 30 days before the match. Eligibility is shown at checkout." },
      { q: "Is my payment secure?", a: "Payments are processed through PCI-DSS compliant providers with 3-D Secure authentication. Golafly never stores your full card details." },
    ],
  },
  {
    id: "cancellations",
    name: "Cancellations & Refunds",
    items: [
      { q: "What is your cancellation policy?", a: "Stadium tours and flexible tickets can be changed or cancelled up to 48 hours before for a full credit. Category-1 and hospitality tickets follow the club’s terms, shown clearly before you pay." },
      { q: "What happens if the match is rescheduled or postponed?", a: "Your tickets remain valid for the new date. If you can’t attend, we’ll rebook you for an alternative fixture or refund the ticket value where the club permits." },
      { q: "How long do refunds take?", a: "Approved refunds are returned to your original payment method within 5–10 business days." },
    ],
  },
  {
    id: "travel",
    name: "Travel & Logistics",
    items: [
      { q: "Do you arrange hotels and airport transfers?", a: "Yes — add curated stays near the stadium and private or shared transfers in the builder. Our team can also tailor a full itinerary for groups." },
      { q: "Can I do a multi-match trip?", a: "Absolutely. Multi-match itineraries across cities are popular during tournament windows — share your dates and we’ll build a route around the fixtures." },
      { q: "Do you help with visas?", a: "We provide booking confirmations and invitation letters for visa applications and can advise on requirements, though visa decisions rest with the destination authorities." },
    ],
  },
  {
    id: "stadium",
    name: "At the Stadium",
    items: [
      { q: "What do I need to enter the stadium?", a: "Your mobile ticket (or a printed ticket where required) and matching photo ID for restricted fixtures. Arrive at least 60–90 minutes before kickoff to clear security." },
      { q: "What can I bring inside?", a: "Most venues prohibit large bags, professional cameras, flares and outside food. Each booking includes the specific stadium’s bag policy and prohibited-items list." },
      { q: "Are the stadiums accessible?", a: "Accessible seating and step-free routes are available at all partner venues. Add accessibility requirements during booking and your concierge will confirm arrangements." },
    ],
  },
  {
    id: "account",
    name: "Account & Support",
    items: [
      { q: "Do I need an account to book?", a: "You can browse freely; an account is created at checkout so you can manage tickets, download e-tickets and track every booking in one place." },
      { q: "Where do I find my bookings?", a: "Sign in and open “My bookings” to view confirmations, tickets and trip details, and to request changes." },
      { q: "How do I reach the team?", a: "Support is available by chat and email, with a priority WhatsApp concierge for hospitality and group bookings — typically within a few hours, faster on matchdays." },
    ],
  },
];
