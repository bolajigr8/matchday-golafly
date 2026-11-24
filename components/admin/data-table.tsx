"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* Seven of the eight admin screens are a table with a detail sheet, so this
   is most of the dashboard's surface area.

   Keeps the shape of the frontend's CustomTable — pre-rendered ReactNode
   cells against a column list — so porting a screen is a data change, not a
   rewrite. Only the styling moved.

   Header sits one surface step down (--muted); at eight columns a
   transparent header stops reading as chrome and starts reading as a row.
   Rows are separated by hairlines, never zebra stripes — stripes compete
   with the status pills for attention. */

export interface Column<T> {
  key: string;
  label: string;
  /* Right-align and use tabular mono. Dates and money always. */
  numeric?: boolean;
  /* Never wrap this cell — status pills, short enums. */
  nowrap?: boolean;
  /* Clamp this cell to one line, ellipsised, with the full value on hover.
     For free text of unbounded length — a headline, a scout's full name —
     which otherwise wraps to six lines and drags every other cell in the row
     down with it. Give it a `width` too, or it has nothing to clamp against.
     Pass the plain-text value as `title` from `render` if the cell is not a
     bare string; a tooltip is the only way the clipped text stays reachable. */
  truncate?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  selectedKey?: string | null;
  total?: number;
  /* Rows per page. 0 turns paging off entirely for a table that is always
     short — a pager under three rows is furniture. */
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onView,
  onEdit,
  onDelete,
  selectedKey,
  total,
  pageSize: initialPageSize = 10,
}: DataTableProps<T>) {
  const hasActions = Boolean(onView || onEdit || onDelete);

  /* ── Paging ───────────────────────────────────────────────────────────
     This footer used to be hardcoded markup — a literal "1 2 3 … 16" and
     "Rows 10" with no state and no handlers — left over from the design
     mockup. It rendered under every admin table, so three rows offered
     sixteen pages. Now it pages.

     Client-side, because every admin list endpoint returns a flat array with
     no pagination wrapper. When one of them starts paging server-side, this
     is the component that grows a `page`/`onPageChange` pair, and the screens
     do not change. */
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);

  const paged = pageSize > 0;
  const pageCount = paged ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;

  /* Clamped rather than reset: deleting the last row of page 4 should land
     you on page 3, not back at the top of the table. */
  const current = Math.min(page, pageCount);
  const from = paged ? (current - 1) * pageSize : 0;
  const visible = paged ? rows.slice(from, from + pageSize) : rows;

  const pageNumbers = useMemo(() => elide(current, pageCount), [current, pageCount]);

  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr>
              {columns.map(c => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={cn(
                    "h-[34px] whitespace-nowrap border-b border-[var(--edge)] bg-muted px-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground",
                    c.numeric ? "text-right" : "text-left",
                  )}
                >
                  {c.label}
                </th>
              ))}
              {hasActions && (
                <th className="h-[34px] border-b border-[var(--edge)] bg-muted px-3 text-right font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map(row => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  className={cn(
                    "group border-b border-[var(--edge)] transition-colors last:border-b-0",
                    selectedKey === key ? "bg-brand/10" : "hover:bg-accent",
                  )}
                >
                  {columns.map(c => (
                    <td
                      key={c.key}
                      style={c.width ? { maxWidth: c.width } : undefined}
                      className={cn(
                        "h-11 px-3 align-middle text-foreground",
                        /* Status-ish columns must not squeeze their pill onto
                           two lines; wide free-text columns absorb the slack. */
                        c.nowrap && "whitespace-nowrap",
                        /* nowrap: numeric columns are dates, scores and
                           counts — "2026-09-03" broken over two lines reads
                           as two values. */
                        c.numeric && "whitespace-nowrap text-right font-mono text-xs tabular-nums",
                      )}
                    >
                      {/* One line, ellipsised. The wrapper rather than the td
                          because `text-overflow` needs a block box with a
                          width, and a td computes its own. */}
                      {c.truncate ? (
                        <span className="block truncate">{c.render(row)}</span>
                      ) : (
                        c.render(row)
                      )}
                    </td>
                  ))}
                  {hasActions && (
                    <td className="h-11 px-3 align-middle">
                      {/* Ghost until row hover, but always in the DOM and the
                          tab order. Destructive last, red only on its own
                          hover. */}
                      <span className="flex items-center justify-end gap-0.5">
                        {onView && (
                          <RowAction label="View" onClick={() => onView(row)}>
                            <Eye className="size-3.5" />
                          </RowAction>
                        )}
                        {onEdit && (
                          <RowAction label="Edit" onClick={() => onEdit(row)}>
                            <Pencil className="size-3.5" />
                          </RowAction>
                        )}
                        {onDelete && (
                          <RowAction label="Delete" destructive onClick={() => onDelete(row)}>
                            <Trash2 className="size-3.5" />
                          </RowAction>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hidden entirely when everything fits: a pager under three rows is
          furniture, and "Showing 1–3 of 3" beside page buttons that do
          nothing is what made the old one read as broken. */}
      {(paged && rows.length > pageSize) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--edge)] px-3 py-2.5 text-[11.5px] text-muted-foreground">
          {/* States the range AND the total — "page 2 of 16" alone does not
              tell you how much data there is. */}
          <span>
            Showing{" "}
            <span className="font-mono text-[11px] tabular-nums">
              {from + 1}–{Math.min(from + pageSize, rows.length)}
            </span>{" "}
            of <span className="font-mono text-[11px] tabular-nums">{total ?? rows.length}</span>
          </span>

          <span className="flex items-center gap-0.5">
            <PageBtn disabled={current === 1} onClick={() => setPage(current - 1)} label="Previous page">
              ‹
            </PageBtn>
            {pageNumbers.map((n, i) =>
              n === null ? (
                <span key={`gap-${i}`} className="px-1.5 font-mono text-[11px]">
                  …
                </span>
              ) : (
                <PageBtn
                  key={n}
                  active={n === current}
                  onClick={() => setPage(n)}
                  label={`Page ${n}`}
                >
                  {n}
                </PageBtn>
              ),
            )}
            <PageBtn
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
              label="Next page"
            >
              ›
            </PageBtn>
          </span>

          <label className="flex items-center gap-1.5">
            Rows
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                /* Back to the first page: page 7 of a 10-per-page table does
                   not exist once it is 50 per page. */
                setPage(1);
              }}
              aria-label="Rows per page"
              className="h-[26px] rounded-sm bg-muted px-1.5 font-mono text-[11px] tabular-nums text-foreground shadow-[0_0_0_1px_var(--edge)] outline-none focus-visible:shadow-[0_0_0_1px_var(--brand-edge)]"
            >
              {[10, 25, 50, 100].map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

    </div>
  );
}

