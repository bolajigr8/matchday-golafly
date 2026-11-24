"use client";

import { SheetShell } from "@/components/admin/sheet-shell";

/* Read-only view of a row. Renders through the shared SheetShell, so it is
   pixel-identical to the form sheet apart from its contents.

   View and edit are different jobs and must stay different sheets: a form is
   an invitation to change something, and opening one when the user asked to
   look is how accidental edits happen. */

interface DetailSheetProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tabs?: { label: string; active?: boolean; onSelect?: () => void }[];
}

export function DetailSheet(props: DetailSheetProps) {
  return <SheetShell {...props} />;
}

export { SheetSection, SheetFacts } from "@/components/admin/sheet-shell";
