"use client";

import { useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill } from "@/components/admin/status-pill";
import { scoutInitials } from "@/features/scout/session";
import { evaluatedOnly, useAssignedPlayers } from "@/features/scout/hooks";
import {
  overallAverage,
  score,
  statusLabel,
  summary,
  type AssignedPlayer,
} from "@/features/scout/evaluation";
import { playerFullName } from "@/services/players";
import { Routes } from "@/routes";

/* REPORTS — the finished verdicts.
 *
 * A report is not a separate document on this API. It is what an evaluation
 * IS once it has been written: the headline, the recommendation and the
 * numbers a club would be shown. So this screen is the evaluated subset of
 * GET /v1/scout/players, projected onto the fields that make up a verdict —
 * not a second fetch, and not a second source of truth.
 *
 * NOT-YET-SCORED PLAYERS ARE EXCLUDED rather than shown as empty rows. A
 * report with no verdict in it is not a draft report, it is an absence, and a
 * table of absences buries the six that say something.
 */

export default function ReportsClient() {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();

  const query = useAssignedPlayers();
  const all = useMemo(() => query.data?.data ?? [], [query.data]);
  const rows = useMemo(
    () =>
      [...evaluatedOnly(all)].sort((a, b) =>
        String(b.evaluation.updated_at ?? "").localeCompare(
          String(a.evaluation.updated_at ?? ""),
        ),
      ),
    [all],
  );

  const approved = rows.filter(p => p.evaluation.status === "approved").length;

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
    /* Both are free text a scout types with no length limit, and both used to
       wrap to six lines and drag the whole row with them. Clamped to one line
       with the full text on hover — the table is for scanning, and the report
       itself is one click away. */
    {
      key: "headline",
      label: "Headline",
      truncate: true,
      width: "22ch",
      render: p => {
        const value = summary(p.evaluation.summary).headline || "—";
        return <span title={value}>{value}</span>;
      },
    },
    {
      key: "recommendation",
      label: "Recommendation",
      truncate: true,
      width: "26ch",
      render: p => {
        const value = summary(p.evaluation.summary).recommendation || "—";
        return <span title={value}>{value}</span>;
      },
    },
    {
      key: "overall",
      label: "Overall",
      numeric: true,
      render: p => score(overallAverage(p.evaluation)),
    },
    { key: "good", label: "Good", numeric: true, render: p => p.evaluation.good ?? "—" },
    {
      key: "potential",
      label: "Potential",
      numeric: true,
      render: p => p.evaluation.potential ?? "—",
    },
    {
      key: "provisional",
      label: "Provisional",
      numeric: true,
      render: p => p.evaluation.provisional_score ?? "—",
    },
    {
      key: "status",
      label: "Status",
      nowrap: true,
      render: p => <StatusPill label={statusLabel(p.evaluation.status)} />,
    },
  ];

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Reports"]}
        title="Reports"
        onOpenNav={openNav}
        stats={[
          { label: `${rows.length} written` },
          { label: `${approved} approved`, tone: "var(--status-good)" },
        ]}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        <QueryTable
          query={query}
          select={() => rows}
          columns={columns}
          rowKey={p => String(p.id)}
          endpoint="/v1/scout/players"
          emptyTitle="No reports yet"
          emptyBody="A report appears here as soon as you score a player. Nothing you have been assigned has been evaluated so far."
          onView={p => router.push(Routes.scoutPlayer(p.id))}
        />
      </div>
    </>
  );
}
