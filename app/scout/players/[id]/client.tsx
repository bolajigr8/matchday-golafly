"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, PenLine, Printer } from "lucide-react";
import { toast } from "sonner";
import { downloadPlayerCv } from "@/lib/player-cv";
import { templateFor, type ResolvedTemplate } from "@/features/scout/templates";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminButton } from "@/components/admin/admin-ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatusPill } from "@/components/admin/status-pill";
import { ScoutError, ScoutSection } from "@/components/scout/scout-states";
import { useAssignedPlayer } from "@/features/scout/hooks";
import {
  group,
  isEvaluated,
  reviewLabel,
  overallAverage,
  groupAverage,
  plan,
  score,
  statusLabel,
  summary,
  type PlayerEvaluation,
} from "@/features/scout/evaluation";
import { playerFullName, type ApiPlayer } from "@/services/players";
import { Routes } from "@/routes";

/* PLAYER PROFILE — what the scout reads before scoring anything.
 *
 * GET /v1/scout/players/{id}. The list endpoint sends a trimmed player; this
 * one sends everything — documents, highlights, career statistics,
 * achievements, and the current evaluation.
 *
 * EVERYTHING IS A TABLE, and registration data is a READ-ONLY table rather
 * than disabled inputs. That is the acceptance criterion made visible:
 * disabled inputs look like a form somebody forgot to enable, and invite a
 * scout to ask for edit access. A table looks like a record — which is what it
 * is. Corrections go through an admin, so the facts a report cites cannot be
 * edited by the person writing the report.
 *
 * The existing evaluation is shown here rather than only inside the wizard for
 * the same reason: a scout revisiting a player should see what they concluded
 * last time before they start typing, and a second first impression is worth
 * much less than a second opinion.
 */

/** A two-column key/value table. Used five times on this screen, so it is one
 *  component rather than five hand-rolled definition lists that drift. */
function FactTable({
  rows,
  labelHead = "Field",
  valueHead = "Value",
}: {
  rows: [string, React.ReactNode][];
  labelHead?: string;
  valueHead?: string;
}) {
  const columns: Column<[string, React.ReactNode]>[] = [
    { key: "k", label: labelHead, width: "42%", render: r => r[0] },
    { key: "v", label: valueHead, render: r => r[1] ?? "—" },
  ];
  return <DataTable columns={columns} rows={rows} rowKey={r => r[0]} pageSize={0} />;
}

const text = (v: unknown): string => {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map(String).join(", ") : "—";
  return String(v);
};

