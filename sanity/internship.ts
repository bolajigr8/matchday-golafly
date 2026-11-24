import { sanityClient } from "./client";
import {
  BROCHURE_FILENAME,
  DEFAULT_BROCHURE_URL,
  DEFAULT_PARTNER_EMAIL,
  FALLBACK_POSITIONS,
  type InternshipPosition,
} from "@/store/internship";

/* Golafly Internship content. Every fetcher falls back to the static copy in
   store/internship.ts, so the pages render before anything is published in
   Sanity and keep rendering if Sanity is unreachable. */

export interface InternshipSettings {
  brochureUrl: string;
  partnerEmail: string;
}

const positionFields = `
  "slug": slug.current,
  order,
  title,
  summary,
  "focus": coalesce(focus, ""),
  "overview": coalesce(overview, ""),
  "tags": coalesce(tags, []),
  "lists": coalesce(lists[]{ title, "style": coalesce(style, "ticks"), "items": coalesce(items, []) }, []),
  "deliverables": coalesce(deliverables, []),
  challenge,
  location,
  duration,
  workMode
`;

const OPEN = `_type == "internshipPosition" && isOpen != false && defined(slug.current)`;

async function safeFetch<T>(query: string, params: Record<string, unknown>, fallback: T): Promise<T> {
  try {
    const result = await sanityClient.fetch<T>(query, params);
    return result ?? fallback;
  } catch (error) {
    console.error("[internship] Sanity fetch failed, using fallback content", error);
    return fallback;
  }
}

export async function getInternshipPositions(): Promise<InternshipPosition[]> {
  const positions = await safeFetch<InternshipPosition[]>(
    `*[${OPEN}] | order(order asc) { ${positionFields} }`,
    {},
    [],
  );
  return positions.length ? positions : FALLBACK_POSITIONS;
}

export async function getInternshipPositionBySlug(slug: string): Promise<InternshipPosition | null> {
  const positions = await getInternshipPositions();
  return positions.find((p) => p.slug === slug) ?? null;
}

export async function getInternshipSettings(): Promise<InternshipSettings> {
  const settings = await safeFetch<{ brochureUrl?: string; partnerEmail?: string } | null>(
    `*[_type == "internshipSettings"] | order(_updatedAt desc)[0] { "brochureUrl": brochure.asset->url, partnerEmail }`,
    {},
    null,
  );
  return {
    /* ?dl= makes Sanity's CDN serve the PDF as a download with a clean name;
       the download attribute alone is ignored on cross-origin links. */
    brochureUrl: settings?.brochureUrl
      ? `${settings.brochureUrl}?dl=${BROCHURE_FILENAME}`
      : DEFAULT_BROCHURE_URL,
    partnerEmail: settings?.partnerEmail || DEFAULT_PARTNER_EMAIL,
  };
}
