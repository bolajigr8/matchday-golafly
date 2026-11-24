"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { FanPill } from "@/components/fan/ledger-card";
import { isForbidden, useOwnRegistration, useUpdateOwnRegistration } from "@/features/player/program";
import { positionLabel } from "@/services/programs";
import { countries } from "country-data-list";
import { CountryDropdown } from "@/components/ui/county-dropdown";
import { PhoneInput } from "@/components/apply-now/phone-input";
import type { ApiPlayer } from "@/services/players";

/* Player dashboard — the program the player registered on, and the details
   they submitted with it. Name, email and position stay locked: the position
   holds a spot, and changing it is an admin move. */

/* CountryDropdown keys on alpha3; the registration stores the country name. */
const alpha3ForCountry = (name: string) =>
  name
    ? (countries.all as { name: string; alpha3?: string }[]).find(c => c.name === name)?.alpha3
    : undefined;

const FIELD_BOX =
  "h-11 rounded-[14px] border border-[var(--edge-strong)] bg-card shadow-none focus-within:ring-0 focus-within:border-[var(--brand-edge)] focus-within:shadow-[0_0_0_3px_var(--brand-glow)]";

const asDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

export function MyProgramCard({ player }: { player: ApiPlayer }) {
  const registration = useOwnRegistration(player);
  const update = useUpdateOwnRegistration(player.id);
  const [editing, setEditing] = useState(false);
  const found = registration.data;
  const payload = found?.applicant.payload ?? {};
  const [form, setForm] = useState({ phone: "", nationality: "", current_location_country: "" });

  if (registration.isLoading) {
    return <div className="h-[104px] animate-pulse rounded-[20px] border border-border bg-card" />;
  }
  if (!found) return null; // not registered on a program — nothing to show

  const { applicant, program } = found;
  const dates = [asDate(program.start_date), asDate(program.end_date)].filter(Boolean).join(" – ");
  const locked = isForbidden(update.error);

  const startEdit = () => {
    setForm({
      phone: payload.phone ?? "",
      nationality: payload.nationality ?? "",
      current_location_country: payload.current_location_country ?? "",
    });
    update.reset();
    setEditing(true);
  };

  const save = () =>
    update.mutate(
      {
        applicantId: applicant.id,
        payload: {
          phone: form.phone.trim(),
          nationality: form.nationality.trim(),
          current_location_country: form.current_location_country.trim(),
        },
      },
      { onSuccess: () => setEditing(false) },
    );

  return (
    <div className="rounded-[20px] border border-border bg-card p-[15px]">
      <div className="flex items-start gap-4">
        <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
          <CalendarDays className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="font-heading text-[15px] font-bold text-foreground">{program.title}</p>
            <FanPill tone={applicant.status === "pending" ? "warn" : "good"}>{applicant.status}</FanPill>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {[dates, program.location].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-2 text-xs text-foreground">
            Your spot: <b className="font-semibold">{applicant.position}</b> · {positionLabel(applicant.position)}
            {payload.secondary_position && (
              <span className="text-muted-foreground"> (secondary {payload.secondary_position})</span>
            )}
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex h-9 shrink-0 items-center rounded-xl px-4 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
          >
            Edit details
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 border-t border-[var(--edge)] pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnly label="Name" value={[payload.first_name, payload.last_name].filter(Boolean).join(" ") || "—"} />
            <ReadOnly label="Email" value={payload.email ?? "—"} />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Phone</span>
              <PhoneInput
                value={form.phone}
                onChange={v => setForm(f => ({ ...f, phone: v }))}
                country={form.current_location_country}
                boxClassName={FIELD_BOX}
                inputClassName="h-11 bg-transparent text-[13px] text-foreground dark:bg-transparent"
              />
            </div>
            <Input label="Nationality" value={form.nationality} onChange={v => setForm(f => ({ ...f, nationality: v }))} />
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-foreground">Country you live in</span>
              <CountryDropdown
                defaultValue={alpha3ForCountry(form.current_location_country)}
                onChange={c => setForm(f => ({ ...f, current_location_country: c.name }))}
                placeholder="Select a country"
                triggerClassName={FIELD_BOX}
              />
            </div>
          </div>
          {locked && (
            <p className="mt-3 text-[11.5px] text-[var(--status-danger)]">
              These details can&apos;t be changed from your dashboard yet. Contact Golafly and we&apos;ll update them for you.
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="inline-flex h-9 items-center rounded-xl px-4 text-[13px] font-semibold text-muted-foreground hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={update.isPending || locked}
              className="inline-flex h-9 items-center rounded-xl bg-brand px-4 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {update.isPending ? "Saving…" : "Save details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="flex h-11 items-center truncate rounded-[14px] border border-[var(--edge-strong)] bg-muted px-3.5 text-[13px] text-muted-foreground">
        {value}
      </span>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-11 rounded-[14px] border border-[var(--edge-strong)] bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow focus:border-[var(--brand-edge)] focus:shadow-[0_0_0_3px_var(--brand-glow)]"
      />
    </label>
  );
}
