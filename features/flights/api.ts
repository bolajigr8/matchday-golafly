import axiosInstance from "@/lib/axios";
import type {
  ApiResponse,
  FlightOffer,
  FlightOfferRequest,
  FlightSearchPayload,
  PlaceSuggestion,
} from "./types";

export async function searchFlights(
  payload: FlightSearchPayload,
): Promise<ApiResponse<FlightOfferRequest>> {
  const { data } = await axiosInstance.post<ApiResponse<FlightOfferRequest>>(
    "/api/v1/flights/searching",
    payload,
  );
  return data;
}

export async function getOfferRequest(
  offerRequestId: string,
): Promise<ApiResponse<FlightOfferRequest>> {
  const { data } = await axiosInstance.get<ApiResponse<FlightOfferRequest>>(
    `/api/v1/flights/offer-requests/${offerRequestId}`,
  );
  return data;
}

export async function getOfferById(offerId: string): Promise<ApiResponse<FlightOffer>> {
  const { data } = await axiosInstance.get<ApiResponse<FlightOffer>>(
    `/api/v1/flights/offers/${offerId}`,
  );
  return data;
}

export async function getPlaceSuggestions(
  query: string,
  lat?: number,
  lng?: number,
  rad?: number,
): Promise<ApiResponse<PlaceSuggestion[]>> {
  const { data } = await axiosInstance.get<ApiResponse<PlaceSuggestion[]>>(
    "/api/v1/flights/places/suggestions",
    { params: { query, lat, lng, rad } },
  );
  return data;
}

export async function getCabinClasses(): Promise<ApiResponse<string[]>> {
  const { data } = await axiosInstance.get<ApiResponse<string[]>>(
    "/api/v1/flights/classes",
  );
  return data;
}
