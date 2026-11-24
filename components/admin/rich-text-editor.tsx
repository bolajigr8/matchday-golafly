"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

/* Quill, dynamically imported with ssr:false — it touches `document` at module
   scope and will crash a server render otherwise.
 *
 * Toolbar and formats are deliberately IDENTICAL to the old dashboard's
 * editor. The existing content was authored with exactly this configuration,
 * so anything wider risks Quill normalising markup it was never given
 * permission to produce, and anything narrower silently strips tags on the
 * first save. No image button: images never went through Quill. */
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-[220px] animate-pulse rounded-md bg-muted shadow-[0_0_0_1px_var(--edge)]" />
  ),
});

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote"],
  ["link"],
  ["clean"],
];

const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "blockquote",
  "link",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  minHeight = 220,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const modules = useMemo(() => ({ toolbar: TOOLBAR }), []);
  const formats = useMemo(() => FORMATS, []);

  return (
    <div className="admin-quill" style={{ ["--quill-min" as string]: `${minHeight}px` }}>
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
