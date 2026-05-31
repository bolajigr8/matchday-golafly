"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Match } from "@/store/matchday";

export function MatchCard({ match, index = 0 }: { match: Match; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/match/${match.id}`} className="block group">
        <motion.div
          className="relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/80"
          whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.15)" }}
          transition={{ duration: 0.25 }}
        >
          {/* Image */}
          {!match.soldOut && match.image && (
            <div className="relative h-32 w-full overflow-hidden sm:h-36">
              <motion.img
                src={match.image}
                alt={`${match.team1} vs ${match.team2}`}
                className="h-full w-full object-cover"
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.45 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span
                className="absolute left-2.5 top-2.5 text-xs font-mono tracking-wider"
                style={{ color: match.leagueColor }}
              >
                {match.league}
              </span>
            </div>
          )}

          {/* Body */}
          <div className="space-y-2.5 p-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm font-bold text-foreground">
                <span className="truncate">{match.team1}</span>
                <span className="shrink-0 text-xs text-muted-foreground">vs</span>
                <span className="truncate text-right">{match.team2}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {match.date} · {match.venue}
              </p>
            </div>

            {!match.soldOut ? (
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">From {match.price}</p>
                <div
                  className="rounded-full border border-border/40 px-2 py-1 text-xs font-mono"
                  style={{ color: match.availabilityColor }}
                >
                  {match.availability}% left{match.availability < 30 ? "!" : ""}
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-muted-foreground">Sold Out</p>
            )}

            {/* Availability bar */}
            {!match.soldOut && (
              <div className="h-1 w-full overflow-hidden rounded-full bg-border/30">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: match.availabilityColor }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${match.availability}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: index * 0.07 + 0.2, ease: "easeOut" }}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-border px-4 py-3">
            {match.soldOut ? (
              <motion.button
                onClick={(e) => e.preventDefault()}
                className="flex-1 rounded-full border border-border py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
                whileTap={{ scale: 0.97 }}
              >
                View Details
              </motion.button>
            ) : (
              <>
                <motion.button
                  onClick={(e) => e.preventDefault()}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-border/80 hover:text-foreground"
                  whileTap={{ scale: 0.97 }}
                >
                  More Info
                </motion.button>
                <motion.button
                  onClick={(e) => e.preventDefault()}
                  className="flex-1 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md transition-all hover:shadow-[0_0_14px_rgba(183,255,0,0.4)]"
                  whileTap={{ scale: 0.97 }}
                >
                  Book This Match
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
