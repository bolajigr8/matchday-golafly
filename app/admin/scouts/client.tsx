"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Plus, UserPlus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton, EmptyState } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { FormSheet, type FormSection } from "@/components/admin/form-sheet";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill } from "@/components/admin/status-pill";
import {
  useAdminPlayers,
  useAdminScout,
  useAdminScoutDetails,
  useAdminScouts,
  useAssignPlayer,
  useCreateScout,
  useDeleteScout,
  useUnassignPlayer,
} from "@/features/admin/hooks";
import { initialsFor } from "@/features/admin/session";
import { playerFullName, type ApiPlayer } from "@/services/players";
import { scoutPlayers, type ApiScout } from "@/services/scouts";
import type { AssignedPlayer } from "@/features/scout/evaluation";
import { Routes } from "@/routes";

/* ══════════════════════════════════════════════════════════════════════════
   SCOUTS — who evaluates, and who they evaluate.
   ══════════════════════════════════════════════════════════════════════════

   Live against /v1/scouts. This screen used to be a specification that wrote to
   localStorage; the six endpoints it was arguing for now exist, so it writes to
   the API and the local store is gone.

   TWO TABS, BECAUSE THEY ANSWER TWO QUESTIONS
   Scouts is "who works for us"; Assignments is "who is evaluating this player".
   Assigning lives on the second because it is a decision you make while looking
   at the player register — not while looking at a scout, which is why there is
   no player picker inside the scout sheet.

   WHERE THE PLAYER COUNTS COME FROM
   GET /v1/scouts returns scouts WITHOUT their players; only GET /v1/scouts/{id}
   carries them. So the counts on the table come from useAdminScoutDetails,
   which fetches one detail per scout and shares its cache with the sheet and
   the assignments tab. See the note on that hook — it is the one N+1 here, it
   is deliberate, and it disappears by itself if the index ever includes
   `players`.

   ROLE AND STATUS ARE THE SERVER'S
   POST /v1/scouts takes name and email only. There is no role select and no
   activation switch, because a control that promises a setting the API drops is
   worse than no control at all. Both fields are rendered from the response. */

const asDate = (iso: string) => (iso ? iso.slice(0, 10) : "—");

/* The API sends "scout" today and may send more later. Known values get a
   proper label; anything else is shown as-is rather than as a blank cell. */
const ROLE_LABEL: Record<string, string> = {
  scout: "Scout",
  club: "Club",
  club_representative: "Club representative",
};

const roleLabel = (role: string) => ROLE_LABEL[role] ?? role;

/* A SCOUT ACCOUNT's status — numeric, not boolean. 1 is the only value seen so
   far, so treat it as the active one and show anything else honestly rather
   than folding every non-1 into "Inactive".

   Deliberately not called statusLabel: an EVALUATION's status is a different
   thing with its own vocabulary, imported from features/scout/evaluation. Two
   functions of that name in one file is how a scout row ends up labelled
   "Pending". */
const scoutStatusLabel = (status: number) =>
  status === 1 ? "Active" : `Status ${status}`;

const SCOUT_FORM: FormSection[] = [
  {
    title: "Scout",
    fields: [
      { name: "name", label: "Full name", kind: "text", required: true, half: true },
      {
        name: "email",
        label: "Email",
        kind: "text",
        required: true,
        half: true,
        help: "Where the welcome email goes, and the address they sign in with.",
      },
    ],
  },
];

type Tab = "scouts" | "assignments";

export default function ScoutsClient() {
  const { openNav } = useAdminNav();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "scouts";

  const query = useAdminScouts();
  const scouts = useMemo(() => query.data?.data ?? [], [query.data]);
  const held = useAdminScoutDetails(scouts);

  const create = useCreateScout();
  const remove = useDeleteScout();

  const [createOpen, setCreateOpen] = useState(false);
  /* Separate slots for view and delete: opening a form when someone asked to
     look is how accidental edits happen. */
  const [viewing, setViewing] = useState<ApiScout | null>(null);
  const [deleting, setDeleting] = useState<ApiScout | null>(null);

  const assignments = scouts.reduce((n, s) => n + (held.get(s.id)?.length ?? 0), 0);

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Scouts"]}
        title="Scouts"
        onOpenNav={openNav}
        stats={[
          { label: `${scouts.length} scouts`, tone: "var(--status-good)" },
          { label: `${assignments} assignments` },
        ]}
        tabs={[
          { label: "Scouts", href: Routes.adminScouts, active: tab === "scouts" },
          {
            label: "Assignments",
            href: Routes.adminWithTab(Routes.adminScouts, "assignments"),
            active: tab === "assignments",
          },
        ]}
        action={
          tab === "scouts" ? (
            <AdminButton onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              Add scout
            </AdminButton>
          ) : undefined
        }
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {tab === "scouts" ? (
          <ScoutsTab
            query={query}
            held={held}
            onCreate={() => setCreateOpen(true)}
            onView={setViewing}
            onDelete={setDeleting}
          />
        ) : (
          <AssignmentsTab scouts={scouts} held={held} />
        )}
      </div>

      {createOpen && (
        <FormSheet
          title="New scout"
          subtitle="They are emailed a welcome message and can be assigned players straight away."
          sections={SCOUT_FORM}
          submitLabel="Add scout"
          onSubmit={values =>
            create.mutate(
              {
                name: String(values.name ?? "").trim(),
                email: String(values.email ?? "").trim(),
              },
              { onSuccess: () => setCreateOpen(false) },
            )
          }
          onClose={() => setCreateOpen(false)}
        />
      )}

      {viewing && <ScoutSheet scout={viewing} onClose={() => setViewing(null)} />}

      {deleting && (
        <ConfirmDialog
          title={`Remove ${deleting.name}?`}
          body={`Their ${held.get(deleting.id)?.length ?? 0} assignment(s) go too — an assignment pointing at a scout who no longer exists is a player nobody is evaluating.`}
          confirmLabel="Remove scout"
          onCancel={() => setDeleting(null)}
          onConfirm={() =>
            remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })
          }
        />
      )}
    </>
  );
}

