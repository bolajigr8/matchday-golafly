"use client";

import { isEmailNotVerified } from "@/features/fan/verification";
import { VerifyEmailState } from "@/components/fan/verify-email-state";
import { useState } from "react";
import { Download, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { FanState, Unavailable } from "@/components/fan/query-state";
import { useOwnPlayer } from "@/features/player/hooks";
import { downloadPlayerCv } from "@/lib/player-cv";
import publicAxios from "@/services/golafly-public-axios";
import type { ApiPlayer } from "@/services/players";
import { cn } from "@/lib/utils";

/* Shared pieces of the player dashboard. */

/** Renders its children with the signed-in player's record, and every other
 *  state — loading, not linked, failed — in the fan dashboard's own terms. */
export function PlayerGate({ children }: { children: (player: ApiPlayer) => React.ReactNode }) {
  const { query, player, hasHydrated, linked } = useOwnPlayer();

  if (!hasHydrated || (linked && query.isPending)) {
    return (
      <div className="flex flex-col gap-3.5" aria-hidden>
        <div className="h-[120px] animate-pulse rounded-[20px] bg-muted" />
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="h-[150px] animate-pulse rounded-[20px] bg-muted" />
          <div className="h-[150px] animate-pulse rounded-[20px] bg-muted" />
        </div>
      </div>
    );
  }

  if (!linked) {
    return (
      <Unavailable
        what="Your player profile isn’t connected yet"
        body="This account isn’t linked to a Golafly player record, so there’s nothing to show here yet."
        endpoint="Needs player_id on the POST /v1/auth/login user"
      />
    );
  }

  if (query.isError && isEmailNotVerified(query.error)) return <VerifyEmailState />;
  if (query.isError || !player) {
    const status = (query.error as { response?: { status?: number } } | null)?.response?.status;
    return (
      <FanState
        icon={<TriangleAlert className="size-5" />}
        tone="danger"
        title="Couldn’t load your profile"
        body="Check your connection and try again."
      >
        <code className="mt-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
          GET /v1/players/{"{id}"}
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

  return <>{children(player)}</>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[23px] font-bold tracking-[-0.03em] text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function DownloadCvButton({
  player,
  variant = "primary",
}: {
  player: ApiPlayer;
  variant?: "primary" | "outline";
}) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      /* Fresh record first: a scout may have evaluated since this page
         loaded, and the CV should carry the latest scores. Falls back to the
         copy on screen if that request fails. */
      const fresh = await publicAxios
        .get<{ data: ApiPlayer }>(`/v1/players/${player.id}`)
        .then(r => ({ ...player, ...r.data.data }))
        .catch(() => player);
      await downloadPlayerCv(fresh);
    } catch {
      toast.error("Could not generate your CV. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void download()}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13px] disabled:opacity-60",
        variant === "primary"
          ? "bg-brand font-heading font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
          : "font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent",
      )}
    >
      {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
      {busy ? "Preparing…" : "Download CV"}
    </button>
  );
}

/** A titled card of label/value rows — the ledger detail card, reused. */
export function InfoCard({
  title,
  rows,
  className,
}: {
  title: string;
  rows: [string, React.ReactNode][];
  className?: string;
}) {
  return (
    <section className={cn("rounded-[20px] border border-border bg-card p-[18px]", className)}>
      <h2 className="font-heading text-[14px] font-bold text-foreground">{title}</h2>
      <dl className="mt-3 flex flex-col">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 border-b border-[var(--edge)] py-2.5 last:border-b-0"
          >
            <dt className="font-mono text-[11px] text-muted-foreground">{label}</dt>
            <dd className="m-0 max-w-[62%] break-words text-right text-[13px] text-foreground">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ── Formatting ───────────────────────────────────────────────────────── */

export const dash = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : "—";
  if (typeof v === "string") {
    /* Several registration fields arrive as JSON-encoded lists. */
    const t = v.trim();
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return dash(parsed);
      } catch {
        /* plain string */
      }
    }
    return v;
  }
  if (typeof v === "object") return "—";
  return String(v);
};

export function ageFrom(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) {
    age -= 1;
  }
  return age;
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
