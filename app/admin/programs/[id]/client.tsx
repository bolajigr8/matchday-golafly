"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Armchair, Pencil, Plus, UserCheck, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton, Panel, StatCard } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { SheetFacts, SheetSection, SheetShell } from "@/components/admin/sheet-shell";
import { Field, LockedValue, SelectInput, SwitchInput, TextInput } from "@/components/admin/form-controls";
import { StatusPill } from "@/components/admin/status-pill";
import {
  useAdminProgramApplicants,
  useAdminProgramAvailability,
  useAdminPrograms,
  useDeleteProgramApplicant,
  useMoveProgramApplicant,
  useRegisterProgramApplicant,
  useUpdateProgramApplicant,
  useUpdateProgramSpots,
} from "@/features/admin/hooks";
import {
  PROGRAM_POSITIONS,
  applicantName,
  positionLabel,
  type ProgramApplicant,
  type ProgramApplicantPayload,
  type ProgramAvailability,
} from "@/services/programs";
import { Routes } from "@/routes";
import { countries } from "country-data-list";
import { CountryDropdown } from "@/components/ui/county-dropdown";
import { PhoneInput } from "@/components/apply-now/phone-input";
import { cn } from "@/lib/utils";

/* One program's spots and the players registered on it.
 *
 * The spot rules live on the backend: each registered player holds ONE
 * position code, and that is the spot they use. This screen only reads
 * GET /availability and never re-derives the counts, so it cannot drift
 * from what the public /register/player form enforces. */

/* Spots left for a position, or null when the program sets no per-position
   limits. Once any position has spots, a code missing from the list has none. */
function positionLeft(availability: ProgramAvailability | undefined, code: string): number | null {
  if (!availability?.positions?.length) return null;
  return availability.positions.find(p => p.code === code)?.spot_left ?? 0;
}

/* The backend requires payload.experience_type on every registration. Same
   values as the public football-tourism application form. */
const EXPERIENCE_TYPES = [
  { value: "trial-showcase", label: "Trial & Showcase Experiences" },
  { value: "matchday-travel", label: "Matchday Travel Experiences" },
  { value: "iconic-venues", label: "Iconic Football Destinations" },
];

/* The program's subcategory decides the obvious default. */
const EXPERIENCE_BY_SUBCATEGORY: Record<string, string> = {
  trial_showcase_tours: "trial-showcase",
  match_day_travel_experiences: "matchday-travel",
  iconic_football_venues: "iconic-venues",
};

/* CountryDropdown keys on alpha3; the payload stores the country's name. */
const alpha3ForCountry = (name: string) =>
  name
    ? (countries.all as { name: string; alpha3?: string }[]).find(c => c.name === name)?.alpha3
    : undefined;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

const asDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "—");

function PositionChip({ code }: { code?: string | null }) {
  if (!code) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      title={positionLabel(code)}
      className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] font-semibold shadow-[0_0_0_1px_var(--edge)]"
    >
      {code}
    </span>
  );
}

const APPLICANT_COLUMNS: Column<ProgramApplicant>[] = [
  {
    key: "player",
    label: "Player",
    width: "240px",
    render: a => (
      <IdentityCell initials={initials(applicantName(a))} name={applicantName(a)} sub={a.payload?.email ?? "—"} />
    ),
  },
  { key: "position", label: "Position", nowrap: true, render: a => <PositionChip code={a.position} /> },
  {
    key: "secondary",
    label: "Secondary",
    nowrap: true,
    render: a => <PositionChip code={a.payload?.secondary_position} />,
  },
  { key: "phone", label: "Phone", nowrap: true, render: a => a.payload?.phone ?? "—" },
  { key: "nationality", label: "Nationality", render: a => a.payload?.nationality ?? "—" },
  { key: "age", label: "Age", numeric: true, render: a => (a.payload?.age != null ? String(a.payload.age) : "—") },
  { key: "registered", label: "Registered", numeric: true, render: a => asDate(a.created_at) },
  { key: "status", label: "Status", nowrap: true, render: a => <StatusPill label={a.status} /> },
];

