"use client";

import { isEmailNotVerified } from "@/features/fan/verification";
import { VerifyEmailState } from "@/components/fan/verify-email-state";
import Link from "next/link";
import { ArrowLeft, CircleAlert, Clock, CreditCard, Gift, User } from "lucide-react";
import { FanPill, KIND_ICON } from "@/components/fan/ledger-card";
import { useFanLedger } from "@/features/fan/hooks";
import {
  FAN_KIND_LABEL,
  fanDate,
  fanFreeEsimMatchRef,
  fanIsFreeEsim,
  fanMoney,
  fanRef,
  fanStatus,
  fanTitle,
} from "@/features/fan/ledgers";
import { esimProviderLabel } from "@/features/esim/types";
import { FINISHING_BOOKING_COPY } from "@/features/payment/status";
import { FREE_ESIM_CUSTOMER_LABEL } from "@/features/free-esim/rules";
import type { FanLedger } from "@/features/fan/types";
import { Routes } from "@/routes";

/* One order — the travels dashboard's ledger detail, in the fan dashboard.
 *
 * GET /v1/auth/ledgers/{id}. Nulls are shown as "—" rather than hidden, so an
 * order still awaiting payment visibly explains which details are to come. */

type Row = { label: string; value: string };

const dash = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

function detailRows(l: FanLedger): Row[] {
  if (l.ledger_type === "flight") {
    const s = l.summary;
    return [
      { label: "Route", value: s.origin && s.destination ? `${s.origin} → ${s.destination}` : "—" },
      { label: "Airline", value: dash(s.airline_name) },
      { label: "Departure", value: fanDate(s.departure_date) || "—" },
      { label: "PNR reference", value: dash(s.pnr_reference) },
      { label: "Order reference", value: dash(s.duffel_order_id) },
    ];
  }
  if (l.ledger_type === "esim") {
    const s = l.summary;
    return [
      { label: "Package", value: dash(s.package) },
      { label: "Package ID", value: dash(s.package_id) },
      { label: "Provider", value: esimProviderLabel(s.provider) },
      { label: "ICCID", value: dash(s.iccid) },
      { label: "Supplier order", value: dash(s.airalo_order_id) },
    ];
  }
  const s = l.summary;
  return [
    { label: "Hotel", value: dash(s.hotel_name) },
    { label: "Check-in", value: fanDate(s.checkin) || "—" },
    { label: "Check-out", value: fanDate(s.checkout) || "—" },
    { label: "Booking ID", value: dash(s.booking_id) },
    { label: "Confirmation", value: dash(s.confirmation_number) },
  ];
}

