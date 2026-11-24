"use client";

import Link from "next/link";
import { BedDouble, ChevronRight, Plane, Ticket, Wifi } from "lucide-react";
import { QueryState } from "@/components/fan/query-state";
import { TicketOrderRow } from "@/components/fan/ticket-order-row";
import { isPastMatch, useMatchdayOrders } from "@/features/fan/tickets";
import { LedgerCard } from "@/components/fan/ledger-card";
import { useFanLedgers, useHydratedFan } from "@/features/fan/hooks";
import { essentials } from "@/features/fan/ledgers";
import { firstName } from "@/features/fan/session";
import type { FanLedger } from "@/features/fan/types";
import { Routes } from "@/routes";

/* Fan dashboard — Home.
 *
 * Scenario 2 (match tickets) reads GET /v1/auth/matchday-orders — the
 * soonest upcoming order is the "next match". Scenario 3 (travel essentials)
 * is live off GET /v1/auth/ledgers. Scenario 4 (empty) falls out of
 * QueryState. */

const ADD_TO_TRIP = [
  { href: Routes.matches, icon: Ticket, title: "More matches", sub: "Fixtures on sale" },
  { href: Routes.flights, icon: Plane, title: "Flights", sub: "Search & book" },
  { href: Routes.stays, icon: BedDouble, title: "Stays", sub: "Near the ground" },
  { href: Routes.builderExtras, icon: Wifi, title: "eSIM", sub: "Data abroad" },
];

export default function HomeClient() {
  const { user } = useHydratedFan();
  const query = useFanLedgers();

  return (
    <div className="flex flex-col gap-7">
      <header>
        <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-1.5 text-[23px] font-bold tracking-[-0.03em] text-foreground">
          Hi {firstName(user?.name)}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your matchday and everything around it, in one place.
        </p>
      </header>

      {/* NEXT MATCH — the soonest upcoming match ticket order. */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-[15px] font-bold text-foreground">Your next match</h2>
          <Link
            href={Routes.dashboardTickets}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text"
          >
            All tickets
            <ChevronRight className="size-3" />
          </Link>
        </div>
        <NextMatch />
      </section>

      {/* TRAVEL ESSENTIALS — scenario 3, live today. */}
      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-[15px] font-bold text-foreground">Travel essentials</h2>
          <Link
            href={Routes.dashboardLedgers}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text"
          >
            View all
            <ChevronRight className="size-3" />
          </Link>
        </div>

        <QueryState
          query={query}
          /* Home shows what is still AHEAD of the fan, one per product — not
             the whole order history. Travel holds the full list. */
          select={d => essentials(d.data)}
          noun="bookings"
          endpoint="/v1/auth/ledgers"
          skeletonRows={2}
          emptyTitle="Nothing booked yet"
          emptyBody="Flights, stays and eSIMs you buy will show up here with your tickets and vouchers."
          emptyAction={
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
          }
        >
          {(rows: FanLedger[]) => (
            <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map(l => (
                <LedgerCard key={l.ledger_id} ledger={l} compact />
              ))}
            </div>
          )}
        </QueryState>
      </section>

      {/* ADD TO YOUR TRIP — what a fan does next, not what the app can do. */}
      <section>
        <h2 className="mb-3 font-heading text-[15px] font-bold text-foreground">Add to your trip</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {ADD_TO_TRIP.map(({ href, icon: Icon, title, sub }) => (
            <Link
              key={title}
              href={href}
              className="rounded-[20px] border border-border bg-card p-[15px] transition-colors hover:border-[var(--brand-edge)]"
            >
              <span className="flex size-[38px] items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
                <Icon className="size-[18px]" />
              </span>
              <p className="mt-3 font-heading text-[13.5px] font-bold text-foreground">{title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{sub}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* The first page is newest-ordered, so pick the soonest kick-off still ahead. */
function NextMatch() {
  const query = useMatchdayOrders(1);
  return (
    <QueryState
      query={query}
      select={d =>
        d.data.data
          .filter(o => !isPastMatch(o) && o.status !== "refunded")
          .sort((a, b) => new Date(a.event.date ?? 0).getTime() - new Date(b.event.date ?? 0).getTime())
          .slice(0, 1)
      }
      noun="tickets"
      endpoint="/v1/auth/matchday-orders"
      skeletonRows={1}
      emptyTitle="No upcoming match"
      emptyBody="When you buy tickets for a match, it shows up here with your seats and tickets."
      emptyAction={
        <Link
          href={Routes.matches}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
        >
          <Ticket className="size-3.5" />
          Browse fixtures
        </Link>
      }
    >
      {rows => <TicketOrderRow order={rows[0]} />}
    </QueryState>
  );
}
