"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  query: string;
}

export default function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
        <SearchX className="h-7 w-7 text-white/30" />
      </div>
      <h3 className="text-lg font-medium text-white/70">No cards found</h3>
      <p className="mt-2 max-w-sm text-sm text-white/40">
        No illustrations matched &ldquo;{query}&rdquo;. Try describing colors,
        art styles, hidden details, or moods.
      </p>
    </div>
  );
}