/* ── Scouts tab ───────────────────────────────────────────────────────── */

function ScoutsTab({
  query,
  held,
  onCreate,
  onView,
  onDelete,
}: {
  query: ReturnType<typeof useAdminScouts>;
  held: Map<string, ApiPlayer[]>;
  onCreate: () => void;
  onView: (s: ApiScout) => void;
  onDelete: (s: ApiScout) => void;
}) {
  const columns: Column<ApiScout>[] = [
    {
      key: "scout",
      label: "Scout",
      render: s => <IdentityCell initials={initialsFor(s.name)} name={s.name} sub={s.email} />,
    },
    { key: "role", label: "Role", render: s => roleLabel(s.role) },
    {
      key: "players",
      label: "Players",
      numeric: true,
      render: s => held.get(s.id)?.length ?? 0,
    },
    {
      key: "status",
      label: "Status",
      nowrap: true,
      render: s => <StatusPill label={scoutStatusLabel(s.status)} />,
    },
    { key: "added", label: "Added", numeric: true, render: s => asDate(s.created_at) },
  ];

  return (
    <QueryTable
      query={query}
      select={d => d.data}
      columns={columns}
      rowKey={s => s.id}
      endpoint="/v1/scouts"
      emptyTitle="No scouts yet"
      emptyBody="Add a scout, then assign them players from the register."
      emptyAction={
        <AdminButton onClick={onCreate}>
          <Plus className="size-3.5" />
          Add scout
        </AdminButton>
      }
      onView={onView}
      onDelete={onDelete}
    />
  );
}

/* ── One scout, and what they hold ────────────────────────────────────────
   The row we were handed has no `players`, so the sheet fetches the detail. */

function ScoutSheet({ scout, onClose }: { scout: ApiScout; onClose: () => void }) {
  const detail = useAdminScout(scout.id);
  const unassign = useUnassignPlayer();
  const players = scoutPlayers(detail.data?.data);

  return (
    <DetailSheet title={scout.name} subtitle={scout.email} onClose={onClose}>
      <SheetSection title="Account">
        <SheetFacts
          facts={[
            ["Role", roleLabel(scout.role)],
            ["Status", <StatusPill key="s" label={scoutStatusLabel(scout.status)} />],
            ["Added", asDate(scout.created_at)],
            [
              "Scout ID",
              <span key="id" className="font-mono text-[11px]">
                {scout.id}
              </span>,
            ],
          ]}
        />
      </SheetSection>

      <SheetSection title={`Assigned players (${players.length})`}>
        {detail.isPending ? (
          <p className="text-[11.5px] text-muted-foreground">Loading…</p>
        ) : detail.isError ? (
          <p className="text-[11.5px] leading-relaxed text-destructive">
            Couldn’t load this scout’s players.{" "}
            <code className="font-mono text-[10.5px]">GET /v1/scouts/{scout.id}</code>
          </p>
        ) : players.length === 0 ? (
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            None yet. Assign players from the Assignments tab.
          </p>
        ) : (
          <ul className="m-0 flex flex-col gap-1.5 p-0">
            {players.map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted px-2.5 py-2"
              >
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold">
                    {playerFullName(p)}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {[p.primary_position, p.nationality].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  disabled={unassign.isPending}
                  onClick={() => unassign.mutate({ scoutId: scout.id, playerId: p.id })}
                >
                  Unassign
                </AdminButton>
              </li>
            ))}
          </ul>
        )}
      </SheetSection>
    </DetailSheet>
  );
}

/* ── Assignments tab ──────────────────────────────────────────────────────
   The real player register with one extra column. The held set comes from the
   selected scout's detail record, which is the only place the API reports it. */

