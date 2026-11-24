"use client";

import { useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import { AdminButton } from "@/components/admin/admin-ui";
import { useUploadProgramBrochure } from "@/features/admin/hooks";
import { fileNameFromUrl, normalizeMediaUrl } from "@/lib/media";

/* A program's brochure: one PDF, on its own endpoint
 * (POST /v1/program/{id}/brochure/upload, field `brochure`). Like the
 * testimonial video it writes immediately, not on form save, and a second
 * upload replaces the first — so "Replace" is always offered, whether or not
 * a brochure is already attached. */

const MAX_BYTES = 20 * 1024 * 1024;

export function BrochureField({ programId, url }: { programId?: number; url?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadProgramBrochure();
  const [error, setError] = useState<string | null>(null);
  // The form's `program` is the row it opened with; after an upload, show
  // the new file rather than the old one.
  const [latest, setLatest] = useState<string | null>(null);
  const current = normalizeMediaUrl(latest ?? url);

  if (!programId) {
    return (
      <p className="m-0 rounded-md bg-muted/50 p-3 text-[11.5px] leading-relaxed text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
        Save the program first — the brochure uploads against its id, so there
        is nothing to attach it to yet.
      </p>
    );
  }

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That PDF is over 20 MB.");
      return;
    }
    setError(null);
    upload.mutate(
      { id: programId, file },
      { onSuccess: response => setLatest(response.data?.url ?? response.data?.program?.brochure_url ?? null) },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          // Cleared so choosing the same file again still fires a change.
          e.target.value = "";
          pick(file);
        }}
      />

      <div className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2.5 py-2 shadow-[0_0_0_1px_var(--edge)]">
        {current ? (
          <a
            href={current}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-2 text-[12px] text-foreground hover:text-brand-text"
          >
            <FileText className="size-3.5 shrink-0 text-brand-text" />
            <span className="min-w-0 truncate font-mono text-[10.5px]">{fileNameFromUrl(current)}</span>
          </a>
        ) : (
          <span className="text-[11.5px] text-muted-foreground">No brochure attached</span>
        )}
        <AdminButton
          variant={current ? "outline" : "primary"}
          size="sm"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-3" />
          {upload.isPending ? "Uploading…" : current ? "Replace" : "Upload"}
        </AdminButton>
      </div>

      {error && <p className="m-0 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
