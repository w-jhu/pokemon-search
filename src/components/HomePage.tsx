"use client";

import { useCallback, useRef, useState } from "react";
import { mockCards } from "@/data/mockCards";
import { searchCards, simulateSearchDelay } from "@/lib/search";
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
  const [results, setResults] = useState<PokemonCard[]>(mockCards);
  const [isLoading, setIsLoading] = useState(false);
  const [layout, setLayout] = useState<LayoutDensity>("grid");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const executeSearch = useCallback(async (searchQuery: string) => {
    setIsLoading(true);
    await simulateSearchDelay();
    const filtered = searchCards(mockCards, searchQuery);
    setResults(filtered);
    setFadeKey((k) => k + 1);
    setIsLoading(false);
  }, []);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      executeSearch(searchQuery);
    },
    [executeSearch]
  );

  const showEmpty = !isLoading && query.trim() !== "" && results.length === 0;

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
            inputRef={searchInputRef}
          />

          <section className="px-6 pb-20">
            {!isLoading && query.trim() !== "" && results.length > 0 && (
              <p className="mb-6 text-sm text-white/40">
                {results.length} result{results.length !== 1 ? "s" : ""} for
                &ldquo;{query}&rdquo;
              </p>
            )}

            {isLoading ? (
              <LoadingSkeleton layout={layout} />
            ) : showEmpty ? (
              <EmptyState query={query} />
            ) : (
              <div
                key={fadeKey}
                className="animate-in fade-in duration-500"
              >
                <CardGrid
                  cards={results}
                  layout={layout}
                  onInfoClick={setSelectedCard}
                />
              </div>
            )}
          </section>
        </main>
      </div>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
