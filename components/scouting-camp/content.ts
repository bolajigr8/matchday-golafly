/* Golafly Scouting Camp — everything the landing page says, in one place.
 *
 * The client's design had placeholders ([City], €[000], testimonials, logos…).
 * Anything left `null` or empty here is simply not shown, and a section with
 * nothing to show is left out — so the page never displays a bracket. Fill
 * these in as the client confirms them; the layout needs no changes. */

export type CampDay = { date: string; title: string; body: string }
export type CampStory = { quote: string; name: string; meta: string }
export type CampStat = { value: string; label: string }

export const CAMP = {
  name: 'Golafly Scouting Camp',
  /* Dates drive the eyebrow, the facts strip, the countdown and the final CTA. */
  dates: '10–19 Jan 2027',
  startsOn: '2027-01-10',
  startsLabel: '10 Jan',
  datesLong: '10–19 January 2027',
  days: 10,

  whatsapp: '447466398696',
  email: 'contact@golafly.com',
  phoneDisplay: '+44 7466 398696',
  company: 'Golafly Ltd',
  companyAddress: null as string | null, // "[Registered address · Company no.]"

  legal: {
    privacy: 'https://www.golafly.com/legal/privacy',
    terms: 'https://www.golafly.com/legal/terms',
    refund: 'https://www.golafly.com/legal/refund',
  },

  /* ── Unknown until the client confirms — null hides it. ── */
  city: 'Barcelona, Spain' as string | null,
  ageGroup: null as string | null, // "[16–23]"
  places: null as number | null, // "[60]"
  placesTaken: null as number | null, // "[41]" — drives the seats bar
  fee: null as string | null, // "€[000]"
  feeNotes: [] as string[], // deposit, balance due, refund line
  scoutsCount: null as string | null, // "[XX]"
  registrationCloses: null as string | null, // "[31 Oct 2026]"
  replyWithin: '24 hours',

  /* The three audiences from the client's plan. `body` is shown once written.
     The copy below (audiences, programme, included, FAQ answers) is a draft
     that only says what the page already promises — the client still has to
     sign it off. */
  audiences: [
    {
      tag: 'Players',
      title: 'Ambitious players',
      body: 'For players who train seriously and want to be judged on what they do on the pitch. All positions are welcome.',
    },
    {
      tag: 'Parents',
      title: 'Parents & guardians',
      body: 'Under-18s register with a parent or guardian’s details, and our team answers your questions on WhatsApp before you commit.',
    },
    {
      tag: 'Academies & coaches',
      title: 'Academies sending players',
      body: 'Sending more than one player? Message us on WhatsApp and we’ll help you register your group together.',
    },
  ] as { tag: string; title: string; body: string | null }[],
  programme: [
    {
      date: '10–11 Jan',
      title: 'Arrival & assessment',
      body: 'Check in, meet the coaches and go through the first assessment sessions.',
    },
    { date: '12–14 Jan', title: 'Training', body: 'Coached sessions that get you sharp and ready for the matches.' },
    { date: '15–18 Jan', title: 'Scouting matches', body: 'Full matches, played in front of the scouts.' },
    { date: '19 Jan', title: 'Feedback & next steps', body: 'Hear how you did and what to work on next.' },
  ] as CampDay[],
  /* What the Barcelona camp package includes (from the Golafly Scouting Camp
     programme on golafly.com). */
  included: [
    'Shared accommodation for players',
    'Airport transfers',
    'Daily transport to training and matches',
    'Breakfast, lunch and dinner',
    'Official Golafly training/match jersey',
    'Professional training sessions',
    'Friendly matches against Spanish clubs',
    'Individual scouting report and feedback',
  ] as string[],
  /* Partner clubs, with their crests (public/scouting-camp/clubs). A club
     with `src: null` shows as its name only. */
  logos: [
    { name: 'CE Sabadell', src: '/scouting-camp/clubs/ce-sabadell.png' },
    { name: 'UE Cornellà', src: '/scouting-camp/clubs/ue-cornella.png' },
    { name: 'CE L’Hospitalet', src: '/scouting-camp/clubs/ce-hospitalet.png' },
  ] as { name: string; src: string | null }[],
  stats: [] as CampStat[],
  /* Testimonial video from the Barcelona camp. */
  videoSrc: 'https://res.cloudinary.com/dthjf19xd/video/upload/v1787027084/programs/media/3/testimonial/8vg70KPj5b0qLlYyIssLBpBvYRbyVku91RE1YY8C.mp4' as string | null,

  /* Where players stay — photos from the Barcelona camp's gallery. */
  stay: {
    place: 'Cal Ramon, Rubí (Barcelona)',
    points: [
      'Players stay together in a shared house',
      'Breakfast, lunch and dinner included',
      'Airport transfers on arrival and departure',
      'Daily transport to training and matches',
    ],
    photos: [
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438318/programs/media/3/gallery/VpFAdMq6JUkS3geKvN21s64inZAvdSzcNfajdFMl.jpg', alt: 'Pool and terrace at the camp house' },
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438313/programs/media/3/gallery/AgQlhDkVMn7CJOGRtQACAsQDpW8XR4Rsgmrg9WuI.jpg', alt: 'Bedroom' },
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438315/programs/media/3/gallery/zcpBy6ZLm7ZO5jcgPwzU0zaTXFok0sUzubVoLufe.jpg', alt: 'Dining room and kitchen' },
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438312/programs/media/3/gallery/pS5isDKRMEAp1sU7vfA4NPMTQAJqEcQMNkqB1WZu.jpg', alt: 'Twin bedroom' },
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438315/programs/media/3/gallery/5xj0AdmAfdWRsolmXPC0UCGyf7oLgmg54FJMV2NA.jpg', alt: 'Living room' },
      { src: 'https://res.cloudinary.com/dthjf19xd/image/upload/v1779438318/programs/media/3/gallery/Ld4MBhgVlnIxjBBGYz38xqEYVPt5LSSHN1Yt2cii.jpg', alt: 'Sun terrace' },
    ],
  } as { place: string | null; points: string[]; photos: { src: string; alt: string }[] },
  stories: [] as CampStory[],

  faq: [
    // Answers come from the client; a question without an answer is hidden.
    {
      q: 'Who can apply?',
      a: 'The camp is open to players in all positions. If you’re under 18, a parent or guardian registers with you. Not sure it’s right for you? Ask us on WhatsApp.',
    },
    {
      q: 'What happens after I register?',
      a: 'Our team replies on WhatsApp within 24 hours with the next steps. You pay nothing when you register.',
    },
    { q: 'Do you help with visas and travel?', a: null },
    {
      q: 'Where do players stay?',
      a: 'Players stay together in a shared house in Rubí, near Barcelona. Breakfast, lunch and dinner are included, along with airport transfers and daily transport to training and matches.',
    },
    { q: 'How does payment work?', a: null },
    { q: 'What if I can’t attend?', a: null },
    {
      q: 'What should I bring?',
      a: 'Boots, shin pads, training kit and a valid ID or passport. We send the full list on WhatsApp after you register.',
    },
  ] as { q: string; a: string | null }[],
}

/* Positions offered in the form; the label is what HubSpot receives. */
export const POSITIONS = [
  { code: 'GK', label: 'Goalkeeper' },
  { code: 'RB', label: 'Right Back' },
  { code: 'CB', label: 'Centre Back' },
  { code: 'LB', label: 'Left Back' },
  { code: 'CDM', label: 'Defensive Midfielder' },
  { code: 'CM', label: 'Central Midfielder' },
  { code: 'CAM', label: 'Attacking Midfielder' },
  { code: 'RW', label: 'Right Winger' },
  { code: 'LW', label: 'Left Winger' },
  { code: 'SS', label: 'Second Striker' },
  { code: 'CF', label: 'Centre Forward' },
]

export const whatsappHref = (text?: string) =>
  `https://wa.me/${CAMP.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
