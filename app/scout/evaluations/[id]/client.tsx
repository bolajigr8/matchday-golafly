"use client";

import { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  LayoutTemplate,
  PenLine,
  PlayCircle,
  Save,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminButton } from "@/components/admin/admin-ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { InfoTip } from "@/components/ui/tooltip";
import {
  AutoSave,
  OverallReadout,
  ScoreScale,
  StepRail,
} from "@/components/scout/eval-controls";
import { ScoutError, TemplateSource } from "@/components/scout/scout-states";
import { useAssignedPlayer, useSaveEvaluation } from "@/features/scout/hooks";
import {
  EVAL_STEPS,
  GOOD_TIP,
  POTENTIAL_TIP,
  PROVISIONAL_FIELD_TIP,
  bandFor,
  bandLabel,
  stepIndex,
} from "@/features/scout/labels";
import {
  group,
  isLockedForScout,
  overallAverage,
  plan,
  reviewLabel,
  reviewState,
  summary,
  type AssignedPlayer,
  type EvalGroupSpec,
  type SaveEvaluationPayload,
} from "@/features/scout/evaluation";
import {
  templateFieldCount,
  templateFor,
  type ResolvedTemplate,
} from "@/features/scout/templates";
import { scoutInitials } from "@/features/scout/session";
import { playerFullName } from "@/services/players";
import { Routes } from "@/routes";

/* THE EVALUATION.
 *
 * One route, seven steps, `?step=` in the URL so a half-finished evaluation is
 * linkable and the browser back button behaves. Work on the left, context rail
 * on the right, wizard footer at the bottom.
 *
 * ── `[id]` IS A PLAYER ID ─────────────────────────────────────────────────
 * Not an evaluation id. The API keys evaluations on the player
 * (PUT /v1/players/{id}/evaluation), exactly one per player.
 *
 * ── WHAT IS SCORED COMES FROM THE PLAYER'S POSITION ───────────────────────
 * templateFor() picks the template for the player's primary position
 * (features/scout/templates.ts). The four group steps render that template's
 * attributes, so a goalkeeper is scored on shot stopping and a winger on
 * crossing. The API's four group keys are unchanged; only the attribute keys
 * inside them differ.
 *
 * ── SAVING ────────────────────────────────────────────────────────────────
 * The PUT replaces the whole evaluation, so the form is local state written
 * when you move between steps and when you press Save. The last step's button
 * submits: the same PUT, then back to the Evaluations list.
 *
 * ── STATUS ────────────────────────────────────────────────────────────────
 * A scout always writes `pending`. The admin rules: Approve and Reject lock the
 * form; Needs revision reopens it with the admin's note shown on top. `note`
 * belongs to the admin, so the wizard sends the stored note back untouched.
 */

interface Draft {
  scores: Record<string, Record<string, number>>;
  focus: string;
  timeline: string;
  headline: string;
  recommendation: string;
  good: string;
  potential: string;
  provisional_score: string;
}

const EMPTY: Draft = {
  scores: { technical: {}, tactical: {}, physical: {}, mental: {} },
  focus: "",
  timeline: "",
  headline: "",
  recommendation: "",
  good: "",
  potential: "",
  provisional_score: "",
};

/* WHOLE NUMBERS ONLY. The API 422s on a float ("The provisional score must be
 * an integer."), and because PUT replaces the whole document, one float loses
 * the entire evaluation. */
const intOrNull = (v: string): number | null => {
  const n = Number(v);
  return v.trim() !== "" && Number.isFinite(n) ? Math.round(n) : null;
};

