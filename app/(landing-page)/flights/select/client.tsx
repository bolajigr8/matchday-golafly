"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plane, ArrowLeftRight, Calendar, User,
  CheckCircle2, XCircle, Clock, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlightOffer } from "@/features/flights/hooks";
import type { FlightSlice } from "@/features/flights/types";

/* ── helpers ───────────────────────────────────────────────────── */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}
function fmtDuration(iso: string) {
  const h = iso.match(/(\d+)H/)?.[1];
  const m = iso.match(/(\d+)M/)?.[1];
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  if (m) return `${m}m`;
  return iso;
}
function stopLabel(n: number) {
  if (n === 0) return "Direct";
  if (n === 1) return "1 stop";
  return `${n} stops`;
}
function currencySymbol(code: string) {
  return ({ EUR: "€", USD: "$", GBP: "£", AED: "د.إ" } as Record<string, string>)[code] ?? code + " ";
}

/* ── slice detail card ─────────────────────────────────────────── */
function SliceCard({ slice, label }: { slice: FlightSlice; label: string }) {
  const first = slice.segments[0];
  const last  = slice.segments[slice.segments.length - 1];
  const stops = slice.segments.length - 1;

  return (
    <motion.section
      className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <header className="flex items-start gap-3">
        <div className="grid size-9 place-items-center rounded-full bg-primary/15">
          <Plane className="size-4 -rotate-45 text-primary" />
        </div>
        <div>
          <p className="font-heading text-lg font-bold">
            {slice.origin.iata_code} → {slice.destination.iata_code}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="text-center">
          <p className="font-heading text-2xl font-bold">{fmtTime(first.departing_at)}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{slice.origin.iata_code}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDate(slice.departure_date)}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 px-2">
          <div className="flex w-full items-center gap-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[13px] text-muted-foreground">✈</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="font-mono text-[11px] font-bold text-primary">{fmtDuration(slice.duration)}</p>
          <p className="font-mono text-[9px] text-muted-foreground">{stopLabel(stops)}</p>
        </div>
        <div className="text-center">
          <p className="font-heading text-2xl font-bold">{fmtTime(last.arriving_at)}</p>
          <p className="font-mono text-[11px] text-muted-foreground">{slice.destination.iata_code}</p>
          <p className="text-[10px] text-muted-foreground">{fmtDate(last.arriving_at.slice(0, 10))}</p>
        </div>
      </div>

      <div className="space-y-2">
        {slice.segments.map((seg) => (
          <div key={seg.id} className="flex items-center gap-3 rounded-lg border border-border bg-background/50 px-3 py-2.5">
            {seg.marketing_carrier.logo_symbol_url ? (
              <img src={seg.marketing_carrier.logo_symbol_url} alt={seg.marketing_carrier.name} className="h-5 w-5 rounded object-contain" />
            ) : (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {seg.marketing_carrier.iata_code}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-foreground">
                {seg.marketing_carrier.name} · {seg.marketing_carrier_flight_number}
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {seg.origin.iata_code} → {seg.destination.iata_code} · {fmtDuration(seg.duration)}
                {seg.aircraft ? ` · ${seg.aircraft.name}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ── page client ───────────────────────────────────────────────── */
export function SelectFlightClient() {
  const params  = useSearchParams();
  const offerId = params.get("offerId");
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const { data, isLoading, error } = useFlightOffer(offerId);
  const offer = data?.data;

  /* All hooks must be called before any conditional returns */
  useEffect(() => {
    if (!offer?.expires_at) return;
    setExpiresIn(Math.round((new Date(offer.expires_at).getTime() - Date.now()) / 60_000));
  }, [offer?.id]);

  if (!offerId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="size-10 text-muted-foreground" />
        <p className="font-heading text-lg font-bold">No flight selected</p>
        <p className="text-sm text-muted-foreground">Go back and pick a flight from the results.</p>
        <Link href="/flights" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          Back to search
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-container py-6 sm:py-10">
        <div className="mt-6 animate-pulse space-y-4">
          <div className="h-16 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
          <div className="h-48 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <XCircle className="size-10 text-red-500" />
        <p className="font-heading text-lg font-bold">Offer not found</p>
        <p className="text-sm text-muted-foreground">This offer may have expired. Please search again.</p>
        <Link href="/flights" className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
          Search again
        </Link>
      </div>
    );
  }

  const symbol    = currencySymbol(offer.total_currency);
  const total     = parseFloat(offer.total_amount);
  const isRound   = offer.slices.length > 1;
  const passenger = offer.passengers[0];
  const baggages  = passenger?.baggages ?? [];
  const fareName  = passenger?.fare_brand_name ?? "Included Fare";
  const conditions = offer.slices[0]?.conditions;
  const expiresAt = offer.expires_at ? new Date(offer.expires_at) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-6 sm:py-10">

        {/* Trip summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card"
        >
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-5 sm:px-5">
            <span className="rounded-full bg-primary/15 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-primary">
              {isRound ? "Round Trip" : "One Way"}
            </span>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              {offer.slices[0].origin.iata_code}
              <ArrowLeftRight className="size-3.5 text-primary" />
              {offer.slices[0].destination.iata_code}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3.5" />
              {fmtDate(offer.slices[0].departure_date)}
              {isRound && offer.slices[1] && ` – ${fmtDate(offer.slices[1].departure_date)}`}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="size-3.5" /> {offer.passengers.length} passenger{offer.passengers.length > 1 ? "s" : ""}
            </div>
            {expiresIn !== null && expiresIn < 30 && (
              <span className="ml-auto flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-[10px] font-bold text-amber-500">
                <Clock className="size-3" /> Expires in {expiresIn}m
              </span>
            )}
          </div>
        </motion.div>

        <div className="mt-6 space-y-6">
          {/* Slices */}
          {offer.slices.map((slice, i) => (
            <SliceCard key={slice.id} slice={slice} label={i === 0 ? "Outbound flight" : "Return flight"} />
          ))}

          {/* Fare & baggage */}
          <motion.section
            className="space-y-3 rounded-2xl border border-border bg-card p-4 sm:p-5"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
          >
            <p className="font-heading text-lg font-bold">
              Fare — <span className="text-primary">{fareName}</span>
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(["personal_item", "carry_on", "checked"] as const).map((type) => {
                const bag = baggages.find(b => b.type === type);
                const labels: Record<string, string> = {
                  personal_item: "Personal Item",
                  carry_on:      "Carry-On Bag",
                  checked:       "Checked Bag",
                };
                return (
                  <div
                    key={type}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5",
                      bag ? "border-primary/30 bg-primary/5" : "border-border opacity-50",
                    )}
                  >
                    {bag ? <CheckCircle2 className="size-4 shrink-0 text-primary" /> : <XCircle className="size-4 shrink-0 text-muted-foreground" />}
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{labels[type]}</p>
                      {bag && <p className="font-mono text-[10px] text-muted-foreground">Included</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {conditions && (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {[
                  { label: "Flight changes", data: conditions.change_before_departure },
                  { label: "Refunds",        data: conditions.refund_before_departure },
                ].map(({ label, data: cond }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-2">
                    {cond?.allowed ? <CheckCircle2 className="size-3.5 shrink-0 text-primary" /> : <XCircle className="size-3.5 shrink-0 text-muted-foreground" />}
                    <div>
                      <p className="text-[11px] font-semibold text-foreground">{label}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">
                        {cond?.allowed ? (cond.penalty_amount ? `Fee: ${symbol}${cond.penalty_amount}` : "Allowed") : "Not allowed"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {offer.payment_requirements?.requires_instant_payment && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-mono text-[10px] font-bold text-amber-500">
                ⚡ Instant payment required — price not guaranteed until payment
              </p>
            )}
          </motion.section>

          {/* Price + continue — matchday goes straight to /checkout */}
          <motion.div
            className="flex flex-col items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4 }}
          >
            <div>
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                Total · {offer.passengers.length} passenger{offer.passengers.length > 1 ? "s" : ""}
              </p>
              <p className="font-heading text-3xl font-bold text-primary">
                {symbol}{total.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground">Taxes &amp; fees included</p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href={`/flights/checkout?offerId=${offerId}`}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-[0_0_18px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_28px_rgba(183,255,0,0.6)]"
              >
                ▶ Continue to Checkout
              </Link>
              <Link href="/flights" className="text-center font-mono text-[10px] text-muted-foreground hover:text-primary">
                ← Back to search
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
