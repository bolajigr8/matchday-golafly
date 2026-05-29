/* ─── User ────────────────────────────────────────────────────── */
export const DASHBOARD_USER = {
  name: 'Adewale',
  lastName: 'Adeyemi',
  fullName: 'Adewale O.',
  email: 'adewale@email.com',
  phone: '+234 812 345 6789',
  location: 'Lagos, Nigeria',
  memberSince: 'May 2024',
  points: 1250,
  level: 'Bronze Fan',
  nextLevel: 'Silver Fan',
  pointsToNext: 750,
  totalPointsForNext: 2000,
  matchesAttended: 7,
  rewardsRedeemed: 3,
  co2Offset: '12.4',
} as const

/* ─── Matches ─────────────────────────────────────────────────── */
export const NEXT_MATCH = {
  id: 'match-001',
  team1: 'FC Barcelona',
  team1Code: 'FCB',
  team1Primary: '#004D98',
  team2: 'Real Madrid',
  team2Code: 'RMA',
  team2Primary: '#FEBE10',
  date: 'Sat, 25 May 2024',
  time: '8:00 PM WAT',
  venue: 'Spotify Camp Nou',
  city: 'Barcelona, Spain',
  league: 'La Liga',
  countdownDays: '03',
  countdownHrs: '14',
  countdownMins: '32',
} as const

/* ─── Tickets ─────────────────────────────────────────────────── */
export type TicketStatus = 'CONFIRMED' | 'PAST' | 'CANCELLED'

export interface DashboardTicket {
  id: string
  ticketId: string
  team1: string
  team1Code: string
  team1Color: string
  team2: string
  team2Code: string
  team2Color: string
  date: string
  time: string
  venue: string
  city: string
  seat: string
  gate: string
  status: TicketStatus
  league: string
}

export const DASHBOARD_TICKETS: DashboardTicket[] = [
  {
    id: 'ticket-001',
    ticketId: 'MDG-25MAY-8F9K',
    team1: 'FC Barcelona',
    team1Code: 'FCB',
    team1Color: '#004D98',
    team2: 'Real Madrid',
    team2Code: 'RMA',
    team2Color: '#FEBE10',
    date: 'SAT, 25 MAY 2024',
    time: '8:00 PM',
    venue: 'Spotify Camp Nou',
    city: 'Barcelona, Spain',
    seat: 'Block 122, Row 12, Seat 15',
    gate: 'Gate 5',
    status: 'CONFIRMED',
    league: 'La Liga',
  },
  {
    id: 'ticket-002',
    ticketId: 'MDG-02JUN-3K7L',
    team1: 'Manchester City',
    team1Code: 'MCI',
    team1Color: '#6CABDD',
    team2: 'Manchester United',
    team2Code: 'MUN',
    team2Color: '#DA291C',
    date: 'SUN, 02 JUN 2024',
    time: '7:00 PM',
    venue: 'Etihad Stadium',
    city: 'Manchester, UK',
    seat: 'Block 105, Row 18, Seat 8',
    gate: 'Gate 2',
    status: 'CONFIRMED',
    league: 'Premier League',
  },
  {
    id: 'ticket-003',
    ticketId: 'MDG-15JUN-9A2D',
    team1: 'AC Milan',
    team1Code: 'ACM',
    team1Color: '#C4122F',
    team2: 'Juventus',
    team2Code: 'JUV',
    team2Color: '#FFFFFF',
    date: 'SAT, 15 JUN 2024',
    time: '5:30 PM',
    venue: 'San Siro Stadium',
    city: 'Milan, Italy',
    seat: 'Block 214, Row 7, Seat 20',
    gate: 'Gate 11',
    status: 'CONFIRMED',
    league: 'Serie A',
  },
]

/* ─── Inbox ───────────────────────────────────────────────────── */
export type MessageType =
  | 'ticket'
  | 'flight'
  | 'hotel'
  | 'esim'
  | 'info'
  | 'reward'
  | 'payment'
  | 'welcome'

export interface InboxMessage {
  id: string
  type: MessageType
  title: string
  preview: string
  time: string
  date: string
  unread: boolean
  category: 'Tickets' | 'Travel' | 'Announcements' | 'Rewards'
}

