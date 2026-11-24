// features/payment/types.ts

import type {
  PriceBreakdown,
  PriceDiscount,
  PriceSummary,
} from '@/features/price-breakdown/types'

export interface TransactionCustomer {
  full_name: string | null
  email: string | null
  phone: string | null
  country: string | null
}

export interface TransactionPricing {
  amount_paid_minor: number
  currency: string
  payment_method: string
  /** Price-breakdown contract (single flight / eSIM / hotel purchase).
   *  `total` is BEFORE the discount: total paid = total − discount. */
  price_breakdown?: PriceBreakdown | null
  /** This order's own share of any coupon, or null. */
  discount?: PriceDiscount | null
}

export interface EsimTransactionData {
  package: string
  package_id: string
  description: string
  image: string | null
  quantity: number
  iccid: string | null
  airalo_order_id: string | null
  request_id: string | null
}

export interface FlightPassenger {
  id: string
  email: string
  title: string
  gender: string
  born_on: string
  given_name: string
  family_name: string
  phone_number: string
}

export interface FlightTransactionData {
  pnr_reference: string
  airline_name: string
  flight_number: string
  origin: string
  destination: string
  departure_date: string
  departure_time: string
  arrival_date: string
  arrival_time: string
  return_date: string | null
  cabin_class: string
  passenger_count: number
  refund_allowed: boolean
  duffel_order_id: string
  passengers: FlightPassenger[]
}

export interface StaysCancellationPolicyEntry {
  end_at: string | null
  start_at: string | null
  amount_show: string
  amount_charge: string
}

export interface StaysTransactionCancellationPolicy {
  policies: StaysCancellationPolicyEntry[]
  free_cancellation_before: string | null
}

export interface StaysTransactionData {
  booking_reference: string
  hotel_id: number
  hotel_name: string
  checkin: string
  checkout: string
  adults: number
  children: number
  confirmation_number: string | null
  voucher_number: string | null
  is_cancellable: boolean | null
  cancellation_policy: StaysTransactionCancellationPolicy | null
  expires_at: string | null
}

// A single ledger entry. The existing backend endpoint historically returns
// one product-shaped transaction for a Stripe session.
export interface TransactionResult {
  status: string
  payment_status: string
  customer: TransactionCustomer
  pricing: TransactionPricing
  esim?: EsimTransactionData
  flight?: FlightTransactionData
  stays?: StaysTransactionData
  /** Price-breakdown contract: on a cart purchase (the basket) the same
   *  shape as the cart's summary; `total` is what was charged, AFTER the
   *  discount. null for some older baskets (one coupon over several items
   *  before this feature) and absent on single-product purchases. */
  price_summary?: PriceSummary | null
  /** Booking resolution: 'rebooked' | 'refunded' | null. */
  resolution?: string | null
  checkout_type?: string
  /** Cart checkout: one entry per booking, each with its own status and,
   *  when it failed, its own failure fields. */
  items?: TransactionResult[]
  /**
   * Present ONLY when status is `failed` or `payment_received_booking_failed`
   * (the keys are missing otherwise). Show `failure_message` exactly as sent;
   * use the code for styling or analytics only, never for the text
   * (Citizenship, room name and failed hotel API contract, section 4.4).
   */
  failure_code?: string
  failure_message?: string
  paid_at: string | null
  confirmed_at: string | null
  created_at: string
}

export interface TransactionApiResponse {
  success: boolean
  message: string
  data: TransactionResult
}

export type TransactionProduct = 'stays' | 'flight' | 'esim' | 'unknown'

/** Figures out which product this ledger entry belongs to by checking which
 * product-specific key is present. */
export function getTransactionProduct(
  data: TransactionResult | undefined | null,
): TransactionProduct {
  if (!data) return 'unknown'
  if (data.stays) return 'stays'
  if (data.flight) return 'flight'
  if (data.esim) return 'esim'
  return 'unknown'
}

export type UnifiedCartProduct = 'matchday' | 'flight' | 'stays' | 'esim'

export interface PendingCartPayment {
  checkout_type: 'cart'
  session_id: string
  ledger_ids: number[]
  matchday_order_ids: number[]
  products: UnifiedCartProduct[]
  created_at: number
}
