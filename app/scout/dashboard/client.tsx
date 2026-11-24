"use client";

import { useContext, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CircleCheck,
  ClipboardList,
  Gauge,
  ThumbsDown,
  Users,
} from "lucide-react";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/admin-ui";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill } from "@/components/admin/status-pill";
import { scoutFirstName, scoutInitials } from "@/features/scout/session";
import {
  averageScore,
  countsFor,
  useAssignedPlayers,
  useScoutSession,
} from "@/features/scout/hooks";
import {
  isEvaluated,
  overallAverage,
  score,
  statusLabel,
  type AssignedPlayer,
} from "@/features/scout/evaluation";
import { playerFullName } from "@/services/players";
import { Routes } from "@/routes";

/* The scout's landing screen.
 *
 * Five counters, then the players they belong to. The counters are ordered by
 * the WORKFLOW, not by size: Assigned → Not scored → With admin → Approved →
 * Average. Read left to right that is the pipeline, so a gap in the middle is
 * visible as a gap rather than as a number that happens to be small.
 *
 * ── ONE REQUEST ───────────────────────────────────────────────────────────
 * There is no dashboard endpoint. There does not need to be one:
 * GET /v1/scout/players returns every assigned player WITH their evaluation,
 * so every counter here is a projection of the same list the table below
 * renders (countsFor / averageScore in features/scout/hooks.ts). One request,
 * and no way for the counters to claim six pending while the table shows five
 * — which is exactly what two endpoints would eventually do.
 *
 * The approved mockup keeps notifications and recent chats in a permanent
 * third column. That column costs ~290px on every screen to show two things a
 * scout reads a few times a day, it is the first thing to break under 1400px,
 * and neither has an endpoint — so the table gets the width, which is what a
 * scout is actually looking at.
 */

export default function ScoutDashboardClient() {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();
  const { user } = useScoutSession();

  const query = useAssignedPlayers();
  const players = useMemo(() => query.data?.data ?? [], [query.data]);
  const counts = query.data ? countsFor(players) : undefined;
  const average = averageScore(players);

  /* Not scored first: it is the only counter that is a to-do list. Everything
     below it is either waiting on somebody else or already done. */
  const recent = useMemo(
    () =>
      [...players]
        .sort((a, b) => {
          const rank = (p: AssignedPlayer) => (isEvaluated(p.evaluation) ? 1 : 0);
          const byState = rank(a) - rank(b);
          if (byState !== 0) return byState;
          return String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""));
        })
        .slice(0, 8),
    [players],
  );

  const columns: Column<AssignedPlayer>[] = [
    {
      key: "player",
      label: "Player",
      render: p => (
        <IdentityCell
          initials={scoutInitials(playerFullName(p))}
          name={playerFullName(p)}
          sub={p.email}
        />
      ),
    },
    { key: "position", label: "Position", render: p => p.primary_position ?? "—" },
    { key: "level", label: "Level", render: p => p.current_level ?? "—" },
    {
      key: "status",
      label: "Evaluation",
      nowrap: true,
      render: p => (
        <StatusPill
          label={statusLabel(isEvaluated(p.evaluation) ? p.evaluation.status : null)}
        />
      ),
    },
    {
      key: "overall",
      label: "Overall",
      numeric: true,
      render: p => score(overallAverage(p.evaluation)),
    },
  ];

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Dashboard"]}
        title={`Welcome back, ${scoutFirstName(user?.name)}`}
        onOpenNav={openNav}
        stats={
          counts
            ? [
                { label: `${counts.assigned} assigned`, tone: "var(--status-good)" },
                {
                  label: `${counts.not_started} need your attention`,
                  tone: "var(--status-warn)",
                },
                { label: `${counts.pending} with admin`, tone: "var(--status-info)" },
              ]
            : undefined
        }
      />

      <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
        {/* The pipeline, left to right. */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          <StatCard
            label="Total assigned"
            icon={<Users className="size-3" />}
            value={counts ? String(counts.assigned) : "—"}
          />
          <StatCard
            label="Not scored"
            icon={<ClipboardList className="size-3" />}
            value={counts ? String(counts.not_started) : "—"}
            delta={counts?.not_started ? "waiting on you" : undefined}
          />
          <StatCard
            label="With admin"
            icon={<Gauge className="size-3" />}
            value={counts ? String(counts.pending) : "—"}
            delta="pending review"
          />
          <StatCard
            label="Approved"
            icon={<CircleCheck className="size-3" />}
            value={counts ? String(counts.approved) : "—"}
          />
          {/* Needs revision replaces the average when there is any: work an
              admin sent back is work to redo, and burying it behind a mean
              score is how it goes unnoticed. */}
          {counts && counts.needs_revision > 0 ? (
            <StatCard
              label="Needs revision"
              icon={<ThumbsDown className="size-3" />}
              value={String(counts.needs_revision)}
              delta="admin asked for changes"
            />
          ) : (
            <StatCard
              label="Average score"
              icon={<Gauge className="size-3" />}
              value={score(average)}
              delta="across your scored players"
            />
          )}
        </div>

        <section className="mt-3">
          <div className="mb-2.5 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="m-0 text-[13px] font-semibold">Your players</h2>
              <p className="m-0 mt-0.5 text-[11px] text-muted-foreground">
                Unscored first{counts ? ` · ${counts.assigned} total` : ""}
              </p>
            </div>
            <Link
              href={Routes.scoutPlayers}
              className="shrink-0 text-[11.5px] font-semibold text-brand-text hover:underline"
            >
              View all
            </Link>
          </div>

          <QueryTable
            query={query}
            select={() => recent}
            columns={columns}
            rowKey={p => String(p.id)}
            endpoint="/v1/scout/players"
            emptyTitle="No players assigned to you yet"
            emptyBody="A Golafly admin assigns players from the camp register. They appear here the moment they do."
            onView={p => router.push(Routes.scoutPlayer(p.id))}
          />
        </section>
      </div>
    </>
  );
}
