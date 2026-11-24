"use client";

import { useContext, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PenLine, Search } from "lucide-react";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminButton } from "@/components/admin/admin-ui";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill } from "@/components/admin/status-pill";
import { ScoutFilteredEmpty } from "@/components/scout/scout-states";
import { scoutInitials } from "@/features/scout/session";
import { useAssignedPlayers } from "@/features/scout/hooks";
import {
  overallAverage,
  reviewLabel,
  reviewState,
  score,
  type AssignedPlayer,
} from "@/features/scout/evaluation";
import { scoredIn, templateFieldCount, templateFor } from "@/features/scout/templates";
import { playerFullName } from "@/services/players";
import { Routes } from "@/routes";

/* ASSIGNED PLAYERS — the scout's own register.
 *
 * GET /v1/scout/players. No scout id in that path: it means "the players
 * assigned to whoever holds this token".
 *
 * No select checkbox and no delete — assigning is an admin verb. One action
 * per row, and it changes with the row's state: Evaluate, Continue, Revise or
 * Review.
 *
 * Tabs live in the URL (`?tab=`), so a filtered list is shareable and
 * back-button safe.
 */

const TABS = [
  { key: "all", label: "All" },
  { key: "todo", label: "Not scored" },
  { key: "pending", label: "With admin" },
  { key: "needs_revision", label: "Needs revision" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const isTabKey = (v: string | null): v is TabKey => !!v && TABS.some(t => t.key === v);

/** Which tab a row belongs to. One function so the counts and the filter can
 *  never disagree. */
function bucketOf(p: AssignedPlayer): Exclude<TabKey, "all"> {
  const state = reviewState(p.evaluation);
  return state === "not_started" ? "todo" : state;
}

export default function AssignedPlayersClient() {
  const { openNav } = useContext(AdminNavContext);
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState("");

  const raw = params.get("tab");
  const tab: TabKey = isTabKey(raw) ? raw : "all";

  const query = useAssignedPlayers();
  const all = useMemo(() => query.data?.data ?? [], [query.data]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter(p => {
      if (term && !`${playerFullName(p)} ${p.email}`.toLowerCase().includes(term))
        return false;
      return tab === "all" || bucketOf(p) === tab;
    });
  }, [all, search, tab]);

  const filtered = search.trim() !== "" || tab !== "all";

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
    {
      key: "position",
      label: "Position",
      render: p =>
        [p.primary_position, p.secondary_position].filter(Boolean).join(" · ") || "—",
    },
    {
      key: "template",
      label: "Template",
      render: p => templateFor(p, p.evaluation).template.name,
    },
    {
      key: "status",
      label: "Evaluation",
      nowrap: true,
      render: p => <StatusPill label={reviewLabel(p.evaluation)} />,
    },
    {
      /* Scored-of-total rather than a percentage: a scout wants to know how
         many attributes are left. The total depends on the position. */
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
      key: "action",
      label: "",
      nowrap: true,
      render: p => {
        const state = reviewState(p.evaluation);
        const { template } = templateFor(p, p.evaluation);
        const partial =
          state !== "not_started" && scoredIn(template, p.evaluation) < templateFieldCount(template);
        const label =
          state === "not_started"
            ? "Evaluate"
            : state === "needs_revision"
              ? "Revise"
              : state === "approved" || state === "rejected"
                ? "Review"
                : partial
                  ? "Continue"
                  : "Review";
        return (
          <span className="flex justify-end">
            <AdminButton
              variant={label === "Review" ? "ghost" : "outline"}
              size="sm"
              onClick={e => {
                e.stopPropagation();
                router.push(Routes.scoutEvaluation(p.id));
              }}
            >
              <PenLine className="size-3.5" />
              {label}
            </AdminButton>
          </span>
        );
      },
    },
  ];

  const counts = useMemo(() => {
    const by: Record<TabKey, number> = {
      all: all.length,
      todo: 0,
      pending: 0,
      needs_revision: 0,
      approved: 0,
      rejected: 0,
    };
    for (const p of all) by[bucketOf(p)] += 1;
    return by;
  }, [all]);

  return (
    <>
      <AdminPageHeader
        crumbs={["Scouting", "Assigned Players"]}
        title="Assigned Players"
        onOpenNav={openNav}
        stats={[
          { label: `${counts.all} assigned`, tone: "var(--status-good)" },
          { label: `${counts.todo} not scored`, tone: "var(--status-warn)" },
          ...(counts.needs_revision > 0
            ? [{ label: `${counts.needs_revision} need revision`, tone: "var(--status-danger)" }]
            : []),
        ]}
        tabs={TABS.filter(t => t.key === "all" || t.key === "todo" || counts[t.key] > 0 || tab === t.key).map(t => ({
          label: `${t.label} (${counts[t.key]})`,
          href: t.key === "all" ? Routes.scoutPlayers : `${Routes.scoutPlayers}?tab=${t.key}`,
          active: tab === t.key,
        }))}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        <label className="mb-3 flex h-8 max-w-[320px] items-center gap-2 rounded-md bg-card px-2.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
          <Search className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search your players"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </label>

        {filtered && rows.length === 0 && all.length > 0 ? (
          <ScoutFilteredEmpty
            total={all.length}
            noun="players"
            onClear={() => {
              setSearch("");
              router.push(Routes.scoutPlayers);
            }}
          />
        ) : (
          <QueryTable
            query={query}
            select={() => rows}
            columns={columns}
            rowKey={p => String(p.id)}
            endpoint="/v1/scout/players"
            emptyTitle="No players assigned to you yet"
            emptyBody="A Golafly admin assigns players from the camp register. They appear here the moment they do."
          />
        )}
      </div>
    </>
  );
}
