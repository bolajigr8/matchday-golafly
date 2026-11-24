"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { SheetShell } from "@/components/admin/sheet-shell";
import { AdminButton } from "@/components/admin/admin-ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import {
  ChipInput,
  Field,
  FormSection,
  ImageInput,
  LockedValue,
  SelectInput,
  SwitchInput,
  SwitchInput as _S,
  TextArea,
  TextInput,
} from "@/components/admin/form-controls";
import { offerSchema, slugify, type OfferFormValues } from "@/features/admin/schemas";
import { useAdminOfferCategories } from "@/features/admin/hooks";
import { getHtmlContent } from "@/lib/content-normalizers";
import { WRITE_NOTICE } from "@/features/admin/notices";
import type { Offer } from "@/services/offers";

/* Category-specific detail blocks.
 *
 * The old dashboard keyed these off hardcoded numeric ids (1 Sports Marketing,
 * 2 Club Offers, 3 Football Tourism), which breaks the moment categories are
 * reordered or reseeded. Keyed off the SLUG here instead. */
const SPECIFICS: Record<string, { title: string; fields: { name: string; label: string; placeholder: string; wide?: boolean }[] }> = {
  "football-tourism": {
    title: "Football tourism specifics",
    fields: [
      { name: "location", label: "Location", placeholder: "Girona, Spain" },
      { name: "position", label: "Position", placeholder: "Midfielder / Winger" },
      { name: "age_range", label: "Age range", placeholder: "17 – 21" },
    ],
  },
  "club-offers": {
    title: "Club offer specifics",
    fields: [
      { name: "club_name", label: "Club", placeholder: "FC Girona" },
      { name: "location", label: "Location", placeholder: "Girona, Spain" },
      { name: "offer_type", label: "Offer type", placeholder: "Youth Development" },
      { name: "duration", label: "Duration", placeholder: "Season Long" },
    ],
  },
  "sports-marketing": {
    title: "Sports marketing specifics",
    fields: [
      { name: "league", label: "League", placeholder: "La Liga (Top Tier)" },
      { name: "placement", label: "Placement", placeholder: "Front-of-Shirt" },
      { name: "exposure", label: "Exposure", placeholder: "Full Season" },
      { name: "market", label: "Market", placeholder: "Spain – Global Broadcast" },
      { name: "audience_reach", label: "Audience reach", placeholder: "500M+ Global Viewers", wide: true },
      { name: "content_rights", label: "Content rights", placeholder: "Full brand usage + digital", wide: true },
    ],
  },
};

type AttrType = "string" | "number" | "array" | "boolean";
interface AttrRow {
  id: string;
  key: string;
  type: AttrType;
  value: string;
}

/* Type is inferred back from the stored JSON, so a List round-trips as a List
   rather than degrading to a comma string on second edit. */
function rowsFromDetails(details: Record<string, unknown> | null | undefined): AttrRow[] {
  const known = new Set(Object.values(SPECIFICS).flatMap(s => s.fields.map(f => f.name)));
  known.add("optional_addons");
  known.add("included_in_package");

  const rows = Object.entries(details ?? {})
    .filter(([k]) => !known.has(k))
    .map(([key, v]) => {
      let type: AttrType = "string";
      let value = String(v);
      if (Array.isArray(v)) {
        type = "array";
        value = v.join(", ");
      } else if (typeof v === "boolean") {
        type = "boolean";
        value = v ? "true" : "false";
      } else if (typeof v === "number") {
        type = "number";
      } else if (v && typeof v === "object") {
        value = JSON.stringify(v);
      }
      return { id: `${key}-${Math.random()}`, key, type, value };
    });

  return rows.length > 0 ? rows : [{ id: "seed", key: "", type: "string", value: "" }];
}

