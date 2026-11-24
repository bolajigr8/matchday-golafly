"use client";

import { ArrowRight, Check, CircleCheck, LoaderCircle } from "lucide-react";
import { InfoTip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BAND_BG,
  BAND_TOKEN,
  EVAL_STEPS,
  OVERALL_TIP,
  POTENTIAL_TIP,
  PROVISIONAL_TIP,
  bandLabel,
  stepIndex,
  stepPercent,
  type EvaluationBand,
} from "@/features/scout/labels";

/* The evaluation-specific controls. Everything else on these screens comes
   from the admin component layer unchanged.

   ── THE SCALE ────────────────────────────────────────────────────────────
   Ten discrete cells, never a slider. A slider invites a scout to drag until
   it "looks right"; ten targets make the choice a decision, and make two
   scouts' 7s mean the same thing. The chosen cell is OUTLINED rather than
   filled, because a filled cell at position 9 reads as a progress bar that is
   nearly done — which is not what a 9 means. */

export function ScoreScale({
  label,
  description,
  icon,
  value,
  onChange,
  invalid,
  disabled,
}: {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  value: number | null;
  onChange?: (score: number) => void;
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[var(--edge)] py-2.5 last:border-b-0",
        disabled && "opacity-60",
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="grid size-[26px] shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold">{label}</span>
          {description && (
            <span className="block truncate text-[10.5px] text-muted-foreground">
              {description}
            </span>
          )}
        </span>
      </div>

      <div className="flex gap-[3px]" role="radiogroup" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={disabled}
              onClick={() => onChange?.(n)}
              className={cn(
                "grid h-[26px] w-[27px] place-items-center rounded-md border font-mono text-[11px] tabular-nums transition-colors",
                on
                  ? "border-2 border-[var(--brand-edge)] bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] font-bold text-brand-text"
                  : invalid
                    ? "border-[var(--status-danger)] text-[var(--status-danger)]"
                    : "border-border bg-card text-muted-foreground hover:border-[var(--brand-edge)] hover:text-foreground",
                disabled && "cursor-not-allowed",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>

      {/* Mono and tabular so a column of these lines up on the decimal — they
          get compared down the column far more often than read one at a time. */}
      <span
        className={cn(
          "min-w-[34px] text-right font-mono text-[14px] tabular-nums",
          value == null ? "font-normal text-muted-foreground" : "font-bold text-brand-text",
        )}
      >
        {value == null ? "—" : value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── RAG column ───────────────────────────────────────────────────────────
   Tone lives on the wrapper and everything inside inherits it, so adding an
   attribute to a category never means picking a colour by hand. That is what
   keeps the methodology configurable without a design pass. */

export function RagColumn({
  band,
  subtitle,
  children,
}: {
  band: EvaluationBand;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border p-4"
      style={{
        background: BAND_BG[band],
        borderColor: `color-mix(in oklab, ${BAND_TOKEN[band]} 32%, transparent)`,
        /* Sets `currentColor` for the row dividers and cell hover inside, so a
           row separator is a tint of its own band rather than a generic grey
           line that fights three different backgrounds. */
        color: BAND_TOKEN[band],
      }}
    >
      <p className="m-0 flex items-center gap-2 font-heading text-[13px] font-semibold">
        <i className="size-[9px] shrink-0 rounded-full bg-current" />
        {bandLabel(band)}
      </p>
      <p className="m-0 mb-4 mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
      <div className="text-foreground">{children}</div>
    </div>
  );
}

/** A detailed attribute inside a RAG column. Ten cells again, at RAG density —
 *  same mental model as ScoreScale, so a scout is not learning two controls. */
export function RagRow({
  label,
  score,
  band,
  onChange,
  disabled,
}: {
  label: string;
  score: number | null;
  band: EvaluationBand;
  onChange?: (score: number) => void;
  disabled?: boolean;
}) {
  /* Roomier than it was. Eleven of these stack inside a column, and at the
     old density — 19px cells, 2px gaps, 12px between rows — the whole section
     read as one grey block of digits with no boundary between attributes.
     Taller cells, a wider gap, and a rule between rows make each attribute a
     thing you can look at on its own, which is what scoring one requires. */
  return (
    <div className="mb-3.5 border-b border-[color-mix(in_oklab,currentColor_12%,transparent)] pb-3.5 last:mb-0 last:border-b-0 last:pb-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-[12px] font-semibold">{label}</span>
        <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
          {score == null ? "—" : `${score}/10`}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const on = score === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(n)}
              aria-label={`${label} ${n}`}
              className={cn(
                "grid h-[26px] flex-1 place-items-center rounded-[4px] border font-mono text-[10px] transition-colors",
                on
                  ? "font-bold text-card"
                  : "border-border bg-card text-muted-foreground hover:border-current hover:text-foreground",
                disabled && "cursor-not-allowed",
              )}
              style={on ? { background: BAND_TOKEN[band], borderColor: BAND_TOKEN[band] } : undefined}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step rail ────────────────────────────────────────────────────────────
   States are derived from POSITION, not hand-flagged, so a rail can never
   show step 5 done and step 2 pending. Mirrors evalSteps() in
   design/partials.mjs. */

export function StepRail({
  current,
  onSelect,
}: {
  current: string;
  onSelect?: (key: string) => void;
}) {
  const at = stepIndex(current);
  const pct = stepPercent(current);

  return (
    <div className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-heading text-[13px] font-semibold">Evaluation progress</span>
        <span className="font-mono text-[10.5px] text-muted-foreground">{pct}% complete</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 grid gap-0.5">
        {EVAL_STEPS.map((step, i) => {
          const state = i < at ? "done" : i === at ? "current" : "pending";
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => onSelect?.(step.key)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                state === "current" && "bg-muted",
                state === "pending" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              <span
                className={cn(
                  "grid size-[21px] shrink-0 place-items-center rounded-full border font-mono text-[10px]",
                  state === "done" && "border-[var(--status-good)] bg-[var(--status-good)] text-card",
                  state === "current" &&
                    "border-[var(--brand-edge)] bg-brand font-bold text-brand-foreground",
                  state === "pending" && "border-border",
                )}
              >
                {state === "done" ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-semibold">{step.label}</span>
                <span
                  className={cn(
                    "block truncate text-[10px]",
                    state === "done" && "text-[var(--status-good)]",
                    state === "current" && "text-brand-text",
                    state === "pending" && "text-muted-foreground",
                  )}
                >
                  {state === "done" ? "Completed" : state === "current" ? "In progress" : step.hint}
                </span>
              </span>
              {state === "current" && <ArrowRight className="size-3.5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Overall readout ──────────────────────────────────────────────────────
   Deliberately not a chart. Two numbers a scout and a club both quote
   verbatim, so they are set as numbers — the way a score is spoken, not the
   way a metric is plotted. Derived, never entered: a scout who could type the
   overall would type it, and the attributes would become decoration. */

export function OverallReadout({
  score,
  potential,
  classification,
  stars,
  provisional,
}: {
  score: number | null;
  potential: number | null;
  classification?: string | null;
  stars?: number | null;
  provisional?: boolean;
}) {
  return (
    <div className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <div className="font-heading text-[13px] font-semibold">Overall assessment</div>

      <p className="mt-2.5 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {provisional ? "Provisional score" : "Overall score"}
        <InfoTip label={provisional ? "the provisional score" : "the overall score"}>
          {provisional ? PROVISIONAL_TIP : OVERALL_TIP}
        </InfoTip>
      </p>
      <p className="flex items-baseline gap-1.5 font-heading text-[34px] font-bold leading-none tabular-nums text-brand-text">
        {score == null ? "—" : score.toFixed(1)}
        <span className="font-mono text-[13px] font-normal text-muted-foreground">/10</span>
      </p>

      <p className="mt-3 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        Potential
        <InfoTip label="potential">{POTENTIAL_TIP}</InfoTip>
      </p>
      <p className="flex items-baseline gap-1.5 font-heading text-[34px] font-bold leading-none tabular-nums text-brand-text">
        {potential == null ? "—" : potential}
        {/* /10, not %. The invented contract had potential as a 0–100
            percentage; this API sends 1–10, so a 6 was rendering as "6%". */}
        <span className="font-mono text-[13px] font-normal text-muted-foreground">/10</span>
      </p>

      {stars != null && (
        <span className="mt-1.5 flex gap-0.5 text-brand-text">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < stars ? "" : "text-border"}>
              ★
            </span>
          ))}
        </span>
      )}
      {classification && (
        <p className="mt-1 text-[11px] text-muted-foreground">{classification}</p>
      )}

    </div>
  );
}

/** Autosave. A line, never a toast: it fires every few seconds, and a toast
 *  that often becomes noise a scout learns to dismiss unread. */
export function AutoSave({ saving, savedAt }: { saving: boolean; savedAt?: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
      {saving ? (
        <>
          <LoaderCircle className="size-3.5 animate-spin" />
          Saving…
        </>
      ) : (
        <>
          <CircleCheck className="size-3.5 text-[var(--status-good)]" />
          All changes saved{savedAt ? ` · ${savedAt}` : ""}
        </>
      )}
    </span>
  );
}

/** Percentile bar. The full cohort track stays visible behind the marker —
 *  "top 18%" is a statement about everyone else, so a bar that draws only the
 *  filled portion answers a different question. */
export function PercentileBar({
  label,
  percentile,
}: {
  label: string;
  percentile: number;
}) {
  return (
    <div className="grid grid-cols-[108px_1fr_62px] items-center gap-3 py-1.5 text-[11.5px]">
      <span className="truncate">{label}</span>
      <span className="relative h-2 rounded-full border border-[var(--edge)] bg-muted">
        <i
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
          style={{ width: `${percentile}%` }}
        />
        <i
          className="absolute top-1/2 h-[15px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-foreground"
          style={{ left: `${percentile}%` }}
        />
      </span>
      <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
        Top <b className="text-foreground">{100 - percentile}%</b>
      </span>
    </div>
  );
}