function RowAction({
  children,
  label,
  destructive,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  destructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex size-[26px] items-center justify-center rounded-sm text-muted-foreground transition-colors",
        destructive ? "hover:bg-muted hover:text-destructive" : "hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function PageBtn({
  children,
  active,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-sm px-1.5 font-mono text-[11px] tabular-nums transition-colors",
        active
          ? "bg-brand font-semibold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-40",
      )}
    >
      {children}
    </button>
  );
}

/* Which page numbers to show, and where the gaps go.
 *
 * Always the first and last page, plus a window around the current one, so the
 * ends stay reachable from anywhere in a long table. `null` is a gap.
 *
 * The elision only appears when it saves something: at seven pages or fewer
 * the full list is narrower than "1 … 4 … 9" would be, so it just renders
 * them all rather than hiding two numbers behind an ellipsis to save no space.
 */
function elide(current: number, count: number): (number | null)[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);

  const pages = new Set([1, count, current, current - 1, current + 1]);
  const sorted = [...pages].filter(n => n >= 1 && n <= count).sort((a, b) => a - b);

  const out: (number | null)[] = [];
  let previous = 0;
  for (const n of sorted) {
    /* A gap of exactly one page renders as that page — "1 … 3" is wider than
       "1 2 3" and tells the reader less. */
    if (n - previous === 2) out.push(n - 1);
    else if (n - previous > 2) out.push(null);
    out.push(n);
    previous = n;
  }
  return out;
}

/* The two-line identity cell — the most repeated cell in the app. Appears on
   Players, Partner Apps, Transactions and both Applications tabs. */
export function IdentityCell({
  initials,
  name,
  sub,
}: {
  initials: string;
  name: string;
  sub: string;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[9.5px] font-semibold text-muted-foreground">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold leading-tight">{name}</span>
        <span className="mt-px block truncate text-[11px] leading-snug text-muted-foreground">
          {sub}
        </span>
      </span>
    </span>
  );
}
