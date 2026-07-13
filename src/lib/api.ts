import { PokemonCard } from "@/types/pokemon";
import { SearchFilters } from "@/data/filterOptions";

export interface SearchMeta {
  retrieved: number;
  candidates: number;
  kept: number;
  filtered: boolean;
  minScore: number;
  toppedUp?: boolean;
  llmEnabled?: boolean;
  browse?: boolean;
}

export interface SearchResponse {
  cards: PokemonCard[];
  meta?: SearchMeta;
}

export async function searchCards(
  query: string,
  filters: SearchFilters = { rarities: [], sets: [] },
  useLlmFilter = false,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      query,
      rarities: filters.rarities,
      sets: filters.sets,
      useLlmFilter,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Search request failed."
    );
  }

  const data = await response.json();
  return {
    cards: data.cards ?? [],
    meta: data.meta,
  };
}
