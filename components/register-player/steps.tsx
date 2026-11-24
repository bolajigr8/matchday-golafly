"use client";

import { useRef } from "react";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { CountryDropdown, type Country } from "@/components/ui/county-dropdown";
import {
  Chips,
  Field,
  Grid,
  PhoneField,
  ImageThumb,
  RangeField,
  Section,
  SelectField,
  TextField,
  UploadRow,
  inputClass,
  type Option,
} from "./ui";
import {
  ATTRIBUTES,
  FEET,
  GENDERS,
  GOALS,
  LANGUAGES,
  LEVELS,
  PLAYER_STATUSES,
  POSITIONS,
  RELATIONSHIPS,
  positionSpotsLeft,
  type Contact,
  type Documents,
  type Errors,
  type Football,
  type Performance,
  type Personal,
} from "@/features/register-player/types";
import type { ProgramAvailability } from "@/services/programs";

type Set<T> = <K extends keyof T>(k: K) => (v: T[K]) => void;

/* ── 1. Personal ──────────────────────────────────────────────────────── */

export function StepPersonal({
  data,
  set,
  setCountry,
  errors,
}: {
  data: Personal;
  set: Set<Personal>;
  setCountry: (field: "nationality" | "countryOfResidence", c: Country) => void;
  errors: Errors;
}) {
  const country = (field: "nationality" | "countryOfResidence", code: string, label: string) => (
    <Field label={label} required error={errors[field]}>
      <CountryDropdown
        defaultValue={code || undefined}
        onChange={c => setCountry(field, c)}
        placeholder="Select country"
        triggerClassName={inputClass(errors[field])}
      />
    </Field>
  );

  return (
    <>
      <Section title="Personal information" sub="Your name and nationality appear on the profile scouts see.">
        <Grid>
          <TextField id="firstName" label="First name" value={data.firstName} onChange={set("firstName")} required error={errors.firstName} autoComplete="given-name" />
          <TextField id="lastName" label="Last name" value={data.lastName} onChange={set("lastName")} required error={errors.lastName} autoComplete="family-name" />
          <TextField id="email" label="Email address" type="email" value={data.email} onChange={set("email")} required error={errors.email} autoComplete="email" />
          <PhoneField id="phone" label="Phone / WhatsApp" value={data.phone} onChange={set("phone")} country={data.countryOfResidenceAlpha2} required error={errors.phone} />
          <TextField id="dob" label="Date of birth" type="date" value={data.dateOfBirth} onChange={set("dateOfBirth")} required error={errors.dateOfBirth} />
          <SelectField id="gender" label="Gender" value={data.gender} onChange={set("gender")} options={GENDERS} required error={errors.gender} />
          {country("nationality", data.nationalityCode, "Nationality")}
          {country("countryOfResidence", data.countryOfResidenceCode, "Country of residence")}
          <TextField id="passport" label="Passport number" value={data.passportNumber} onChange={set("passportNumber")} placeholder="Optional" />
          <TextField id="city" label="City" value={data.city} onChange={set("city")} autoComplete="address-level2" />
          <TextField id="address" label="Address" value={data.address} onChange={set("address")} full autoComplete="street-address" />
        </Grid>
      </Section>

      <Section title="Languages spoken">
        <Chips
          options={LANGUAGES}
          isOn={l => data.languages.includes(l)}
          onToggle={l =>
            set("languages")(data.languages.includes(l) ? data.languages.filter(x => x !== l) : [...data.languages, l])
          }
        />
      </Section>
    </>
  );
}

/* ── 2. Football ──────────────────────────────────────────────────────── */

/* Options for one position select, valued by code. The other pick is
   disabled; a position with no spot left on the program shows "Full". Both
   primary and secondary need an open spot. */
