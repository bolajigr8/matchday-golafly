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
  heroGrad:    "/figma/ec0766539ef270f274dde114ff254f1d8ccb3ee6.png",
  heroGlow:    "/figma/f82eb6e1644d81dc62ae676d3e372dd4cb811443.png",
  pseudoBefore:"/figma/2a7a76966bc097de36eaf62926eb81a2bbd8c8ab.png",
  cardImgFade: "/figma/7f51e74f003cd1d9c27aa8fc150bf870d2aa492d.png",
};

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
  { id: "tickets", label: "2 × Cat 1 Tickets",            detail: "Barcelona vs Atlético Madrid · North Stand", price: "€1.700", priceNum: 1700 },
  { id: "hotel",   label: "Hotel Olympic Munich",          detail: "2 nights · Check-in Jun 22, 2026",          price: "€280",   priceNum: 280  },
  { id: "flight",  label: "2 × British Airways · LHR→MUC", detail: "Return flights · Dep 10:30",                price: "€380",   priceNum: 380  },
];

/* ─── Confirmed booking ──────────────────────────────────────── */
export const BOOKING_REF = "GF-2026-LALIGA-97770";

export const BOOKING_ROWS = [
  { label: "Match",      value: "Barcelona vs Atlético Madrid" },
  { label: "Date",       value: "Jun 22, 2026 · 20:45 CET" },
  { label: "Seats",      value: "Cat 1 × 2 · North Stand" },
  { label: "Hotel",      value: "Hotel Olympic Munich" },
  { label: "Flights",    value: "2 × British Airways · LHR→MUC" },
] as const;

export const TOTAL_PAID = "€2.360";