function Card({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  rows: Row[];
}) {
  return (
    <section className="rounded-[20px] border border-border bg-card p-[18px]">
      <h2 className="flex items-center gap-2 font-heading text-[14px] font-bold text-foreground">
        <Icon className="size-4 text-brand-text" />
        {title}
      </h2>
      <dl className="mt-3.5 flex flex-col">
        {rows.map(r => (
          <div
            key={r.label}
            className="flex items-start justify-between gap-4 border-b border-[var(--edge)] py-2.5 last:border-b-0"
          >
            <dt className="font-mono text-[11px] text-muted-foreground">{r.label}</dt>
            <dd className="m-0 max-w-[60%] break-words text-right text-[13px] text-foreground">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function LedgerDetailClient({ id }: { id: number }) {
  const query = useFanLedger(id);
  const ledger = query.data?.data;

  const back = (
    <Link
      href={Routes.dashboardLedgers}
      className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Back to ledgers
    </Link>
  );

  if (query.isPending && Number.isFinite(id)) {
    return (
      <div className="flex flex-col gap-5">
        {back}
        <div className="h-24 animate-pulse rounded-[20px] bg-muted" />
        <div className="grid gap-3.5 lg:grid-cols-2">
          <div className="h-48 animate-pulse rounded-[20px] bg-muted" />
          <div className="h-48 animate-pulse rounded-[20px] bg-muted" />
        </div>
      </div>
    );
  }

  if (query.isError && isEmailNotVerified(query.error)) return <VerifyEmailState />;

  if (!ledger) {
    const status = (query.error as { response?: { status?: number } } | null)?.response?.status;
    return (
      <div className="flex flex-col gap-5">
        {back}
        <div className="rounded-[20px] border border-border bg-card px-5 py-12 text-center">
          <CircleAlert className="mx-auto size-6 text-[var(--status-danger)]" />
          <p className="mt-3 text-[13px] text-foreground">
            {status === 404 || !Number.isFinite(id)
              ? "This order doesn’t exist, or isn’t on your account."
              : "Couldn’t load this order. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  const Icon = KIND_ICON[ledger.ledger_type];
  const status = fanStatus(ledger);
  const money = fanMoney(ledger);
  const free = fanIsFreeEsim(ledger);
  const freeMatchRef = fanFreeEsimMatchRef(ledger);

  return (
    <div className="flex flex-col gap-5">
      {back}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[21px] font-bold tracking-[-0.03em] text-foreground">
              {fanTitle(ledger)}
            </h1>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {FAN_KIND_LABEL[ledger.ledger_type]} · ordered {fanDate(ledger.created_at) || "—"}
            </p>
          </div>
        </div>
        <FanPill tone={status.tone}>{status.label}</FanPill>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Reference", value: fanRef(ledger) },
          { label: "Type", value: FAN_KIND_LABEL[ledger.ledger_type] },
          { label: free ? "Price" : "Total", value: money },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 truncate font-heading text-[15px] font-bold text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </section>

      {status.label === "Finishing booking" && (
        <p className="flex items-start gap-2 rounded-2xl bg-[var(--status-info-bg)] px-4 py-3 text-[12px] text-[var(--status-info)]">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          {FINISHING_BOOKING_COPY.message}
        </p>
      )}

      {free && (
        <p className="flex items-start gap-2 rounded-2xl bg-[var(--status-info-bg)] px-4 py-3 text-[12px] text-[var(--status-info)]">
          <Gift className="mt-0.5 size-3.5 shrink-0" />
          {FREE_ESIM_CUSTOMER_LABEL}
          {freeMatchRef ? ` (booking ${freeMatchRef})` : ""}. The install details come by email.
        </p>
      )}

      {status.label === "Awaiting payment" && (
        <p className="flex items-start gap-2 rounded-2xl bg-[var(--status-warn-bg)] px-4 py-3 text-[12px] text-[var(--status-warn)]">
          <Clock className="mt-0.5 size-3.5 shrink-0" />
          This order hasn’t been paid yet, so some booking details below are still
          empty. They fill in once payment completes.
        </p>
      )}

      <div className="grid gap-3.5 lg:grid-cols-2">
        <Card title={`${FAN_KIND_LABEL[ledger.ledger_type]} details`} icon={Icon} rows={detailRows(ledger)} />
        <Card
          title="Traveller"
          icon={User}
          rows={[
            { label: "Name", value: dash(ledger.customer.full_name) },
            { label: "Email", value: dash(ledger.customer.email) },
            { label: "Phone", value: dash(ledger.customer.phone) },
          ]}
        />
        {free ? (
          /* Free eSIM (contract §7): no price, amount paid or receipt. */
          <Card
            title={FREE_ESIM_CUSTOMER_LABEL}
            icon={Gift}
            rows={[
              { label: "Price", value: "Free" },
              { label: "Match booking", value: dash(freeMatchRef) },
            ]}
          />
        ) : (
          <Card
            title="Payment"
            icon={CreditCard}
            rows={[
              { label: "Amount", value: money },
              { label: "Currency", value: dash(ledger.pricing.currency) },
              { label: "Payment status", value: dash(ledger.payment_status) },
              { label: "Paid on", value: fanDate(ledger.paid_at) || "—" },
            ]}
          />
        )}
        <Card
          title="Order"
          icon={Clock}
          rows={[
            { label: "Ledger ID", value: `#${ledger.ledger_id}` },
            { label: "Status", value: dash(ledger.status) },
            { label: "Created", value: fanDate(ledger.created_at) || "—" },
          ]}
        />
      </div>

      <p className="pb-2 text-center text-[12px] text-muted-foreground">
        Something wrong with this order?{" "}
        <Link href={Routes.helpFaqs} className="font-semibold text-brand-text hover:underline">
          Contact support
        </Link>
      </p>
    </div>
  );
}
