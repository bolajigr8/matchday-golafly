/* ── Shared airport / place ─────────────────────────────────── */
export interface Airport {
  id: string;
  iata_code: string;
  name: string;
  city_name?: string;
  iata_country_code?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;
}

export interface PlaceSuggestion {
  id: string;
  name: string;
  iata_code?: string;
  iata_country_code?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;
  type: "airport" | "city";
  airports?: PlaceSuggestion[];
}

/* ── Carrier / aircraft ─────────────────────────────────────── */
export interface Carrier {
  id: string;
  name: string;
  iata_code: string;
  logo_symbol_url?: string;
  logo_lockup_url?: string;
}

export interface Aircraft {
  id: string;
  name: string;
  iata_code: string;
}

/* ── Segment ────────────────────────────────────────────────── */
export interface FlightSegment {
  id: string;
  departing_at: string;
  arriving_at: string;
  origin: Airport;
  destination: Airport;
  operating_carrier: Carrier;
  marketing_carrier: Carrier;
  marketing_carrier_flight_number: string;
  aircraft?: Aircraft;
  duration: string;
  stops: number;
}

/* ── Slice ──────────────────────────────────────────────────── */
export interface FlightSlice {
  id: string;
  origin: Airport;
  destination: Airport;
  departure_date: string;
  duration: string;
  segments: FlightSegment[];
  fare_brand_name?: string;
  conditions?: {
    change_before_departure?: { allowed: boolean; penalty_amount?: string };
    refund_before_departure?: { allowed: boolean; penalty_amount?: string };
  };
}

/* ── Passenger ──────────────────────────────────────────────── */
export interface OfferPassenger {
  id: string;
  age?: number;
  type?: string;
  fare_brand_name?: string;
  baggages?: { quantity: number; type: "carry_on" | "checked" }[];
}

/* ── Flight offer ───────────────────────────────────────────── */
export interface FlightOffer {
  id: string;
  total_amount: string;
  total_currency: string;
  base_amount: string;
  tax_amount?: string;
  slices: FlightSlice[];
  passengers: OfferPassenger[];
  payment_requirements?: {
    requires_instant_payment: boolean;
    price_guarantee_expires_at?: string;
  };
  created_at: string;
  expires_at?: string;
}

/* ── Offer request ──────────────────────────────────────────── */
export interface FlightOfferRequest {
  id: string;
  client_key: string;
  cabin_class: string;
  slices: {
    origin: { iata_code: string; name?: string };
    destination: { iata_code: string; name?: string };
    departure_date: string;
  }[];
  passengers: { id: string; age?: number; type?: string }[];
  offers: FlightOffer[];
  created_at: string;
  expires_at?: string;
}

/* ── Search payload ─────────────────────────────────────────── */
export interface FlightSearchPayload {
  data: {
    slices: { origin: string; destination: string; departure_date: string }[];
    passengers: { age?: number; type?: string }[];
    cabin_class: string;
  };
}

/* ── API envelope ───────────────────────────────────────────── */
export interface ApiResponse<T> {
  data: T;
  meta?: { limit?: number; before?: string | null; after?: string | null };
}
