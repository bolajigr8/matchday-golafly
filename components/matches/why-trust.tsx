"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Star,
  Headphones,
  Check,
  Lock,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { MATCH_WHY, TRUST_ITEMS } from "@/store/matches";

const TRUST_ICONS: Record<string, LucideIcon> = {
  shield: Shield,
  star: Star,
  headset: Headphones,
  check: Check,
  lock: Lock,
  bolt: Zap,
};

export function WhyGolafly() {
  return (
    <section className="bg-muted/40 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-6">
        <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text">
          Why book with us
        </p>
        <h2 className="mb-10 font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
          Why book with Golafly?
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {MATCH_WHY.map((r, i) => (
            <motion.div
              key={r.k}
              className="rounded-2xl border border-border bg-card p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span className="mb-3 block font-heading text-3xl font-extrabold tracking-tight text-brand-text">
                {r.k}
              </span>
              <h3 className="mb-2 font-heading text-base font-bold uppercase tracking-wide text-foreground">
                {r.t}
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{r.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  return (
    <section aria-label="Trust signals" className="border-y border-border bg-background py-14">
      <div className="page-container grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TRUST_ITEMS.map((it) => {
          const Icon = TRUST_ICONS[it.icon] ?? Check;
          return (
            <div key={it.t} className="flex flex-col items-center gap-2 px-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-brand-text">
                <Icon className="size-5" strokeWidth={2} />
              </span>
              <span className="font-heading text-[11px] font-bold uppercase leading-tight tracking-wide text-foreground">
                {it.t}
              </span>
              <span className="max-w-[160px] text-[10px] leading-relaxed text-muted-foreground">
                {it.d}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
