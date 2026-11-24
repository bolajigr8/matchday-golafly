"use client";

import { useState } from "react";
import { CircleAlert } from "lucide-react";
import { AdminButton } from "@/components/admin/admin-ui";
import { SheetShell } from "@/components/admin/sheet-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* The create/edit sheet. One component for every resource, driven by a field
   list, because the four sheets it replaces in the old dashboard were
   733–999 lines each of almost identical markup.
 *
 * Wider than a detail sheet (440px vs 380px) to fit two-column date pairs, but
 * never full width — the table behind it is the context you are creating into.
 * The footer is sticky so the primary action never scrolls out of reach on a
 * long form. */

export type FieldKind = "text" | "textarea" | "date" | "number" | "select" | "switch";

export interface FormField {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: string[];
  /* Half-width, so two can share a row (start/end dates, min/max age). */
  half?: boolean;
  /* Switch wording. "Yes/No" is vague next to a label like "Active". */
  onLabel?: string;
  offLabel?: string;
  /* Shown but not editable — ids, slugs the backend owns, timestamps. The old
     dashboard disabled these rather than hiding them, which is right: you
     still need to see the value to know which record you are on. */
  disabled?: boolean;
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

interface FormSheetProps {
  title: string;
  subtitle?: string;
  sections: FormSection[];
  submitLabel: string;
  onClose: () => void;
  onSubmit?: (values: Record<string, string | boolean>) => void;
  /* Shown as a banner when the write endpoint isn't wired — better than a
     Save button that silently does nothing. */
  notice?: string;
  /* The record being edited. WITHOUT this an edit form opens blank, which
     among other things made every Active switch read as off regardless of the
     row's real status — the form was not wrong about the toggle, it simply
     had no value to show. */
  initialValues?: Record<string, unknown>;
}

export function FormSheet({
  title,
  subtitle,
  sections,
  submitLabel,
  onClose,
  onSubmit,
  notice,
  initialValues,
}: FormSheetProps) {
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    seedFrom(sections, initialValues),
  );
  const [touched, setTouched] = useState(false);

  const set = (name: string, value: string | boolean) =>
    setValues(v => ({ ...v, [name]: value }));

  const missing = sections
    .flatMap(s => s.fields)
    .filter(f => f.required && !values[f.name])
    .map(f => f.name);

  const handleSubmit = () => {
    setTouched(true);
    if (missing.length > 0) return;
    onSubmit?.(values);
  };

  return (
    <SheetShell
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      wide
      footer={
        <>
          <AdminButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AdminButton>
          <AdminButton size="sm" onClick={handleSubmit}>
            {submitLabel}
          </AdminButton>
        </>
      }
    >
      {notice && (
        <div className="flex gap-2.5 rounded-md bg-status-warn-bg p-3 text-[11.5px] leading-relaxed text-status-warn shadow-[0_0_0_1px_color-mix(in_oklch,var(--status-warn)_35%,transparent)]">
          <CircleAlert className="mt-px size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {sections.map(section => (
        <div key={section.title}>
          <p className="mb-2.5 border-b border-[var(--edge)] pb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {section.title}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {section.fields.map(field => (
              <FieldControl
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={v => set(field.name, v)}
                invalid={touched && missing.includes(field.name)}
              />
            ))}
          </div>
        </div>
      ))}
    </SheetShell>
  );
}

/* Maps a record onto the field list. Booleans stay booleans (so a switch shows
   the row's real state), arrays join, dates trim to YYYY-MM-DD for <input
   type="date">, and objects are skipped rather than stringified into "[object
   Object]". */
function seedFrom(
  sections: FormSection[],
  record: Record<string, unknown> | undefined,
): Record<string, string | boolean> {
  if (!record) return {};

  const seeded: Record<string, string | boolean> = {};
  for (const field of sections.flatMap(s => s.fields)) {
    const raw = record[field.name];
    if (raw === null || raw === undefined) continue;

    if (field.kind === "switch") {
      seeded[field.name] = Boolean(raw);
    } else if (Array.isArray(raw)) {
      seeded[field.name] = raw.join(field.kind === "textarea" ? "\n" : ", ");
    } else if (field.kind === "date" && typeof raw === "string") {
      seeded[field.name] = raw.slice(0, 10);
    } else if (typeof raw === "string" || typeof raw === "number") {
      seeded[field.name] = String(raw);
    }
  }
  return seeded;
}

function FieldControl({
  field,
  value,
  onChange,
  invalid,
}: {
  field: FormField;
  value: string | boolean | undefined;
  onChange: (v: string | boolean) => void;
  invalid: boolean;
}) {
  const ring = invalid
    ? "shadow-[0_0_0_1px_var(--destructive)]"
    : "shadow-[0_0_0_1px_var(--edge)] focus-within:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]";
  const locked = field.disabled;
  const lockedCls = locked && "cursor-not-allowed opacity-60";

  return (
    <div className={cn("flex flex-col gap-1.5", !field.half && "col-span-2")}>
      <label className="text-[11.5px] font-semibold" htmlFor={`f-${field.name}`}>
        {field.label}
        {field.required && <i className="not-italic text-destructive"> *</i>}
      </label>

      {field.kind === "switch" ? (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(value)}
          disabled={locked}
          onClick={() => onChange(!value)}
          className={cn("flex items-center gap-2 text-left text-[12.5px]", lockedCls)}
        >
          <span
            className={cn(
              "relative h-[17px] w-[30px] shrink-0 rounded-full transition-colors",
              value
                ? "bg-brand shadow-[0_0_0_1px_var(--brand-edge)]"
                : "bg-muted shadow-[0_0_0_1px_var(--edge)]",
            )}
          >
            <span
              className={cn(
                "absolute top-px size-[13px] rounded-full bg-card shadow-sm transition-all",
                value ? "left-[16px]" : "left-px",
              )}
            />
          </span>
          {value ? (field.onLabel ?? "Yes") : (field.offLabel ?? "No")}
        </button>
      ) : field.kind === "textarea" ? (
        <textarea
          id={`f-${field.name}`}
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          disabled={locked}
          className={cn(
            "resize-y rounded-md bg-background p-2.5 text-[12.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground",
            ring,
            lockedCls,
          )}
        />
      ) : field.kind === "select" ? (
        /* The repo already ships a Radix-backed Select in components/ui —
           using the native element here would have been a second, worse
           dropdown with different keyboard and focus behaviour. */
        <Select value={String(value ?? "")} onValueChange={onChange} disabled={locked}>
          <SelectTrigger
            id={`f-${field.name}`}
            className={cn("h-8 w-full border-0 text-[12.5px]", ring)}
          >
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map(o => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <input
          id={`f-${field.name}`}
          type={field.kind === "date" ? "date" : field.kind === "number" ? "number" : "text"}
          value={String(value ?? "")}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={locked}
          className={cn(
            "h-8 rounded-md bg-background px-2.5 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground",
            ring,
            lockedCls,
          )}
        />
      )}

      {/* Error and help share the same slot, so nothing shifts when one
          appears. */}
      {invalid ? (
        <span className="flex items-center gap-1 text-[10.5px] text-destructive">
          <CircleAlert className="size-2.5" />
          {field.label} is required.
        </span>
      ) : (
        field.help && (
          <span className="text-[10.5px] leading-snug text-muted-foreground">{field.help}</span>
        )
      )}
    </div>
  );
}
