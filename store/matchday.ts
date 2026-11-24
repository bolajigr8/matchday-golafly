/* ─── Match data ──────────────────────────────────────────────── */
export interface Match {
  id: string;
  league: string;
  leagueColor: string;
  team1: string;
  team2: string;
  date: string;
  venue: string;
  price: string;
  availability: number;
  availabilityColor: string;
  image: string;
  featured?: boolean;
  soldOut?: boolean;
}

const imgBayernPsg       = "/figma/a2c89641b49e1bbeff07709ddbff8c2f2847a165.png";
const imgArsenalLiverpool= "/figma/24c56f1c7a3c2f306fb231fea6ceffa981140d11.png";
const imgBarcaAtletico   = "/figma/1556381fa8c0f65a326543688b8a7438e9c37977.png";
const imgAtleticoVilla   = "/figma/c5902ebd4561e008b4d3a49c231b9b87ed04c7cb.png";
const imgChelseaTottenham= "/figma/c6c1d2332fe2410f3954def4f6213cb62b1f820c.png";

export const MATCHES: Match[] = [
  { id: "1", league: "UCL",     leagueColor: "#b7ff00", team1: "Bayern Munich", team2: "PSG",             date: "Jun 18, 2026", venue: "Allianz Arena, Munich",       price: "€620", availability: 35, availabilityColor: "#ff4e4e", image: imgBayernPsg },
  { id: "2", league: "PL",      leagueColor: "#5bc8ff", team1: "Arsenal",       team2: "Liverpool",       date: "Jun 14, 2026", venue: "Emirates Stadium, London",    price: "€320", availability: 60, availabilityColor: "#5bc8ff", image: imgArsenalLiverpool },
  { id: "3", league: "LA LIGA", leagueColor: "#ffc857", team1: "Barcelona",     team2: "Atlético Madrid", date: "Jun 22, 2026", venue: "Estadi Olímpic, Barcelona",   price: "€190", availability: 70, availabilityColor: "#ffc857", image: imgBarcaAtletico },
  { id: "4", league: "UEL",     leagueColor: "#b7ff00", team1: "Atlético",      team2: "Villarreal",      date: "Jun 28, 2026", venue: "Estadio Olímpico, Seville",   price: "€380", availability: 20, availabilityColor: "#ff4e4e", image: imgAtleticoVilla },
  { id: "5", league: "SERIE A", leagueColor: "#6c7668", team1: "Juventus",      team2: "Inter",           date: "Jul 3, 2026",  venue: "Allianz Stadium, Turin",      price: "—",    availability:  0, availabilityColor: "#6c7668", image: "", soldOut: true },
  { id: "6", league: "PL",      leagueColor: "#5bc8ff", team1: "Chelsea",       team2: "Tottenham",       date: "Jul 8, 2026",  venue: "Stamford Bridge, London",     price: "€210", availability: 80, availabilityColor: "#5bc8ff", image: imgChelseaTottenham },
];

export const IMAGES = {
  heroBg:      "/figma/052520396ba9e3230e862090ca3497fcc08e1b6d.png",
  heroBgNew:   "/figma/cff5581bea97d4c4bb6feaf28c5f47d1e20ec300.png",
  heroPitch:   "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1800&q=80",
  heroGrad:    "/figma/ec0766539ef270f274dde114ff254f1d8ccb3ee6.png",
  heroGlow:    "/figma/f82eb6e1644d81dc62ae676d3e372dd4cb811443.png",
  pseudoBefore:"/figma/2a7a76966bc097de36eaf62926eb81a2bbd8c8ab.png",
  cardImgFade: "/figma/7f51e74f003cd1d9c27aa8fc150bf870d2aa492d.png",
};

/* ─── Hero slides (used by store/matches.ts) ──────────────────────────────────────── */
export interface HeroSlide {
  id: string;
  image: string;
  /** CSS object-position for the photo; keeps the subject clear of the text. */
  imagePosition?: string;
  eyebrow: string;
  /** One entry per line of the headline; `accent` lines render in lime. */
  title: { text: string; accent?: boolean }[];
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}

