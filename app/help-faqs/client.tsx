"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQ_CATEGORIES } from "@/store/faqs";
import { CONTACT } from "@/store/data";

export function HelpFaqsClient() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  const categories = useMemo(
    () =>
      FAQ_CATEGORIES.map((c) => ({
        ...c,
        items: q ? c.items.filter((it) => (it.q + " " + it.a).toLowerCase().includes(q)) : c.items,
      })).filter((c) => c.items.length > 0),
    [q],
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero + search */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="page-container py-16 sm:py-20">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 dark:text-brand-text">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Help &amp; FAQs
          </p>
          <h1 className="font-heading text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            How can we
            <br />
            <span className="hl-neon">help you?</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything about booking and enjoying your matchday — tickets, payments, cancellations,
            travel and getting into the stadium.
          </p>

          <div className="mt-8 flex max-w-xl items-center gap-2.5 rounded-full border border-border bg-home-panel px-5 py-1.5 backdrop-blur-sm transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
            <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help — tickets, refunds, transfers…"
              aria-label="Search help and FAQs"
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
        </div>
      </section>

      <section className="page-container max-w-5xl py-14 sm:py-20">
        {/* Topic tiles — hidden while searching */}
        {!q && (
          <div className="mb-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FAQ_CATEGORIES.map((c, i) => (
              <a
                key={c.id}
                href={`#cat-${c.id}`}
                className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_18px_var(--brand-glow)]"
              >
                <span className="font-mono text-[11px] tracking-[0.18em] text-foreground/70 dark:text-brand-text">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-heading text-[15px] font-bold uppercase leading-tight tracking-tight text-foreground">
                  {c.name}
                </span>
                <span className="mt-auto font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
                  {c.items.length} article{c.items.length === 1 ? "" : "s"}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* FAQ accordions */}
        {categories.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No results for <b className="font-heading text-foreground">“{query}”</b>. Try another term, or reach our team below.
          </p>
        ) : (
          <div className="space-y-14">
            {categories.map((c) => (
              <div key={c.id} id={`cat-${c.id}`} className="scroll-mt-24">
                <h2 className="mb-5 flex items-center gap-3 font-heading text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
                  <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--brand-glow)]" />
                  {c.name}
                </h2>
                <div className="space-y-3">
                  {c.items.map((it) => {
                    const key = `${c.id}:${it.q}`;
                    const isOpen = open === key;
                    return (
                      <div
                        key={it.q}
                        className={cn(
                          "rounded-xl border bg-card transition-colors",
                          isOpen ? "border-primary/50" : "border-border hover:border-border/70",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setOpen(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="font-heading text-[15px] font-semibold text-foreground sm:text-base">
                            {it.q}
                          </span>
                          <Plus
                            className={cn(
                              "size-5 shrink-0 text-brand-text transition-transform duration-300",
                              isOpen && "rotate-45",
                            )}
                            strokeWidth={2}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <p className="mx-5 border-t border-border py-4 text-sm leading-relaxed text-muted-foreground">
                                {it.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Support CTA */}
      <section className="page-container pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card to-muted/40 px-6 py-16 text-center sm:py-20">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 120%, var(--brand-glow) 0%, transparent 60%)" }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="mb-3 inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/70 dark:text-brand-text">
              <span className="size-1.5 rounded-full bg-primary" />
              Still need a hand?
            </p>
            <h2 className="font-heading text-3xl font-bold uppercase tracking-tight text-foreground sm:text-4xl">
              Talk to a matchday expert
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Can&apos;t find your answer? Our team replies within a few hours — and faster on matchday.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:-translate-y-0.5"
              >
                Contact support <ArrowRight className="size-3.5" strokeWidth={2.5} />
              </a>
              <Link
                href="/matches"
                className="inline-flex items-center rounded-full border border-border px-7 py-3 font-heading text-xs font-bold text-foreground transition-colors hover:border-primary/50 hover:text-brand-text"
              >
                Browse matchdays
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
