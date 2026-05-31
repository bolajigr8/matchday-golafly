"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown, AlertCircle, Plane } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SORT_TABS } from "@/store/travel";

import { FlightSearchBar }      from "@/components/flights/search-bar";
import { FlightFiltersSidebar } from "@/components/flights/filters-sidebar";
import { FlightCard, FlightCardSkeleton } from "@/components/flights/flight-card";
import {
  FlightPriceInsights,
  FlightTravelConnected,
  FlightYourTrip,
} from "@/components/flights/price-insights";

import { useSearchFlights, useFlightOfferRequest } from "@/features/flights/hooks";
import type { FlightSearchValues } from "@/features/flights/schema";
import type { FlightOffer } from "@/features/flights/types";

export function FlightsClient() {
  const [activeSort,     setActiveSort]     = useState("best");
  const [selectedStops,  setSelectedStops]  = useState<string[]>(["Direct", "1 Stop", "2+ Stops"]);
  const [activeAirlines, setActiveAirlines] = useState<string[]>([]);
  const [showFilters,    setShowFilters]    = useState(false);
  const [showInsights,   setShowInsights]   = useState(false);

  const { mutate: search, isPending: isSearching, data: searchResult } = useSearchFlights();
  const offerRequestId = searchResult?.data?.id;

  const { data: offerRequestData, isLoading: isLoadingOffers } =
    useFlightOfferRequest(offerRequestId);

  const rawOffers: FlightOffer[] = offerRequestData?.data?.offers ?? [];

  function stopCount(offer: FlightOffer): string {
    const stops = (offer.slices[0]?.segments.length ?? 1) - 1;
    if (stops === 0) return "Direct";
    if (stops === 1) return "1 Stop";
    return "2+ Stops";
  }

  const filtered = rawOffers.filter(o =>
    selectedStops.length === 0 || selectedStops.includes(stopCount(o)),
  );

  const toggleStop    = (s: string) =>
    setSelectedStops(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  const toggleAirline = (a: string) =>
    setActiveAirlines(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  function handleSearch(values: FlightSearchValues) {
    const slices = [
      { origin: values.origin.toUpperCase(), destination: values.destination.toUpperCase(), departure_date: values.departure_date },
    ];
    if (values.return_date) {
      slices.push({ origin: values.destination.toUpperCase(), destination: values.origin.toUpperCase(), departure_date: values.return_date });
    }
    const passengers = Array.from({ length: values.adults }, () => ({ age: 25 }));

    search(
      { data: { slices, passengers, cabin_class: values.cabin_class } },
      {
        onError: (err) => {
          toast.error(err.response?.data?.message ?? err.message ?? "Search failed. Please try again.");
        },
      },
    );
  }

  const isLoading  = isSearching || isLoadingOffers;
  const hasSearched = !!offerRequestId;

  return (
    <div className="min-h-screen bg-background">
      <FlightSearchBar onSearch={handleSearch} isSearching={isSearching} />

      <div className="page-container py-5 sm:py-8">

        {/* Mobile toolbar */}
        <div className="mb-4 flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setShowFilters(o => !o)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[11px] font-bold transition-colors",
              showFilters ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
          <div className="flex flex-1 gap-1.5 overflow-x-auto scrollbar-hide">
            {["Direct", "1 Stop", "2+ Stops"].map(s => (
              <button
                key={s}
                onClick={() => toggleStop(s)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 font-mono text-[11px] font-bold transition-colors",
                  selectedStops.includes(s) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile expandable filters */}
        {showFilters && (
          <motion.div className="mb-4 lg:hidden" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <FlightFiltersSidebar selectedStops={selectedStops} toggleStop={toggleStop} activeAirlines={activeAirlines} toggleAirline={toggleAirline} />
          </motion.div>
        )}

        {/* 3-col grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_260px]">

          <motion.div className="hidden lg:block" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.4 }}>
            <FlightFiltersSidebar selectedStops={selectedStops} toggleStop={toggleStop} activeAirlines={activeAirlines} toggleAirline={toggleAirline} />
          </motion.div>

          {/* Results column */}
          <div className="space-y-4">
            <motion.div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.38 }}>
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                {isLoading
                  ? "Searching…"
                  : hasSearched
                    ? <><span className="font-bold text-foreground">{filtered.length}</span> flights found</>
                    : "Enter a route above and search"
                }
              </p>
              {hasSearched && (
                <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
                  {SORT_TABS.map(tab => (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveSort(tab.id)}
                      className={cn("shrink-0 rounded-xl border px-3 py-2 text-center transition-colors", activeSort === tab.id ? "border-primary bg-primary/10 shadow-[0_0_8px_rgba(183,255,0,0.2)]" : "border-border bg-card hover:border-primary/30")}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    >
                      <p className={cn("text-[10px] font-mono", activeSort === tab.id ? "text-primary" : "text-muted-foreground")}>{tab.label}</p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {hasSearched && !isLoading && (
              <motion.div className="flex items-center rounded-lg border border-border bg-muted/40 px-4 py-2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.14, duration: 0.35 }}>
                <p className="text-[11px] text-muted-foreground">Prices include taxes and fees.</p>
              </motion.div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)}
              </div>
            )}

            {/* No search yet */}
            {!isLoading && !hasSearched && (
              <motion.div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="grid size-14 place-items-center rounded-full bg-primary/10">
                  <Plane className="size-6 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold">Find your flight</p>
                  <p className="mt-1 text-sm text-muted-foreground">Enter origin, destination, and dates above then hit Search.</p>
                </div>
              </motion.div>
            )}

            {/* No results */}
            {!isLoading && hasSearched && filtered.length === 0 && (
              <motion.div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-12 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AlertCircle className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No flights found. Try adjusting the filters or dates.</p>
              </motion.div>
            )}

            {/* Flight cards */}
            {!isLoading && filtered.length > 0 && (
              <div className="space-y-3">
                {filtered.map((offer, i) => <FlightCard key={offer.id} offer={offer} index={i} />)}
              </div>
            )}

            {/* Mobile insights */}
            <div className="lg:hidden">
              <button onClick={() => setShowInsights(o => !o)} className="flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <span className="text-[13px] font-bold text-foreground">Price Insights &amp; Trip Summary</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showInsights && "rotate-180")} />
              </button>
              {showInsights && (
                <motion.div className="mt-3 space-y-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
                  <FlightPriceInsights />
                  <FlightTravelConnected />
                  <FlightYourTrip />
                </motion.div>
              )}
            </div>
          </div>

          {/* Desktop sidebar */}
          <motion.div className="hidden space-y-4 lg:block" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12, duration: 0.4 }}>
            <FlightPriceInsights />
            <FlightTravelConnected />
            <FlightYourTrip />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
