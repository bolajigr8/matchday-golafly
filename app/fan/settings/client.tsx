"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, LogOut, Mail, PlugZap, UserRound } from "lucide-react";
import { verifyEmailHref } from "@/features/fan/verification";
import { Routes } from "@/routes";
import { FanState } from "@/components/fan/query-state";
import { useFanChangePassword, useFanLogout, useHydratedFan } from "@/features/fan/hooks";

/* Settings. Profile and password are real; everything else on this page is
   honest about not existing.
 *
 * Scenario 5's visible half lives here: moving between Home, Tickets, Travel
 * and Settings is a client-side route change against a cookie already in
 * hand, so nothing re-prompts. Log out is the only control that ends it. */

export default function SettingsClient() {
  const { user } = useHydratedFan();
  const logout = useFanLogout();
  const changePassword = useFanChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  /* Checked before submit rather than after: the API would reject it too, but
     a round trip to be told the two boxes in front of you disagree is a poor
     use of the fan's time. */
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    current.length > 0 && next.length >= 8 && !mismatch && !changePassword.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changePassword.mutate(
      { current_password: current, password: next, password_confirmation: confirm },
      {
        onSuccess: () => {
          setCurrent("");
          setNext("");
          setConfirm("");
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[23px] font-bold tracking-[-0.03em] text-foreground">Settings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Your account and how we reach you.</p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-4">
          <section className="rounded-[28px] border border-border bg-card p-[18px]">
            <h2 className="mb-3.5 font-heading text-[15px] font-bold text-foreground">Profile</h2>
            <div className="flex flex-col gap-3">
              <Field label="Full name" icon={<UserRound className="size-[15px]" />}>
                {user?.name ?? "—"}
              </Field>
              <Field label="Email" icon={<Mail className="size-[15px]" />}>
                <span className="min-w-0 flex-1 truncate">{user?.email ?? "—"}</span>
                {/* Only shown once the API reports it (email verification). */}
                {user?.email_verified === true && (
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <BadgeCheck className="size-3.5" /> Verified
                  </span>
                )}
                {user?.email_verified === false && (
                  <Link
                    href={verifyEmailHref({ email: user.email, next: Routes.dashboardSettings })}
                    className="ml-auto shrink-0 text-[11px] font-semibold text-brand-text"
                  >
                    Verify now
                  </Link>
                )}
              </Field>
            </div>
            {/* No Save button: there is no profile-update endpoint. A button
                that silently does nothing is worse than its absence. */}
            <p className="mt-3.5 border-t border-[var(--edge)] pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              Name and email come from your account and can’t be edited here yet — there’s no
              profile-update endpoint. Contact support to change them.
            </p>
          </section>

          <section className="rounded-[28px] border border-border bg-card p-[18px]">
            <h2 className="mb-3.5 font-heading text-[15px] font-bold text-foreground">Password</h2>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <PasswordInput
                label="Current password"
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordInput
                  label="New password"
                  value={next}
                  onChange={setNext}
                  autoComplete="new-password"
                  hint="At least 8 characters."
                />
                <PasswordInput
                  label="Confirm new password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                  error={mismatch ? "Passwords don’t match." : undefined}
                />
              </div>
              <div className="mt-1 border-t border-[var(--edge)] pt-3.5">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-9 items-center rounded-xl bg-brand px-4 font-heading text-[13px] font-bold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {changePassword.isPending ? "Updating…" : "Update password"}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="rounded-[20px] border border-border bg-card p-[15px]">
            <h2 className="mb-2.5 font-heading text-sm font-bold text-foreground">Session</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              You stay signed in on this device until your session expires. Moving between Home,
              Tickets, Ledgers and Settings never asks again.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-3.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-semibold shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
            >
              <LogOut className="size-3.5" />
              Log out
            </button>
          </section>

          <FanState
            icon={<PlugZap className="size-[18px]" />}
            tone="warn"
            dashed
            title="Notification settings"
            body="Match reminders, price alerts and travel updates. Not switched on yet — there’s no preferences endpoint to save them to."
          >
            <code className="mt-1 rounded-lg bg-muted px-2.5 py-1 font-mono text-[10px] text-muted-foreground">
              Needs GET/PATCH /v1/auth/preferences
            </code>
          </FanState>

          {/* Named rather than half-built. The travels dashboard carries the
              same three behind TODO(launch) comments for the same reason. */}
          <div className="rounded-[20px] bg-muted p-[15px]">
            <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Not built, on purpose
            </p>
            <ul className="mt-2.5 list-disc pl-4 text-xs text-foreground">
              <li>Saved cards</li>
              <li>Rewards &amp; points</li>
              <li>Inbox</li>
            </ul>
            <p className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">
              No endpoint exists for any of these. A toggle that silently does nothing is worse than
              its absence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="flex h-11 items-center gap-2.5 rounded-[14px] border border-[var(--edge-strong)] bg-card px-3.5 text-[13px] text-muted-foreground">
        {icon}
        {children}
      </span>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        className={`h-11 rounded-[14px] border bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:shadow-[0_0_0_3px_var(--brand-glow)] ${
          error ? "border-[var(--status-danger)]" : "border-[var(--edge-strong)] focus:border-[var(--brand-edge)]"
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
