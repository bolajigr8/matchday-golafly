"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { countries } from "country-data-list";
import { SheetShell } from "@/components/admin/sheet-shell";
import { AdminButton } from "@/components/admin/admin-ui";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { MediaGallery } from "@/components/admin/media";
import { CountryDropdown } from "@/components/ui/county-dropdown";
import {
  CheckboxInput,
  ChipInput,
  Field,
  FormSection,
  ImageInput,
  SwitchInput,
  TextArea,
  TextInput,
} from "@/components/admin/form-controls";
import { academySchema, slugify, type AcademyFormValues } from "@/features/admin/schemas";
import { getHtmlContent } from "@/lib/content-normalizers";
import { WRITE_NOTICE } from "@/features/admin/notices";
import { academyFeatures, type Academy } from "@/services/academy";

export function AcademyForm({
  academy,
  onClose,
}: {
  academy?: Academy | null;
  onClose: () => void;
}) {
  const mode = academy ? "edit" : "create";

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, dirtyFields, isDirty },
  } = useForm<AcademyFormValues>({
    resolver: zodResolver(academySchema),
    defaultValues: {
      name: academy?.name ?? "",
      slug: academy?.slug ?? "",
      city: academy?.city ?? "",
      country_name: academy?.country_name ?? "",
      country_code: academy?.country_code ?? "",
      duration_label: academy?.duration_label ?? "",
      age_min: academy?.age_min ?? 5,
      age_max: academy?.age_max ?? 18,
      price_from: academy?.price_from ? Number(academy.price_from) : 0,
      price_currency: academy?.price_currency ?? "EUR",
      /* The API returns this as an array on some records and a comma string on
         others — academyFeatures() normalises the union. */
      features: academy ? academyFeatures(academy) : [],
      description: getHtmlContent(academy?.description) ?? "",
      terms_and_conditions: academy?.terms_and_conditions ?? "",
      header_image_url: academy?.header_image_url ?? "",
      primary_image_url: academy?.primary_image_url ?? "",
      has_accommodation: academy?.has_accommodation ?? false,
      accepts_all_ages: academy?.accepts_all_ages ?? false,
      status: academy?.status ?? false,
    },
  });

  const name = watch("name");
  const countryCode = watch("country_code");

  /* The old academy form had NO dirty guard here, so retyping the name wiped a
     hand-written slug. Matching programs/offers instead. */
  useEffect(() => {
    if (mode === "create" && name && !dirtyFields.slug) {
      setValue("slug", slugify(name), { shouldValidate: true });
    }
  }, [name, mode, dirtyFields.slug, setValue]);

  const currentAlpha3 = useMemo(() => {
    if (!countryCode) return undefined;
    return countries.all.find(
      (c: { alpha2?: string; alpha3?: string }) =>
        c.alpha2 === String(countryCode).toUpperCase(),
    )?.alpha3;
  }, [countryCode]);

  /* Staged gallery files — uploaded as `images[i][file]` on save. */
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [confirmClose, setConfirmClose] = useState(false);
  const requestClose = () => {
    if ((isDirty || imageFiles.length > 0) && !confirmClose) return setConfirmClose(true);
    onClose();
  };

  const onSubmit = handleSubmit(() => {});

  return (
    <SheetShell
      title={mode === "create" ? "New academy" : `Edit ${academy?.name}`}
      subtitle={mode === "edit" ? [academy?.city, academy?.country_name].filter(Boolean).join(", ") : undefined}
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
            {mode === "create" ? "Create academy" : "Save changes"}
          </AdminButton>
        </>
      }
    >
      <p className="rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
        {WRITE_NOTICE}
      </p>

      <FormSection title="Basics">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Field label="Name" required error={errors.name?.message} className="col-span-2">
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="Barcelona Elite Academy" error={!!errors.name} />
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
              help={mode === "create" ? "Filled from the name until you edit it." : undefined}
              className="col-span-2"
            >
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="barcelona-elite-academy" error={!!errors.slug} />
            </Field>
          )}
        />
        <Field label="Country" required className="col-span-2" help="Also sets the currency below.">
          <CountryDropdown
            defaultValue={currentAlpha3}
            onChange={country => {
              setValue("country_name", country.name, { shouldValidate: true, shouldDirty: true });
              setValue("country_code", country.alpha2, { shouldValidate: true, shouldDirty: true });
              if (country.currencies?.length) {
                setValue("price_currency", country.currencies[0], { shouldValidate: true, shouldDirty: true });
              }
            }}
          />
          {(errors.country_code || errors.country_name) && (
            <span className="text-[10.5px] text-destructive">
              {errors.country_code?.message ?? errors.country_name?.message}
            </span>
          )}
        </Field>
        <Controller
          control={control}
          name="city"
          render={({ field }) => (
            <Field label="City" required error={errors.city?.message}>
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="Barcelona" error={!!errors.city} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="duration_label"
          render={({ field }) => (
            <Field label="Duration" required error={errors.duration_label?.message}>
              <TextInput value={field.value ?? ""} onChange={field.onChange} placeholder="2 Weeks" error={!!errors.duration_label} />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Intake">
        <Controller
          control={control}
          name="age_min"
          render={({ field }) => (
            <Field label="Min age" required error={errors.age_min?.message}>
              <TextInput type="number" value={String(field.value ?? "")} onChange={field.onChange} placeholder="5" error={!!errors.age_min} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="age_max"
          render={({ field }) => (
            <Field label="Max age" required error={errors.age_max?.message}>
              <TextInput type="number" value={String(field.value ?? "")} onChange={field.onChange} placeholder="18" error={!!errors.age_max} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="price_from"
          render={({ field }) => (
            <Field label="Price from" required error={errors.price_from?.message}>
              <TextInput type="number" value={String(field.value ?? "")} onChange={field.onChange} placeholder="1200" error={!!errors.price_from} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="price_currency"
          render={({ field }) => (
            <Field label="Currency" required error={errors.price_currency?.message}>
              <TextInput value={field.value ?? ""} onChange={v => field.onChange(v.toUpperCase())} placeholder="EUR" maxLength={3} uppercase error={!!errors.price_currency} />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Content" cols={1}>
        <Controller
          control={control}
          name="features"
          render={({ field }) => (
            /* This rule (min 1) existed before but rendered NO error, so Save
               silently did nothing when features were empty. */
            <Field label="Key features" required error={errors.features?.message}>
              <ChipInput
                values={field.value ?? []}
                onChange={field.onChange}
                placeholder="UEFA Pro Coaches — press Enter"
                error={!!errors.features}
              />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <Field label="Description">
              <RichTextEditor value={field.value ?? ""} onChange={field.onChange} placeholder="Describe the academy…" minHeight={220} />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="terms_and_conditions"
          render={({ field }) => (
            <Field label="Terms and conditions">
              <TextArea value={field.value ?? ""} onChange={field.onChange} rows={5} />
            </Field>
          )}
        />
      </FormSection>

      <FormSection title="Media" cols={1}>
        <Controller
          control={control}
          name="header_image_url"
          render={({ field }) => (
            <Field label="Header image">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} ratio="video" />
            </Field>
          )}
        />
        <Controller
          control={control}
          name="primary_image_url"
          render={({ field }) => (
            <Field label="Primary image">
              <ImageInput value={field.value ?? ""} onClear={() => field.onChange("")} />
            </Field>
          )}
        />
        {/* Add is supported — files go up as `images[i][file]` on update.
            Delete, reorder and set-primary genuinely have no endpoint, so
            existing images have no remove control. */}
        <MediaGallery
          urls={academy?.images?.map(i => i.url)}
          label="Gallery"
          onAdd={files => setImageFiles(prev => [...prev, ...files])}
        />
      </FormSection>

      <FormSection title="Configuration" cols={1}>
        <Controller
          control={control}
          name="has_accommodation"
          render={({ field }) => (
            <CheckboxInput value={!!field.value} onChange={field.onChange} label="Includes on-site accommodation" />
          )}
        />
        <Controller
          control={control}
          name="accepts_all_ages"
          render={({ field }) => (
            <CheckboxInput value={!!field.value} onChange={field.onChange} label="Open to all ages" />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Field label="Status" help="Draft by default. Turn on to publish publicly.">
              <SwitchInput value={!!field.value} onChange={field.onChange} onLabel="Active" offLabel="Inactive" />
            </Field>
          )}
        />
      </FormSection>
    </SheetShell>
  );
}
