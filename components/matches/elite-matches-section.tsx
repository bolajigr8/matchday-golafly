"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CLUB_MATCHES, TOURNAMENT_FILTERS, type ClubMatch } from "@/store/matches";
import { MatchCard } from "./match-card";
import { useCurrencyStore } from "@/store/currency";

export function EliteMatchesSection({ onBook }: { onBook?: (m: ClubMatch) => void }) {
  // Same stopgap as WorldCupSection — see the comment there. Static demo
  // data, so only the symbol can honestly follow the picker; the number
  // is still a fixed placeholder.
  const currency = useCurrencyStore((s) => s.currency)
  const [filter, setFilter] = useState<string>("All");
  const visible = CLUB_MATCHES.filter((m) => filter === "All" || m.comp.includes(filter));

  return (
    <section id="matches" className="scroll-mt-24 bg-background py-20 sm:py-24">
      <div className="page-container">
        {/* Head */}
        <motion.div
          className="mb-7"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-brand-text">
            Top Fixtures
          </p>
          <h2 className="mb-2 font-heading text-3xl font-bold uppercase leading-[1.1] tracking-tight text-foreground sm:text-4xl">
            Europe&apos;s Elite Matches
          </h2>
          <p className="text-sm text-muted-foreground">
            Champions League, Premier League, La Liga, Serie A and more — curated by Golafly.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-3">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            Filter:
          </span>
          {TOURNAMENT_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-1.5 font-heading text-xs font-semibold transition-all",
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
            {visible.length} match{visible.length === 1 ? "" : "es"}
          </span>
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
              img={m.img}
              info={`${m.date} · ${m.venue}`}
              badgeLabel={m.compShort}
              badgeColor={m.badge}
              priceFrom={m.priceFrom}
              currency={currency}
              hot={m.hot}
              soldOut={m.soldOut}
              onBook={() => onBook?.(m)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
