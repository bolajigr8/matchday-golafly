"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { AdminButton, Panel } from "@/components/admin/admin-ui";
import { SheetShell } from "@/components/admin/sheet-shell";
import { Field, FormSection, SelectInput, TextInput } from "@/components/admin/form-controls";
import {
  extractApiMessage,
  useAdminMarkupProducts,
  useAdminMarkupTypes,
  useAdminMarkups,
  useCreateMarkup,
  useUpdateMarkup,
} from "@/features/admin/hooks";
import type { Markup, MarkupProduct } from "@/services/travel-admin";

/* Pricing markup. A live write — PATCH /v1/markups/{id}.
 *
 * A markup is a titled group of named categories, each holding an amount and a
 * type ("percentage" / "fixed"). The API replaces the whole `categories` map on
 * PATCH, so the sheet edits one category at a time and sends only that key —
 * sending a partial map would silently drop the others.
 *
 * The products and their categories come from GET /v1/markups/products (VIP
 * packages contract §8): a product with no markup yet gets a "Create" panel
 * (all its categories are required), and a category the backend lists but
 * the markup lacks shows as "Not set" so it can be filled in. */

function humanizeKey(key: string): string {
  const words = key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}

const formatValue = (amount: number | null, type: string | null) => {
  if (amount == null) return "Not set";
  return type === "percentage" ? `${amount}%` : String(amount);
};

interface EditTarget {
  markup: Markup;
  categoryKey: string;
}

