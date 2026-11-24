"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import type { Country } from "@/components/ui/county-dropdown";
import { CampMobileBar, CampPanel } from "./camp-panel";
import { BackToHome } from "@/components/fan/auth-shell";
import { StepContact, StepDocuments, StepFootball, StepPerformance, StepPersonal } from "./steps";
import { NavRow, type Option } from "./ui";
import { submitPlayerRegistration } from "@/features/register-player/api";
import {
  useProgramApplicants,
  useProgramAvailability,
  useRegistrationPrograms,
} from "@/features/register-player/hooks";
import {
  ATTRIBUTES,
  STEPS,
  TOTAL_STEPS,
  positionSpotsLeft,
  type Contact,
  type Documents,
  type Errors,
  type Football,
  type Performance,
  type Personal,
} from "@/features/register-player/types";
import type { ProgramAvailability } from "@/services/programs";
import { Routes } from "@/routes";
import { cn } from "@/lib/utils";

/* /register/player on matchday — the golafly.com registration, in the Fan
   design system. One request: POST /v1/players ("submit information") with
   the chosen program_id; the backend takes the spot for the primary
   position. Registering a player straight onto a program
   (POST /v1/program/{id}/applicants) is the admin's manual route and is
   never called from here. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  step: number,
  p: Personal,
  f: Football,
  c: Contact,
  terms: boolean,
  availability?: ProgramAvailability,
): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!p.firstName.trim()) e.firstName = "Required";
    if (!p.lastName.trim()) e.lastName = "Required";
    if (!EMAIL.test(p.email.trim())) e.email = "Enter a valid email address";
    if (!p.phone.trim()) e.phone = "Required";
    if (!p.dateOfBirth) e.dateOfBirth = "Required";
    if (!p.gender) e.gender = "Required";
    if (!p.nationality) e.nationality = "Required";
    if (!p.countryOfResidence) e.countryOfResidence = "Required";
  } else if (step === 2) {
    if (!f.programId) e.programId = "Select a program";
    if (!f.primaryPosition) e.primaryPosition = "Required";
    if (!f.secondaryPosition) e.secondaryPosition = "Required";
    else if (f.secondaryPosition === f.primaryPosition) {
      e.secondaryPosition = "Must be different from your primary position";
    }
    if (availability) {
      const isFull = (code: string) => (positionSpotsLeft(availability, code) ?? 1) <= 0;
      if (availability.spot > 0 && availability.spot_left <= 0) {
        e.programId = "This program is full. Choose another program.";
      }
      if (f.primaryPosition && isFull(f.primaryPosition)) e.primaryPosition = "This position is full in this program";
      if (f.secondaryPosition && isFull(f.secondaryPosition)) e.secondaryPosition = "This position is full in this program";
    }
    if (!f.preferredFoot) e.preferredFoot = "Required";
    const h = Number(f.height);
    if (!f.height.trim()) e.height = "Required";
    else if (isNaN(h) || h < 100 || h > 250) e.height = "Enter a height between 100 and 250 cm";
    if (f.weight.trim()) {
      const w = Number(f.weight);
      if (isNaN(w) || w < 30 || w > 200) e.weight = "Enter a weight between 30 and 200 kg";
    }
    if (f.jerseyNumber.trim()) {
      const j = Number(f.jerseyNumber);
      if (isNaN(j) || j < 1 || j > 99) e.jerseyNumber = "Use a number from 1 to 99";
    }
    if (!f.level) e.level = "Select a level";
  } else if (step === 5) {
    if (!c.ecName.trim()) e.ecName = "Required";
    if (!c.ecRelationship) e.ecRelationship = "Required";
    if (!c.ecPhone.trim()) e.ecPhone = "Required";
    if (!terms) e.terms = "Accept the terms to submit";
  }
  return e;
}

/* Backend field → the form key it highlights and the step it lives on. */
const FIELD_MAP: Record<string, { key: string; step: number }> = {
  first_name: { key: "firstName", step: 1 },
  last_name: { key: "lastName", step: 1 },
  email: { key: "email", step: 1 },
  phone: { key: "phone", step: 1 },
  date_of_birth: { key: "dateOfBirth", step: 1 },
  gender: { key: "gender", step: 1 },
  nationality: { key: "nationality", step: 1 },
  country_of_residence: { key: "countryOfResidence", step: 1 },
  program_id: { key: "programId", step: 2 },
  primary_position: { key: "primaryPosition", step: 2 },
  secondary_position: { key: "secondaryPosition", step: 2 },
  preferred_foot: { key: "preferredFoot", step: 2 },
  jersey_number: { key: "jerseyNumber", step: 2 },
  height_cm: { key: "height", step: 2 },
  weight_kg: { key: "weight", step: 2 },
  current_level: { key: "level", step: 2 },
  emergency_contact_name: { key: "ecName", step: 5 },
  emergency_contact_relationship: { key: "ecRelationship", step: 5 },
  emergency_contact_phone: { key: "ecPhone", step: 5 },
  terms_accepted: { key: "terms", step: 5 },
};

