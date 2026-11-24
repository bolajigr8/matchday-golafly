"use client";

import React from "react";

export default function WhatsIncluded({ features }: { features: any[] }) {
  return (
    <div className="mt-24 transition-colors duration-300">
      <p className="text-[#a3ff00] text-[10px] font-black uppercase tracking-[0.4em] mb-4">
        {"What's Included"}
      </p>

      <h2 className="text-3xl lg:text-5xl font-black mb-10 text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight">
        Everything Taken <br className="hidden md:block" /> Care Of
      </h2>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl">
        {features.map((item: any, idx: number) => (
          <div
            key={idx}
            className="rounded-[32px] border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-950 p-8 hover:border-[#a3ff00]/40 transition-all duration-500 group shadow-sm dark:shadow-none"
          >
            {/* Feature Icon with specialized background */}
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#a3ff00]/10 border border-zinc-200 dark:border-[#a3ff00]/20 flex items-center justify-center text-zinc-900 dark:text-[#a3ff00] text-xl mb-6 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>

            <h3 className="font-black text-lg mb-3 text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
              {item.title}
            </h3>

            <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 font-medium">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
