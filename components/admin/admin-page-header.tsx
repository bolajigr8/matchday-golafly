"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/* Row 1 breadcrumb + primary action, row 2 title + stat dots, row 3 tabs.
   Sticky, because with no top bar a primary action that scrolls away is the
   main failure mode of this layout. It carries no border at rest and gains a
   hairline only once content passes under it. */

export interface HeaderStat {
  label: string;
  /* A --status-* or --chart-* token name, e.g. "var(--status-good)". Omit for
     a plain muted dot. */
  tone?: string;
}

export interface HeaderTab {
  label: string;
  href: string;
  active?: boolean;
}

interface AdminPageHeaderProps {
  crumbs: string[];
  title: string;
  stats?: HeaderStat[];
  tabs?: HeaderTab[];
  action?: React.ReactNode;
  onOpenNav?: () => void;
}

export function AdminPageHeader({
  crumbs,
  title,
  stats,
  tabs,
  action,
  onOpenNav,
}: AdminPageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/90 px-4 pt-3 backdrop-blur lg:px-[18px]">
      {/* min-h-8 = the height of an action button, so row 1 is the same height
          whether a page has one or not. Without it the header shrank on
          Partner applications and grew again on Players, and the whole page
          jumped as you moved between them. */}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenNav && (
            <button
              type="button"
              onClick={onOpenNav}
              className="flex size-[30px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="size-[15px]" />
            </button>
          )}
          <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {crumbs.map((c, i) => (
              <span key={`${i}-${c}`} className={cn(i === crumbs.length - 1 && "text-foreground")}>
                {i > 0 && <span className="px-1.5 text-muted-foreground">/</span>}
                {c}
              </span>
            ))}
          </p>
        </div>
        <span data-print-hide>{action}</span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
        {stats && stats.length > 0 && (
          <span className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
            {stats.map(s => (
              <span key={s.label} className="flex items-center gap-1.5 tabular-nums">
                <i
                  className="inline-block size-1.5 rounded-full"
                  style={{ background: s.tone ?? "var(--muted-foreground)" }}
                />
                {s.label}
              </span>
            ))}
          </span>
        )}
      </div>

      {tabs && tabs.length > 0 ? (
        <div data-print-hide className="mt-3 flex gap-[18px] border-b border-[var(--edge)]">
          {tabs.map(t => (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative pb-2.5 text-[12.5px] transition-colors",
                t.active
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-3" />
      )}
    </div>
  );
}
