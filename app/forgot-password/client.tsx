"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { AuthField, AuthShell, AuthSubmit } from "@/components/fan/auth-shell";
import { useFanForgotPassword } from "@/features/fan/hooks";
import { fanApiMessage } from "@/services/fan-axios";
import { Routes } from "@/routes";

/* Step 1 of a password reset. The API emails a 6-digit code, so on success
   the fan goes straight to the code screen with their email carried over.
   The next screen stays vague about whether the address has an account —
   "no account with that email" would let anyone test a list of addresses. */
export default function ForgotPasswordClient() {
  const router = useRouter();
  const forgot = useFanForgotPassword();
  const [email, setEmail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || forgot.isPending) return;
    forgot.mutate(
      { email },
      {
        onSuccess: response => {
          const params = new URLSearchParams({ email: email.trim() });
          const minutes = response.data?.expires_in_minutes;
          if (minutes) params.set("expires", String(minutes));
          router.push(`${Routes.resetPassword}?${params}`);
        },
      },
    );
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll email you a 6-digit code to choose a new one."
      error={forgot.isError ? fanApiMessage(forgot.error) : null}
      footer={
        <Link href={Routes.login} className="font-semibold text-brand-text">
          Back to sign in
        </Link>
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
        <AuthSubmit pending={forgot.isPending} disabled={!email}>
          {forgot.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              Send code
              <ArrowRight className="size-4" />
            </>
          )}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
