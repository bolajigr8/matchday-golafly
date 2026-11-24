import { cn } from "@/lib/utils";

/* Five reserved tones. Every domain status across the eight screens maps onto
   one of them — a new status picks a tone, it never introduces a colour.
   These are NOT the chart series colours: a green bar meaning "series 1"
   beside a green pill meaning "approved" is how a dashboard starts lying.

   Always a tinted ground + a dot + a text label, so status survives
   greyscale, forced-colors, and a colour-blind reviewer. */
export type StatusTone = "neutral" | "info" | "warn" | "good" | "danger";

const TONE: Record<StatusTone, string> = {
  neutral: "bg-status-neutral-bg text-status-neutral",
  info: "bg-status-info-bg text-status-info",
  warn: "bg-status-warn-bg text-status-warn",
  good: "bg-status-good-bg text-status-good",
  danger: "bg-status-danger-bg text-status-danger",
};

/* The mapping the whole dashboard shares. Anything not listed falls back to
   neutral, which is the correct default for an unrecognised state. */
const BY_LABEL: Record<string, StatusTone> = {
  approved: "good",
  active: "good",
  paid: "good",
  confirmed: "good",
  "tickets sent": "good",
  processing: "info",
  confirming: "info",
  "awaiting attendees": "info",
  "in progress": "info",
  "action required": "warn",
  initiated: "warn",
  "awaiting payment": "warn",
  "pending payment": "warn",
  "needs reconciliation": "warn",
  refunding: "warn",
  "manual review": "info",
  signed: "good",
  accepted: "good",
  published: "good",
  pending: "warn",
  "pending review": "warn",
  "needs revision": "danger",
  closing: "warn",
  refunded: "warn",
  "awaiting review": "warn",
  "under review": "info",
  scheduled: "info",
  rejected: "danger",
  failed: "danger",
  cancelled: "danger",
  expired: "danger",
  draft: "neutral",
  inactive: "neutral",
  archived: "neutral",
  closed: "neutral",

  /* Player availability. These are a different axis from approval state —
     they describe what the player is open to, not where they are in a
     pipeline — but they land in the same column, so they get tones that read
     as "available" rather than "approved". */
  "available for trials": "info",
  "open to opportunities": "info",
  "free agent": "neutral",
  "under contract": "good",
  "not available": "neutral",
  trialing: "info",
  scouted: "info",
};

export function toneFor(label: string): StatusTone {
  return BY_LABEL[label.toLowerCase()] ?? "neutral";
}

export function StatusPill({ label, tone }: { label: string; tone?: StatusTone }) {
  /* An absent status is not a status. Rendering "Pending" for a null field
     invents a state the record is not in — show the gap instead. */
  if (!label) {
    return <span className="font-mono text-[11px] text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        /* whitespace-nowrap because real statuses are long — "Available for
           Trials", "Open to Opportunities" — and a wrapped pill looks broken.
           The column sizes to the pill instead. */
        "inline-flex h-[21px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.07em]",
        TONE[tone ?? toneFor(label)],
      )}
    >
      <span className="size-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}
