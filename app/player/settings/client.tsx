"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { PageHeader } from "@/components/player/player-states";
import { useFanChangePassword, useFanLogout, useHydratedFan } from "@/features/fan/hooks";

/* Player dashboard — Settings. The account behind the dashboard: who is signed
   in, their password, and signing out. Same shared auth mutations as the fan
   and scout settings — there is one account, so one code path. */

export default function PlayerSettingsClient() {
  const { user } = useHydratedFan();
  const logout = useFanLogout();
  const changePassword = useFanChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    !!current && next.length >= 8 && next === confirm && !changePassword.isPending;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changePassword.mutate({
      current_password: current,
      password: next,
      password_confirmation: confirm,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" />

      <div className="grid items-start gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <section className="rounded-[20px] border border-border bg-card p-[18px]">
            <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Account</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <ReadOnly label="Name" value={user?.name ?? "—"} />
              <ReadOnly label="Email" value={user?.email ?? "—"} />
            </div>
          </section>

          <section className="rounded-[20px] border border-border bg-card p-[18px]">
            <h2 className="mb-3 font-heading text-sm font-bold text-foreground">Password</h2>
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

        <section className="rounded-[20px] border border-border bg-card p-[15px]">
          <h2 className="mb-2.5 font-heading text-sm font-bold text-foreground">Session</h2>
          <p className="text-xs leading-relaxed text-muted-foreground">
            You stay signed in on this device until your session expires.
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
      </div>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <span className="flex h-11 items-center truncate rounded-[14px] border border-[var(--edge-strong)] bg-muted px-3.5 text-[13px] text-muted-foreground">
        {value}
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
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <input
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={e => onChange(e.target.value)}
        className={`h-11 rounded-[14px] border bg-card px-3.5 text-[13px] text-foreground outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--brand-glow)] ${
          error ? "border-[var(--status-danger)]" : "border-[var(--edge-strong)] focus:border-[var(--brand-edge)]"
        }`}
      />
      {error ? (
        <span className="text-[11.5px] text-[var(--status-danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}
