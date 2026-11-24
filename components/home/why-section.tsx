"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Headset, Layers, ShieldCheck } from "lucide-react";
import { WHY_STEPS } from "@/store/matchday";
import { SectionHead } from "./section-head";

/* Why Golafly — a numbered feature row (4 → 2 → 1 columns) with hairline
   dividers. Copy lives in WHY_STEPS (store/matchday.ts); icons follow its
   order: sourcing, one checkout, guarantee, support. */

const ICONS = [BadgeCheck, Layers, ShieldCheck, Headset] as const;

export function WhySection() {
  const reduce = useReducedMotion();

  return (
    <section aria-labelledby="why-golafly-title">
      <SectionHead
        align="left"
        titleId="why-golafly-title"
        eyebrow="Why Golafly"
        title="Booked the right way."
        subtitle="Verified tickets, one checkout for the whole trip, and support around the clock."
      />

      <ol className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-border bg-border sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
        {WHY_STEPS.map((step, i) => {
          const Icon = ICONS[i % ICONS.length];
          return (
            <li key={step.num} className="bg-card">
              <motion.div
                className="flex h-full flex-col p-6 sm:p-8"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    aria-hidden
                    className="font-display text-[44px] leading-none tracking-[0.02em] text-foreground"
                  >
                    {step.num}
                  </span>
                  <span
                    aria-hidden
                    className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_var(--brand-edge)]"
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                </div>
                <h3 className="mt-8 font-heading text-[19px] font-semibold tracking-[-0.01em] text-foreground sm:mt-10">
                  {step.title}
                </h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