export default function PlayerProfileClient({ playerId }: { playerId: string }) {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();

  /* The route param is a string; the API keys players on a NUMBER. Converting
     here rather than at the call site means one place can be wrong. */
  const id = Number(playerId);
  const query = useAssignedPlayer(Number.isFinite(id) ? id : null);
  const player = query.data?.data;

  /* The branded CV the Golafly frontend offered — built in the browser from
     the full record this page already holds. See lib/player-cv.ts. */
  const [downloading, setDownloading] = useState(false);
  const downloadCv = async () => {
    if (!player) return;
    setDownloading(true);
    try {
      await downloadPlayerCv(player);
    } catch {
      toast.error("Could not generate the CV. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (query.isError) {
    return (
      <>
        <AdminPageHeader onOpenNav={openNav} crumbs={["Assigned Players"]} title="Player" />
        <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
          <ScoutError
            query={query}
            noun="this player"
            endpoint={`GET /v1/scout/players/${playerId}`}
          />
        </div>
      </>
    );
  }

  if (!player) {
    return (
      <>
        <AdminPageHeader onOpenNav={openNav} crumbs={["Assigned Players"]} title="Player" />
        <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
          <p className="text-[12px] text-muted-foreground">Loading…</p>
        </div>
      </>
    );
  }

  const name = playerFullName(player);
  const evaluation = player.evaluation;
  const scored = isEvaluated(evaluation);

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Assigned Players", name]}
        title={name}
        onOpenNav={openNav}
        stats={[
          { label: player.primary_position ?? "Position unknown" },
          {
            label: statusLabel(scored ? evaluation.status : null),
            tone: scored ? "var(--status-good)" : "var(--status-warn)",
          },
        ]}
        action={
          <span className="flex items-center gap-2">
            <AdminButton variant="outline" disabled={downloading} onClick={() => void downloadCv()}>
              {downloading ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Download CV
            </AdminButton>
            {/* No PDF endpoint exists — GET /v1/players/{id}/profile/download
                returns a ZIP of profile.json with no evaluation in it. So the
                report is printed from this page, which also means the PDF can
                never drift from what is on screen. Every desktop browser
                offers "Save as PDF" in the print dialog. */}
            {scored && (
              <AdminButton variant="outline" onClick={() => window.print()}>
                <Printer className="size-3.5" />
                Download PDF
              </AdminButton>
            )}
            <AdminButton onClick={() => router.push(Routes.scoutEvaluation(player.id))}>
              <PenLine className="size-3.5" />
              {scored ? "Open evaluation" : "Evaluate"}
            </AdminButton>
          </span>
        }
      />

      <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
        <ScoutSection
          title="Registration"
          subtitle="Submitted by the player. Corrections go through a Golafly admin."
          className="mt-0"
        >
          <FactTable
            rows={[
              ["Email", player.email],
              ["Phone", text(player.phone)],
              ["Date of birth", text(player.date_of_birth)],
              ["Gender", text(player.gender)],
              ["Nationality", text(player.nationality)],
              ["Country of residence", text(player.country_of_residence)],
              ["City", text(player.city)],
              ["Primary position", text(player.primary_position)],
              ["Secondary position", text(player.secondary_position)],
              ["Preferred foot", text(player.preferred_foot)],
              ["Jersey number", text(player.jersey_number)],
              ["Height", player.height_cm ? `${player.height_cm} cm` : "—"],
              ["Weight", player.weight_kg ? `${player.weight_kg} kg` : "—"],
              ["Current club / academy", text(player.current_club_academy)],
              ["Current level", text(player.current_level)],
              ["Player status", text(player.player_status)],
            ]}
          />
        </ScoutSection>

        <PlayerAttributes player={player} />
        <CareerStatistics player={player} />
        <Achievements player={player} />
        <CurrentEvaluation
          evaluation={evaluation}
          scored={scored}
          resolved={templateFor(player, evaluation)}
        />
      </div>
    </>
  );
}

/* ── The player's own self-assessment ─────────────────────────────────────
   Distinct from the scout's evaluation, and deliberately shown next to it:
   the gap between what a player thinks of their pace and what a scout scores
   it at is itself information. */

function PlayerAttributes({ player }: { player: ApiPlayer }) {
  const attrs = player.player_attributes;
  if (!attrs || Array.isArray(attrs) || Object.keys(attrs).length === 0) return null;

  return (
    <ScoutSection
      title="Player's self-assessment"
      subtitle="Entered by the player at registration — not a scout score."
    >
      <FactTable
        labelHead="Attribute"
        valueHead="Self score"
        rows={Object.entries(attrs).map(([k, v]) => [
          k.replace(/_/g, " ").replace(/^./, c => c.toUpperCase()),
          <span key={k} className="font-mono tabular-nums">
            {String(v)}
          </span>,
        ])}
      />
    </ScoutSection>
  );
}

function CareerStatistics({ player }: { player: ApiPlayer }) {
  /* The API sends either one season object or an array of them, so normalise
     to an array and render one row per season. */
  const raw = player.career_statistics;
  const seasons = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(
    s => s && typeof s === "object",
  );
  if (seasons.length === 0) return null;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "season", label: "Season", render: r => text(r.season) },
    { key: "appearances", label: "Apps", numeric: true, render: r => text(r.appearances) },
    { key: "goals", label: "Goals", numeric: true, render: r => text(r.goals) },
    { key: "assists", label: "Assists", numeric: true, render: r => text(r.assists) },
    {
      key: "clean_sheets",
      label: "Clean sheets",
      numeric: true,
      render: r => text(r.clean_sheets),
    },
    {
      key: "minutes",
      label: "Minutes",
      numeric: true,
      render: r => text(r.minutes_played),
    },
    {
      /* The API spells this `yellow_card` on some records and `yellow_cards`
         on others. Read both rather than showing a blank column. */
      key: "yellow",
      label: "Yellow",
      numeric: true,
      render: r => text(r.yellow_cards ?? r.yellow_card),
    },
    {
      key: "red",
      label: "Red",
      numeric: true,
      render: r => text(r.red_cards ?? r.red_card),
    },
  ];

  return (
    <ScoutSection title="Career statistics">
      <DataTable
        columns={columns}
        rows={seasons as Record<string, unknown>[]}
        rowKey={r => String(r.season ?? "season")}
        pageSize={0}
      />
    </ScoutSection>
  );
}

