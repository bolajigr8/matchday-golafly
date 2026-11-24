"use client";

import { isEmailNotVerified } from "@/features/fan/verification";
import { VerifyEmailState } from "@/components/fan/verify-email-state";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock,
  Copy,
  CreditCard,
  Download,
  FileText,
  LoaderCircle,
  MapPin,
  Smartphone,
  Ticket,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { FanPill } from "@/components/fan/ledger-card";
import { fanCountdown, fanDate } from "@/features/fan/ledgers";
import {
  downloadTicketFile,
  fieldLabel,
  orderMoney,
  orderStatus,
  seatLine,
  useMatchdayOrder,
  useOrderTickets,
  useSubmitAttendees,
  type AttendeeField,
  type MatchdayOrder,
  type OrderTicket,
} from "@/features/fan/tickets";
import { fanApiMessage } from "@/services/fan-axios";
import { Routes } from "@/routes";
import { isTimeTba, parseEventDate } from "@/features/matchday/format";
import { cn } from "@/lib/utils";
import { PriceBreakdownRows } from '@/components/price/price-rows'
import {
  normalizeDiscount,
  normalizePriceBreakdown,
} from '@/features/price-breakdown/helpers'

/* ONE MATCH TICKET ORDER (Ticket dashboards contract §3).
 *
 * Order first (GET /v1/auth/matchday-orders/{id}). Only a tickets_sent order
 * whose tickets_available is true asks for its tickets — for every other state
 * the status message IS the content. action_required renders the ticket-holder
 * form straight from attendees_required. There is no "resend ticket email":
 * the fan re-downloads files or opens phone tickets here instead. */

/* Date only — the kick-off time is added separately so an unknown time
   reads "time TBA" (features/matchday/format.ts isTimeTba). */
const KICKOFF_DATE = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

const KICKOFF = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const BTN_OUTLINE =
  "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent disabled:opacity-55";
const BTN_BRAND =
  "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-4 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] disabled:opacity-55";

