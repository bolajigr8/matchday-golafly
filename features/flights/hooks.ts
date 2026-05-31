import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { QueryKeys } from "@/models/query";
import {
  getCabinClasses,
  getOfferById,
  getOfferRequest,
  getPlaceSuggestions,
  searchFlights,
} from "./api";
import type { ApiResponse, FlightOffer, FlightOfferRequest, FlightSearchPayload } from "./types";

interface ApiErrorBody {
  message?: string;
}

export function useSearchFlights() {
  return useMutation<
    ApiResponse<FlightOfferRequest>,
    AxiosError<ApiErrorBody>,
    FlightSearchPayload
  >({
    mutationKey: [QueryKeys.Flight_Search],
    mutationFn: searchFlights,
  });
}

export function useFlightOfferRequest(offerRequestId: string | null | undefined) {
  return useQuery<ApiResponse<FlightOfferRequest>, AxiosError<ApiErrorBody>>({
    queryKey: [QueryKeys.Flight_Offer_Request, offerRequestId],
    queryFn: () => getOfferRequest(offerRequestId!),
    enabled: !!offerRequestId,
    staleTime: 2 * 60 * 1000,
    refetchInterval: (query) => {
      const offers = (query.state.data as ApiResponse<FlightOfferRequest> | undefined)
        ?.data?.offers;
      return offers && offers.length > 0 ? false : 2_000;
    },
  });
}

export function useFlightOffer(offerId: string | null) {
  return useQuery<ApiResponse<FlightOffer>, AxiosError<ApiErrorBody>>({
    queryKey: [QueryKeys.Flight_Offer, offerId],
    queryFn: () => getOfferById(offerId!),
    enabled: !!offerId,
  });
}

export function usePlaceSuggestions(query: string) {
  return useQuery({
    queryKey: [QueryKeys.Flight_Places, query],
    queryFn: () => getPlaceSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCabinClasses() {
  return useQuery({
    queryKey: [QueryKeys.Flight_Classes],
    queryFn: getCabinClasses,
    staleTime: Infinity,
  });
}