function positionOptions(which: "primary" | "secondary", data: Football, availability?: ProgramAvailability): Option[] {
  const mine = which === "primary" ? data.primaryPosition : data.secondaryPosition;
  const other = which === "primary" ? data.secondaryPosition : data.primaryPosition;
  return POSITIONS.map(({ code, label: name }) => {
    const label = (
      <>
        <span className="mr-2 font-mono text-[11px] font-bold">{code}</span>
        {name}
      </>
    );
    if (code === other) {
      return { value: code, label, disabled: true, hint: which === "primary" ? "Your secondary" : "Your primary" };
    }
    const left = positionSpotsLeft(availability, code);
    if (left == null) return { value: code, label };
    if (left <= 0 && code !== mine) return { value: code, label, disabled: true, hint: "Full", tone: "full" };
    return { value: code, label, hint: `${Math.max(left, 0)} left`, tone: left <= 1 ? "warn" : "muted" };
  });
}

export function StepFootball({
  data,
  set,
  programOptions,
  programsLoading,
  availability,
  errors,
}: {
  data: Football;
  set: Set<Football>;
  programOptions: Option[];
  programsLoading: boolean;
  availability?: ProgramAvailability;
  errors: Errors;
}) {
  return (
    <>
      <Section
        title="Program & positions"
        sub="Each program has a set number of spots per position. You take one in your primary position, and your secondary needs space too."
      >
        <Grid>
          <SelectField
            id="program"
            label="Program"
            value={data.programId}
            onChange={set("programId")}
            options={programOptions}
            placeholder={programsLoading ? "Loading programs…" : "Select a program"}
            disabled={programsLoading}
            required
            error={errors.programId}
            full
          />
          <SelectField id="primary" label="Primary position" value={data.primaryPosition} onChange={set("primaryPosition")} options={positionOptions("primary", data, availability)} required error={errors.primaryPosition} />
          <SelectField id="secondary" label="Secondary position" value={data.secondaryPosition} onChange={set("secondaryPosition")} options={positionOptions("secondary", data, availability)} required error={errors.secondaryPosition} />
        </Grid>
      </Section>

      <Section title="Football profile">
        <Grid cols={3}>
          <SelectField id="foot" label="Preferred foot" value={data.preferredFoot} onChange={set("preferredFoot")} options={FEET} required error={errors.preferredFoot} />
          <TextField id="jersey" label="Jersey number" type="number" value={data.jerseyNumber} onChange={set("jerseyNumber")} error={errors.jerseyNumber} placeholder="e.g. 9" />
          <SelectField id="status" label="Player status" value={data.playerStatus} onChange={set("playerStatus")} options={PLAYER_STATUSES} />
          <TextField id="height" label="Height (cm)" type="number" value={data.height} onChange={set("height")} required error={errors.height} placeholder="e.g. 180" />
          <TextField id="weight" label="Weight (kg)" type="number" value={data.weight} onChange={set("weight")} error={errors.weight} placeholder="e.g. 74" />
          <TextField id="club" label="Current club / academy" value={data.currentClub} onChange={set("currentClub")} />
        </Grid>
      </Section>

      <Section title="Current level *">
        <Chips options={LEVELS} isOn={l => data.level === l} onToggle={set("level")} />
        {errors.level && <p className="mt-2 text-[11.5px] text-[var(--status-danger)]">{errors.level}</p>}
      </Section>

      <Section title="Goals with Golafly">
        <Chips
          options={GOALS}
          isOn={g => data.goals.includes(g)}
          onToggle={g => set("goals")(data.goals.includes(g) ? data.goals.filter(x => x !== g) : [...data.goals, g])}
        />
      </Section>
    </>
  );
}

/* ── 3. Performance ───────────────────────────────────────────────────── */

