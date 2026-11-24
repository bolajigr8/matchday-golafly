import Image from "next/image";
import Link from "next/link";
import { Info, AlertTriangle, Lightbulb, StickyNote, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SanitySection,
  SanityArticleSection,
  SanityVideoBlock,
  SanityQuoteBlock,
  SanityCalloutBlock,
  SanityTestimonialBlock,
  SanityCtaBlock,
} from "@/sanity/queries";
import { CookiebotIframe } from '@/components/shared/cookiebot-iframe'

const IMG_SIZES = "(max-width: 768px) 100vw, 720px";

// Paragraphs are plain strings, so links are written markdown-style:
// "read our [refund policy](/legal/refund)". Anything else is left alone.
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const LINK_CLASS = "font-medium text-brand-text underline underline-offset-2 hover:no-underline";

function renderInline(text: string) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [full, label, href] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      href.startsWith("/") ? (
        <Link key={match.index} href={href} className={LINK_CLASS}>
          {label}
        </Link>
      ) : (
        <a key={match.index} href={href} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
          {label}
        </a>
      ),
    );
    last = match.index + full.length;
  }
  if (last === 0) return text;
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function ArticleSectionBlock({ section }: { section: SanityArticleSection }) {
  return (
    <div className="flex flex-col gap-3">
      {section.heading && (
        <h2 className="border-b border-border pb-3 font-heading text-xl font-bold tracking-tight text-foreground">
          {section.heading}
        </h2>
      )}
      <div className="space-y-4">
        {section.paragraphs?.map((para, j) => (
          <p key={j} className="text-[15px] leading-relaxed text-muted-foreground">
            {renderInline(para)}
          </p>
        ))}
      </div>
      {section.image && (
        <div className="relative mt-1 h-[220px] overflow-hidden rounded-xl border border-border md:h-[300px]">
          <Image src={section.image} alt={section.heading || "Article image"} fill sizes={IMG_SIZES} className="object-cover" />
        </div>
      )}
    </div>
  );
}

function getEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

function VideoBlock({ block }: { block: SanityVideoBlock }) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
        {block.videoFileUrl ? (
          <video src={block.videoFileUrl} controls className="h-full w-full object-contain" />
        ) : block.videoUrl ? (
          <CookiebotIframe
            consentCategory='marketing'
            src={getEmbedUrl(block.videoUrl)}
            title={block.caption || "Video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        ) : null}
      </div>
      {block.caption && (
        <figcaption className="text-center text-[13px] italic text-muted-foreground">{block.caption}</figcaption>
      )}
    </figure>
  );
}

function QuoteBlock({ block }: { block: SanityQuoteBlock }) {
  return (
    <blockquote className="my-2 border-l-2 border-primary py-2 pl-5">
      <p className="text-[17px] italic leading-relaxed text-foreground">&ldquo;{block.quote}&rdquo;</p>
      {(block.author || block.role) && (
        <footer className="mt-3 font-mono text-[12px] text-muted-foreground">
          {block.author && <span className="font-semibold text-foreground">{block.author}</span>}
          {block.author && block.role && <span> — </span>}
          {block.role && <span>{block.role}</span>}
        </footer>
      )}
    </blockquote>
  );
}

const CALLOUTS = {
  info: { Icon: Info, ring: "border-border bg-muted/50" },
  tip: { Icon: Lightbulb, ring: "border-primary/40 bg-primary/5" },
  warning: { Icon: AlertTriangle, ring: "border-border bg-muted/50" },
  note: { Icon: StickyNote, ring: "border-border bg-muted/50" },
} as const;

function CalloutBlock({ block }: { block: SanityCalloutBlock }) {
  const { Icon, ring } = CALLOUTS[block.calloutType] ?? CALLOUTS.info;
  return (
    <div className={cn("my-2 rounded-xl border p-5", ring)}>
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          {block.title && <p className="font-heading text-[15px] font-bold text-foreground">{block.title}</p>}
          <p className="text-[14px] leading-relaxed text-muted-foreground">{block.body}</p>
        </div>
      </div>
    </div>
  );
}

function TestimonialBlock({ block }: { block: SanityTestimonialBlock }) {
  return (
    <div className="my-2 flex items-start gap-4 rounded-xl border border-border bg-card p-6">
      {block.avatar && (
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border">
          <Image src={block.avatar} alt={block.authorName} fill sizes="48px" className="object-cover" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-[15px] italic leading-relaxed text-foreground">&ldquo;{block.quote}&rdquo;</p>
        <div className="text-[13px]">
          <span className="font-heading font-bold text-foreground">{block.authorName}</span>
          {block.role && <span className="text-muted-foreground"> — {block.role}</span>}
        </div>
      </div>
    </div>
  );
}

function CtaBlock({ block }: { block: SanityCtaBlock }) {
  const button = (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-heading text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-[0_0_20px_var(--brand-glow)]">
      {block.buttonText}
      <ArrowRight className="size-3.5" strokeWidth={2.5} />
    </span>
  );
  return (
    <div className="relative my-2 overflow-hidden rounded-2xl border border-border">
      {block.backgroundImage && (
        <Image src={block.backgroundImage} alt="" fill sizes={IMG_SIZES} className="object-cover" />
      )}
      <div className={cn("relative flex flex-col items-center gap-4 p-10 text-center", block.backgroundImage ? "bg-black/60" : "bg-card")}>
        <h3 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">{block.heading}</h3>
        {block.description && (
          <p className="max-w-lg text-[14px] leading-relaxed text-muted-foreground">{block.description}</p>
        )}
        {block.buttonLink ? (
          <a href={block.buttonLink} className="transition-transform hover:-translate-y-0.5">{button}</a>
        ) : (
          button
        )}
      </div>
    </div>
  );
}

export function SectionRenderer({ section }: { section: SanitySection }) {
  switch (section._type) {
    case "articleSection":
      return <ArticleSectionBlock section={section} />;
    case "videoBlock":
      return <VideoBlock block={section} />;
    case "quoteBlock":
      return <QuoteBlock block={section} />;
    case "calloutBlock":
      return <CalloutBlock block={section} />;
    case "testimonialBlock":
      return <TestimonialBlock block={section} />;
    case "ctaBlock":
      return <CtaBlock block={section} />;
    default:
      return null;
  }
}
