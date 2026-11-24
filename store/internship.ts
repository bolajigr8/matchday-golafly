/* Golafly Internship — static page copy and the fallback positions.

   Positions are managed in Sanity (`internshipPosition` documents). Until the
   first one is published, the pages render FALLBACK_POSITIONS below so the
   route is never empty. Copy comes from the "Golafly Internship" brief and the
   University Partner Programme document. */

export type InternshipListStyle = 'pills' | 'questions' | 'ticks'

export interface InternshipList {
  title: string
  style: InternshipListStyle
  items: string[]
}

export interface InternshipChallenge {
  question: string
  output: string
}

export interface InternshipPosition {
  slug: string
  order: number
  title: string
  summary: string
  focus: string
  overview: string
  tags: string[]
  lists: InternshipList[]
  deliverables: string[]
  challenge?: InternshipChallenge
  location?: string
  duration?: string
  workMode?: string
}

/* Shipped with the app; a brochure uploaded in Sanity replaces it. */
export const DEFAULT_BROCHURE_URL = '/internship/golafly-internship-programme.pdf'
export const BROCHURE_FILENAME = 'Golafly-Internship-Programme.pdf'
export const DEFAULT_PARTNER_EMAIL = 'contact@golafly.com'

/* Shown when a position has no value of its own. */
export const POSITION_DEFAULTS = {
  workMode: 'Project-based',
  location: 'Remote / hybrid',
  duration: 'Set with your university',
}

export type FeatureIcon =
  | 'briefcase'
  | 'search'
  | 'lightbulb'
  | 'football'
  | 'globe'
  | 'folder'
  | 'chart'
  | 'users'
  | 'award'

export interface Feature {
  icon: FeatureIcon
  title: string
  body: string
}

export const WHY_INTERN: Feature[] = [
  { icon: 'briefcase', title: 'Work on real projects', body: 'Contribute to live business challenges.' },
  { icon: 'search', title: 'Research & analyse', body: 'Study markets, competitors and customer behaviour.' },
  { icon: 'lightbulb', title: 'Build ideas', body: 'Turn your research into real product and marketing proposals.' },
  { icon: 'football', title: 'Sports + travel', body: 'Gain experience in two exciting global industries.' },
  { icon: 'globe', title: 'International experience', body: 'Work on opportunities in Europe and beyond.' },
  { icon: 'folder', title: 'Build your portfolio', body: 'Create work you can showcase in future opportunities.' },
]

export const WHAT_YOU_GAIN: Feature[] = [
  { icon: 'briefcase', title: 'Real industry experience', body: 'Work on live business projects.' },
  { icon: 'folder', title: 'Professional portfolio', body: 'Create research and marketing projects.' },
  { icon: 'chart', title: 'Business skills', body: 'Develop research, analysis and strategic thinking skills.' },
  { icon: 'globe', title: 'International exposure', body: 'Work around international travel and football markets.' },
  { icon: 'users', title: 'Mentorship', body: 'Learn from industry professionals.' },
  { icon: 'award', title: 'Certificate', body: 'Receive a Golafly internship certificate upon completion.' },
]

export const CHALLENGE_FLOW = [
  { title: 'Research', body: 'Understand the market, customer and competitors.' },
  { title: 'Analyse', body: 'Identify problems, gaps and opportunities.' },
  { title: 'Build', body: 'Develop a solution, strategy or product proposal.' },
  { title: 'Present', body: 'Share your recommendations with the Golafly team.' },
]

export const EXAMPLE_CHALLENGES: InternshipChallenge[] = [
  { question: 'How can Golafly improve its Matchday product?', output: 'Competitor review + customer journey + recommendations' },
  { question: 'What should Golafly Travel launch next?', output: 'Travel product opportunity report' },
  { question: 'How can we attract more football tourists?', output: 'Customer segments + positioning + campaign proposal' },
  { question: 'How can we onboard 100 European football academies?', output: 'Academy market map + prospect list + outreach plan' },
  { question: 'How can we create a differentiated football matchday experience?', output: 'Product improvement and monetisation proposal' },
]

