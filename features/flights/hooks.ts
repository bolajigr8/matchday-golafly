// features/flights/hooks.ts

import { useMutation, useQuery } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { QueryKeys } from '@/models/query'
import {
  cancelOrder,
  createOfferRequest,
  createOrder,
  getCabinClasses,
  getOfferById,
  getOrder,
  getOrderCancellation,
  getPlaceSuggestions,
  getSeatMaps,
} from './api'
import type {
  ApiResponse,
  CancellationPayload,
  CancellationRecord,
  CancellationStatus,
  CreateOrderPayload,
  CreateOrderResult,
  FlightOffer,
  FlightOrder,
  FlightOfferRequest,
  FlightSearchPayload,
  OrderApiResponse,
  SeatMapEntry,
} from './types'

interface ApiErrorBody {
  message?: string
}

/**
 * Search → POST, returns the offer request WITH offers already populated.
 * The old async "search then poll offer-requests/:id every 2s" flow no
 * longer applies — this endpoint returns everything in one round trip.
 */
export function useSearchFlights() {
  return useMutation<
    ApiResponse<FlightOfferRequest>,
    AxiosError<ApiErrorBody>,
    FlightSearchPayload
  >({
    mutationKey: [QueryKeys.Flight_Search],
    mutationFn: createOfferRequest,
  })
}

/* Fetch a single offer by ID — always trust this price over the cached search price. */
export function useFlightOffer(offerId: string | null) {
  return useQuery<ApiResponse<FlightOffer>, AxiosError<ApiErrorBody>>({
    queryKey: [QueryKeys.Flight_Offer, offerId],
    queryFn: () => getOfferById(offerId!),
    enabled: !!offerId,
  })
}

/* Seat map for an offer — one entry per flight segment. Only fetched when the seats step mounts. */
export function useSeatMap(offerId: string | null) {
  return useQuery<ApiResponse<SeatMapEntry[]>, AxiosError<ApiErrorBody>>({
    queryKey: [QueryKeys.Flight_Seat_Map, offerId],
    queryFn: () => getSeatMaps(offerId!),
    enabled: !!offerId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

/* Airport / city autocomplete */
export function usePlaceSuggestions(query: string) {
  return useQuery({
    queryKey: [QueryKeys.Flight_Places, query],
    queryFn: () => getPlaceSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
  })
}

/* Static list of cabin classes */
export function useCabinClasses() {
  return useQuery({
    queryKey: [QueryKeys.Flight_Classes],
    queryFn: getCabinClasses,
    staleTime: Infinity,
  })
}

/* ── Orders ─────────────────────────────────────────────────── */

/* Create an order → returns a Stripe checkout_url to redirect to */
export function useCreateOrder() {
  return useMutation<
    OrderApiResponse<CreateOrderResult>,
    AxiosError<ApiErrorBody>,
    CreateOrderPayload
  >({
    mutationKey: [QueryKeys.Flight_Order_Create],
    mutationFn: createOrder,
  })
}

/* Fetch a confirmed booking by order id (ord_…) */
export function useFlightOrder(orderId: string | null | undefined) {
  return useQuery<OrderApiResponse<FlightOrder>, AxiosError<ApiErrorBody>>({
    queryKey: [QueryKeys.Flight_Order, orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
    retry: false,
  })
}

/* Request cancellation of an order */
export function useCancelOrder() {
  return useMutation<
    OrderApiResponse<CancellationRecord>,
    AxiosError<ApiErrorBody>,
    CancellationPayload
  >({
    mutationKey: [QueryKeys.Flight_Cancel],
    mutationFn: cancelOrder,
  })
}

/* Fetch cancellation status for an order id (ord_…) */
export function useOrderCancellation(orderId: string | null | undefined) {
  return useQuery<
    OrderApiResponse<CancellationStatus>,
    AxiosError<ApiErrorBody>
  >({
    queryKey: [QueryKeys.Flight_Cancellation, orderId],
    queryFn: () => getOrderCancellation(orderId!),
    enabled: !!orderId,
    retry: false,
  })
}