export function StepPerformance({
  data,
  set,
  highlights,
  setHighlights,
}: {
  data: Performance;
  set: Set<Performance>;
  highlights: File[];
  setHighlights: (f: File[]) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const setAttr = (label: string) => (v: string) => set("attributes")({ ...data.attributes, [label]: v });
  const setAchievement = (i: number, k: "title" | "year", v: string) =>
    set("achievements")(data.achievements.map((a, idx) => (idx === i ? { ...a, [k]: v } : a)));

  return (
    <>
      <Section title="Physical" sub="Rate yourself honestly. Scouts compare this with what they see.">
        <Grid>
          <TextField id="topSpeed" label="Top speed (km/h)" type="number" value={data.topSpeed} onChange={set("topSpeed")} placeholder="e.g. 31" />
          <div className="hidden sm:block" />
          <RangeField id="strength" label="Strength" value={data.strength} onChange={set("strength")} />
          <RangeField id="stamina" label="Stamina" value={data.stamina} onChange={set("stamina")} />
          <RangeField id="agility" label="Agility" value={data.agility} onChange={set("agility")} />
        </Grid>
      </Section>

      <Section title="Player attributes">
        <Grid>
          {ATTRIBUTES.map(a => (
            <RangeField key={a} id={`attr-${a}`} label={a} value={data.attributes[a] ?? ""} onChange={setAttr(a)} />
          ))}
        </Grid>
      </Section>

      <Section title="Season statistics">
        <Grid cols={3}>
          <TextField id="season" label="Season" value={data.season} onChange={set("season")} placeholder="2025/2026" />
          <TextField id="apps" label="Appearances" type="number" value={data.appearances} onChange={set("appearances")} />
          <TextField id="goals" label="Goals" type="number" value={data.goals} onChange={set("goals")} />
          <TextField id="assists" label="Assists" type="number" value={data.assists} onChange={set("assists")} />
          <TextField id="cleanSheets" label="Clean sheets" type="number" value={data.cleanSheets} onChange={set("cleanSheets")} />
          <TextField id="minutes" label="Minutes played" type="number" value={data.minutesPlayed} onChange={set("minutesPlayed")} />
          <TextField id="yellow" label="Yellow cards" type="number" value={data.yellowCards} onChange={set("yellowCards")} />
          <TextField id="red" label="Red cards" type="number" value={data.redCards} onChange={set("redCards")} />
        </Grid>
      </Section>

      <Section title="Achievements">
        <div className="flex flex-col gap-2.5">
          {data.achievements.map((a, i) => (
            <div key={i} className="grid grid-cols-[1fr_96px_44px] gap-2.5">
              <input aria-label="Achievement" value={a.title} onChange={e => setAchievement(i, "title", e.target.value)} placeholder="e.g. Youth League Winner" className={inputClass()} />
              <input aria-label="Year" value={a.year} onChange={e => setAchievement(i, "year", e.target.value)} placeholder="Year" inputMode="numeric" className={inputClass()} />
              <button
                type="button"
                aria-label="Remove achievement"
                onClick={() => set("achievements")(data.achievements.filter((_, idx) => idx !== i))}
                className="flex size-11 items-center justify-center rounded-[14px] text-muted-foreground shadow-[0_0_0_1px_var(--edge-strong)] hover:bg-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("achievements")([...data.achievements, { title: "", year: "" }])}
            className="inline-flex h-10 w-fit items-center gap-1.5 rounded-xl px-3.5 text-[12.5px] font-semibold text-brand-text shadow-[0_0_0_1px_var(--edge-strong)] hover:bg-muted"
          >
            <Plus className="size-4" />
            Add achievement
          </button>
        </div>
      </Section>

      <Section title="Highlight images" sub="Match photos scouts see on your profile. JPG or PNG.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {highlights.map((f, i) => (
            <ImageThumb key={`${f.name}-${i}`} file={f} onRemove={() => setHighlights(highlights.filter((_, idx) => idx !== i))} />
          ))}
          <button
            type="button"
            onClick={() => picker.current?.click()}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-[14px] border border-dashed border-[var(--edge-strong)] bg-muted text-[11.5px] font-semibold text-muted-foreground hover:text-foreground"
          >
            <ImagePlus className="size-5" />
            Add images
          </button>
        </div>
        <input
          ref={picker}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => {
            setHighlights([...highlights, ...Array.from(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </Section>
    </>
  );
}

/* ── 4. Documents ─────────────────────────────────────────────────────── */

export function StepDocuments({
  data,
  set,
}: {
  data: Documents;
  set: Set<Documents>;
}) {
  return (
    <Section title="Documents & media" sub="All optional. Adding them now speeds up trial approval.">
      <div className="flex flex-col gap-3">
        <UploadRow label="Profile photo" hint="JPG / PNG, max 5MB" accept="image/*" file={data.profilePhoto} onChange={set("profilePhoto")} />
        <UploadRow label="Passport / ID scan" hint="PDF / JPG, max 10MB" accept="image/*,application/pdf" file={data.passportDocument} onChange={set("passportDocument")} />
        <UploadRow label="Medical certificate" hint="PDF, max 10MB" accept="application/pdf,image/*" file={data.medicalCertificate} onChange={set("medicalCertificate")} />
      </div>
    </Section>
  );
}

/* ── 5. Contact ───────────────────────────────────────────────────────── */

export function StepContact({
  data,
  set,
  errors,
  terms,
  setTerms,
  country,
}: {
  data: Contact;
  set: Set<Contact>;
  errors: Errors;
  terms: boolean;
  setTerms: (v: boolean) => void;
  /* The player's country of residence — the dial code these numbers start on. */
  country?: string;
}) {
  return (
    <>
      <Section title="Emergency contact">
        <Grid>
          <TextField id="ecName" label="Contact full name" value={data.ecName} onChange={set("ecName")} required error={errors.ecName} />
          <SelectField id="ecRel" label="Relationship" value={data.ecRelationship} onChange={set("ecRelationship")} options={RELATIONSHIPS} required error={errors.ecRelationship} />
          <PhoneField id="ecPhone" label="Phone / WhatsApp" value={data.ecPhone} onChange={set("ecPhone")} country={country} required error={errors.ecPhone} />
          <TextField id="ecEmail" label="Email" type="email" value={data.ecEmail} onChange={set("ecEmail")} placeholder="Optional" />
        </Grid>
      </Section>

      <Section title="Guardian & agent" sub="For players under 18, a guardian is needed before travel.">
        <Grid>
          <TextField id="guardianName" label="Guardian name" value={data.guardianName} onChange={set("guardianName")} />
          <PhoneField id="guardianPhone" label="Guardian phone" value={data.guardianPhone} onChange={set("guardianPhone")} country={country} />
          <TextField id="agentName" label="Agent / agency name" value={data.agentName} onChange={set("agentName")} />
          <PhoneField id="agentPhone" label="Agent phone" value={data.agentPhone} onChange={set("agentPhone")} country={country} />
          <TextField id="agentEmail" label="Agent email" type="email" value={data.agentEmail} onChange={set("agentEmail")} full />
        </Grid>
      </Section>

      <Section title="Additional notes">
        <textarea
          id="notes"
          value={data.notes}
          onChange={e => set("notes")(e.target.value)}
          rows={3}
          placeholder="Anything scouts should know"
          className={`${inputClass()} h-auto resize-y py-3`}
        />
      </Section>

      <div>
        <label className="flex items-start gap-2.5 text-xs leading-[18px] text-muted-foreground">
          <input
            id="terms"
            type="checkbox"
            checked={terms}
            onChange={e => setTerms(e.target.checked)}
            className="mt-px size-4 shrink-0 accent-[var(--brand-text)]"
          />
          <span>
            Registering does not guarantee a place. By submitting, you agree to Golafly&apos;s{" "}
            <a href="/help-faqs" className="font-semibold text-brand-text">Terms and Privacy Policy</a>.
          </span>
        </label>
        {errors.terms && <p className="mt-1.5 text-[11.5px] text-[var(--status-danger)]">{errors.terms}</p>}
      </div>
    </>
  );
}
