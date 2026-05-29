"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { STAY_RESULTS } from "@/store/travel";

import { StaySearchBar }      from "@/components/stays/search-bar";
import { StayFiltersSidebar } from "@/components/stays/filters-sidebar";
import { HotelCard }          from "@/components/stays/hotel-card";
import { StayMapView, StayPriceInsights } from "@/components/stays/price-insights";

export function StaysClient() {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeTypes,   setActiveTypes]   = useState<string[]>(["Hotel"]);

  const toggleFilter = (f: string) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  const toggleType   = (t: string) =>
    setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  return (
    <div className="min-h-screen bg-background">
      {/* Search bar */}
      <StaySearchBar />

      {/* Main layout */}
      <div className="page-container py-6 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_260px]">

          {/* Filters sidebar — full on lg, hidden on mobile */}
          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
          >
            <StayFiltersSidebar
              activeFilters={activeFilters}
              toggleFilter={toggleFilter}
              activeTypes={activeTypes}
              toggleType={toggleType}
            />
          </motion.div>

          {/* Mobile quick filters */}
          <div className="flex flex-wrap gap-2 lg:hidden">
            {["Hotel", "Apartment", "Villa"].map(t => (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] font-bold transition-colors ${
                  activeTypes.includes(t)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-4">
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.38 }}
            >
              <div>
                <h2 className="text-[16px] font-bold text-foreground">Our top picks</h2>
                <p className="font-mono text-[10px] tracking-wide text-muted-foreground">
                  <span className="font-bold text-foreground">{STAY_RESULTS.length}</span> properties found
                </p>
              </div>
            </motion.div>

            <div className="space-y-4">
              {STAY_RESULTS.map((stay, i) => <HotelCard key={stay.id} stay={stay} index={i} />)}
            </div>
          </div>

          {/* Right sidebar */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12, duration: 0.4 }}
          >
            <StayMapView />
            <StayPriceInsights />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