/* ─── Stadium tours (home page) ───────────────────────────────── */
export type TourCountry = "Spain" | "England" | "Germany" | "Italy";

export interface StadiumTour {
  id: string;
  stadium: string;
  club: string;
  city: string;
  country: TourCountry;
  flag: string;
  rating: number;
  badge?: string;
  duration: string;
  price: number;
  image: string;
  features: string[];
}

export const TOUR_COUNTRIES = ["All", "Spain", "England", "Germany", "Italy"] as const;
export type TourFilter = (typeof TOUR_COUNTRIES)[number];

export const STADIUM_TOURS: StadiumTour[] = [
  {
    id: "camp-nou", stadium: "Spotify Camp Nou", club: "FC Barcelona", city: "Barcelona",
    country: "Spain", flag: "🇪🇸", rating: 4.9, badge: "Most popular", duration: "2h", price: 28,
    image: "/figma/afd430e4a14b08895510767215d0fb43710050b6.png",
    features: ["Players' tunnel walk", "Home dressing room", "Pitchside & dugouts", "FC Barcelona Museum"],
  },
  {
    id: "bernabeu", stadium: "Santiago Bernabéu", club: "Real Madrid", city: "Madrid",
    country: "Spain", flag: "🇪🇸", rating: 4.9, badge: "Premium", duration: "2h", price: 35,
    image: "/figma/02c632a8283ff338bc7c01321ea0e7541e134649.png",
    features: ["Panoramic pitch view", "Trophy & legends room", "Presidential box", "360° rooftop walkway"],
  },
  {
    id: "old-trafford", stadium: "Old Trafford", club: "Manchester United", city: "Manchester",
    country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rating: 4.8, duration: "1h45", price: 30,
    image: "",
    features: ["The players' tunnel", "Home & away dressing rooms", "Sir Alex Ferguson Stand", "Museum & megastore"],
  },
  {
    id: "anfield", stadium: "Anfield", club: "Liverpool FC", city: "Liverpool",
    country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rating: 4.8, duration: "1h30", price: 27,
    image: "/figma/3674ecf043f18cafd90e412ee1642dafae89a217.png",
    features: ["Touch the “This Is Anfield” sign", "The Kop", "Home dressing room", "Anfield Story museum"],
  },
  {
    id: "allianz", stadium: "Allianz Arena", club: "Bayern Munich", city: "Munich",
    country: "Germany", flag: "🇩🇪", rating: 4.7, duration: "1h15", price: 24,
    image: "/figma/5089755140ef1b2ba7d5ebc95d4647cbd583fa2f.png",
    features: ["Players' tunnel & bench", "FC Bayern Museum", "Press conference room", "LED façade by night"],
  },
  {
    id: "san-siro", stadium: "San Siro", club: "AC Milan · Inter", city: "Milan",
    country: "Italy", flag: "🇮🇹", rating: 4.6, duration: "1h30", price: 25,
    image: "",
    features: ["Both club dressing rooms", "Pitchside tunnel", "San Siro Museum", "Iconic spiral ramps"],
  },
  {
    id: "wembley", stadium: "Wembley Stadium", club: "England", city: "London",
    country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", rating: 4.7, duration: "1h30", price: 32,
    image: "/figma/091eed2761132bc5983b0f60c29b1490e71724a3.png",
    features: ["Walk up the Wembley steps", "Royal box & trophy lift", "England dressing room", "Pitchside player tunnel"],
  },
  {
    id: "signal-iduna", stadium: "Signal Iduna Park", club: "Borussia Dortmund", city: "Dortmund",
    country: "Germany", flag: "🇩🇪", rating: 4.8, duration: "1h30", price: 22,
    image: "/figma/414bf9dfdde0430fad806358c9878962af72705c.png",
    features: ["Stand on the Yellow Wall", "BVB dressing room", "Pitchside & dugout", "Borusseum club museum"],
  },
];

