"use client";

import Link from "next/link";
import { ChevronRight, Clock, MapPin, Ticket } from "lucide-react";
import { FanPill } from "@/components/fan/ledger-card";
import { fanCountdown, fanDate } from "@/features/fan/ledgers";
import { orderMoney, orderStatus, seatLine, type MatchdayOrder } from "@/features/fan/tickets";
import { Routes } from "@/routes";
import { formatKickoffTime, parseEventDate } from "@/features/matchday/format";

/* One match ticket order as a card — the Tickets list and Home's "Your next
   match" use the same one. Opens the order, where the tickets are. */

const DAY = new Intl.DateTimeFormat("en-GB", { day: "2-digit" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short" });

export function TicketOrderRow({ order: o }: { order: MatchdayOrder }) {
  const status = orderStatus(o);
  const kickoff = o.event.date ? parseEventDate(o.event.date) : null;
  const countdown = fanCountdown(o.event.date);
  const venue = [o.event.venue_name, o.event.venue_city].filter(Boolean).join(", ");

  return (
    <Link
      href={Routes.dashboardTicket(o.id)}
      className="group flex items-center gap-4 rounded-[20px] border border-border bg-card p-[15px] transition-colors hover:border-[var(--brand-edge)]"
    >
      <span className="flex w-[52px] shrink-0 flex-col items-center rounded-2xl border border-[var(--edge)] bg-muted py-2">
        <b className="font-heading text-[20px] leading-none text-foreground">{kickoff ? DAY.format(kickoff) : "—"}</b>
        <i className="mt-1 font-mono text-[10px] not-italic uppercase tracking-[0.1em] text-muted-foreground">
          {kickoff ? MONTH.format(kickoff) : ""}
        </i>
      </span>

      <div className="min-w-0 flex-1">
        {venue && (
          <p className="flex items-center gap-1 truncate font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {venue}
          </p>
        )}
        <p className="mt-1 truncate font-heading text-[15px] font-bold text-foreground">{o.event.name}</p>
        <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-muted-foreground">
          {kickoff && (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {formatKickoffTime(o.event.date)}
              {countdown ? ` · ${countdown}` : ` · ${fanDate(o.event.date)}`}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Ticket className="size-3" />
            {seatLine(o.ticket)}
          </span>
        </p>
        {/* Status stays visible on a phone, where the right column is hidden. */}
        <span className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
          <FanPill tone={status.tone}>{status.label}</FanPill>
          {o.reference && (
            <span className="font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">{o.reference}</span>
          )}
        </span>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
        <FanPill tone={status.tone}>{status.label}</FanPill>
        <span className="text-[12px] font-semibold text-foreground">{orderMoney(o)}</span>
        {o.reference && (
          <span className="font-mono text-[10.5px] tracking-[0.04em] text-muted-foreground">{o.reference}</span>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
