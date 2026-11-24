"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useAdminNav } from "@/components/admin/admin-nav-context";
import { AdminButton, Panel } from "@/components/admin/admin-ui";
import type { Column } from "@/components/admin/data-table";
import { QueryTable } from "@/components/admin/query-table";
import { UnavailableTab } from "@/components/admin/unavailable-tab";
import { FormSheet, type FormSection } from "@/components/admin/form-sheet";
import { DiscountsTab } from "@/components/admin/settings/discounts-tab";
import { FreeEsimTab } from "@/components/admin/settings/free-esim-tab";
import { MarkupTab } from "@/components/admin/settings/markup-tab";
import { FlightPromoTab } from "@/components/admin/settings/flight-promo-tab";
import { MatchPromoTab } from "@/components/admin/settings/match-promo-tab";
import { ProvidersTab } from "@/components/admin/settings/providers-tab";
import {
  useAdminMe,
  useAdminTeams,
  useCreateTeamMember,
  useUpdateAdminPassword,
  useUpdateAdminProfile,
} from "@/features/admin/hooks";
import { initialsFor } from "@/features/admin/session";
import type { AdminTeamMember } from "@/services/admin-resources";
import type { AdminUser } from "@/services/admin-auth";
import { Routes } from "@/routes";
import { cn } from "@/lib/utils";

const TEAM_COLUMNS: Column<AdminTeamMember>[] = [
  { key: "name", label: "Name", render: m => <span className="font-semibold">{m.name}</span> },
  { key: "email", label: "Email", render: m => m.email },
  {
    key: "role",
    label: "Role",
    nowrap: true,
    render: m => (
      <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
        {m.role}
      </span>
    ),
  },
  {
    key: "created",
    label: "Created",
    numeric: true,
    render: m => (m.created_at ? m.created_at.slice(0, 10) : "—"),
  },
];

type Tab =
  | "profile"
  | "teams"
  | "markup"
  | "discounts"
  | "providers"
  | "free-esim"
  | "match-promo"
  | "flight-promo"
  | "system";

export default function SettingsClient() {
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab | null) ?? "profile";

  return <SettingsTabs tab={tab} />;
}

function SettingsTabs({ tab }: { tab: Tab }) {
  const { openNav } = useAdminNav();
  const profile = useProfileForm();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <AdminPageHeader
        crumbs={["Dashboard", "Settings", tab]}
        title="Settings"
        tabs={[
          { label: "Profile", href: Routes.adminSettings, active: tab === "profile" },
          {
            label: "Teams",
            href: Routes.adminWithTab(Routes.adminSettings, "teams"),
            active: tab === "teams",
          },
          {
            label: "Markup",
            href: Routes.adminWithTab(Routes.adminSettings, "markup"),
            active: tab === "markup",
          },
          {
            label: "Discounts",
            href: Routes.adminWithTab(Routes.adminSettings, "discounts"),
            active: tab === "discounts",
          },
          {
            label: "Providers",
            href: Routes.adminWithTab(Routes.adminSettings, "providers"),
            active: tab === "providers",
          },
          {
            label: "Free eSIM",
            href: Routes.adminWithTab(Routes.adminSettings, "free-esim"),
            active: tab === "free-esim",
          },
          {
            label: "Match Promo",
            href: Routes.adminWithTab(Routes.adminSettings, "match-promo"),
            active: tab === "match-promo",
          },
          {
            label: "Flight Promo",
            href: Routes.adminWithTab(Routes.adminSettings, "flight-promo"),
            active: tab === "flight-promo",
          },
          {
            label: "System",
            href: Routes.adminWithTab(Routes.adminSettings, "system"),
            active: tab === "system",
          },
        ]}
        action={
          tab === "profile" ? (
            <AdminButton
              size="sm"
              onClick={profile.save}
              disabled={!profile.ready || profile.saving}
            >
              {profile.saving ? "Saving…" : "Save changes"}
            </AdminButton>
          ) : tab === "teams" ? (
            <AdminButton size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-3" />
              Add member
            </AdminButton>
          ) : undefined
        }
        onOpenNav={openNav}
      />

      <div className="flex-1 px-4 pb-5 pt-3 lg:px-[18px]">
        {tab === "profile" && <ProfileTab profile={profile} />}
        {tab === "teams" && <TeamsTab onAdd={() => setAddOpen(true)} />}
        {tab === "markup" && <MarkupTab />}
        {tab === "discounts" && <DiscountsTab />}
        {tab === "providers" && <ProvidersTab />}
        {tab === "free-esim" && <FreeEsimTab />}
        {tab === "match-promo" && <MatchPromoTab />}
        {tab === "flight-promo" && <FlightPromoTab />}
        {tab === "system" && (
          <UnavailableTab
            what="System settings"
            detail="This tab was a stub in the dashboard being replaced too — there is no system-settings endpoint. It is here to hold the slot, not to imply a feature."
          />
        )}
      </div>

      {addOpen && <TeamMemberSheet onClose={() => setAddOpen(false)} />}
    </>
  );
}

