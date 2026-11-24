"use client";

import { useState } from "react";
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
import { AcademyForm } from "@/components/admin/forms/academy-form";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import { UnavailableTab } from "@/components/admin/unavailable-tab";
import { useAdminAcademies } from "@/features/admin/hooks";
import { academyFeatures, type Academy } from "@/services/academy";
import { Routes } from "@/routes";

const COLUMNS: Column<Academy>[] = [
  { key: "name", label: "Academy", render: a => <span className="font-semibold">{a.name}</span> },
  {
    key: "location",
    label: "Location",
    render: a => [a.city, a.country_name].filter(Boolean).join(", ") || "—",
  },
  {
    key: "age",
    label: "Age range",
    nowrap: true,
    render: a => (a.age_min && a.age_max ? `${a.age_min}–${a.age_max}` : "All ages"),
  },
  {
    key: "price",
    label: "Price",
    numeric: true,
    render: a =>
      a.price_from ? `${a.price_currency === "EUR" ? "€" : ""} ${a.price_from}` : "—",
  },
  {
    key: "status",
    label: "Status",
    nowrap: true,
    render: a => <StatusPill label={a.status ? "Active" : "Inactive"} />,
  },
];

type Tab = "overview" | "entry";

export default function AcademyClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const { openNav } = useAdminNav();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Academy", tab === "overview" ? "Overview" : "Registrations"]}
        title="Academy"
        tabs={[
          { label: "Overview", href: Routes.adminAcademy, active: tab === "overview" },
          {
            label: "Registrations",
            href: Routes.adminWithTab(Routes.adminAcademy, "entry"),
            active: tab === "entry",
          },
        ]}
        action={
          tab === "overview" ? (
            <AdminButton onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              New academy
            </AdminButton>
          ) : undefined
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {tab === "overview" ? (
          <AcademiesTab onCreate={() => setCreateOpen(true)} />
        ) : (
          /* The backend has no list-all-entries route: /v1/academies/entries
             and its siblings answer 405 (the path exists, GET is not allowed).
             Entries are only reachable one at a time by checkout session. An
             empty table here would imply "no registrations", which is a
             different and possibly false claim. */
          <UnavailableTab
            what="Registrations"
            detail="The API has no endpoint that lists academy entries — GET on /v1/academies/entries returns 405. Entries are currently only retrievable one at a time by checkout session. This tab needs a backend route before it can be built."
          />
        )}
      </div>

      {createOpen && <AcademyForm onClose={() => setCreateOpen(false)} />}
    </>
  );
}

function AcademiesTab({ onCreate }: { onCreate: () => void }) {
  /* View and edit are separate sheets on purpose — opening a form when
     someone asked to look is how accidental edits happen. */
  const [viewing, setViewing] = useState<Academy | null>(null);
  const [editing, setEditing] = useState<Academy | null>(null);
  const [deleting, setDeleting] = useState<Academy | null>(null);
  const query = useAdminAcademies();
  const rows = query.data?.data ?? [];

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={COLUMNS}
        rowKey={a => String(a.id)}
        endpoint="/v1/academies"
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
        emptyTitle="No academies yet"
        emptyBody="Create an academy to open an intake window and take registrations."
        emptyAction={
          <AdminButton onClick={onCreate}>
            <Plus className="size-3.5" />
            New academy
          </AdminButton>
        }
      />

      {viewing && (() => { const row = viewing; return (
        <DetailSheet title={row.name} subtitle={[row.city, row.country_name].filter(Boolean).join(", ")} onClose={() => setViewing(null)}
          footer={<AdminButton size="sm" onClick={() => { setEditing(row); setViewing(null); }}>Edit</AdminButton>}>
          <SheetSection title="Academy">
            <SheetFacts facts={[["Name", row.name], ["City", row.city ?? "—"], ["Country", row.country_name ?? "—"], ["Age range", row.age_min && row.age_max ? `${row.age_min}–${row.age_max}` : "All ages"], ["Price from", row.price_from ?? "—"], ["Status", <StatusPill key="s" label={row.status ? "Active" : "Inactive"} />]]} />
          </SheetSection>
        </DetailSheet>
      ); })()}

      {editing && <AcademyForm academy={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this academy?"
          body={<><b className="font-semibold text-foreground">{deleting.name}</b> would be permanently removed. This cannot be undone.</>}
          confirmLabel="Delete academy"
          onCancel={() => setDeleting(null)}
          onConfirm={() => { toast("Delete isn’t wired yet", { description: DELETE_NOTICE }); setDeleting(null); }}
        />
      )}
    </>
  );
}
