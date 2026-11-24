"use client";

// Admin → Settings → Flight Promo. Flights only: while switched on and inside
// its dates, the first `count` flight checkouts each day get the percent set
// for their cabin and fare band. The daily count starts again every day in
// the backend's timezone. VIP package flights and coupon orders don't get it.

import { useState } from "react";
import { toast } from "sonner";
import { AdminButton, Panel } from "@/components/admin/admin-ui";
import { Field, SwitchInput, TextInput } from "@/components/admin/form-controls";
import { useAdminFlightPromo, useUpdateFlightPromo } from "@/features/admin/hooks";
import {
  FLIGHT_PROMO_BANDS,
  FLIGHT_PROMO_CABINS,
} from "@/features/promo/flight-pricing";
import { promoTicketPrice } from "@/features/promo/pricing";
import type {
  FlightPromo,
  FlightPromoBand,
  FlightPromoBands,
  FlightPromoCabin,
  UpdateFlightPromoPayload,
} from "@/features/promo/types";

type FormState = Omit<UpdateFlightPromoPayload, "count" | "flight_percents"> & {
  count: string;
  flight_percents: Record<FlightPromoCabin, Record<FlightPromoBand, string>>;
};

const SAMPLES: { price: number; cabin: FlightPromoCabin; band: FlightPromoBand; note: string }[] = [
  { price: 80, cabin: "economy", band: "below_100", note: "Economy, below 100" },
  { price: 375, cabin: "economy", band: "100_500", note: "Economy, 100 – 500" },
  { price: 1200, cabin: "business", band: "above_500", note: "Business, 500 and above" },
];

function readErrors(err: unknown): { fields: Record<string, string>; message: string } {
  const res = (
    err as {
      response?: {
        status?: number;
        data?: { message?: string; errors?: Record<string, string[]> };
      };
    }
  )?.response;
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries(res?.data?.errors ?? {})) {
    if (Array.isArray(v) && v[0]) fields[k] = v[0];
  }
  if (res?.status === 403) return { fields, message: "Only admins can change the promo." };
  const first = Object.values(fields)[0];
  return { fields, message: first || res?.data?.message || "Failed to update the promo" };
}