export default function ProgramPlayersClient({ programId }: { programId: number }) {
  const { openNav } = useAdminNav();
  const availabilityQuery = useAdminProgramAvailability(programId);
  const applicantsQuery = useAdminProgramApplicants(programId);
  const programs = useAdminPrograms();
  const availability = availabilityQuery.data?.data;
  const program = programs.data?.data.find(p => p.id === programId);
  const title = availability?.title ?? program?.title ?? `Program #${programId}`;

  const [editingSpots, setEditingSpots] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [viewing, setViewing] = useState<ProgramApplicant | null>(null);
  const [editing, setEditing] = useState<ProgramApplicant | null>(null);
  const [moving, setMoving] = useState<ProgramApplicant | null>(null);
  const [removing, setRemoving] = useState<ProgramApplicant | null>(null);
  const remove = useDeleteProgramApplicant();

  const taken = availability ? availability.spot - availability.spot_left : 0;
  const full = !!availability && availability.spot > 0 && availability.spot_left <= 0;

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Programs", title]}
        title={title}
        action={
          <AdminButton onClick={() => setRegistering(true)} disabled={full} title={full ? "This program is full" : undefined}>
            <Plus className="size-3.5" />
            Register player
          </AdminButton>
        }
        onOpenNav={openNav}
      />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]">
        <Link
          href={Routes.adminPrograms}
          className="inline-flex w-fit items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All programs
        </Link>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total spots" icon={<Armchair className="size-3" />} value={availability ? String(availability.spot) : "—"} />
          <StatCard
            label="Registered"
            icon={<Users className="size-3" />}
            value={availability ? String(taken) : "—"}
          />
          <StatCard
            label="Spots left"
            icon={<UserCheck className="size-3" />}
            value={availability ? String(availability.spot_left) : "—"}
            delta={full ? "Program full" : availability?.availability}
            direction={full ? "down" : undefined}
          />
        </div>

        <Panel
          title="Spots per position"
          subtitle="Each registered player takes one spot in their position."
          action={
            <AdminButton size="sm" variant="outline" onClick={() => setEditingSpots(true)} disabled={!availability}>
              <Pencil className="size-3" />
              Edit spots
            </AdminButton>
          }
        >
          {availabilityQuery.isLoading ? (
            <div className="h-[88px] animate-pulse rounded-md bg-muted" />
          ) : availabilityQuery.isError ? (
            <p className="m-0 text-[12px] text-destructive">
              Could not load spots from GET /v1/program/{programId}/availability.
            </p>
          ) : (
            <PositionGrid availability={availability} />
          )}
        </Panel>

        <Panel title="Registered players" subtitle="View a player to move them to another program.">
          <QueryTable
            query={applicantsQuery}
            select={d => d.data}
            columns={APPLICANT_COLUMNS}
            rowKey={a => String(a.id)}
            endpoint={`/v1/program/${programId}/applicants`}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={setRemoving}
            emptyTitle="No players registered yet"
            emptyBody="Players appear here when they register on /register/player, or when you register one manually."
            emptyAction={
              <AdminButton onClick={() => setRegistering(true)} disabled={full}>
                <Plus className="size-3.5" />
                Register player
              </AdminButton>
            }
          />
        </Panel>
      </div>

      {editingSpots && availability && (
        <SpotsSheet programId={programId} availability={availability} onClose={() => setEditingSpots(false)} />
      )}

      {registering && (
        <ApplicantSheet
          programId={programId}
          availability={availability}
          defaultExperience={EXPERIENCE_BY_SUBCATEGORY[program?.program_subcategory?.slug ?? ""] ?? ""}
          onClose={() => setRegistering(false)}
        />
      )}

      {editing && (
        <ApplicantSheet
          programId={programId}
          availability={availability}
          applicant={editing}
          defaultExperience={EXPERIENCE_BY_SUBCATEGORY[program?.program_subcategory?.slug ?? ""] ?? ""}
          onClose={() => setEditing(null)}
        />
      )}

      {viewing && (
        <ApplicantDetail
          applicant={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onMove={() => { setMoving(viewing); setViewing(null); }}
          onRemove={() => { setRemoving(viewing); setViewing(null); }}
        />
      )}

      {moving && <MoveSheet applicant={moving} fromProgramId={programId} onClose={() => setMoving(null)} />}

      {removing && (
        <ConfirmDialog
          title="Remove this player from the program?"
          body={
            <>
              <b className="font-semibold text-foreground">{applicantName(removing)}</b> will be removed from{" "}
              {title}, and their {removing.position} spot will open up again.
            </>
          }
          confirmLabel="Remove player"
          onCancel={() => setRemoving(null)}
          onConfirm={() =>
            remove.mutate(
              { programId, applicantId: removing.id },
              { onSettled: () => setRemoving(null) },
            )
          }
        />
      )}
    </>
  );
}

