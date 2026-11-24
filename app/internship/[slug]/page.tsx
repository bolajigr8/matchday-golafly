import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import { positionSeo } from "@/lib/seo-copy";
import { notFound } from "next/navigation";
import { getInternshipPositions, getInternshipSettings } from "@/sanity/internship";
import { PositionDetail } from "@/components/internship/position-detail";
import { JsonLd, simplePageSchema } from "@/lib/golafly-schema";

export const revalidate = 60;

export async function generateStaticParams() {
  // Pre-building is an optimisation, not a requirement: if Sanity can't be
  // reached during a deploy, build nothing here instead of failing the whole
  // deploy. Roles then render on first visit (dynamicParams is on) and are
  // cached for `revalidate` seconds, exactly like a role published later.
  try {
    const positions = await getInternshipPositions();
    return positions.map((position) => ({ slug: position.slug }));
  } catch (err) {
    console.warn("[internship] could not pre-build role pages:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const position = (await getInternshipPositions()).find((p) => p.slug === slug);
  if (!position) return { title: "Position not found | Golafly Internship" };
  // The SEO brief's copy where it has some; otherwise built from the position.
  const seo = positionSeo(slug);
  return {
    alternates: canonical(`/internship/${slug}`),
    title: seo?.title ?? `${position.title} | Golafly Internship`,
    description: seo?.description ?? position.summary,
  };
}

export default async function InternshipPositionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [positions, settings] = await Promise.all([getInternshipPositions(), getInternshipSettings()]);
  const position = positions.find((p) => p.slug === slug);
  if (!position) notFound();

  const others = positions.filter((p) => p.slug !== slug).slice(0, 3);
  // JSON-LD (SEO schema plan §11.6): WebPage + breadcrumb only. No JobPosting
  // until the SEO team confirms which roles qualify.
  const seo = positionSeo(slug);
  const schema = simplePageSchema({
    path: `/internship/${slug}`,
    pageName: position.title,
    parent: { name: "Internships", path: "/internship" },
    metaTitle: seo?.title ?? `${position.title} | Golafly Internship`,
    metaDescription: seo?.description ?? position.summary,
  });
  return (
    <>
      <JsonLd data={schema} />
      <PositionDetail position={position} others={others} settings={settings} />
    </>
  );
}
