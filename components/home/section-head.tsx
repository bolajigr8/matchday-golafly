"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* Section header used across the home page and a few landing pages.

   align="center" (default) — the original centered header, unchanged API.
   align="left"   — footballticketnet-style: eyebrow + title + subtitle on
                    the left, an optional "See all →" action (and any extra
                    controls via `aside`) on the right, dropping under the
                    title on phones.

   Neon is never type on a light page: the eyebrow is ink text with a neon
   dot (fill). In dark mode the eyebrow may carry the accessible lime. */

export const SECTION_TITLE_CLASS =
  "font-heading text-[30px] font-bold leading-[1.02] tracking-[-0.02em] text-balance text-foreground sm:text-[40px] lg:text-[46px]";

export interface SectionHeadAction {
  href: string;
  label: string;
}

export function SectionEyebrow({
  children,
  tone = "default",
  className,
}: {
  children: ReactNode;
  /** "ink" for dark ink bands, where neon may be used as text. */
  tone?: "default" | "ink";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em]",
        tone === "ink" ? "text-primary" : "text-foreground/70 dark:text-brand-text",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-primary",
          tone === "ink" ? "" : "ring-1 ring-brand-edge dark:ring-0",
        )}
      />
      {children}
    </p>
  );
}

export function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = "center",
  action,
  aside,
  titleId,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  /** Left-aligned headers only: the "See all →" link on the right. */
  action?: SectionHeadAction;
  /** Left-aligned headers only: extra controls shown before the action. */
  aside?: ReactNode;
  /** id for the <h2>, so the section can be aria-labelledby it. */
  titleId?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (align === "left") {
    return (
      <motion.div
        className={cn(
          "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
          className,
        )}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-2xl">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h2 id={titleId} className={cn(SECTION_TITLE_CLASS, "mt-4")}>
            {title}
          </h2>
          {subtitle && (
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          )}
        </div>

        {(action || aside) && (
          <div className="flex shrink-0 items-center gap-3">
            {aside}
            {action && (
              <Link
                href={action.href}
                className="group inline-flex h-10 items-center gap-1.5 rounded-full border border-foreground/15 px-4 text-[13px] font-semibold text-foreground transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {action.label}
                <ArrowRight
                  aria-hidden
                  className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                  strokeWidth={2.25}
                />
              </Link>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("mx-auto max-w-2xl space-y-3 text-center", className)}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionEyebrow className="justify-center sm:text-xs">{eyebrow}</SectionEyebrow>
      <h2 id={titleId} className={SECTION_TITLE_CLASS}>
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      )}
    </motion.div>
  );
}
