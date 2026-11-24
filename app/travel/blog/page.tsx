import type { Metadata } from "next";
import { getFeaturedPosts, getMainPosts } from "@/sanity/queries";
import { BlogIndex } from "@/components/blog/blog-index";
import { canonical } from '@/lib/seo'
import { JsonLd, blogIndexSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: canonical('/travel/blog'),
  title: "Football Travel Blog: Flights, Stays & City Guides | Golafly",
  description: "Travel smarter around the game. Golafly's travel blog covers flights, hotels, eSIMs and city guides for football fans planning a matchday trip abroad.",
};

export default async function TravelBlogPage() {
  const [featured, posts] = await Promise.all([getFeaturedPosts("all"), getMainPosts("all")]);
  // JSON-LD (SEO schema plan §10.2): the posts in the order the index shows
  // them (hero, then the grid), each at its own CANONICAL url — Matchday
  // posts point at /blog/<slug> even when listed on the travel blog.
  const shown = [...featured, ...posts.filter((p) => !featured.some((f) => f.id === p.id))];
  const schema = blogIndexSchema({
    path: '/travel/blog',
    name: 'The Travel Blog',
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
      <BlogIndex section="travel" basePath="/travel/blog" featured={featured} posts={posts} />
    </>
  );
}
