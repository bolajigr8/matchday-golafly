"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, Plus, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fileNameFromUrl, normalizeMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/* Controls shared by the three react-hook-form bodies. Each takes a value and
   an onChange rather than touching the form directly, so they stay testable
   and reusable outside RHF. */

const ringBase =
  "shadow-[0_0_0_1px_var(--edge)] focus-within:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]";
const ringError = "shadow-[0_0_0_1px_var(--destructive)]";

export function Field({
  label,
  required,
  error,
  help,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  help?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <span className="text-[11.5px] font-semibold">
        {label}
        {required && <i className="not-italic text-destructive"> *</i>}
      </span>
      {children}
      {/* Error and help share one slot so nothing shifts when an error
          appears. Every field that can fail renders this — in the old forms
          several rules had no error output at all, so Save silently did
          nothing. */}
      {error ? (
        <span className="flex items-start gap-1 text-[10.5px] text-destructive">
          <CircleAlert className="mt-px size-2.5 shrink-0" />
          {error}
        </span>
      ) : (
        help && <span className="text-[10.5px] leading-snug text-muted-foreground">{help}</span>
      )}
    </div>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
  maxLength,
  uppercase,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "date";
  error?: boolean;
  disabled?: boolean;
  maxLength?: number;
  uppercase?: boolean;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={cn(
        "h-8 rounded-md bg-background px-2.5 text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground",
        error ? ringError : ringBase,
        uppercase && "uppercase",
        disabled && "cursor-not-allowed opacity-60",
      )}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  error?: boolean;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "resize-y rounded-md bg-background p-2.5 text-[12.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground",
        error ? ringError : ringBase,
      )}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  /* `disabled` greys one option out — a full position, a full program. */
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      {/* min-w-0 + truncate: a long option ("Match Day Travel Experiences")
          otherwise sets the trigger's intrinsic width and drags the sheet
          sideways instead of ellipsing. */}
      <SelectTrigger
        className={cn(
          "h-8 w-full min-w-0 border-0 text-[12.5px] [&>span]:min-w-0 [&>span]:truncate",
          error ? ringError : ringBase,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SwitchInput({
  value,
  onChange,
  onLabel = "Yes",
  offLabel = "No",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  onLabel?: string;
  offLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-left text-[12.5px]"
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
      {value ? onLabel : offLabel}
    </button>
  );
}

export function CheckboxInput({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex items-center gap-2.5 rounded-md bg-background p-2.5 text-left text-[12.5px] shadow-[0_0_0_1px_var(--edge)]"
    >
      <span
        className={cn(
          "flex size-[15px] shrink-0 items-center justify-center rounded-sm",
          value
            ? "bg-brand text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]"
            : "bg-background shadow-[0_0_0_1px_var(--edge)]",
        )}
      >
        {value && (
          <svg viewBox="0 0 10 8" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4l2.5 2.5L9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

/* Chip input — Academy features. Enter adds, X removes. preventDefault on
   Enter matters: without it the key submits the whole form. */
export function ChipInput({
  values,
  onChange,
  placeholder,
  error,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  error?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-md bg-background pl-2.5 pr-1",
          error ? ringError : ringBase,
        )}
      >
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={add}
          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-brand-text hover:bg-accent"
          aria-label="Add"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map(v => (
            <span
              key={v}
              className="inline-flex h-[24px] items-center gap-1.5 rounded-full bg-background pl-2.5 pr-1 text-[11.5px] shadow-[0_0_0_1px_var(--edge)]"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter(x => x !== v))}
                aria-label={`Remove ${v}`}
                className="flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-destructive"
              >
                <X className="size-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* Image slot: pick a file. That is the whole input.
 *
 * The URL is an *output*, not something anyone types — the backend stores and
 * converts the upload and hands a URL back. So the stored URL is shown here
 * read-only, as the evidence of what the record currently points at, and the
 * only editing affordance is the picker.
 *
 * The old dashboard put these on a separate "Photos" sheet: a dashed drop zone
 * per slot, square for the icon and 16:9 for the hero, posting multipart
 * `image` + `type` to /v1/offers/{id}/upload. That sheet was edit-only, so a
 * brand-new offer could not get an image until it had been saved once and
 * reopened. Folding the tile into the form removes that round trip — the same
 * control works for create and edit.
 *
 * Picking stages the file and previews it locally via an object URL. Nothing
 * is persisted yet; the notice at the top of the sheet is the single place
 * that says so, rather than each control growing its own disclaimer. */
export function ImageInput({
  value,
  onFile,
  onClear,
  ratio = "square",
}: {
  /* The stored URL from the API — displayed, never typed. */
  value: string;
  onFile?: (file: File) => void;
  onClear?: () => void;
  ratio?: "square" | "video";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ url: string; name: string } | null>(null);

  /* Object URLs leak until revoked, and a sheet that is opened and closed a
     dozen times would hold every preview alive. */
  useEffect(() => () => { if (staged) URL.revokeObjectURL(staged.url); }, [staged]);

  const src = staged?.url ?? normalizeMediaUrl(value);

  const pick = (file: File | undefined) => {
    if (!file) return;
    setStaged(prev => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { url: URL.createObjectURL(file), name: file.name };
    });
    onFile?.(file);
  };

  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label={src ? "Replace image" : "Add image"}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-md bg-muted transition-shadow",
          src
            ? "shadow-[0_0_0_1px_var(--edge)] hover:shadow-[0_0_0_1px_var(--brand-edge)]"
            : "flex items-center justify-center border border-dashed border-[var(--edge)] text-muted-foreground hover:border-[var(--brand-edge)] hover:text-brand-text",
          ratio === "video" ? "aspect-video w-28" : "size-14",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            pick(e.target.files?.[0]);
            /* Reset so re-picking the same file fires change again. */
            e.target.value = "";
          }}
        />
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Upload className="size-4 text-background" />
            </span>
          </>
        ) : (
          <Plus className="size-5" />
        )}
      </button>

      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        {staged ? (
          <>
            <span className="min-w-0 max-w-full truncate text-[11.5px] text-foreground">
              {staged.name}
            </span>
            <span className="text-[10.5px] text-muted-foreground">
              Selected — uploads on save.
            </span>
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(staged.url);
                setStaged(null);
              }}
              className="text-[10.5px] text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
            >
              Remove
            </button>
          </>
        ) : value ? (
          <>
            {/* Read-only: this URL came back from the backend after it stored
                and converted the file. Nobody types one in. */}
            <span className="min-w-0 max-w-full truncate text-[11.5px] text-foreground">
              {fileNameFromUrl(normalizeMediaUrl(value))}
            </span>
            <a
              href={normalizeMediaUrl(value)}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] text-muted-foreground hover:text-brand-text"
            >
              Open full size ↗
            </a>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-[10.5px] text-muted-foreground underline-offset-2 hover:text-brand-text hover:underline"
            >
              Replace
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-[10.5px] text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
              >
                Remove
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[11.5px] text-muted-foreground hover:text-brand-text"
          >
            Add image
          </button>
        )}
      </span>
    </div>
  );
}

export function FormSection({
  title,
  children,
  cols = 2,
}: {
  title: string;
  children: React.ReactNode;
  cols?: 1 | 2;
}) {
  return (
    <div>
      <p className="mb-2.5 border-b border-[var(--edge)] pb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <div className={cn("grid gap-2.5", cols === 2 ? "grid-cols-2" : "grid-cols-1")}>
        {children}
      </div>
    </div>
  );
}

/* Shown where the old dashboard disabled category/subcategory on edit. Stating
   the reason matters — a disabled control with no explanation reads as a bug. */
/* min-h-8 rather than h-8: these carry real category names — "Match Day Travel
   Experiences" — which do not fit one line in a half-width column, and a fixed
   height clips them instead of wrapping. */
export function LockedValue({
  label,
  value,
  reason,
  className,
}: {
  label: string;
  value: string;
  reason: string;
  className?: string;
}) {
  return (
    <Field label={label} help={reason} className={className}>
      <span className="flex min-h-8 items-center break-words rounded-md bg-muted px-2.5 py-1.5 text-[12.5px] leading-snug text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
        {value || "—"}
      </span>
    </Field>
  );
}
