"use client";

import { useState } from "react";
import { Link2, Check, Heart } from "lucide-react";
import { IconFacebook, IconTwitter } from "@/components/social-icons";

export function ShareRow({ title, likes }: { title: string; likes: number }) {
  const [copied, setCopied] = useState(false);

  const share = (network: "facebook" | "twitter") => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const href =
      network === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${url}`
        : `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const btn =
    "flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary";

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => share("facebook")} aria-label="Share on Facebook" className={btn}>
        <IconFacebook className="size-4" />
      </button>
      <button type="button" onClick={() => share("twitter")} aria-label="Share on X" className={btn}>
        <IconTwitter className="size-4" />
      </button>
      <button type="button" onClick={copy} aria-label="Copy link" className={btn}>
        {copied ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
      </button>
      <span className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground">
        <Heart className="size-3.5 text-primary" />
        {likes}
      </span>
    </div>
  );
}