/* ── Position grid ──────────────────────────────────────────────────────── */

function PositionGrid({ availability }: { availability?: ProgramAvailability }) {
  if (!availability || availability.spot <= 0) {
    return (
      <p className="m-0 text-[12px] text-muted-foreground">
        No spots set yet. Use <b className="font-semibold text-foreground">Edit spots</b> to open this program for registration.
      </p>
    );
  }
  if (availability.positions.length === 0) {
    return (
      <p className="m-0 text-[12px] text-muted-foreground">
        No per-position limits — any position can take one of the {availability.spot} spots.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {PROGRAM_POSITIONS.map(({ code, label }) => {
        const p = availability.positions.find(x => x.code === code);
        const spot = p?.spot ?? 0;
        const left = p?.spot_left ?? 0;
        const used = spot - left;
        const tone = spot === 0 ? "none" : left <= 0 ? "full" : left <= 1 ? "almost" : "open";
        return (
          <div
            key={code}
            className={cn(
              "flex flex-col gap-1.5 rounded-md p-2.5 shadow-[0_0_0_1px_var(--edge)]",
              tone === "none" && "opacity-50",
            )}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[12px] font-semibold">{code}</span>
              <span
                className={cn(
                  "text-[10.5px] tabular-nums",
                  tone === "full" && "text-destructive",
                  tone === "almost" && "text-status-warn",
                  (tone === "open" || tone === "none") && "text-muted-foreground",
                )}
              >
                {spot === 0 ? "No spots" : left <= 0 ? "Full" : `${left}/${spot} left`}
              </span>
            </div>
            <span className="truncate text-[10.5px] text-muted-foreground">{label}</span>
            <span className="h-1 overflow-hidden rounded-full bg-muted">
              <span
                className={cn(
                  "block h-full rounded-full",
                  tone === "full" ? "bg-destructive" : tone === "almost" ? "bg-status-warn" : "bg-status-good",
                )}
                style={{ width: `${spot > 0 ? (used / spot) * 100 : 0}%` }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Edit spots ─────────────────────────────────────────────────────────── */

const toInt = (v: string) => (v.trim() === "" ? 0 : Number(v));
const isCount = (v: string) => v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) >= 0);

function SpotsSheet({
  programId,
  availability,
  onClose,
}: {
  programId: number;
  availability: ProgramAvailability;
  onClose: () => void;
}) {
  const update = useUpdateProgramSpots();
  const [total, setTotal] = useState(String(availability.spot || ""));
  const [positions, setPositions] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      PROGRAM_POSITIONS.map(({ code }) => {
        const p = availability.positions.find(x => x.code === code);
        return [code, p ? String(p.spot) : ""];
      }),
    ),
  );
  const [touched, setTouched] = useState(false);

  // Spots already held can't be taken away — the players holding them stay.
  const takenOf = (code: string) => {
    const p = availability.positions.find(x => x.code === code);
    return p ? p.spot - p.spot_left : 0;
  };
  const takenTotal = availability.spot - availability.spot_left;
  const positionsSum = Object.values(positions).reduce((sum, v) => sum + (isCount(v) ? toInt(v) : 0), 0);

  const errors: Record<string, string> = {};
  if (!isCount(total) || toInt(total) <= 0) errors.total = "Enter a whole number above 0.";
  else if (toInt(total) < takenTotal) errors.total = `${takenTotal} players are already registered.`;
  // The API rejects any split that doesn't add up to exactly the total.
  else if (positionsSum !== toInt(total)) {
    errors.total = `Positions add up to ${positionsSum}; they must add up to exactly ${toInt(total)}.`;
  }
  for (const { code } of PROGRAM_POSITIONS) {
    const v = positions[code];
    if (!isCount(v)) errors[code] = "Whole number";
    else if (toInt(v) < takenOf(code)) errors[code] = `${takenOf(code)} taken`;
  }

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    update.mutate(
      {
        id: programId,
        spot: toInt(total),
        // The API requires every position; an empty one is sent as 0.
        positions: Object.fromEntries(PROGRAM_POSITIONS.map(({ code }) => [code, toInt(positions[code] ?? "")])),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <SheetShell
      title="Edit spots"
      subtitle={availability.title}
      onClose={onClose}
      wide
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>Cancel</AdminButton>
          <AdminButton size="sm" onClick={save} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save spots"}
          </AdminButton>
        </>
      }
    >
      <SheetSection title="Program">
        <Field
          label="Total spots"
          required
          error={touched ? errors.total : undefined}
          help={`Positions currently add up to ${positionsSum}. ${takenTotal} taken.`}
        >
          <TextInput type="number" value={total} onChange={setTotal} error={touched && !!errors.total} />
        </Field>
      </SheetSection>

      <SheetSection title="Spots per position">
        <p className="m-0 mb-2.5 text-[11px] leading-relaxed text-muted-foreground">
          Leave a position empty (0) to give it no spots.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {PROGRAM_POSITIONS.map(({ code, label }) => (
            <Field
              key={code}
              label={`${code} · ${label}`}
              error={touched ? errors[code] : undefined}
              help={takenOf(code) > 0 ? `${takenOf(code)} taken` : undefined}
            >
              <TextInput
                type="number"
                value={positions[code]}
                onChange={v => setPositions(p => ({ ...p, [code]: v }))}
                error={touched && !!errors[code]}
                placeholder="0"
              />
            </Field>
          ))}
        </div>
      </SheetSection>
    </SheetShell>
  );
}

/* ── Register / edit a player ───────────────────────────────────────────── */

type ApplicantForm = {
  experience_type: string;
  position: string;
  secondary_position: string;
  first_name: string;
  last_name: string;
  age: string;
  nationality: string;
  email: string;
  phone: string;
  current_location_country: string;
  visa_required: boolean;
};

function ApplicantSheet({
  programId,
  availability,
  applicant,
  defaultExperience,
  onClose,
}: {
  programId: number;
  availability?: ProgramAvailability;
  /* Present when editing; absent when registering a new player. */
  applicant?: ProgramApplicant;
  defaultExperience: string;
  onClose: () => void;
}) {
  const register = useRegisterProgramApplicant();
  const update = useUpdateProgramApplicant();
  const p = applicant?.payload ?? {};
  const [form, setForm] = useState<ApplicantForm>({
    experience_type: p.experience_type ?? defaultExperience,
    position: applicant?.position ?? "",
    secondary_position: p.secondary_position ?? "",
    first_name: p.first_name ?? "",
    last_name: p.last_name ?? "",
    age: p.age != null ? String(p.age) : "",
    nationality: p.nationality ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    current_location_country: p.current_location_country ?? "",
    visa_required: Boolean(p.visa_required),
  });
  const [touched, setTouched] = useState(false);
  const set = <K extends keyof ApplicantForm>(k: K) => (v: ApplicantForm[K]) => setForm(f => ({ ...f, [k]: v }));

  const positionOptions = (other: string, checkSpots: boolean) =>
    PROGRAM_POSITIONS.map(({ code, label }) => {
      const left = checkSpots ? positionLeft(availability, code) : null;
      const suffix = left == null ? "" : left <= 0 ? " — full" : ` — ${left} left`;
      return { value: code, label: `${code} · ${label}${suffix}`, disabled: code === other || (left != null && left <= 0) };
    });

  const errors: Partial<Record<keyof ApplicantForm, string>> = {};
  if (!applicant && !form.position) errors.position = "Pick the position this player takes.";
  if (!form.experience_type) errors.experience_type = "Pick the experience type.";
  if (form.secondary_position && form.secondary_position === form.position) {
    errors.secondary_position = "Must differ from the main position.";
  }
  if (!form.first_name.trim()) errors.first_name = "Required";
  if (!form.last_name.trim()) errors.last_name = "Required";
  if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email.";
  if (form.age.trim() && !(Number.isInteger(Number(form.age)) && Number(form.age) > 0)) errors.age = "Whole number";

  const pending = register.isPending || update.isPending;

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    const payload: ProgramApplicantPayload = {
      experience_type: form.experience_type,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      nationality: form.nationality.trim() || undefined,
      current_location_country: form.current_location_country.trim() || undefined,
      age: form.age.trim() ? Number(form.age) : undefined,
      visa_required: form.visa_required,
      secondary_position: form.secondary_position || undefined,
    };
    if (applicant) {
      update.mutate({ applicantId: applicant.id, programId, payload }, { onSuccess: onClose });
    } else {
      register.mutate({ programId, position: form.position, payload }, { onSuccess: onClose });
    }
  };

  const err = (k: keyof ApplicantForm) => (touched ? errors[k] : undefined);

  return (
    <SheetShell
      title={applicant ? `Edit ${applicantName(applicant)}` : "Register a player"}
      subtitle={availability?.title}
      onClose={onClose}
      wide
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>Cancel</AdminButton>
          <AdminButton size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : applicant ? "Save changes" : "Register player"}
          </AdminButton>
        </>
      }
    >
      <SheetSection title="Position">
        <div className="grid grid-cols-2 gap-2.5">
          {applicant ? (
            <LockedValue
              label="Position"
              value={`${applicant.position} · ${positionLabel(applicant.position)}`}
              reason="Holds the spot. Move the player to change programs."
            />
          ) : (
            <Field label="Position" required error={err("position")} help="Takes one spot in this position.">
              <SelectInput
                value={form.position}
                onChange={set("position")}
                options={positionOptions(form.secondary_position, true)}
                placeholder="Select…"
                error={!!err("position")}
              />
            </Field>
          )}
          <Field label="Secondary position" error={err("secondary_position")}>
            <SelectInput
              value={form.secondary_position}
              onChange={set("secondary_position")}
              options={positionOptions(form.position, false)}
              placeholder="None"
              error={!!err("secondary_position")}
            />
          </Field>
        </div>
      </SheetSection>

      <SheetSection title="Player">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Experience type" required error={err("experience_type")} className="col-span-2">
            <SelectInput
              value={form.experience_type}
              onChange={set("experience_type")}
              options={EXPERIENCE_TYPES}
              placeholder="Select…"
              error={!!err("experience_type")}
            />
          </Field>
          <Field label="First name" required error={err("first_name")}>
            <TextInput value={form.first_name} onChange={set("first_name")} error={!!err("first_name")} />
          </Field>
          <Field label="Last name" required error={err("last_name")}>
            <TextInput value={form.last_name} onChange={set("last_name")} error={!!err("last_name")} />
          </Field>
          <Field label="Age" error={err("age")}>
            <TextInput type="number" value={form.age} onChange={set("age")} error={!!err("age")} />
          </Field>
          <Field label="Nationality">
            <TextInput value={form.nationality} onChange={set("nationality")} placeholder="e.g. Nigerian" />
          </Field>
          <Field label="Current country" className="col-span-2">
            <CountryDropdown
              defaultValue={alpha3ForCountry(form.current_location_country)}
              onChange={c => set("current_location_country")(c.name)}
              placeholder="Select a country"
            />
          </Field>
          <Field label="Visa required" className="col-span-2">
            <SwitchInput value={form.visa_required} onChange={set("visa_required")} onLabel="Needs a visa" offLabel="No visa needed" />
          </Field>
        </div>
      </SheetSection>

      <SheetSection title="Contact">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Email" required error={err("email")} className="col-span-2">
            <TextInput value={form.email} onChange={set("email")} error={!!err("email")} />
          </Field>
          <Field label="Phone" className="col-span-2" help="The dial code follows the current country; change it if needed.">
            <PhoneInput
              value={form.phone}
              onChange={set("phone")}
              country={form.current_location_country}
              boxClassName="h-8 rounded-md border-0 bg-background shadow-[0_0_0_1px_var(--edge)] focus-within:ring-0 focus-within:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]"
              inputClassName="h-8 bg-transparent text-[12.5px] text-foreground dark:bg-transparent"
            />
          </Field>
        </div>
      </SheetSection>
    </SheetShell>
  );
}

/* ── Player detail ──────────────────────────────────────────────────────── */

/* Keys shown in their own fields above; everything else the player submitted
   (the public form sends more) is listed as-is under "Submitted". */
const KNOWN_KEYS = new Set([
  "first_name", "last_name", "email", "phone", "age", "nationality",
  "current_location_country", "visa_required", "secondary_position",
]);

function ApplicantDetail({
  applicant: a,
  onClose,
  onEdit,
  onMove,
  onRemove,
}: {
  applicant: ProgramApplicant;
  onClose: () => void;
  onEdit: () => void;
  onMove: () => void;
  onRemove: () => void;
}) {
  const extra = Object.entries(a.payload ?? {}).filter(([k, v]) => !KNOWN_KEYS.has(k) && v != null && v !== "");
  return (
    <SheetShell
      title={applicantName(a)}
      subtitle={`${a.position} · ${positionLabel(a.position)}`}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onRemove}>Remove</AdminButton>
          <AdminButton variant="outline" size="sm" onClick={onMove}>Move</AdminButton>
          <AdminButton size="sm" onClick={onEdit}>Edit</AdminButton>
        </>
      }
    >
      <SheetSection title="Player">
        <SheetFacts
          facts={[
            ["Position", <PositionChip key="p" code={a.position} />],
            ["Secondary", <PositionChip key="s" code={a.payload?.secondary_position} />],
            ["Age", a.payload?.age != null ? String(a.payload.age) : "—"],
            ["Nationality", a.payload?.nationality ?? "—"],
            ["Country", a.payload?.current_location_country ?? "—"],
            ["Visa", a.payload?.visa_required ? "Required" : "Not required"],
            ["Status", <StatusPill key="st" label={a.status} />],
            ["Registered", asDate(a.created_at)],
          ]}
        />
      </SheetSection>
      <SheetSection title="Contact">
        <SheetFacts facts={[["Email", a.payload?.email ?? "—"], ["Phone", a.payload?.phone ?? "—"]]} />
      </SheetSection>
      {extra.length > 0 && (
        <SheetSection title="Submitted">
          <SheetFacts
            stacked
            facts={extra.map(([k, v]) => [k, typeof v === "object" ? JSON.stringify(v) : String(v)])}
          />
        </SheetSection>
      )}
    </SheetShell>
  );
}

