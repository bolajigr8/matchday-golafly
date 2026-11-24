"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { countries } from "country-data-list";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SheetShell } from "@/components/admin/sheet-shell";
import { AdminButton } from "@/components/admin/admin-ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaGallery } from "@/components/admin/media";
import { TestimonialVideoField } from "@/components/admin/testimonial-video";
import { BrochureField } from "@/components/admin/brochure-field";
import { CountryDropdown } from "@/components/ui/county-dropdown";
import {
  ChipInput,
  Field,
  FormSection,
  ImageInput,
  LockedValue,
  SelectInput,
  SwitchInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-controls";
import {
  programSchema,
  slugify,
  type ProgramFormValues,
} from "@/features/admin/schemas";
import {
  useAdminProgramCategories,
  useAdminProgramSubcategories,
  useSaveProgram,
} from "@/features/admin/hooks";
import { getHtmlContent } from "@/lib/content-normalizers";
import type { Program } from "@/services/programs";

interface DetailRow {
  id: string;
  key: string;
  value: string;
}

export function ProgramForm({
  program,
  onClose,
}: {
  program?: Program | null;
  onClose: () => void;
}) {
  const mode = program ? "edit" : "create";

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProgramFormValues>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      program_category_id: program?.program_category?.id ?? program?.program_category_id ?? 0,
      program_subcategory_id:
        program?.program_subcategory?.id ?? program?.program_subcategory_id ?? 0,
      title: program?.title ?? "",
      slug: program?.slug ?? "",
      /* The union collapses here, once — a `typeof === "string"` guard would
         drop the { html } form entirely. */
      description: getHtmlContent(program?.description) ?? "",
      inclusions: program?.inclusions ?? "",
      highlights: program?.highlights ?? [],
      badges: program?.badges ?? [],
      location: program?.location ?? "",
      season_label: program?.season_label ?? "",
      country_code: program?.country_code ?? "",
      price_from: program?.price_from ? Number(program.price_from) : undefined,
      price_currency: program?.price_currency ?? "EUR",
      deadline: program?.deadline?.slice(0, 10) ?? "",
      start_date: program?.start_date?.slice(0, 10) ?? "",
      end_date: program?.end_date?.slice(0, 10) ?? "",
      hero_image: program?.hero_image ?? "",
      icon_image: program?.icon_image ?? "",
      banner_url: program?.banner_url ?? "",
      brochure_url: program?.brochure_url ?? "",
      status: program?.status ?? false,
      details: (program?.details ?? {}) as Record<string, unknown>,
    },
  });

  const categoryId = watch("program_category_id");
  const title = watch("title");
  const countryCode = watch("country_code");

  const categoriesQuery = useAdminProgramCategories();
  const subcategoriesQuery = useAdminProgramSubcategories(Number(categoryId) || undefined);

  const categories = categoriesQuery.data?.data ?? [];
  const subcategories = subcategoriesQuery.data?.data?.subcategories ?? [];

  /* Slug auto-fill: CREATE only, and it stops the moment someone types in
     the slug field. Tracked with a ref, not dirtyFields: the auto-filled
     value itself counts as "dirty" to react-hook-form, so the old check froze
     the slug at the title's first letter. */
  const slugEdited = useRef(false);
  useEffect(() => {
    if (mode === "create" && title && !slugEdited.current) {
      setValue("slug", slugify(title), { shouldValidate: true });
    }
  }, [title, mode, setValue]);

  /* The country combobox keys on alpha3; the record stores alpha2. */
  const currentAlpha3 = useMemo(() => {
    if (!countryCode) return undefined;
    return countries.all.find(
      (c: { alpha2?: string; alpha3?: string }) =>
        c.alpha2 === String(countryCode).toUpperCase(),
    )?.alpha3;
  }, [countryCode]);

  const [detailRows, setDetailRows] = useState<DetailRow[]>(() => {
    const entries = Object.entries(program?.details ?? {});
    const rows = entries.map(([key, value]) => ({
      id: `${key}-${Math.random()}`,
      key,
      value: typeof value === "string" ? value : JSON.stringify(value),
    }));
    return rows.length > 0 ? rows : [{ id: "seed", key: "", value: "" }];
  });

  const setRow = (id: string, patch: Partial<DetailRow>) =>
    setDetailRows(rows => rows.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setDetailRows(rows => {
      const next = rows.filter(r => r.id !== id);
      return next.length > 0 ? next : [{ id: `seed-${Math.random()}`, key: "", value: "" }];
    });

  /* Staged gallery media — held here and sent as `gallery[]` on save. The
     testimonial video is not staged: it has its own endpoints and writes
     immediately, so it is not part of this form's dirty state. */
  /* Highlights are edited as raw text and split into lines only on save.
     Splitting on every keystroke trimmed each space as it was typed and
     dropped the new line Enter makes, squashing everything into one word. */
  const [highlightsText, setHighlightsText] = useState(() => (program?.highlights ?? []).join("\n"));

  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryRemoved, setGalleryRemoved] = useState<string[]>([]);
  const mediaDirty = galleryFiles.length > 0 || galleryRemoved.length > 0;

  const [confirmClose, setConfirmClose] = useState(false);
  const requestClose = () => {
    if ((isDirty || mediaDirty) && !confirmClose) {
      setConfirmClose(true);
      return;
    }
    onClose();
  };

  const save = useSaveProgram();

  /* The golafly.com admin's production payload — see useSaveProgram. Empty
     optional fields go as "" so an edit can clear them. */
  const onSubmit = handleSubmit(values => {
    const details: Record<string, unknown> = { ...(values.details ?? {}) };
    for (const row of detailRows) {
      if (row.key.trim()) details[row.key.trim()] = row.value;
    }

    const fd = new FormData();
    if (mode === "create") {
      fd.append("program_category_id", String(values.program_category_id));
      fd.append("program_subcategory_id", String(values.program_subcategory_id));
    }
    fd.append("title", values.title);
    fd.append("slug", values.slug);
    fd.append("description", values.description ?? "");
    fd.append("inclusions", values.inclusions ?? "");
    highlightsText
      .split("\n")
      .map(h => h.trim())
      .filter(Boolean)
      .forEach(h => fd.append("highlights[]", h));
    fd.append("price_from", String(values.price_from ?? 0));
    fd.append("price_currency", values.price_currency || "EUR");
    fd.append("location", values.location ?? "");
    fd.append("season_label", values.season_label ?? "");
    fd.append("country_code", values.country_code ?? "");
    fd.append("deadline", values.deadline ?? "");
    fd.append("start_date", values.start_date ?? "");
    fd.append("end_date", values.end_date ?? "");
    fd.append("status", values.status ? "1" : "0");
    fd.append("badges", JSON.stringify(values.badges ?? []));
    fd.append("details", JSON.stringify(details));
    galleryFiles.forEach(file => fd.append("gallery[]", file));

    save.mutate({ id: program?.id, formData: fd }, { onSuccess: onClose });
  }, invalid => {
    /* Nothing is sent when a field fails — say so, and bring the list of
       problems into view, instead of a Create button that seems dead. */
    const first = Object.values(invalid)
      .map(e => e?.message)
      .find((m): m is string => typeof m === "string");
    toast.error("Can't save yet", { description: first ?? "Fix the highlighted fields." });
    requestAnimationFrame(() =>
      errorBanner.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  });
  const errorBanner = useRef<HTMLParagraphElement>(null);

  return (
    <SheetShell
      title={mode === "create" ? "New program" : `Edit ${program?.title}`}
      subtitle={mode === "edit" ? program?.program_category?.name : undefined}
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
          <AdminButton size="sm" onClick={onSubmit} disabled={save.isPending} aria-busy={save.isPending}>
            {save.isPending && <LoaderCircle className="size-3 animate-spin" />}
            {save.isPending
              ? mode === "create" ? "Creating…" : "Saving…"
              : mode === "create" ? "Create program" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      {Object.keys(errors).length > 0 && (
        <p ref={errorBanner} className="scroll-mt-4 rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
          Fix the highlighted fields to save: {Object.values(errors).map(e => e?.message).filter(Boolean).join(" · ")}
        </p>
      )}

      <FormSection title="Classification">
        {mode === "edit" ? (
          <>
            <LockedValue
              label="Category"
              value={program?.program_category?.name ?? ""}
              reason="Locked after creation — re-parenting would orphan the subcategory and break public URLs."
              className="col-span-2"
            />
            {/* Full width: subcategory names run long ("Match Day Travel
                Experiences") and wrap to three lines in a half column. */}
            <LockedValue
              label="Subcategory"
              value={program?.program_subcategory?.name ?? ""}
              reason="Locked with the category."
              className="col-span-2"
            />
          </>
        ) : (
          <>
            <Controller
              control={control}
              name="program_category_id"
              render={({ field }) => (
                <Field
                  label="Category"
                  required
                  error={errors.program_category_id?.message}
                  className="col-span-2"
                >
                  <SelectInput
                    value={field.value ? String(field.value) : ""}
                    onChange={v => {
                      field.onChange(Number(v));
                      /* Switching category must clear the subcategory —
                         otherwise you keep a child of the previous parent. */
                      setValue("program_subcategory_id", 0);
                    }}
                    options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                    placeholder={categoriesQuery.isPending ? "Loading…" : "Select category"}
                    disabled={categoriesQuery.isPending}
                    error={!!errors.program_category_id}
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="program_subcategory_id"
              render={({ field }) => (
                <Field
                  label="Subcategory"
                  required
                  error={errors.program_subcategory_id?.message}
                  className="col-span-2"
                >
                  <SelectInput
                    value={field.value ? String(field.value) : ""}
                    onChange={v =>
                      setValue("program_subcategory_id", Number(v), { shouldValidate: true, shouldDirty: true })
                    }
                    options={subcategories.map(s => ({ value: String(s.id), label: s.name }))}
                    placeholder={
                      !categoryId
                        ? "Select a category first"
                        : subcategoriesQuery.isPending
                          ? "Loading…"
                          : "Select subcategory"
                    }
                    disabled={!categoryId || subcategoriesQuery.isPending}
                    error={!!errors.program_subcategory_id}
                  />
                </Field>
              )}
            />
          </>
        )}
      </FormSection>

      <FormSection title="Basics">
        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <Field label="Title" required error={errors.title?.message} className="col-span-2">
              <TextInput
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Football Tourism — Spain"
                error={!!errors.title}
              />
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
              <TextInput
                value={field.value ?? ""}
                onChange={v => {
                  slugEdited.current = true;
                  field.onChange(v);
                }}
                placeholder="football-tourism-spain"
                error={!!errors.slug}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="location"
          render={({ field }) => (
            <Field label="Location">
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="Madrid" />
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
        <Field label="Country" className="col-span-2" help="Also sets the currency below.">
          <CountryDropdown
            defaultValue={currentAlpha3}
            onChange={country => {
              setValue("country_code", country.alpha2, { shouldValidate: true, shouldDirty: true });
              if (country.currencies?.length) {
                setValue("price_currency", country.currencies[0], {
                  shouldValidate: true,
                  shouldDirty: true,
                });
              }
            }}
          />
        </Field>
      </FormSection>

      <FormSection title="Dates">
        <Controller
          control={control}
          name="start_date"
          render={({ field }) => (
            <Field label="Starts" error={errors.start_date?.message}>
              <TextInput type="date" value={field.value ?? ""} onChange={field.onChange} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="end_date"
          render={({ field }) => (
            <Field label="Ends" error={errors.end_date?.message}>
              <TextInput type="date" value={field.value ?? ""} onChange={field.onChange} error={!!errors.end_date} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="deadline"
          render={({ field }) => (
            <Field label="Application deadline" error={errors.deadline?.message}>
              <TextInput type="date" value={field.value ?? ""} onChange={field.onChange} error={!!errors.deadline} />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Pricing">
        <Controller
          control={control}
          name="price_from"
          render={({ field }) => (
            <Field label="Price from">
              <TextInput
                type="number"
                value={field.value == null ? "" : String(field.value)}
                onChange={field.onChange}
                placeholder="0.00"
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="price_currency"
          render={({ field }) => (
            <Field label="Currency" error={errors.price_currency?.message}>
              <TextInput
                value={field.value ?? ""}
                onChange={v => field.onChange(v.toUpperCase())}
                placeholder="EUR"
                maxLength={3}
                uppercase
                error={!!errors.price_currency}
              />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Content" cols={1}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field label="Overview">
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Describe the program…"
                minHeight={200}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="inclusions"
          render={({ field }) => (
            <Field label="Inclusions" help="What the price covers.">
              <RichTextEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Accommodation, transfers, meals…"
                minHeight={220}
              />
            </Field>
          )}
        />
        <Field label="Highlights" help="One per line.">
          <TextArea value={highlightsText} onChange={setHighlightsText} rows={4} />
        </Field>
        <Controller
          control={control}
          name="badges"
          render={({ field }) => (
            <Field label="Badges">
              <ChipInput
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="premium, featured…"
              />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Media" cols={1}>
        <Controller
          control={control}
          name="hero_image"
          render={({ field }) => (
            <Field label="Hero image">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} ratio="video" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="icon_image"
          render={({ field }) => (
            <Field label="Icon image">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="banner_url"
          render={({ field }) => (
            <Field label="Banner">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} ratio="video" />
            </Field>
          )}
        />
        {/* Its own endpoint, like the testimonial video: uploads (or
            replaces) the PDF as soon as one is picked. */}
        <Field label="Brochure PDF">
          <BrochureField programId={program?.id} url={program?.brochure_url} />
        </Field>
        {/* Gallery files ride along as `gallery[]` on the main create/update
            FormData, so they stage here and go up on save. */}
        <MediaGallery
          urls={program?.gallery}
          label="Gallery"
          onAdd={files => setGalleryFiles(prev => [...prev, ...files])}
          onRemove={url => setGalleryRemoved(prev => [...prev, url])}
        />

        {/* The testimonial video is a single field on its own endpoints, not a
            gallery — see TestimonialVideoField. It writes immediately. */}
        <Field label="Testimonial video">
          <TestimonialVideoField
            programId={program?.id}
            url={program?.testimonial_video_url}
          />
        </Field>
      </FormSection>

      <FormSection title="Custom details" cols={1}>
        {/* Key on top, value beneath — these values are whole sentences
            ("What is included" → a paragraph), and side by side each field
            gets under 190px in a 440px sheet. */}
        <div className="flex flex-col gap-2">
          {detailRows.map(row => (
            <div
              key={row.id}
              className="flex min-w-0 flex-col gap-1.5 rounded-md bg-background p-2 shadow-[0_0_0_1px_var(--edge)]"
            >
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_28px] items-center gap-1.5">
                <TextInput
                  value={row.key}
                  onChange={v => setRow(row.id, { key: v })}
                  placeholder="Key"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove detail"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <TextInput
                value={row.value}
                onChange={v => setRow(row.id, { value: v })}
                placeholder="Value"
              />
            </div>
          ))}
          <AdminButton
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() =>
              setDetailRows(rows => [...rows, { id: `r-${Math.random()}`, key: "", value: "" }])
            }
          >
            <Plus className="size-3" />
            Add detail
          </AdminButton>
        </div>
      </FormSection>

      <FormSection title="Visibility" cols={1}>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Field label="Status">
              <SwitchInput
                value={!!field.value}
                onChange={field.onChange}
                onLabel="Published"
                offLabel="Draft"
              />
            </Field>
          )}
        />
      </FormSection>
    </SheetShell>
  );
}