/* The document's five-stage methodology, shown on each position page. */
export const INTERNSHIP_STAGES = [
  { title: 'Discover', activity: 'Learn Golafly’s products, customers and business model', output: 'Project brief & research plan' },
  { title: 'Research', activity: 'Market, customer and competitor research', output: 'Research findings' },
  { title: 'Analyse', activity: 'Interpret data and identify opportunities', output: 'Analysis & key insights' },
  { title: 'Develop', activity: 'Create recommendations, campaigns or product concepts', output: 'Proposal / strategy' },
  { title: 'Present', activity: 'Present findings to the relevant Golafly team', output: 'Final presentation & report' },
]

export const STUDENT_DISCIPLINES = [
  'Business Administration',
  'Marketing',
  'International Business',
  'Tourism & Hospitality',
  'Sports Management',
  'Economics',
  'Data Analytics',
  'Product / Technology',
  'Entrepreneurship',
  'Communications',
]

export const STUDENT_TRAITS = [
  'Curiosity',
  'Initiative',
  'Research ability',
  'Analytical thinking',
  'Communication',
  'Willingness to challenge assumptions',
]

export const UNIVERSITY_VALUE = [
  'Practical industry exposure for students',
  'Projects in contemporary sports, travel and digital business',
  'Students apply academic knowledge to real business challenges',
  'Recurring placements and collaborative projects',
]

export const PARTNERSHIP_MODEL = [
  { who: 'University', body: 'Identifies eligible students and shares internship requirements.' },
  { who: 'Golafly', body: 'Defines the track, project scope and a supervisor contact.' },
  { who: 'Student', body: 'Completes the agreed internship period and project work.' },
  { who: 'Golafly', body: 'Provides supervision, feedback and an end-of-placement evaluation.' },
  { who: 'Student', body: 'Presents a final project or report aligned with academic requirements.' },
]

export const YEAR_OF_STUDY_OPTIONS = [
  '1st year',
  '2nd year',
  '3rd year',
  'Final year',
  'Postgraduate',
  'Recent graduate',
]