export default function EvaluationClient({ evaluationId }: { evaluationId: string }) {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();
  const params = useSearchParams();

  const playerId = Number(evaluationId);
  const query = useAssignedPlayer(Number.isFinite(playerId) ? playerId : null);
  const save = useSaveEvaluation(Number.isFinite(playerId) ? playerId : null);

  const player = query.data?.data;
  const evaluation = player?.evaluation;

  const step = params.get("step") ?? "profile";
  const at = stepIndex(step);
  const isLast = at === EVAL_STEPS.length - 1;

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [savedAt, setSavedAt] = useState<string | undefined>();
  /* Good and Provisional follow the attribute scores until the scout types in
     them; after that the scout's number stands. */
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  /* Seeded once per player, during render (React's documented pattern for
     adjusting state on a prop change), so the form never paints empty first
     and a background refetch never overwrites what is being typed. */
  const [seededFor, setSeededFor] = useState<number | null>(null);

  if (evaluation && seededFor !== playerId) {
    const dev = plan(evaluation.development_plan);
    const sum = summary(evaluation.summary);
    setSeededFor(playerId);
    setDraft({
      scores: {
        technical: { ...group(evaluation.technical) },
        tactical: { ...group(evaluation.tactical) },
        physical: { ...group(evaluation.physical) },
        mental: { ...group(evaluation.mental) },
      },
      focus: dev.focus ?? "",
      timeline: dev.timeline ?? "",
      headline: sum.headline ?? "",
      recommendation: sum.recommendation ?? "",
      good: evaluation.good?.toString() ?? "",
      potential: evaluation.potential?.toString() ?? "",
      provisional_score: evaluation.provisional_score?.toString() ?? "",
    });
  }

  /* Resolved against the STORED evaluation, not the draft, so the template
     cannot flip mid-evaluation as the scout starts scoring. */
  const resolved = useMemo(
    () => (player ? templateFor(player, evaluation) : null),
    [player, evaluation],
  );
  const template = resolved?.template;

  const state = reviewState(evaluation);
  const locked = isLockedForScout(evaluation);

  const liveOverall = useMemo(
    () =>
      overallAverage({
        technical: draft.scores.technical,
        tactical: draft.scores.tactical,
        physical: draft.scores.physical,
        mental: draft.scores.mental,
      } as never),
    [draft.scores],
  );

  const computed = liveOverall === null ? "" : String(Math.round(liveOverall));
  const goodValue = touched.good ? draft.good : draft.good || computed;
  const provisionalValue = touched.provisional_score
    ? draft.provisional_score
    : draft.provisional_score || computed;

  const payload: SaveEvaluationPayload = useMemo(
    () => ({
      technical: draft.scores.technical,
      tactical: draft.scores.tactical,
      physical: draft.scores.physical,
      mental: draft.scores.mental,
      development_plan: { focus: draft.focus, timeline: draft.timeline },
      summary: { headline: draft.headline, recommendation: draft.recommendation },
      good: intOrNull(goodValue),
      potential: intOrNull(draft.potential),
      provisional_score: intOrNull(provisionalValue),
      status: "pending",
      /* The admin's note, sent back as stored — see the header. */
      note: evaluation?.note ?? "",
    }),
    [draft, goodValue, provisionalValue, evaluation?.note],
  );

  const stamp = () =>
    setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  const persist = () => {
    if (locked) return;
    save.mutate(payload, { onSuccess: stamp });
  };

  const submit = () => {
    if (locked || !player) return;
    save.mutate(payload, {
      onSuccess: () => {
        stamp();
        toast.success(state === "needs_revision" ? "Evaluation resubmitted" : "Evaluation submitted", {
          description: `${playerFullName(player)} is with Golafly admin for review.`,
        });
        router.push(Routes.scoutEvaluations);
      },
    });
  };

  const goStep = (key: string) => {
    persist();
    router.replace(`${Routes.scoutEvaluations}/${evaluationId}?step=${key}`, {
      scroll: false,
    });
  };

  const setScore = (groupKey: string, field: string, value: number) =>
    setDraft(d => ({
      ...d,
      scores: { ...d.scores, [groupKey]: { ...d.scores[groupKey], [field]: value } },
    }));

  const setField = (key: keyof Draft, value: string) => {
    setTouched(t => (t[key] ? t : { ...t, [key]: true }));
    setDraft(d => ({ ...d, [key]: value }));
  };

  const scoredTotal = useMemo(
    () =>
      (template?.groups ?? []).reduce(
        (n, g) =>
          n + g.fields.filter(f => typeof draft.scores[g.key]?.[f.key] === "number").length,
        0,
      ),
    [draft.scores, template],
  );

  if (query.isError) {
    return (
      <>
        <AdminPageHeader onOpenNav={openNav} crumbs={["Evaluations"]} title="Evaluation" />
        <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
          <ScoutError
            query={query}
            noun="this evaluation"
            endpoint={`GET /v1/scout/players/${evaluationId}`}
          />
        </div>
      </>
    );
  }

  if (!player || !resolved || !template) {
    return (
      <>
        <AdminPageHeader onOpenNav={openNav} crumbs={["Evaluations"]} title="Evaluation" />
        <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
          <div className="h-[420px] animate-pulse rounded-lg bg-muted" />
        </div>
      </>
    );
  }

  const name = playerFullName(player);
  const total = templateFieldCount(template);
  const groupSpec = template.groups.find(g => g.key === step);
  const note = evaluation?.note?.trim();

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Evaluations", name]}
        title={`Evaluating ${name}`}
        onOpenNav={openNav}
        stats={[
          { label: reviewLabel(evaluation) },
          { label: `${template.name} template` },
          {
            label: `${scoredTotal}/${total} scored`,
            tone: scoredTotal === total ? "var(--status-good)" : undefined,
          },
        ]}
        action={
          <AdminButton onClick={persist} disabled={locked || save.isPending}>
            <Save className="size-3.5" />
            Save
          </AdminButton>
        }
      />

      <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
        {/* The admin's ruling, first thing on every step. A scout sent back
            for changes should not have to hunt for what to change. */}
        {note && state !== "approved" && (
          <div
            className={
              state === "pending"
                ? "mb-3 rounded-lg bg-status-info-bg px-3 py-2.5 text-status-info shadow-[0_0_0_1px_var(--edge)]"
                : "mb-3 rounded-lg bg-status-danger-bg px-3 py-2.5 text-status-danger shadow-[0_0_0_1px_var(--edge)]"
            }
          >
            <p className="m-0 flex items-center gap-2 text-[12px] font-semibold">
              <PenLine className="size-3.5 shrink-0" />
              {state === "needs_revision"
                ? "Golafly admin asked for changes"
                : state === "rejected"
                  ? "Golafly admin rejected this evaluation"
                  : "Note from Golafly admin"}
            </p>
            <p className="m-0 mt-1.5 whitespace-pre-line text-[12px] leading-relaxed text-foreground">
              {note}
            </p>
          </div>
        )}

        {locked && (
          <p className="mb-3 flex items-start gap-2.5 rounded-lg bg-status-info-bg px-3 py-2.5 text-[11.5px] leading-relaxed text-status-info shadow-[0_0_0_1px_var(--edge)]">
            <CircleAlert className="mt-px size-4 shrink-0" />
            {state === "approved"
              ? "This evaluation has been approved by a Golafly admin, so it is now read-only."
              : "This evaluation was rejected, so it is read-only. Ask a Golafly admin to send it back for revision if it should be re-scored."}
          </p>
        )}

        <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            <div className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <h2 className="m-0 font-heading text-[14px] font-semibold">
                  {at + 1} · {EVAL_STEPS[at].label}
                </h2>
                <span className="font-mono text-[10.5px] text-muted-foreground">
                  {EVAL_STEPS[at].hint}
                </span>
              </div>

              {step === "profile" && <ProfileStep player={player} resolved={resolved} />}

              {groupSpec && (
                <ScoreGroupStep
                  spec={groupSpec}
                  templateName={template.name}
                  values={draft.scores[groupSpec.key] ?? {}}
                  locked={locked}
                  onScore={(field, value) => setScore(groupSpec.key, field, value)}
                />
              )}

              {step === "development" && (
                <div className="mt-2 grid gap-3">
                  <Field
                    label="Development focus"
                    help="What this player should work on first."
                    value={draft.focus}
                    onChange={v => setField("focus", v)}
                    locked={locked}
                    textarea
                  />
                  <Field
                    label="Timeline"
                    help="Free text — “12 weeks”, “through pre-season”."
                    value={draft.timeline}
                    onChange={v => setField("timeline", v)}
                    locked={locked}
                  />
                </div>
              )}

              {step === "summary" && (
                <SummaryStep
                  draft={draft}
                  template={resolved.template}
                  setField={setField}
                  locked={locked}
                  goodValue={goodValue}
                  provisionalValue={provisionalValue}
                  computed={computed}
                  onJump={goStep}
                />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
              <AdminButton
                variant="ghost"
                size="sm"
                disabled={at === 0}
                onClick={() => goStep(EVAL_STEPS[at - 1].key)}
              >
                <ArrowLeft className="size-3.5" />
                Back
              </AdminButton>
              <span className="hidden text-[11px] text-muted-foreground sm:inline">
                Step <b className="text-foreground">{at + 1}</b> of {EVAL_STEPS.length} ·{" "}
                {EVAL_STEPS[at].label}
              </span>
              {isLast ? (
                <AdminButton size="sm" disabled={locked || save.isPending} onClick={submit}>
                  <Send className="size-3.5" />
                  {state === "needs_revision" ? "Resubmit evaluation" : "Submit evaluation"}
                </AdminButton>
              ) : (
                <AdminButton size="sm" onClick={() => goStep(EVAL_STEPS[at + 1].key)}>
                  Next: {EVAL_STEPS[at + 1].label}
                  <ArrowRight className="size-3.5" />
                </AdminButton>
              )}
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <OverallReadout
              score={liveOverall}
              potential={intOrNull(draft.potential)}
              stars={liveOverall === null ? null : Math.round(liveOverall / 2)}
              classification={
                bandFor(liveOverall) ? bandLabel(bandFor(liveOverall)!) : null
              }
              provisional
            />
            <StepRail current={step} onSelect={goStep} />
            <div className="rounded-lg bg-card px-3 py-2.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
              <AutoSave saving={save.isPending} savedAt={savedAt} />
              <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">
                Saved when you move between steps, and whenever you press Save.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

/* ── Steps ────────────────────────────────────────────────────────────── */

const text = (v: unknown) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

function ageFrom(dob: string | null | undefined): number | null {
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

/** Who is being scored, on what, before a single number goes in. Scouting
 *  facts only — contact details and documents live on the player's page. */
function ProfileStep({
  player,
  resolved,
}: {
  player: AssignedPlayer;
  resolved: ResolvedTemplate;
}) {
  const name = playerFullName(player);
  const age = ageFrom(player.date_of_birth);
  const { template, position, legacy } = resolved;

  const facts: [string, string][] = [
    ["Age", age === null ? "—" : `${age}`],
    ["Date of birth", text(player.date_of_birth?.slice(0, 10))],
    ["Gender", text(player.gender)],
    ["Nationality", text(player.nationality)],
    [
      "Based in",
      [player.city, player.country_of_residence].filter(Boolean).join(", ") || "—",
    ],
    ["Height", player.height_cm ? `${player.height_cm} cm` : "—"],
    ["Weight", player.weight_kg ? `${player.weight_kg} kg` : "—"],
    ["Preferred foot", text(player.preferred_foot)],
    ["Jersey number", text(player.jersey_number)],
    ["Club / academy", text(player.current_club_academy)],
    ["Level", text(player.current_level)],
    ["Availability", text(player.player_status)],
  ];

  const selfRating = player.player_attributes;
  const selfEntries =
    selfRating && !Array.isArray(selfRating) ? Object.entries(selfRating) : [];

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {player.profile_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.profile_photo_url}
            alt=""
            className="size-14 shrink-0 rounded-lg object-cover shadow-[0_0_0_1px_var(--edge)]"
          />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-muted font-heading text-[16px] font-bold text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
            {scoutInitials(name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="m-0 truncate font-heading text-[16px] font-bold">{name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {player.primary_position && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10.5px] font-semibold text-brand-foreground">
                {player.primary_position}
              </span>
            )}
            {player.secondary_position && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
                {player.secondary_position}
              </span>
            )}
            {!player.primary_position && (
              <span className="text-[11px] text-muted-foreground">No position on record</span>
            )}
          </div>
        </div>
      </div>

      <TemplateSource>
        <LayoutTemplate className="mt-px size-3.5 shrink-0" />
        <span>
          {legacy ? (
            <>
              Scored on the <b className="text-foreground">General outfield</b> template.
              This evaluation was started before position templates existed, so it
              keeps the attributes it already has.
            </>
          ) : position ? (
            <>
              Scored on the <b className="text-foreground">{template.name}</b> template
              — {templateFieldCount(template)} attributes, chosen from the primary
              position ({position.label}). {template.focus}
            </>
          ) : (
            <>
              No template matches{" "}
              {player.primary_position ? `“${player.primary_position}”` : "an empty position"},
              so the <b className="text-foreground">General outfield</b> template is used.
            </>
          )}{" "}
          <Link href={Routes.scoutTemplates} className="font-semibold text-brand-text hover:underline">
            See templates
          </Link>
        </span>
      </TemplateSource>

      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
        {facts.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {k}
            </dt>
            <dd className="m-0 mt-0.5 truncate text-[12.5px] font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      {selfEntries.length > 0 && (
        <div>
          <p className="m-0 mb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Player&rsquo;s self-rating
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selfEntries.map(([k, v]) => (
              <span
                key={k}
                className="rounded-full bg-muted px-2.5 py-1 text-[10.5px] shadow-[0_0_0_1px_var(--edge)]"
              >
                {k.replace(/_/g, " ").replace(/^./, c => c.toUpperCase())}{" "}
                <b className="font-mono tabular-nums">{String(v)}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {player.highlight_video_url && (
        <a
          href={player.highlight_video_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-[12px] font-semibold text-brand-text hover:underline"
        >
          <PlayCircle className="size-3.5" />
          Watch highlight video
        </a>
      )}
    </div>
  );
}

function ScoreGroupStep({
  spec,
  templateName,
  values,
  locked,
  onScore,
}: {
  spec: EvalGroupSpec;
  templateName: string;
  values: Record<string, number>;
  locked: boolean;
  onScore: (field: string, value: number) => void;
}) {
  return (
    <div className="mt-1">
      <p className="m-0 mb-1 text-[11px] text-muted-foreground">
        {spec.fields.length} attributes from the {templateName} template. Score what you
        saw — a blank is better than a guess.
      </p>
      {spec.fields.map(f => (
        <ScoreScale
          key={f.key}
          label={f.label}
          description={f.hint}
          value={typeof values[f.key] === "number" ? values[f.key] : null}
          disabled={locked}
          onChange={v => onScore(f.key, v)}
        />
      ))}
    </div>
  );
}

function SummaryStep({
  draft,
  template,
  setField,
  locked,
  goodValue,
  provisionalValue,
  computed,
  onJump,
}: {
  draft: Draft;
  template: ResolvedTemplate["template"];
  setField: (k: keyof Draft, v: string) => void;
  locked: boolean;
  goodValue: string;
  provisionalValue: string;
  computed: string;
  onJump: (step: string) => void;
}) {
  /* A checklist, not a block: the API accepts a partial evaluation, and a
     scout who saw a player once should be able to record that. */
  const missing = template.groups.flatMap(g =>
    g.fields
      .filter(f => typeof draft.scores[g.key]?.[f.key] !== "number")
      .map(f => ({ step: g.key, label: `${g.label} · ${f.label}` })),
  );

  const columns: Column<(typeof missing)[number]>[] = [
    { key: "attr", label: "Not yet scored", render: m => m.label },
    {
      key: "go",
      label: "",
      nowrap: true,
      render: m => (
        <span className="flex justify-end">
          <AdminButton variant="ghost" size="sm" onClick={() => onJump(m.step)}>
            Score
            <ArrowRight className="size-3" />
          </AdminButton>
        </span>
      ),
    },
  ];

  return (
    <div className="mt-2 grid gap-3">
      <Field
        label="Headline"
        help="One line. This is what an admin reads first."
        value={draft.headline}
        onChange={v => setField("headline", v)}
        locked={locked}
      />
      <Field
        label="Recommendation"
        help="What should happen to this player next."
        value={draft.recommendation}
        onChange={v => setField("recommendation", v)}
        locked={locked}
        textarea
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Field
          label="Good"
          tip={GOOD_TIP}
          help={computed && goodValue === computed ? "From your scores" : "1–10"}
          value={goodValue}
          onChange={v => setField("good", v)}
          locked={locked}
          number
        />
        <Field
          label="Potential"
          tip={POTENTIAL_TIP}
          help="1–10 — your call"
          value={draft.potential}
          onChange={v => setField("potential", v)}
          locked={locked}
          number
        />
        <Field
          label="Provisional score"
          tip={PROVISIONAL_FIELD_TIP}
          help={
            computed && provisionalValue !== computed
              ? `Average of your scores is ${computed}`
              : "From your scores"
          }
          value={provisionalValue}
          onChange={v => setField("provisional_score", v)}
          locked={locked}
          number
        />
      </div>

      {missing.length > 0 ? (
        <div>
          <p className="mb-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {missing.length} attribute{missing.length === 1 ? "" : "s"} left. You can
            submit without them — a partial evaluation is a real answer when you only
            saw a player once.
          </p>
          <DataTable columns={columns} rows={missing} rowKey={m => m.label} pageSize={0} />
        </div>
      ) : (
        <p className="flex items-center gap-2 rounded-md bg-status-good-bg px-3 py-2.5 text-[11.5px] text-status-good">
          <StatusPill label="Complete" tone="good" />
          Every attribute is scored.
        </p>
      )}
    </div>
  );
}

/* ── One input ────────────────────────────────────────────────────────── */

function Field({
  label,
  help,
  tip,
  value,
  onChange,
  locked,
  textarea,
  number,
}: {
  label: string;
  help?: string;
  /** Explains what the field means, beside its label. */
  tip?: string;
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  textarea?: boolean;
  number?: boolean;
}) {
  const shared =
    "w-full rounded-md bg-muted px-2.5 py-2 text-[12.5px] text-foreground shadow-[0_0_0_1px_var(--edge)] outline-none transition-shadow focus-visible:shadow-[0_0_0_1px_var(--brand-edge)] disabled:opacity-60";
  return (
    <div>
      <span className="mb-1 flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {tip && <InfoTip label={label.toLowerCase()}>{tip}</InfoTip>}
      </span>
      <label className="block">
        <span className="sr-only">{label}</span>
        {textarea ? (
          <textarea
            rows={3}
            value={value}
            disabled={locked}
            onChange={e => onChange(e.target.value)}
            className={shared}
          />
        ) : (
          <input
            value={value}
            disabled={locked}
            type={number ? "number" : "text"}
            min={number ? 1 : undefined}
            max={number ? 10 : undefined}
            step={number ? 1 : undefined}
            onChange={e => onChange(e.target.value)}
            className={`h-8 ${shared}`}
          />
        )}
      </label>
      {help && (
        <span className="mt-1 block text-[10.5px] leading-snug text-muted-foreground">
          {help}
        </span>
      )}
    </div>
  );
}
