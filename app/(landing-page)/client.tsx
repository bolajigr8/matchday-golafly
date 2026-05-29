"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HeroSection } from "@/components/home/hero-section";
import { MatchCard } from "@/components/home/match-card";
import { IMAGES, MATCHES } from "@/store/matchday";

const FILTERS = ["All", "Champions League", "Premier League", "La Liga", "Serie A", "Bundesliga"] as const;

export default function MatchdayClient() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="relative min-h-screen bg-background">
      {/* ── Single canonical container for the whole home page ── */}
      <div className="page-container py-10 sm:py-12">

        {/* Header */}
        <motion.div
          className="space-y-2 py-4 text-center sm:space-y-3 sm:py-6"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] font-mono tracking-widest text-primary sm:text-xs">
            Matchday Builder
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your Full Football Experience
          </h1>
          <p className="text-sm text-muted-foreground">
            Tickets · Hotel · Flights — all in one place
          </p>
        </motion.div>

        {/* Hero */}
        <HeroSection />

        {/* Search bar */}
        <motion.div
          className="mt-8 space-y-3 sm:mt-10 sm:space-y-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
        >
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-home-panel-border bg-home-panel p-2.5 shadow-sm shadow-foreground/5 backdrop-blur-md dark:shadow-none sm:gap-3 sm:p-3">
            <input
              type="text"
              placeholder="Team, match or competition"
              className="min-w-0 flex-1 basis-[min(100%,10rem)] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />
            <select className="min-w-0 shrink-0 bg-transparent text-xs font-mono text-muted-foreground outline-none">
              <option>All Competitions</option>
            </select>
            <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />
            <motion.button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary px-3 py-2 sm:px-4"
              aria-label="Search"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
            >
              <Search className="h-4 w-4 text-primary-foreground" />
            </motion.button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <p className="text-xs font-mono tracking-wide text-muted-foreground">Filter:</p>
            {FILTERS.map(f => (
              <motion.button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === f
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground",
                )}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                {f}
              </motion.button>
            ))}
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <p className="text-xs font-mono tracking-wide text-muted-foreground">Sort:</p>
              <motion.button
                type="button"
                className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
              >
                Date
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Promo banner */}
        <motion.div
          className="relative mt-6 overflow-hidden rounded-xl border border-home-panel-border bg-home-panel p-4 shadow-sm shadow-foreground/5 backdrop-blur-sm dark:shadow-none sm:mt-8 sm:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
        >
          <div
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-2xl"
            style={{ backgroundImage: `url(${IMAGES.pseudoBefore})`, backgroundSize: "cover" }}
          />
          <div className="relative z-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
            <motion.div
              className="rounded-lg border border-primary/40 bg-primary/10 p-2.5 sm:p-3"
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
            >
              <Search className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
            </motion.div>
            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
              <p className="font-bold text-foreground">Instant Confirmation</p>
              <p className="text-xs text-muted-foreground">Secure checkout — your tickets are guaranteed</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {["Browse Matches", "Learn More"].map((label, i) => (
                <motion.button
                  key={label}
                  type="button"
                  className={cn(
                    "rounded-full px-5 py-2 text-sm font-bold transition-all",
                    i === 0
                      ? "bg-primary text-primary-foreground shadow-lg hover:shadow-[0_0_16px_rgba(183,255,0,0.4)]"
                      : "border border-primary/40 text-primary hover:bg-primary/10",
                  )}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Match cards grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 pb-12 sm:grid-cols-2 sm:gap-5 sm:pb-16 lg:grid-cols-3 lg:gap-6">
          {MATCHES.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
