"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { getHtmlContent, isHtmlLike, stripHtmlToText } from "@/lib/content-normalizers";

/* Read-only render of a rich-text field.
 *
 * The API returns these either as an HTML string or as `{ html: "..." }`
 * depending on the field, which is why every read goes through the existing
 * `getHtmlContent` — a `typeof value === "string"` guard silently drops the
 * object form, which is what was happening to Program descriptions.
 *
 * Sanitised because this is admin-authored HTML being rendered into the
 * admin's own session. Neither repo had a sanitiser before; the landing pages
 * still use raw dangerouslySetInnerHTML, which is a separate hole worth
 * closing but not one to widen here.
 *
 * Client-only on purpose. `isomorphic-dompurify` was the obvious pick and is
 * the wrong one here: it pulls jsdom into the server bundle, and jsdom reads
 * `.next/browser/default-stylesheet.css` at import time — a file this Next
 * build never emits. That threw during SSR of every page importing this
 * component, so React silently abandoned the server render and fell back to
 * client rendering for the whole route.
 *
 * Plain `dompurify` needs a real DOM, so sanitising waits for mount and the
 * server renders the stripped text. These only ever appear inside slideouts
 * the user has to open, so there is nothing to flash. */
export function RichText({
  value,
  className,
}: {
  value: string | { html?: unknown } | null | undefined;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const html = getHtmlContent(value);
  if (!html) {
    return <p className="m-0 text-xs text-muted-foreground">—</p>;
  }

  /* Plain text that merely happens to live in a rich-text field — don't wrap
     it in prose styling it doesn't need. Also the pre-mount rendering for
     genuine HTML, so the markup never reaches the DOM unsanitised. */
  if (!mounted || !isHtmlLike(value)) {
    return (
      <p className="m-0 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
        {stripHtmlToText(value)}
      </p>
    );
  }

  return (
    <div
      className={className ?? "admin-rich"}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(softenNbsp(html), { USE_PROFILES: { html: true } }),
      }}
    />
  );
}

/* The authored content is riddled with &nbsp; — one between nearly every word,
 * the signature of a paste out of Word or Google Docs. A non-breaking space is
 * by definition NOT a line-break opportunity, so a whole sentence becomes one
 * unbreakable "word" and the browser is forced to snap it mid-word
 * ("competitive st | andard"). It looks like a CSS bug and isn't.
 *
 * Collapsing them to ordinary spaces restores normal wrapping. This only
 * affects display — the stored content is untouched, and a genuinely intended
 * NBSP (say "10 km") loses nothing a reader would notice at this density.
 */
function softenNbsp(html: string): string {
  /* Written as an escape, not a literal: a raw NBSP in source is invisible,
     and the next person to tidy this file turns it into an ordinary space and
     silently makes the second replace a no-op. */
  return html.replace(/&nbsp;/gi, " ").replace(/\u00A0/g, " ");
}
