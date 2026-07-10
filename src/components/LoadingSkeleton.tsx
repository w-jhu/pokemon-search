"use client";

import { LayoutDensity } from "@/types/pokemon";

interface LoadingSkeletonProps {
  layout: LayoutDensity;
  count?: number;
}

export default function LoadingSkeleton({
  layout,
  count = 10,
}: LoadingSkeletonProps) {
  const isList = layout === "list";

  return (
    <div
      className={
        isList
          ? "flex flex-col gap-4"
          : "grid grid-cols-2 gap-6 md:grid-cols-4 xl:grid-cols-6"
      }
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse overflow-hidden rounded-2xl border border-white/5 bg-white/5 ${
            isList ? "flex gap-4 p-3" : ""
          }`}
        >
          <div
            className={`bg-white/10 ${
              isList
                ? "h-28 w-20 shrink-0 rounded-xl"
                : "aspect-[2.5/3.5] w-full"
            }`}
          />
          {isList && (
            <div className="flex flex-1 flex-col justify-center gap-2 py-2">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-3 w-32 rounded bg-white/5" />
              <div className="h-3 w-16 rounded bg-white/5" />
            </div>
          )}
          {!isList && (
            <div className="space-y-2 p-4">
              <div className="h-4 w-20 rounded bg-white/10" />
              <div className="h-3 w-28 rounded bg-white/5" />
              <div className="h-3 w-14 rounded bg-white/5" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
