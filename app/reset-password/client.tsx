"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import { AuthField, AuthShell, AuthSubmit } from "@/components/fan/auth-shell";
import { OtpInput } from "@/components/fan/otp-input";
import { useFanForgotPassword, useFanResetPassword } from "@/features/fan/hooks";
import { fanApiMessage } from "@/services/fan-axios";
import { Routes } from "@/routes";

/* Step 2 of a password reset: the code from the email, then a new password.
 *
 * POST /v1/auth/forgot-password emails a 6-digit code (reason: code_sent), and
 * POST /v1/auth/reset-password takes it as `token`. The forgot page sends the
 * fan here with `?email=`; an older emailed link carrying `token` too still
 * works — it simply prefills the code. */

const CODE_LENGTH = 6;

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const emailFromLink = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailFromLink);
  const [code, setCode] = useState(searchParams.get("token") ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const expires = searchParams.get("expires");

  const reset = useFanResetPassword();
  const resend = useFanForgotPassword();

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < 8;
  const ready =
    !!email && code.length === CODE_LENGTH && password.length >= 8 && password === confirm;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || reset.isPending) return;
    reset.mutate({ email, token: code, password, password_confirmation: confirm });
  };

  return (
    <AuthShell
      title="Enter your code"
      subtitle={
        emailFromLink
          ? `We sent a ${CODE_LENGTH}-digit code to ${emailFromLink}${expires ? `. It expires in ${expires} minutes.` : "."}`
          : `Enter your email and the ${CODE_LENGTH}-digit code we sent you.`
      }
      error={reset.isError ? fanApiMessage(reset.error) : null}
      footer={
        <Link href={Routes.login} className="font-semibold text-brand-text">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
        {!emailFromLink && (
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Code</span>
          <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} autoFocus={!!emailFromLink} />
          <div className="flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <span>Not there? Check your spam folder.</span>
            <button
              type="button"
              disabled={!email || resend.isPending}
              onClick={() => resend.mutate({ email })}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-text disabled:opacity-50"
            >
              {resend.isPending ? <LoaderCircle className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
              {resend.isSuccess && !resend.isPending ? "Code sent" : "Resend code"}
            </button>
          </div>
        </div>

        <AuthField
          label="New password"
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
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={mismatch ? "Passwords don’t match." : undefined}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />

        <AuthSubmit pending={reset.isPending} disabled={!ready}>
          {reset.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Updating…
            </>
          ) : (
            <>
              Update password
              <ArrowRight className="size-4" />
            </>
          )}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
