import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { SanityBlogPost } from "@/sanity/queries";

export function BlogCard({ post, basePath }: { post: SanityBlogPost; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="relative h-44 w-full overflow-hidden sm:h-48">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{post.date}</p>
        <h3 className="font-heading text-lg font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        {post.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.description}</p>
        )}
        <span className="mt-auto inline-flex items-center gap-1 pt-2 font-mono text-[11px] font-bold text-primary">
          Read article
          <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.5} />
        </span>
      </div>
    </Link>
  );
}
