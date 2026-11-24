import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { SanityBlogPost } from "@/sanity/queries";

export function FeaturedCard({ post, basePath }: { post: SanityBlogPost; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      className="group relative flex min-h-[320px] flex-col justify-end overflow-hidden rounded-3xl border border-border sm:min-h-[420px]"
    >
      {post.image ? (
        <Image
          src={post.image}
          alt={post.title}
          fill
          sizes="(max-width: 1024px) 100vw, 1200px"
          priority
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      <div className="relative max-w-2xl space-y-3 p-6 sm:p-9">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
            Featured
          </span>
          {post.category && (
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">{post.category}</span>
          )}
        </div>
        <h2 className="font-heading text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {post.title}
        </h2>
        {post.description && (
          <p className="line-clamp-2 max-w-xl text-sm leading-relaxed text-white/80">{post.description}</p>
        )}
        <span className="inline-flex items-center gap-1.5 pt-1 font-mono text-[12px] font-bold text-primary">
          Read the story
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