/* ─── Access tiers (home page) ────────────────────────────────── */
export interface TourTier {
  name: string;
  price: number;
  features: string[];
  featured?: boolean;
}

export const TOUR_TIERS: TourTier[] = [
  {
    name: "Standard", price: 25,
    features: [
      "Self-guided or small-group tour",
      "Stadium bowl & pitchside access",
      "Club museum & trophy room",
      "Official audio guide (12 languages)",
    ],
  },
  {
    name: "VIP", price: 60, featured: true,
    features: [
      "Expert guided small group (max 12)",
      "Players' tunnel & home dressing room",
      "Dugout & press conference room",
      "Priority skip-the-line entry",
      "10% off the club megastore",
    ],
  },
  {
    name: "Legends", price: 180,
    features: [
      "Private tour with a club ex-player",
      "Boardroom & directors' box",
      "Signed shirt & photo package",
      "Matchday hospitality add-on",
      "Personal concierge booking",
    ],
  },
];

/* ─── Why Golafly steps (home page) ───────────────────────────── */
export const WHY_STEPS = [
  {
    num: "01", title: "Verified tickets",
    body: "Every ticket comes from vetted sellers and is checked before delivery.",
  },
  {
    num: "02", title: "One checkout",
    body: "Tickets, flights, stays and eSIM in a single booking — or just the tickets, if that's all you need.",
  },
  {
    num: "03", title: "150% order guarantee",
    body: "Every order is covered by our 150% order guarantee, so you can book with confidence.",
  },
  {
    num: "04", title: "24/7 support",
    body: "Multilingual help before and during your trip, whenever you need it.",
  },
] as const;

/* ─── Seat categories ─────────────────────────────────────────── */
export type StandId = "north" | "south" | "east" | "west" | "corners";

export interface SeatCategory {
  id: StandId;
  name: string;
  pricePerPerson: number;
  badge: string;
  description: string;
  urgency: string | null;
  soldOut: boolean;
  color: string;
  mapColor: string;
  mapColorDefault: string;
}

export const SEAT_CATEGORIES: SeatCategory[] = [
  { id: "north",   name: "North Stand",     pricePerPerson: 850, badge: "Cat 1", description: "Pitch-side · Premium hospitality · Best view",   urgency: "Only 128 seats left", soldOut: false, color: "#b7ff00", mapColor: "#b7ff00", mapColorDefault: "#c8e8b0" },
  { id: "south",   name: "South Stand",     pricePerPerson: 480, badge: "Cat 2", description: "Side-line view · Excellent atmosphere",            urgency: null,                  soldOut: false, color: "#2a7ab8", mapColor: "#2a7ab8", mapColorDefault: "#b0cce8" },
  { id: "east",    name: "East Stand",      pricePerPerson: 480, badge: "Cat 2", description: "Side-line view · Good sightlines",                 urgency: null,                  soldOut: false, color: "#2a7ab8", mapColor: "#2a7ab8", mapColorDefault: "#b0cce8" },
  { id: "west",    name: "West Stand",      pricePerPerson: 290, badge: "Cat 3", description: "Behind goal · Ultras atmosphere",                  urgency: null,                  soldOut: false, color: "#d4820a", mapColor: "#d4820a", mapColorDefault: "#f0d0a0" },
  { id: "corners", name: "Corner Sections", pricePerPerson:   0, badge: "Cat 4", description: "Limited view · Budget option",                     urgency: null,                  soldOut: true,  color: "#6c7668", mapColor: "#6c7668", mapColorDefault: "#6c7668" },
];

/* ─── Extras: hotels ─────────────────────────────────────────── */
export interface Hotel {
  id: string;
  name: string;
  stars: number;
  amenities: string;
  price: number;
  image: string;
}

