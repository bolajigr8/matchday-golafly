// features/stays/api.ts

import axiosInstance from '@/lib/axios'
import type {
  StayApiResponse,
  StayRegion,
  StayHotelListItem,
  StayHotelDetail,
  PrebookResult,
  BookingFormPayload,
  BookingFormResult,
  BookingCheckoutResult,
  BookingStatusResult,
  CancelOrderResult,
  SearchRegionPayload,
  SearchHotelPayload,
  PrebookPayload,
  StayCountry,
} from './types'

function fallbackUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function idempotencyKey() {
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : fallbackUUID()
  return `stays-${uuid}`
}

// 1. Region autocomplete
export async function getStayRegions(
  q: string,
): Promise<StayApiResponse<StayRegion[]>> {
  const { data } = await axiosInstance.get<StayApiResponse<StayRegion[]>>(
    '/api/v1/stays/regions/autocomplete',
    {
      params: { q },
      headers: { 'Idempotency-Key': idempotencyKey() },
    },
  )
  return data
}

// 1b. Citizenship list for the hotel search's "Citizenship" selector
// (Citizenship, room name and failed hotel API contract v1.0, section 2.2).
// Public and static: fetched once per session (see useStayCountries).
export async function getStayCountries(): Promise<
  StayApiResponse<StayCountry[]>
> {
  const { data } = await axiosInstance.get<StayApiResponse<StayCountry[]>>(
    '/api/v1/stays/countries',
  )
  return data
}

// 2. Search hotels by region
export async function searchStaysByRegion(
  payload: SearchRegionPayload,
): Promise<StayApiResponse<{ hotels: StayHotelListItem[] }>> {
  const { data } = await axiosInstance.post<
    StayApiResponse<{ hotels: StayHotelListItem[] }>
  >('/api/v1/stays/search-regions', payload)
  return data
}

// 3. Search hotel detail by HID (hotel_code)
export async function searchStayByHotelId(
  payload: SearchHotelPayload,
): Promise<StayApiResponse<StayHotelDetail>> {
  const { data } = await axiosInstance.post<StayApiResponse<StayHotelDetail>>(
    '/api/v1/stays/search-hp',
    payload,
  )
  return data
}

// 4. Prebook
// 4. Prebook
// BREAKING (ETG cert fixes): `guests` is now required. Send the exact
// same array that was sent to /search-hp — byte for byte, not
// recomputed — so the backend can verify the rate against what it was
// actually priced for. Omitting it returns 422.
export async function prebookStay(
  payload: PrebookPayload,
  /** Pin this one request to a currency instead of the picker's. A prebook
   *  fixes its currency for its whole life. */
  currency?: string,
): Promise<StayApiResponse<PrebookResult>> {
  const { data } = await axiosInstance.post<StayApiResponse<PrebookResult>>(
    '/api/v1/stays/prebook',
    payload,
    currency ? { headers: { 'X-Currency': currency } } : undefined,
  )
  return data
}

// 5. Submit booking form
export async function submitBookingForm(
  payload: BookingFormPayload,
): Promise<StayApiResponse<BookingFormResult>> {
  const { data } = await axiosInstance.post<StayApiResponse<BookingFormResult>>(
    '/api/v1/stays/booking/form',
    payload,
    {
      headers: { 'Idempotency-Key': idempotencyKey() },
    },
  )
  return data
}

// 6. Checkout — initiate Stripe payment
export async function checkoutStay(
  booking_id: number,
): Promise<StayApiResponse<BookingCheckoutResult>> {
  const { data } = await axiosInstance.post<
    StayApiResponse<BookingCheckoutResult>
  >('/api/v1/stays/booking/checkout', { booking_id })
  return data
}

// 7. Booking status
export async function getBookingStatus(
  booking_id: number,
): Promise<StayApiResponse<BookingStatusResult>> {
  const { data } = await axiosInstance.get<
    StayApiResponse<BookingStatusResult>
  >(`/api/v1/stays/booking/${booking_id}/status`)
  return data
}

// 8. Cancel a booking order — {id} in the URL is the booking_id
export async function cancelBookingOrder(
  bookingId: number,
  reason: string,
): Promise<StayApiResponse<CancelOrderResult>> {
  const { data } = await axiosInstance.post<StayApiResponse<CancelOrderResult>>(
    `/api/v1/stays/orders/${bookingId}/cancel`,
    { reason },
    { headers: { 'Idempotency-Key': idempotencyKey() } },
  )
  return data
}
