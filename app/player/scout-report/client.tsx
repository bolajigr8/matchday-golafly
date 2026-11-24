"use client";

import { ClipboardList, Clock, Dumbbell, Star } from "lucide-react";
import { FanPill } from "@/components/fan/ledger-card";
import { FanState } from "@/components/fan/query-state";
import { InfoTip } from "@/components/ui/tooltip";
import { DownloadCvButton, PlayerGate, fmtDate } from "@/components/player/player-states";
import {
  group,
  overallAverage,
  plan,
  reviewState,
  score,
  summary,
  type PlayerEvaluation,
} from "@/features/scout/evaluation";
import { bandFor, type EvaluationBand } from "@/features/scout/labels";
import { templateFor } from "@/features/scout/templates";
import type { ApiPlayer } from "@/services/players";
import { cn } from "@/lib/utils";
import { reportState } from "../report-state";

/* PLAYER · MY SCOUTING REPORT — design/src/fan/09-screen-report.html.
 *
 * The only screen read by someone who did not choose to be evaluated, so it
 * leads with the RECOMMENDATION and what to work on; the score sits under
 * them. The red / amber / green groups are worded for the player — "Work on
 * next", not "Needs improvement" — with the same attributes and the same
 * scores. No comparison with other players.
 *
 * Shown only once an admin has approved the evaluation. */

export default function PlayerScoutReportClient() {
  return (
    <div className="flex flex-col gap-7">
      <PlayerGate>{player => <Report player={player} />}</PlayerGate>
    </div>
  );
}

function Report({ player }: { player: ApiPlayer }) {
  const evaluation = player.evaluation;

  if (reviewState(evaluation) !== "approved" || !evaluation) {
    const state = reportState(evaluation);
    return (
      <>
        <header>
          <h1 className="text-[23px] font-bold tracking-[-0.03em] text-foreground">Your scout report</h1>
        </header>
        <FanState icon={<ClipboardList className="size-5" />} title={state.title} body={state.body} />
      </>
    );
  }

  return <ApprovedReport player={player} evaluation={evaluation} />;
}

const RAG: { band: EvaluationBand; title: string; tone: string; bg: string }[] = [
  { band: "green", title: "Your strengths", tone: "var(--status-good)", bg: "var(--status-good-bg)" },
  { band: "amber", title: "Getting there", tone: "var(--status-warn)", bg: "var(--status-warn-bg)" },
  { band: "red", title: "Work on next", tone: "var(--status-danger)", bg: "var(--status-danger-bg)" },
];

function ApprovedReport({ player, evaluation }: { player: ApiPlayer; evaluation: PlayerEvaluation }) {
  const { template } = templateFor(player, evaluation);
  const sum = summary(evaluation.summary);
  const dev = plan(evaluation.development_plan);
  const overall = overallAverage(evaluation);
  const stars = overall === null ? 0 : Math.round(overall / 2);

  /* Every scored attribute on the player's template, highest first. */
  const attributes = template.groups
    .flatMap(g => {
      const scores = group(evaluation[g.key]);
      return g.fields
        .filter(f => typeof scores[f.key] === "number")
        .map(f => ({ key: `${g.key}.${f.key}`, label: f.label, value: scores[f.key] }));
    })
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <header>
        <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Published {fmtDate(evaluation.updated_at)}
        </p>
        <h1 className="mt-1.5 text-[23px] font-bold tracking-[-0.03em] text-foreground">Your scout report</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Scored on the {template.name.toLowerCase()} template by a Golafly scout.
        </p>
      </header>

      {/* THE VERDICT — recommendation first. */}
      <section>
        <div className="grid gap-5 rounded-[28px] border border-border bg-card p-[18px] sm:grid-cols-[1fr_200px]">
          <div className="min-w-0">
            <FanPill tone="good">Report ready</FanPill>
            <p className="mt-3 font-heading text-[21px] font-bold leading-snug text-foreground">
              {sum.headline || "Your evaluation is complete."}
            </p>
            {sum.recommendation && (
              <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                {sum.recommendation}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <DownloadCvButton player={player} />
            </div>
          </div>
          <div className="flex flex-col justify-center gap-1 rounded-[20px] bg-muted p-4">
            <span className="flex items-center gap-1.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Overall
              <InfoTip label="your overall score">
                The average of your Technical, Tactical, Physical and Mental scores, each counted equally.
              </InfoTip>
            </span>
            <span className="flex items-baseline gap-1 font-heading text-[38px] font-bold leading-none tabular-nums text-brand-text">
              {score(overall)}
              <i className="font-mono text-[13px] font-normal not-italic text-muted-foreground">/10</i>
            </span>
            {evaluation.potential != null && (
              <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                Potential {evaluation.potential}/10
                <InfoTip label="potential">The level your scout believes you can reach.</InfoTip>
              </span>
            )}
            <span className="mt-1 flex gap-0.5 text-brand-text" aria-label={`${stars} of 5 stars`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("size-3.5", i < stars ? "fill-current" : "text-border")} />
              ))}
            </span>
          </div>
        </div>
      </section>

      {/* THE PLAN — the half the player acts on, so it comes before scores. */}
      {(dev.focus || dev.timeline) && (
        <section>
          <h2 className="mb-3 font-heading text-[15px] font-bold text-foreground">What to work on</h2>
          <div className="rounded-[20px] border border-border bg-card p-[15px]">
            <div className="flex items-center justify-between gap-2.5">
              <span className="flex size-[38px] items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
                <Dumbbell className="size-[18px]" />
              </span>
              <FanPill tone="danger">Start here</FanPill>
            </div>
            {dev.focus && (
              <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-foreground">{dev.focus}</p>
            )}
            {dev.timeline && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {dev.timeline}
              </p>
            )}
          </div>
        </section>
      )}

      {/* SCORES */}
      {attributes.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-heading text-[15px] font-bold text-foreground">Your attributes</h2>
            <span className="text-xs font-semibold text-muted-foreground">Out of 10</span>
          </div>
          <div className="rounded-[20px] border border-border bg-card p-[18px]">
            <div className="grid gap-x-8 gap-y-2.5 md:grid-cols-2">
              {attributes.map(a => (
                <div key={a.key} className="grid grid-cols-[minmax(0,120px)_1fr_32px] items-center gap-3 text-[12.5px]">
                  <span className="truncate text-foreground">{a.label}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <i className="block h-full rounded-full bg-brand" style={{ width: `${Math.min(100, a.value * 10)}%` }} />
                  </span>
                  <b className="text-right font-mono text-[12px] tabular-nums text-foreground">{a.value}</b>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {RAG.map(col => {
                const items = attributes.filter(a => bandFor(a.value) === col.band);
                return (
                  <div key={col.band} className="rounded-2xl p-3.5" style={{ background: col.bg }}>
                    <p className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: col.tone }}>
                      <i className="size-2 rounded-full bg-current" />
                      {col.title}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {items.length ? (
                        items.map(a => (
                          <span key={a.key} className="rounded-full bg-card px-2.5 py-1 text-[11px] text-foreground">
                            {a.label}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
