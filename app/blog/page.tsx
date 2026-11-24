import type { Metadata } from "next";
import { getFeaturedPosts, getMainPosts } from "@/sanity/queries";
import { BlogIndex } from "@/components/blog/blog-index";
import { canonical } from '@/lib/seo'
import { JsonLd, blogIndexSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: canonical('/blog'),
  title: "Matchday Blog: Football Travel Guides & Fan Tips | Golafly",
  description: "Read Golafly's matchday blog for football travel guides, stadium tips, fixtures and fan stories. Plan your next trip around the game with expert advice.",
};

export default async function BlogPage() {
  const [featured, posts] = await Promise.all([getFeaturedPosts("matchday"), getMainPosts("matchday")]);
  // JSON-LD (SEO schema plan §10.2): the posts in the order the index shows
  // them (hero, then the grid), each at its own CANONICAL url — Matchday
  // posts point at /blog/<slug> even when listed on the travel blog.
  const shown = [...featured, ...posts.filter((p) => !featured.some((f) => f.id === p.id))];
  const schema = blogIndexSchema({
    path: '/blog',
    name: 'The Matchday Blog',
    ...metaText(metadata),
    posts: shown
      .filter((p) => p.slug)
      .map((p) => ({
        path: (p.section ?? 'matchday') === 'matchday' ? `/blog/${p.slug}` : `/travel/blog/${p.slug}`,
        name: p.title,
      })),
  });
  return (
    <>
      <JsonLd data={schema} />
      <BlogIndex section="matchday" basePath="/blog" featured={featured} posts={posts} />
    </>
  );
}
