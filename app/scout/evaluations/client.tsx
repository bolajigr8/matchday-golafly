"use client";

import { useContext, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PenLine } from "lucide-react";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminButton } from "@/components/admin/admin-ui";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill } from "@/components/admin/status-pill";
import { scoutInitials } from "@/features/scout/session";
import { useAssignedPlayers } from "@/features/scout/hooks";
import {
  isLockedForScout,
  overallAverage,
  reviewLabel,
  reviewState,
  score,
  type AssignedPlayer,
} from "@/features/scout/evaluation";
import { scoredIn, templateFieldCount, templateFor } from "@/features/scout/templates";
import { playerFullName } from "@/services/players";
import { Routes } from "@/routes";

/* EVALUATIONS — the work, rather than the people.
 *
 * Assigned Players answers "who am I responsible for". This answers "what is
 * the state of my scoring": sent-back work first, then least finished.
 *
 * Derived from the same GET /v1/scout/players every other screen reads. One
 * row per player, because the API stores exactly one evaluation per player.
 */

const TABS = [
  { key: "open", label: "Open" },
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
const isTabKey = (v: string | null): v is TabKey => !!v && TABS.some(t => t.key === v);

/** Share of the player's template that is scored, 0–1. */
function progress(p: AssignedPlayer): number {
  const { template } = templateFor(p, p.evaluation);
  return scoredIn(template, p.evaluation) / Math.max(1, templateFieldCount(template));
}

export default function EvaluationsClient() {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();
  const params = useSearchParams();

  const raw = params.get("tab");
  const tab: TabKey = isTabKey(raw) ? raw : "open";

  const query = useAssignedPlayers();
  const all = useMemo(() => query.data?.data ?? [], [query.data]);

  const rows = useMemo(() => {
    const filtered = all.filter(p => {
      const state = reviewState(p.evaluation);
      if (tab === "all") return true;
      if (tab === "approved") return state === "approved";
      if (tab === "rejected") return state === "rejected";
      /* Open: everything the scout can still act on. */
      return !isLockedForScout(p.evaluation);
    });
    return [...filtered].sort((a, b) => {
      const revise = (p: AssignedPlayer) => (reviewState(p.evaluation) === "needs_revision" ? 0 : 1);
      return revise(a) - revise(b) || progress(a) - progress(b);
    });
  }, [all, tab]);

  const counts = useMemo(
    () => ({
      open: all.filter(p => !isLockedForScout(p.evaluation)).length,
      all: all.length,
      approved: all.filter(p => reviewState(p.evaluation) === "approved").length,
      rejected: all.filter(p => reviewState(p.evaluation) === "rejected").length,
      needs_revision: all.filter(p => reviewState(p.evaluation) === "needs_revision").length,
    }),
    [all],
  );

  const columns: Column<AssignedPlayer>[] = [
    {
      key: "player",
      label: "Player",
      render: p => (
        <IdentityCell
          initials={scoutInitials(playerFullName(p))}
          name={playerFullName(p)}
          sub={p.primary_position ?? p.email}
        />
      ),
    },
    {
      key: "template",
      label: "Template",
      render: p => templateFor(p, p.evaluation).template.name,
    },
    {
      key: "status",
      label: "Status",
      nowrap: true,
      render: p => <StatusPill label={reviewLabel(p.evaluation)} />,
    },
    {
      key: "progress",
      label: "Scored",
      numeric: true,
      render: p => {
        const { template } = templateFor(p, p.evaluation);
        return `${scoredIn(template, p.evaluation)}/${templateFieldCount(template)}`;
      },
    },
    {
      key: "overall",
      label: "Overall",
      numeric: true,
      render: p => score(overallAverage(p.evaluation)),
    },
    {
      key: "updated",
      label: "Updated",
      numeric: true,
      render: p => p.evaluation.updated_at?.slice(0, 10) ?? "—",
    },
    {
      key: "action",
      label: "",
      nowrap: true,
      render: p => (
        <span className="flex justify-end">
          <AdminButton
            variant="outline"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              router.push(Routes.scoutEvaluation(p.id));
            }}
          >
            <PenLine className="size-3.5" />
            {reviewState(p.evaluation) === "needs_revision" ? "Revise" : "Open"}
          </AdminButton>
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Evaluations"]}
        title="Evaluations"
        onOpenNav={openNav}
        stats={[
          { label: `${counts.open} open`, tone: "var(--status-warn)" },
          ...(counts.needs_revision > 0
            ? [{ label: `${counts.needs_revision} need revision`, tone: "var(--status-danger)" }]
            : []),
          { label: `${counts.approved} approved`, tone: "var(--status-good)" },
        ]}
        tabs={TABS.map(t => ({
          label: `${t.label} (${counts[t.key]})`,
          href:
            t.key === "open"
              ? Routes.scoutEvaluations
              : `${Routes.scoutEvaluations}?tab=${t.key}`,
          active: tab === t.key,
        }))}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        <QueryTable
          query={query}
          select={() => rows}
          columns={columns}
          rowKey={p => String(p.id)}
          endpoint="/v1/scout/players"
          emptyTitle="Nothing to evaluate yet"
          emptyBody="Evaluations appear here once a Golafly admin assigns you players."
        />
      </div>
    </>
  );
}
