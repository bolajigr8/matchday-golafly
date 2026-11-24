"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthField, AuthShell, AuthSubmit } from "@/components/fan/auth-shell";
import { SIGNUP_ROLE } from "@/features/scout/roles";
import { useFanRegister } from "@/features/fan/hooks";
import { fanApiMessage } from "@/services/fan-axios";
import { Routes } from "@/routes";

/* Registration is for FANS only. Scouts are given their login details by a
   Golafly admin, and players are onboarded through Golafly's own flow, so
   neither signs up here — which is why there is no "what brings you here"
   question any more. Every account created on this page is sent as a fan.

   Registration signs the user straight in: the API returns a token with the
   new user, so making them type their password again would be theatre. */
export default function RegisterClient() {
  const register = useFanRegister();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const ready = !!name && !!email && password.length >= 8 && password === confirm;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || register.isPending) return;
    register.mutate({
      name,
      email,
      password,
      password_confirmation: confirm,
      role: SIGNUP_ROLE,
    });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Match tickets, flights, stays and eSIMs — all in one place."
      error={register.isError ? fanApiMessage(register.error) : null}
      footer={
        <>
          Already have one?{" "}
          <Link href={Routes.login} className="font-semibold text-brand-text">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
        <AuthField
          label="Full name"
          autoComplete="name"
          placeholder="Adaeze Okonkwo"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 8 characters."
          error={tooShort ? "Use at least 8 characters." : undefined}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <AuthField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={mismatch ? "Passwords don’t match." : undefined}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />

        <AuthSubmit pending={register.isPending} disabled={!ready}>
          {register.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Creating your account…
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="size-4" />
            </>
          )}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
