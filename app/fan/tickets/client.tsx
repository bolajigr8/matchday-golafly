"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Ticket } from "lucide-react";
import { QueryState } from "@/components/fan/query-state";
import { TicketOrderRow } from "@/components/fan/ticket-order-row";
import { isPastMatch, useMatchdayOrders, type MatchdayOrder } from "@/features/fan/tickets";
import { Routes } from "@/routes";
import { cn } from "@/lib/utils";

/* MATCH TICKETS — design/src/fan/05-screen-tickets.html.
 *
 * GET /v1/auth/matchday-orders: paid orders only (paid, refunding, refunded),
 * newest first, 15 a page. Upcoming / Past split the loaded pages by kick-off;
 * "Load more" pulls the next page into the same list. Each row opens the order,
 * where the tickets themselves live. */

type Tab = "upcoming" | "past";

const TABS: { tab: Tab; label: string }[] = [
  { tab: "upcoming", label: "Upcoming" },
  { tab: "past", label: "Past" },
];


export default function TicketsClient() {
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "past" ? "past" : "upcoming";
  const pages = Math.max(1, Number(searchParams.get("pages")) || 1);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[23px] font-bold tracking-[-0.03em] text-foreground">Tickets</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your match tickets — order status, seats, and the tickets to take to the stadium.
        </p>
      </header>

      <div className="flex gap-5 border-b border-[var(--edge)]">
        {TABS.map(t => (
          <Link
            key={t.tab}
            href={t.tab === "upcoming" ? Routes.dashboardTickets : `${Routes.dashboardTickets}?tab=past`}
            className={cn(
              "relative pb-2.5 text-[13px] transition-colors",
              tab === t.tab ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.tab && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />}
          </Link>
        ))}
      </div>

      <OrderPages tab={tab} pages={pages} />
    </div>
  );
}

/* One query per loaded page, rendered as one list. The pages already fetched
   stay cached, so "Load more" only ever asks for the newest page. */
function OrderPages({ tab, pages }: { tab: Tab; pages: number }) {
  const first = useMatchdayOrders(1);
  const last = first.data?.data.last_page ?? 1;

  return (
    <QueryState
      query={first}
      select={d => d.data.data}
      noun="tickets"
      endpoint="/v1/auth/matchday-orders"
      emptyTitle="No match tickets yet"
      emptyBody="Tickets you buy for a match show up here, with your seats and the tickets to take to the stadium."
      emptyAction={
        <Link
          href={Routes.matches}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
        >
          <Ticket className="size-3.5" />
          Browse fixtures
        </Link>
      }
    >
      {firstRows => (
        <>
          <OrderList tab={tab} rows={firstRows} />
          {Array.from({ length: Math.min(pages, last) - 1 }, (_, i) => (
            <MorePage key={i + 2} page={i + 2} tab={tab} />
          ))}
          {pages < last && (
            <Link
              href={`${Routes.dashboardTickets}?${new URLSearchParams({
                ...(tab === "past" ? { tab } : {}),
                pages: String(pages + 1),
              })}`}
              scroll={false}
              className="mx-auto mt-4 flex h-9 w-fit items-center rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
            >
              Load more
            </Link>
          )}
        </>
      )}
    </QueryState>
  );
}

function MorePage({ page, tab }: { page: number; tab: Tab }) {
  const query = useMatchdayOrders(page);
  if (query.isPending) return <div className="mt-3 h-[92px] animate-pulse rounded-[20px] bg-muted" />;
  if (!query.data) return null;
  return (
    <div className="mt-3">
      <OrderList tab={tab} rows={query.data.data.data} />
    </div>
  );
}

function OrderList({ tab, rows }: { tab: Tab; rows: MatchdayOrder[] }) {
  const shown = rows.filter(o => (tab === "past" ? isPastMatch(o) : !isPastMatch(o)));
  if (shown.length === 0) {
    return (
      <p className="rounded-[20px] border border-dashed border-border px-5 py-8 text-center text-[13px] text-muted-foreground">
        {tab === "past" ? "No past matches here." : "No upcoming matches here — check Past."}
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {shown.map(o => (
        <li key={o.id}>
          <TicketOrderRow order={o} />
        </li>
      ))}
    </ul>
  );
}
