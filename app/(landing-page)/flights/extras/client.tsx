"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepProgress } from "@/components/checkout/step-progress";
import { FlightCard, FlightCardSkeleton } from "@/components/flights/flight-card";
import { HOTELS, AIRPORTS, type Airport } from "@/store/matchday";
import { useSearchFlights, useFlightOfferRequest } from "@/features/flights/hooks";
import type { FlightOffer } from "@/features/flights/types";

const BASE_PRICE        = 1700;
const MATCH_DESTINATION = "MUC";
const MATCH_DATE        = "2026-06-14";

export function ExtrasClient() {
  const [selectedHotel,       setSelectedHotel]       = useState<string | null>(null);
  const [selectedAirport,     setSelectedAirport]      = useState<Airport>("LHR");
  const [selectedOffer,       setSelectedOffer]        = useState<FlightOffer | null>(null);
  const [offerRequestId,      setOfferRequestId]       = useState<string | null>(null);

  const hotel    = HOTELS.find(h => h.id === selectedHotel);
  const flightPrice = selectedOffer ? parseFloat(selectedOffer.total_amount) : 0;
  const total    = BASE_PRICE + (hotel?.price ?? 0) + flightPrice;
  const itemCount = 1 + (selectedHotel ? 1 : 0) + (selectedOffer ? 1 : 0);

  /* ── Live flight search ── */
  const { mutate: search, isPending: isSearching } = useSearchFlights();
  const { data: offerRequestData, isLoading: isLoadingOffers } =
    useFlightOfferRequest(offerRequestId);

  const offers: FlightOffer[] = offerRequestData?.data?.offers ?? [];
  const isLoadingFlights = isSearching || isLoadingOffers;

  function doSearch(airport: Airport) {
    setOfferRequestId(null);
    setSelectedOffer(null);
    search(
      {
        data: {
          slices: [{ origin: airport, destination: MATCH_DESTINATION, departure_date: MATCH_DATE }],
          passengers: [{ age: 25 }],
          cabin_class: "economy",
        },
      },
      { onSuccess: (res) => setOfferRequestId(res.data.id) },
    );
  }

  /* Auto-search on mount */
  useEffect(() => { doSearch(selectedAirport); }, []); // eslint-disable-line

  function handleAirportChange(airport: Airport) {
    setSelectedAirport(airport);
    doSearch(airport);
  }

  function handleFlightSelect(offer: FlightOffer) {
    setSelectedOffer(prev => prev?.id === offer.id ? null : offer);
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.45 },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-10 sm:py-12">
        <StepProgress currentStep={2} />

        <motion.div className="mb-6 mt-6 sm:mb-8 sm:mt-8" {...fadeUp(0.06)}>
          <p className="mb-1 font-mono text-[10px] tracking-[2px] text-primary">Step 2 of 4</p>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]">Build Your Bundle</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Add a hotel &amp; flights to complete your matchday experience — or skip straight to checkout.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
          {/* ── Left ── */}
          <div className="space-y-10">

            {/* Hotels */}
            <motion.section {...fadeUp(0.12)}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-foreground">Hotels</h2>
                <button onClick={() => setSelectedHotel(null)} className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                  Skip hotels
                </button>
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">
                Curated hotels near the venue · Check-in Jun 14, 2026, Check-out 2 nights later
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {HOTELS.map((h, i) => {
                  const isSelected = selectedHotel === h.id;
                  return (
                    <motion.div
                      key={h.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      whileHover={{ y: -3 }}
                      className={cn(
                        "overflow-hidden rounded-xl border bg-card cursor-pointer transition-colors",
                        isSelected ? "border-primary shadow-[0_0_0_1px_rgba(183,255,0,0.35)]" : "border-border hover:border-border/80",
                      )}
                      onClick={() => setSelectedHotel(isSelected ? null : h.id)}
                    >
                      <div className="relative overflow-hidden h-[110px]">
                        <motion.img src={h.image} alt={h.name} className="h-full w-full object-cover" whileHover={{ scale: 1.06 }} transition={{ duration: 0.4 }} />
                      </div>
                      <div className="space-y-1 p-3">
                        <p className="text-[10px] text-amber-500">{"★".repeat(h.stars)}</p>
                        <p className="text-[13px] font-semibold text-foreground">{h.name}</p>
                        <p className="text-[10px] leading-snug text-muted-foreground">{h.amenities}</p>
                        <div className="mt-2 flex items-center justify-between pt-1">
                          <span className="text-sm font-bold text-primary">
                            +€{h.price}<span className="ml-0.5 text-[9px] font-normal text-muted-foreground">/2 nights</span>
                          </span>
                          <span className={cn(
                            "rounded-full border px-3 py-1 text-[11px] font-bold",
                            isSelected ? "border-primary bg-primary/15 text-primary" : "border-primary/30 bg-primary/10 text-primary",
                          )}>
                            {isSelected ? "Added ✓" : "Add"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>

            {/* Flights — live API */}
            <motion.section {...fadeUp(0.22)}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-foreground">Flights</h2>
                <button onClick={() => setSelectedOffer(null)} className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                  Skip flights
                </button>
              </div>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Live flights to Munich (MUC) · Jun 14, 2026 outbound
              </p>

              {/* Airport chips */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] tracking-wide text-muted-foreground">From:</span>
                {AIRPORTS.map(airport => (
                  <motion.button
                    key={airport}
                    onClick={() => handleAirportChange(airport)}
                    disabled={isLoadingFlights}
                    className={cn(
                      "rounded-full border px-3 py-1 font-mono text-[10px] font-bold tracking-wider transition-all disabled:opacity-50",
                      selectedAirport === airport
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-foreground hover:border-primary/30",
                    )}
                    whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
                  >
                    {airport}
                  </motion.button>
                ))}
              </div>

              {/* Results */}
              {isLoadingFlights && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <FlightCardSkeleton key={i} />)}
                </div>
              )}

              {!isLoadingFlights && offers.length === 0 && offerRequestId && (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <p className="text-sm text-muted-foreground">No flights found from {selectedAirport} to MUC on that date.</p>
                </div>
              )}

              {!isLoadingFlights && offers.length > 0 && (
                <div className="space-y-3">
                  {offers.slice(0, 5).map((offer, i) => (
                    <FlightCard
                      key={offer.id}
                      offer={offer}
                      index={i}
                      onSelect={handleFlightSelect}
                      selected={selectedOffer?.id === offer.id}
                    />
                  ))}
                </div>
              )}
            </motion.section>

            {/* Nav */}
            <motion.div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center" {...fadeUp(0.35)}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link href="/flights/seats" className="block rounded-full border border-primary/35 px-6 py-2.5 text-center text-[13px] font-bold text-primary transition-all hover:bg-primary/10">Back to Seats</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/flights/checkout" className="block rounded-full bg-primary px-6 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)]">Continue to Checkout</Link>
              </motion.div>
            </motion.div>
          </div>

          {/* ── Cart sidebar ── */}
          <motion.div className="lg:sticky lg:top-6 lg:self-start" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold text-foreground">Your Cart</h3>
                <motion.span
                  key={itemCount}
                  className="flex size-[22px] items-center justify-center rounded-full bg-primary font-mono text-[10px] font-bold text-primary-foreground"
                  initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  {itemCount}
                </motion.span>
              </div>

              <div className="border-b border-border pb-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-medium text-foreground">2 × Cat 1 Tickets</p>
                  <p className="text-[12px] font-bold text-primary">€1.700</p>
                </div>
                <p className="text-[10px] text-muted-foreground">Arsenal vs Liverpool · North Stand</p>
              </div>

              <AnimatePresence>
                {hotel && (
                  <motion.div className="border-b border-border pb-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-foreground">{hotel.name}</p>
                      <p className="text-[12px] font-bold text-primary">+€{hotel.price}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">2 nights</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {selectedOffer && (
                  <motion.div className="border-b border-border pb-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-medium text-foreground">
                        {selectedOffer.slices[0].segments[0].marketing_carrier.name} · {selectedAirport}→MUC
                      </p>
                      <p className="text-[12px] font-bold text-primary">
                        +€{parseFloat(selectedOffer.total_amount).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Return flight</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground">Total</span>
                  <motion.span
                    key={total}
                    className="text-[20px] font-bold text-foreground"
                    initial={{ opacity: 0.5, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}
                  >
                    €{total.toLocaleString("de-DE")}
                  </motion.span>
                </div>
                <p className="mt-0.5 text-[9px] text-muted-foreground">All fees included · Secure checkout</p>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/flights/checkout" className="block rounded-full bg-primary px-4 py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)]">
                  Go to Checkout
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
