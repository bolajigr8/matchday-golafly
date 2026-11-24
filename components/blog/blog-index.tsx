import { Newspaper } from "lucide-react";
import type { BlogSection, SanityBlogPost } from "@/sanity/queries";
import { BlogCard } from "./blog-card";
import { FeaturedCard } from "./featured-card";

const COPY: Record<BlogSection, { eyebrow: string; title: string; lead: string }> = {
  matchday: {
    eyebrow: "Golafly Journal",
    title: "The Matchday Blog",
    lead: "Stories, guides and insider tips for football fans — fixtures, stadiums, away days and everything around the 90 minutes.",
  },
  travel: {
    eyebrow: "Golafly Travel",
    title: "The Travel Blog",
    lead: "Flights, stays, eSIMs and city guides — how to travel smarter around the game and get the most out of every trip.",
  },
  // Fallback copy for the unscoped "all" feed (not currently rendered — the travel
  // page still labels its BlogIndex as "travel").
  all: {
    eyebrow: "Golafly Journal",
    title: "The Blog",
    lead: "Every story from across Golafly — matchdays, stadiums, travel and everything in between.",
  },
};

interface BlogIndexProps {
  section: BlogSection;
  basePath: string;
  featured: SanityBlogPost[];
  posts: SanityBlogPost[];
}

export function BlogIndex({ section, basePath, featured, posts }: BlogIndexProps) {
  const copy = COPY[section];
  const hero = featured[0];
  const restFeatured = featured.slice(1);
  const grid = [...restFeatured, ...posts];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-muted/40 to-background">
        <div className="page-container py-14 sm:py-20">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            {copy.eyebrow}
          </p>
          <h1 className="font-heading text-4xl font-extrabold uppercase leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.lead}</p>
        </div>
      </section>

      <div className="page-container space-y-12 py-12 sm:py-16">
        {hero && <FeaturedCard post={hero} basePath={basePath} />}

        {grid.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {grid.map((post) => (
              <BlogCard key={post.id} post={post} basePath={basePath} />
            ))}
          </div>
        ) : (
          !hero && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border border-border bg-muted/60">
                <Newspaper className="size-6 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="font-heading text-lg font-bold text-foreground">No articles yet</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                New {section} stories are on the way — check back soon.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