function formatDay(day: string | null): string | null {
  if (!day) return null;
  const d = new Date(`${day}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function euro(amount: number): string {
  return `€${amount.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toForm(promo: FlightPromo): FormState {
  const bands = {} as FormState["flight_percents"];
  for (const cabin of FLIGHT_PROMO_CABINS) {
    bands[cabin.key] = {} as FormState["flight_percents"][FlightPromoCabin];
    for (const band of FLIGHT_PROMO_BANDS) {
      const value = promo.flight_percents?.[cabin.key]?.[band.key];
      bands[cabin.key][band.key] = value == null ? "" : String(value);
    }
  }
  return {
    label: promo.label,
    count: String(promo.count ?? 5),
    is_active: promo.is_active,
    starts_on: promo.starts_on,
    ends_on: promo.ends_on,
    flight_percents: bands,
  };
}

function toPayload(form: FormState): UpdateFlightPromoPayload {
  const bands = {} as FlightPromoBands;
  for (const cabin of FLIGHT_PROMO_CABINS) {
    bands[cabin.key] = {} as FlightPromoBands[FlightPromoCabin];
    for (const band of FLIGHT_PROMO_BANDS) {
      const raw = form.flight_percents[cabin.key]?.[band.key]?.trim() ?? "";
      bands[cabin.key][band.key] = raw === "" ? null : Number(raw);
    }
  }
  return {
    label: form.label.trim(),
    count: Number(form.count),
    is_active: form.is_active,
    starts_on: form.starts_on || null,
    ends_on: form.ends_on || null,
    flight_percents: bands,
  };
}

function statusLine(promo: FlightPromo): string {
  if (!promo.is_active) return "Off — no badge, no discount.";
  if (promo.starts_on && promo.today < promo.starts_on)
    return `Scheduled — starts ${formatDay(promo.starts_on)}.`;
  if (promo.ends_on && promo.today > promo.ends_on) return `Ended ${formatDay(promo.ends_on)}.`;
  if (promo.max_percent <= 0) return "On, but no band has a percent yet.";
  if (promo.remaining < 1) return "Today’s slots are used up — back tomorrow.";
  return "Running now.";
}

export function FlightPromoTab() {
  const { data, isLoading, isError } = useAdminFlightPromo();
  const promo = data?.data;

  if (isLoading) return <p className="text-[12.5px] text-muted-foreground">Loading promo…</p>;
  if (isError || !promo)
    return <p className="text-[12.5px] text-destructive">Failed to load the flight promo.</p>;

  return <FlightPromoForm key={promo.updated_at ?? "new"} promo={promo} />;
}

function FlightPromoForm({ promo }: { promo: FlightPromo }) {
  const update = useUpdateFlightPromo();
  const [form, setForm] = useState<FormState>(() => toForm(promo));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(promo));

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  function setBand(cabin: FlightPromoCabin, band: FlightPromoBand, value: string) {
    setForm(f => ({
      ...f,
      flight_percents: {
        ...f.flight_percents,
        [cabin]: { ...f.flight_percents[cabin], [band]: value },
      },
    }));
  }

  function save() {
    setErrors({});
    update.mutate(toPayload(form), {
      onSuccess: res => toast.success(res.data?.is_active ? "Flight promo saved" : "Flight promo is off"),
      onError: err => {
        const { fields, message } = readErrors(err);
        setErrors(fields);
        toast.error(message);
      },
    });
  }

  return (
    <div className="grid max-w-4xl gap-3">
      <Panel
        title="Flight promo"
        subtitle={`Flights only. While the promo is on and today is inside its dates, the first ‘daily count’ flight checkouts each day get the percent set for their cabin and fare. The count starts again every day (${promo.timezone}). Orders with a coupon and VIP package flights don’t get the promo.`}
        action={
          <AdminButton size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save flight promo"}
          </AdminButton>
        }
      >
        <div className="grid gap-3">
          <Field label="Promo is on" help="Off hides the sale prices and stops the discount at checkout.">
            <SwitchInput value={form.is_active} onChange={set("is_active")} onLabel="On" offLabel="Off" />
          </Field>

          <Field label="Label" required error={errors.label} help="Shown on the badge, e.g. BLACK FRIDAY.">
            <TextInput
              value={form.label}
              onChange={set("label")}
              placeholder="BLACK FRIDAY"
              maxLength={80}
              error={!!errors.label}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Start date" error={errors.starts_on}>
              <TextInput
                type="date"
                value={form.starts_on ?? ""}
                onChange={v => set("starts_on")(v || null)}
                error={!!errors.starts_on}
              />
            </Field>
            <Field label="End date" error={errors.ends_on}>
              <TextInput
                type="date"
                value={form.ends_on ?? ""}
                onChange={v => set("ends_on")(v || null)}
                error={!!errors.ends_on}
              />
            </Field>
            <Field label="Daily count" error={errors.count} help="Defaults to 5, resets every day.">
              <TextInput type="number" value={form.count} onChange={set("count")} error={!!errors.count} />
            </Field>
          </div>
          <p className="-mt-1 text-[10.5px] text-muted-foreground">
            Both days included. Leave a date empty for no limit on that side.
          </p>
        </div>
      </Panel>

      <Panel
        title="Discount by cabin and fare"
        subtitle="Picked from the charged fare, in the customer’s currency. Premium economy uses the economy percents. Leave a band empty for no discount there."
      >
        <div className="grid gap-4">
          {FLIGHT_PROMO_CABINS.map(cabin => (
            <div key={cabin.key}>
              <p className="mb-2 text-[12px] font-semibold">{cabin.label}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {FLIGHT_PROMO_BANDS.map(band => {
                  const errorKey = `flight_percents.${cabin.key}.${band.key}`;
                  return (
                    <Field key={band.key} label={band.label} error={errors[errorKey]}>
                      <div className="relative">
                        <TextInput
                          type="number"
                          value={form.flight_percents[cabin.key]?.[band.key] ?? ""}
                          onChange={v => setBand(cabin.key, band.key, v)}
                          placeholder="—"
                          error={!!errors[errorKey]}
                        />
                        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                          %
                        </span>
                      </div>
                    </Field>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Live status" subtitle={`Today ${formatDay(promo.today)}`}>
          <div className="grid grid-cols-3 gap-3 text-[12.5px]">
            <div>
              <p className="text-[10.5px] text-muted-foreground">Used today</p>
              <p className="font-semibold">{promo.used_count}</p>
            </div>
            <div>
              <p className="text-[10.5px] text-muted-foreground">Remaining today</p>
              <p className="font-semibold">{promo.remaining}</p>
            </div>
            <div>
              <p className="text-[10.5px] text-muted-foreground">Applies now</p>
              <p className="font-semibold">{promo.applies_discount ? "Yes" : "No"}</p>
            </div>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">{statusLine(promo)}</p>
        </Panel>

        <Panel title="Preview" subtitle="What a flight card shows for these bands">
          <div className="grid gap-2 sm:grid-cols-3">
            {SAMPLES.map(s => {
              const percent = Number(form.flight_percents[s.cabin]?.[s.band]) || 0;
              return (
                <div key={s.note} className="rounded-md p-2.5 shadow-[0_0_0_1px_var(--edge)]">
                  <p className="font-mono text-[9.5px] text-muted-foreground">{s.note}</p>
                  {percent > 0 ? (
                    <>
                      <p className="font-mono text-[10.5px] text-muted-foreground line-through">{euro(s.price)}</p>
                      <p className="text-[13px] font-semibold">{euro(promoTicketPrice(s.price, percent))}</p>
                      <p className="font-mono text-[9.5px] text-brand-text">
                        {(form.label.trim() || "LABEL").toUpperCase()} · {percent}% OFF
                      </p>
                    </>
                  ) : (
                    <p className="text-[11.5px] text-muted-foreground">No discount</p>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
