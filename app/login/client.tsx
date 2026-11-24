"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthField, AuthShell, AuthSubmit } from "@/components/fan/auth-shell";
import { useFanLogin } from "@/features/fan/hooks";
import { fanApiMessage } from "@/services/fan-axios";
import { Routes } from "@/routes";

/* Scenario 1: given a fan account, when the user logs in, then the user is
   redirected to the Fan Dashboard.
 *
 * The redirect itself lives in features/fan/hooks.ts — it honours the `next`
 * param the route guard set, but only for same-origin paths. */
export default function LoginClient() {
  const login = useFanLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || login.isPending) return;
    login.mutate({ email, password });
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Your tickets and trips are waiting."
      error={login.isError ? fanApiMessage(login.error) : null}
      footer={
        <>
          New here?{" "}
          <Link href={Routes.register} className="font-semibold text-brand-text">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <Link
          href={Routes.forgotPassword}
          className="self-end text-xs font-semibold text-brand-text"
        >
          Forgot password?
        </Link>

        <AuthSubmit pending={login.isPending} disabled={!email || !password}>
          {login.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4" />
            </>
          )}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
