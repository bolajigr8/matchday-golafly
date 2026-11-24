import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { blogPostSeo } from "@/lib/seo-copy";
import { notFound } from "next/navigation";
import { getAllBlogSlugs, getBlogPostBySlug, getPopularPosts } from "@/sanity/queries";
import { BlogDetail } from "@/components/blog/blog-detail";
import { JsonLd, blogPostSchema } from "@/lib/golafly-schema";
import { bylineAuthor, isoDate } from "@/lib/schema-data";

export const revalidate = 60;

export async function generateStaticParams() {
  // Pre-building is an optimisation, not a requirement: if Sanity can't be
  // reached during a deploy, build nothing here instead of failing the whole
  // deploy. Posts then render on first visit (dynamicParams is on) and are
  // cached for `revalidate` seconds, exactly like a post published later.
  try {
    const slugs = await getAllBlogSlugs("all");
    return slugs.map((slug) => ({ slug }));
  } catch (err) {
    console.warn("[blog] could not pre-build post pages:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug, "all");
  if (!post) return { title: "Article not found | Golafly" };
  // The travel blog lists every post, so Matchday posts exist at both
  // /blog/{slug} and /travel/blog/{slug}. Point Google at /blog for those;
  // travel-only posts point at themselves.
  const home = post.section === "matchday" ? `/blog/${slug}` : `/travel/blog/${slug}`;
  return {
    alternates: canonical(home),
    // SEO Title / Meta Description (Sanity), then the SEO brief's copy, then a
    // one-line summary — never the raw intro with its line breaks.
    ...blogPostSeo(post, "Travel Blog"),
    openGraph: post.featuredImage ? { images: [post.featuredImage] } : undefined,
  };
}

export default async function TravelBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, popular] = await Promise.all([
    getBlogPostBySlug(slug, "all"),
    getPopularPosts("all"),
  ]);
  if (!post) notFound();
  // JSON-LD (SEO schema plan §10.1) — url / @id are the page's CANONICAL,
  // so a Matchday post shown under /travel/blog never gets a second @id.
  const canonicalPath = post.section === "matchday" ? `/blog/${slug}` : `/travel/blog/${slug}`;
  const seo = blogPostSeo(post, "Travel Blog");
  const isTravel = canonicalPath.startsWith("/travel/");
  const schema = blogPostSchema({
    path: canonicalPath,
    indexPath: isTravel ? "/travel/blog" : "/blog",
    indexName: isTravel ? "Travel Blog" : "Blog",
    metaTitle: seo.title,
    metaDescription: seo.description,
    headline: post.title,
    datePublished: isoDate(post.publishedAt),
    authorName: bylineAuthor(post.author),
    image: post.featuredImage || post.heroImage || undefined,
  });
  return (
    <>
      <JsonLd data={schema} />
      <BlogDetail post={post} popular={popular} basePath="/travel/blog" backLabel="Back to the Travel blog" />
    </>
  );
}