export const INBOX_MESSAGES: InboxMessage[] = [
  {
    id: 'msg-001',
    type: 'ticket',
    title: 'Your ticket is ready! 🎟️',
    preview:
      'Your FC Barcelona vs Real Madrid ticket is now available. View your QR code and match details.',
    time: '10:30 AM',
    date: '10 May 2024',
    unread: true,
    category: 'Tickets',
  },
  {
    id: 'msg-002',
    type: 'flight',
    title: 'Flight check-in reminder ✈️',
    preview: 'Online check-in for your flight to Barcelona opens in 24 hours.',
    time: 'Yesterday',
    date: '9 May 2024',
    unread: true,
    category: 'Travel',
  },
  {
    id: 'msg-003',
    type: 'hotel',
    title: 'Hotel booking confirmed 🏨',
    preview:
      'Your stay at Hotel Arts Barcelona is confirmed. Check-in details inside.',
    time: '2 days ago',
    date: '8 May 2024',
    unread: false,
    category: 'Travel',
  },
  {
    id: 'msg-004',
    type: 'esim',
    title: 'eSIM is ready to install 📱',
    preview:
      'Your Spain eSIM is ready. Install now and stay connected on your trip.',
    time: '3 days ago',
    date: '7 May 2024',
    unread: false,
    category: 'Travel',
  },
  {
    id: 'msg-005',
    type: 'info',
    title: 'Matchday Guide — Barcelona',
    preview:
      'Everything you need to know for matchday. Stadium info, transport, and more.',
    time: '4 days ago',
    date: '6 May 2024',
    unread: false,
    category: 'Announcements',
  },
  {
    id: 'msg-006',
    type: 'reward',
    title: 'Reward unlocked! ⭐',
    preview:
      'You earned 250 points for your last purchase. See what you can redeem!',
    time: '5 days ago',
    date: '5 May 2024',
    unread: false,
    category: 'Rewards',
  },
  {
    id: 'msg-007',
    type: 'payment',
    title: 'Payment successful ✅',
    preview: 'Your payment for flight to Barcelona was successful.',
    time: '1 week ago',
    date: '4 May 2024',
    unread: false,
    category: 'Tickets',
  },
  {
    id: 'msg-008',
    type: 'welcome',
    title: 'Welcome to Matchday! 👋',
    preview:
      'Thanks for joining! Start exploring exclusive deals and matchday experiences.',
    time: '1 week ago',
    date: '3 May 2024',
    unread: false,
    category: 'Announcements',
  },
]

/* ─── Transactions ────────────────────────────────────────────── */
export type TxnType = 'ticket' | 'flight' | 'hotel' | 'esim' | 'transfer'

export const TRANSACTIONS = [
  {
    id: 'txn-001',
    type: 'ticket' as TxnType,
    title: 'FC Barcelona vs Real Madrid',
    subtitle: 'Ticket · Order #MDG-7842',
    date: '10 May 2024',
    time: '10:30 AM',
    amount: 250.0,
    category: 'Tickets',
  },
  {
    id: 'txn-002',
    type: 'flight' as TxnType,
    title: 'Lagos (LOS) → Barcelona (BCN)',
    subtitle: 'Flight · Booking #FLY-9821',
    date: '27 Apr 2024',
    time: '08:15 AM',
    amount: 645.0,
    category: 'Travel',
  },
  {
    id: 'txn-003',
    type: 'hotel' as TxnType,
    title: 'Hotel Arts Barcelona',
    subtitle: '24 – 27 May 2024 · 3 Nights',
    date: '23 Apr 2024',
    time: '03:42 PM',
    amount: 420.0,
    category: 'Stay',
  },
  {
    id: 'txn-004',
    type: 'esim' as TxnType,
    title: 'Spain eSIM 10GB',
    subtitle: 'eSIM · Order #ESIM-7723',
    date: '21 Apr 2024',
    time: '11:20 AM',
    amount: 15.0,
    category: 'Other',
  },
  {
    id: 'txn-005',
    type: 'transfer' as TxnType,
    title: 'Airport Transfer',
    subtitle: 'Barcelona Airport → Hotel',
    date: '21 Apr 2024',
    time: '10:05 AM',
    amount: 35.5,
    category: 'Other',
  },
]

/* ─── Rewards ─────────────────────────────────────────────────── */
export const EARN_WAYS = [
  {
    id: 'attend',
    label: 'Attend a match',
    points: 100,
    unit: 'Per match attended',
  },
  { id: 'flight', label: 'Book a flight', points: 150, unit: 'Per booking' },
  { id: 'hotel', label: 'Book a hotel', points: 100, unit: 'Per booking' },
  { id: 'esim', label: 'Buy an eSIM', points: 50, unit: 'Per booking' },
  { id: 'refer', label: 'Refer a friend', points: 500, unit: 'When they book' },
] as const

export const AVAILABLE_REWARDS = [
  {
    id: 'rwd-001',
    title: '10% Off Next Booking',
    subtitle: 'On flights or hotels',
    cost: 2000,
    type: 'discount',
  },
  {
    id: 'rwd-002',
    title: 'Airport Lounge Pass',
    subtitle: 'One-time lounge access',
    cost: 3000,
    type: 'experience',
  },
  {
    id: 'rwd-003',
    title: 'Matchday Merch Voucher',
    subtitle: 'Official merchandise',
    cost: 2500,
    type: 'merchandise',
  },
  {
    id: 'rwd-004',
    title: 'Early Access Tickets',
    subtitle: 'Get early access to limited tickets',
    cost: 3000,
    type: 'access',
  },
] as const

