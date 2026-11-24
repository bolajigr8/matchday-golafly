import type { Metadata } from "next";
import { Suspense } from "react";
import { getInternshipPositions } from "@/sanity/internship";
import { InternshipApplyForm } from "@/components/internship/apply-form";
import { Eyebrow } from "@/components/internship/ui";
import { canonical } from '@/lib/seo'

export const revalidate = 60;

export const metadata: Metadata = {
  alternates: canonical('/internship/apply'),
  title: "Apply | Golafly Internship",
  description: "Apply for a Golafly internship position and upload your CV.",
};

const NEXT_STEPS = [
  "Send this form with your CV",
  "Short call with the Golafly team",
  "We agree the project and timeline with you and your university",
];

export default async function InternshipApplyPage() {
  const positions = await getInternshipPositions();

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container grid items-start gap-8 py-10 sm:py-14 lg:grid-cols-[340px_1fr] lg:gap-12 lg:py-16">
        <div className="lg:sticky lg:top-[calc(6rem+var(--bf-bar-h,0px))]">
          <Eyebrow>Golafly Internship</Eyebrow>
          <h1 className="mt-3 text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl">Apply now</h1>
          <p className="mt-4 text-muted-foreground">
            Tell us about yourself and the track you want to join. The Golafly team reviews every application.
          </p>
          <ol className="mt-6 grid gap-3 text-sm text-foreground">
            {NEXT_STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-border font-mono text-xs text-brand-text">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* useSearchParams (?position=) needs a Suspense boundary */}
        <Suspense fallback={<div className="h-[60rem] rounded-3xl border border-border bg-card" />}>
          <InternshipApplyForm positions={positions} />
        </Suspense>
      </div>
    </div>
  );
}
