"use client";

import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { Routes } from "@/routes";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* The way out of a screen that hides the site's navbar: the auth screens and
   /register/player. Pinned top-left, so it's always where people look for
   "back", and it never competes with the form. The light/dark switch sits
   top-right, since those screens have no navbar to carry it. */
export function BackToHome() {
  return (
    <>
      <Link
        href={Routes.home}
        className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:left-6 sm:top-6"
      >
        <ArrowLeft className="size-3.5" />
        Back to home
      </Link>
      <ThemeToggle className="absolute right-4 top-3 z-10 sm:right-6 sm:top-[18px]" />
    </>
  );
}

/* Shared frame for the four auth screens, so they cannot drift apart in
   spacing, error placement or footer wording. */

export function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  /** The API's own message. Never a generic one — see AuthError below. */
  error?: string | null;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-16">
      <BackToHome />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[380px]"
        style={{
          background:
            "radial-gradient(ellipse at 80% -25%, color-mix(in oklch, var(--brand) 13%, transparent), transparent 62%)",
        }}
      />
      <div className="relative w-full max-w-[420px]">
        <Link href={Routes.home} className="block text-center">
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            GOLAFLY
          </span>
        </Link>

        <div className="mt-5 rounded-[28px] border border-border bg-card p-6">
          <h1 className="font-heading text-xl font-bold tracking-[-0.03em] text-foreground">
            {title}
          </h1>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">{subtitle}</p>

          {error && <AuthError message={error} />}

          {children}
        </div>

        {footer && (
          <p className="mt-3.5 text-center text-xs text-muted-foreground">{footer}</p>
        )}
      </div>
    </main>
  );
}

/* The API's own message, verbatim. "These credentials do not match our
   records" tells a fan to check their password; "Something went wrong" sends
   them to support. The generic fallback only appears when the API gave us
   nothing at all. */
export function AuthError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mt-4 flex items-start gap-2.5 rounded-[13px] bg-[var(--status-danger-bg)] px-3.5 py-3 text-[var(--status-danger)]"
    >
      <TriangleAlert className="mt-px size-[15px] shrink-0" />
      <p className="m-0 text-xs leading-snug">{message}</p>
    </div>
  );
}

export function AuthField({
  label,
  hint,
  error,
  ...props
}: React.ComponentProps<"input"> & { label: string; hint?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input
        {...props}
        className={`h-11 rounded-[14px] border bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-[0_0_0_3px_var(--brand-glow)] ${
          error
            ? "border-[var(--status-danger)]"
            : "border-[var(--edge-strong)] focus:border-[var(--brand-edge)]"
        }`}
      />
      {error ? (
        <span className="text-[11.5px] text-[var(--status-danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

/** Reports its own state and stays disabled in flight, so a slow connection
 *  cannot produce two registrations from one impatient fan. */
export function AuthSubmit({
  pending,
  children,
  disabled,
}: {
  pending: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-brand font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] transition-opacity disabled:cursor-not-allowed disabled:opacity-55"
    >
      {children}
    </button>
  );
}