function Achievements({ player }: { player: ApiPlayer }) {
  const raw = (player as { achievements?: unknown }).achievements;
  const items = (Array.isArray(raw) ? raw : []).filter(
    (a): a is Record<string, unknown> => !!a && typeof a === "object",
  );
  if (items.length === 0) return null;

  const columns: Column<Record<string, unknown>>[] = [
    { key: "title", label: "Achievement", render: a => text(a.title) },
    { key: "year", label: "Year", numeric: true, render: a => text(a.year) },
  ];

  return (
    <ScoutSection title="Achievements">
      <DataTable
        columns={columns}
        rows={items}
        rowKey={a => `${String(a.title)}-${String(a.year)}`}
        pageSize={0}
      />
    </ScoutSection>
  );
}

/* ── The scout's evaluation, as it stands ─────────────────────────────────
   Read-only here. Editing is the wizard's job, and a second place to change a
   score is a second place for two people to change it differently. */

function CurrentEvaluation({
  evaluation,
  scored,
  resolved,
}: {
  evaluation: PlayerEvaluation;
  scored: boolean;
  resolved: ResolvedTemplate;
}) {
  if (!scored) {
    return (
      <ScoutSection title="Evaluation">
        <p className="rounded-lg bg-card px-4 py-6 text-center text-[12px] leading-relaxed text-muted-foreground shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
          Not evaluated yet. Open the evaluation to score this player.
        </p>
      </ScoutSection>
    );
  }

  const dev = plan(evaluation.development_plan);
  const sum = summary(evaluation.summary);
  const { template } = resolved;

  const rows = template.groups.flatMap(g => {
    const scores = group(evaluation[g.key]);
    return g.fields.map(f => ({
      groupLabel: g.label,
      label: f.label,
      value: scores[f.key],
    }));
  });

  const columns: Column<(typeof rows)[number]>[] = [
    { key: "group", label: "Group", render: r => r.groupLabel },
    { key: "field", label: "Attribute", render: r => r.label },
    {
      key: "score",
      label: "Score",
      numeric: true,
      render: r => (typeof r.value === "number" ? r.value : "—"),
    },
  ];

  return (
    <>
      <ScoutSection
        title="Evaluation"
        subtitle={`${statusLabel(evaluation.status)} · updated ${
          evaluation.updated_at?.slice(0, 10) ?? "—"
        }`}
      >
        <FactTable
          labelHead="Outcome"
          valueHead=""
          rows={[
            ["Status", <StatusPill key="s" label={reviewLabel(evaluation)} />],
            ["Template", `${template.name}${resolved.legacy ? " (pre-templates)" : ""}`],
            ["Overall (computed)", score(overallAverage(evaluation))],
            ...template.groups.map(
              g => [g.label, score(groupAverage(evaluation, g.key))] as [string, React.ReactNode],
            ),
            ["Good", evaluation.good ?? "—"],
            ["Potential", evaluation.potential ?? "—"],
            ["Provisional score", evaluation.provisional_score ?? "—"],
            ["Headline", text(sum.headline)],
            ["Recommendation", text(sum.recommendation)],
            ["Development focus", text(dev.focus)],
            ["Timeline", text(dev.timeline)],
            ["Note", text(evaluation.note)],
          ]}
        />
      </ScoutSection>

      <ScoutSection title="Attribute scores">
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={r => `${r.groupLabel}-${r.label}`}
          pageSize={0}
        />
      </ScoutSection>
    </>
  );
}
