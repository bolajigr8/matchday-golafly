"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import { useAdminPartnerApplications } from "@/features/admin/hooks";
import { initialsFor } from "@/features/admin/session";
import type { AdminPartnerApplicationRecord } from "@/services/admin-resources";

const asDate = (iso: string) => (iso ? iso.slice(0, 10) : "—");

const COLUMNS: Column<AdminPartnerApplicationRecord>[] = [
  {
    key: "applicant",
    label: "Applicant",
    render: a => (
      <IdentityCell initials={initialsFor(a.full_name || a.email)} name={a.full_name || "—"} sub={a.email} />
    ),
  },
  { key: "country", label: "Country", render: a => a.country ?? "—" },
  { key: "role", label: "Role", render: a => a.role ?? "—" },
  { key: "applied", label: "Applied on", numeric: true, render: a => asDate(a.created_at) },
  { key: "status", label: "Status", render: a => <StatusPill label={a.status} /> },
];

export default function PartnerApplicationsClient() {
  const { openNav } = useAdminNav();
  const query = useAdminPartnerApplications();
  const [selected, setSelected] = useState<AdminPartnerApplicationRecord | null>(null);

  const rows = query.data?.data ?? [];
  const pending = rows.filter(a => a.status?.toLowerCase() === "pending").length;

  /* Read-only for now: the decision endpoint
     (PATCH /v1/program/scouting-partner-applications/{id}/status) exists but
     is not wired, so this reports rather than pretending to write. */
  const decide = (verdict: string) => {
    toast("Not wired yet", {
      description: `Accept/reject calls the status endpoint — ${verdict} is next.`,
    });
  };

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Partner applications"]}
        title="Partner applications"
        stats={[
          { label: `${pending} awaiting review`, tone: "var(--status-warn)" },
          { label: `${rows.length} total` },
        ]}
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        <QueryTable
          query={query}
          select={d => d.data}
          columns={COLUMNS}
          rowKey={a => String(a.id)}
          endpoint="/v1/program/scouting-partner-applications"
          emptyTitle="No partner applications yet"
          emptyBody="Scouting partner, academy and agency applications land here for review."
          selectedKey={selected ? String(selected.id) : null}
          onView={setSelected}
        />
      </div>

      {selected && (
        <DetailSheet
          title={selected.full_name || selected.email}
          subtitle={[selected.role, selected.country].filter(Boolean).join(" · ")}
          onClose={() => setSelected(null)}
          footer={
            <>
              <AdminButton variant="destructive" size="sm" onClick={() => decide("Reject")}>
                Reject
              </AdminButton>
              <AdminButton size="sm" onClick={() => decide("Accept")}>
                <Check className="size-3" />
                Accept
              </AdminButton>
            </>
          }
        >
          <SheetSection title="Applicant">
            <SheetFacts
              facts={[
                ["Email", selected.email],
                ["Phone", selected.phone ?? "—"],
                ["Country", selected.country ?? "—"],
                ["Role", selected.role ?? "—"],
                ["Experience", selected.years_of_experience ?? "—"],
                ["Applied on", asDate(selected.created_at)],
                ["Status", <StatusPill key="s" label={selected.status} />],
              ]}
            />
          </SheetSection>

          {selected.motivation && (
            <SheetSection title="Motivation">
              <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                {selected.motivation}
              </p>
            </SheetSection>
          )}
        </DetailSheet>
      )}
    </>
  );
}
