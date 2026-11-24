"use client";

import { useSearchParams } from "next/navigation";
import { CircleAlert, Calendar, Ticket, TrendingUp } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { StatCard } from "@/components/admin/admin-ui";
import { UnavailableTab } from "@/components/admin/unavailable-tab";
import { EM_DASH } from "@/features/admin/overview";
import { Routes } from "@/routes";

/* Match-ticket inventory — fixtures, listings, allocations.
 *
 * This page exists because Orders cannot answer its question. Orders is a
 * ledger: one row per thing SOLD. Inventory is the inverse — what is still
 * UNSOLD, and how long is left to sell it. No amount of filtering a ledger
 * produces a row for a seat nobody has bought yet.
 *
 * NOTHING here is wired up, because there is no backend at all:
 * features/tickets/api.ts is a deliberate mock and store/matchday.ts is
 * static seed data. The design is in the design system as
 * `screens/31-screen-matchday.html`; the contract that would fill it is in
 * design/tickets-endpoint.md.
 *
 * The stat row renders em-dashes rather than zeroes, and the body says
 * plainly that the endpoint is missing rather than showing a convincing
 * empty table. "There is no data" and "there is no endpoint" are different
 * claims, and conflating them is how a dashboard quietly lies. */

const TABS = [
  {
    tab: "fixtures",
    label: "Fixtures",
    what: "Fixture inventory",
    detail:
      "Needs GET /v1/tickets/fixtures — kickoff, allocation held, sold, unsold, revenue and fulfilment per fixture. Sell-through against a deadline is the whole point of this page, and none of it can be derived from the order ledger.",
  },
  {
    tab: "listings",
    label: "Listings",
    what: "Listings",
    detail:
      "Needs the per-fixture listing breakdown from GET /v1/tickets/fixtures — category, block, row, price and seller (our own verified inventory vs official-partner listings).",
  },
  {
    tab: "allocations",
    label: "Allocations",
    what: "Allocations",
    detail:
      "Needs `confirmed_with_seller` on GET /v1/tickets/fixtures. Without it the Overview cannot flag allocations still unconfirmed as kickoff approaches, which is the one ticket row missing from its attention queue.",
  },
] as const;

type Tab = (typeof TABS)[number]["tab"];

export default function TicketsClient() {
  const { openNav } = useAdminNav();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "fixtures";
  const active = TABS.find(t => t.tab === tab) ?? TABS[0];

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Tickets", active.label]}
        title="Tickets"
        stats={[{ label: "Awaiting endpoint", tone: "var(--status-warn)" }]}
        tabs={TABS.map(t => ({
          label: t.label,
          href:
            t.tab === "fixtures"
              ? Routes.adminTickets
              : Routes.adminWithTab(Routes.adminTickets, t.tab),
          active: tab === t.tab,
        }))}
        onOpenNav={openNav}
      />

      <div className="flex flex-col gap-4 px-4 pb-5 pt-3 lg:px-[18px]">
        {/* The shape of the page that is coming. Em-dashes, never zeroes —
            "0 fixtures on sale" is a claim about the business; this is a
            claim about the plumbing. */}
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatCard
            label="Fixtures on sale"
            icon={<Calendar className="size-3" />}
            value={EM_DASH}
            delta="next kickoff"
          />
          <StatCard
            label="Seats held"
            icon={<Ticket className="size-3" />}
            value={EM_DASH}
            delta="sold · unsold"
          />
          <StatCard
            label="Sell-through"
            icon={<TrendingUp className="size-3" />}
            value={EM_DASH}
            delta="vs last month"
          />
          <StatCard
            label="Unfulfilled"
            icon={<CircleAlert className="size-3" />}
            value={EM_DASH}
            delta="paid, not yet issued"
          />
        </div>

        <UnavailableTab what={active.what} detail={active.detail} />
      </div>
    </>
  );
}