export function MarkupTab() {
  const query = useAdminMarkups();
  const typesQuery = useAdminMarkupTypes();
  const productsQuery = useAdminMarkupProducts();
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [creating, setCreating] = useState<MarkupProduct | null>(null);

  const markups = query.data?.data ?? [];
  const types = typesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const productOf = (title: string) => products.find(p => p.title === title);
  const missing = products.filter(p => !markups.some(m => m.title === p.title));

  if (query.isPending) {
    return (
      <Panel title="Markup">
        <p className="m-0 text-xs text-muted-foreground">Loading markups…</p>
      </Panel>
    );
  }

  if (query.isError) {
    return (
      <Panel title="Markup">
        <p className="m-0 text-xs text-destructive">
          Could not load markups. GET /v1/markups failed.
        </p>
      </Panel>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {productsQuery.isError && (
          <p className="m-0 text-[11px] text-muted-foreground">
            Couldn’t load the product list (GET /v1/markups/products), so products without a markup can’t be shown.
          </p>
        )}

        {missing.map(product => (
          <Panel
            key={`new-${product.title}`}
            title={product.title}
            subtitle={`No markup yet · ${product.categories.length} categor${product.categories.length === 1 ? "y" : "ies"} to set`}
            action={
              <AdminButton size="sm" onClick={() => setCreating(product)} disabled={types.length === 0}>
                <Plus className="size-3" />
                Create
              </AdminButton>
            }
          >
            <p className="m-0 text-xs text-muted-foreground">
              Every category must be set before this product can be priced
              {product.title === "hospitality"
                ? ": VIP packages show as unavailable while any is missing."
                : "."}
            </p>
          </Panel>
        ))}

        {markups.length === 0 && missing.length === 0 && (
          <Panel title="Markup">
            <p className="m-0 text-xs text-muted-foreground">No markups configured.</p>
          </Panel>
        )}

        {markups.map(markup => {
          /* The markup's own categories, plus any the product list says it
             should have but it lacks (shown as "Not set"). */
          const own = markup.categories ?? {};
          const extra: [string, { amount: number | null; type: string | null }][] = (
            productOf(markup.title)?.categories ?? []
          )
            .filter(key => !(key in own))
            .map(key => [key, { amount: null, type: null }]);
          const entries = [...Object.entries(own), ...extra];
          return (
            <Panel
              key={markup.id}
              title={markup.title}
              subtitle={`${entries.length} categor${entries.length === 1 ? "y" : "ies"} · saves immediately`}
            >
              {entries.length === 0 ? (
                <p className="m-0 text-xs text-muted-foreground">No categories on this markup.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {entries.map(([key, category]) => (
                    <li
                      key={key}
                      className="flex items-center justify-between gap-3 border-b border-[var(--edge)] py-2.5 first:pt-0 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="m-0 truncate text-[13px] font-semibold">
                          {humanizeKey(key)}
                        </p>
                        <p className="m-0 mt-0.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                          {category.type ?? "no type"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-[13px] font-semibold tabular-nums">
                          {formatValue(category.amount, category.type)}
                        </span>
                        <AdminButton
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing({ markup, categoryKey: key })}
                        >
                          <Pencil className="size-3" />
                          Edit
                        </AdminButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>

      {creating && (
        <CreateMarkupSheet product={creating} types={types} onClose={() => setCreating(null)} />
      )}

      {editing && (
        <MarkupCategorySheet
          markup={editing.markup}
          categoryKey={editing.categoryKey}
          types={types}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function MarkupCategorySheet({
  markup,
  categoryKey,
  types,
  onClose,
}: {
  markup: Markup;
  categoryKey: string;
  types: string[];
  onClose: () => void;
}) {
  /* undefined for a category the product list adds but the markup lacks. */
  const category = markup.categories[categoryKey] as Markup["categories"][string] | undefined;
  const [amount, setAmount] = useState(category?.amount != null ? String(category.amount) : "");
  const [type, setType] = useState(category?.type ?? types[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const update = useUpdateMarkup();

  const submit = () => {
    const parsed = Number(amount);
    if (amount.trim() === "" || Number.isNaN(parsed)) {
      setError("Enter a number.");
      return;
    }
    if (parsed < 0) {
      setError("Cannot be negative.");
      return;
    }
    if (type === "percentage" && parsed > 100) {
      setError("A percentage over 100 would more than double the price.");
      return;
    }
    if (!type) {
      setError("Choose a type.");
      return;
    }
    setError(null);
    update.mutate(
      {
        id: markup.id,
        /* Only this category — the endpoint merges by key. */
        payload: { categories: { [categoryKey]: { amount: parsed, type } } },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <SheetShell
      title={humanizeKey(categoryKey)}
      subtitle={markup.title}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton size="sm" onClick={submit} disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      <p className="rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
        This writes to production immediately and changes what customers are
        charged.
      </p>

      <FormSection title="Markup">
        <Field label="Amount" required error={error ?? undefined} className="col-span-2">
          <TextInput
            type="number"
            value={amount}
            onChange={setAmount}
            placeholder="0"
            error={!!error}
          />
        </Field>
        <Field
          label="Type"
          required
          className="col-span-2"
          help={type === "percentage" ? "Applied as a percentage of the base price." : "Applied as a flat amount."}
        >
          <SelectInput
            value={type}
            onChange={setType}
            options={types.map(t => ({ value: t, label: humanizeKey(t) }))}
            placeholder="Select a type"
          />
        </Field>
      </FormSection>
    </SheetShell>
  );
}

/* Create a product's markup (POST /v1/markups). Every category is required:
 * the backend refuses a missing one ("Missing categories for …"). */
function CreateMarkupSheet({
  product,
  types,
  onClose,
}: {
  product: MarkupProduct;
  types: string[];
  onClose: () => void;
}) {
  const defaultType = types.includes("percentage") ? "percentage" : (types[0] ?? "");
  const [values, setValues] = useState<Record<string, { amount: string; type: string }>>(() =>
    Object.fromEntries(product.categories.map(c => [c, { amount: "", type: defaultType }])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const create = useCreateMarkup();

  const set = (key: string, patch: Partial<{ amount: string; type: string }>) => {
    setValues(v => ({ ...v, [key]: { ...v[key], ...patch } }));
    setErrors(e => ({ ...e, [key]: "" }));
  };

  const submit = () => {
    const next: Record<string, string> = {};
    const categories: Record<string, { amount: number; type: string }> = {};
    for (const key of product.categories) {
      const { amount, type } = values[key];
      const n = Number(amount);
      if (amount.trim() === "" || Number.isNaN(n)) next[key] = "Enter a number.";
      else if (n < 0) next[key] = "Cannot be negative.";
      else if (type === "percentage" && n > 100) next[key] = "A percentage over 100 would more than double the price.";
      else if (!type) next[key] = "Choose a type.";
      else categories[key] = { amount: n, type };
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setApiError(null);
    create.mutate(
      { title: product.title, categories },
      {
        onSuccess: onClose,
        onError: e => setApiError(extractApiMessage(e)),
      },
    );
  };

  return (
    <SheetShell
      title={`Create ${product.title} markup`}
      subtitle={`${product.categories.length} categories · all required`}
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton size="sm" onClick={submit} disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create markup"}
          </AdminButton>
        </>
      }
    >
      <p className="rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
        This writes to production immediately and sets what customers are
        charged. A product can have only one markup.
      </p>
      {apiError && <p className="m-0 text-[11.5px] text-destructive">{apiError}</p>}
      {product.categories.map(key => (
        <FormSection key={key} title={humanizeKey(key)}>
          <Field label="Amount" required error={errors[key] || undefined} className="col-span-2">
            <TextInput
              type="number"
              value={values[key].amount}
              onChange={v => set(key, { amount: v })}
              placeholder="0"
              error={!!errors[key]}
            />
          </Field>
          <Field label="Type" required className="col-span-2">
            <SelectInput
              value={values[key].type}
              onChange={v => set(key, { type: v })}
              options={types.map(t => ({ value: t, label: humanizeKey(t) }))}
              placeholder="Select a type"
            />
          </Field>
        </FormSection>
      ))}
    </SheetShell>
  );
}