/* ── Move to another program ────────────────────────────────────────────── */

function MoveSheet({
  applicant,
  fromProgramId,
  onClose,
}: {
  applicant: ProgramApplicant;
  fromProgramId: number;
  onClose: () => void;
}) {
  const programs = useAdminPrograms();
  const move = useMoveProgramApplicant();
  const [target, setTarget] = useState("");
  const targetId = target ? Number(target) : null;
  const targetAvailability = useAdminProgramAvailability(targetId);
  const t = targetAvailability.data?.data;

  const options = (programs.data?.data ?? [])
    .filter(p => p.id !== fromProgramId)
    .map(p => ({
      value: String(p.id),
      label: p.availability ? `${p.title} — ${p.availability}` : p.title,
      disabled: !!p.spot && (p.spot_left ?? 0) <= 0,
    }));

  const left = t ? positionLeft(t, applicant.position) : null;
  const programFull = !!t && t.spot > 0 && t.spot_left <= 0;
  const blocked = programFull || (left != null && left <= 0);

  return (
    <SheetShell
      title={`Move ${applicantName(applicant)}`}
      subtitle={`${applicant.position} · ${positionLabel(applicant.position)}`}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>Cancel</AdminButton>
          <AdminButton
            size="sm"
            disabled={!targetId || !t || blocked || move.isPending}
            onClick={() =>
              move.mutate(
                { applicantId: applicant.id, fromProgramId, toProgramId: targetId as number },
                { onSuccess: onClose },
              )
            }
          >
            {move.isPending ? "Moving…" : "Move player"}
          </AdminButton>
        </>
      }
    >
      <SheetSection title="Destination">
        <Field
          label="Program"
          required
          help="The player keeps their position and takes a spot in it on the new program."
        >
          <SelectInput
            value={target}
            onChange={setTarget}
            options={options}
            placeholder={programs.isLoading ? "Loading programs…" : "Select a program…"}
            disabled={programs.isLoading}
          />
        </Field>
      </SheetSection>

      {targetId && (
        <SheetSection title="Spots there">
          {targetAvailability.isLoading ? (
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          ) : targetAvailability.isError || !t ? (
            <p className="m-0 text-[12px] text-destructive">Could not load that program&apos;s spots.</p>
          ) : (
            <>
              <SheetFacts
                facts={[
                  ["Program", t.spot > 0 ? t.availability : "No spots set"],
                  [applicant.position, left == null ? "No per-position limit" : left <= 0 ? "Full" : `${left} left`],
                ]}
              />
              {blocked && (
                <p className="m-0 mt-2.5 text-[11.5px] text-destructive">
                  {programFull
                    ? "That program is full."
                    : `No ${applicant.position} spot is open there. Add one under Edit spots on that program first.`}
                </p>
              )}
            </>
          )}
        </SheetSection>
      )}
    </SheetShell>
  );
}
