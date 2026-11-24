"use client";

import { useState } from "react";
import { Download, LoaderCircle, PenLine, Plus, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import { DataTable, IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { FormSheet } from "@/components/admin/form-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import {
  useAdminPlayers,
  useRequestEvaluationChanges,
  useUpdateEvaluationNote,
  useUpdateEvaluationStatus,
} from "@/features/admin/hooks";
import { initialsFor } from "@/features/admin/session";
import {
  group,
  groupAverage,
  isEvaluated,
  overallAverage,
  plan,
  reviewLabel,
  reviewState,
  score,
  summary,
} from "@/features/scout/evaluation";
import { templateFieldCount, templateFor } from "@/features/scout/templates";
import { downloadPlayerCv } from "@/lib/player-cv";
import { PlayersService, playerFullName, type ApiPlayer } from "@/services/players";

/* PLAYERS — the register, each player's CV, and the admin's ruling on their
 * evaluation.
 *
 * ── THREE RULINGS ─────────────────────────────────────────────────────────
 * Approve, Needs revision, Reject. Needs revision asks for a note, because a
 * scout sent back without being told what to change resubmits the same thing.
 *
 * ── NO REFRESH ────────────────────────────────────────────────────────────
 * The sheet holds the selected player's ID, not a copy of the player. It reads
 * the player out of the cached register on every render, and every ruling
 * patches that cache immediately (features/admin/hooks.ts), so the pill, the
 * buttons and the table row all move the moment the admin clicks.
 *
 * ── EVALUATIONS ARE ONLY AS PRESENT AS THE API MAKES THEM ─────────────────
 * GET /v1/players did not always carry `evaluation`. When it is absent the
 * screen says "Unavailable" rather than implying "not evaluated".
 */

const asDate = (iso: string) => (iso ? iso.slice(0, 10) : "—");

const asText = (v: unknown) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

/** Fetches the full record first — the list can be trimmed — and falls back to
 *  the row we already have if that request fails. */
function useCvDownload() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const download = async (player: ApiPlayer) => {
    setDownloadingId(player.id);
    try {
      const full = await PlayersService.getPlayerById(player.id)
        .then(r => ({ ...player, ...r.data, evaluation: r.data.evaluation ?? player.evaluation }))
        .catch(() => player);
      await downloadPlayerCv(full);
    } catch {
      toast.error("Could not generate the CV. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };
  return { download, downloadingId };
}

export default function PlayersClient() {
  const { openNav } = useAdminNav();
  const query = useAdminPlayers();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [noting, setNoting] = useState<{ player: ApiPlayer; mode: "note" | "revision" } | null>(
    null,
  );

  const setStatus = useUpdateEvaluationStatus();
  const setNote = useUpdateEvaluationNote();
  const requestChanges = useRequestEvaluationChanges();
  const busy = setStatus.isPending || setNote.isPending || requestChanges.isPending;
  const cv = useCvDownload();

  const players = query.data?.data ?? [];
  const selected = players.find(p => p.id === selectedId) ?? null;

  const available = players.filter(p =>
    ["available for trials", "open to opportunities", "free agent"].includes(
      p.player_status?.toLowerCase() ?? "",
    ),
  ).length;

  const evaluationsAvailable = players.some(p => p.evaluation !== undefined);
  const pending = players.filter(p => reviewState(p.evaluation) === "pending").length;

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
      key: "evaluation",
      label: "Evaluation",
      nowrap: true,
      render: p => {
        if (p.evaluation === undefined) {
          return <span className="text-[11px] text-muted-foreground">Unavailable</span>;
        }
        if (!isEvaluated(p.evaluation)) {
          return <span className="text-[11px] text-muted-foreground">Not scored</span>;
        }
        return <StatusPill label={reviewLabel(p.evaluation)} />;
      },
    },
    {
      key: "overall",
      label: "Overall",
      numeric: true,
      render: p => (p.evaluation ? score(overallAverage(p.evaluation)) : "—"),
    },
    { key: "registered", label: "Registered", numeric: true, render: p => asDate(p.created_at) },
    {
      key: "status",
      label: "Status",
      nowrap: true,
      render: p => <StatusPill label={p.player_status ?? ""} />,
    },
    {
      key: "cv",
      label: "",
      nowrap: true,
      render: p => (
        <span className="flex justify-end">
          <AdminButton
            variant="ghost"
            size="sm"
            disabled={cv.downloadingId === p.id}
            onClick={e => {
              e.stopPropagation();
              void cv.download(p);
            }}
          >
            {cv.downloadingId === p.id ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            CV
          </AdminButton>
        </span>
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Players"]}
        title="Players"
        stats={[
          { label: `${available} available`, tone: "var(--status-info)" },
          ...(evaluationsAvailable
            ? [{ label: `${pending} awaiting review`, tone: "var(--status-warn)" }]
            : []),
          { label: `${players.length} total` },
        ]}
        action={
          <AdminButton variant="outline" size="sm">
            <Download className="size-3" />
            Export CSV
          </AdminButton>
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {!evaluationsAvailable && players.length > 0 && (
          <p className="mb-3 rounded-lg bg-status-info-bg px-3 py-2.5 text-[11.5px] leading-relaxed text-status-info shadow-[0_0_0_1px_var(--edge)]">
            Evaluations aren’t in this response yet.{" "}
            <code className="font-mono text-[10.5px]">GET /v1/players</code> doesn’t
            return the <code className="font-mono text-[10.5px]">evaluation</code>{" "}
            object, so scores and approvals can’t be shown here.
          </p>
        )}

        <QueryTable
          query={query}
          select={d => d.data}
          columns={columns}
          rowKey={p => String(p.id)}
          endpoint="/v1/players"
          emptyTitle="No players registered yet"
          emptyBody="Players appear here once they complete registration."
          emptyAction={
            <AdminButton>
              <Plus className="size-3.5" />
              Add player
            </AdminButton>
          }
          selectedKey={selected ? String(selected.id) : null}
          onView={p => setSelectedId(p.id)}
        />
      </div>

      {selected && (
        <PlayerSheet
          player={selected}
          busy={busy}
          downloading={cv.downloadingId === selected.id}
          onDownload={() => void cv.download(selected)}
          onClose={() => setSelectedId(null)}
          onNote={() => setNoting({ player: selected, mode: "note" })}
          onRequestChanges={() => setNoting({ player: selected, mode: "revision" })}
          onStatus={status => setStatus.mutate({ playerId: selected.id, status })}
        />
      )}

      {noting && (
        <FormSheet
          title={
            noting.mode === "revision"
              ? `Send ${playerFullName(noting.player)}'s evaluation back`
              : `Note on ${playerFullName(noting.player)}`
          }
          subtitle={
            noting.mode === "revision"
              ? "The scout can edit the evaluation again, and sees this note at the top of it."
              : "The scout who wrote this evaluation sees your note on it."
          }
          sections={[
            {
              title: noting.mode === "revision" ? "What needs changing" : "Admin note",
              fields: [
                {
                  name: "note",
                  label: "Note",
                  kind: "textarea",
                  required: true,
                  help:
                    noting.mode === "revision"
                      ? "Be specific — name the step or attribute to look at again."
                      : "Why this was approved or rejected, or anything the scout should know.",
                },
              ],
            },
          ]}
          initialValues={{ note: noting.player.evaluation?.note ?? "" }}
          submitLabel={noting.mode === "revision" ? "Send back" : "Save note"}
          onSubmit={values => {
            const note = String(values.note ?? "").trim();
            if (!note) return;
            const vars = { playerId: noting.player.id, note };
            const done = { onSuccess: () => setNoting(null) };
            if (noting.mode === "revision") requestChanges.mutate(vars, done);
            else setNote.mutate(vars, done);
          }}
          onClose={() => setNoting(null)}
        />
      )}
    </>
  );
}

/* ── One player, their CV, and the ruling on their evaluation ─────────── */

function PlayerSheet({
  player,
  busy,
  downloading,
  onDownload,
  onClose,
  onNote,
  onRequestChanges,
  onStatus,
}: {
  player: ApiPlayer;
  busy: boolean;
  downloading: boolean;
  onDownload: () => void;
  onClose: () => void;
  onNote: () => void;
  onRequestChanges: () => void;
  onStatus: (status: string) => void;
}) {
  const evaluation = player.evaluation;
  const scored = isEvaluated(evaluation);
  const state = reviewState(evaluation);
  const { template, legacy } = templateFor(player, evaluation);

  const attributeRows = template.groups.flatMap(g => {
    const scores = group(evaluation?.[g.key]);
    return g.fields.map(f => ({ group: g.label, label: f.label, value: scores[f.key] }));
  });

  const attributeColumns: Column<(typeof attributeRows)[number]>[] = [
    { key: "group", label: "Group", render: r => r.group },
    { key: "field", label: "Attribute", render: r => r.label },
    {
      key: "score",
      label: "Score",
      numeric: true,
      render: r => (typeof r.value === "number" ? r.value : "—"),
    },
  ];

  const dev = plan(evaluation?.development_plan);
  const sum = summary(evaluation?.summary);

  return (
    <DetailSheet
      title={playerFullName(player)}
      subtitle={[player.primary_position, player.nationality, player.current_level]
        .filter(Boolean)
        .join(" · ")}
      onClose={onClose}
      footer={
        /* Rulings only, as one even row. Download CV and Note live on their
           own sections, so the footer never wraps into a scatter. */
        scored ? (
          <div className="grid w-full grid-flow-col auto-cols-fr gap-2 [&>*]:w-full [&>*]:justify-center">
            {state !== "rejected" && (
              <AdminButton variant="outline" size="sm" disabled={busy} onClick={() => onStatus("rejected")}>
                <ThumbsDown className="size-3" />
                Reject
              </AdminButton>
            )}
            {state !== "needs_revision" && (
              <AdminButton variant="outline" size="sm" disabled={busy} onClick={onRequestChanges}>
                <PenLine className="size-3" />
                Needs revision
              </AdminButton>
            )}
            {state !== "approved" && (
              <AdminButton size="sm" disabled={busy} onClick={() => onStatus("approved")}>
                <ThumbsUp className="size-3" />
                Approve
              </AdminButton>
            )}
          </div>
        ) : undefined
      }
    >
      <SheetSection
        title="Player"
        action={
          <AdminButton variant="ghost" size="sm" disabled={downloading} onClick={onDownload}>
            {downloading ? (
              <LoaderCircle className="size-3 animate-spin" />
            ) : (
              <Download className="size-3" />
            )}
            Download CV
          </AdminButton>
        }
      >
        <SheetFacts
          facts={[
            ["Email", player.email],
            ["Phone", player.phone ?? "—"],
            ["Nationality", player.nationality ?? "—"],
            ["Position", player.primary_position ?? "—"],
            ["Level", player.current_level ?? "—"],
            ["Registered", asDate(player.created_at)],
            ["Status", <StatusPill key="s" label={player.player_status ?? ""} />],
          ]}
        />
      </SheetSection>

      <SheetSection
        title="Evaluation"
        action={
          scored ? (
            <AdminButton variant="ghost" size="sm" disabled={busy} onClick={onNote}>
              {evaluation?.note ? "Edit note" : "Add note"}
            </AdminButton>
          ) : undefined
        }
      >
        {evaluation === undefined ? (
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Not in this response.{" "}
            <code className="font-mono text-[10.5px]">GET /v1/players</code> doesn’t
            return the evaluation, so there is nothing to rule on from here.
          </p>
        ) : !scored ? (
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            No scout has evaluated this player yet. Assign them to a scout on the
            Scouts screen.
          </p>
        ) : (
          <>
            <SheetFacts
              facts={[
                ["Status", <StatusPill key="s" label={reviewLabel(evaluation)} />],
                [
                  "Template",
                  `${template.name} · ${templateFieldCount(template)} attributes${legacy ? " (pre-templates)" : ""}`,
                ],
                ["Overall", score(overallAverage(evaluation))],
                ...template.groups.map(
                  g =>
                    [g.label, score(groupAverage(evaluation, g.key))] as [
                      string,
                      React.ReactNode,
                    ],
                ),
                ["Good", asText(evaluation.good)],
                ["Potential", asText(evaluation.potential)],
                ["Provisional", asText(evaluation.provisional_score)],
                ["Headline", asText(sum.headline)],
                ["Recommendation", asText(sum.recommendation)],
                ["Development focus", asText(dev.focus)],
                ["Timeline", asText(dev.timeline)],
                ["Admin note", asText(evaluation.note)],
                ["Updated", evaluation.updated_at?.slice(0, 10) ?? "—"],
              ]}
            />
            <div className="mt-3">
              <DataTable
                columns={attributeColumns}
                rows={attributeRows}
                rowKey={r => `${r.group}-${r.label}`}
                pageSize={0}
              />
            </div>
          </>
        )}
      </SheetSection>
    </DetailSheet>
  );
}