export default function TicketOrderClient({ id }: { id: number }) {
  const query = useMatchdayOrder(id);
  const order = query.data?.data;

  const back = (
    <Link
      href={Routes.dashboardTickets}
      className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Back to tickets
    </Link>
  );

  if (query.isPending && Number.isFinite(id)) {
    return (
      <div className="flex flex-col gap-5">
        {back}
        <div className="h-24 animate-pulse rounded-[20px] bg-muted" />
        <div className="h-48 animate-pulse rounded-[20px] bg-muted" />
      </div>
    );
  }

  if (!order) {
    const status = (query.error as { response?: { status?: number } } | null)?.response?.status;
    return (
      <div className="flex flex-col gap-5">
        {back}
        <div className="rounded-[20px] border border-border bg-card px-5 py-12 text-center">
          <CircleAlert className="mx-auto size-6 text-[var(--status-danger)]" />
          <p className="mt-3 text-[13px] text-foreground">
            {status === 404 || !Number.isFinite(id)
              ? "Order not found. It may not be on this account."
              : "Couldn’t load this order. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const status = orderStatus(order);
  const kickoff = order.event.date ? parseEventDate(order.event.date) : null;
  const timeTba = isTimeTba(order.event.date);
  const countdown = fanCountdown(order.event.date);
  const venue = [order.event.venue_name, order.event.venue_city].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-5">
      {back}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
            <Ticket className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="text-balance text-[21px] font-bold tracking-[-0.03em] text-foreground">
              {order.event.name}
            </h1>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-[12.5px] text-muted-foreground">
              {kickoff && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  {timeTba ? `${KICKOFF_DATE.format(kickoff)}, time TBA` : KICKOFF.format(kickoff)}
                  {countdown ? ` · ${countdown}` : ""}
                </span>
              )}
              {venue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3" />
                  {venue}
                </span>
              )}
            </p>
            {order.reference && <BookingRef reference={order.reference} />}
          </div>
        </div>
        <FanPill tone={status.tone}>{status.label}</FanPill>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Seats", value: seatLine(order.ticket) },
          { label: "Ticket type", value: order.ticket.ticket_type ? fieldLabel(order.ticket.ticket_type.toLowerCase()) : "—" },
          { label: "Paid", value: orderMoney(order) },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
            <p className="mt-1 truncate font-heading text-[15px] font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </section>

      {order.status === "action_required" && order.attendees_required.length > 0 ? (
        <AttendeeForm order={order} />
      ) : order.status === "tickets_sent" && order.tickets_available ? (
        <TicketsSection orderId={order.id} />
      ) : (
        <p
          className={cn(
            "flex items-start gap-2 rounded-2xl px-4 py-3 text-[12.5px]",
            status.tone === "danger"
              ? "bg-[var(--status-danger-bg)] text-[var(--status-danger)]"
              : "bg-muted text-foreground",
          )}
        >
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          {status.body}
        </p>
      )}

      {normalizePriceBreakdown(order.price_breakdown) && (
        <section className="rounded-[20px] border border-border bg-card p-[18px]">
          <h2 className="flex items-center gap-2 font-heading text-[14px] font-bold text-foreground">
            <CreditCard className="size-4 text-brand-text" />
            Price breakdown
          </h2>
          {/* total is BEFORE the discount; the component subtracts it. */}
          <PriceBreakdownRows
            className="mt-3.5"
            breakdown={order.price_breakdown}
            discount={normalizeDiscount(order.discount)}
            totalLabel="Total paid"
          />
        </section>
      )}

      <section className="rounded-[20px] border border-border bg-card p-[18px]">
        <h2 className="flex items-center gap-2 font-heading text-[14px] font-bold text-foreground">
          <CreditCard className="size-4 text-brand-text" />
          Order
        </h2>
        <dl className="mt-3.5 flex flex-col">
          {[
            ["Booking reference", order.reference || `#${order.id}`],
            ["Ordered", fanDate(order.created_at) || "—"],
            ["Paid on", fanDate(order.paid_at) || "—"],
            ["Tickets issued", fanDate(order.tickets_sent_at) || "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 border-b border-[var(--edge)] py-2.5 last:border-b-0">
              <dt className="font-mono text-[11px] text-muted-foreground">{k}</dt>
              <dd className="m-0 text-right text-[13px] text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="pb-2 text-center text-[12px] text-muted-foreground">
        Something wrong with this order?{" "}
        <Link href={Routes.helpFaqs} className="font-semibold text-brand-text hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}

/* ── Tickets ──────────────────────────────────────────────────────────── */

function TicketsSection({ orderId }: { orderId: number }) {
  const query = useOrderTickets(orderId, true);
  const data = query.data?.data;

  if (query.isPending) return <div className="h-40 animate-pulse rounded-[20px] bg-muted" />;
  if (query.isError && isEmailNotVerified(query.error)) return <VerifyEmailState />;
  if (query.isError || !data) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-[var(--status-danger-bg)] px-4 py-3 text-[12.5px] text-[var(--status-danger)]">
        <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
        {fanApiMessage(query.error, "Couldn’t load your tickets. Please try again.")}
      </p>
    );
  }
  if (!data.available || (data.tickets.length === 0 && data.instructions.length === 0)) {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-muted px-4 py-3 text-[12.5px] text-foreground">
        <Clock className="mt-0.5 size-3.5 shrink-0" />
        Your tickets aren’t available to open yet. They appear here as soon as they’re issued.
      </p>
    );
  }

  return (
    <section className="rounded-[20px] border border-border bg-card p-[18px]">
      <h2 className="flex items-center gap-2 font-heading text-[14px] font-bold text-foreground">
        <Ticket className="size-4 text-brand-text" />
        Your tickets
      </h2>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Download your tickets again or open them on your phone at any time.
      </p>
      <ul className="m-0 mt-3 flex list-none flex-col p-0">
        {data.tickets.map((t, i) => (
          <li key={t.type === "file" ? t.checksum : `${t.label}-${i}`} className="border-b border-[var(--edge)] py-3 last:border-b-0">
            {t.type === "file" ? <FileTicket ticket={t} /> : <LinkTicket ticket={t} />}
          </li>
        ))}
      </ul>

      {data.instructions.length > 0 && (
        <div className="mt-4 rounded-2xl bg-muted px-4 py-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            From the venue
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.instructions.map((ins, i) => (
              <DownloadButton
                key={ins.checksum}
                url={ins.download_url}
                fallback={`instructions-${i + 1}.${ins.format}`}
                label={data.instructions.length > 1 ? `Entry instructions ${i + 1}` : "Entry instructions"}
                icon={<FileText className="size-3.5" />}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* The booking reference with a copy button — what support asks for. */
function BookingRef({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Couldn’t copy. Select the reference and copy it by hand.");
    }
  };
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
      Booking ref
      <span className="select-all font-mono font-semibold tracking-[0.04em] text-foreground">{reference}</span>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Copied" : "Copy booking reference"}
        className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-[var(--status-good)]" /> : <Copy className="size-3.5" />}
      </button>
    </p>
  );
}

function TicketLabel({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="min-w-0">
      {/* The label as sent: "Ticket 1 - Seun Mick", or just "Ticket 1". Never
          a name guessed from elsewhere. */}
      <p className="truncate text-[13.5px] font-semibold text-foreground">{label}</p>
      <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">{sub}</p>
    </div>
  );
}

function FileTicket({ ticket }: { ticket: Extract<OrderTicket, { type: "file" }> }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <TicketLabel label={ticket.label} sub={`${ticket.format} file`} />
      <DownloadButton
        url={ticket.download_url}
        fallback={`ticket.${ticket.format}`}
        label="Download"
        icon={<Download className="size-3.5" />}
        brand
      />
    </div>
  );
}

function DownloadButton({
  url,
  fallback,
  label,
  icon,
  brand,
}: {
  url: string;
  fallback: string;
  label: string;
  icon: React.ReactNode;
  brand?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await downloadTicketFile(url, fallback);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={() => void run()} disabled={busy} className={brand ? BTN_BRAND : BTN_OUTLINE}>
      {busy ? <LoaderCircle className="size-3.5 animate-spin" /> : icon}
      {busy ? "Downloading…" : label}
    </button>
  );
}

/* A phone ticket. One `url` works on every device; otherwise both store links
   are offered, and the holder's own phone (os) is the highlighted one. */
function LinkTicket({ ticket }: { ticket: Extract<OrderTicket, { type: "link" }> }) {
  const links = ticket.url
    ? [{ key: "any", label: "Open ticket", href: ticket.url, primary: true }]
    : [
        ticket.ios && { key: "ios", label: "iPhone", href: ticket.ios, primary: ticket.os === "ios" },
        ticket.android && { key: "android", label: "Android", href: ticket.android, primary: ticket.os === "android" },
      ].filter((l): l is { key: string; label: string; href: string; primary: boolean } => !!l);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <TicketLabel label={ticket.label} sub="Mobile ticket" />
      <div className="flex flex-wrap gap-2">
        {links.length === 0 && <span className="text-[12px] text-muted-foreground">Link not issued yet</span>}
        {links.map(l => (
          <a
            key={l.key}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={l.primary || links.length === 1 ? BTN_BRAND : BTN_OUTLINE}
          >
            <Smartphone className="size-3.5" />
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Ticket-holder details (action_required) ───────────────────────────── */

const INPUT =
  "h-11 w-full rounded-[14px] border border-[var(--edge-strong)] bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-[var(--brand-edge)] focus:shadow-[0_0_0_3px_var(--brand-glow)]";

const INPUT_TYPE: Record<string, string> = { DATE: "date", EMAIL: "email", PHONE: "tel", TEXT: "text" };

function AttendeeForm({ order }: { order: MatchdayOrder }) {
  const fields = order.attendees_required;
  const count = Math.max(1, order.ticket.quantity);
  const [values, setValues] = useState<Record<string, string>[]>(() =>
    Array.from({ length: count }, () => Object.fromEntries(fields.map(f => [f.field_name, ""]))),
  );
  const [touched, setTouched] = useState(false);
  const submit = useSubmitAttendees(order.id);
  // Locks on the first tap, before React re-renders, so a double tap can
  // never send the details twice.
  const lock = useRef(false);

  const set = (i: number, name: string, v: string) =>
    setValues(prev => prev.map((row, idx) => (idx === i ? { ...row, [name]: v } : row)));
  const missing = (i: number, f: AttendeeField) => touched && !values[i][f.field_name]?.trim();
  const complete = values.every(row => fields.every(f => row[f.field_name]?.trim()));

  const send = () => {
    if (lock.current) return;
    setTouched(true);
    if (!complete) {
      toast.error("Some details are missing", { description: "Fill in every field marked with *." });
      return;
    }
    lock.current = true;
    // One object per ticket, in ticket order, with the field names as sent.
    submit.mutate(
      values.map(row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v.trim()]))),
      { onSettled: () => { lock.current = false; } },
    );
  };
  // 409 = already received (or no longer needed): the order is re-read and
  // this form goes away, so it is not shown as an error.
  const conflict = (submit.error as { response?: { status?: number } } | null)?.response?.status === 409;

  return (
    <section className="rounded-[20px] border border-[var(--status-warn)] bg-card p-[18px]">
      <h2 className="flex items-center gap-2 font-heading text-[14px] font-bold text-foreground">
        <UserRound className="size-4 text-[var(--status-warn)]" />
        Who’s going?
      </h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        The stadium needs these details for every ticket before it can issue them.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        {values.map((row, i) => (
          <fieldset key={i} className="m-0 rounded-2xl border border-[var(--edge)] p-4">
            <legend className="px-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Ticket {i + 1}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(f => (
                <label key={f.field_name} className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-foreground">
                    {fieldLabel(f.field_name)} <span className="text-brand-text">*</span>
                  </span>
                  {f.value_type === "SELECT" ? (
                    <select
                      value={row[f.field_name]}
                      onChange={e => set(i, f.field_name, e.target.value)}
                      className={cn(INPUT, missing(i, f) && "border-[var(--status-danger)]")}
                    >
                      <option value="">Select…</option>
                      {f.options.map(o => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={INPUT_TYPE[f.value_type] ?? "text"}
                      value={row[f.field_name]}
                      onChange={e => set(i, f.field_name, e.target.value)}
                      className={cn(INPUT, missing(i, f) && "border-[var(--status-danger)]")}
                    />
                  )}
                  {missing(i, f) && <span className="text-[11.5px] text-[var(--status-danger)]">Required</span>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {/* The API's 422 messages are written for the fan — shown as they are. */}
      {submit.isError && !conflict && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[var(--status-danger-bg)] px-4 py-3 text-[12.5px] text-[var(--status-danger)]">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
          {fanApiMessage(submit.error, "Couldn’t send these details. Please try again.")}
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={send} disabled={submit.isPending} className={cn(BTN_BRAND, "h-11 rounded-[14px] px-6")}>
          {submit.isPending && <LoaderCircle className="size-3.5 animate-spin" />}
          {submit.isPending ? "Sending…" : "Send details"}
        </button>
      </div>
    </section>
  );
}
