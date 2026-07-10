"use client";

import { useSession } from "next-auth/react";
import SearchBar from "./SearchBar";
import SearchFiltersBar from "./SearchFiltersBar";
import { SearchFilters } from "@/data/filterOptions";

interface HeroSectionProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  useLlmFilter: boolean;
  onLlmFilterChange: (enabled: boolean) => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export default function HeroSection({
  query,
  onQueryChange,
  onSearch,
  filters,
  onFiltersChange,
  useLlmFilter,
  onLlmFilterChange,
  isLoading = false,
  inputRef,
}: HeroSectionProps) {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  return (
    <section className="flex flex-col items-center px-6 pb-12 pt-16 text-center">
      <p className="mb-8 max-w-md text-sm leading-relaxed text-white/50 md:text-base">
        Find the card you&apos;re looking for.
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
        useLlmFilter={useLlmFilter}
        onLlmFilterChange={onLlmFilterChange}
        isSignedIn={isSignedIn}
        disabled={isLoading}
      />
    </section>
  );
}
