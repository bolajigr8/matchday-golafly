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
import { FormSheet, type FormSection } from "@/components/admin/form-sheet";
import { OfferForm } from "@/components/admin/forms/offer-form";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import {
  useAdminApplications,
  useAdminOfferCategories,
  useAdminOffers,
} from "@/features/admin/hooks";
import type { Offer, OfferCategory } from "@/services/offers";
import type { Application } from "@/services/applications";
import { Routes } from "@/routes";

const asDate = (iso: string | null) => (iso ? iso.slice(0, 10) : "—");

const OFFER_COLUMNS: Column<Offer>[] = [
  { key: "title", label: "Title", render: o => <span className="font-semibold">{o.title}</span> },
  { key: "category", label: "Category", render: o => o.category_slug ?? "—" },
  { key: "deadline", label: "Deadline", numeric: true, render: o => asDate(o.deadline) },
  {
    key: "status",
    label: "Status",
    nowrap: true,
    /* The API models status as a boolean, not a string — map it here rather
       than teaching StatusPill about booleans. */
    render: o => <StatusPill label={o.status ? "Active" : "Inactive"} />,
  },
];

const CATEGORY_COLUMNS: Column<OfferCategory>[] = [
  { key: "id", label: "ID", numeric: true, render: c => String(c.id) },
  { key: "name", label: "Name", render: c => <span className="font-semibold">{c.name}</span> },
  {
    key: "slug",
    label: "Slug",
    render: c => <span className="font-mono text-[11px] text-muted-foreground">{c.slug}</span>,
  },
  {
    key: "status",
    label: "Status",
    nowrap: true,
    render: c => <StatusPill label={c.status ? "Active" : "Inactive"} />,
  },
];

/* An application's useful fields live inside an untyped `payload` whose shape
   differs per offer category, so read defensively rather than asserting. */
const applicantName = (a: Application) => {
  const p = a.payload as Record<string, unknown>;
  const first = typeof p?.first_name === "string" ? p.first_name : "";
  const last = typeof p?.last_name === "string" ? p.last_name : "";
  const full = typeof p?.full_name === "string" ? p.full_name : "";
  const contact = typeof p?.contact_name === "string" ? p.contact_name : "";
  return [first, last].filter(Boolean).join(" ") || full || contact || "—";
};
const applicantEmail = (a: Application) => {
  const p = a.payload as Record<string, unknown>;
  return typeof p?.email === "string" ? p.email : "—";
};

const APPLICATION_COLUMNS: Column<Application>[] = [
  {
    key: "candidate",
    label: "Candidate",
    render: a => (
      <span className="min-w-0">
        <span className="block truncate font-semibold leading-tight">{applicantName(a)}</span>
        <span className="mt-px block truncate text-[11px] text-muted-foreground">
          {applicantEmail(a)}
        </span>
      </span>
    ),
  },
  { key: "offer", label: "Target offer", render: a => a.offer?.title ?? "—" },
  { key: "category", label: "Category", render: a => a.offer_category_slug ?? "—" },
  { key: "date", label: "Date", numeric: true, render: a => asDate(a.created_at) },
  { key: "status", label: "Status", nowrap: true, render: a => <StatusPill label={a.status} /> },
];

const OFFER_CATEGORY_FORM: FormSection[] = [
  {
    title: "Category",
    fields: [
      { name: "name", label: "Name", kind: "text", required: true },
      { name: "slug", label: "Slug", kind: "text", disabled: true, help: "Generated from the name. Changing it would break public URLs." },
      { name: "status", label: "Status", kind: "switch", onLabel: "Active", offLabel: "Inactive" },
    ],
  },
];

type Tab = "overview" | "categories" | "applications";

export default function OffersClient() {
  const [createOpen, setCreateOpen] = useState(false);
  const { openNav } = useAdminNav();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";

  /* Search resets when the tab changes — a query typed against offers is
     meaningless against categories. */

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Offers", tab === "overview" ? "Overview" : tab]}
        title="Offers"
        tabs={[
          { label: "Overview", href: Routes.adminOffers, active: tab === "overview" },
          {
            label: "Categories",
            href: Routes.adminWithTab(Routes.adminOffers, "categories"),
            active: tab === "categories",
          },
          {
            label: "Applications",
            href: Routes.adminWithTab(Routes.adminOffers, "applications"),
            active: tab === "applications",
          },
        ]}
        action={
          tab !== "applications" ? (
            <AdminButton onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" />
              {tab === "categories" ? "New category" : "New offer"}
            </AdminButton>
          ) : undefined
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {tab === "overview" && <OffersTab onCreate={() => setCreateOpen(true)} />}
        {tab === "categories" && <CategoriesTab onCreate={() => setCreateOpen(true)} />}
        {tab === "applications" && <ApplicationsTab />}
      </div>

      {createOpen &&
        (tab === "categories" ? (
          <FormSheet
            title="New category"
            sections={OFFER_CATEGORY_FORM}
            submitLabel="Create"
            notice={WRITE_NOTICE}
            onClose={() => setCreateOpen(false)}
          />
        ) : (
          <OfferForm onClose={() => setCreateOpen(false)} />
        ))}
    </>
  );
}

