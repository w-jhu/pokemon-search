"use client";

import { useCallback, useRef, useState } from "react";
import { searchCards } from "@/lib/api";
import { LayoutDensity, PokemonCard } from "@/types/pokemon";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import CardGrid from "./CardGrid";
import CardModal from "./CardModal";
import AboutModal from "./AboutModal";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [layout, setLayout] = useState<LayoutDensity>("grid");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const executeSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const cards = await searchCards(trimmed);
      setResults(cards);
      setFadeKey((k) => k + 1);
    } catch (err) {
      setResults([]);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      executeSearch(searchQuery);
    },
    [executeSearch]
  );

  const showEmpty =
    !isLoading && hasSearched && query.trim() !== "" && results.length === 0 && !error;

  return (
    <div className="relative min-h-screen">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-zinc-900 via-neutral-900 to-zinc-950" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(120,120,140,0.08)_0%,_transparent_60%)]" />
      <div className="pointer-events-none fixed left-1/4 top-1/3 h-96 w-96 rounded-full bg-white/[0.02] blur-3xl" />
      <div className="pointer-events-none fixed bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-white/[0.015] blur-3xl" />

      <div className="relative z-10">
        <Navbar
          layout={layout}
          onLayoutChange={setLayout}
          onAboutOpen={() => setAboutOpen(true)}
        />

        <main className="mx-auto max-w-7xl">
          <HeroSection
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
            inputRef={searchInputRef}
          />

          <section className="px-6 pb-20">
            {error && (
              <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {!isLoading && hasSearched && results.length > 0 && (
              <p className="mb-6 text-sm text-white/40">
                {results.length} result{results.length !== 1 ? "s" : ""} for
                &ldquo;{query}&rdquo;
              </p>
            )}

            {isLoading ? (
              <LoadingSkeleton layout={layout} count={12} />
            ) : showEmpty ? (
              <EmptyState query={query} />
            ) : hasSearched && results.length > 0 ? (
              <div key={fadeKey} className="animate-in fade-in duration-500">
                <CardGrid
                  cards={results}
                  layout={layout}
                  onInfoClick={setSelectedCard}
                />
              </div>
            ) : null}
          </section>
        </main>
      </div>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
