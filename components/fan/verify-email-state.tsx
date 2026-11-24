"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MailCheck } from "lucide-react";
import { FanState } from "@/components/fan/query-state";
import { isEmailNotVerified, verifyEmailHref } from "@/features/fan/verification";
import { useFanAuth } from "@/store/fan-auth";

/* Shown when an account API answers 403 `email_not_verified`: the account
   must enter the 6-digit code from its email first. Not an error; a step. */
export function VerifyEmailState() {
  const pathname = usePathname();
  const email = useFanAuth((s) => s.user?.email);
  return (
    <FanState
      icon={<MailCheck className="size-5" />}
      tone="warn"
      title="Verify your email first"
      body="Enter the 6-digit code we emailed you to open your account. You can ask for a new code on the next screen."
    >
      <Link
        href={verifyEmailHref({ email, next: pathname })}
        className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[13px] font-semibold text-primary-foreground"
      >
        Verify my email
      </Link>
    </FanState>
  );
}

/** For an error branch: the verify step when that is what the API asked for. */
export function verifyStateFor(error: unknown) {
  return isEmailNotVerified(error) ? <VerifyEmailState /> : null;
}