const num = (v: string) => (v.trim() === "" ? undefined : Number(v));

export default function PlayerRegistrationForm() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ programTitle?: string } | null>(null);
  const [terms, setTerms] = useState(false);

  const [personal, setPersonal] = useState<Personal>({
    firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", gender: "",
    nationality: "", nationalityCode: "", countryOfResidence: "", countryOfResidenceCode: "", countryOfResidenceAlpha2: "",
    passportNumber: "", city: "", address: "", languages: [],
  });
  const [football, setFootball] = useState<Football>({
    programId: "", primaryPosition: "", secondaryPosition: "", preferredFoot: "",
    jerseyNumber: "", height: "", weight: "", currentClub: "", level: "", playerStatus: "", goals: [],
  });
  const [performance, setPerformance] = useState<Performance>({
    topSpeed: "", strength: "", stamina: "", agility: "", attributes: {},
    season: "", appearances: "", goals: "", assists: "", cleanSheets: "",
    minutesPlayed: "", yellowCards: "", redCards: "", achievements: [],
  });
  const [highlights, setHighlights] = useState<File[]>([]);
  const [documents, setDocuments] = useState<Documents>({
    profilePhoto: null, passportDocument: null, medicalCertificate: null,
  });
  const [contact, setContact] = useState<Contact>({
    ecName: "", ecRelationship: "", ecPhone: "", ecEmail: "",
    guardianName: "", guardianPhone: "", agentName: "", agentPhone: "", agentEmail: "", notes: "",
  });

  // Setters that also clear the field's error as it is edited.
  const setter = <T,>(update: React.Dispatch<React.SetStateAction<T>>) =>
    <K extends keyof T>(k: K) => (v: T[K]) => {
      update(prev => ({ ...prev, [k]: v }));
      setErrors(e => (e[k as string] ? { ...e, [k as string]: "" } : e));
    };
  const setP = setter(setPersonal);
  const setF = setter(setFootball);
  const setPerf = setter(setPerformance);
  const setD = setter(setDocuments);
  const setC = setter(setContact);

  const setCountry = (field: "nationality" | "countryOfResidence", c: Country) => {
    setPersonal(p =>
      field === "nationality"
        ? { ...p, nationality: c.name, nationalityCode: c.alpha3 }
        : { ...p, countryOfResidence: c.name, countryOfResidenceCode: c.alpha3, countryOfResidenceAlpha2: c.alpha2 },
    );
    setErrors(e => ({ ...e, [field]: "" }));
  };

  // Programs open for registration, and live spots for the chosen one.
  const programsQuery = useRegistrationPrograms();
  const today = new Date().toISOString().slice(0, 10);
  const openPrograms = useMemo(
    () => (programsQuery.data ?? []).filter(p => p.status && (!p.end_date || p.end_date.slice(0, 10) >= today)),
    [programsQuery.data, today],
  );
  const programOptions: Option[] = openPrograms.map(p => {
    const left = p.spot ? (p.spot_left ?? null) : null;
    if (left == null) return { value: String(p.id), label: p.title };
    if (left <= 0) return { value: String(p.id), label: p.title, disabled: true, hint: "Full", tone: "full" };
    return { value: String(p.id), label: p.title, hint: `${left} spot${left === 1 ? "" : "s"} left`, tone: left <= 3 ? "warn" : "muted" };
  });
  const selectedProgram = openPrograms.find(p => String(p.id) === football.programId);
  const programId = football.programId ? Number(football.programId) : null;
  const availabilityQuery = useProgramAvailability(programId);
  const applicantsQuery = useProgramApplicants(programId);
  const availability = availabilityQuery.data;

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const goNext = () => {
    const e = validate(step, personal, football, contact, terms, availability);
    if (Object.values(e).some(Boolean)) { setErrors(e); return; }
    setErrors({});
    setStep(s => Math.min(TOTAL_STEPS, s + 1));
    scrollTop();
  };
  const goBack = () => { setErrors({}); setStep(s => Math.max(1, s - 1)); scrollTop(); };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    // Re-check every step: a position can fill while the player is on 3–5.
    for (const s of [1, 2, 5]) {
      const e = validate(s, personal, football, contact, terms, availability);
      if (Object.values(e).some(Boolean)) {
        setErrors(e);
        setStep(s);
        toast.error(Object.values(e).find(Boolean));
        scrollTop();
        return;
      }
    }

    const player_attributes: Record<string, number> = {};
    for (const a of ATTRIBUTES) {
      const v = num(performance.attributes[a] ?? "");
      if (v != null) player_attributes[a.toLowerCase()] = v;
    }
    const rate_yourself: { strenght?: number; stamina?: number; agility?: number } = {};
    if (num(performance.strength) != null) rate_yourself.strenght = num(performance.strength);
    if (num(performance.stamina) != null) rate_yourself.stamina = num(performance.stamina);
    if (num(performance.agility) != null) rate_yourself.agility = num(performance.agility);
    const seasonValues = [
      performance.appearances, performance.goals, performance.assists, performance.cleanSheets,
      performance.minutesPlayed, performance.yellowCards, performance.redCards,
    ];
    const hasSeason = performance.season.trim() !== "" || seasonValues.some(v => v.trim() !== "");
    const achievements = performance.achievements
      .filter(a => a.title.trim())
      .map(a => ({ title: a.title.trim(), year: a.year.trim() || undefined }));
    const [y, m, d] = personal.dateOfBirth.split("-");

    setSubmitting(true);
    try {
      await submitPlayerRegistration({
        first_name: personal.firstName.trim(),
        last_name: personal.lastName.trim(),
        email: personal.email.trim(),
        phone: personal.phone.trim(),
        date_of_birth: `${m}/${d}/${y}`,
        gender: personal.gender,
        nationality: personal.nationality,
        country_of_residence: personal.countryOfResidence,
        passport_number: personal.passportNumber || undefined,
        city: personal.city || undefined,
        address: personal.address || undefined,
        language_spoken: personal.languages.length ? personal.languages : undefined,

        program_id: Number(football.programId),
        primary_position: football.primaryPosition,
        secondary_position: football.secondaryPosition,
        preferred_foot: football.preferredFoot,
        jersey_number: football.jerseyNumber || undefined,
        height_cm: football.height,
        weight_kg: football.weight || undefined,
        current_club_academy: football.currentClub || undefined,
        current_level: football.level,
        player_status: football.playerStatus || undefined,
        goals_with_golafly: football.goals.length ? football.goals : undefined,

        top_speed: performance.topSpeed || undefined,
        rate_yourself: Object.keys(rate_yourself).length ? rate_yourself : undefined,
        player_attributes: Object.keys(player_attributes).length ? player_attributes : undefined,
        career_statistics: hasSeason
          ? {
              season: performance.season.trim() || "Current",
              appearances: num(performance.appearances),
              goals: num(performance.goals),
              assists: num(performance.assists),
              clean_sheets: num(performance.cleanSheets),
              minutes_played: num(performance.minutesPlayed),
              yellow_card: num(performance.yellowCards),
              red_cards: num(performance.redCards),
            }
          : undefined,
        achievements: achievements.length ? achievements : undefined,

        profile_photo: documents.profilePhoto,
        passport_document: documents.passportDocument,
        medical_certificate: documents.medicalCertificate,
        highlights: highlights.length ? highlights : undefined,

        emergency_contact_name: contact.ecName.trim(),
        emergency_contact_relationship: contact.ecRelationship,
        emergency_contact_phone: contact.ecPhone.trim(),
        emergency_contact_email: contact.ecEmail || undefined,
        guardian_name: contact.guardianName || undefined,
        guardian_phone: contact.guardianPhone || undefined,
        agency_name: contact.agentName || undefined,
        agency_phone: contact.agentPhone || undefined,
        agency_email: contact.agentEmail || undefined,
        additional_notes: contact.notes || undefined,
      });
      setDone({ programTitle: selectedProgram?.title });
      scrollTop();
    } catch (err: unknown) {
      // A spot may have gone while the player was on the later steps.
      availabilityQuery.refetch();
      applicantsQuery.refetch();
      const data = (err as { response?: { data?: { errors?: Record<string, string[] | string>; message?: string } } })
        ?.response?.data;
      const mapped: Errors = {};
      let earliest = TOTAL_STEPS + 1;
      const other: string[] = [];
      for (const [field, raw] of Object.entries(data?.errors ?? {})) {
        const msg = Array.isArray(raw) ? raw[0] : raw;
        if (!msg) continue;
        const hit = FIELD_MAP[field];
        if (hit) {
          mapped[hit.key] = msg;
          earliest = Math.min(earliest, hit.step);
        } else {
          other.push(msg);
        }
      }
      if (earliest <= TOTAL_STEPS) {
        setErrors(mapped);
        setStep(earliest);
        scrollTop();
      }
      toast.error(Object.values(mapped)[0] ?? other[0] ?? data?.message ?? "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const showCamp = step >= 2 && !done;
  const campProps = {
    program: selectedProgram,
    availability,
    applicants: applicantsQuery.isError ? undefined : applicantsQuery.data,
    loading: availabilityQuery.isLoading,
    primaryPosition: football.primaryPosition,
    secondaryPosition: football.secondaryPosition,
  };

  return (
    <main className="relative min-h-dvh bg-background px-4 pb-24 pt-16 sm:pt-10">
      <BackToHome />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px]"
        style={{
          background:
            "radial-gradient(ellipse at 80% -25%, color-mix(in oklch, var(--brand) 13%, transparent), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-[1080px]">
        <Link href={Routes.home} className="block text-center">
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">GOLAFLY</span>
        </Link>

        {done ? (
          <div className="mx-auto mt-8 max-w-[520px] rounded-[28px] border border-border bg-card p-8 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-foreground">
              <CircleCheck className="size-6" />
            </span>
            <h1 className="mt-4 font-heading text-xl font-bold tracking-[-0.03em] text-foreground">Registration received</h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Your profile is saved{done.programTitle ? ` and your ${football.primaryPosition} spot on ${done.programTitle} is reserved` : ""}.
              We&apos;ll email {personal.email} with next steps.
            </p>
            <Link
              href={Routes.home}
              className="mt-6 inline-flex h-11 items-center rounded-[14px] bg-brand px-6 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-[18px] mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
              <div>
                <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Step {step} of {TOTAL_STEPS} · {STEPS[step - 1]}
                </p>
                <h1 className="mt-1.5 text-balance font-heading text-[22px] font-bold tracking-[-0.03em] text-foreground sm:text-[26px]">
                  Register as a player
                </h1>
                <p className="mt-1 max-w-[56ch] text-[13px] text-muted-foreground">
                  Build the profile scouts see, choose your program and take your spot in your position.
                </p>
              </div>
              <Stepper step={step} />
            </div>

            {showCamp && (
              <div className="mb-3.5 min-[1000px]:hidden">
                <CampMobileBar {...campProps} />
              </div>
            )}

            <div className={cn("grid items-start gap-[18px]", showCamp && "min-[1000px]:grid-cols-[minmax(0,1fr)_340px]")}>
              <form
                onSubmit={submit}
                noValidate
                className="flex flex-col gap-6 rounded-[22px] border border-border bg-card p-[18px] sm:rounded-[28px] sm:p-6"
              >
                {step === 1 && <StepPersonal data={personal} set={setP} setCountry={setCountry} errors={errors} />}
                {step === 2 && (
                  <StepFootball
                    data={football}
                    set={setF}
                    programOptions={programOptions}
                    programsLoading={programsQuery.isLoading}
                    availability={availability}
                    errors={errors}
                  />
                )}
                {step === 3 && (
                  <StepPerformance data={performance} set={setPerf} highlights={highlights} setHighlights={setHighlights} />
                )}
                {step === 4 && <StepDocuments data={documents} set={setD} />}
                {step === 5 && <StepContact data={contact} set={setC} errors={errors} terms={terms} setTerms={setTerms} country={personal.countryOfResidenceAlpha2} />}

                <NavRow
                  step={step}
                  last={step === TOTAL_STEPS}
                  onBack={goBack}
                  onNext={goNext}
                  submitting={submitting}
                />
              </form>

              {showCamp && (
                <div className="sticky top-5 hidden min-[1000px]:block">
                  <CampPanel {...campProps} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

/* Five segments; done steps in lime text, the current one in lime with a
   glow. Only the current step's name shows on a phone. */
function Stepper({ step }: { step: number }) {
  return (
    <ol className="grid w-full max-w-[520px] flex-[1_1_420px] grid-cols-5 gap-1.5" aria-label="Registration steps">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const state = n === step ? "on" : n < step ? "done" : "todo";
        return (
          <li key={s} aria-current={state === "on" ? "step" : undefined} className="flex flex-col gap-[7px]">
            <span
              className={cn(
                "h-[5px] rounded-full",
                state === "on" && "bg-brand shadow-[0_0_10px_var(--brand-glow)]",
                state === "done" && "bg-brand-text",
                state === "todo" && "bg-[var(--edge-strong)]",
              )}
            />
            <span
              className={cn(
                "text-[11.5px] font-semibold",
                state === "todo" ? "text-muted-foreground" : "text-foreground",
                state !== "on" && "hidden sm:inline",
                state === "on" && "whitespace-nowrap",
              )}
            >
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
