"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useAdminLogin } from "@/features/admin/hooks";
import { AdminButton } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export default function AdminLoginClient() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const login = useAdminLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && !/^\S+@\S+\.\S+$/.test(email);
  const passwordInvalid = touched && password.length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length === 0) return;
    login.mutate({ email, password });
  };

  return (
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-7 flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight">GOLAFLY</span>
          <span className="rounded-full px-[7px] py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
            Admin
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-[-0.03em]">Sign in</h1>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          {nextPath
            ? "Your session expired. Sign in to pick up where you left off."
            : "Use the credentials issued to your Golafly admin account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-[11.5px] font-semibold">
              Email <i className="not-italic text-destructive">*</i>
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@golafly.com"
              className={cn(
                "h-9 rounded-md bg-background px-2.5 text-[12.5px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground",
                emailInvalid
                  ? "shadow-[0_0_0_1px_var(--destructive)]"
                  : "shadow-[0_0_0_1px_var(--edge)] focus:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]",
              )}
            />
            {emailInvalid && (
              <span className="flex items-center gap-1 text-[10.5px] text-destructive">
                <CircleAlert className="size-2.5" />
                Enter a valid email address.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-password" className="text-[11.5px] font-semibold">
              Password <i className="not-italic text-destructive">*</i>
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••"
                className={cn(
                  "h-9 w-full rounded-md bg-background pl-2.5 pr-9 text-[12.5px] text-foreground outline-none transition-shadow placeholder:text-muted-foreground",
                  passwordInvalid
                    ? "shadow-[0_0_0_1px_var(--destructive)]"
                    : "shadow-[0_0_0_1px_var(--edge)] focus:shadow-[0_0_0_1px_var(--ring),0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {passwordInvalid && (
              <span className="flex items-center gap-1 text-[10.5px] text-destructive">
                <CircleAlert className="size-2.5" />
                Enter your password.
              </span>
            )}
          </div>

          <AdminButton
            type="submit"
            size="default"
            disabled={login.isPending}
            className="mt-1 h-9 w-full"
          >
            {login.isPending && <LoaderCircle className="size-3.5 animate-spin" />}
            {login.isPending ? "Signing in…" : "Sign in"}
          </AdminButton>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-muted-foreground">
          Admin accounts are issued by the Golafly team. There is no self-service
          signup and no password reset from this screen.
        </p>
      </div>
    </div>
  );
}
