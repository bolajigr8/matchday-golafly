"use client";

// Admin → Settings → Match Promo. Match tickets only: while switched on and
// inside its dates, the first `count` ticket checkouts each day get the percent
// set for the price band of one ticket. The daily count starts again every day
// in the backend's timezone.

import { useState } from "react";
import { toast } from "sonner";
import { AdminButton, Panel } from "@/components/admin/admin-ui";
import { Field, SwitchInput, TextInput } from "@/components/admin/form-controls";
import { useAdminMatchPromo, useUpdateMatchPromo } from "@/features/admin/hooks";
import type { MatchPromo, PromoBand, PromoBands, UpdateMatchPromoPayload } from "@/features/promo/types";
import {
  PROMO_BANDS,
  PROMO_HEADLINE_PERCENT,
  promoTicketPrice,
} from "@/features/promo/pricing";

type FormState = Omit<UpdateMatchPromoPayload, "count" | "band_percents"> & {
  count: string;
  band_percents: Record<PromoBand, string>;
};

const SAMPLES: { price: number; band: PromoBand; note: string }[] = [
  { price: 85, band: "below_100", note: "Ticket below 100" },
  { price: 152.5, band: "100_200", note: "Ticket 100 – 200" },
  { price: 640, band: "500_1000", note: "Ticket 500 – 1000" },
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

function toForm(promo: MatchPromo): FormState {
  const bands = {} as Record<PromoBand, string>;
  for (const band of PROMO_BANDS) {
    const value = promo.band_percents?.[band.key];
    bands[band.key] = value == null ? "" : String(value);
  }
  return {
    label: promo.label,
    count: String(promo.count ?? 5),
    is_active: promo.is_active,
    starts_on: promo.starts_on,
    ends_on: promo.ends_on,
    band_percents: bands,
  };
}

function toPayload(form: FormState): UpdateMatchPromoPayload {
  const bands = {} as PromoBands;
  for (const band of PROMO_BANDS) {
    const raw = form.band_percents[band.key]?.trim() ?? "";
    bands[band.key] = raw === "" ? null : Number(raw);
  }
  return {
    label: form.label.trim(),
    count: Number(form.count),
    is_active: form.is_active,
    starts_on: form.starts_on || null,
    ends_on: form.ends_on || null,
    band_percents: bands,
  };
}

function statusLine(promo: MatchPromo): string {
  if (!promo.is_active) return "Off — no banner, no discount.";
  if (promo.starts_on && promo.today < promo.starts_on)
    return `Scheduled — starts ${formatDay(promo.starts_on)}.`;
  if (promo.ends_on && promo.today > promo.ends_on) return `Ended ${formatDay(promo.ends_on)}.`;
  if (promo.max_percent <= 0) return "On, but no band has a percent yet.";
  if (promo.remaining < 1) return "Today’s slots are used up — back tomorrow.";
  return "Running now.";
}

export function MatchPromoTab() {
  const { data, isLoading, isError } = useAdminMatchPromo();
  const promo = data?.data;

  if (isLoading) return <p className="text-[12.5px] text-muted-foreground">Loading promo…</p>;
  if (isError || !promo)
    return <p className="text-[12.5px] text-destructive">Failed to load the match promo.</p>;

  // Keyed on the saved version so the form restarts from what the server holds.
  return <MatchPromoForm key={promo.updated_at ?? "new"} promo={promo} />;
}

function MatchPromoForm({ promo }: { promo: MatchPromo }) {
  const update = useUpdateMatchPromo();
  const [form, setForm] = useState<FormState>(() => toForm(promo));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(form) !== JSON.stringify(toForm(promo));

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) =>
    setForm(f => ({ ...f, [key]: value }));

  function setBand(band: PromoBand, value: string) {
    setForm(f => ({ ...f, band_percents: { ...f.band_percents, [band]: value } }));
  }

  function save() {
    setErrors({});
    update.mutate(toPayload(form), {
      onSuccess: res => toast.success(res.data?.is_active ? "Match promo saved" : "Match promo is off"),
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
        title="Match promo"
        subtitle={`Match tickets only. While the promo is on and today is inside its dates, the first ‘daily count’ ticket checkouts each day get the percent set for the price of one ticket. The count starts again every day (${promo.timezone}). Orders with a coupon and VIP packages don’t get the promo.`}
        action={
          <AdminButton size="sm" onClick={save} disabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save match promo"}
          </AdminButton>
        }
      >
        <div className="grid gap-3">
          <Field label="Promo is on" help="Off hides the banner and sale prices and stops the discount at checkout.">
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
        title="Discount by ticket price"
        subtitle="Picked by the price of ONE ticket in the customer’s currency. Leave a band empty for no discount there."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PROMO_BANDS.map(band => {
            const errorKey = `band_percents.${band.key}`;
            return (
              <Field key={band.key} label={band.label} error={errors[errorKey]}>
                <div className="relative">
                  <TextInput
                    type="number"
                    value={form.band_percents[band.key]}
                    onChange={v => setBand(band.key, v)}
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

        <Panel title="Preview" subtitle={`Banner: “Up to ${PROMO_HEADLINE_PERCENT}% discount” on match tickets`}>
          <div className="grid gap-2 sm:grid-cols-3">
            {SAMPLES.map(s => {
              const percent = Number(form.band_percents[s.band]) || 0;
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
