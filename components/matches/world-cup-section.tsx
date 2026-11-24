"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WC_MATCHES, type WcMatch } from "@/store/matches";
import { MatchCard } from "./match-card";
import { useCurrencyStore } from "@/store/currency";

export function WorldCupSection({ onBook }: { onBook?: (m: WcMatch) => void }) {
  // These are static demo fixtures (see store/matches.ts) with no real
  // backend event behind them, so there's nothing to actually re-price —
  // passing the current selection at least keeps the SYMBOL consistent
  // with the rest of the homepage instead of always showing €. The
  // number itself stays a fixed placeholder either way; flag before
  // launch whether this section should be hidden or wired to real
  // listings instead.
  const currency = useCurrencyStore((s) => s.currency)
  const [group, setGroup] = useState("All");

  const groups = useMemo(
    () => ["All", ...Array.from(new Set(WC_MATCHES.map((m) => m.group))).sort()],
    [],
  );
  const visible = WC_MATCHES.filter((m) => group === "All" || m.group === group);

  return (
    <section
      id="world-cup"
      className="scroll-mt-24 bg-gradient-to-b from-background to-muted/40 py-20 sm:py-24"
    >
      <div className="page-container">
        {/* Head */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <motion.div
            className="max-w-xl"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-2.5 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text">
              <span aria-hidden>★</span> FIFA World Cup 2026
            </p>
            <h2 className="mb-2 font-heading text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              USA · Canada
              <br />
              <span className="text-brand-text">· Mexico</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              48 nations, 104 matches across 16 host cities. Secure your place at the biggest
              football tournament ever staged. June 11 – July 19, 2026.
            </p>
          </motion.div>

          {/* Group filter */}
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by group">
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={cn(
                  "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-all",
                  group === g
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {g === "All" ? "All Groups" : "Group " + g}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((m, i) => (
            <MatchCard
              key={m.id}
              matchId={String(m.id)}
              index={i}
              home={m.home}
              away={m.away}
              img={m.banner}
              info={`${m.date} · ${m.kickoff} · ${m.venue}`}
              badgeLabel={`Group ${m.group}`}
              badgeColor="neon"
              priceFrom={m.priceFrom}
              currency={currency}
              hot
              onBook={() => onBook?.(m)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
