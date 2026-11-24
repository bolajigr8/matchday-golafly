"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DELETE_NOTICE, WRITE_NOTICE } from "@/features/admin/notices";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import type { Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { FormSheet, type FormSection } from "@/components/admin/form-sheet";
import { ProgramForm } from "@/components/admin/forms/program-form";
import { RichText } from "@/components/admin/rich-text";
import { FileLink, MediaGallery, MediaThumb } from "@/components/admin/media";
import { normalizeMediaUrl } from "@/lib/media";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import { useAdminProgramCategories, useAdminPrograms, useDeleteProgram } from "@/features/admin/hooks";
import type { Program, ProgramCategory } from "@/services/programs";
import { Routes } from "@/routes";

const asDate = (iso: string | null) => (iso ? iso.slice(0, 10) : null);

const dateRange = (p: Program) => {
  const start = asDate(p.start_date);
  const end = asDate(p.end_date);
  if (!start && !end) return "—";
  if (start && end) return `${start} → ${end}`;
  return start ?? end ?? "—";
};

const PROGRAM_COLUMNS: Column<Program>[] = [
  {
    key: "title",
    label: "Title",
    render: p => (
      <Link href={Routes.adminProgram(p.id)} className="font-semibold hover:underline">
        {p.title}
      </Link>
    ),
  },
  { key: "subcategory", label: "Subcategory", render: p => p.program_subcategory?.name ?? "—" },
  { key: "dates", label: "Dates", numeric: true, render: p => dateRange(p) },
  {
    key: "spots",
    label: "Spots",
    numeric: true,
    nowrap: true,
    render: p => (p.spot ? p.availability ?? `${p.spot_left ?? 0}/${p.spot} left` : "—"),
  },
  {
    key: "status",
    label: "Status",
    nowrap: true,
    render: p => <StatusPill label={p.status ? "Published" : "Draft"} />,
  },
];

const CATEGORY_COLUMNS: Column<ProgramCategory>[] = [
  { key: "id", label: "ID", numeric: true, render: c => String(c.id) },
  { key: "name", label: "Name", render: c => <span className="font-semibold">{c.name}</span> },
  {
    key: "slug",
    label: "Slug",
    render: c => <span className="font-mono text-[11px] text-muted-foreground">{c.slug}</span>,
  },
];

const PROGRAM_CATEGORY_FORM: FormSection[] = [
  {
    title: "Category",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", required: true },
    ],
  },
];

type Tab = "programs" | "categories";

export default function ProgramsClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const { openNav } = useAdminNav();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "programs";

  /* Search resets across tabs — a query typed against programs is meaningless
     against categories. */

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Programs", tab === "programs" ? "Programs" : "Categories"]}
        title="Programs"
        tabs={[
          {
            label: "Categories",
            href: Routes.adminWithTab(Routes.adminPrograms, "categories"),
            active: tab === "categories",
          },
          { label: "Programs", href: Routes.adminPrograms, active: tab === "programs" },
        ]}
        action={
          <AdminButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            {tab === "categories" ? "New category" : "New program"}
          </AdminButton>
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {tab === "programs" ? (
          <ProgramsTab onCreate={() => setCreateOpen(true)} />
        ) : (
          <CategoriesTab onCreate={() => setCreateOpen(true)} />
        )}
      </div>

      {createOpen &&
        (tab === "categories" ? (
          <FormSheet
            title="New category"
            sections={PROGRAM_CATEGORY_FORM}
            submitLabel="Create"
            notice={WRITE_NOTICE}
            onClose={() => setCreateOpen(false)}
          />
        ) : (
          <ProgramForm onClose={() => setCreateOpen(false)} />
        ))}
    </>
  );
}

