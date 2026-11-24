"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { QueryTable } from "@/components/admin/query-table";
import { useAdminInternships, useDeleteInternship } from "@/features/admin/hooks";
import { applicantPhone, type InternshipApplication } from "@/services/internships-admin";
import { cn } from "@/lib/utils";

/* Internship applications from /internship/apply — GET /v1/internships.
 * A table with a position filter, a detail sheet with the CV, and delete. */

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

const asDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "—");
const dash = (v?: string | null) => (v && v.trim() ? v : "—");

const COLUMNS: Column<InternshipApplication>[] = [
  {
    key: "applicant",
    label: "Applicant",
    width: "240px",
    render: a => <IdentityCell initials={initials(a.full_name)} name={a.full_name} sub={a.email} />,
  },
  {
    key: "position",
    label: "Position",
    nowrap: true,
    render: a => (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold shadow-[0_0_0_1px_var(--edge)]">
        {dash(a.position)}
      </span>
    ),
  },
  { key: "university", label: "University", truncate: true, width: "200px", render: a => dash(a.university) },
  { key: "year", label: "Year", nowrap: true, render: a => dash(a.year_of_study) },
  { key: "start", label: "Earliest start", numeric: true, render: a => asDate(a.earliest_start_date) },
  { key: "country", label: "Country", render: a => dash(a.country_of_residence) },
  { key: "applied", label: "Applied", numeric: true, render: a => asDate(a.created_at) },
];

export default function InternshipsClient() {
  const { openNav } = useAdminNav();
  const query = useAdminInternships();
  const remove = useDeleteInternship();
  const all = useMemo(() => query.data?.data ?? [], [query.data]);

  const [position, setPosition] = useState<string>("all");
  const [viewing, setViewing] = useState<InternshipApplication | null>(null);
  const [deleting, setDeleting] = useState<InternshipApplication | null>(null);

  // Position chips come from the applications themselves, with counts.
  const positions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of all) {
      const key = a.position || "Unspecified";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const filtered = position === "all" ? all : all.filter(a => (a.position || "Unspecified") === position);

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Internships"]}
        title="Internships"
        stats={[
          { label: `${all.length} application${all.length === 1 ? "" : "s"}` },
          ...positions.slice(0, 3).map(([name, n]) => ({ label: `${n} ${name}`, tone: "var(--status-info)" })),
        ]}
        onOpenNav={openNav}
      />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]">
        {positions.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {[["all", all.length] as [string, number], ...positions].map(([name, n]) => (
              <button
                key={name}
                type="button"
                onClick={() => setPosition(name)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
                  position === name
                    ? "bg-brand text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
                    : "text-muted-foreground shadow-[0_0_0_1px_var(--edge)] hover:text-foreground",
                )}
              >
                {name === "all" ? "All" : name}
                <span className="font-mono text-[10px] opacity-70">{n}</span>
              </button>
            ))}
          </div>
        )}

        <QueryTable
          query={query}
          select={() => filtered}
          columns={COLUMNS}
          rowKey={a => String(a.id)}
          endpoint="/v1/internships"
          onView={setViewing}
          onDelete={setDeleting}
          emptyTitle="No internship applications yet"
          emptyBody="Applications sent from the Golafly Internship page (/internship/apply) appear here."
        />
      </div>

      {viewing && (
        <DetailSheet
          title={viewing.full_name}
          subtitle={`${dash(viewing.position)} · applied ${asDate(viewing.created_at)}`}
          onClose={() => setViewing(null)}
          footer={
            <>
              <AdminButton variant="ghost" size="sm" onClick={() => { setDeleting(viewing); setViewing(null); }}>
                Delete
              </AdminButton>
              {viewing.cv_url && (
                <a
                  href={viewing.cv_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-7 items-center gap-1.5 rounded-full bg-brand px-2.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.09em] text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
                >
                  <Download className="size-3" />
                  Download CV
                </a>
              )}
            </>
          }
        >
          <SheetSection title="Applicant">
            <SheetFacts
              facts={[
                ["Name", viewing.full_name],
                ["Email", viewing.email],
                ["Phone", applicantPhone(viewing)],
                ["Country", dash(viewing.country_of_residence)],
              ]}
            />
          </SheetSection>

          <SheetSection title="Study">
            <SheetFacts
              facts={[
                ["University", dash(viewing.university)],
                ["Course", dash(viewing.course_of_study)],
                ["Year", dash(viewing.year_of_study)],
              ]}
            />
          </SheetSection>

          <SheetSection title="Application">
            <SheetFacts
              facts={[
                ["Position", dash(viewing.position)],
                ["Earliest start", asDate(viewing.earliest_start_date)],
                [
                  "LinkedIn / portfolio",
                  viewing.linkedin_or_portfolio ? (
                    <a
                      key="l"
                      href={viewing.linkedin_or_portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 break-all text-brand-text hover:underline"
                    >
                      {viewing.linkedin_or_portfolio}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    "—"
                  ),
                ],
                ["Consent", viewing.consent_accepted ? "Accepted" : "Not given"],
                ["Applied", asDate(viewing.created_at)],
              ]}
            />
          </SheetSection>

          <SheetSection title="Why this track">
            <p className="m-0 whitespace-pre-line text-[12.5px] leading-relaxed text-foreground">
              {dash(viewing.why_this_track)}
            </p>
          </SheetSection>

          <SheetSection title="CV">
            {viewing.cv_url ? (
              <a
                href={viewing.cv_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-[12px] text-foreground shadow-[0_0_0_1px_var(--edge)] hover:bg-muted"
              >
                <Download className="size-3.5 shrink-0 text-brand-text" />
                <span className="min-w-0 truncate">{viewing.cv_original_name || "CV"}</span>
              </a>
            ) : (
              <p className="m-0 text-[12px] text-muted-foreground">No CV attached.</p>
            )}
          </SheetSection>
        </DetailSheet>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this application?"
          body={
            <>
              <b className="font-semibold text-foreground">{deleting.full_name}</b>’s application for{" "}
              {dash(deleting.position)} will be permanently deleted, including their CV.
            </>
          }
          confirmLabel="Delete application"
          onCancel={() => setDeleting(null)}
          onConfirm={() => remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
        />
      )}
    </>
  );
}
