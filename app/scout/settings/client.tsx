"use client";

import { useContext, useState } from "react";
import { Lock, LogOut } from "lucide-react";
import { AdminNavContext } from "@/components/admin/admin-nav-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatusPill } from "@/components/admin/status-pill";
import { TemplateSource } from "@/components/scout/scout-states";
import { useFanChangePassword, useFanLogout } from "@/features/fan/hooks";
import { useScoutSession } from "@/features/scout/hooks";
import { cn } from "@/lib/utils";

/* SETTINGS — the scout's own account.
 *
 * Role, organisation and licence are NOT editable here. They appear on every
 * report this scout signs and travel into a club's hands with their name on
 * them, so they are set by the admin who created the account. Name, email and
 * phone are theirs to change.
 *
 * Password change reuses the shared auth mutation rather than a scouting copy:
 * there is one account behind /dashboard and /scout, so two password forms
 * writing through two code paths would be two places for a bug to live. */
export default function SettingsClient() {
  const { openNav } = useContext(AdminNavContext);
  const { user } = useScoutSession();
  const logout = useFanLogout();
  const changePassword = useFanChangePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && next !== confirm;
  const tooShort = next.length > 0 && next.length < 8;
  const ready = current && next.length >= 8 && next === confirm;


  return (
    <>
      <AdminPageHeader onOpenNav={openNav} crumbs={["Account", "Settings"]} title="Settings" />

      <div className="flex-1 px-4 pb-6 pt-3 lg:px-[18px]">
        {/* items-start, not the default stretch. A CSS grid makes every cell as
            tall as the tallest in its row, so "Session" — three lines and a
            button — was being stretched to match the six-row notification
            list beside it and rendered as a mostly-empty box. */}
        <div className="grid items-start gap-3 lg:grid-cols-2">
          {/* Profile */}
          <section className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
            <h2 className="m-0 font-heading text-[13px] font-semibold">Profile</h2>
            <dl className="mt-3 grid grid-cols-[108px_1fr] gap-x-3 gap-y-2 text-[12px]">
              <Dt>Name</Dt>
              <dd className="m-0">{user?.name ?? "—"}</dd>
              <Dt>Email</Dt>
              <dd className="m-0">{user?.email ?? "—"}</dd>
              <Dt>Role</Dt>
              <dd className="m-0">
                <StatusPill label={user?.role ? titleCase(user.role) : "Scout"} />
              </dd>
              <Dt>Account</Dt>
              <dd className="m-0">
                <StatusPill label="Active" />
              </dd>
            </dl>

            <div className="mt-3">
              <TemplateSource>
                <Lock className="mt-px size-3 shrink-0" />
                <span>
                  <b className="text-foreground">Role, organisation and licence</b>{" "}
                  are set by the admin who created your account. They appear on
                  every report you sign, so they are not self-editable — ask
                  Golafly to correct them.
                </span>
              </TemplateSource>
            </div>
          </section>

          {/* Password */}
          <section className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
            <h2 className="m-0 font-heading text-[13px] font-semibold">Change password</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              <Field
                label="Current password"
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
              />
              <Field
                label="New password"
                value={next}
                onChange={setNext}
                autoComplete="new-password"
                hint="At least 8 characters."
                error={tooShort ? "Use at least 8 characters." : undefined}
              />
              <Field
                label="Confirm new password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
                error={mismatch ? "Passwords do not match." : undefined}
              />
              <button
                type="button"
                disabled={!ready || changePassword.isPending}
                onClick={() =>
                  changePassword.mutate({
                    current_password: current,
                    password: next,
                    password_confirmation: confirm,
                  })
                }
                className="mt-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-brand px-3 text-[12.5px] font-medium text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {changePassword.isPending ? "Updating…" : "Update password"}
              </button>
            </div>
          </section>

          {/* Session */}
          <section className="rounded-lg bg-card p-3.5 shadow-[0_0_0_1px_var(--edge),var(--lift-1)]">
            <h2 className="m-0 font-heading text-[13px] font-semibold">Session</h2>
            <p className="m-0 mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              You are signed in with the same Golafly account you use for
              tickets and travel. Signing out here signs you out everywhere on
              this device.
            </p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-medium shadow-[0_0_0_1px_var(--edge-strong)] transition-colors hover:bg-accent"
            >
              <LogOut className="size-3.5" />
              Sign out
            </button>
          </section>
        </div>
      </div>
    </>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return (
    <dt className="m-0 font-mono text-[9.5px] font-bold uppercase tracking-[0.11em] text-muted-foreground">
      {children}
    </dt>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  error,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold">{label}</span>
      <input
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-8 rounded-md bg-background px-2.5 text-[12.5px] outline-none",
          error
            ? "shadow-[0_0_0_1px_var(--status-danger)]"
            : "shadow-[0_0_0_1px_var(--edge-strong)] focus:shadow-[0_0_0_1px_var(--brand-edge)]",
        )}
      />
      {error ? (
        <span className="text-[10.5px] text-[var(--status-danger)]">{error}</span>
      ) : hint ? (
        <span className="text-[10px] text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

/** "club_representative" → "Club representative". */
function titleCase(role: string): string {
  const spaced = role.replace(/[_-]+/g, " ").trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}
