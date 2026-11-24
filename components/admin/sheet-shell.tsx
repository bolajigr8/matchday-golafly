"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/* The single slideout shell. Every sheet in the admin — detail, form, review —
   renders through this, so they are identical: same width, same two-line
   header, same close affordance, same sticky footer.
 *
 * They used to be two components that had drifted apart (380px vs 440px, and
 * different header markup), which is exactly the kind of thing that makes a
 * dashboard feel assembled rather than designed. */

interface SheetShellProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tabs?: { label: string; active?: boolean; onSelect?: () => void }[];
  /* Forms need a little more room for two-column field pairs; everything else
     uses the default. */
  wide?: boolean;
}

export function SheetShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  tabs,
  wide,
}: SheetShellProps) {
  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-foreground/20"
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-card shadow-[-1px_0_0_0_var(--edge),var(--lift-3)]",
          wide ? "max-w-[440px]" : "max-w-[400px]",
        )}
      >
        <div className="flex items-start justify-between gap-2.5 border-b border-[var(--edge)]">
          <div className="min-w-0 px-4 py-3">
            <p className="truncate text-sm font-semibold">{title}</p>
            {subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="m-3 flex size-[30px] shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="flex gap-[18px] border-b border-[var(--edge)] px-4">
            {tabs.map(t => (
              <button
                key={t.label}
                type="button"
                onClick={t.onSelect}
                className={cn(
                  "relative pb-2.5 pt-2 text-[12.5px] transition-colors",
                  t.active
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {t.active && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* min-w-0 on the scroll container AND [&>*]:min-w-0 on its children:
            a flex item defaults to min-width:auto, so long prose refuses to
            shrink below its content width and the sheet scrolls sideways. */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [&>*]:min-w-0">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--edge)] p-3">{footer}</div>
        )}
      </aside>
    </>
  );
}

/* Section caption — a hairline with a mono label, never a card inside a card. */
export function SheetSection({
  title,
  action,
  children,
}: {
  title: string;
  /** A small action that belongs to this section, on the caption's right —
   *  keeps section-specific buttons out of the sheet footer. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex min-h-[26px] items-center justify-between gap-2 border-b border-[var(--edge)] pb-1.5">
        <p className="m-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

/* Definition list — mono label, value on the right.
 *
 * Both tracks are minmax(0,…) and both cells are min-w-0: a grid item defaults
 * to min-width:auto, so one long unbreakable value — and custom details carry
 * arbitrary API strings, often URLs — refuses to shrink, widens the 1fr track
 * past the sheet, and drags the whole panel sideways.
 *
 * break-words rather than anywhere: ordinary prose still breaks at spaces, and
 * only a token that genuinely cannot fit is split. */
export function SheetFacts({
  facts,
  stacked,
}: {
  facts: [string, React.ReactNode][];
  /* For arbitrary API-supplied keys (custom details, custom attributes) rather
     than our own fixed labels. `what_is_included` in a 104px mono column wraps
     to three lines and leaves the value stranded beside it; stacking puts the
     label on its own line and gives the value the full width. */
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <dl className="m-0 flex min-w-0 flex-col gap-2.5 text-xs">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="mb-0.5 break-words font-mono text-[9.5px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
              {humanizeKey(k)}
            </dt>
            <dd className="m-0 min-w-0 break-words text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className="grid grid-cols-[minmax(0,104px)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
      {facts.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="min-w-0 break-words pt-0.5 font-mono text-[9.5px] font-semibold uppercase leading-[1.5] tracking-[0.11em] text-muted-foreground">
            {k}
          </dt>
          <dd className="m-0 min-w-0 break-words text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* `what_is_included` / `matchTicketTier` → "What is included" / "Match ticket
   tier". The API's custom-detail keys are whatever the author typed, in either
   convention. */
function humanizeKey(key: string): string {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