export const FALLBACK_POSITIONS: InternshipPosition[] = [
  {
    slug: 'product-management',
    order: 1,
    title: 'Product Management Intern',
    tags: ['Product', 'Travel', 'Football'],
    summary:
      'Help us build better products. Work across flights, hotels, eSIM, match tickets, football camps and Golafly Academy.',
    focus: 'Improve existing Golafly products and customer journeys.',
    overview:
      'The Product Management Internship is a central part of the programme. You study how Golafly’s products are positioned, priced, marketed and experienced by customers, then develop evidence-based recommendations for improvement.',
    lists: [
      {
        title: 'Products you’ll work across',
        style: 'pills',
        items: ['Flights', 'Hotels & stays', 'eSIM', 'Match tickets / Matchday', 'Football camps', 'Golafly Academy', 'Future travel & football products'],
      },
      {
        title: 'Questions you might answer',
        style: 'questions',
        items: [
          'How does Golafly’s pricing compare with competitors and market alternatives?',
          'What bundles could increase customer value, such as flight + hotel + eSIM or football match + travel?',
          'Which customer segments should each product target?',
          'What features or services could improve the customer journey?',
          'How can football tourism create differentiated travel products?',
        ],
      },
    ],
    deliverables: ['Product research', 'Competitor analysis', 'Pricing analysis', 'Product recommendations'],
    challenge: EXAMPLE_CHALLENGES[0],
  },
  {
    slug: 'travel-product-innovation',
    order: 2,
    title: 'Travel Product & Innovation Intern',
    tags: ['Travel', 'Innovation', 'Strategy'],
    summary: 'Research the next generation of travel products for Golafly and identify new revenue opportunities.',
    focus: 'Identify new travel products and revenue opportunities.',
    overview:
      'This track answers one core question: what should Golafly Travel introduce next? You research the travel ecosystem, identify customer needs and assess each potential product on customer demand, competition, commercial opportunity, operational complexity and integration requirements.',
    lists: [
      {
        title: 'Products you might assess',
        style: 'pills',
        items: ['Airport transfers', 'Train tickets', 'Car rental', 'Travel insurance', 'Airport lounges', 'Experiences & tours', 'Group charter', 'Visa services', 'Corporate & team travel', 'Football travel packages'],
      },
    ],
    deliverables: ['Product opportunity reports', 'Market sizing research', 'Integration ideas'],
    challenge: EXAMPLE_CHALLENGES[1],
  },
  {
    slug: 'marketing-growth-analyst',
    order: 3,
    title: 'Marketing & Growth Analyst Intern',
    tags: ['Marketing', 'Analytics', 'Growth'],
    summary: 'Help us grow Golafly. Analyse markets, develop campaigns and research how to reach the right customers.',
    focus: 'Improve customer acquisition and product marketing.',
    overview: 'You analyse how Golafly can reach, engage and convert the right customers across travel and football.',
    lists: [
      {
        title: 'What you’ll work on',
        style: 'ticks',
        items: [
          'Customer and audience research',
          'Competitor marketing analysis',
          'Social media and content research',
          'SEO and digital acquisition opportunities',
          'Campaign planning',
          'Football fan and traveller behaviour research',
          'Performance analysis and growth recommendations',
        ],
      },
    ],
    deliverables: ['Campaign research', 'Audience analysis', 'Competitor review', 'Marketing plans'],
    challenge: EXAMPLE_CHALLENGES[2],
  },
  {
    slug: 'academy-partnerships',
    order: 4,
    title: 'Golafly Academy Partnerships Intern',
    tags: ['Football', 'Partnerships', 'Academy'],
    summary: 'Help us build Europe’s football academy network. Research, contact and onboard football academies.',
    focus: 'Identify and onboard football academies.',
    overview:
      'Golafly Academy is a marketplace connecting players and families with football academies and programmes. You support the supply side by researching academies and building relationships with them.',
    lists: [
      {
        title: 'What you’ll do',
        style: 'ticks',
        items: [
          'Identify academies across Europe and other target markets',
          'Research programmes, age groups, pricing, accommodation and international-player opportunities',
          'Build and maintain an academy prospect database',
          'Identify academy decision-makers',
          'Support outreach and follow-up',
          'Help academies onboard and list their information',
        ],
      },
    ],
    deliverables: ['Academy database', 'Prospect research', 'Outreach and onboarding support'],
    challenge: EXAMPLE_CHALLENGES[3],
  },
  {
    slug: 'football-partnerships',
    order: 5,
    title: 'Football Partnerships Intern',
    tags: ['Partnerships', 'Business', 'Football'],
    summary: 'Research and develop relationships with clubs, academies, tournaments, coaches and football organisations.',
    focus: 'Develop the wider football partner ecosystem.',
    overview:
      'You map the football organisations Golafly could work with, from clubs and academies to tournaments and coaches, and turn that research into concrete partnership proposals.',
    lists: [],
    deliverables: ['Club & academy research', 'Partnership prospects', 'Proposals', 'Market analysis'],
    challenge: EXAMPLE_CHALLENGES[4],
  },
  {
    slug: 'business-strategy-market-research',
    order: 6,
    title: 'Business Strategy & Market Research Intern',
    tags: ['Strategy', 'Research', 'Business'],
    summary: 'Help us answer the big questions. Research new markets, products and opportunities for Golafly.',
    focus: 'Investigate strategic opportunities across Golafly.',
    overview:
      'You work on the questions that shape where Golafly goes next: which markets to enter, which business models to test and where growth will come from.',
    lists: [],
    deliverables: ['Market reports', 'Business models', 'Expansion and growth recommendations'],
    challenge: EXAMPLE_CHALLENGES[1],
  },
]

export const formatPositionNumber = (order: number) => String(order).padStart(2, '0')
