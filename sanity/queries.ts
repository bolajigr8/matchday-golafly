import { sanityClient } from "./client";
import { sanityRead } from "./resilient";

// "all" pulls every post regardless of section (used by the travel blog for now —
// it may later be split into its own project / filtered by section).
export type BlogSection = "matchday" | "travel" | "all";

// ─── Types ────────────────────────────────────────────────────
export interface SanityBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  commentDate: string;
  comments: number;
  category: string;
  tags: string[];
  image: string;
  featured?: boolean;
  /** "matchday" | "travel" — decides the post's canonical URL (JSON-LD lists). */
  section?: string;
}

export interface SanityArticleSection {
  _type: "articleSection";
  heading?: string;
  paragraphs: string[];
  image?: string;
}
export interface SanityVideoBlock {
  _type: "videoBlock";
  videoFileUrl?: string;
  videoUrl?: string;
  caption?: string;
}
export interface SanityQuoteBlock {
  _type: "quoteBlock";
  quote: string;
  author?: string;
  role?: string;
}
export interface SanityCalloutBlock {
  _type: "calloutBlock";
  calloutType: "info" | "warning" | "tip" | "note";
  title?: string;
  body: string;
}
export interface SanityTestimonialBlock {
  _type: "testimonialBlock";
  quote: string;
  authorName: string;
  role?: string;
  avatar?: string;
}
export interface SanityCtaBlock {
  _type: "ctaBlock";
  heading: string;
  description?: string;
  buttonText: string;
  buttonLink?: string;
  backgroundImage?: string;
}

export type SanitySection =
  | SanityArticleSection
  | SanityVideoBlock
  | SanityQuoteBlock
  | SanityCalloutBlock
  | SanityTestimonialBlock
  | SanityCtaBlock;

export interface SanityBlogPostDetail {
  id: string;
  slug: string;
  /** "matchday" | "travel" — legacy posts without one count as matchday. */
  section: string;
  title: string;
  category: string;
  tags: string[];
  date: string;
  /** Unformatted publish date (Sanity `date`, else creation time) — JSON-LD datePublished. */
  publishedAt?: string;
  author: string;
  readTime: string;
  heroImage: string;
  featuredImage: string;
  featuredCaption: string;
  /** SEO Title / Meta Description from Sanity; empty when the editor left them blank. */
  seoTitle?: string | null;
  metaDescription?: string | null;
  likes: number;
  intro: string[];
  sections: SanitySection[];
}

export interface PopularPost {
  slug: string;
  title: string;
  date: string;
  image: string;
}

// ─── Projections ──────────────────────────────────────────────
// Legacy posts without a `section` default to "matchday".
const SECTION_MATCH = `coalesce(section, "matchday") == $section`;

// Builds the section filter fragment + query params for a given section.
// "all" drops the filter entirely (and binds no $section param).
function sectionScope(section: BlogSection): { filter: string; params: Record<string, string> } {
  if (section === "all") return { filter: "", params: {} };
  return { filter: ` && ${SECTION_MATCH}`, params: { section } };
}

const blogPostFields = `
  "id": _id,
  "slug": slug.current,
  title,
  description,
  "date": coalesce(date, _createdAt),
  "commentDate": coalesce(date, _createdAt),
  "comments": coalesce(comments, 0),
  "category": category->title,
  "tags": coalesce(tags[]->title, []),
  "image": image.asset->url,
  "featured": coalesce(featured, false),
  "section": coalesce(section, "matchday")
`;

const blogPostDetailFields = `
  "id": _id,
  "slug": slug.current,
  "section": coalesce(section, "matchday"),
  title,
  "category": category->title,
  "tags": coalesce(tags[]->title, []),
  "date": coalesce(date, _createdAt),
  "publishedAt": coalesce(date, _createdAt),
  "author": coalesce("By " + author, "By Golafly Team"),
  "readTime": coalesce(readTime, "5 min read"),
  "heroImage": coalesce(heroImage.asset->url, image.asset->url),
  "featuredImage": coalesce(featuredImage.asset->url, image.asset->url),
  featuredCaption,
  seoTitle,
  metaDescription,
  "likes": coalesce(likes, 0),
  intro,
  "sections": sections[]{
    _type,
    _type == "articleSection" => { heading, paragraphs, "image": image.asset->url },
    _type == "videoBlock" => { "videoFileUrl": videoFile.asset->url, videoUrl, caption },
    _type == "quoteBlock" => { quote, author, role },
    _type == "calloutBlock" => { calloutType, title, body },
    _type == "testimonialBlock" => { quote, authorName, role, "avatar": avatar.asset->url },
    _type == "ctaBlock" => { heading, description, buttonText, buttonLink, "backgroundImage": backgroundImage.asset->url }
  }
`;

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Fetchers (all scoped to a section) ───────────────────────
export async function getFeaturedPosts(section: BlogSection): Promise<SanityBlogPost[]> {
  const { filter, params } = sectionScope(section);
  const posts: SanityBlogPost[] = await sanityRead(
    "featured posts",
    () =>
      sanityClient.fetch(
        `*[_type == "blogPost"${filter} && featured == true] | order(date desc) { ${blogPostFields} }`,
        params,
      ),
    { bailoutPage: true },
  );
  return posts.map((p) => ({ ...p, date: formatDate(p.date), commentDate: formatDate(p.commentDate) }));
}

export async function getMainPosts(section: BlogSection): Promise<SanityBlogPost[]> {
  const { filter, params } = sectionScope(section);
  const posts: SanityBlogPost[] = await sanityRead(
    "main posts",
    () =>
      sanityClient.fetch(
        `*[_type == "blogPost"${filter} && featured != true] | order(date desc) { ${blogPostFields} }`,
        params,
      ),
    { bailoutPage: true },
  );
  return posts.map((p) => ({ ...p, date: formatDate(p.date), commentDate: formatDate(p.commentDate) }));
}

export async function getBlogPostBySlug(
  slug: string,
  section: BlogSection,
): Promise<SanityBlogPostDetail | null> {
  const { filter, params } = sectionScope(section);
  const post: SanityBlogPostDetail | null = await sanityRead(
    `post "${slug}"`,
    () =>
      sanityClient.fetch(
        `*[_type == "blogPost" && slug.current == $slug${filter}][0] { ${blogPostDetailFields} }`,
        { slug, ...params },
      ),
    { bailoutPage: true },
  );
  if (!post) return null;
  return { ...post, date: formatDate(post.date) };
}

export async function getAllBlogSlugs(section: BlogSection): Promise<string[]> {
  const { filter, params } = sectionScope(section);
  // Not a page read: generateStaticParams and the sitemap catch this and
  // fall back to an empty list, so it must throw rather than defer a page.
  return sanityRead(
    "post slugs",
    () =>
      sanityClient.fetch<string[]>(
        `*[_type == "blogPost"${filter}].slug.current`,
        params,
      ),
    { bailoutPage: false },
  );
}

export async function getPopularPosts(section: BlogSection): Promise<PopularPost[]> {
  const { filter, params } = sectionScope(section);
  const posts: PopularPost[] = await sanityRead(
    "popular posts",
    () =>
      sanityClient.fetch(
        `*[_type == "blogPost"${filter}] | order(likes desc)[0...3] {
      "slug": slug.current, title, "date": coalesce(date, _createdAt), "image": image.asset->url
    }`,
        params,
      ),
    { bailoutPage: true },
  );
  return posts.map((p) => ({ ...p, date: formatDate(p.date) }));
}
