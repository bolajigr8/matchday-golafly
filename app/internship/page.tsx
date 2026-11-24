import type { Metadata } from "next";
import { getInternshipPositions, getInternshipSettings } from "@/sanity/internship";
import { InternshipLanding } from "@/components/internship/internship-landing";
import { canonical } from '@/lib/seo'
import { JsonLd, simplePageSchema } from '@/lib/golafly-schema'
import { metaText } from '@/lib/schema-data'

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: canonical('/internship'),
  title: "Football & Travel Internships: Apply for Golafly Roles",
  description:
    "Project-based internships for university students in football, travel, product, marketing and partnerships. Explore open roles and apply with your CV.",
};

async function InternshipPageView() {
  const [positions, settings] = await Promise.all([getInternshipPositions(), getInternshipSettings()]);
  return <InternshipLanding positions={positions} settings={settings} />;
}

/* JSON-LD (SEO schema plan): built on the server from this page's own
   metadata, so it is in the raw HTML and always matches the meta tags. */
export default function InternshipPage() {
  const schema = simplePageSchema({ path: '/internship', pageName: 'Internships', ...metaText(metadata) })
  return (
    <>
      <JsonLd data={schema} />
      <InternshipPageView />
    </>
  )
}
