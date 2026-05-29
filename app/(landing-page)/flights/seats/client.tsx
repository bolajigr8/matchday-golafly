"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepProgress } from "@/components/checkout/step-progress";
import { SEAT_CATEGORIES, type StandId } from "@/store/matchday";

/* ── Stadium SVG map ───────────────────────────────────────────── */
function StadiumMap({ selected, onSelect }: { selected: StandId; onSelect: (s: StandId) => void }) {
  const getColor = (id: StandId) => {
    const c = SEAT_CATEGORIES.find(c => c.id === id)!;
    return selected === id ? c.mapColor : c.mapColorDefault;
  };
  return (
    <motion.svg
      viewBox="0 0 360 286"
      className="h-full w-full"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.5 }}
    >
      <ellipse cx="180" cy="143" rx="170" ry="132" fill="#d4d6ce" />

      <motion.path d="M 95,28.7 A 170,132 0 0,1 265,28.7 L 237.5,63.3 A 115,92 0 0,0 122.5,63.3 Z"
        fill={getColor("north")} onClick={() => onSelect("north")} className="cursor-pointer" whileHover={{ opacity: 0.82 }} />
      <path d="M 265,28.7 A 170,132 0 0,1 300.2,49.7 L 261.3,77.9 A 115,92 0 0,0 237.5,63.3 Z" fill="#9aa09a" opacity="0.55" className="cursor-not-allowed" />
      <motion.path d="M 300.2,49.7 A 170,132 0 0,1 300.2,236.3 L 261.3,208.1 A 115,92 0 0,0 261.3,77.9 Z"
        fill={getColor("east")} onClick={() => onSelect("east")} className="cursor-pointer" whileHover={{ opacity: 0.82 }} />
      <path d="M 300.2,236.3 A 170,132 0 0,1 265,257.3 L 237.5,222.7 A 115,92 0 0,0 261.3,208.1 Z" fill="#9aa09a" opacity="0.55" className="cursor-not-allowed" />
      <motion.path d="M 265,257.3 A 170,132 0 0,1 95,257.3 L 122.5,222.7 A 115,92 0 0,0 237.5,222.7 Z"
        fill={getColor("south")} onClick={() => onSelect("south")} className="cursor-pointer" whileHover={{ opacity: 0.82 }} />
      <path d="M 95,257.3 A 170,132 0 0,0 59.8,236.3 L 98.7,208.1 A 115,92 0 0,1 122.5,222.7 Z" fill="#9aa09a" opacity="0.55" className="cursor-not-allowed" />
      <motion.path d="M 59.8,236.3 A 170,132 0 0,0 59.8,49.7 L 98.7,77.9 A 115,92 0 0,1 98.7,208.1 Z"
        fill={getColor("west")} onClick={() => onSelect("west")} className="cursor-pointer" whileHover={{ opacity: 0.82 }} />
      <path d="M 59.8,49.7 A 170,132 0 0,0 95,28.7 L 122.5,63.3 A 115,92 0 0,0 98.7,77.9 Z" fill="#9aa09a" opacity="0.55" className="cursor-not-allowed" />

      {/* Pitch */}
      <ellipse cx="180" cy="143" rx="100" ry="78" fill="#1c4a1c" />
      <ellipse cx="180" cy="143" rx="78" ry="56" fill="none" stroke="#2a6a2a" strokeWidth="1.5" />
      <line x1="180" y1="70" x2="180" y2="216" stroke="#2a6a2a" strokeWidth="1.5" />
      <circle cx="180" cy="143" r="14" fill="none" stroke="#2a6a2a" strokeWidth="1.5" />
      <text x="180" y="147" textAnchor="middle" fill="#2d5a2d" fontSize="9" fontFamily="monospace">PITCH</text>

      <text x="180" y="18"  textAnchor="middle" fill="#1a1e1b" fontSize="7" fontWeight="bold" fontFamily="monospace">NORTH · CAT 1 · €850</text>
      <text x="180" y="278" textAnchor="middle" fill="#1a1e1b" fontSize="6.5" fontFamily="monospace">SOUTH · CAT 2 · €480</text>
      <g transform="translate(350,143) rotate(90)"><text x="0" y="0" textAnchor="middle" fill="#1a1e1b" fontSize="6.5" fontFamily="monospace">EAST · €480</text></g>
      <g transform="translate(10,143) rotate(-90)"><text x="0" y="0" textAnchor="middle" fill="#1a1e1b" fontSize="6.5" fontFamily="monospace">WEST · €290</text></g>

      {selected === "north" && (
        <g>
          <rect x="108" y="30" width="144" height="26" rx="4" fill="white" fillOpacity="0.92" />
          <text x="180" y="41" textAnchor="middle" fill="#1a1e1b" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">North Stand</text>
          <text x="180" y="52" textAnchor="middle" fill="#6c7668" fontSize="6.5" fontFamily="sans-serif">128 seats left · €850/pp</text>
        </g>
      )}
    </motion.svg>
  );
}