export const HOTELS: Hotel[] = [
  { id: "westin",   name: "Westin Grand Munich",  stars: 5, amenities: "2.1 km · Breakfast included · Free WiFi · Pool",        price: 420, image: "/1eac67d6cd83466ab8ae107d3a12e70790dac20b.png" },
  { id: "olympic",  name: "Hotel Olympic Munich",  stars: 4, amenities: "3.5 km · Free shuttle · Bar & restaurant",              price: 280, image: "/b32ef627a5f44ada73462061c22eb216470a95d9.png" },
  { id: "mandarin", name: "Mandarin Oriental",     stars: 5, amenities: "City centre · 5 km · Full spa · Michelin restaurant",   price: 680, image: "/b2d56408fa3098bafc138bebcb51efeed1eccd93.png" },
];

/* ─── Extras: flights ────────────────────────────────────────── */
export interface Flight {
  id: string;
  airline: string;
  code: string;
  duration: string;
  time: string;
  price: number;
  recommended: boolean;
}

export const AIRPORTS = ["LHR", "MAD", "CDG", "BCN", "AMS"] as const;
export type Airport = (typeof AIRPORTS)[number];

export const FLIGHTS: Flight[] = [
  { id: "ba3421", airline: "British Airways", code: "BA3421", duration: "2h 05m", time: "10:30→13:35", price: 190, recommended: false },
  { id: "lh3182", airline: "Lufthansa",       code: "LH3182", duration: "2h 15m", time: "14:45→17:00", price: 210, recommended: true  },
  { id: "u29841", airline: "EasyJet",         code: "U29841", duration: "1h 55m", time: "07:00→10:05", price:  95, recommended: false },
];

/* ─── Checkout order items ────────────────────────────────────── */
export interface OrderItem {
  id: string;
  label: string;
  detail: string;
  price: string;
  priceNum: number;
}

export const ORDER_ITEMS: OrderItem[] = [
  { id: "tickets", label: "2 × Cat 4 Tickets",             detail: "Mexico vs South Africa · Cat 4 · Block 217 · Row 12",     price: "€76",  priceNum: 76  },
  { id: "hotel",   label: "Westin Grand Munich",            detail: "2 nights · Check-in Jun 11, 2026",                        price: "€420", priceNum: 420 },
  { id: "flight",  label: "2 × British Airways · LHR+MUC", detail: "Return flights · Dep 10:30",                              price: "€380", priceNum: 380 },
  { id: "esim",    label: "Golafly eSIM — Travel Light",    detail: "10 GB · 15 days · 42 European countries · Auto-activate", price: "€29",  priceNum: 29  },
];

/* ─── Ticket listings (seats page) ───────────────────────────── */
export type ListingCat = "Cat 1 Premium" | "Cat 1" | "Cat 2" | "Cat 3" | "Cat 4";

/** Which source a listing comes from — drives the Verified / Partners tabs. */
export type ListingSeller = "verified" | "partners";

export interface TicketListing {
  id: string;
  cat: ListingCat;
  block: string;
  row: string;
  chips: string[];
  priceEach: number;
  maxQty: number;
  seller: ListingSeller;
}

