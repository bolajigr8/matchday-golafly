"use client";

import { useEffect, useMemo, useRef } from "react";
import { Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PhoneInput } from "@/components/apply-now/phone-input";

/* Controls for /register/player, in the Fan design language: the same
   44px, 14px-radius inputs and lime submit as AuthField/AuthSubmit
   (components/fan/auth-shell.tsx), so this page reads as one family with
   sign-in and the player dashboard. */

const INPUT =
  "h-11 w-full rounded-[14px] border bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-[0_0_0_3px_var(--brand-glow)]";
const INPUT_OK = "border-[var(--edge-strong)] focus:border-[var(--brand-edge)]";
const INPUT_BAD = "border-[var(--status-danger)]";

export const inputClass = (error?: string) => cn(INPUT, error ? INPUT_BAD : INPUT_OK);

export function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--edge)] pt-6 first:border-t-0 first:pt-0">
      <h3 className="font-heading text-[15px] font-bold tracking-[-0.01em] text-foreground">{title}</h3>
      {sub && <p className="mt-1 text-[12.5px] text-muted-foreground">{sub}</p>}
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

export function Grid({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3.5", cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
      {children}
    </div>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  full,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", full && "sm:col-span-full")}>
      <label htmlFor={htmlFor} className="text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-brand-text"> *</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[11.5px] text-[var(--status-danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  required,
  error,
  hint,
  full,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
  type?: "text" | "email" | "tel" | "number" | "date" | "url";
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <Field label={label} required={required} error={error} hint={hint} full={full} htmlFor={id}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={inputClass(error)}
      />
    </Field>
  );
}

/* A phone number with its dial code picked from a list, never typed. The code
   follows `country` (the player's country of residence) and can still be
   changed by hand. */
export function PhoneField({
  id,
  label,
  value,
  onChange,
  country,
  required,
  error,
  hint,
  full,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  country?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
}) {
  return (
    <Field label={label} required={required} error={error} hint={hint} full={full} htmlFor={id}>
      <PhoneInput
        id={id}
        value={value}
        onChange={onChange}
        country={country}
        hasError={!!error}
        placeholder="801 234 5678"
        boxClassName={cn(
          "h-11 rounded-[14px] border bg-card shadow-none ring-0 focus-within:ring-0 transition-shadow",
          "focus-within:shadow-[0_0_0_3px_var(--brand-glow)]",
          error ? "border-[var(--status-danger)]" : "border-[var(--edge-strong)] focus-within:border-[var(--brand-edge)]",
        )}
        inputClassName="h-11 rounded-r-[14px] bg-transparent text-[13px] text-foreground dark:bg-transparent"
      />
    </Field>
  );
}

export type Option = {
  value: string;
  label: React.ReactNode;
  /* Trailing note — "2 left", "Full" — shown in the list, never the trigger. */
  hint?: string;
  tone?: "muted" | "warn" | "full";
  disabled?: boolean;
};

const HINT_TONE = {
  muted: "text-muted-foreground",
  warn: "text-[var(--status-warn)]",
  full: "text-[var(--status-danger)]",
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  required,
  error,
  hint,
  full,
  placeholder = "Select",
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | Option)[];
  required?: boolean;
  error?: string;
  hint?: string;
  full?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const opts: Option[] = options.map(o => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = opts.find(o => o.value === value);

  return (
    <Field label={label} required={required} error={error} hint={hint} full={full} htmlFor={id}>
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={!!error}
          className={cn(inputClass(error), "h-11 data-[size=default]:h-11 [&>span]:min-w-0 [&>span]:truncate disabled:opacity-60")}
        >
          {/* Rendered by hand so an option's hint never shows in the trigger. */}
          <SelectValue placeholder={placeholder}>{selected?.label ?? null}</SelectValue>
        </SelectTrigger>
        <SelectContent className="rounded-[16px] p-1">
          {opts.map(o => (
            <SelectItem
              key={o.value}
              value={o.value}
              disabled={o.disabled}
              className="rounded-[10px] py-2 text-[13px] [&>span:last-child]:flex-1"
            >
              <span className="flex w-full items-center justify-between gap-4">
                <span className="truncate">{o.label}</span>
                {o.hint && (
                  <span className={cn("shrink-0 text-[11.5px] tabular-nums", HINT_TONE[o.tone ?? "muted"])}>
                    {o.hint}
                  </span>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/* FanPill-shaped toggle chips — level, goals, languages. */
export function Chips({
  options,
  isOn,
  onToggle,
}: {
  options: string[];
  isOn: (o: string) => boolean;
  onToggle: (o: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          type="button"
          aria-pressed={isOn(o)}
          onClick={() => onToggle(o)}
          className={cn(
            "h-8 rounded-full border px-3.5 text-xs font-semibold transition-colors",
            isOn(o)
              ? "border-[var(--brand-edge)] bg-brand text-brand-foreground"
              : "border-[var(--edge-strong)] text-foreground hover:bg-muted",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function RangeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={`${label} (0–10)`} htmlFor={id}>
      <div className="grid h-11 grid-cols-[1fr_34px] items-center gap-3">
        <input
          id={id}
          type="range"
          min={0}
          max={10}
          value={value === "" ? 0 : value}
          onChange={e => onChange(e.target.value)}
          className="w-full accent-[var(--brand-text)]"
        />
        <output htmlFor={id} className="text-right font-heading text-[15px] font-bold tabular-nums">
          {value === "" ? "–" : value}
        </output>
      </div>
    </Field>
  );
}

/* One file. "Choose file" never wraps: the name and hint truncate instead,
   so the row keeps its shape at phone width. */
export function UploadRow({
  label,
  hint,
  accept,
  file,
  onChange,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-[var(--edge-strong)] p-3.5">
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--edge)] bg-muted text-brand-text">
        <Upload className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">{label}</p>
        <p className="truncate text-[11.5px] text-muted-foreground">{file ? file.name : hint}</p>
      </div>
      {file ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Remove ${label}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground shadow-[0_0_0_1px_var(--edge-strong)] hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl px-3.5 text-[12.5px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-muted"
        >
          Choose file
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={accept}
        hidden
        onChange={e => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* A highlight image preview. The object URL lives as long as the thumb. */
export function ImageThumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[14px] bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={file.name} className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/* Back on the left, Continue/Submit on the right, each only as wide as its
   label. */
export function NavRow({
  step,
  last,
  onBack,
  onNext,
  submitting,
  canSubmit = true,
}: {
  step: number;
  last: boolean;
  onBack: () => void;
  onNext: () => void;
  submitting?: boolean;
  canSubmit?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2.5 pt-1">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-fit items-center rounded-[14px] px-5 text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-muted"
        >
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type={last ? "submit" : "button"}
        onClick={last ? undefined : onNext}
        disabled={last && (submitting || !canSubmit)}
        className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-[14px] bg-brand px-6 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
      >
        {last ? (submitting ? "Submitting…" : "Submit registration") : "Continue"}
      </button>
    </div>
  );
}
