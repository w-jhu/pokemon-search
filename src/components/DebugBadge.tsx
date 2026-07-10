"use client";

import { isDebugMode } from "@/lib/appMode";

export default function DebugBadge() {
  if (!isDebugMode()) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[100]">
      <span className="rounded-md border border-amber-400/30 bg-amber-500/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-200/90 backdrop-blur-md">
        Debug
      </span>
    </div>
  );
}
