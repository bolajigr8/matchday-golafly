"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, FileText, ImageOff, Plus, X } from "lucide-react";
import { fileNameFromUrl, isVideoUrl, normalizeMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/* Media display for the admin.
 *
 * Plain <img>, not next/image: these are arbitrary API-hosted URLs that may
 * 404 or redirect, and next/image turns a broken remote image into a build-time
 * style error rather than a visible "this image is missing" state — which is
 * exactly the information an admin needs.
 *
 * Every URL goes through normalizeMediaUrl first; see lib/media.ts.
 */

export function MediaThumb({
  url,
  label,
  ratio = "video",
}: {
  url?: string | null;
  label: string;
  ratio?: "video" | "square";
}) {
  const src = normalizeMediaUrl(url);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {src ? (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col gap-1.5"
          title="Open full size"
        >
          <span
            className={cn(
              "relative block overflow-hidden rounded-md bg-muted shadow-[0_0_0_1px_var(--edge)]",
              ratio === "square" ? "aspect-square w-24" : "aspect-video w-full",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={label} className="size-full object-cover" loading="lazy" />
          </span>
          <span className="flex items-center gap-1 truncate font-mono text-[10px] text-muted-foreground group-hover:text-brand-text">
            <ExternalLink className="size-2.5 shrink-0" />
            {fileNameFromUrl(src)}
          </span>
        </a>
      ) : (
        <Missing />
      )}
    </div>
  );
}

/* Gallery / testimonials.
 *
 * Editable when handed `onAdd`. Both have real endpoints, so read-only was
 * simply wrong:
 *   - program gallery      → files appended as `gallery[]` on create/update
 *   - program testimonials → POST /v1/program/{id}/testimonials/upload,
 *                            DELETE /v1/program/{id}/testimonials  body {url}
 *   - academy images       → `images[i][file]` inline on update
 *
 * Testimonials accept video as well as images, which is why `accept` is a
 * prop. Staged files preview locally until save.
 *
 * Reorder and set-primary genuinely have no endpoint on any of the three, so
 * those are the only things still absent. */
export function MediaGallery({
  urls,
  label,
  onAdd,
  onRemove,
  accept = "image/*",
}: {
  urls?: (string | null)[] | null;
  label: string;
  onAdd?: (files: File[]) => void;
  onRemove?: (url: string) => void;
  accept?: string;
}) {
  const stored = (urls ?? []).map(normalizeMediaUrl).filter(Boolean);
  const [preview, setPreview] = useState<string | null>(null);
  const [staged, setStaged] = useState<{ url: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const editable = !!onAdd;

  useEffect(
    () => () => staged.forEach(s => URL.revokeObjectURL(s.url)),
    [staged],
  );

  const items = [...stored, ...staged.map(s => s.url)];
  const isStaged = (src: string) => staged.some(s => s.url === src);

  const addFiles = (files: File[]) => {
    if (!files.length) return;
    setStaged(prev => [
      ...prev,
      ...files.map(f => ({ url: URL.createObjectURL(f), name: f.name })),
    ]);
    onAdd?.(files);
  };

  const drop = (src: string) => {
    if (isStaged(src)) {
      URL.revokeObjectURL(src);
      setStaged(prev => prev.filter(s => s.url !== src));
      return;
    }
    onRemove?.(src);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {items.length > 0 && <span className="ml-1.5 tabular-nums">· {items.length}</span>}
      </span>

      {items.length === 0 && !editable ? (
        <Missing />
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {items.map(src => (
            <span key={src} className="group relative block">
              <button
                type="button"
                onClick={() => setPreview(src)}
                className="relative block aspect-square w-full overflow-hidden rounded-md bg-muted shadow-[0_0_0_1px_var(--edge)] transition-shadow hover:shadow-[0_0_0_1px_var(--brand-edge)]"
              >
                {/* Testimonials mix images and video with no type field — sniff
                    the extension, same as the old dashboard. */}
                {isVideoUrl(src) ? (
                  <video src={src} className="size-full object-cover" muted playsInline />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="size-full object-cover" loading="lazy" />
                )}
              </button>
              {editable && (onRemove || isStaged(src)) && (
                <button
                  type="button"
                  onClick={() => drop(src)}
                  aria-label="Remove"
                  className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="size-2.5" />
                </button>
              )}
              {isStaged(src) && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-brand/90 py-px text-center font-mono text-[8px] font-semibold uppercase tracking-wide text-brand-contrast">
                  New
                </span>
              )}
            </span>
          ))}

          {editable && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label={`Add to ${label}`}
              className="flex aspect-square items-center justify-center rounded-md border border-dashed border-[var(--edge)] text-muted-foreground transition-colors hover:border-[var(--brand-edge)] hover:text-brand-text"
            >
              <Plus className="size-4" />
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                className="hidden"
                onChange={e => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
            </button>
          )}
        </div>
      )}

      {preview && (
        <>
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setPreview(null)}
            className="fixed inset-0 z-[60] bg-foreground/60"
          />
          <div className="pointer-events-none fixed inset-0 z-[61] flex items-center justify-center p-8">
            {isVideoUrl(preview) ? (
              <video src={preview} controls autoPlay className="pointer-events-auto max-h-full max-w-full rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="max-h-full max-w-full rounded-lg" />
            )}
            <button
              type="button"
              onClick={() => setPreview(null)}
              aria-label="Close preview"
              className="pointer-events-auto absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-card text-foreground shadow-[0_0_0_1px_var(--edge)]"
            >
              <X className="size-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** A document link — PDFs, CVs, portfolios. */
export function FileLink({ url, name }: { url?: string | null; name?: string }) {
  const src = normalizeMediaUrl(url);
  if (!src) return <Missing />;

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-md bg-background p-2.5 text-[11.5px] shadow-[0_0_0_1px_var(--edge)] transition-colors hover:text-brand-text"
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate">{name || fileNameFromUrl(src)}</span>
      <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
    </a>
  );
}

function Missing() {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2.5 py-2 text-[11px] text-muted-foreground shadow-[0_0_0_1px_var(--edge)]">
      <ImageOff className="size-3" />
      Not set
    </span>
  );
}
