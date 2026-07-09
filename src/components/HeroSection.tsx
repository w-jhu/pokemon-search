"use client";

import SearchBar from "./SearchBar";
import SearchFiltersBar from "./SearchFiltersBar";
import { sampleSearches } from "@/data/mockCards";
import { SearchFilters } from "@/data/filterOptions";

interface HeroSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function HeroSection({
  query,
  onQueryChange,
  onSearch,
  filters,
  onFiltersChange,
  isLoading = false,
  inputRef,
}: HeroSectionProps) {
  return (
    <section className="flex flex-col items-center px-6 pb-12 pt-16 text-center">
      <p className="mb-8 max-w-md text-sm leading-relaxed text-white/50 md:text-base">
        Search the hidden details within Pokémon card illustrations.
      </p>

      <SearchBar
        value={query}
        onChange={onQueryChange}
        onSearch={onSearch}
        isLoading={isLoading}
        inputRef={inputRef}
      />

      <SearchFiltersBar
        filters={filters}
        onChange={onFiltersChange}
        disabled={isLoading}
      />

      <div className="mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2">
        {sampleSearches.map((sample) => (
          <button
            key={sample}
            type="button"
            disabled={isLoading}
            onClick={() => {
              onQueryChange(sample);
              onSearch(sample);
            }}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/50 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sample}
          </button>
        ))}
      </div>
    </section>
  );
}
