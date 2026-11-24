"use client";

import { Search, TriangleAlert } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { fanApiMessage } from "@/services/fan-axios";
import { isEmailNotVerified } from "@/features/fan/verification";
import { VerifyEmailState } from "@/components/fan/verify-email-state";
import { cn } from "@/lib/utils";

/* The states every scouting screen shares.
 *
 * This file used to carry three more: MockDataBanner, NotBuiltYet and the
 * isNotBuilt() predicate that routed between them. They existed because the
 * scouting endpoints did not — every screen ran on fixtures and had to say so.
 * The endpoints ship now (/v1/scout/players and friends), the fixtures are
 * deleted, and a screen that cannot read its data says so plainly instead.
 *
 * What is left is the distinction that still matters: "we could not load this"
 * and "nothing matched your filters" are different sentences, and showing the
 * wrong one is the classic empty-state bug.
 */

/** A real failure, as opposed to an unbuilt one. Names the call and the status
 *  because the people using this dashboard also run the API. */
export function ScoutError({
  query,
  noun,
  endpoint,
}: {
  query: UseQueryResult<unknown>;
  noun: string;
  endpoint: string;
}) {
  if (isEmailNotVerified(query.error)) return <VerifyEmailState />;
  const status = (query.error as { response?: { status?: number } })?.response?.status;
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg bg-card px-6 py-12 text-center shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger)]">
        <TriangleAlert className="size-5" />
      </span>
      <p className="m-0 text-[15px] font-semibold">Couldn’t load {noun}</p>
      <p className="m-0 max-w-[46ch] text-[12px] leading-relaxed text-muted-foreground">
        {fanApiMessage(query.error, "Your drafts are saved and nothing has been lost.")}
      </p>
      <code className="mt-2 rounded-md bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
        {endpoint}
        {status ? ` → ${status}` : ""}
      </code>
      <button
        type="button"
        onClick={() => query.refetch()}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
      >
        Try again
      </button>
    </div>
  );
}

/** Nothing matched the filters — deliberately distinct from "nothing exists".
 *  The first invites you to loosen, the second invites you to create, and
 *  showing the wrong one is the classic empty-state bug. */
export function ScoutFilteredEmpty({
  total,
  noun,
  onClear,
}: {
  total: number;
  noun: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg bg-card px-6 py-12 text-center shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <span className="mb-1 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Search className="size-5" />
      </span>
      <p className="m-0 text-[15px] font-semibold">No {noun} match these filters</p>
      <p className="m-0 max-w-[44ch] text-[12px] leading-relaxed text-muted-foreground">
        You have {total} in total. Try loosening a filter.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

/* ── Small shared pieces ─────────────────────────────────────────────────── */

/** Section wrapper matching the design cards' page rhythm. */
export function ScoutSection({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-3", className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="m-0 text-[13px] font-semibold">{title}</h2>}
            {subtitle && (
              <p className="m-0 mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Where a set of rows came from. Every surface that renders template-driven
 *  attributes carries one, because "these seven attributes" is a configuration
 *  answer, not a design one. */
export function TemplateSource({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted px-2.5 py-2 text-[10.5px] leading-snug text-muted-foreground">
      {children}
    </p>
  );
}
