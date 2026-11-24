"use client";

import Link from "next/link";
import { BedDouble, Calendar, ChevronRight, Plane, Ticket, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FAN_KIND_LABEL,
  fanMeta,
  fanMoney,
  fanStatus,
  fanTitle,
  type FanTone,
} from "@/features/fan/ledgers";
import type { FanLedger, FanLedgerType } from "@/features/fan/types";
import { Routes } from "@/routes";

/* One order, as a card. Used by Ledgers and by Home's essentials row, so a
   booking looks the same wherever a fan meets it — and opens the same detail
   page from either. */

export const KIND_ICON: Record<FanLedgerType, React.ComponentType<{ className?: string }>> = {
  flight: Plane,
  stays: BedDouble,
  esim: Wifi,
};

const TONE_CLASS: Record<FanTone, string> = {
  good: "bg-[var(--status-good-bg)] text-[var(--status-good)]",
  warn: "bg-[var(--status-warn-bg)] text-[var(--status-warn)]",
  danger: "bg-[var(--status-danger-bg)] text-[var(--status-danger)]",
  info: "bg-[var(--status-info-bg)] text-[var(--status-info)]",
  neutral: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral)]",
};

/** Status is never colour alone — the label ships with every pill. */
export function FanPill({ tone, children }: { tone: FanTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[23px] shrink-0 items-center gap-1.5 rounded-full px-2.5 font-mono text-[10px] font-bold tracking-[0.05em]",
        TONE_CLASS[tone],
      )}
    >
      <i className="size-[5px] rounded-full bg-current" />
      {children}
    </span>
  );
}

export function LedgerCard({ ledger, compact }: { ledger: FanLedger; compact?: boolean }) {
  const Icon = KIND_ICON[ledger.ledger_type];
  const status = fanStatus(ledger);
  const meta = fanMeta(ledger);
  const href = Routes.dashboardLedger(ledger.ledger_id);

  if (compact) {
    return (
      <Link
        href={href}
        className="flex flex-col rounded-[20px] border border-border bg-card p-[15px] transition-colors hover:border-[var(--brand-edge)]"
      >
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex size-[38px] items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
            <Icon className="size-[18px]" />
          </span>
          <FanPill tone={status.tone}>{status.label}</FanPill>
        </div>
        <p className="mt-3 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          {FAN_KIND_LABEL[ledger.ledger_type]}
        </p>
        <p className="mt-1.5 truncate font-heading text-[15px] font-bold text-foreground">
          {fanTitle(ledger)}
        </p>
        {meta[0] && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            <span className="truncate">{meta[0]}</span>
          </p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-text">
          View details
          <ChevronRight className="size-3" />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="grid grid-cols-[38px_1fr] items-start gap-4 rounded-[28px] border border-border bg-card p-[18px] transition-colors hover:border-[var(--brand-edge)] sm:grid-cols-[38px_1fr_auto]"
    >
      <span className="flex size-[38px] items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
        <Icon className="size-[18px]" />
      </span>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="m-0 font-heading text-[15px] font-bold text-foreground">
            {fanTitle(ledger)}
          </p>
          <FanPill tone={status.tone}>{status.label}</FanPill>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {meta.map(m => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>

      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:flex-col sm:items-end sm:justify-start">
        {/* Per-order currency, never a page-level one. */}
        <p className="m-0 font-mono text-[13px] font-bold tabular-nums text-foreground">
          {fanMoney(ledger)}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-text">
          View details
          <ChevronRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

/** Small helper for the Home hero and the Tickets page. */
export function TicketGlyph({ className }: { className?: string }) {
  return <Ticket className={className} />;
}
