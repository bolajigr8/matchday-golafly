"use client";

import { useState } from "react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminButton, Panel } from "@/components/admin/admin-ui";
import { SheetShell } from "@/components/admin/sheet-shell";
import { Field, FormSection, TextInput } from "@/components/admin/form-controls";
import {
  extractApiMessage,
  useAdminDiscounts,
  useCreateDiscount,
  useDeleteDiscount,
  useUpdateDiscount,
} from "@/features/admin/hooks";
import type { Discount } from "@/services/travel-admin";

function apiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const body = (
      err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      }
    ).response?.data;
    const firstFieldError = body?.errors ? Object.values(body.errors).flat()[0] : undefined;
    if (typeof firstFieldError === "string" && firstFieldError) return firstFieldError;
    if (body?.message) return body.message;
  }
  return extractApiMessage(err) || fallback;
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function formatExpiry(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    toast.success("Code copied");
  } catch {
    toast.error("Could not copy code");
  }
}

function CouponSheet({
  coupon,
  onClose,
}: {
  coupon?: Discount;
  onClose: () => void;
}) {
  const createCoupon = useCreateDiscount();
  const updateCoupon = useUpdateDiscount();
  const isEdit = coupon !== undefined;
  const [label, setLabel] = useState(coupon?.label ?? "");
  const [code, setCode] = useState(coupon?.code ?? "");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [days, setDays] = useState(coupon ? String(coupon.expires_in_days) : "14");
  const [error, setError] = useState<string | null>(null);

  const pending = createCoupon.isPending || updateCoupon.isPending;

  function submit() {
    const trimmedLabel = label.trim();
    const amount = Number(value);
    const expires = Number(days);
    if (!trimmedLabel) {
      setError("Label is required.");
      return;
    }
    if (code.trim() !== "" && !/^[A-Za-z0-9_-]+$/.test(code.trim())) {
      setError("Code can only use letters, numbers, hyphens and underscores.");
      return;
    }
    if (value.trim() === "" || Number.isNaN(amount) || amount < 0.01) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!Number.isInteger(expires) || expires < 1 || expires > 3650) {
      setError("Expiry must be a whole number of days from 1 to 3650.");
      return;
    }
    setError(null);

    const payload = {
      label: trimmedLabel,
      value: amount,
      expires_in_days: expires,
      ...(code.trim() ? { code: code.trim() } : {}),
    };

    if (isEdit) {
      updateCoupon.mutate(
        { id: coupon.id, payload },
        {
          onSuccess: res => {
            toast.success(res.message || "Coupon updated");
            onClose();
          },
          onError: (err: unknown) => toast.error(apiErrorMessage(err, "Failed to update coupon")),
        },
      );
      return;
    }

    createCoupon.mutate(payload, {
      onSuccess: res => {
        toast.success(res.message || `Coupon ${res.data.code} created for ${res.data.label}`);
        onClose();
      },
      onError: (err: unknown) => toast.error(apiErrorMessage(err, "Failed to create coupon")),
    });
  }

  return (
    <SheetShell
      title={isEdit ? "Edit coupon" : "Create coupon"}
      subtitle="A named amount a customer can enter at checkout."
      onClose={onClose}
      wide
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton size="sm" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
          </AdminButton>
        </>
      }
    >
      <FormSection title="Coupon" cols={1}>
        <Field label="Label" required error={error && !label.trim() ? error : undefined} className="col-span-2">
          <TextInput value={label} onChange={setLabel} placeholder="Abas" />
        </Field>
        <Field
          label="Coupon code"
          className="col-span-2"
          help={
            isEdit
              ? "Changing the code updates the code the customer enters."
              : "Optional. Leave blank and a code is generated from the label."
          }
        >
          <TextInput
            value={code}
            onChange={next => setCode(next.toUpperCase())}
            placeholder={isEdit ? coupon.code : "Leave blank to generate"}
            uppercase
          />
        </Field>
        <Field label="Amount" required className="col-span-2" error={error && label.trim() ? error : undefined}>
          <TextInput type="number" value={value} onChange={setValue} placeholder="30" />
        </Field>
        <Field label="Expires in (days)" required className="col-span-2">
          <TextInput type="number" value={days} onChange={setDays} placeholder="14" />
        </Field>
      </FormSection>
    </SheetShell>
  );
}

export function DiscountsTab() {
  const query = useAdminDiscounts();
  const remove = useDeleteDiscount();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState<Discount | null>(null);

  const coupons = query.data?.data ?? [];

  return (
    <>
      <Panel
        title="Discount coupons"
        subtitle="Create a code for a person. Tickets, flights and hotels take the amount off at checkout. eSIMs do not."
        action={
          <AdminButton size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-3" />
            Create coupon
          </AdminButton>
        }
      >
        {query.isPending ? (
          <p className="m-0 text-xs text-muted-foreground">Loading coupons…</p>
        ) : query.isError ? (
          <p className="m-0 text-xs text-destructive">Could not load coupons. GET /v1/discounts failed.</p>
        ) : coupons.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">
            No coupons yet. Create one with a label, an amount, and how many days it lasts.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {coupons.map(coupon => (
              <li
                key={coupon.id}
                className="flex items-center justify-between gap-3 rounded-md px-1 py-1.5"
              >
                <div className="min-w-0">
                  <p className="m-0 truncate text-[13px] font-semibold">{coupon.label}</p>
                  <p className="m-0 mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                    <span className="truncate">{coupon.code}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(coupon.code)}
                      className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label={`Copy ${coupon.code}`}
                    >
                      <Copy className="size-3" />
                    </button>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden text-right sm:block">
                    <p className="m-0 text-[13px] font-semibold">{formatAmount(coupon.value)}</p>
                    <p className="m-0 font-mono text-[10px] text-muted-foreground">
                      {coupon.is_expired
                        ? `Expired ${formatExpiry(coupon.expires_at)}`
                        : `${coupon.days_remaining}d left · ${formatExpiry(coupon.expires_at)}`}
                    </p>
                  </div>
                  <span
                    className={
                      coupon.is_expired
                        ? "rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                        : "rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] text-emerald-600"
                    }
                  >
                    {coupon.is_expired ? "Expired" : "Active"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditing(coupon)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label={`Edit ${coupon.label}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(coupon)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${coupon.label}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {creating && <CouponSheet onClose={() => setCreating(false)} />}
      {editing && <CouponSheet coupon={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <SheetShell
          title={`Delete ${deleting.label}?`}
          subtitle={`Code ${deleting.code} stops working. The row is kept as a soft delete.`}
          onClose={() => setDeleting(null)}
          footer={
            <>
              <AdminButton variant="ghost" size="sm" onClick={() => setDeleting(null)}>
                Cancel
              </AdminButton>
              <AdminButton
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(deleting.id, {
                    onSuccess: res => {
                      toast.success(res.message || "Coupon deleted");
                      setDeleting(null);
                    },
                    onError: (err: unknown) => toast.error(apiErrorMessage(err, "Failed to delete coupon")),
                  })
                }
              >
                {remove.isPending ? "Deleting…" : "Delete"}
              </AdminButton>
            </>
          }
        >
          <p className="m-0 text-[12.5px] leading-relaxed text-muted-foreground">
            Customers who still have this code entered will be told it is no longer valid.
          </p>
        </SheetShell>
      )}
    </>
  );
}