/* ── Page client ───────────────────────────────────────────────── */
export function SeatsClient() {
  const [selected, setSelected] = useState<StandId>("north");
  const [qty,      setQty]      = useState(2);

  const cat      = SEAT_CATEGORIES.find(c => c.id === selected)!;
  const subtotal = cat.pricePerPerson * qty;

  const handleSelect = (id: StandId) => {
    const c = SEAT_CATEGORIES.find(c => c.id === id)!;
    if (!c.soldOut) setSelected(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-10 sm:py-12">
        <StepProgress currentStep={1} />

        {/* Match recap */}
        <motion.div
          className="mt-6 flex flex-col gap-3 rounded-xl border border-border bg-muted/50 px-4 py-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:px-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
        >
          <div className="space-y-0.5">
            <p className="font-mono text-[10px] tracking-[2px] text-primary">Premier League · Jun 14, 2026</p>
            <p className="text-[15px] font-bold text-foreground">Arsenal vs Liverpool</p>
            <p className="text-[11px] text-muted-foreground">Emirates Stadium, London</p>
          </div>
          <Link href="/" className="font-mono text-[11px] tracking-wide text-primary underline underline-offset-2 hover:opacity-70">
            Change Match
          </Link>
        </motion.div>

        {/* Main grid */}
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_340px]">
          {/* Stadium map */}
          <motion.div
            className="rounded-xl border border-border bg-card p-4 sm:p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.45 }}
          >
            <p className="mb-4 text-center font-mono text-[11px] tracking-wider text-muted-foreground">
              Tap a zone to select your category
            </p>
            <div className="mx-auto max-w-[480px]">
              <StadiumMap selected={selected} onSelect={handleSelect} />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 sm:mt-5 sm:gap-x-6">
              {[
                { color: "#b7ff00", label: "Cat 1 — €850" },
                { color: "#2a7ab8", label: "Cat 2 — €480" },
                { color: "#d4820a", label: "Cat 3 — €290" },
                { color: "#6c7668", label: "Cat 4 — Sold Out" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="size-[10px] shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="font-mono text-[10px] text-foreground/70">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Category panel */}
          <motion.div
            className="rounded-xl border border-border bg-card p-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
          >
            <h2 className="mb-3 text-[13px] font-bold text-foreground">Choose Category</h2>

            <div className="space-y-2">
              {SEAT_CATEGORIES.map((cat, i) => {
                const isSelected = selected === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    onClick={() => handleSelect(cat.id)}
                    disabled={cat.soldOut}
                    className={cn(
                      "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                      cat.soldOut && "cursor-not-allowed opacity-40",
                      isSelected ? "border-primary/50 bg-primary/10 shadow-[0_0_8px_rgba(183,255,0,0.3)]" : "border-border bg-muted/40 hover:border-border/80",
                    )}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.22 + i * 0.06, duration: 0.35 }}
                    whileHover={!cat.soldOut ? { x: 2 } : {}}
                    whileTap={!cat.soldOut ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-[12px] font-semibold text-foreground">{cat.name}</p>
                      {cat.soldOut
                        ? <span className="text-[11px] text-muted-foreground">Sold Out</span>
                        : <span className="text-[15px] font-bold" style={{ color: cat.color }}>€{cat.pricePerPerson}</span>
                      }
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{cat.description}</p>
                    {cat.urgency && isSelected && (
                      <motion.p className="mt-1 font-mono text-[10px] text-red-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {cat.urgency}
                      </motion.p>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="my-4 border-t border-border" />

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-foreground">Number of Tickets</span>
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-lg font-light text-foreground"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  −
                </motion.button>
                <motion.span
                  key={qty}
                  className="w-5 text-center font-mono text-[16px] font-bold text-foreground"
                  initial={{ scale: 1.3 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                >
                  {qty}
                </motion.span>
                <motion.button
                  onClick={() => setQty(q => Math.min(10, q + 1))}
                  className="flex size-8 items-center justify-center rounded-full border border-border bg-muted text-lg font-light text-foreground"
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Subtotal */}
            <motion.div className="mt-4 rounded-lg border border-primary/15 bg-primary/10 p-3" layout>
              <p className="text-[11px] text-foreground/80">{qty} × {cat.badge} — {cat.name}</p>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-foreground/70">
                <span>Booking fee</span><span>Included</span>
              </div>
              <div className="mt-1 flex items-center justify-between font-bold text-primary">
                <span className="text-[13px]">Subtotal</span>
                <motion.span
                  key={subtotal}
                  className="text-[14px]"
                  initial={{ opacity: 0.5, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  €{subtotal.toLocaleString("de-DE")}
                </motion.span>
              </div>
            </motion.div>

            <motion.div className="mt-4" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {/* ✅ Updated: /extras → /flights/extras */}
              <Link href="/flights/extras" className="block rounded-full bg-primary py-2.5 text-center text-[13px] font-bold text-primary-foreground shadow-[0_0_12px_rgba(183,255,0,0.4)] transition-all hover:shadow-[0_0_20px_rgba(183,255,0,0.5)]">
                Add to Cart
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
