import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { SanityBlogPostDetail, PopularPost } from "@/sanity/queries";
import { SectionRenderer } from "./section-renderer";
import { ShareRow } from "./share-row";

interface BlogDetailProps {
  post: SanityBlogPostDetail;
  popular: PopularPost[];
  basePath: string;
  backLabel: string;
}

export function BlogDetail({ post, popular, basePath, backLabel }: BlogDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-[300px] w-full overflow-hidden border-b border-border sm:h-[420px]">
        {(post.heroImage || post.featuredImage) && (
          <Image
            src={post.heroImage || post.featuredImage}
            alt={post.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="page-container relative flex h-full flex-col justify-end pb-8">
          <Link
            href={basePath}
            className="mb-4 inline-flex w-fit items-center gap-1.5 font-mono text-[11px] text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            {backLabel}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            {post.category && (
              <span className="rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                {post.category}
              </span>
            )}
            <span className="font-mono text-[11px] text-white/70">{post.date}</span>
            <span className="font-mono text-[11px] text-white/70">{post.readTime}</span>
          </div>
          <h1 className="mt-3 max-w-3xl font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {post.title}
          </h1>
        </div>
      </section>

      <div className="page-container grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_300px] lg:py-16">
        {/* Article */}
        <article className="min-w-0">
          {/* Meta bar */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
            <span className="font-mono text-[12px] text-muted-foreground">{post.author}</span>
            <ShareRow title={post.title} likes={post.likes} />
          </div>

          {/* Featured caption */}
          {post.featuredCaption && (
            <p className="mb-8 border-l-2 border-primary pl-5 font-heading text-xl font-medium leading-snug text-foreground">
              {post.featuredCaption}
            </p>
          )}

          {/* Intro */}
          {post.intro?.length > 0 && (
            <div className="mb-8 space-y-4">
              {post.intro.map((para, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
            </div>
          )}

          {/* Sections */}
          <div className="flex flex-col gap-8">
            {post.sections?.map((section, i) => (
              <SectionRenderer key={i} section={section} />
            ))}
          </div>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-border px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[calc(6rem+var(--bf-bar-h,0px))] lg:self-start">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Popular articles</p>
          <div className="space-y-4">
            {popular.map((p) => (
              <Link key={p.slug} href={`${basePath}/${p.slug}`} className="group flex gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border">
                  {p.image ? (
                    <Image src={p.image} alt={p.title} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 font-heading text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {p.title}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{p.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
