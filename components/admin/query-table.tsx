"use client";

import { Inbox, RefreshCw, TriangleAlert } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { AdminButton, EmptyState } from "@/components/admin/admin-ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { extractApiMessage } from "@/features/admin/hooks";

/* Wraps a react-query result in the five table states from the design, so no
   screen has to reimplement them:
     loading  → skeleton at the real row height, so nothing shifts
     error    → the failing call and its status, because the people using this
                dashboard also run the API
     empty    → "nothing exists yet", which invites you to create
     data     → the table
   The filtered-empty state is deliberately NOT here — it needs the active
   filters to echo back, so it belongs to the screen that owns them. */

interface QueryTableProps<TRow, TData> {
  query: UseQueryResult<TData>;
  select: (data: TData) => TRow[];
  columns: Column<TRow>[];
  rowKey: (row: TRow) => string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: React.ReactNode;
  endpoint: string;
  selectedKey?: string | null;
  onView?: (row: TRow) => void;
  onEdit?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;
  /* Passed to DataTable. 0 = no client paging (the screen pages server-side). */
  pageSize?: number;
}

export function QueryTable<TRow, TData>({
  query,
  select,
  columns,
  rowKey,
  emptyTitle,
  emptyBody,
  emptyAction,
  endpoint,
  selectedKey,
  onView,
  onEdit,
  onDelete,
  pageSize,
}: QueryTableProps<TRow, TData>) {
  if (query.isPending) {
    return <TableSkeleton columns={columns.length} />;
  }

  if (query.isError) {
    const status = (query.error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
        <EmptyState
          icon={<TriangleAlert className="size-5 text-destructive" />}
          title={`Couldn’t load ${emptyTitle.toLowerCase()}`}
          body={extractApiMessage(query.error)}
          action={
            <div className="flex flex-col items-center gap-2.5">
              <code className="rounded-md bg-muted px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
                GET {endpoint}
                {status ? ` → ${status}` : ""}
              </code>
              <AdminButton variant="outline" size="sm" onClick={() => query.refetch()}>
                <RefreshCw className="size-3" />
                Retry
              </AdminButton>
            </div>
          }
        />
      </div>
    );
  }

  const rows = select(query.data);

  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
        <EmptyState
          icon={<Inbox className="size-5" />}
          title={emptyTitle}
          body={emptyBody}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={rowKey}
        total={rows.length}
        selectedKey={selectedKey}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        pageSize={pageSize}
      />
      {/* On refetch the table dims but stays — it never collapses back to a
          skeleton, so a table you were mid-read of does not vanish. */}
      {query.isFetching && (
        <span className="absolute right-2.5 top-2 inline-flex h-6 items-center gap-1.5 rounded-full bg-card px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
          <RefreshCw className="size-3 animate-spin" />
          Updating
        </span>
      )}
    </div>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  /* Widths vary per row so it reads as content loading, not a spinner. */
  const widths = ["70%", "45%", "60%", "38%", "52%"];
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <table className="w-full border-collapse">
        <tbody>
          {[0, 1, 2, 3, 4].map(r => (
            <tr key={r} className="border-b border-[var(--edge)] last:border-b-0">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="h-11 px-3">
                  <span
                    className="block h-2.5 animate-pulse rounded-sm bg-muted"
                    style={{ width: widths[(r + c) % widths.length] }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
