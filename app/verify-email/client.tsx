"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, LoaderCircle, MailCheck, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { AuthField, AuthShell, AuthSubmit } from "@/components/fan/auth-shell";
import { OtpInput } from "@/components/fan/otp-input";
import {
  useFanLogout,
  useFanResendVerification,
  useFanVerifyEmail,
  useHydratedFan,
} from "@/features/fan/hooks";
import { useFanAuth } from "@/store/fan-auth";
import { homeForRole } from "@/features/scout/roles";
import {
  CODE_LENGTH,
  RESEND_WAIT_SECONDS,
  errorReason,
  needsNewCode,
  retryAfterSeconds,
  verificationMessage,
} from "@/features/fan/verification";
import { Routes } from "@/routes";

/* Email verification (MatchDay Email verification collection).
 *
 * Register and login send an unverified account here with `?email=` (and
 * `next`, where they were headed). The API has already emailed a 6-digit
 * code, valid 15 minutes, so the page starts with the resend button waiting
 * out the API's 60-second gap rather than sending a second code at once.
 * Both calls are public: someone signed out can still verify from the
 * emailed address. */
export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasHydrated } = useHydratedFan();
  const setEmailVerified = useFanAuth((s) => s.setEmailVerified);
  const signOut = useFanLogout();

  const emailFromLink = searchParams.get("email") ?? "";
  const [typedEmail, setTypedEmail] = useState("");
  const email = (emailFromLink || user?.email || typedEmail).trim();
  const knownEmail = !!(emailFromLink || user?.email);

  const next = searchParams.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const destination = safeNext ?? (user ? homeForRole(user.role) : Routes.login);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expiredCode, setExpiredCode] = useState(false);
  const [done, setDone] = useState(false);
  /* Seconds until another code may be asked for. A code went out just
     before this page opened (register/login), so start with the wait. */
  const [wait, setWait] = useState(knownEmail ? RESEND_WAIT_SECONDS : 0);
  const [sentAgain, setSentAgain] = useState(false);

  const verify = useFanVerifyEmail();
  const resend = useFanResendVerification();

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  const finish = (message: string) => {
    if (user && user.email.toLowerCase() === email.toLowerCase()) setEmailVerified(true);
    setDone(true);
    toast.success(message);
    window.setTimeout(() => router.replace(destination), 900);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || code.length !== CODE_LENGTH || verify.isPending) return;
    setError(null);
    verify.mutate(
      { email, code },
      {
        onSuccess: () => finish("Email verified"),
        onError: (err) => {
          const reason = errorReason(err);
          if (reason === "email_already_verified") return finish("Your email is already verified");
          setError(verificationMessage(err, "We couldn’t check that code. Please try again."));
          const stale = needsNewCode(reason);
          setExpiredCode(stale);
          /* This code is spent: let them ask for a new one now. If it is too
             soon, the API's 429 carries the real wait (handled below). */
          if (stale) setWait(0);
          setCode("");
        },
      },
    );
  };

  const askForCode = () => {
    if (!email || wait > 0 || resend.isPending) return;
    setError(null);
    resend.mutate(email, {
      onSuccess: (res) => {
        setSentAgain(true);
        setExpiredCode(false);
        setCode("");
        setWait(res.data?.resend_after_seconds || RESEND_WAIT_SECONDS);
        toast.success("New code sent", { description: `Check ${email}.` });
      },
      onError: (err) => {
        const after = retryAfterSeconds(err);
        if (after) setWait(after);
        setError(verificationMessage(err, "We couldn’t send a new code. Please try again."));
      },
    });
  };

  if (done) {
    return (
      <AuthShell title="Email verified" subtitle="Thanks. Taking you to your account…">
        <div className="mt-6 flex justify-center text-emerald-500">
          <CheckCircle2 className="size-12" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={
        knownEmail
          ? `We sent a ${CODE_LENGTH}-digit code to ${email}. It expires in 15 minutes.`
          : `Enter your email and the ${CODE_LENGTH}-digit code we sent you.`
      }
      error={error}
      footer={
        user ? (
          <>
            Wrong account?{" "}
            <button type="button" onClick={signOut} className="font-semibold text-brand-text">
              Sign out
            </button>
          </>
        ) : (
          <Link href={Routes.login} className="font-semibold text-brand-text">
            Back to sign in
          </Link>
        )
      }
    >
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3.5">
        {!knownEmail && hasHydrated && (
          <AuthField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            required
          />
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-foreground">Code</span>
          <OtpInput value={code} onChange={setCode} length={CODE_LENGTH} autoFocus={knownEmail} error={!!error && !expiredCode} />
          <div className="flex items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MailCheck className="size-3.5 shrink-0" />
              {sentAgain ? "New code sent. Check your spam folder too." : "Not there? Check your spam folder."}
            </span>
            <button
              type="button"
              disabled={!email || wait > 0 || resend.isPending}
              onClick={askForCode}
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-text disabled:opacity-50"
            >
              {resend.isPending ? <LoaderCircle className="size-3 animate-spin" /> : <RotateCw className="size-3" />}
              {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
            </button>
          </div>
        </div>

        <AuthSubmit pending={verify.isPending} disabled={!email || code.length !== CODE_LENGTH}>
          {verify.isPending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" />
              Checking…
            </>
          ) : (
            <>
              Verify email
              <ArrowRight className="size-4" />
            </>
          )}
        </AuthSubmit>

        <p className="text-center text-[11.5px] leading-relaxed text-muted-foreground">
          You can still book tickets while you verify. Your account pages open once your email is verified.
        </p>
      </form>
    </AuthShell>
  );
}
