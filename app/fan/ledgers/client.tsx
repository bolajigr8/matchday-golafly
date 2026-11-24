"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble, Layers, Plane, Wifi } from "lucide-react";
import { QueryState } from "@/components/fan/query-state";
import { LedgerCard } from "@/components/fan/ledger-card";
import { useFanLedgers } from "@/features/fan/hooks";
import { countByTab, fanTab, tripDate, type FanTab } from "@/features/fan/ledgers";
import type { FanLedger, FanLedgerType } from "@/features/fan/types";
import { Routes } from "@/routes";
import { cn } from "@/lib/utils";

/* LEDGERS — every order on the fan's account.
 *
 * The travels dashboard's Ledgers screen, brought into the fan dashboard:
 * Upcoming / Past / Cancelled, a type filter, and a detail page per order.
 * It replaces the old Travel tab, which listed the same GET /v1/auth/ledgers
 * records without either.
 *
 * Filtered in memory from the one cached list rather than one request per
 * filter: Home reads the same list, so every chip change here would otherwise
 * be a round trip for data already on the device. Both filters live in the
 * URL, so a filtered view is shareable and back-button safe. */

const TABS: { tab: FanTab; label: string }[] = [
  { tab: "upcoming", label: "Upcoming" },
  { tab: "past", label: "Past" },
  { tab: "cancelled", label: "Cancelled" },
];

type TypeFilter = FanLedgerType | "all";

const TYPES: { value: TypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "All", icon: Layers },
  { value: "flight", label: "Flights", icon: Plane },
  { value: "stays", label: "Stays", icon: BedDouble },
  { value: "esim", label: "eSIM", icon: Wifi },
];

function hrefFor(tab: FanTab, type: TypeFilter) {
  const params = new URLSearchParams();
  if (tab !== "upcoming") params.set("tab", tab);
  if (type !== "all") params.set("type", type);
  const qs = params.toString();
  return qs ? `${Routes.dashboardLedgers}?${qs}` : Routes.dashboardLedgers;
}

export default function LedgersClient() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const tab: FanTab = TABS.some(t => t.tab === rawTab) ? (rawTab as FanTab) : "upcoming";
  const rawType = searchParams.get("type");
  const type: TypeFilter = TYPES.some(t => t.value === rawType) ? (rawType as TypeFilter) : "all";

  const query = useFanLedgers();
  const all = query.data?.data ?? [];
  const ofType = (rows: FanLedger[]) =>
    type === "all" ? rows : rows.filter(l => l.ledger_type === type);
  const counts = countByTab(ofType(all));

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[23px] font-bold tracking-[-0.03em] text-foreground">Ledgers</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your flights, stays and eSIMs — every order, with its references and receipt.
        </p>
      </header>

      <div className="flex gap-5 border-b border-[var(--edge)]">
        {TABS.map(t => (
          <Link
            key={t.tab}
            href={hrefFor(t.tab, type)}
            className={cn(
              "relative pb-2.5 text-[13px] transition-colors",
              tab === t.tab
                ? "font-bold text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {counts[t.tab] > 0 && (
              <span className="ml-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                {counts[t.tab]}
              </span>
            )}
            {tab === t.tab && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
            )}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={hrefFor(tab, value)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 font-mono text-[11px] transition-colors",
              value === type
                ? "bg-muted font-bold text-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
                : "text-muted-foreground shadow-[0_0_0_1px_var(--edge-strong)] hover:text-foreground",
            )}
          >
            <Icon className="size-3" />
            {label}
          </Link>
        ))}
      </div>

      <QueryState
        query={query}
        select={d => sortForTab(ofType(d.data).filter(l => fanTab(l) === tab), tab)}
        noun="bookings"
        endpoint="/v1/auth/ledgers"
        emptyTitle={EMPTY[tab].title}
        emptyBody={EMPTY[tab].body}
        emptyAction={
          tab === "upcoming" ? (
            <>
              <Link
                href={Routes.flights}
                className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
              >
                <Plane className="size-3.5" />
                Find flights
              </Link>
              <Link
                href={Routes.stays}
                className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
              >
                <BedDouble className="size-3.5" />
                Browse stays
              </Link>
            </>
          ) : undefined
        }
      >
        {(rows: FanLedger[]) => (
          <div className="flex flex-col gap-3">
            {rows.map(l => (
              <LedgerCard key={l.ledger_id} ledger={l} />
            ))}
          </div>
        )}
      </QueryState>

      <p className="pb-2 text-center text-[12px] text-muted-foreground">
        Need to change a booking?{" "}
        <Link href={Routes.helpFaqs} className="font-semibold text-brand-text hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}

/* Upcoming reads soonest-first; past and cancelled most-recent-first. */
function sortForTab(rows: FanLedger[], tab: FanTab): FanLedger[] {
  const keyed = rows.map(l => ({
    l,
    at: tripDate(l)?.getTime() ?? new Date(l.created_at).getTime(),
  }));
  keyed.sort((a, b) => (tab === "upcoming" ? a.at - b.at : b.at - a.at));
  return keyed.map(k => k.l);
}

const EMPTY: Record<FanTab, { title: string; body: string }> = {
  upcoming: {
    title: "Nothing booked yet",
    body: "Flights, stays and eSIMs you buy will show up here with their references.",
  },
  past: {
    title: "No past trips",
    body: "Once a trip is behind you it moves here, with the receipts and references kept.",
  },
  cancelled: {
    title: "Nothing cancelled",
    body: "Cancelled and refunded bookings would appear here. None so far.",
  },
};
