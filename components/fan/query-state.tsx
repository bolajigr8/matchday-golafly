"use client";

import { Inbox, PlugZap, RefreshCw, TriangleAlert } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { fanApiMessage } from "@/services/fan-axios";
import { isEmailNotVerified } from "@/features/fan/verification";
import { VerifyEmailState } from "@/components/fan/verify-email-state";
import { cn } from "@/lib/utils";

/* Wraps a react-query result in the states from the design, so no fan screen
   has to reimplement them and none of them can be quietly forgotten.

   This is the card-list sibling of components/admin/query-table.tsx. The rules
   are the same and they matter MORE here, not less: a fan checking a booking
   on a train with two bars of signal is exactly who gets punished by a layout
   that collapses every time the query revalidates.

     loading  → skeleton at the real card height, so nothing shifts
     error    → the failing call and its status, because "something went
                wrong" gives a fan nothing to say to support
     empty    → invites, with real calls to action
     data     → the list, and on refetch an "Updating" pill while the content
                STAYS PUT

   `Unavailable` is deliberately a separate component rather than a fifth
   branch: "you have nothing" and "we cannot read your things yet" are
   different claims, and only one of them is the fan's fault. */

interface QueryStateProps<TRow, TData> {
  query: UseQueryResult<TData>;
  select: (data: TData) => TRow[];
  children: (rows: TRow[]) => React.ReactNode;
  /** Named in the error copy: "Couldn't load your bookings". */
  noun: string;
  endpoint: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
  /** Skeleton cards to show while loading. Match the real list length. */
  skeletonRows?: number;
}

export function QueryState<TRow, TData>({
  query,
  select,
  children,
  noun,
  endpoint,
  emptyTitle,
  emptyBody,
  emptyAction,
  skeletonRows = 3,
}: QueryStateProps<TRow, TData>) {
  if (query.isPending) return <ListSkeleton rows={skeletonRows} />;

  if (query.isError) {
    if (isEmailNotVerified(query.error)) return <VerifyEmailState />;
    const status = (query.error as { response?: { status?: number } })?.response?.status;
    return (
      <FanState
        icon={<TriangleAlert className="size-5" />}
        tone="danger"
        title={`Couldn’t load your ${noun}`}
        body={fanApiMessage(
          query.error,
          "Check your connection and try again. If it keeps happening, quote the reference below to support.",
        )}
      >
        <code className="mt-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          GET {endpoint}
          {status ? ` → ${status}` : ""}
        </code>
        <button
          type="button"
          onClick={() => query.refetch()}
          className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
        >
          <RefreshCw className="size-3.5" />
          Try again
        </button>
      </FanState>
    );
  }

  const rows = select(query.data);

  if (rows.length === 0) {
    return (
      <FanState icon={<Inbox className="size-5" />} title={emptyTitle} body={emptyBody}>
        {emptyAction && <div className="mt-4 flex flex-wrap justify-center gap-2">{emptyAction}</div>}
      </FanState>
    );
  }

  return (
    <div className="relative">
      {children(rows)}
      {/* The content stays. It never drops back to a skeleton — yanking away a
          booking reference someone is mid-read of, to show them a shimmer, is
          the worst thing this dashboard could do. */}
      {query.isFetching && (
        <span className="absolute -top-1 right-0 inline-flex h-[26px] items-center gap-1.5 rounded-full bg-card px-3 font-mono text-[9.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
          <RefreshCw className="size-3 animate-spin" />
          Updating
        </span>
      )}
    </div>
  );
}

/* ── Shared state box ───────────────────────────────────────────────────── */

export function FanState({
  icon,
  title,
  body,
  tone = "neutral",
  dashed,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "neutral" | "danger" | "warn";
  dashed?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-[28px] border bg-card px-6 py-10 text-center",
        dashed ? "border-dashed" : "border-solid",
        tone === "warn" ? "border-[var(--status-warn)]" : "border-border",
      )}
    >
      <span
        className={cn(
          "mb-1 flex size-13 items-center justify-center rounded-full",
          tone === "danger" && "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
          tone === "warn" && "bg-[var(--status-warn-bg)] text-[var(--status-warn)]",
          tone === "neutral" && "bg-muted text-muted-foreground",
        )}
        style={{ width: "52px", height: "52px" }}
      >
        {icon}
      </span>
      <p className="m-0 text-base font-bold text-foreground">{title}</p>
      <p className="m-0 max-w-[42ch] text-[13px] leading-relaxed text-muted-foreground">{body}</p>
      {children}
    </div>
  );
}

/* ── No endpoint ──────────────────────────────────────────────────────────
   For a destination whose backing service does not exist yet. Says so plainly
   instead of showing a convincing empty list. An empty state means "there is
   nothing here"; this means "we cannot see it yet", and conflating the two is
   how a dashboard quietly tells a fan they own nothing. */
export function Unavailable({
  what,
  body,
  endpoint,
  children,
}: {
  what: string;
  body: string;
  endpoint: string;
  children?: React.ReactNode;
}) {
  return (
    <FanState
      icon={<PlugZap className="size-5" />}
      tone="warn"
      dashed
      title={what}
      body={body}
    >
      <code className="mt-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
        {endpoint}
      </code>
      {children}
    </FanState>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────
   At the real card height, with varying line widths so it reads as content
   arriving rather than a progress bar that has stalled. */
function ListSkeleton({ rows }: { rows: number }) {
  const widths = ["46%", "62%", "38%", "55%"];
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-[28px] border border-border bg-card p-[18px]">
          <div className="flex gap-3.5">
            <span className="size-[38px] shrink-0 animate-pulse rounded-xl bg-muted" />
            <div className="flex-1 pt-1">
              <span
                className="block h-2.5 animate-pulse rounded-full bg-muted"
                style={{ width: widths[i % widths.length] }}
              />
              <span
                className="mt-2.5 block h-2 animate-pulse rounded-full bg-muted"
                style={{ width: widths[(i + 2) % widths.length] }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