function AssignmentsTab({
  scouts,
  held,
}: {
  scouts: ApiScout[];
  /* Every scout's players, not just the selected one — without it a player
     already assigned to Scout A shows a plain "Assign" button under Scout B
     and you double-assign without ever being told. */
  held: Map<string, AssignedPlayer[]>;
}) {
  const query = useAdminPlayers();
  const [scoutId, setScoutId] = useState<string>("");

  /* Default to the first scout rather than leaving the select blank — with one
     scout, which is the common case here, the blank state is a dead end. */
  const active = useMemo(
    () => scouts.find(s => s.id === scoutId) ?? scouts[0] ?? null,
    [scouts, scoutId],
  );

  const detail = useAdminScout(active?.id);
  const assign = useAssignPlayer();
  const unassign = useUnassignPlayer();

  const heldIds = useMemo(
    () => new Set(scoutPlayers(detail.data?.data).map(p => p.id)),
    [detail.data],
  );

  /* playerId → every scout holding them. Inverted once from the map the page
     already has, so this costs no extra request. */
  const holders = useMemo(() => {
    const map = new Map<number, ApiScout[]>();
    for (const scout of scouts) {
      for (const player of held.get(scout.id) ?? []) {
        map.set(player.id, [...(map.get(player.id) ?? []), scout]);
      }
    }
    return map;
  }, [scouts, held]);

  const busy = assign.isPending || unassign.isPending;

  const columns: Column<ApiPlayer>[] = [
    {
      key: "player",
      label: "Player",
      render: p => (
        <IdentityCell
          initials={initialsFor(playerFullName(p))}
          name={playerFullName(p)}
          sub={p.email}
        />
      ),
    },
    { key: "position", label: "Position", render: p => p.primary_position ?? "—" },
    { key: "nationality", label: "Nationality", render: p => p.nationality ?? "—" },
    { key: "level", label: "Level", render: p => p.current_level ?? "—" },
    {
      key: "holders",
      label: "Held by",
      truncate: true,
      width: "20ch",
      render: p => {
        const names = (holders.get(p.id) ?? []).map(s => s.name);
        const text = names.length ? names.join(", ") : "—";
        return <span title={text}>{text}</span>;
      },
    },
    {
      key: "assign",
      label: "Assignment",
      nowrap: true,
      render: p => {
        if (!active) return null;
        if (heldIds.has(p.id)) {
          return (
            <span className="flex items-center justify-end gap-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-status-good">
                <Check className="size-3.5" />
                Assigned
              </span>
              <AdminButton
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => unassign.mutate({ scoutId: active.id, playerId: p.id })}
              >
                Undo
              </AdminButton>
            </span>
          );
        }
        /* Held by somebody else. The API allows ONE scout per player
           ("This player is already assigned to another scout."), so there is
           nothing to press here — unassign them from that scout first. */
        if ((holders.get(p.id) ?? []).length > 0) {
          return (
            <span className="flex justify-end text-[11px] text-muted-foreground">
              Assigned elsewhere
            </span>
          );
        }
        return (
          <span className="flex justify-end">
            <AdminButton
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => assign.mutate({ scoutId: active.id, playerId: p.id })}
            >
              Assign
            </AdminButton>
          </span>
        );
      },
    },
  ];

  if (scouts.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
        <EmptyState
          icon={<UserPlus className="size-5" />}
          title="Add a scout first"
          body="Assignments connect a player to a scout, so there has to be a scout to connect them to."
          action={
            <AdminButton onClick={() => window.history.back()}>Back to scouts</AdminButton>
          }
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 rounded-lg bg-card px-3 py-2.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
        <label
          htmlFor="assign-scout"
          className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          Assigning to
        </label>
        {/* A plain select, not a FormSheet field: FormField.options is
            string[], which cannot carry an id alongside its label. */}
        <select
          id="assign-scout"
          value={active?.id ?? ""}
          onChange={e => setScoutId(e.target.value)}
          className="h-7 rounded-md bg-muted px-2 text-xs font-semibold text-foreground shadow-[0_0_0_1px_var(--edge)] outline-none focus-visible:shadow-[0_0_0_1px_var(--brand-edge)]"
        >
          {scouts.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} — {roleLabel(s.role)}
            </option>
          ))}
        </select>
        <span className="text-[11.5px] text-muted-foreground">
          holds <span className="font-mono text-[11px] tabular-nums">{heldIds.size}</span>{" "}
          player{heldIds.size === 1 ? "" : "s"}
        </span>
      </div>

      <QueryTable
        query={query}
        select={d => d.data}
        columns={columns}
        rowKey={p => String(p.id)}
        endpoint="/v1/players"
        emptyTitle="No players yet"
        emptyBody="Players appear here once they register. Assignments are made from this register."
      />
    </>
  );
}
