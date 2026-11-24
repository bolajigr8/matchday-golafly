"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2, Video } from "lucide-react";
import { AdminButton } from "@/components/admin/admin-ui";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  useDeleteProgramTestimonialVideo,
  useUploadProgramTestimonialVideo,
} from "@/features/admin/hooks";
import { fileNameFromUrl, normalizeMediaUrl } from "@/lib/media";

/* A program has exactly ONE testimonial video.
 *
 * This is deliberately not a MediaGallery: the API field is a single
 * `testimonial_video_url` string, the upload takes one file under `video`,
 * and a second upload replaces the first rather than appending. Presenting it
 * as a gallery with a `+` would promise an "add another" that silently
 * overwrites.
 *
 * Both writes are live — verified end to end against production. They act
 * immediately rather than on form save, because they are their own endpoints
 * and do not travel with the program payload. */
export function TestimonialVideoField({
  programId,
  url,
}: {
  /* Absent on create — there is no id to upload against until the program
     exists, so the control explains itself rather than failing on click. */
  programId?: number;
  url?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [staged, setStaged] = useState<{ url: string; name: string; file: File } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const upload = useUploadProgramTestimonialVideo();
  const remove = useDeleteProgramTestimonialVideo();
  const busy = upload.isPending || remove.isPending;

  useEffect(() => () => { if (staged) URL.revokeObjectURL(staged.url); }, [staged]);

  const current = normalizeMediaUrl(url);

  const clearStaged = () => {
    if (staged) URL.revokeObjectURL(staged.url);
    setStaged(null);
  };

  if (!programId) {
    return (
      <p className="m-0 rounded-md bg-muted/50 p-3 text-[11.5px] leading-relaxed text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
        Save the program first — the video uploads against its id, so there is
        nothing to attach it to yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          clearStaged();
          setStaged({ url: URL.createObjectURL(file), name: file.name, file });
        }}
      />

      {staged ? (
        <>
          <div className="overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_var(--brand-edge)]">
            <video src={staged.url} controls preload="metadata" playsInline className="w-full" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-mono text-[10.5px] text-brand-text">
              {staged.name}
            </span>
            <div className="flex shrink-0 gap-2">
              <AdminButton variant="ghost" size="sm" onClick={clearStaged} disabled={busy}>
                Cancel
              </AdminButton>
              <AdminButton
                size="sm"
                disabled={busy}
                onClick={() =>
                  upload.mutate(
                    { id: programId, file: staged.file },
                    { onSuccess: clearStaged },
                  )
                }
              >
                {upload.isPending ? "Uploading…" : current ? "Replace" : "Upload"}
              </AdminButton>
            </div>
          </div>
        </>
      ) : current ? (
        <>
          <div className="overflow-hidden rounded-md bg-black shadow-[0_0_0_1px_var(--edge)]">
            <video key={current} src={current} controls preload="metadata" playsInline className="w-full" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <a
              href={current}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate font-mono text-[10.5px] text-muted-foreground hover:text-brand-text"
            >
              {fileNameFromUrl(current)}
            </a>
            <div className="flex shrink-0 gap-2">
              <AdminButton
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
              >
                Replace
              </AdminButton>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRemove(true)}
                disabled={busy}
              >
                <Trash2 className="size-3" />
                Remove
              </AdminButton>
            </div>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--edge)] p-6 text-muted-foreground transition-colors hover:border-[var(--brand-edge)] hover:text-brand-text disabled:opacity-50"
        >
          <Video className="size-5" />
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em]">
            Select a video
          </span>
        </button>
      )}

      <span className="text-[10.5px] text-muted-foreground">
        Videos only, one per program. Uploading replaces the current video, and
        both actions save immediately.
      </span>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove the testimonial video?"
          body="It will stop showing on the public program page. This cannot be undone."
          confirmLabel={remove.isPending ? "Removing…" : "Remove video"}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => {
            remove.mutate(programId, { onSuccess: () => setConfirmRemove(false) });
          }}
        />
      )}
    </div>
  );
}