function ProgramsTab({ onCreate }: { onCreate: () => void }) {
  /* View and edit are separate sheets on purpose — opening a form when
     someone asked to look is how accidental edits happen. */
  const [viewing, setViewing] = useState<Program | null>(null);
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleting, setDeleting] = useState<Program | null>(null);
  const query = useAdminPrograms();
  const deleteProgram = useDeleteProgram();
  const rows = query.data?.data ?? [];

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={PROGRAM_COLUMNS}
        rowKey={p => String(p.id)}
        endpoint="/v1/program"
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
        emptyTitle="No programs yet"
        emptyBody="Programs appear here once they are created under a subcategory."
        emptyAction={
          <AdminButton onClick={onCreate}>
            <Plus className="size-3.5" />
            New program
          </AdminButton>
        }
      />

      {viewing && (() => { const row = viewing; return (
        <DetailSheet title={row.title} subtitle={row.program_subcategory?.name ?? ""} onClose={() => setViewing(null)}
          footer={<>
            <Link href={Routes.adminProgram(row.id)} className="inline-flex h-7 items-center rounded-full px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.09em] text-foreground shadow-[0_0_0_1px_var(--edge)] hover:bg-accent">Players &amp; spots</Link>
            <AdminButton size="sm" onClick={() => { setEditing(row); setViewing(null); }}>Edit</AdminButton>
          </>}>
          <SheetSection title="Program">
            <SheetFacts facts={[["Title", row.title], ["Slug", row.slug], ["Category", row.program_category?.name ?? "—"], ["Subcategory", row.program_subcategory?.name ?? "—"], ["Location", row.location || "—"], ["Season", row.season_label ?? "—"], ["Country", row.country_code ?? "—"], ["Starts", asDate(row.start_date) ?? "—"], ["Ends", asDate(row.end_date) ?? "—"], ["Deadline", asDate(row.deadline ?? null) ?? "—"], ["Price from", row.price_from ? `${row.price_currency} ${row.price_from}` : "—"], ["Badges", row.badges?.length ? row.badges.join(", ") : "—"], ["Highlights", row.highlights?.length ? row.highlights.join(", ") : "—"], ["Brochure", row.brochure_url ? "Attached" : "—"], ["Status", <StatusPill key="s" label={row.status ? "Published" : "Draft"} />]]} />
          </SheetSection>

          {/* No `typeof === "string"` guard: the API returns these either as an
              HTML string or as { html }, and the guard was silently dropping
              the object form. RichText handles both, and renders the markup
              instead of printing tags. */}
          <SheetSection title="Description">
            <RichText value={row.description} />
          </SheetSection>

          <SheetSection title="Inclusions">
            <RichText value={row.inclusions} />
          </SheetSection>

          {row.highlights && row.highlights.length > 0 && (
            <SheetSection title="Highlights">
              <ul className="admin-rich">
                {row.highlights.map(h => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </SheetSection>
          )}

          <SheetSection title="Media">
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <MediaThumb url={row.hero_image} label="Hero" />
                <MediaThumb url={row.icon_image} label="Icon" ratio="square" />
              </div>
              <MediaThumb url={row.banner_url} label="Banner" />
              <MediaGallery urls={row.gallery} label="Gallery" />
              {/* One video, not a gallery — the API field is a single
                  `testimonial_video_url`. */}
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Testimonial video
                </span>
                {row.testimonial_video_url ? (
                  <div className="overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_var(--edge)]">
                    <video
                      src={normalizeMediaUrl(row.testimonial_video_url)}
                      controls
                      preload="metadata"
                      playsInline
                      className="w-full"
                    />
                  </div>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
                    Not set
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Brochure
                </span>
                <FileLink url={row.brochure_url} />
              </div>
            </div>
          </SheetSection>

          {row.details && Object.keys(row.details).length > 0 && (
            <SheetSection title="Custom details">
              {/* stacked: these keys are whatever the author typed, not our
                  own fixed labels, so they don't fit a 104px column. */}
              <SheetFacts
                stacked
                facts={Object.entries(row.details).map(([k, v]) => [
                  k,
                  Array.isArray(v) ? v.join(", ") : String(v),
                ])}
              />
            </SheetSection>
          )}
        </DetailSheet>
      ); })()}

      {editing && <ProgramForm program={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this program?"
          body={<><b className="font-semibold text-foreground">{deleting.title}</b> would be permanently removed. This cannot be undone.</>}
          confirmLabel="Delete program"
          onCancel={() => setDeleting(null)}
          onConfirm={() => deleteProgram.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
        />
      )}
    </>
  );
}

function CategoriesTab({ onCreate }: { onCreate: () => void }) {
  /* View and edit are separate sheets on purpose — opening a form when
     someone asked to look is how accidental edits happen. */
  const [viewing, setViewing] = useState<ProgramCategory | null>(null);
  const [editing, setEditing] = useState<ProgramCategory | null>(null);
  const [deleting, setDeleting] = useState<ProgramCategory | null>(null);
  const query = useAdminProgramCategories();
  const rows = query.data?.data ?? [];

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={CATEGORY_COLUMNS}
        rowKey={c => String(c.id)}
        endpoint="/v1/program/categories"
        emptyTitle="No program categories yet"
        emptyBody="Categories are the top level of the program tree — Football Tourism, Player Management, Sports Marketing."
      />

      {viewing && (() => { const row = viewing; return (
        <DetailSheet title={row.name} subtitle={row.slug} onClose={() => setViewing(null)}
          footer={<AdminButton size="sm" onClick={() => { setEditing(row); setViewing(null); }}>Edit</AdminButton>}>
          <SheetSection title="Category">
            <SheetFacts facts={[["ID", String(row.id)], ["Name", row.name], ["Slug", row.slug]]} />
          </SheetSection>
        </DetailSheet>
      ); })()}

      {editing && (() => { const row = editing; return (
        <FormSheet title={`Edit ${row.name}`} sections={PROGRAM_CATEGORY_FORM} submitLabel="Save changes"
          initialValues={row as unknown as Record<string, unknown>}
          notice={WRITE_NOTICE} onClose={() => setEditing(null)} />
      ); })()}

      {deleting && (
        <ConfirmDialog
          title="Delete this category?"
          body={<><b className="font-semibold text-foreground">{deleting.name}</b> would be permanently removed. This cannot be undone.</>}
          confirmLabel="Delete category"
          onCancel={() => setDeleting(null)}
          onConfirm={() => { toast("Delete isn’t wired yet", { description: DELETE_NOTICE }); setDeleting(null); }}
        />
      )}
    </>
  );
}
