"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { searchCards, SearchMeta } from "@/lib/api";
import { LayoutDensity, PokemonCard } from "@/types/pokemon";
import { EMPTY_FILTERS, SearchFilters } from "@/data/filterOptions";
import { isDebugMode } from "@/lib/appMode";
import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import CardGrid from "./CardGrid";
import CardModal from "./CardModal";
import CardZoom from "./CardZoom";
import AboutModal from "./AboutModal";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";
import DebugBadge from "./DebugBadge";

const PAGE_SIZE = 12;
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export default function HomePage() {
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [useLlmFilter, setUseLlmFilter] = useState(false);
  const [results, setResults] = useState<PokemonCard[]>([]);
  const [searchMeta, setSearchMeta] = useState<SearchMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [layout, setLayout] = useState<LayoutDensity>("grid");
  const [selectedCard, setSelectedCard] = useState<PokemonCard | null>(null);
  const [zoomedCard, setZoomedCard] = useState<PokemonCard | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Guests cannot use AI filter — force off when signed out
  useEffect(() => {
    if (!isSignedIn && useLlmFilter) {
      setUseLlmFilter(false);
    }
  }, [isSignedIn, useLlmFilter]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageCards = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return results.slice(start, start + PAGE_SIZE);
  }, [results, page]);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef(filters);
  const llmRef = useRef(useLlmFilter);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  useEffect(() => {
    llmRef.current = useLlmFilter;
  }, [useLlmFilter]);

  const runSearch = useCallback(
    async (
      searchQuery: string,
      searchFilters: SearchFilters,
      llmEnabled: boolean
    ) => {
      const trimmed = searchQuery.trim();
      const hasFilters =
        searchFilters.rarities.length > 0 || searchFilters.sets.length > 0;
      const isBrowse = trimmed.length < MIN_QUERY_LENGTH;
      // Nothing to do without either enough text or an active filter
      if (isBrowse && !hasFilters) return;

      // Cancel any in-flight request so stale responses can't overwrite newer ones
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      setPage(1);

      try {
        const { cards, meta } = await searchCards(
          isBrowse ? "" : trimmed,
          searchFilters,
          isBrowse ? false : llmEnabled,
          controller.signal
        );
        if (controller.signal.aborted) return;
        setResults(cards);
        setSearchMeta(meta ?? null);
        setFadeKey((k) => k + 1);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
        setSearchMeta(null);
        setError(err instanceof Error ? err.message : "Search failed.");
      } finally {
        if (abortRef.current === controller) {
          setIsLoading(false);
          abortRef.current = null;
        }
      }
    },
    []
  );

  // Live search as you type and browse-on-filter — both debounced.
  // Base results only; the AI filter applies on submit (Enter).
  useEffect(() => {
    const trimmed = query.trim();
    const hasFilters = filters.rarities.length > 0 || filters.sets.length > 0;

    if (trimmed.length < MIN_QUERY_LENGTH && !hasFilters) {
      // No text and no filters → return to the initial state
      abortRef.current?.abort();
      abortRef.current = null;
      setResults([]);
      setSearchMeta(null);
      setError(null);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    const id = setTimeout(() => {
      runSearch(query, filters, false);
    }, DEBOUNCE_MS);
    debounceRef.current = id;
    return () => clearTimeout(id);
  }, [query, filters, runSearch]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      runSearch(searchQuery, filtersRef.current, llmRef.current);
    },
    [runSearch]
  );

  const handleFiltersChange = useCallback((nextFilters: SearchFilters) => {
    // The debounced effect above re-runs the search when filters change.
    setFilters(nextFilters);
  }, []);

  const handleLlmFilterChange = useCallback(
    (enabled: boolean) => {
      if (!isSignedIn && enabled) return;
      setUseLlmFilter(enabled);
      if (query.trim().length >= MIN_QUERY_LENGTH) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        runSearch(query, filtersRef.current, enabled);
      }
    },
    [runSearch, query, isSignedIn]
  );

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
    setFadeKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const showEmpty =
    !isLoading && hasSearched && results.length === 0 && !error;

  const activeFilterLabels = [
    filters.rarities.length > 0 &&
      `${filters.rarities.length} ${filters.rarities.length === 1 ? "rarity" : "rarities"}`,
    filters.sets.length > 0 &&
      `${filters.sets.length} ${filters.sets.length === 1 ? "set" : "sets"}`,
  ].filter(Boolean);

  const rangeStart = results.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, results.length);
  const showDebugMeta = isDebugMode();

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
            filters={filters}
            onFiltersChange={handleFiltersChange}
            useLlmFilter={useLlmFilter}
            onLlmFilterChange={handleLlmFilterChange}
            isLoading={isLoading}
            inputRef={searchInputRef}
          />

          <section className="px-6 pb-20">
            {error && (
              <p className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}

            {!isLoading && hasSearched && (results.length > 0 || (showDebugMeta && searchMeta)) && (
              <div className="mb-6 space-y-2">
                {results.length > 0 ? (
                  <p className="text-sm text-white/40">
                    {`${results.length} ${results.length === 1 ? "result" : "results"}`}
                    {query.trim()
                      ? ` for “${query}”`
                      : searchMeta?.browse
                        ? " · browsing"
                        : ""}
                    {totalPages > 1 && (
                      <span className="text-white/25">
                        {` · showing ${rangeStart}–${rangeEnd}`}
                      </span>
                    )}
                    {activeFilterLabels.length > 0 && (
                      <span className="text-white/25">
                        {` · filtered by ${activeFilterLabels.join(", ")}`}
                      </span>
                    )}
                  </p>
                ) : null}
                {showDebugMeta && searchMeta && (
                  <p className="font-mono text-[11px] tracking-wide text-white/30">
                    {searchMeta.llmEnabled === false
                      ? `debug · pinecone ${searchMeta.retrieved} · AI filter off · showing ${searchMeta.kept}`
                      : `debug · pinecone ${searchMeta.retrieved} · sent to LLM ${searchMeta.candidates} (score > ${searchMeta.minScore}${searchMeta.toppedUp ? ", topped up to 12" : ""}) · kept ${searchMeta.kept}${!searchMeta.filtered ? " · LLM fallback" : ""}`}
                  </p>
                )}
              </div>
            )}

            {isLoading ? (
              <LoadingSkeleton layout={layout} count={12} />
            ) : showEmpty ? (
              <EmptyState query={query} />
            ) : hasSearched && results.length > 0 ? (
              <div key={fadeKey} className="animate-in fade-in duration-500">
                <CardGrid
                  cards={pageCards}
                  layout={layout}
                  onInfoClick={setSelectedCard}
                  onZoomClick={setZoomedCard}
                />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : null}
          </section>
        </main>
      </div>

      <CardModal card={selectedCard} onClose={() => setSelectedCard(null)} />
      <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <DebugBadge />
    </div>
  );
}