export const POINTS_HISTORY = [
  {
    id: 'ph-001',
    type: 'ticket',
    title: 'Match attended',
    subtitle: 'FC Barcelona vs Real Madrid',
    points: 100,
    date: '10 May 2024',
  },
  {
    id: 'ph-002',
    type: 'hotel',
    title: 'Hotel booking',
    subtitle: 'Hotel Arts Barcelona',
    points: 100,
    date: '23 Apr 2024',
  },
  {
    id: 'ph-003',
    type: 'flight',
    title: 'Flight booking',
    subtitle: 'Lagos → Barcelona',
    points: 150,
    date: '23 Apr 2024',
  },
  {
    id: 'ph-004',
    type: 'esim',
    title: 'eSIM purchase',
    subtitle: 'Spain eSIM 10GB',
    points: 50,
    date: '21 Apr 2024',
  },
  {
    id: 'ph-005',
    type: 'reward',
    title: 'Referral bonus',
    subtitle: 'Friend booking',
    points: 500,
    date: '20 Apr 2024',
  },
]

export const BADGES = [
  {
    id: 'b-001',
    name: 'First Match',
    description: 'Attend your first match',
    earned: true,
    date: '10 May 2024',
    progress: null,
    locked: false,
  },
  {
    id: 'b-002',
    name: 'Frequent Fan',
    description: 'Attend 3 matches',
    earned: false,
    date: null,
    progress: { current: 2, total: 3 },
    locked: false,
  },
  {
    id: 'b-003',
    name: 'Globetrotter',
    description: 'Book travel to 2 different cities',
    earned: false,
    date: null,
    progress: { current: 1, total: 2 },
    locked: false,
  },
  {
    id: 'b-004',
    name: 'Loyal Fan',
    description: 'Earn 5,000 points',
    earned: false,
    date: null,
    progress: { current: 1250, total: 5000 },
    locked: false,
  },
  {
    id: 'b-005',
    name: 'VIP Supporter',
    description: 'Earn 10,000 points',
    earned: false,
    date: null,
    progress: null,
    locked: true,
  },
]

/* ─── Travel ──────────────────────────────────────────────────── */
export const RECOMMENDED_FLIGHTS = [
  {
    id: 'fl-001',
    badge: 'Best Value',
    airline: 'Turkish Airlines',
    depart: '10:20',
    arrive: '14:50',
    origin: 'LOS',
    dest: 'BCN',
    duration: '10h 30m',
    stops: '1 stop',
    price: 645,
  },
  {
    id: 'fl-002',
    badge: 'Fastest',
    airline: 'Air France',
    depart: '08:15',
    arrive: '13:10',
    origin: 'LOS',
    dest: 'BCN',
    duration: '6h 55m',
    stops: 'Direct',
    price: 912,
  },
  {
    id: 'fl-003',
    badge: 'Cheapest',
    airline: 'Iberia',
    depart: '19:40',
    arrive: '12:20',
    origin: 'LOS',
    dest: 'BCN',
    duration: '13h 40m',
    stops: '1 stop',
    price: 598,
  },
] as const

export const RECOMMENDED_HOTELS = [
  {
    id: 'ht-001',
    badge: 'Popular',
    name: 'Hotel Arts Barcelona',
    rating: 4.7,
    reviews: 1248,
    distance: '5.1 km to Camp Nou',
    price: 210,
  },
  {
    id: 'ht-002',
    badge: 'Best Seller',
    name: 'Melia Barcelona Sky',
    rating: 4.6,
    reviews: 982,
    distance: '4.3 km to Camp Nou',
    price: 165,
  },
  {
    id: 'ht-003',
    badge: 'Great Value',
    name: 'Catalonia Barcelona 505',
    rating: 4.4,
    reviews: 712,
    distance: '3.8 km to Camp Nou',
    price: 120,
  },
] as const

/* ─── Payment cards ───────────────────────────────────────────── */
export const PAYMENT_CARDS = [
  {
    id: 'card-001',
    brand: 'VISA',
    last4: '4242',
    expiry: '06/27',
    holder: 'Adewale Adeyemi',
    primary: true,
  },
  {
    id: 'card-002',
    brand: 'Mastercard',
    last4: '8881',
    expiry: '11/26',
    holder: 'Adewale Adeyemi',
    primary: false,
  },
] as const

/* ─── Activity ────────────────────────────────────────────────── */
export const ACTIVITY = [
  {
    id: 'act-001',
    type: 'ticket',
    title: 'Ticket confirmed',
    subtitle: 'FC Barcelona vs Real Madrid',
    date: '10 May 2024',
  },
  {
    id: 'act-002',
    type: 'hotel',
    title: 'Hotel booking confirmed',
    subtitle: 'Hotel Arts Barcelona',
    date: '27 Apr 2024',
  },
  {
    id: 'act-003',
    type: 'flight',
    title: 'Flight booked',
    subtitle: 'Lagos → Barcelona',
    date: '23 Apr 2024',
  },
  {
    id: 'act-004',
    type: 'reward',
    title: 'Reward redeemed',
    subtitle: '10% Off Next Booking',
    date: '15 Apr 2024',
  },
]