function OffersTab({ onCreate }: { onCreate: () => void }) {
  /* View and edit are separate sheets on purpose — opening a form when
     someone asked to look is how accidental edits happen. */
  const [viewing, setViewing] = useState<Offer | null>(null);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);
  const query = useAdminOffers();
  const rows = query.data?.data ?? [];

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={OFFER_COLUMNS}
        rowKey={o => String(o.id)}
        endpoint="/v1/offers"
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
        emptyTitle="No offers yet"
        emptyBody="Create an offer to start collecting candidate applications."
        emptyAction={
          <AdminButton onClick={onCreate}>
            <Plus className="size-3.5" />
            New offer
          </AdminButton>
        }
      />

      {viewing && (() => { const row = viewing; return (
        <DetailSheet title={row.title} subtitle={row.category_slug ?? ""} onClose={() => setViewing(null)}
          footer={<AdminButton size="sm" onClick={() => { setEditing(row); setViewing(null); }}>Edit</AdminButton>}>
          <SheetSection title="Offer">
            <SheetFacts facts={[["Title", row.title], ["Category", row.category_slug ?? "—"], ["Slug", row.slug], ["Deadline", asDate(row.deadline)], ["Price from", row.price_from ?? "—"], ["Currency", row.price_currency], ["Status", <StatusPill key="s" label={row.status ? "Active" : "Inactive"} />]]} />
          </SheetSection>
        </DetailSheet>
      ); })()}

      {editing && <OfferForm offer={editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          title="Delete this offer?"
          body={
            <>
              <b className="font-semibold text-foreground">{deleting.title}</b> and its candidate
              applications would be permanently removed. This cannot be undone.
            </>
          }
          confirmLabel="Delete offer"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            toast("Delete isn’t wired yet", { description: DELETE_NOTICE });
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function CategoriesTab({ onCreate }: { onCreate: () => void }) {
  /* View and edit are separate sheets on purpose — opening a form when
     someone asked to look is how accidental edits happen. */
  const [viewing, setViewing] = useState<OfferCategory | null>(null);
  const [editing, setEditing] = useState<OfferCategory | null>(null);
  const [deleting, setDeleting] = useState<OfferCategory | null>(null);
  const query = useAdminOfferCategories();
  const rows = query.data?.data ?? [];

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={CATEGORY_COLUMNS}
        rowKey={c => String(c.id)}
        endpoint="/v1/offer-categories"
        onView={setViewing}
        onEdit={setEditing}
        onDelete={setDeleting}
        emptyTitle="No offer categories yet"
        emptyBody="Categories group offers on the public site and drive the application forms."
        emptyAction={
          <AdminButton onClick={onCreate}>
            <Plus className="size-3.5" />
            New category
          </AdminButton>
        }
      />

      {viewing && (() => { const row = viewing; return (
        <DetailSheet title={row.name} subtitle={row.slug} onClose={() => setViewing(null)}
          footer={<AdminButton size="sm" onClick={() => { setEditing(row); setViewing(null); }}>Edit</AdminButton>}>
          <SheetSection title="Category">
            <SheetFacts facts={[["ID", String(row.id)], ["Name", row.name], ["Slug", row.slug], ["Status", <StatusPill key="s" label={row.status ? "Active" : "Inactive"} />]]} />
          </SheetSection>
        </DetailSheet>
      ); })()}

      {editing && (() => { const row = editing; return (
        <FormSheet title={`Edit ${row.name}`} sections={OFFER_CATEGORY_FORM} submitLabel="Save changes"
          initialValues={row as unknown as Record<string, unknown>}
          notice={WRITE_NOTICE} onClose={() => setEditing(null)} />
      ); })()}

      {deleting && (
        <ConfirmDialog
          title="Delete this category?"
          body={
            <>
              <b className="font-semibold text-foreground">{deleting.name}</b> would be removed.
              Offers using it would need reassigning.
            </>
          }
          confirmLabel="Delete category"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            toast("Delete isn’t wired yet", { description: DELETE_NOTICE });
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function ApplicationsTab() {
  const query = useAdminApplications();
  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={APPLICATION_COLUMNS}
        rowKey={a => String(a.id)}
        endpoint="/v1/applications"
        emptyTitle="No applications yet"
        emptyBody="Candidate applications against your offers land here."
      />
    </>
  );
}