function TeamsTab({ onAdd }: { onAdd: () => void }) {
  const query = useAdminTeams();

  return (
    <>
      <QueryTable
        query={query}
        select={d => d.data}
        columns={TEAM_COLUMNS}
        rowKey={m => String(m.id)}
        endpoint="/v1/teams"
        emptyTitle="No team members yet"
        emptyBody="Invite colleagues to give them access to this dashboard."
        emptyAction={
          <AdminButton onClick={onAdd}>
            <Plus className="size-3.5" />
            Add member
          </AdminButton>
        }
      />
    </>
  );
}

function ProfileTab({ profile }: { profile: ProfileForm }) {
  const { admin, value, set } = profile;
  const [twoFactor, setTwoFactor] = useState(true);
  const [reviewEmails, setReviewEmails] = useState(true);
  const [digest, setDigest] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  const initials = admin?.name ? initialsFor(admin.name) : "GA";

  return (
    <>
        <div className="grid gap-3 xl:grid-cols-2">
          <Panel title="Profile">
            <div className="mb-3.5 flex items-center gap-3.5">
              <span className="flex size-12 items-center justify-center rounded-full bg-brand text-sm font-semibold text-brand-foreground shadow-[0_0_0_1px_var(--brand-edge)]">
                {initials}
              </span>
              {/* No "Change photo": the API has no avatar route (every
                  /v1/auth/admin/{avatar,photo} path is unregistered), and the
                  mark is drawn from the name, so editing the name changes it. */}
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-foreground">
                  {admin?.name ?? "—"}
                </p>
                <p className="truncate text-[11.5px] capitalize text-muted-foreground">
                  {admin?.role ?? "—"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <EditField label="First name" value={value.first} onChange={set("first")} />
              <EditField label="Last name" value={value.last} onChange={set("last")} />
              <EditField
                label="Email"
                type="email"
                value={value.email}
                onChange={set("email")}
                required
                help="Used for sign-in and system notifications."
                className="col-span-2"
              />
              {/* Role stays READ-ONLY. PATCH /v1/auth/admin/profile accepts
                  name and email only, so a select here would be a control
                  promising a change the endpoint silently drops. */}
              <Field label="Role" value={admin?.role ?? "—"} className="col-span-2" />
            </div>
          </Panel>

          <Panel title="Security">
            <div className="flex flex-col gap-3">
              <PasswordForm />
              <Toggle
                checked={twoFactor}
                onChange={() => setTwoFactor(v => !v)}
                label="Require 2FA for this account"
              />
            </div>

            <h2 className="mb-3 mt-5 text-[13px] font-semibold">Preferences</h2>
            <div className="flex flex-col gap-2.5">
              <Toggle
                checked={reviewEmails}
                onChange={() => setReviewEmails(v => !v)}
                label="Email me when an application needs review"
              />
              <Toggle
                checked={digest}
                onChange={() => setDigest(v => !v)}
                label="Weekly summary digest"
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11.5px] font-semibold">Theme</span>
                <div className="mt-0.5 flex gap-3.5">
                  {(["light", "dark", "system"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      className="flex items-center gap-2 text-[12.5px] capitalize"
                    >
                      <span
                        className={cn(
                          "flex size-3.5 items-center justify-center rounded-full bg-background shadow-[0_0_0_1px_var(--edge)]",
                          theme === t && "shadow-[0_0_0_1px_var(--brand-edge)]",
                        )}
                      >
                        {theme === t && <span className="size-[7px] rounded-full bg-brand" />}
                      </span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
    </>
  );
}

/* ── The signed-in admin's own details ────────────────────────────
   Lifted out of ProfileTab because "Save changes" lives in the page header,
   above the tab body. The alternative — a submit button inside the panel —
   would have meant two "save" affordances on one screen.

   The API stores ONE `name`. First/last are a display split, joined back on
   submit, so the backend never sees a field it cannot round-trip. */

interface ProfileForm {
  admin: AdminUser | undefined;
  value: { first: string; last: string; email: string };
  set: (key: "first" | "last" | "email") => (next: string) => void;
  save: () => void;
  saving: boolean;
  ready: boolean;
}

function useProfileForm(): ProfileForm {
  const { data: me } = useAdminMe();
  const admin = me?.data?.admin;
  const update = useUpdateAdminProfile();

  /* Edits are an OVERLAY on the fetched record, not a copy of it seeded by an
     effect. Copying would mean an effect that fires on every refetch and either
     clobbers what is being typed or needs a guard to stop it — and setState in
     an effect is a cascading render besides.
     A key is present in `edits` as soon as it is touched, so a field cleared on
     purpose stays empty rather than springing back to the server's value. */
  const [edits, setEdits] = useState<Partial<ProfileForm["value"]>>({});

  const base = useMemo(() => {
    const [first = "", ...rest] = (admin?.name ?? "").split(" ");
    return { first, last: rest.join(" "), email: admin?.email ?? "" };
  }, [admin]);

  const value = { ...base, ...edits };

  const set = (key: "first" | "last" | "email") => (next: string) =>
    setEdits(e => ({ ...e, [key]: next }));

  const save = () => {
    const name = [value.first.trim(), value.last.trim()].filter(Boolean).join(" ");
    const email = value.email.trim();
    if (!name) return toast.error("Enter a name.");
    if (!email) return toast.error("Enter an email address.");
    update.mutate({ name, email });
  };

  return { admin, value, set, save, saving: update.isPending, ready: admin !== undefined };
}

/* ── Password ──────────────────────────────────────────────
   Its own form and its own button: PATCH /v1/auth/admin/password is a separate
   endpoint from the profile PATCH, and a header button that fired both would
   make one failure look like two.

   EIGHT characters, not twelve. The previous copy asserted a 12-character
   minimum next to a permanently-red field; the endpoint's actual rule is
   `min:8` plus `confirmed`, which is also why there is a confirm box — without
   it every submit comes back "The password confirmation does not match." */
const MIN_PASSWORD = 8;

function PasswordForm() {
  const update = useUpdateAdminPassword();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD;
  const mismatch = confirm.length > 0 && confirm !== next;
  const ready =
    current.length > 0 && next.length >= MIN_PASSWORD && confirm === next;

  const submit = () => {
    if (!ready) return;
    update.mutate(
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
    <div className="flex flex-col gap-3">
      <EditField
        label="Current password"
        type="password"
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
      />
      <EditField
        label="New password"
        type="password"
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        help={`At least ${MIN_PASSWORD} characters.`}
        error={tooShort ? `Must be at least ${MIN_PASSWORD} characters.` : undefined}
      />
      <EditField
        label="Confirm new password"
        type="password"
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        error={mismatch ? "Both passwords must match." : undefined}
      />
      <AdminButton
        variant="outline"
        size="sm"
        onClick={submit}
        disabled={!ready || update.isPending}
      >
        {update.isPending ? "Updating…" : "Update password"}
      </AdminButton>
    </div>
  );
}

/* ── Add member ───────────────────────────────────────────
   POST /v1/teams wants name, email, role, password and password_confirmation.

   ROLE OPTIONS COME FROM THE TABLE, not from a list invented here. The endpoint
   does not validate `role` — it stored a deliberate nonsense value without
   complaint — so a free text box would let a typo create an account whose role
   matches nothing in features/scout/roles.ts and which lands nowhere. Offering
   the roles already in use, plus "admin", can only ever produce a value the
   dashboard already understands.

   The password is a plain field, shown, because the admin has to read it back
   to whoever they are inviting; it is sent as its own confirmation rather than
   asking them to type the same visible string twice. */
function TeamMemberSheet({ onClose }: { onClose: () => void }) {
  const query = useAdminTeams();
  const create = useCreateTeamMember();

  const roles = Array.from(
    new Set(["admin", ...(query.data?.data ?? []).map(m => m.role).filter(Boolean)]),
  );

  const sections: FormSection[] = [
    {
      title: "Member",
      fields: [
        { name: "name", label: "Full name", kind: "text", required: true, half: true },
        {
          name: "email",
          label: "Email",
          kind: "text",
          required: true,
          half: true,
          help: "The address they sign in with.",
        },
        { name: "role", label: "Role", kind: "select", required: true, options: roles },
        {
          name: "password",
          label: "Temporary password",
          kind: "text",
          required: true,
          help: `At least ${MIN_PASSWORD} characters. Share it with them — they can change it from this page once they sign in.`,
        },
      ],
    },
  ];

  return (
    <FormSheet
      title="New team member"
      subtitle="Creates a dashboard account straight away. There is no invitation email."
      sections={sections}
      submitLabel="Add member"
      onClose={onClose}
      onSubmit={values => {
        const password = String(values.password ?? "");
        if (password.length < MIN_PASSWORD) {
          toast.error(`Password must be at least ${MIN_PASSWORD} characters.`);
          return;
        }
        create.mutate(
          {
            name: String(values.name ?? "").trim(),
            email: String(values.email ?? "").trim(),
            role: String(values.role ?? "admin"),
            password,
            password_confirmation: password,
          },
          { onSuccess: onClose },
        );
      }}
    />
  );
}

/* The editable twin of <Field>. They share the ring/error treatment so a
   read-only value and an input sit on the same visual line — the reason the
   styles live in one string below rather than in each component. */
function EditField({
  label,
  value,
  onChange,
  type = "text",
  required,
  help,
  error,
  autoComplete,
  className,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: "text" | "email" | "password";
  required?: boolean;
  help?: string;
  error?: string;
  autoComplete?: string;
  className?: string;
}) {
  const id = `s-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[11.5px] font-semibold">
        {label}
        {required && <i className="not-italic text-destructive"> *</i>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={e => onChange(e.target.value)}
        className={cn(
          "h-8 rounded-md bg-background px-2.5 text-[12.5px] text-foreground outline-none",
          error
            ? "shadow-[0_0_0_1px_var(--destructive)]"
            : "shadow-[0_0_0_1px_var(--edge)] focus:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]",
        )}
      />
      {error ? (
        <span className="flex items-center gap-1 text-[10.5px] text-destructive">
          <CircleAlert className="size-2.5" />
          {error}
        </span>
      ) : (
        help && <span className="text-[10.5px] leading-snug text-muted-foreground">{help}</span>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  required,
  focused,
  help,
  error,
  className,
}: {
  label: string;
  value: string;
  required?: boolean;
  focused?: boolean;
  help?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[11.5px] font-semibold">
        {label}
        {required && <i className="not-italic text-destructive"> *</i>}
      </span>
      <span
        className={cn(
          "flex h-8 items-center rounded-md bg-background px-2.5 text-[12.5px] text-foreground",
          error
            ? "shadow-[0_0_0_1px_var(--destructive)]"
            : focused
              ? "shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]"
              : "shadow-[0_0_0_1px_var(--edge)]",
        )}
      >
        {value}
      </span>
      {/* Errors sit below the field with an icon — never colour-only, and the
          help slot is the same line so nothing shifts when one appears. */}
      {error ? (
        <span className="flex items-center gap-1 text-[10.5px] text-destructive">
          <CircleAlert className="size-2.5" />
          {error}
        </span>
      ) : (
        help && <span className="text-[10.5px] leading-snug text-muted-foreground">{help}</span>
      )}
    </div>
  );
}

/* A switch takes effect immediately; a checkbox is a value you submit. They
   are not interchangeable. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex items-center gap-2 text-left text-[12.5px]"
    >
      <span
        className={cn(
          "relative h-[17px] w-[30px] shrink-0 rounded-full transition-colors",
          checked
            ? "bg-brand shadow-[0_0_0_1px_var(--brand-edge)]"
            : "bg-muted shadow-[0_0_0_1px_var(--edge)]",
        )}
      >
        <span
          className={cn(
            "absolute top-px size-[13px] rounded-full bg-card shadow-sm transition-all",
            checked ? "left-[16px]" : "left-px",
          )}
        />
      </span>
      {label}
    </button>
  );
}
