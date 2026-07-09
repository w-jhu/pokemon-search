import { PokemonCard } from "@/types/pokemon";
import { SearchFilters } from "@/data/filterOptions";

export async function searchCards(
  query: string,
  filters: SearchFilters = { rarity: "", setName: "" }
): Promise<PokemonCard[]> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      rarity: filters.rarity || undefined,
      setName: filters.setName || undefined,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Search request failed."
    );
  }

  const data = await response.json();
  return data.cards ?? [];
}