export const TICKET_LISTINGS: TicketListing[] = [
  { id: "tl1", cat: "Cat 4",         block: "217", row: "12", chips: ["Up to 4 Seats Together", "Any Fan Side", "Mobile Tickets", "Clear View"], priceEach: 38,  maxQty: 4, seller: "verified" },
  { id: "tl2", cat: "Cat 3",         block: "112", row: "5",  chips: ["2 Seats Together", "Mexico Fans", "Electronic Tickets"],                  priceEach: 75,  maxQty: 2, seller: "verified" },
  { id: "tl3", cat: "Cat 2",         block: "45",  row: "8",  chips: ["Up to 4 Seats Together", "Any Fan Side", "Mobile Tickets"],               priceEach: 104, maxQty: 4, seller: "verified" },
  { id: "tl4", cat: "Cat 2",         block: "38",  row: "3",  chips: ["2 Seats Together", "South Africa Fans", "Mobile Tickets"],                priceEach: 117, maxQty: 2, seller: "verified" },
  { id: "tl5", cat: "Cat 1",         block: "21",  row: "6",  chips: ["Up to 6 Seats Together", "Any Fan Side", "Mobile Tickets", "Clear View"], priceEach: 175, maxQty: 6, seller: "verified" },
  { id: "tl6", cat: "Cat 1",         block: "18",  row: "2",  chips: ["2 Seats Together", "Mexico Fans", "Electronic Tickets"],                  priceEach: 221, maxQty: 2, seller: "verified" },
  { id: "tl7", cat: "Cat 1 Premium", block: "5",   row: "1",  chips: ["Up to 4 Seats Together", "Any Fan Side", "Mobile Tickets", "VIP Lounge"], priceEach: 377, maxQty: 4, seller: "verified" },
  { id: "tl8", cat: "Cat 1 Premium", block: "3",   row: "1",  chips: ["2 Seats Together", "Mexico Fans", "Electronic Tickets", "VIP Lounge"],   priceEach: 422, maxQty: 2, seller: "verified" },
  // Partner seller listings (sample data shown when the API returns nothing).
  { id: "tp1", cat: "Cat 3",         block: "205", row: "9",  chips: ["Up to 3 Seats Together", "Any Fan Side", "Mobile Tickets", "Verified Seller"], priceEach: 92,  maxQty: 3, seller: "partners" },
  { id: "tp2", cat: "Cat 2",         block: "134", row: "4",  chips: ["2 Seats Together", "Any Fan Side", "Electronic Tickets", "Verified Seller"],   priceEach: 148, maxQty: 2, seller: "partners" },
  { id: "tp3", cat: "Cat 1",         block: "118", row: "7",  chips: ["Up to 4 Seats Together", "Home Fans", "Mobile Tickets", "Verified Seller"],   priceEach: 205, maxQty: 4, seller: "partners" },
  { id: "tp4", cat: "Cat 1 Premium", block: "102", row: "2",  chips: ["2 Seats Together", "Any Fan Side", "Electronic Tickets", "Hospitality"],       priceEach: 468, maxQty: 2, seller: "partners" },
];

/* ─── eSIM plans (extras page) ───────────────────────────────── */
export type EsimCoverage = "Local" | "Europe-wide" | "Global";

export interface EsimPlan {
  id: string;
  name: string;
  data: string;
  validity: string;
  coverage: string;
  speed: string;
  extras: string[];
  price: number;
  popular?: boolean;
}

export const ESIM_PLANS: EsimPlan[] = [
  { id: "travel-light",  name: "Travel Light",    data: "10 GB high-speed",    validity: "15 days", coverage: "42 European countries", speed: "5G", extras: ["Roaming included"],              price: 29, popular: true },
  { id: "europe-tour",   name: "Europe Tour",     data: "20 GB high-speed",    validity: "30 days", coverage: "42 European countries", speed: "5G", extras: ["Hotspot", "Voice"],              price: 45 },
  { id: "unlimited-pro", name: "Unlimited Pro",   data: "Unlimited fair-use",  validity: "30 days", coverage: "42 European countries", speed: "5G", extras: ["200 min voice", "Hotspot"],     price: 79 },
];

/* ─── Confirmed booking ──────────────────────────────────────── */
export const BOOKING_REF = "GF-2026-LALIGA-97770";

export const BOOKING_ROWS = [
  { label: "Match",      value: "Barcelona vs Atlético Madrid" },
  { label: "Date",       value: "Jun 22, 2026 · 20:45 CET" },
  { label: "Seats",      value: "Cat 1 × 2 · North Stand" },
  { label: "Hotel",      value: "Hotel Olympic Munich" },
  { label: "Flights",    value: "2 × British Airways · LHR→MUC" },
  { label: "eSIM",       value: "Travel Light · 10 GB · 15 days" },
] as const;

export const TOTAL_PAID = "€2.360";
