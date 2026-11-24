"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton } from "@/components/admin/admin-ui";
import { IdentityCell, type Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { DetailSheet, SheetFacts, SheetSection } from "@/components/admin/detail-sheet";
import { StatusPill } from "@/components/admin/status-pill";
import { useAdminTransactions } from "@/features/admin/hooks";
import { initialsFor } from "@/features/admin/session";
import { paidForName, type AdminTransactionRecord } from "@/services/admin-resources";

const asDate = (iso: string) => (iso ? iso.slice(0, 10) : "—");

/* Currency comes back split as amount + currency. Format once, here, so the
   column stays tabular and every screen shows money the same way. */
const money = (t: AdminTransactionRecord) => {
  const symbol = t.currency === "EUR" ? "€" : t.currency === "GBP" ? "£" : t.currency === "USD" ? "$" : "";
  const n = Number(t.amount);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : t.amount;
  return symbol ? `${symbol} ${formatted}` : `${formatted} ${t.currency}`;
};

const COLUMNS: Column<AdminTransactionRecord>[] = [
  {
    key: "customer",
    label: "Customer",
    render: t => (
      <IdentityCell initials={initialsFor(t.full_name || t.email)} name={t.full_name || "—"} sub={t.email} />
    ),
  },
  {
    key: "product",
    label: "Product",
    /* Name of the thing bought, with the category beneath it — "program"
       alone told you nothing about what was actually paid for. */
    render: t => (
      <span className="min-w-0">
        <span className="block truncate font-medium">{paidForName(t)}</span>
        <span className="block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
          {t.product_type}
        </span>
      </span>
    ),
  },
  { key: "amount", label: "Amount", numeric: true, render: t => money(t) },
  { key: "date", label: "Date", numeric: true, render: t => asDate(t.created_at) },
  { key: "status", label: "Status", render: t => <StatusPill label={t.payment_status} /> },
];

export default function TransactionsClient() {
  const { openNav } = useAdminNav();
  const query = useAdminTransactions();
  const [selected, setSelected] = useState<AdminTransactionRecord | null>(null);

  const rows = query.data?.data ?? [];
  const failed = rows.filter(t => t.payment_status === "failed").length;
  const collected = rows
    .filter(t => t.payment_status === "paid")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Transactions"]}
        title="Transactions"
        stats={[
          {
            label: `€${collected.toLocaleString("en-GB", { maximumFractionDigits: 0 })} collected`,
            tone: "var(--status-good)",
          },
          { label: `${failed} failed`, tone: "var(--destructive)" },
        ]}
        action={
          <AdminButton variant="outline" size="sm">
            <Download className="size-3" />
            Export
          </AdminButton>
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        <QueryTable
          query={query}
          select={d => d.data}
          columns={COLUMNS}
          rowKey={t => String(t.id)}
          endpoint="/v1/transactions"
          emptyTitle="No transactions yet"
          emptyBody="Payments appear here as soon as a checkout completes."
          selectedKey={selected ? String(selected.id) : null}
          onView={setSelected}
        />
      </div>

      {selected && (
        <DetailSheet
          title={selected.full_name || selected.email}
          subtitle={`${paidForName(selected)} · ${money(selected)}`}
          onClose={() => setSelected(null)}
        >
          <SheetSection title="Payment">
            <SheetFacts
              facts={[
                ["Reference", <span key="r" className="font-mono text-[11px]">#{selected.id}</span>],
                ["Email", selected.email],
                ["Product", paidForName(selected)],
                ["Type", selected.product_type],
                ["Amount", <span key="a" className="font-mono tabular-nums">{money(selected)}</span>],
                ["Method", selected.payment_method ?? "—"],
                ["Date", asDate(selected.created_at)],
                ["Status", <StatusPill key="s" label={selected.payment_status} />],
              ]}
            />
          </SheetSection>
        </DetailSheet>
      )}
    </>
  );
}
