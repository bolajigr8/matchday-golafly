"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

/* A one-time code, one box per digit, in the auth screens' style.
 *
 * Typing moves to the next box, Backspace on an empty box moves back, and
 * pasting the whole code (from the email) fills every box at once — the way
 * most people will actually enter it. */
export function OtpInput({
  value,
  onChange,
  length = 6,
  error,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const setAt = (i: number, d: string) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, length));
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label={`${length}-digit code`}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          onChange={e => {
            const only = e.target.value.replace(/\D/g, "");
            if (!only) return setAt(i, "");
            setAt(i, only.slice(-1));
            focus(i + 1);
          }}
          onKeyDown={e => {
            if (e.key === "Backspace" && !d) {
              e.preventDefault();
              setAt(i - 1, "");
              focus(i - 1);
            } else if (e.key === "ArrowLeft") focus(i - 1);
            else if (e.key === "ArrowRight") focus(i + 1);
          }}
          onPaste={e => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (!pasted) return;
            e.preventDefault();
            onChange(pasted);
            focus(pasted.length);
          }}
          onFocus={e => e.target.select()}
          className={cn(
            "h-12 w-full min-w-0 rounded-[14px] border bg-card text-center font-heading text-[18px] font-bold text-foreground outline-none transition-shadow focus:shadow-[0_0_0_3px_var(--brand-glow)]",
            error
              ? "border-[var(--status-danger)]"
              : "border-[var(--edge-strong)] focus:border-[var(--brand-edge)]",
          )}
        />
      ))}
    </div>
  );
}
