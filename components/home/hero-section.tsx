"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { IMAGES } from "@/store/matchday";

export function HeroSection() {
  return (
    <motion.div
      className="relative mx-auto mt-6 overflow-hidden rounded-2xl border border-white/8 bg-black/40 backdrop-blur sm:mt-8"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      {/* Background layers */}
      <div className="absolute inset-0">
        <img src={IMAGES.heroBg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundImage: `url(${IMAGES.heroGrad})` }} />
        <div
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full"
          style={{ backgroundImage: `url(${IMAGES.heroGlow})`, backgroundSize: "cover" }}
        />
        {/* Extra gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-4 p-5 sm:space-y-6 sm:p-9">
        {/* Badges */}
        <motion.div
          className="flex flex-wrap gap-2 sm:gap-3"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          {["Featured Experience", "Champions League Final 2026"].map((badge) => (
            <div
              key={badge}
              className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 sm:py-1.5"
            >
              <p className="text-[10px] font-mono tracking-wider text-primary sm:text-xs">{badge}</p>
            </div>
          ))}
        </motion.div>

        {/* Match name */}
        <motion.div
          className="space-y-1.5 sm:space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
        >
          <p className="text-2xl font-bold text-white sm:text-4xl">
            Real Madrid{" "}
            <span className="text-xs text-muted-foreground">VS</span>{" "}
            Man City
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            May 31, 2026 · Allianz Arena, Munich · Kick-off 20:45 CET
          </p>
        </motion.div>

        {/* Price & Scarcity */}
        <motion.div
          className="flex flex-wrap items-center gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.4 }}
        >
          <div>
            <p className="text-2xl font-bold text-primary sm:text-3xl">From €850</p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <motion.div
            className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          >
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <p className="text-xs font-mono text-red-500">Only 42 tickets left</p>
          </motion.div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="flex flex-wrap gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/seats"
              className="inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)] sm:px-6 sm:py-3"
            >
              Book This Match
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/match/1"
              className="inline-block rounded-full border border-primary/40 px-5 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary/10 sm:px-6 sm:py-3"
            >
              View Details
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
