"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { FormSheet, type FormSection } from "@/components/admin/form-sheet";
import { QueryTable } from "@/components/admin/query-table";
import { StatusPill, type StatusTone } from "@/components/admin/status-pill";
import {
  useAdminMerchant,
  useAdminMerchants,
  useApproveMerchant,
  useCreateMerchant,
  useDisableMerchant,
} from "@/features/admin/hooks";
import type { ApiMerchant, MerchantDocumentKey, MerchantStatus } from "@/services/merchants-admin";
import { cn } from "@/lib/utils";

/* Golafly API merchants — the businesses selling flights and eSIMs through
 * the API (golafly-merchant). GET /v1/merchant for the table, GET
 * /v1/merchant/{id} for the sheet, POST …/approve and …/disable from the
 * sheet, and POST /v1/merchant to add one (created approved and verified). */

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase();

const asDate = (iso?: string | null) => (iso ? iso.slice(0, 10) : "—");
const dash = (v?: string | null) => (v && String(v).trim() ? String(v) : "—");

const money = (value: string, currency: string) => {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return "—";
  try {
    return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString("en-GB")}`;
  }
};

const STATUS: Record<MerchantStatus, { label: string; tone: StatusTone }> = {
  pending: { label: "Pending review", tone: "warn" },
  approved: { label: "Approved", tone: "good" },
  disabled: { label: "Disabled", tone: "danger" },
};

const statusPill = (m: ApiMerchant) => (
  <StatusPill label={STATUS[m.status]?.label ?? m.status} tone={STATUS[m.status]?.tone} />
);

const DOCUMENTS: [MerchantDocumentKey, string][] = [
  ["cac_certificate", "CAC certificate"],
  ["cac_status_report", "CAC status report"],
  ["director_id", "Director’s ID"],
  ["utility_bill", "Utility bill"],
  ["bank_statement", "Bank statement"],
  ["tin_certificate", "TIN certificate"],
  ["iata_licence", "IATA / NANTA licence"],
];

const COLUMNS: Column<ApiMerchant>[] = [
  {
    key: "business",
    label: "Business",
    width: "240px",
    render: m => <IdentityCell initials={initials(m.business_name)} name={m.business_name} sub={m.partner_code} />,
  },
  { key: "owner", label: "Owner", truncate: true, width: "200px", render: m => dash(m.owner?.name) },
  { key: "email", label: "Email", truncate: true, width: "220px", render: m => dash(m.owner?.email) },
  { key: "status", label: "Status", nowrap: true, render: statusPill },
  {
    key: "mode",
    label: "Mode",
    nowrap: true,
    render: m => (m.setting?.environment === "live" ? "Live" : "Test"),
  },
  { key: "balance", label: "Live balance", numeric: true, render: m => money(m.balance, m.currency) },
  { key: "created", label: "Joined", numeric: true, render: m => asDate(m.created_at) },
];

const MERCHANT_FORM: FormSection[] = [
  {
    title: "Owner",
    fields: [
      { name: "name", label: "Full name", kind: "text", required: true, half: true },
      {
        name: "email",
        label: "Email",
        kind: "text",
        required: true,
        half: true,
        help: "They sign in to the merchant portal with this.",
      },
      {
        name: "password",
        label: "Temporary password",
        kind: "text",
        required: true,
        help: "At least 8 characters. Share it with them; they can reset it from the sign-in page.",
      },
      { name: "phone", label: "Phone", kind: "text", required: true, placeholder: "08012345678" },
    ],
  },
  {
    title: "Business",
    fields: [
      { name: "business_name", label: "Business name", kind: "text", required: true },
      { name: "business_address", label: "Business address", kind: "text", required: true },
    ],
  },
];

type Filter = "all" | MerchantStatus;

export default function MerchantsClient() {
  const { openNav } = useAdminNav();
  const query = useAdminMerchants();
  const create = useCreateMerchant();
  const all = useMemo(() => query.data?.data ?? [], [query.data]);

  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<MerchantStatus, number> = { pending: 0, approved: 0, disabled: 0 };
    for (const m of all) if (m.status in c) c[m.status] += 1;
    return c;
  }, [all]);

  const filtered = filter === "all" ? all : all.filter(m => m.status === filter);
  const viewingRow = all.find(m => m.id === viewingId);

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Merchants"]}
        title="Merchants"
        onOpenNav={openNav}
        stats={[
          { label: `${all.length} merchant${all.length === 1 ? "" : "s"}` },
          { label: `${counts.pending} pending`, tone: "var(--status-warn)" },
          { label: `${counts.approved} approved`, tone: "var(--status-good)" },
        ]}
        action={
          <AdminButton onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" />
            Add merchant
          </AdminButton>
        }
      />

      <div className="flex flex-1 flex-col gap-3 px-4 pb-5 pt-3 lg:px-[18px]">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All", all.length],
              ["pending", "Pending", counts.pending],
              ["approved", "Approved", counts.approved],
              ["disabled", "Disabled", counts.disabled],
            ] as [Filter, string, number][]
          ).map(([key, label, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11.5px] font-semibold transition-colors",
                filter === key
                  ? "bg-brand text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
                  : "text-muted-foreground shadow-[0_0_0_1px_var(--edge)] hover:text-foreground",
              )}
            >
              {label}
              <span className="font-mono text-[10px] opacity-70">{n}</span>
            </button>
          ))}
        </div>

        <QueryTable
          query={query}
          select={() => filtered}
          columns={COLUMNS}
          rowKey={m => String(m.id)}
          endpoint="/v1/merchant"
          selectedKey={viewingId != null ? String(viewingId) : null}
          onView={m => setViewingId(m.id)}
          emptyTitle="No merchants yet"
          emptyBody="Businesses that apply on the Golafly API merchant portal appear here for review. You can also add one."
          emptyAction={
            <AdminButton size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3" />
              Add merchant
            </AdminButton>
          }
        />
      </div>

      {createOpen && (
        <FormSheet
          title="New merchant"
          subtitle="Created approved, with the email already verified. They can sign in to the merchant portal straight away."
          sections={MERCHANT_FORM}
          submitLabel="Add merchant"
          onSubmit={values => {
            const text = (k: string) => String(values[k] ?? "").trim();
            create.mutate(
              {
                name: text("name"),
                email: text("email"),
                password: String(values.password ?? ""),
                password_confirmation: String(values.password ?? ""),
                business_name: text("business_name"),
                phone: text("phone"),
                business_address: text("business_address"),
              },
              { onSuccess: () => setCreateOpen(false) },
            );
          }}
          onClose={() => setCreateOpen(false)}
        />
      )}

      {viewingId != null && (
        <MerchantSheet id={viewingId} fallback={viewingRow} onClose={() => setViewingId(null)} />
      )}
    </>
  );
}

/* The sheet reads GET /v1/merchant/{id}, with the table's row on screen while
   it loads. Approve and disable seed that same cache entry, so the status here
   changes the moment the call returns. */
function MerchantSheet({
  id,
  fallback,
  onClose,
}: {
  id: number;
  fallback?: ApiMerchant;
  onClose: () => void;
}) {
  const detail = useAdminMerchant(id);
  const approve = useApproveMerchant();
  const disable = useDisableMerchant();
  const [confirmDisable, setConfirmDisable] = useState(false);
  const m = detail.data?.data ?? fallback;

  if (!m) return null;

  const busy = approve.isPending || disable.isPending;
  const s = m.setting;

  return (
    <>
      <DetailSheet
        title={m.business_name}
        subtitle={`${m.partner_code} · joined ${asDate(m.created_at)}`}
        onClose={onClose}
        footer={
          <>
            {m.status === "approved" ? (
              <AdminButton variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDisable(true)}>
                Disable
              </AdminButton>
            ) : (
              <AdminButton size="sm" disabled={busy} onClick={() => approve.mutate(m.id)}>
                {approve.isPending ? "Approving…" : m.status === "disabled" ? "Re-enable" : "Approve"}
              </AdminButton>
            )}
          </>
        }
      >
        <SheetSection title="Account">
          <SheetFacts
            facts={[
              ["Status", statusPill(m)],
              ["Partner code", m.partner_code],
              ["Mode", s?.environment === "live" ? "Live" : "Test"],
              ["Live balance", money(m.balance, m.currency)],
              ["Test balance", money(m.test_balance, m.currency)],
              ["Flight commission", s ? `${parseFloat(s.flight_commission_percent)}%` : "—"],
              ["eSIM commission", s ? `${parseFloat(s.esim_commission_percent)}%` : "—"],
            ]}
          />
        </SheetSection>

        <SheetSection title="Owner">
          <SheetFacts
            facts={[
              ["Name", dash(m.owner?.name)],
              ["Email", dash(m.owner?.email)],
              ["Email verified", m.owner?.email_verified_at ? asDate(m.owner.email_verified_at) : "Not yet"],
              ["Phone", dash(m.phone)],
            ]}
          />
        </SheetSection>

        <SheetSection title="Business">
          <SheetFacts
            facts={[
              ["Name", dash(m.business_name)],
              ["Address", dash(m.business_address)],
              ["City / State", [m.city, m.state].filter(Boolean).join(", ") || "—"],
              ["RC number", dash(m.rc_number)],
              ["CAC number", dash(m.cac_number)],
              ["Director", dash(m.director_name)],
              ["Director BVN", dash(m.director_bvn)],
              ["Website", dash(s?.website)],
            ]}
          />
        </SheetSection>

        <SheetSection title="Documents">
          <SheetFacts
            facts={DOCUMENTS.map(([key, label]) => {
              const doc = s?.documents?.[key];
              return [
                label,
                doc?.uploaded && doc.url ? (
                  <a
                    key={key}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-text hover:underline"
                  >
                    View
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : doc?.uploaded ? (
                  "Uploaded"
                ) : (
                  "Not uploaded"
                ),
              ];
            })}
          />
        </SheetSection>

        <SheetSection title="Integration">
          <SheetFacts
            facts={[
              ["Live URL", dash(m.base_url)],
              ["Sandbox URL", dash(m.test_url)],
              ["Webhook URL", dash(s?.webhook_url)],
              ["Webhook events", s?.webhook_events?.length ? s.webhook_events.join(", ") : "—"],
              ["Time zone", dash(s?.timezone)],
              ["Low-balance alert", s ? money(s.low_balance_alert_amount, m.currency) : "—"],
              ["Auto-pause at zero", s?.auto_pause_when_balance_zero ? "On" : "Off"],
              ["Two-factor", s?.two_factor_enabled ? "On" : "Off"],
            ]}
          />
        </SheetSection>
      </DetailSheet>

      {confirmDisable && (
        <ConfirmDialog
          title={`Disable ${m.business_name}?`}
          body="Their account is marked disabled and the merchant portal stops letting them in. Approve them again to restore it."
          confirmLabel="Disable merchant"
          onCancel={() => setConfirmDisable(false)}
          onConfirm={() => disable.mutate(m.id, { onSettled: () => setConfirmDisable(false) })}
        />
      )}
    </>
  );
}