export function OfferForm({ offer, onClose }: { offer?: Offer | null; onClose: () => void }) {
  const mode = offer ? "edit" : "create";
  const categoriesQuery = useAdminOfferCategories();
  const categories = categoriesQuery.data?.data ?? [];

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      offer_category_id: offer?.offer_category_id ?? 0,
      title: offer?.title ?? "",
      slug: offer?.slug ?? "",
      description: getHtmlContent(offer?.description) ?? "",
      badges: offer?.badges ?? [],
      season_label: offer?.season_label ?? "",
      country_code: offer?.country_code ?? "",
      price_from: offer?.price_from ? Number(offer.price_from) : undefined,
      price_currency: offer?.price_currency ?? "EUR",
      deadline: offer?.deadline?.slice(0, 10) ?? "",
      hero_image: offer?.hero_image ?? "",
      icon_image: offer?.icon_image ?? "",
      details: (offer?.details ?? {}) as Record<string, unknown>,
      status: offer?.status ?? false,
    },
  });

  const title = watch("title");
  const categoryId = watch("offer_category_id");
  const activeSlug = categories.find(c => c.id === Number(categoryId))?.slug ?? offer?.category_slug ?? "";
  const specifics = SPECIFICS[activeSlug];

  useEffect(() => {
    if (mode === "create" && title && !dirtyFields.slug) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, mode, dirtyFields.slug, setValue]);

  const [attrRows, setAttrRows] = useState<AttrRow[]>(() => rowsFromDetails(offer?.details));
  const setRow = (id: string, patch: Partial<AttrRow>) =>
    setAttrRows(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id: string) =>
    setAttrRows(rows => {
      const next = rows.filter(r => r.id !== id);
      return next.length > 0 ? next : [{ id: `s-${Math.random()}`, key: "", type: "string", value: "" }];
    });

  const [confirmClose, setConfirmClose] = useState(false);
  const requestClose = () => {
    if (isDirty && !confirmClose) return setConfirmClose(true);
    onClose();
  };

  const onSubmit = handleSubmit(() => {});

  return (
    <SheetShell
      title={mode === "create" ? "New offer" : `Edit ${offer?.title}`}
      subtitle={mode === "edit" ? offer?.category_slug : undefined}
      onClose={requestClose}
      wide
      footer={
        <>
          {confirmClose && (
            <span className="mr-auto self-center text-[11px] text-muted-foreground">
              Discard unsaved changes?
            </span>
          )}
          <AdminButton variant="ghost" size="sm" onClick={requestClose}>
            {confirmClose ? "Discard" : "Cancel"}
          </AdminButton>
          <AdminButton size="sm" onClick={onSubmit}>
            {mode === "create" ? "Create offer" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      <p className="rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
        {WRITE_NOTICE}
      </p>

      <FormSection title="Basics">
        {mode === "edit" ? (
          <LockedValue
            label="Category"
            value={
              categories.find(c => c.id === offer?.offer_category_id)?.name ??
              offer?.category_slug ??
              ""
            }
            reason="Locked after creation — the category drives which specifics this offer stores."
            className="col-span-2"
          />
        ) : (
          <Controller
            control={control}
            name="offer_category_id"
            render={({ field }) => (
              <Field label="Category" required error={errors.offer_category_id?.message}>
                <SelectInput
                  value={field.value ? String(field.value) : ""}
                  onChange={v => field.onChange(Number(v))}
                  options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                  placeholder={categoriesQuery.isPending ? "Loading…" : "Select category"}
                  disabled={categoriesQuery.isPending}
                  error={!!errors.offer_category_id}
                />
              </Field>
            )}
          />
        )}
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <Field label="Deadline">
              <TextInput type="date" value={field.value ?? ""} onChange={field.onChange} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Field label="Title" required error={errors.title?.message} className="col-span-2">
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="FC Barcelona Trials" error={!!errors.title} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="slug"
          render={({ field }) => (
            <Field
              label="Slug"
              required
              error={errors.slug?.message}
              help={mode === "create" ? "Filled from the title until you edit it." : undefined}
              className="col-span-2"
            >
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="fc-barcelona-trials" error={!!errors.slug} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="season_label"
          render={({ field }) => (
            <Field label="Season">
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="2026 Season" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="country_code"
          render={({ field }) => (
            <Field label="Country code">
              <TextInput value={field.value ?? ""} onChange={v => field.onChange(v.toUpperCase())} placeholder="ES" maxLength={2} uppercase />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="price_from"
          render={({ field }) => (
            <Field label="Price from">
              <TextInput type="number" value={field.value == null ? "" : String(field.value)} onChange={field.onChange} placeholder="0.00" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="price_currency"
          render={({ field }) => (
            <Field label="Currency" error={errors.price_currency?.message}>
              <TextInput value={field.value ?? ""} onChange={v => field.onChange(v.toUpperCase())} placeholder="EUR" maxLength={3} uppercase error={!!errors.price_currency} />
            </Field>
          )}
        />
      </FormSection>

      {/* Swaps with the category — this whole block simply did not exist in the
          rebuilt form, so category-specific data had nowhere to go. */}
      {specifics && (
        <FormSection title={specifics.title}>
          {specifics.fields.map(f => (
            <Controller
              key={f.name}
              control={control}
              name="details"
              render={({ field }) => {
                const details = (field.value ?? {}) as Record<string, unknown>;
                return (
                  <Field label={f.label} className={f.wide ? "col-span-2" : undefined}>
                    <TextInput
                      value={String(details[f.name] ?? "")}
                      onChange={v => field.onChange({ ...details, [f.name]: v })}
                      placeholder={f.placeholder}
                    />
                  </Field>
                );
              }}
            />
          ))}

          {activeSlug === "sports-marketing" && (
            <>
              <Controller
                control={control}
                name="details"
                render={({ field }) => {
                  const d = (field.value ?? {}) as Record<string, unknown>;
                  const list = Array.isArray(d.optional_addons) ? (d.optional_addons as string[]) : [];
                  return (
                    <Field label="Optional add-ons" className="col-span-2">
                      <ChipInput values={list} onChange={v => field.onChange({ ...d, optional_addons: v })} placeholder="VIP Hospitality…" />
                    </Field>
                  );
                }}
              />
              <Controller
                control={control}
                name="details"
                render={({ field }) => {
                  const d = (field.value ?? {}) as Record<string, unknown>;
                  const list = Array.isArray(d.included_in_package) ? (d.included_in_package as string[]) : [];
                  return (
                    <Field label="Included in package" className="col-span-2">
                      <ChipInput values={list} onChange={v => field.onChange({ ...d, included_in_package: v })} placeholder="Shirt Branding…" />
                    </Field>
                  );
                }}
              />
            </>
          )}
        </FormSection>
      )}

      <FormSection title="Content" cols={1}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field label="Description">
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Describe the offer…" minHeight={200} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="badges"
          render={({ field }) => (
            <Field label="Badges">
              <ChipInput values={field.value ?? []} onChange={field.onChange} placeholder="premium, featured…" />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Media" cols={1}>
        <Controller
          control={control}
          name="hero_image"
          render={({ field }) => (
            <Field label="Hero image" help="Landscape banner, min 1920×1080.">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} ratio="video" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="icon_image"
          render={({ field }) => (
            <Field label="Icon image" help="Square, min 400×400.">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Custom attributes" cols={1}>
        {/* Two lines per attribute, not four controls on one.
            The sheet is 440px wide; key + type + value + delete side by side
            leaves each field about 126px, so the type select truncates and
            "Item 1, Item 2…" is unreadable. Key and type share the top line,
            the value gets the full width beneath it. */}
        <div className="flex flex-col gap-2">
          {attrRows.map(row => (
            <div
              key={row.id}
              className="flex min-w-0 flex-col gap-1.5 rounded-md bg-background p-2 shadow-[0_0_0_1px_var(--edge)]"
            >
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_112px_28px] items-center gap-1.5">
                <TextInput value={row.key} onChange={v => setRow(row.id, { key: v })} placeholder="Key" />
                <SelectInput
                  value={row.type}
                  onChange={v => setRow(row.id, { type: v as AttrType })}
                  options={[
                    { value: "string", label: "Text" },
                    { value: "number", label: "Number" },
                    { value: "array", label: "List" },
                    { value: "boolean", label: "Yes/No" },
                  ]}
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove attribute"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* The value control changes shape with the type. */}
              <div className="min-w-0">
                {row.type === "boolean" ? (
                  <SelectInput
                    value={row.value || "false"}
                    onChange={v => setRow(row.id, { value: v })}
                    options={[
                      { value: "true", label: "Yes" },
                      { value: "false", label: "No" },
                    ]}
                  />
                ) : (
                  <TextInput
                    value={row.value}
                    onChange={v => setRow(row.id, { value: v })}
                    type={row.type === "number" ? "number" : "text"}
                    placeholder={row.type === "array" ? "Item 1, Item 2…" : "Value"}
                  />
                )}
              </div>
            </div>
          ))}
          <AdminButton
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setAttrRows(rows => [...rows, { id: `a-${Math.random()}`, key: "", type: "string", value: "" }])}
          >
            <Plus className="size-3" />
            Add attribute
          </AdminButton>
          <span className="text-[10.5px] text-muted-foreground">
            Set custom variables like location, club or features. For List, separate values with commas.
          </span>
        </div>
      </FormSection>

      <FormSection title="Visibility" cols={1}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Field label="Status" help="Visible to the public across the platform.">
              <SwitchInput value={!!field.value} onChange={field.onChange} onLabel="Active" offLabel="Inactive" />
            </Field>
          )}
        />
      </FormSection>
    </SheetShell>
  );
}
